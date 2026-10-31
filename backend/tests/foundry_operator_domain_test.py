from datetime import datetime, timezone
from uuid import UUID

import pytest

from backend.foundry_operator.domain import TaskDraft, TaskStatus
from backend.foundry_operator.policies import (
    JOHANNESBURG,
    assert_template_approval,
    daily_task_date,
    validate_daily_task_count,
    validate_task_status_transition,
)


def test_daily_task_date_uses_johannesburg_calendar_boundary():
    late_night_utc = datetime(2026, 10, 31, 22, 45, tzinfo=timezone.utc)

    assert daily_task_date(late_night_utc) == "2026-11-01"
    assert JOHANNESBURG == "Africa/Johannesburg"


def test_task_draft_defaults_to_uuid_and_utc_timestamp():
    task = TaskDraft(title="Call three customers", category="customer")

    UUID(task.id)
    assert task.created_at.tzinfo == timezone.utc
    assert task.revenue_proximity == "direct"


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (TaskStatus.OPEN, TaskStatus.IN_PROGRESS),
        (TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED),
        (TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS),
        (TaskStatus.DEFERRED, TaskStatus.IN_PROGRESS),
    ],
)
def test_allowed_task_status_transitions(current, target):
    evidence = "Customer list and quote draft saved." if target == TaskStatus.COMPLETED else None
    reason = "Waiting for supplier reply." if target in {TaskStatus.BLOCKED, TaskStatus.DEFERRED} else None

    assert validate_task_status_transition(current, target, reason=reason, evidence=evidence) is None


def test_completion_requires_evidence():
    with pytest.raises(ValueError, match="completion evidence"):
        validate_task_status_transition(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, reason=None, evidence=None)


def test_blocked_and_deferred_require_reason():
    for target in (TaskStatus.BLOCKED, TaskStatus.DEFERRED):
        with pytest.raises(ValueError, match="reason"):
            validate_task_status_transition(TaskStatus.OPEN, target, reason=None, evidence=None)


def test_completed_task_cannot_be_reopened():
    with pytest.raises(ValueError, match="completed"):
        validate_task_status_transition(TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, reason=None, evidence=None)


def test_daily_plan_caps_active_tasks_at_three():
    existing = [TaskDraft(title=f"Task {index}", category="revenue") for index in range(2)]
    incoming = [TaskDraft(title="Task 3", category="revenue")]

    assert validate_daily_task_count(existing, incoming) is None

    with pytest.raises(ValueError, match="three"):
        validate_daily_task_count(existing, [TaskDraft(title=f"Task {index}", category="revenue") for index in range(2)])


def test_template_save_requires_explicit_approval():
    assert_template_approval(True)

    with pytest.raises(ValueError, match="approval"):
        assert_template_approval(False)
