from typing import Any

from .domain import TaskDraft
from .policies import assert_template_approval, validate_daily_task_count
from .storage import FoundryStorageAdapter


ALLOWLIST = {
    "get_founder_context",
    "search_playbooks",
    "create_daily_tasks",
    "update_task_status",
    "open_workflow",
    "draft_template",
    "save_template",
    "schedule_reminder",
    "log_mentor_insight",
}
PROHIBITED = {"send_email", "send_whatsapp", "make_payment", "issue_refund", "sign_contract", "change_account_owner"}


class ToolRegistry:
    def __init__(self, storage: FoundryStorageAdapter):
        self.storage = storage

    def validate_name(self, tool_name: str) -> None:
        if tool_name in PROHIBITED:
            raise PermissionError(f"tool '{tool_name}' is not available in Foundry")
        if tool_name not in ALLOWLIST:
            raise ValueError(f"unknown Foundry tool: {tool_name}")

    async def create_daily_tasks(self, founder_id: str, task_date, drafts: list[TaskDraft]):
        validate_daily_task_count([], drafts)
        return await self.storage.create_daily_tasks(founder_id, task_date, drafts)

    def require_approval(self, approved: bool):
        assert_template_approval(approved)
