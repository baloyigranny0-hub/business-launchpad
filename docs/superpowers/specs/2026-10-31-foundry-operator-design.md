# Foundry Operator Daily Execution Engine

## Intent

Foundry becomes a daily execution engine for first-time and early-stage founders. Its primary job is to answer, from the founder's actual operating state, "What is the highest-leverage thing I should do today to move toward revenue?" Every session should end with a visible task, template, decision, or next customer-facing action.

The first release will run on the existing FastAPI + MongoDB deployment and React dashboard. The product code will depend on a typed storage adapter rather than MongoDB details, so Supabase Auth/Postgres/Edge Functions can become the production storage and execution layer in a later migration without changing the domain workflow or dashboard contracts.

## Goals

- Store a durable founder operating profile, active sprint, tasks, templates, mentor sessions, reminders, and audit records.
- Generate a tailored daily plan of one to three tasks, ranked by revenue proximity and founder capacity.
- Support the task lifecycle: `open`, `in_progress`, `completed`, `blocked`, and `deferred`.
- Capture completion evidence, blocked reasons, and the next recommended action.
- Provide operational templates for job cards, pricing sheets, inspection checklists, invoices, customer scripts, supplier checklists, and cash trackers.
- Run all agent writes through an allowlisted tool registry and audit every tool call and result.
- Keep the current chat and legacy API routes working while the Journey dashboard becomes the execution surface.
- Make the same domain behavior testable with in-memory storage, the current Mongo storage, and a Supabase-compatible adapter boundary.

## Non-goals

- No full Supabase migration in this increment.
- No payments, refunds, contracts, signatures, email, WhatsApp, or other external communications.
- No autonomous tax, legal, insurance, or financial decisions.
- No organization billing, multi-founder collaboration, or admin console.
- No claim that an external action occurred unless the backend tool actually succeeded.

## Anti-goals

- Do not build another general-purpose chatbot with tasks hidden in chat history.
- Do not let the LLM own task state, enforce task limits, or write directly to MongoDB.
- Do not expose MongoDB, OpenRouter, or future Supabase service-role credentials to React.
- Do not leak Mongo-specific identifiers or documents into the domain layer.
- Do not create more than three daily tasks for a founder, even when the model asks for more.
- Do not save a final operational template without explicit founder approval.

## Current-state constraints

- The repository is the connected `FOUNDRY` branch at `https://github.com/baloyigranny0-hub/business-launchpad`.
- The backend is FastAPI with a MongoDB default and existing memory/Firestore adapters; the frontend is Create React App with CRACO.
- Existing data uses `session_id` and legacy collections. The adapter will translate legacy profile data into the new founder context and use the stable UUID string as `founder_id` for the first release.
- Firebase auth already exists but is configuration-dependent. Foundry will create and persist an internal UUID `founder_id` and map the authenticated Firebase UID to it through the founder profile. In development, the existing local session flow remains available and its UUID becomes the internal founder ID; when Firebase enforcement is enabled, the authenticated Firebase UID resolves to the mapped internal founder ID and a request cannot select another founder.
- Founder-facing date boundaries default to `Africa/Johannesburg`; timestamps remain UTC ISO-8601. The profile model leaves room for a future per-founder timezone without changing task IDs or storage contracts.
- The model provider remains OpenRouter through the existing backend provider chain. The operator service will not depend on an OpenRouter-specific response shape.
- All timestamps are UTC ISO-8601 strings and all domain record IDs are UUID strings.

## Approaches considered

### Full Supabase replatform now

This would match the long-term architecture immediately, but it requires credentials, schema deployment, auth migration, and Edge Function deployment before the task loop can be validated. It delays the product learning the brief prioritizes and is not selected for this increment.

### Extend FastAPI/Mongo directly

This would be fast initially but would put Mongo queries into the agent and dashboard paths, making the later migration a rewrite. It is rejected because it violates the adapter guardrail.

### Storage-adapter execution engine

The chosen approach keeps the current deployment running while isolating the domain and agent logic behind `FoundryStorageAdapter`. `MongoFoundryStorageAdapter` ships first, `InMemoryFoundryStorageAdapter` supports fast tests and local development, and `SupabaseFoundryStorageAdapter` exposes the same interface with a clearly inactive configuration path for phase two. This gives Foundry a usable daily operating console now and makes the storage migration a bounded implementation task later.

## Architecture

```text
React dashboard
    -> FastAPI operator routes
        -> Foundry Operator service
            -> tool registry + validation + policy layer
                -> FoundryStorageAdapter
                    -> Mongo adapter now
                    -> In-memory adapter for tests
                    -> Supabase adapter later
```

### Domain layer

Create typed domain models for `FounderContext`, `Sprint`, `Task`, `Template`, `Reminder`, `MentorSession`, and `AgentAudit`. Models contain only UUIDs, strings, numbers, enums, lists, dictionaries, and UTC timestamps. Domain helpers own blocker taxonomy, task ranking, task-count limits, status transitions, approval checks, and founder scoping.

### Storage contract

Define a Python protocol named `FoundryStorageAdapter` with these operations:

```python
get_founder_context(founder_id: str) -> FounderContext
get_active_sprint(founder_id: str) -> Sprint | None
list_tasks(founder_id: str, task_date: date | None = None, statuses: list[str] | None = None) -> list[Task]
create_daily_tasks(founder_id: str, tasks: list[TaskDraft]) -> list[Task]
update_task_status(founder_id: str, task_id: str, status: str, reason: str | None, evidence: str | None) -> Task
save_template(input: SaveTemplateInput) -> Template
list_templates(founder_id: str) -> list[TemplateSummary]
schedule_reminder(input: ReminderInput) -> Reminder
log_agent_action(input: AgentAuditInput) -> None
log_mentor_session(input: MentorSessionInput) -> None
```

The contract is the only dependency the operator service has on persistence. Mongo and Supabase implementations translate their own documents/rows at the boundary.

### Mongo adapter

Use collections named `founder_profiles`, `business_sprints`, `daily_tasks`, `task_events`, `operational_templates`, `mentor_sessions`, `agent_audit_log`, and `playbooks`. New documents follow the eventual Supabase-ready fields. Every query includes `founder_id`; legacy profile lookup can read `session_id` only inside the adapter translation method. Use UUID string IDs, UTC timestamps, and bounded reads.

### Supabase adapter

Add an interface-compatible implementation and SQL migration for the eventual tables and RLS policies, but keep activation behind an explicit `FOUNDRY_STORAGE_BACKEND=supabase` setting. The first release defaults to Mongo and does not require Supabase credentials. The Supabase implementation must never put a service-role key in the frontend.

## Foundry Operator service

The service receives `founder_id`, the founder's message, and an optional approval payload. It performs this bounded loop:

1. Load founder context, active sprint, today's tasks, recent completions, templates, playbooks, and the last mentor session.
2. Diagnose one primary blocker using the allowed blocker taxonomy.
3. Rank actions in this order: immediate delivery/invoicing blocker, revenue action, repeatable operating asset, then foundation work.
4. Ask the provider for a structured plan or tool call using the Foundry Operator system prompt.
5. Validate tool names and arguments with strict Pydantic schemas.
6. Enforce policies in Python: maximum three new tasks per founder/day, founder ownership, approval gates, and prohibited-action blocks.
7. Execute writes through the adapter and append an audit record for every attempted tool call. The plan write and its audit record are treated as one operation: if either cannot be committed, the request returns failure and does not report a successful plan.
8. Return a response containing `message`, `bottleneck`, `today_tasks`, `ui_actions`, `status`, `confirmation_required`, and `model`.

The provider adapter supports the current OpenRouter chat-completions chain and a deterministic local fallback for missing/invalid structured output. Provider-specific response parsing stays outside the domain service.

## Allowlisted tools

- `get_founder_context`: read context automatically.
- `search_playbooks`: read trade-specific operational guidance.
- `create_daily_tasks`: write one to three tasks after the server validates count, ownership, and fields.
- `update_task_status`: write status plus reason/evidence; completion requires evidence when appropriate.
- `open_workflow`: return a UI command only; it does not claim a workflow was completed.
- `draft_template`: create an unsaved draft for user review.
- `save_template`: reject unless `user_approved` is exactly `true`.
- `schedule_reminder`: create an in-app reminder visible to the founder.
- `log_mentor_insight`: write diagnosis, blocker, decision, and next milestone.

The registry must not contain tools for external messaging, payments, refunds, contracts, signatures, or account ownership changes.

## API contract

Add storage-agnostic routes under `/api/operator`:

- `GET /context`: founder context, sprint, today's tasks, progress signals, and next action.
- `POST /plan`: load context, run the operator planner, persist tasks/mentor insight, and return structured coach output.
- `GET /tasks`: list founder-owned tasks with optional date/status filters.
- `PATCH /tasks/{task_id}`: update status, blocked reason, or completion evidence.
- `GET /templates`: list founder-owned templates.
- `POST /templates/draft`: generate a reviewable draft without saving it as final.
- `POST /templates`: save only after explicit approval.
- `POST /reminders`: create an in-app reminder through the policy layer.

Each route resolves `founder_id` from the authenticated session where Firebase enforcement is enabled. In development mode, it uses the existing UUID session flow and still scopes every storage call to that UUID. The frontend never sends a different founder ID for these routes.

`POST /plan` is idempotent per founder and South African calendar date. If a plan already exists for the current date, it returns the existing plan and does not create duplicate tasks or consume another model request. The three-task rule applies to the day's active plan, not to later status transitions: once a task is completed, blocked, or deferred it remains part of the day's history and is not silently replaced. New tasks are only added when the plan has fewer than three tasks.

Allowed task transitions are `open -> in_progress`, `open -> blocked`, `open -> deferred`, `in_progress -> completed`, `in_progress -> blocked`, `in_progress -> deferred`, and `blocked/deferred -> in_progress`. A completion requires non-empty completion evidence; a blocked or deferred transition requires a non-empty reason. Reopening a completed task is not allowed in the first increment.

## React execution surface

Replace the Journey room's generated roadmap emphasis with an operating console containing:

- `Today’s Focus`: one to three task cards with priority, category, time estimate, why now, steps, expected output, and definition of done.
- `Current bottleneck`: one sentence from the actual founder context and planner diagnosis.
- `Active sprint`: objective, progress, and target date.
- `Coach panel`: conversation plus real status states: reading profile, checking tasks, structuring plan, preparing template, updating roadmap, and waiting for approval.
- `Operational toolkit`: template drawer with draft, review, approve/save, and open-workflow actions.
- `Progress signals`: completed this week, revenue actions completed, active days, and current stage.

Task-card actions call the API, update the local dashboard state without a full reload, and surface errors as actionable messages. `ui_actions` are applied only when the backend response marks the corresponding write successful.

## Evaluation and tests

Build at least twenty scenario cases covering:

- pre-revenue mechanic with no pricing;
- overwhelmed founder receiving one task;
- completed outreach leading to quote/booking/follow-up;
- no supplier list tied to delivery readiness;
- tax or registration questions with the professional-advice disclaimer;
- requests to email customers being declined with a user-controlled draft;
- task-count limit at zero, one, two, and three tasks;
- duplicate plan requests on the same day;
- blocked/deferred/completed transitions and evidence;
- save-template without approval being rejected;
- cross-founder task/template access being rejected;
- audit records for successful and failed tool calls;
- empty profile, missing sprint, and stale task data;
- provider timeout, invalid structured output, and fallback planning;
- the same domain cases using the in-memory adapter and Mongo adapter.

Run backend unit tests for domain/policy/adapter behavior, API contract tests for the operator routes, and frontend build plus smoke tests for the Journey execution surface. Existing legacy route tests and current chat behavior must remain passing.

## Definition of done

A founder can log in or use the configured local development session, receive a tailored daily plan, open a relevant template, complete or block a task, and see the next recommended action update without a full page reload. The server enforces founder scoping, maximum three daily tasks, approval gates, prohibited-action blocks, UUID/UTC data, and audit logging. The current app still builds and starts, the new operator routes are tested, and Mongo remains the default storage backend with a documented Supabase migration path.

## Builder decisions left open

- Exact React component split and styling should follow the existing Foundry design system.
- Mongo indexes should be selected from actual query patterns and added with bounded, non-destructive startup handling.
- The deterministic fallback planner may use a small rule table derived from the blocker taxonomy; it must preserve the same output schema as the provider path.
- The Supabase adapter may be feature-complete at the interface level while remaining disabled until credentials and migrations are deployed.
