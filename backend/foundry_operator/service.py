from datetime import date
import os

from .domain import AgentPlan, FounderContext, OperatorResponse, Task, TaskDraft, TaskStatus, TemplateType
from .policies import daily_task_date, validate_daily_task_count
from .provider import DeterministicPlanner, OpenRouterPlanner, PlannerProvider
from .storage import AgentAuditInput, FoundryStorageAdapter, MentorSessionInput
from .tools import ToolRegistry


class FoundryOperator:
    def __init__(self, storage: FoundryStorageAdapter, provider: PlannerProvider | None = None):
        self.storage = storage
        self.provider = provider or (DeterministicPlanner() if os.getenv("FOUNDRY_PROVIDER", "").lower() == "deterministic" else OpenRouterPlanner())
        self.tools = ToolRegistry(storage)

    async def plan(self, founder_id: str, message: str, approval: dict | None = None) -> OperatorResponse:
        context = await self.storage.get_founder_context(founder_id)
        today = date.fromisoformat(daily_task_date())
        existing = await self.storage.list_tasks(founder_id, task_date=today)
        if existing:
            return self._response_from_tasks(existing, context.current_blocker, "existing_plan")
        sprint = await self.storage.get_active_sprint(founder_id)
        plan = await self.provider.plan(context, sprint, existing, message)
        if plan.status == "needs_confirmation":
            return OperatorResponse(message=plan.message, bottleneck=plan.bottleneck, status=plan.status, confirmation_required=plan.confirmation_required, model=plan.model)
        validate_daily_task_count([], plan.tasks)
        audit = AgentAuditInput(founder_id=founder_id, tool_name="create_daily_tasks", arguments={"message": message, "count": len(plan.tasks)}, validation_result={"max_three": True}, result_summary={"bottleneck": plan.bottleneck}, success=True, model_provider=plan.model)
        tasks = await self.storage.create_daily_tasks_with_audit(founder_id, today, plan.tasks, audit)
        await self.storage.log_mentor_session(MentorSessionInput(founder_id=founder_id, session_date=today, diagnosis=plan.bottleneck, recommended_focus=tasks[0].title if tasks else plan.message))
        return OperatorResponse(message=plan.message, bottleneck=plan.bottleneck, today_tasks=tasks, ui_actions=plan.ui_actions, confirmation_required=plan.confirmation_required, status=plan.status, model=plan.model, next_action=tasks[0].title if tasks else "")

    async def update_task(self, founder_id: str, task_id: str, status: TaskStatus | str, reason: str | None = None, evidence: str | None = None) -> Task:
        return await self.storage.update_task_status(founder_id, task_id, status, reason=reason, evidence=evidence)

    async def draft_template(self, founder_id: str, template_type: TemplateType | str, trade: str, prompt: str) -> dict:
        template_type = TemplateType(template_type)
        return {
            "template_type": template_type,
            "trade": trade,
            "name": f"{trade.title() or 'Business'} {template_type.replace('_', ' ').title()}",
            "content": {
                "prompt": prompt,
                "fields": ["customer", "date", "scope", "price", "approval", "next_action"],
                "review_note": "Check this draft and edit it before saving as a reusable template.",
            },
            "user_approved": False,
        }

    async def save_template(self, input):
        self.tools.require_approval(input.user_approved)
        return await self.storage.save_template(input)

    async def create_reminder(self, input):
        return await self.storage.schedule_reminder(input)

    def _response_from_tasks(self, tasks: list[Task], bottleneck: str, model: str) -> OperatorResponse:
        return OperatorResponse(message="Your plan for today is already in progress.", bottleneck=bottleneck, today_tasks=tasks, status="ready", model=model, next_action=next((task.title for task in tasks if task.status != TaskStatus.COMPLETED), "Review your completed work."))
