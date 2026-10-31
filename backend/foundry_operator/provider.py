import json
import os
from typing import Any, Protocol

import httpx

from .domain import AgentPlan, FounderContext, Sprint, Task


class PlannerProvider(Protocol):
    async def plan(self, context: FounderContext, sprint: Sprint | None, tasks: list[Task], message: str) -> AgentPlan: ...


def _fallback_plan(context: FounderContext, message: str) -> AgentPlan:
    blocker = (context.current_blocker or "unknown").lower()
    if any(word in message.lower() for word in ("email", "whatsapp", "message customers", "send to customers")):
        return AgentPlan(
            message="I can prepare a message for your review, but I will not send it or contact customers for you.",
            bottleneck=blocker,
            confirmation_required=[{"type": "external_message", "reason": "Founder review is required before any message leaves Foundry."}],
            status="needs_confirmation",
            model="deterministic",
        )
    if blocker in {"no_pricing", "pricing", "no_price"}:
        tasks = [
            {"title": "Set one clear starting price", "category": "finance", "priority": 1, "why_now": "A customer cannot say yes to an offer without a price.", "steps": ["List your direct cost", "Choose a fair margin", "Write the price in one sentence"], "expected_output": "A one-line price card", "definition_of_done": "One price is written and ready to quote."},
            {"title": "Ask one customer what they would pay", "category": "customer", "priority": 2, "why_now": "One real answer is better than guessing.", "steps": ["Pick one reachable customer", "Ask what outcome matters most", "Record the answer"], "expected_output": "One customer price signal", "definition_of_done": "The answer is saved in your notes."},
        ]
    elif blocker in {"no_customers", "no_outreach", "sales"}:
        tasks = [
            {"title": "Choose three reachable customers", "category": "customer", "priority": 1, "why_now": "A short list makes outreach possible today.", "steps": ["Write three names", "Note the problem each has", "Pick the easiest first conversation"], "expected_output": "A three-person prospect list", "definition_of_done": "Three prospects and their problem are recorded."},
        ]
    elif blocker in {"delivery", "no_supplier", "supplier"}:
        tasks = [
            {"title": "Confirm the next delivery dependency", "category": "operations", "priority": 1, "why_now": "A promised delivery needs a named next step.", "steps": ["List the missing input", "Name the supplier or owner", "Set the confirmation time"], "expected_output": "A delivery readiness checklist", "definition_of_done": "The missing input and owner are written down."},
        ]
    else:
        tasks = [
            {"title": "Write the next customer-facing action", "category": "revenue", "priority": 1, "why_now": "A small real-world action creates evidence.", "steps": ["Choose one customer problem", "Write the offer", "Set a time to ask"], "expected_output": "One customer action", "definition_of_done": "The action has a person, offer, and time."},
        ]
    return AgentPlan(message="Here is the smallest useful plan for today.", bottleneck=blocker, tasks=tasks, model="deterministic")


class DeterministicPlanner:
    async def plan(self, context: FounderContext, sprint: Sprint | None, tasks: list[Task], message: str) -> AgentPlan:
        return AgentPlan.model_validate(_fallback_plan(context, message))


class OpenRouterPlanner:
    def __init__(self, api_key: str | None = None, model: str | None = None, timeout: float = 20.0):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "").strip()
        self.model = model or os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
        self.timeout = timeout
        self.fallback = DeterministicPlanner()

    async def plan(self, context: FounderContext, sprint: Sprint | None, tasks: list[Task], message: str) -> AgentPlan:
        if not self.api_key:
            return await self.fallback.plan(context, sprint, tasks, message)
        system = (
            "You are the Foundry Operator. Return JSON only with keys message, bottleneck, tasks, "
            "ui_actions, confirmation_required, status, model. Make one to three concrete tasks. "
            "Never send messages, move money, sign contracts, or claim an external action happened. "
            "Tasks need title, category, priority, why_now, steps, expected_output, definition_of_done."
        )
        payload = {"model": self.model, "temperature": 0.2, "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps({"context": context.model_dump(mode="json"), "sprint": sprint.model_dump(mode="json") if sprint else None, "tasks": [task.model_dump(mode="json") for task in tasks], "message": message})},
        ]}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json", "HTTP-Referer": "https://foundry.app", "X-Title": "Foundry Operator"}, json=payload)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return AgentPlan.model_validate(parsed)
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
            return await self.fallback.plan(context, sprint, tasks, message)
