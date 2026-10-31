from datetime import date

from .domain import (
    AgentAudit,
    FounderContext,
    MentorSession,
    Reminder,
    Sprint,
    Task,
    TaskDraft,
    TaskStatus,
    Template,
    TemplateSummary,
    utc_now,
)
from .policies import assert_template_approval, validate_daily_task_count, validate_task_status_transition
from .storage import AgentAuditInput, FoundryStorageAdapter, MentorSessionInput, ReminderInput, SaveTemplateInput


class InMemoryFoundryStorageAdapter:
    def __init__(self):
        self.contexts: dict[str, dict] = {}
        self.sprints: dict[str, Sprint] = {}
        self.tasks: dict[str, dict] = {}
        self.templates: dict[str, Template] = {}
        self.reminders: dict[str, Reminder] = {}
        self.mentor_sessions: list[MentorSession] = []
        self.audit_records: list[AgentAudit] = []

    async def resolve_founder_id(self, auth_subject: str, fallback_founder_id: str | None = None) -> str:
        for context in self.contexts.values():
            if context.get("auth_subject") == auth_subject:
                return context["founder_id"]
        if fallback_founder_id:
            return fallback_founder_id
        raise KeyError(f"founder subject {auth_subject} was not found")

    async def upsert_founder_context(self, context: FounderContext) -> FounderContext:
        self.contexts[context.founder_id] = context.model_dump(mode="json")
        return FounderContext.model_validate(self.contexts[context.founder_id])

    async def get_founder_context(self, founder_id: str) -> FounderContext:
        context = self.contexts.get(founder_id)
        if context is None:
            raise KeyError(f"founder {founder_id} was not found")
        return FounderContext.model_validate(context)

    async def get_active_sprint(self, founder_id: str) -> Sprint | None:
        sprint = self.sprints.get(founder_id)
        return sprint.model_copy(deep=True) if sprint and sprint.status == "active" else None

    async def list_tasks(self, founder_id: str, task_date: date | None = None, statuses: list[str] | None = None) -> list[Task]:
        status_set = set(statuses or [])
        tasks = [
            Task.model_validate(task)
            for task in self.tasks.values()
            if task["founder_id"] == founder_id
            and (task_date is None or task["task_date"] == task_date.isoformat())
            and (not status_set or task["status"] in status_set)
        ]
        tasks.sort(key=lambda task: (task.task_date, task.priority, task.created_at))
        return [task.model_copy(deep=True) for task in tasks]

    async def create_daily_tasks(self, founder_id: str, task_date: date, tasks: list[TaskDraft]) -> list[Task]:
        existing = await self.list_tasks(founder_id, task_date=task_date)
        if existing:
            return existing
        validate_daily_task_count([], tasks)
        created = []
        for draft in tasks:
            task_data = draft.model_dump()
            task_data.update(founder_id=founder_id, task_date=task_date)
            task = Task(**task_data)
            self.tasks[task.id] = task.model_dump(mode="json")
            created.append(task)
        return [task.model_copy(deep=True) for task in created]

    async def create_daily_tasks_with_audit(self, founder_id: str, task_date: date, tasks: list[TaskDraft], audit: AgentAuditInput) -> list[Task]:
        snapshot = dict(self.tasks)
        audit_count = len(self.audit_records)
        try:
            created = await self.create_daily_tasks(founder_id, task_date, tasks)
            await self.log_agent_action(audit)
            return created
        except Exception:
            self.tasks = snapshot
            del self.audit_records[audit_count:]
            raise

    async def update_task_status(self, founder_id: str, task_id: str, status: str, reason: str | None = None, evidence: str | None = None) -> Task:
        task_data = self.tasks.get(task_id)
        if task_data is None or task_data["founder_id"] != founder_id:
            raise KeyError("task was not found for this founder")
        task = Task.model_validate(task_data)
        validate_task_status_transition(task.status, status, reason=reason, evidence=evidence)
        task.status = status
        task.updated_at = utc_now()
        if status in {TaskStatus.BLOCKED, TaskStatus.DEFERRED}:
            task.blocked_reason = reason
        if status == TaskStatus.COMPLETED:
            task.completion_evidence = evidence
        self.tasks[task.id] = task.model_dump(mode="json")
        return Task.model_validate(self.tasks[task.id])

    async def save_template(self, input: SaveTemplateInput) -> Template:
        assert_template_approval(input.user_approved)
        template = Template(
            founder_id=input.founder_id,
            template_type=input.template_type,
            name=input.name,
            content=dict(input.content),
            trade=input.trade,
        )
        self.templates[template.id] = template
        return template.model_copy(deep=True)

    async def list_templates(self, founder_id: str) -> list[TemplateSummary]:
        templates = [
            TemplateSummary(
                id=template.id,
                template_type=template.template_type,
                name=template.name,
                trade=template.trade,
                version=template.version,
                created_at=template.created_at,
            )
            for template in self.templates.values()
            if template.founder_id == founder_id
        ]
        return [template.model_copy(deep=True) for template in templates]

    async def schedule_reminder(self, input: ReminderInput) -> Reminder:
        reminder = Reminder(
            founder_id=input.founder_id,
            title=input.title,
            remind_at=input.remind_at,
            task_id=input.task_id,
        )
        self.reminders[reminder.id] = reminder
        return reminder.model_copy(deep=True)

    async def log_agent_action(self, input: AgentAuditInput) -> None:
        self.audit_records.append(AgentAudit(**input.model_dump()))

    async def log_mentor_session(self, input: MentorSessionInput) -> MentorSession:
        session = MentorSession(**input.model_dump())
        self.mentor_sessions.append(session)
        return session.model_copy(deep=True)
