from datetime import date
from typing import Any, Optional
from uuid import uuid4

from .domain import AgentAudit, FounderContext, MentorSession, Reminder, Sprint, Task, TaskDraft, Template, TemplateSummary, utc_now
from .policies import assert_template_approval, validate_daily_task_count, validate_task_status_transition
from .storage import AgentAuditInput, FoundryStorageAdapter, MentorSessionInput, ReminderInput, SaveTemplateInput


class MongoFoundryStorageAdapter:
    """Motor-backed translation layer; Mongo documents never escape into the domain layer."""

    def __init__(self, db: Any, client: Any = None):
        self.db = db
        self.client = client or getattr(db, "client", None)

    async def ensure_indexes(self) -> None:
        await self.db.founder_profiles.create_index("auth_subject", unique=True, sparse=True)
        await self.db.daily_tasks.create_index([("founder_id", 1), ("task_date", 1), ("id", 1)], unique=True)
        await self.db.daily_plan_keys.create_index([("founder_id", 1), ("task_date", 1)], unique=True)
        await self.db.operational_templates.create_index([("founder_id", 1), ("created_at", -1)])
        await self.db.agent_audit_log.create_index([("founder_id", 1), ("created_at", -1)])

    async def resolve_founder_id(self, auth_subject: str, fallback_founder_id: str | None = None) -> str:
        doc = await self.db.founder_profiles.find_one({"auth_subject": auth_subject}, {"_id": 0, "founder_id": 1})
        if doc:
            return doc["founder_id"]
        if fallback_founder_id:
            await self.db.founder_profiles.update_one(
                {"founder_id": fallback_founder_id},
                {"$set": {"auth_subject": auth_subject, "updated_at": utc_now()}},
            )
            return fallback_founder_id
        raise KeyError(f"founder subject {auth_subject} was not found")

    async def upsert_founder_context(self, context: FounderContext) -> FounderContext:
        doc = context.model_dump(mode="json")
        doc["updated_at"] = utc_now()
        await self.db.founder_profiles.update_one({"founder_id": context.founder_id}, {"$set": doc}, upsert=True)
        return context

    async def get_founder_context(self, founder_id: str) -> FounderContext:
        doc = await self.db.founder_profiles.find_one({"founder_id": founder_id}, {"_id": 0})
        if doc is None:
            raise KeyError(f"founder {founder_id} was not found")
        doc.pop("updated_at", None)
        return FounderContext.model_validate(doc)

    async def get_active_sprint(self, founder_id: str) -> Optional[Sprint]:
        doc = await self.db.business_sprints.find_one({"founder_id": founder_id, "status": "active"}, {"_id": 0}, sort=[("start_date", -1)])
        return Sprint.model_validate(doc) if doc else None

    async def list_tasks(self, founder_id: str, task_date: date | None = None, statuses: list[str] | None = None) -> list[Task]:
        query: dict[str, Any] = {"founder_id": founder_id}
        if task_date:
            query["task_date"] = task_date.isoformat()
        if statuses:
            query["status"] = {"$in": statuses}
        docs = await self.db.daily_tasks.find(query, {"_id": 0}).sort([("task_date", 1), ("priority", 1), ("created_at", 1)]).to_list(200)
        return [Task.model_validate(doc) for doc in docs]

    async def create_daily_tasks(self, founder_id: str, task_date: date, tasks: list[TaskDraft]) -> list[Task]:
        existing = await self.list_tasks(founder_id, task_date=task_date)
        if existing:
            return existing
        validate_daily_task_count([], tasks)
        plan_key = f"{founder_id}:{task_date.isoformat()}"
        try:
            await self.db.daily_plan_keys.insert_one({"_id": plan_key, "founder_id": founder_id, "task_date": task_date.isoformat(), "created_at": utc_now()})
        except Exception as exc:
            if "duplicate" not in str(exc).lower() and "e11000" not in str(exc).lower():
                raise
            return await self.list_tasks(founder_id, task_date=task_date)
        created = []
        for draft in tasks:
            task_data = draft.model_dump(mode="json")
            task_data.update(id=str(uuid4()), founder_id=founder_id, task_date=task_date.isoformat(), plan_key=plan_key)
            task = Task.model_validate(task_data)
            await self.db.daily_tasks.insert_one(task.model_dump(mode="json") | {"plan_key": plan_key})
            created.append(task)
        return created

    async def create_daily_tasks_with_audit(self, founder_id: str, task_date: date, tasks: list[TaskDraft], audit: AgentAuditInput) -> list[Task]:
        if self.client is None:
            raise RuntimeError("Mongo client is required for atomic plan and audit writes")
        async with await self.client.start_session() as session:
            async with session.start_transaction():
                existing = await self.list_tasks(founder_id, task_date=task_date)
                if existing:
                    return existing
                validate_daily_task_count([], tasks)
                plan_key = f"{founder_id}:{task_date.isoformat()}"
                await self.db.daily_plan_keys.insert_one({"_id": plan_key, "founder_id": founder_id, "task_date": task_date.isoformat(), "created_at": utc_now()}, session=session)
                created = []
                for draft in tasks:
                    task_data = draft.model_dump(mode="json")
                    task_data.update(id=str(uuid4()), founder_id=founder_id, task_date=task_date.isoformat(), plan_key=plan_key)
                    task = Task.model_validate(task_data)
                    await self.db.daily_tasks.insert_one(task.model_dump(mode="json") | {"plan_key": plan_key}, session=session)
                    created.append(task)
                await self.db.agent_audit_log.insert_one(AgentAudit(**audit.model_dump()).model_dump(mode="json"), session=session)
                return created

    async def update_task_status(self, founder_id: str, task_id: str, status: str, reason: str | None = None, evidence: str | None = None) -> Task:
        doc = await self.db.daily_tasks.find_one({"id": task_id, "founder_id": founder_id}, {"_id": 0})
        if doc is None:
            raise KeyError("task was not found for this founder")
        task = Task.model_validate(doc)
        validate_task_status_transition(task.status, status, reason=reason, evidence=evidence)
        update = {"status": status, "updated_at": utc_now()}
        if status in {"blocked", "deferred"}:
            update["blocked_reason"] = reason
        if status == "completed":
            update["completion_evidence"] = evidence
        await self.db.daily_tasks.update_one({"id": task_id, "founder_id": founder_id}, {"$set": update})
        doc.update(update)
        return Task.model_validate(doc)

    async def save_template(self, input: SaveTemplateInput) -> Template:
        assert_template_approval(input.user_approved)
        template = Template(founder_id=input.founder_id, template_type=input.template_type, name=input.name, content=dict(input.content), trade=input.trade)
        await self.db.operational_templates.insert_one(template.model_dump(mode="json"))
        return template

    async def list_templates(self, founder_id: str) -> list[TemplateSummary]:
        docs = await self.db.operational_templates.find({"founder_id": founder_id}, {"_id": 0}).sort([("created_at", -1)]).to_list(200)
        return [TemplateSummary.model_validate({key: doc[key] for key in ("id", "template_type", "name", "trade", "version", "created_at")}) for doc in docs]

    async def schedule_reminder(self, input: ReminderInput) -> Reminder:
        reminder = Reminder(**input.model_dump())
        await self.db.reminders.insert_one(reminder.model_dump(mode="json"))
        return reminder

    async def log_agent_action(self, input: AgentAuditInput) -> None:
        await self.db.agent_audit_log.insert_one(AgentAudit(**input.model_dump()).model_dump(mode="json"))

    async def log_mentor_session(self, input: MentorSessionInput) -> MentorSession:
        session = MentorSession(**input.model_dump())
        await self.db.mentor_sessions.insert_one(session.model_dump(mode="json"))
        return session
