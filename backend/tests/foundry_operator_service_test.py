from datetime import date

import pytest

from backend.foundry_operator.domain import FounderContext, TaskStatus
from backend.foundry_operator.memory_storage import InMemoryFoundryStorageAdapter
from backend.foundry_operator.service import FoundryOperator


def run(coroutine):
    try:
        coroutine.send(None)
    except StopIteration as result:
        return result.value
    raise AssertionError("test double unexpectedly yielded")


def context(founder_id: str, blocker: str = "no_pricing") -> FounderContext:
    return FounderContext(
        founder_id=founder_id,
        auth_subject="firebase-user-1",
        business_name="Ubuntu Auto Care",
        trade="mechanic",
        business_stage="pre_revenue",
        current_blocker=blocker,
    )


def test_deterministic_plan_creates_at_most_three_tasks_and_audits():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))
    operator = FoundryOperator(store)

    response = run(operator.plan(founder_id, "I need a price that customers will accept."))

    assert response.status == "ready"
    assert 1 <= len(response.today_tasks) <= 3
    assert response.today_tasks[0].category == "finance"
    assert len(store.audit_records) == 1


def test_duplicate_plan_returns_existing_tasks_without_another_audit():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))
    operator = FoundryOperator(store)

    first = run(operator.plan(founder_id, "Help me plan today."))
    second = run(operator.plan(founder_id, "Make a different plan."))

    assert [task.id for task in second.today_tasks] == [task.id for task in first.today_tasks]
    assert second.model == "existing_plan"
    assert len(store.audit_records) == 1


def test_status_updates_require_evidence_and_preserve_founder_scope():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    other_id = "22222222-2222-4222-8222-222222222222"
    run(store.upsert_founder_context(context(founder_id)))
    run(store.upsert_founder_context(context(other_id, blocker="no_customers")))
    operator = FoundryOperator(store)
    task = run(operator.plan(founder_id, "Help me plan today.")).today_tasks[0]

    in_progress = run(operator.update_task(founder_id, task.id, TaskStatus.IN_PROGRESS))
    with pytest.raises(ValueError, match="evidence"):
        run(operator.update_task(founder_id, in_progress.id, TaskStatus.COMPLETED))
    with pytest.raises(KeyError):
        run(operator.update_task(other_id, task.id, TaskStatus.IN_PROGRESS))

    updated = run(operator.update_task(founder_id, in_progress.id, TaskStatus.COMPLETED, evidence="Price card saved and sent to one customer."))
    assert updated.status == TaskStatus.COMPLETED


def test_external_message_request_is_refused_without_sending():
    store = InMemoryFoundryStorageAdapter()
    founder_id = "11111111-1111-4111-8111-111111111111"
    run(store.upsert_founder_context(context(founder_id)))
    operator = FoundryOperator(store)

    response = run(operator.plan(founder_id, "Email my customers and ask them to buy."))

    assert response.status == "needs_confirmation"
    assert response.confirmation_required
    assert "send" in response.message.lower() or "message" in response.message.lower()
