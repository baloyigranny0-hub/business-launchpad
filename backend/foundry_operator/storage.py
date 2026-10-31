from datetime import date, datetime
from typing import Any, Optional, Protocol, runtime_checkable

from pydantic import BaseModel, Field

from .domain import (
    AgentAudit,
    FounderContext,
    MentorSession,
    Reminder,
    Sprint,
    Task,
    TaskDraft,
    Template,
    TemplateSummary,
    TemplateType,
)


class StorageInput(BaseModel):
    model_config = {"extra": "forbid"}


class SaveTemplateInput(StorageInput):
    founder_id: str
    template_type: TemplateType
    name: str = Field(min_length=1, max_length=240)
    content: dict[str, Any]
    trade: str = ""
    user_approved: bool = False


class ReminderInput(StorageInput):
    founder_id: str
    title: str = Field(min_length=1, max_length=240)
    remind_at: datetime
    task_id: Optional[str] = None


class MentorSessionInput(StorageInput):
    founder_id: str
    session_date: date
    diagnosis: str
    recommended_focus: str
    outcome: Optional[str] = None
    token_usage: Optional[int] = None


class AgentAuditInput(StorageInput):
    founder_id: str
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    validation_result: dict[str, Any] = Field(default_factory=dict)
    result_summary: dict[str, Any] = Field(default_factory=dict)
    success: bool
    model_provider: str = ""


@runtime_checkable
class FoundryStorageAdapter(Protocol):
    async def resolve_founder_id(self, auth_subject: str, fallback_founder_id: Optional[str] = None) -> str: ...

    async def upsert_founder_context(self, context: FounderContext) -> FounderContext: ...

    async def get_founder_context(self, founder_id: str) -> FounderContext: ...

    async def get_active_sprint(self, founder_id: str) -> Optional[Sprint]: ...

    async def list_tasks(
        self,
        founder_id: str,
        task_date: Optional[date] = None,
        statuses: Optional[list[str]] = None,
    ) -> list[Task]: ...

    async def create_daily_tasks(self, founder_id: str, task_date: date, tasks: list[TaskDraft]) -> list[Task]: ...

    async def create_daily_tasks_with_audit(
        self,
        founder_id: str,
        task_date: date,
        tasks: list[TaskDraft],
        audit: AgentAuditInput,
    ) -> list[Task]: ...

    async def update_task_status(
        self,
        founder_id: str,
        task_id: str,
        status: str,
        reason: Optional[str] = None,
        evidence: Optional[str] = None,
    ) -> Task: ...

    async def save_template(self, input: SaveTemplateInput) -> Template: ...

    async def list_templates(self, founder_id: str) -> list[TemplateSummary]: ...

    async def schedule_reminder(self, input: ReminderInput) -> Reminder: ...

    async def log_agent_action(self, input: AgentAuditInput) -> None: ...

    async def log_mentor_session(self, input: MentorSessionInput) -> MentorSession: ...


def get_foundry_storage(db: Any = None) -> FoundryStorageAdapter:
    """Select the operator persistence backend without changing legacy database setup."""
    import os

    backend = os.getenv("FOUNDRY_STORAGE_BACKEND", "mongo").lower()
    if backend == "memory":
        from .memory_storage import InMemoryFoundryStorageAdapter

        return InMemoryFoundryStorageAdapter()
    if backend == "mongo":
        if db is None:
            raise RuntimeError("Mongo storage requires the existing database handle")
        from .mongo_storage import MongoFoundryStorageAdapter

        return MongoFoundryStorageAdapter(db)
    if backend == "supabase":
        from .supabase_storage import SupabaseFoundryStorageAdapter

        return SupabaseFoundryStorageAdapter.from_environment()
    raise RuntimeError(f"unsupported FOUNDRY_STORAGE_BACKEND: {backend}")
