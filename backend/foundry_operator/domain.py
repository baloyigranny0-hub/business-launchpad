from datetime import date, datetime, timezone
from enum import StrEnum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, ConfigDict


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TaskStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    DEFERRED = "deferred"


class TaskCategory(StrEnum):
    REVENUE = "revenue"
    OPERATIONS = "operations"
    FINANCE = "finance"
    CUSTOMER = "customer"
    FOUNDATION = "foundation"


class RevenueProximity(StrEnum):
    DIRECT = "direct"
    ENABLING = "enabling"
    FOUNDATION = "foundation"


class TaskSource(StrEnum):
    AGENT = "agent"
    FOUNDER = "founder"
    ADMIN = "admin"


class TemplateType(StrEnum):
    JOB_CARD = "job_card"
    PRICING_SHEET = "pricing_sheet"
    INSPECTION_CHECKLIST = "inspection_checklist"
    INVOICE = "invoice"
    CUSTOMER_SCRIPT = "customer_script"
    SUPPLIER_CHECKLIST = "supplier_checklist"
    CASH_TRACKER = "cash_tracker"


class DomainModel(BaseModel):
    model_config = ConfigDict(extra="forbid", use_enum_values=True)


class TaskDraft(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: Optional[str] = None
    sprint_id: Optional[str] = None
    task_date: Optional[date] = None
    title: str = Field(min_length=1, max_length=240)
    category: TaskCategory
    priority: int = Field(default=1, ge=1, le=3)
    revenue_proximity: RevenueProximity = RevenueProximity.DIRECT
    why_now: str = ""
    steps: list[str] = Field(default_factory=list)
    expected_output: str = ""
    definition_of_done: str = ""
    estimated_minutes: int = Field(default=30, ge=5, le=240)
    status: TaskStatus = TaskStatus.OPEN
    blocked_reason: Optional[str] = None
    completion_evidence: Optional[str] = None
    source: TaskSource = TaskSource.AGENT
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Task(TaskDraft):
    founder_id: str
    task_date: date


class FounderContext(DomainModel):
    founder_id: str
    auth_subject: Optional[str] = None
    trade: str = ""
    business_name: str = ""
    business_stage: str = "idea"
    location_context: str = "South Africa"
    weekly_capacity_hours: Optional[int] = Field(default=None, ge=1, le=168)
    revenue_goal: Optional[float] = None
    current_blocker: str = "unknown"
    timezone: str = "Africa/Johannesburg"
    profile: dict[str, Any] = Field(default_factory=dict)


class Sprint(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: str
    title: str
    objective: str
    status: str = "active"
    start_date: date
    target_date: Optional[date] = None


class Template(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: str
    template_type: TemplateType
    name: str
    content: dict[str, Any]
    trade: str = ""
    version: int = Field(default=1, ge=1)
    created_at: datetime = Field(default_factory=utc_now)


class TemplateSummary(DomainModel):
    id: str
    template_type: TemplateType
    name: str
    trade: str
    version: int
    created_at: datetime


class Reminder(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: str
    title: str
    remind_at: datetime
    task_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class MentorSession(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: str
    session_date: date
    diagnosis: str
    recommended_focus: str
    outcome: Optional[str] = None
    token_usage: Optional[int] = None
    created_at: datetime = Field(default_factory=utc_now)


class AgentAudit(DomainModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    founder_id: str
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    validation_result: dict[str, Any] = Field(default_factory=dict)
    result_summary: dict[str, Any] = Field(default_factory=dict)
    success: bool
    model_provider: str = ""
    created_at: datetime = Field(default_factory=utc_now)


class AgentPlan(DomainModel):
    message: str
    bottleneck: str
    tasks: list[TaskDraft] = Field(default_factory=list, max_length=3)
    ui_actions: list[dict[str, Any]] = Field(default_factory=list)
    confirmation_required: list[dict[str, Any]] = Field(default_factory=list)
    status: str = "ready"
    model: str = "deterministic"
