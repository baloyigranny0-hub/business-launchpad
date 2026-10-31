from datetime import date, datetime, timezone

import pytest

from backend.foundry_operator.domain import (
    AgentAudit,
    FounderContext,
    TaskDraft,
    TemplateType,
)
from backend.foundry_operator.storage import (
    AgentAuditInput,
    FoundryStorageAdapter,
    MentorSessionInput,
    ReminderInput,
    SaveTemplateInput,
)
from backend.foundry_operator.memory_storage import InMemoryFoundryStorageAdapter

def run(coroutine):
    """Drive the in-memory adapter coroutine to completion without a host event loop."""
    try:
        coroutine.send(None)
    except StopIteration as result:
        return result.value
    raise AssertionError("in-memory storage method unexpectedly yielded")


def context(founder_id: str) -> FounderContext:
    return FounderContext(
        founder_id=founder_id,
        business_name="Ubuntu Auto Care",
        trade="mechanic",
        business_stage="pre_revenue",
        current_blocker="no_pricing",
    )


def test_in_memory_adapter_implements_storage_contract_and_scopes_founders():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    other_id = "22222222-2222-4222-8222-222222222222"
    run(store.upsert_founder_context(context(founder_id)))
    run(store.upsert_founder_context(context(other_id)))

    loaded = run(store.get_founder_context(founder_id))
    assert loaded.business_name == "Ubuntu Auto Care"
    assert run(store.get_founder_context(other_id)).founder_id == other_id
    assert isinstance(store, FoundryStorageAdapter)


def test_firebase_subject_resolves_to_internal_founder_uuid():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    founder = context(founder_id)
    founder.auth_subject = "firebase-user-1"
    run(store.upsert_founder_context(founder))

    assert run(store.resolve_founder_id("firebase-user-1")) == founder_id
    with pytest.raises(KeyError):
        run(store.resolve_founder_id("firebase-user-2"))


def test_daily_task_creation_is_idempotent_and_capped():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))
    task_date = date(2026, 10, 31)
    drafts = [
        TaskDraft(title="Set diagnostic fee", category="finance"),
        TaskDraft(title="Draft job card", category="operations"),
    ]

    created = run(store.create_daily_tasks(founder_id, task_date, drafts))
    repeated = run(store.create_daily_tasks(founder_id, task_date, [TaskDraft(title="Do not duplicate", category="revenue")]))

    assert len(created) == 2
    assert [task.id for task in repeated] == [task.id for task in created]
    assert len(run(store.list_tasks(founder_id, task_date=task_date))) == 2

    with pytest.raises(ValueError, match="three"):
            run(store.create_daily_tasks(founder_id, date(2026, 11, 1), [
            TaskDraft(title=f"Task {index}", category="revenue") for index in range(4)
            ]))


def test_storage_writes_templates_reminders_sessions_and_audits():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))

    template = run(store.save_template(SaveTemplateInput(
        founder_id=founder_id,
        template_type=TemplateType.JOB_CARD,
        name="Standard job card",
        content={"fields": ["customer", "vehicle", "approval"]},
        trade="mechanic",
        user_approved=True,
    )))
    assert template.founder_id == founder_id
    assert run(store.list_templates(founder_id))[0].name == "Standard job card"

    reminder = run(store.schedule_reminder(ReminderInput(
        founder_id=founder_id,
        title="Follow up on quote",
        remind_at=datetime(2026, 11, 1, 8, 0, tzinfo=timezone.utc),
    )))
    assert reminder.founder_id == founder_id

    session = run(store.log_mentor_session(MentorSessionInput(
        founder_id=founder_id,
        session_date=date(2026, 10, 31),
        diagnosis="Pricing is the bottleneck.",
        recommended_focus="Set the diagnostic fee.",
    )))
    assert session.founder_id == founder_id

    run(store.log_agent_action(AgentAuditInput(
        founder_id=founder_id,
        tool_name="create_daily_tasks",
        arguments={"count": 2},
        validation_result={"valid": True},
        result_summary={"created": 2},
        success=True,
        model_provider="deterministic",
    )))
    assert len(store.audit_records) == 1
    assert isinstance(store.audit_records[0], AgentAudit)


def test_plan_and_audit_roll_back_together_on_audit_failure():
    class FailingAuditStore(InMemoryFoundryStorageAdapter):
        async def log_agent_action(self, input):
            raise RuntimeError("audit unavailable")

    store = FailingAuditStore()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))
    audit = AgentAuditInput(
        founder_id=founder_id,
        tool_name="create_daily_tasks",
        success=True,
    )

    with pytest.raises(RuntimeError, match="audit unavailable"):
        run(store.create_daily_tasks_with_audit(
            founder_id,
            date(2026, 10, 31),
            [TaskDraft(title="Set diagnostic fee", category="finance")],
            audit,
        ))
    assert run(store.list_tasks(founder_id, task_date=date(2026, 10, 31))) == []


def test_unapproved_template_is_rejected_before_storage():
    store = InMemoryFoundryStorageAdapter()

    with pytest.raises(ValueError, match="approval"):
        run(store.save_template(SaveTemplateInput(
            founder_id="11111111-1111-4111-8111-111111111111",
            template_type=TemplateType.INVOICE,
            name="Draft invoice",
            content={"fields": []},
            trade="mechanic",
            user_approved=False,
        )))
