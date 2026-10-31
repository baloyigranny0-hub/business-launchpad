from datetime import date, datetime
from typing import Any, Optional

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from .domain import FounderContext, TaskStatus, TemplateType
from .service import FoundryOperator
from .policies import daily_task_date
from .storage import AgentAuditInput, MentorSessionInput, ReminderInput, SaveTemplateInput


router = APIRouter(prefix="/api/operator", tags=["foundry-operator"])


class SessionRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=128)


class PlanRequest(SessionRequest):
    message: str = Field(default="Help me decide what to do today.", max_length=4000)
    approval: Optional[dict[str, Any]] = None


class TaskStatusRequest(SessionRequest):
    status: TaskStatus
    reason: Optional[str] = None
    evidence: Optional[str] = None


class TemplateDraftRequest(SessionRequest):
    template_type: TemplateType
    trade: str = ""
    prompt: str = Field(default="Create a simple operating template.", max_length=2000)


class TemplateSaveRequest(SessionRequest):
    template_type: TemplateType
    name: str = Field(min_length=1, max_length=240)
    content: dict[str, Any]
    trade: str = ""
    user_approved: bool = False


class ReminderRequest(SessionRequest):
    title: str = Field(min_length=1, max_length=240)
    remind_at: datetime
    task_id: Optional[str] = None


def _server():
    import sys
    if "backend.server" in sys.modules:
        return sys.modules["backend.server"]
    if "server" in sys.modules:
        return sys.modules["server"]
    try:
        import server
        return server
    except ModuleNotFoundError:
        from backend import server
        return server


async def _founder_id(session_id: str, authorization: Optional[str]) -> str:
    server = _server()
    server.enforce_firebase_session(session_id, authorization)
    try:
        return await server.get_operator_storage().resolve_founder_id(session_id, fallback_founder_id=session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Founder profile was not found") from exc


def _operator(founder_id: str) -> FoundryOperator:
    return FoundryOperator(_server().get_operator_storage())


def _error(exc: Exception):
    if isinstance(exc, KeyError):
        return HTTPException(status_code=404, detail="Foundry record was not found")
    if isinstance(exc, PermissionError):
        return HTTPException(status_code=403, detail=str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, RuntimeError):
        return HTTPException(status_code=503, detail="Foundry storage or planning service is unavailable")
    return HTTPException(status_code=500, detail="Foundry request could not be completed")


@router.get("/context")
async def get_context(session_id: str = Query(...), authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(session_id, authorization)
    try:
        storage = _server().get_operator_storage()
        context = await storage.get_founder_context(founder_id)
        tasks = await storage.list_tasks(founder_id, task_date=date.fromisoformat(daily_task_date()))
        templates = await storage.list_templates(founder_id)
        all_tasks = await storage.list_tasks(founder_id)
        completed = [task for task in all_tasks if task.status == TaskStatus.COMPLETED]
        revenue = [task for task in completed if task.category == "revenue"]
        return {"context": context, "sprint": await storage.get_active_sprint(founder_id), "today_tasks": tasks, "templates": templates, "progress": {"completed_this_week": len(completed), "revenue_actions_completed": len(revenue), "active_days": len({task.task_date for task in all_tasks}), "current_stage": context.business_stage}, "next_action": next((task.title for task in tasks if task.status != TaskStatus.COMPLETED), "Ask Foundry for today's plan.")}
    except Exception as exc:
        raise _error(exc) from exc


@router.post("/plan")
async def create_plan(payload: PlanRequest, authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(payload.session_id, authorization)
    try:
        return await _operator(founder_id).plan(founder_id, payload.message, payload.approval)
    except Exception as exc:
        raise _error(exc) from exc


@router.get("/tasks")
async def get_tasks(session_id: str = Query(...), task_date: Optional[date] = None, status: Optional[list[TaskStatus]] = Query(None), authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(session_id, authorization)
    try:
        return await _server().get_operator_storage().list_tasks(founder_id, task_date=task_date, statuses=[item.value for item in status] if status else None)
    except Exception as exc:
        raise _error(exc) from exc


@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskStatusRequest, authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(payload.session_id, authorization)
    try:
        return await _operator(founder_id).update_task(founder_id, task_id, payload.status, payload.reason, payload.evidence)
    except Exception as exc:
        raise _error(exc) from exc


@router.get("/templates")
async def get_templates(session_id: str = Query(...), authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(session_id, authorization)
    try:
        return await _server().get_operator_storage().list_templates(founder_id)
    except Exception as exc:
        raise _error(exc) from exc


@router.post("/templates/draft")
async def draft_template(payload: TemplateDraftRequest, authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(payload.session_id, authorization)
    try:
        return await _operator(founder_id).draft_template(founder_id, payload.template_type, payload.trade, payload.prompt)
    except Exception as exc:
        raise _error(exc) from exc


@router.post("/templates")
async def save_template(payload: TemplateSaveRequest, authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(payload.session_id, authorization)
    try:
        return await _operator(founder_id).save_template(SaveTemplateInput(founder_id=founder_id, template_type=payload.template_type, name=payload.name, content=payload.content, trade=payload.trade, user_approved=payload.user_approved))
    except Exception as exc:
        raise _error(exc) from exc


@router.post("/reminders")
async def create_reminder(payload: ReminderRequest, authorization: Optional[str] = Header(None)):
    founder_id = await _founder_id(payload.session_id, authorization)
    try:
        return await _operator(founder_id).create_reminder(ReminderInput(founder_id=founder_id, title=payload.title, remind_at=payload.remind_at, task_id=payload.task_id))
    except Exception as exc:
        raise _error(exc) from exc
