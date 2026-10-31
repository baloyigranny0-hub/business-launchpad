from datetime import date, datetime, timezone
from typing import Iterable, Optional
from zoneinfo import ZoneInfo

from .domain import TaskDraft, TaskStatus


JOHANNESBURG = "Africa/Johannesburg"
_JOHANNESBURG_ZONE = ZoneInfo(JOHANNESBURG)

_ALLOWED_TRANSITIONS = {
    TaskStatus.OPEN: {TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.DEFERRED},
    TaskStatus.IN_PROGRESS: {TaskStatus.COMPLETED, TaskStatus.BLOCKED, TaskStatus.DEFERRED},
    TaskStatus.BLOCKED: {TaskStatus.IN_PROGRESS},
    TaskStatus.DEFERRED: {TaskStatus.IN_PROGRESS},
    TaskStatus.COMPLETED: set(),
}


def daily_task_date(now: Optional[datetime] = None) -> str:
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    return current.astimezone(_JOHANNESBURG_ZONE).date().isoformat()


def _status(value: TaskStatus | str) -> TaskStatus:
    return value if isinstance(value, TaskStatus) else TaskStatus(value)


def validate_task_status_transition(
    current: TaskStatus | str,
    target: TaskStatus | str,
    *,
    reason: Optional[str],
    evidence: Optional[str],
) -> None:
    current_status = _status(current)
    target_status = _status(target)
    if target_status not in _ALLOWED_TRANSITIONS[current_status]:
        raise ValueError(f"A {current_status.value} task cannot move to {target_status.value}; completed tasks cannot be reopened")
    if target_status == TaskStatus.COMPLETED and not (evidence or "").strip():
        raise ValueError("completion evidence is required")
    if target_status in {TaskStatus.BLOCKED, TaskStatus.DEFERRED} and not (reason or "").strip():
        raise ValueError("a reason is required when a task is blocked or deferred")


def validate_daily_task_count(existing: Iterable[TaskDraft], incoming: Iterable[TaskDraft]) -> None:
    count = len(list(existing)) + len(list(incoming))
    if count > 3:
        raise ValueError("a daily plan cannot contain more than three tasks")


def assert_template_approval(approved: bool) -> None:
    if approved is not True:
        raise ValueError("explicit approval is required before saving a template")
