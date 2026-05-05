from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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
    OPENROUTER_MODEL,
    "google/gemma-4-26b-a4b-it:free",
    "z-ai/glm-4.5-air:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-nano-9b-v2:free",
]
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

app = FastAPI(title="Vula Engine API")
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
    created_at: str = Field(default_factory=now_iso)


class ProfileCreate(BaseModel):
    session_id: str
    business_name: str
    industry: str
    country: str = "Global"
    stage: str = "idea"
    idea: str = ""
    target_customer: str = ""


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


# ------------------------- OpenRouter helper -------------------------
async def call_openrouter(messages: List[Dict[str, str]], temperature: float = 0.7) -> tuple[str, str]:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://vula-engine.app",
        "X-Title": "Vula Engine",
    }
    last_err = None
    async with httpx.AsyncClient(timeout=90.0) as ac:
        for model in OPENROUTER_FALLBACKS:
            payload = {"model": model, "messages": messages, "temperature": temperature}
            try:
                r = await ac.post(OPENROUTER_URL, headers=headers, json=payload)
            except Exception as e:
                last_err = str(e)
                continue
            if r.status_code == 200:
                try:
                    data = r.json()
                    content = data["choices"][0]["message"]["content"]
                    if content and content.strip():
                        return content, model
                except (KeyError, IndexError, ValueError):
                    last_err = f"malformed response from {model}"
                    continue
            else:
                last_err = f"{model} -> {r.status_code}: {r.text[:150]}"
                logger.warning(f"OpenRouter fallback: {last_err}")
                # Try next model only on 429/5xx; other errors also fall through
                continue
    raise HTTPException(status_code=502, detail=f"All free models busy. Last: {last_err}")


def build_profile_context(profile: Optional[Dict[str, Any]]) -> str:
    if not profile:
        return ""
    bits = []
    for k in ("business_name", "industry", "country", "stage", "idea", "target_customer"):
        v = profile.get(k)
        if v:
            bits.append(f"{k.replace('_', ' ').title()}: {v}")
    if not bits:
        return ""
    return "[FOUNDER STATE]\n" + "\n".join(bits) + "\n[END STATE]"


# ------------------------- Routes -------------------------
@api_router.get("/")
async def root():
    return {"app": "Vula Engine", "model": OPENROUTER_MODEL, "status": "ok"}


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


# ----- Chat / generate -----
@api_router.post("/agents/chat", response_model=AgentChatResponse)
async def agent_chat(req: AgentChatRequest):
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
