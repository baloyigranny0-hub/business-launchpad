from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
from collections import defaultdict, deque
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx

from agents import AGENTS, get_agent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
OPENROUTER_FALLBACKS = [
    OPENROUTER_MODEL,                              # primary (user-chosen Gemma 4)
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "z-ai/glm-4.5-air:free",
    "minimax/minimax-m2.5:free",
    "tencent/hy3-preview:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "deepseek/deepseek-chat-v3.1:free",
    "qwen/qwen3-coder:free",
    "openrouter/auto",                             # last-ditch auto router
]
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Optional Ollama provider (self-hosted or Ollama Cloud). Only used if OLLAMA_BASE_URL is set.
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "").rstrip("/")
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "")
# Comma-separated list, e.g. "llama3.2:3b,nemotron3:33b,deepseek-v4-pro:cloud,gpt-oss:20b,qwen3:14b"
OLLAMA_MODELS = [m.strip() for m in os.environ.get("OLLAMA_MODELS", "").split(",") if m.strip()]

app = FastAPI(title="Foundry API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ------------------------- Models -------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    business_name: str
    industry: str
    country: str = "Global"
    stage: str = "idea"  # idea, registered, operating, scaling
    idea: str = ""
    target_customer: str = ""
    # Diagnostic intake (drives the Journey)
    is_registered: str = "no"   # yes | no | unsure
    knowledge_level: str = "beginner"  # beginner | intermediate | expert
    biggest_blocker: str = ""
    created_at: str = Field(default_factory=now_iso)


class ProfileCreate(BaseModel):
    session_id: str
    business_name: str
    industry: str
    country: str = "Global"
    stage: str = "idea"
    idea: str = ""
    target_customer: str = ""
    is_registered: str = "no"
    knowledge_level: str = "beginner"
    biggest_blocker: str = ""


class ChatMessage(BaseModel):
    role: str  # user | assistant | system
    content: str


class AgentChatRequest(BaseModel):
    session_id: str
    agent: str = "general"
    messages: List[ChatMessage]
    profile: Optional[Dict[str, Any]] = None


class AgentChatResponse(BaseModel):
    reply: str
    agent: str
    model: str


class GenerateRequest(BaseModel):
    session_id: str
    agent: str
    prompt: str
    profile: Optional[Dict[str, Any]] = None


class VaultDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    title: str
    agent: str
    content: str
    created_at: str = Field(default_factory=now_iso)


class VaultDocCreate(BaseModel):
    session_id: str
    title: str
    agent: str
    content: str


class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    title: str
    room: str  # legal, brand, ops, marketing, etc
    done: bool = False
    created_at: str = Field(default_factory=now_iso)


class TaskCreate(BaseModel):
    session_id: str
    title: str
    room: str


class TaskUpdate(BaseModel):
    done: bool


# ------------------------- AI provider chain -------------------------
async def _try_openrouter(ac: httpx.AsyncClient, messages, temperature: float):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://foundry.app",
        "X-Title": "Foundry",
    }
    last_err = None
    for model in OPENROUTER_FALLBACKS:
        payload = {"model": model, "messages": messages, "temperature": temperature}
        try:
            r = await ac.post(OPENROUTER_URL, headers=headers, json=payload, timeout=45.0)
        except Exception as e:
            last_err = f"{model} network: {e}"
            continue
        if r.status_code == 200:
            try:
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                if content and content.strip():
                    return content, model
                last_err = f"{model} empty"
            except (KeyError, IndexError, ValueError):
                last_err = f"malformed response from {model}"
        elif r.status_code in (401, 403):
            # Bad key / forbidden: don't burn the rest of the chain on the same key
            return None, f"openrouter_auth:{r.status_code}"
        else:
            last_err = f"{model} -> {r.status_code}: {r.text[:120]}"
            logger.warning(f"OpenRouter fallback: {last_err}")
    return None, last_err or "openrouter_all_failed"


async def _try_ollama(ac: httpx.AsyncClient, messages, temperature: float):
    if not OLLAMA_BASE_URL or not OLLAMA_MODELS:
        return None, "ollama_disabled"
    headers = {"Content-Type": "application/json"}
    if OLLAMA_API_KEY:
        headers["Authorization"] = f"Bearer {OLLAMA_API_KEY}"
    last_err = None
    # Use Ollama's OpenAI-compatible endpoint for unified payload shape
    url = f"{OLLAMA_BASE_URL}/v1/chat/completions"
    for model in OLLAMA_MODELS:
        payload = {"model": model, "messages": messages, "temperature": temperature, "stream": False}
        try:
            r = await ac.post(url, headers=headers, json=payload, timeout=60.0)
        except Exception as e:
            last_err = f"ollama:{model} net: {e}"
            continue
        if r.status_code == 200:
            try:
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                if content and content.strip():
                    return content, f"ollama/{model}"
            except (KeyError, IndexError, ValueError):
                last_err = f"ollama:{model} malformed"
        else:
            last_err = f"ollama:{model} -> {r.status_code}: {r.text[:120]}"
            logger.warning(last_err)
    return None, last_err or "ollama_all_failed"


async def call_ai(messages: List[Dict[str, str]], temperature: float = 0.7) -> tuple[str, str]:
    """Try OpenRouter free chain; fall back to Ollama if configured."""
    async with httpx.AsyncClient() as ac:
        content, info = await _try_openrouter(ac, messages, temperature)
        if content:
            return content, info
        # If auth failed, don't bother retrying OpenRouter elsewhere; try Ollama if set
        ocontent, oinfo = await _try_ollama(ac, messages, temperature)
        if ocontent:
            return ocontent, oinfo
        raise HTTPException(
            status_code=502,
            detail=f"All free models busy or unavailable. openrouter={info} ollama={oinfo}",
        )


# Backwards-compat alias used elsewhere in the file
call_openrouter = call_ai


def build_profile_context(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return ""
    bits = []
    for k in (
        "business_name", "industry", "country", "stage", "idea", "target_customer",
        "is_registered", "knowledge_level", "biggest_blocker",
    ):
        v = profile.get(k)
        if v:
            bits.append(f"{k.replace('_', ' ').title()}: {v}")
    if not bits:
        return ""
    return "[FOUNDER STATE]\n" + "\n".join(bits) + "\n[END STATE]"


# ------------------------- Routes -------------------------
@api_router.get("/")
async def root():
    return {"app": "Foundry", "model": OPENROUTER_MODEL, "status": "ok"}


@api_router.get("/agents")
async def list_agents():
    return [
        {"key": k, "name": v["name"], "role": v["role"]}
        for k, v in AGENTS.items()
    ]


# ----- Profiles -----
@api_router.post("/profiles", response_model=Profile)
async def create_profile(payload: ProfileCreate):
    p = Profile(**payload.model_dump())
    doc = p.model_dump()
    # upsert by session_id (one profile per session for v1)
    await db.profiles.update_one(
        {"session_id": p.session_id}, {"$set": doc}, upsert=True
    )
    return p


@api_router.get("/profiles/{session_id}", response_model=Optional[Profile])
async def get_profile(session_id: str):
    doc = await db.profiles.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        return None
    return Profile(**doc)


# ----- Journey (personalized roadmap) -----
class JourneyRequest(BaseModel):
    session_id: str
    profile: Dict[str, Any]


JOURNEY_SYSTEM = (
    "You are the Foundry Journey Architect. Build a personalized founder roadmap.\n"
    "Output STRICT JSON only — no markdown, no commentary. Schema:\n"
    "{\"summary\": str, \"buckets\": ["
    "{\"label\": \"Today\"|\"This Week\"|\"This Month\"|\"Next Quarter\","
    " \"items\": [{\"title\": str, \"why\": str, \"room\": one of "
    "(briefing|legal|design|marketing|ops|salesgym|vault), \"effort\": \"low\"|\"med\"|\"high\"}]}]}\n"
    "Rules:\n"
    "- Tailor depth to knowledge_level (beginner=hand-holding, expert=concise).\n"
    "- If is_registered='no' or 'unsure', Today/This Week MUST include the registration step (legal room).\n"
    "- If is_registered='yes', skip basic registration; focus on POST-registration milestones.\n"
    "- 3 items per bucket max. 4 buckets total.\n"
    "- Never invent statute numbers or URLs. Use general principles.\n"
    "- 8-year-old logic. Short titles. One-sentence why.\n"
    "- Return ONLY the JSON object, starting with { and ending with }."
)


@api_router.post("/journey")
async def generate_journey(req: JourneyRequest):
    enforce_rate_limit(req.session_id)
    import json as _json
    profile_ctx = build_profile_context(req.profile)
    user_prompt = (
        f"Build the journey for this founder.\n{profile_ctx}\n"
        f"Biggest blocker: {req.profile.get('biggest_blocker') or '(not stated)'}\n"
        "Return JSON only."
    )
    msgs = [
        {"role": "system", "content": JOURNEY_SYSTEM},
        {"role": "user", "content": user_prompt},
    ]
    raw, used_model = await call_ai(msgs, temperature=0.4)
    # Best-effort JSON extraction
    text = raw.strip()
    if text.startswith("```"):
        # strip markdown fences
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()
    # find first { and last }
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e != -1 and e > s:
        text = text[s:e + 1]
    try:
        plan = _json.loads(text)
    except Exception as ex:
        logger.error(f"Journey JSON parse failed: {ex}; raw={raw[:300]}")
        # graceful fallback
        plan = {
            "summary": "Couldn't parse the AI plan. Here's a safe default — try again in a moment.",
            "buckets": [
                {"label": "Today", "items": [
                    {"title": "Pick the one customer you want first", "why": "Clarity beats strategy.", "room": "briefing", "effort": "low"}
                ]},
                {"label": "This Week", "items": [
                    {"title": "Draft your one-line value proposition", "why": "You'll reuse it everywhere.", "room": "design", "effort": "low"}
                ]},
                {"label": "This Month", "items": [
                    {"title": "Map the compliance steps for your country", "why": "Avoid surprises later.", "room": "legal", "effort": "med"}
                ]},
                {"label": "Next Quarter", "items": [
                    {"title": "Land your first 3 paying customers", "why": "Revenue is the only validation.", "room": "marketing", "effort": "high"}
                ]},
            ],
        }
    return {"plan": plan, "model": used_model}


# ----- Chat / generate -----
@api_router.post("/agents/chat", response_model=AgentChatResponse)
async def agent_chat(req: AgentChatRequest):
    enforce_rate_limit(req.session_id)
    agent = get_agent(req.agent)
    sys_msg = agent["system"]
    profile_ctx = build_profile_context(req.profile)
    if profile_ctx:
        sys_msg = sys_msg + "\n\n" + profile_ctx

    msgs = [{"role": "system", "content": sys_msg}]
    for m in req.messages[-12:]:  # cap context
        msgs.append({"role": m.role, "content": m.content})

    reply, used_model = await call_openrouter(msgs)

    # store conversation turn
    await db.chats.insert_one({
        "session_id": req.session_id,
        "agent": req.agent,
        "messages": [m.model_dump() for m in req.messages] + [{"role": "assistant", "content": reply}],
        "created_at": now_iso(),
    })

    return AgentChatResponse(reply=reply, agent=req.agent, model=used_model)


@api_router.post("/agents/generate", response_model=AgentChatResponse)
async def agent_generate(req: GenerateRequest):
    enforce_rate_limit(req.session_id)
    agent = get_agent(req.agent)
    sys_msg = agent["system"]
    profile_ctx = build_profile_context(req.profile)
    if profile_ctx:
        sys_msg = sys_msg + "\n\n" + profile_ctx
    msgs = [
        {"role": "system", "content": sys_msg},
        {"role": "user", "content": req.prompt},
    ]
    reply, used_model = await call_openrouter(msgs)
    return AgentChatResponse(reply=reply, agent=req.agent, model=used_model)


# ----- Vault -----
@api_router.post("/vault", response_model=VaultDoc)
async def save_doc(payload: VaultDocCreate):
    doc = VaultDoc(**payload.model_dump())
    await db.vault.insert_one(doc.model_dump())
    return doc


@api_router.get("/vault/{session_id}", response_model=List[VaultDoc])
async def list_docs(session_id: str):
    cursor = db.vault.find({"session_id": session_id}, {"_id": 0}).sort("created_at", -1)
    return [VaultDoc(**d) for d in await cursor.to_list(200)]


@api_router.delete("/vault/{doc_id}")
async def delete_doc(doc_id: str):
    res = await db.vault.delete_one({"id": doc_id})
    return {"deleted": res.deleted_count}


# ----- Tasks -----
@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate):
    t = Task(**payload.model_dump())
    await db.tasks.insert_one(t.model_dump())
    return t


@api_router.get("/tasks/{session_id}", response_model=List[Task])
async def list_tasks(session_id: str):
    cursor = db.tasks.find({"session_id": session_id}, {"_id": 0}).sort("created_at", -1)
    return [Task(**d) for d in await cursor.to_list(500)]


@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate):
    res = await db.tasks.find_one_and_update(
        {"id": task_id}, {"$set": {"done": payload.done}},
        return_document=True, projection={"_id": 0}
    )
    if not res:
        raise HTTPException(404, "Task not found")
    return Task(**res)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    res = await db.tasks.delete_one({"id": task_id})
    return {"deleted": res.deleted_count}


# ----- Resource Directory (static, curated) -----
RESOURCES = [
    {"name": "CIPC BizPortal (South Africa)", "purpose": "Company & B-BBEE Registration", "url": "https://bizportal.gov.za", "country": "South Africa"},
    {"name": "SARS eFiling", "purpose": "Tax & VAT Registration", "url": "https://www.sarsefiling.co.za", "country": "South Africa"},
    {"name": "Department of Labour (CFOnline)", "purpose": "COIDA / Workman's Compensation", "url": "https://cfonline.labour.gov.za", "country": "South Africa"},
    {"name": "Information Regulator (POPIA/PAIA)", "purpose": "Data Privacy & Annual Reporting", "url": "https://inforegulator.org.za", "country": "South Africa"},
    {"name": "SEDA", "purpose": "Free workshops & business support", "url": "https://www.seda.org.za", "country": "South Africa"},
    {"name": "IRS Small Business", "purpose": "US tax registration & EIN", "url": "https://www.irs.gov/businesses/small-businesses-self-employed", "country": "United States"},
    {"name": "GOV.UK - Set up a business", "purpose": "Register a business in the UK", "url": "https://www.gov.uk/set-up-business", "country": "United Kingdom"},
    {"name": "MCA India", "purpose": "Company registration", "url": "https://www.mca.gov.in", "country": "India"},
    {"name": "Stripe Atlas", "purpose": "Form a US company from anywhere", "url": "https://stripe.com/atlas", "country": "Global"},
    {"name": "OpenAI / Yoco / Stripe", "purpose": "Payments setup", "url": "https://stripe.com", "country": "Global"},
]


@api_router.get("/resources")
async def get_resources(country: Optional[str] = None):
    if country:
        return [r for r in RESOURCES if r["country"].lower() == country.lower() or r["country"] == "Global"]
    return RESOURCES


# ------------------------- Wire-up -------------------------
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ------------------------- Per-session AI rate limiter -------------------------
# Sliding-window: max RATE_LIMIT_MAX AI calls per RATE_LIMIT_WINDOW seconds per session.
RATE_LIMIT_MAX = int(os.environ.get("AI_RATE_LIMIT_MAX", "30"))
RATE_LIMIT_WINDOW = int(os.environ.get("AI_RATE_LIMIT_WINDOW", "300"))  # seconds
_rate_history: Dict[str, deque] = defaultdict(deque)


def enforce_rate_limit(session_id: str):
    """Raise 429 if the session has exceeded the AI call budget."""
    now = time.monotonic()
    q = _rate_history[session_id]
    cutoff = now - RATE_LIMIT_WINDOW
    while q and q[0] < cutoff:
        q.popleft()
    if len(q) >= RATE_LIMIT_MAX:
        retry_in = int(q[0] + RATE_LIMIT_WINDOW - now)
        raise HTTPException(
            status_code=429,
            detail=(
                f"Easy there, founder. You've used {RATE_LIMIT_MAX} AI calls in the last "
                f"{RATE_LIMIT_WINDOW // 60} minutes. Take a 60-second breather, then try again "
                f"(or wait {max(retry_in, 1)}s)."
            ),
        )
    q.append(now)
