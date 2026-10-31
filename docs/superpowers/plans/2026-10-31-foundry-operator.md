# Foundry Operator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a storage-adapter-backed Foundry Operator that turns a founder's real operating state into an auditable daily plan of no more than three revenue-moving tasks, with task lifecycle controls, templates, and a React execution console.

**Architecture:** Keep the existing FastAPI + MongoDB deployment and legacy routes working. Add typed domain models, a `FoundryStorageAdapter` protocol, in-memory/Mongo/Supabase-compatible adapters, a policy-enforcing operator service, and `/api/operator` routes. The Journey room consumes only those routes and renders Today’s Focus, coach status, sprint, progress, and template workflows.

**Tech Stack:** Python 3.11+, FastAPI 0.110, Pydantic 2, Motor-compatible Mongo adapter, `httpx` OpenRouter provider adapter, React 19 + CRACO, existing Phosphor icon system, pytest, and the existing Tailwind/CSS design system.

**Spec:** `docs/superpowers/specs/2026-10-31-foundry-operator-design.md`

## Global Constraints

- The current FastAPI + MongoDB deployment remains the default; no Lovable credits or Lovable-only implementation is required.
- The adapter boundary is mandatory: domain/services/routes cannot import Mongo types or call collections directly.
- Every domain record uses a UUID string and UTC ISO-8601 timestamps.
- Founder-facing day/week calculations use `Africa/Johannesburg` by default.
- Firebase UID is mapped to an internal UUID `founder_id`; the frontend never selects a different founder ID.
- A daily plan is idempotent per founder and South African calendar date.
- The active daily plan contains at most three tasks; later status changes do not create replacements automatically.
- `blocked` and `deferred` require a reason; `completed` requires non-empty completion evidence; completed tasks cannot be reopened in this increment.
- Final template saves require `user_approved == true`.
- External messages, payments, refunds, contracts, signatures, and account ownership changes are prohibited tools.
- Plan writes and their audit records must be committed together or reported as failed.

## Review Focus

- Firebase UID to internal UUID mapping: requests must resolve the same founder and reject cross-founder access. Test in Task 2.
- Johannesburg date rollover: a late-night founder must receive the correct `task_date` and daily idempotency key. Test in Task 1.
- Concurrent/repeated plan generation: no duplicate tasks or model calls may be created for the same founder/date. Test in Tasks 2 and 3.
- Status evidence and reason requirements: invalid transitions return a clear validation error without mutating state. Test in Tasks 1 and 3.
- Provider failure/invalid JSON: the API must return a usable deterministic plan or an explicit failure state without claiming a write succeeded. Test in Task 3.

### Task 1: Add Foundry Operator domain models, policies, and adapter contract

**Files:**
- Create: `backend/foundry_operator/__init__.py`
- Create: `backend/foundry_operator/domain.py`
- Create: `backend/foundry_operator/storage.py`
- Create: `backend/foundry_operator/policies.py`
- Test: `backend/tests/foundry_operator_domain_test.py`

**Interfaces:**
- Produces `FounderContext`, `Sprint`, `Task`, `TaskDraft`, `Template`, `TemplateSummary`, `Reminder`, `MentorSession`, `AgentAudit`, `AgentPlan`, and request/input models.
- Produces `FoundryStorageAdapter` as a Python `Protocol` with typed methods for context, sprint, tasks, templates, reminders, mentor sessions, and audit actions.
- Produces policy functions `daily_task_date(now=None)`, `validate_task_status_transition(current, target, reason, evidence)`, `validate_daily_task_count(existing, incoming)`, and `assert_template_approval(approved)`.

- [ ] **Step 1: Write failing domain tests** for `Africa/Johannesburg` date calculation, UUID/UTC defaults, valid/invalid status transitions, reason/evidence requirements, maximum-three task validation, and rejected unapproved template saves.
- [ ] **Step 2: Run `python -m pytest backend/tests/foundry_operator_domain_test.py -q`** and confirm the new symbols are missing or assertions fail.
- [ ] **Step 3: Implement the Pydantic domain models and adapter protocol** with explicit enums for blocker, category, revenue proximity, status, source, and template type. Keep Mongo-free imports.
- [ ] **Step 4: Implement policy helpers** with a module-level timezone constant `Africa/Johannesburg`, UUID validation, and the exact allowed transitions from the design.
- [ ] **Step 5: Run the focused test file again** and confirm all domain/policy tests pass.
- [ ] **Step 6: Commit** with `git add backend/foundry_operator backend/tests/foundry_operator_domain_test.py && git commit -m "feat: add Foundry Operator domain contract"`.

### Task 2: Implement in-memory, Mongo, and Supabase-compatible storage adapters

**Files:**
- Create: `backend/foundry_operator/memory_storage.py`
- Create: `backend/foundry_operator/mongo_storage.py`
- Create: `backend/foundry_operator/supabase_storage.py`
- Create: `backend/migrations/20261031_foundry_operator.sql`
- Modify: `backend/server.py` (storage selection and legacy profile-to-founder mapping only)
- Test: `backend/tests/foundry_operator_storage_test.py`

**Interfaces:**
- Consumes all domain models and the `FoundryStorageAdapter` contract from Task 1.
- Produces `InMemoryFoundryStorageAdapter`, `MongoFoundryStorageAdapter`, and `SupabaseFoundryStorageAdapter` with identical method signatures.
- Produces `get_foundry_storage()` that selects `FOUNDRY_STORAGE_BACKEND=memory|mongo|supabase`, defaulting to Mongo without requiring Supabase credentials.

- [ ] **Step 1: Write adapter contract tests** that run the same scenarios against the in-memory adapter and a Mongo test double: create/update profile, load context, list/filter tasks, idempotent same-day task creation, template draft/save, reminders, mentor session, and audit success/failure.
- [ ] **Step 2: Run the focused adapter tests** and confirm no adapter implements the protocol yet.
- [ ] **Step 3: Implement the in-memory adapter** with founder-scoped dictionaries, UUID generation, UTC timestamps, daily-plan idempotency, and atomic plan-plus-audit behavior.
- [ ] **Step 4: Implement the Mongo adapter** using the existing `db` collection interface, collection names from the design, bounded queries, UUID string IDs, `founder_id` in every query, and an idempotency key for founder/date. Do not return raw Mongo documents.
- [ ] **Step 5: Implement the Supabase-compatible adapter** with the same interface and explicit configuration errors until a Supabase client is configured; add SQL tables, foreign keys, indexes, and RLS policies for the eventual migration without enabling it by default.
- [ ] **Step 6: Update server startup selection** so existing `db` behavior and legacy routes remain unchanged, while operator routes can receive the selected adapter. Add internal founder mapping fields without changing the public legacy profile response.
- [ ] **Step 7: Run adapter tests and the existing `backend/tests/backend_test.py` suite** with the in-memory test mode and inspect that no `_id` or Mongo type leaks.
- [ ] **Step 8: Commit** with `git add backend/foundry_operator backend/migrations backend/server.py backend/tests/foundry_operator_storage_test.py && git commit -m "feat: add Foundry storage adapters"`.

### Task 3: Build the policy-enforcing Foundry Operator service and tool registry

**Files:**
- Create: `backend/foundry_operator/provider.py`
- Create: `backend/foundry_operator/tools.py`
- Create: `backend/foundry_operator/service.py`
- Modify: `backend/agents.py` (add the Foundry Operator system prompt without changing existing agents)
- Test: `backend/tests/foundry_operator_service_test.py`

**Interfaces:**
- Consumes `FoundryStorageAdapter` and domain/policy functions from Tasks 1–2.
- Produces `FoundryOperator.plan(founder_id, message, approval=None) -> OperatorResponse`, `update_task(...)`, `draft_template(...)`, `save_template(...)`, and `create_reminder(...)`.
- Produces strict tool schemas for `get_founder_context`, `search_playbooks`, `create_daily_tasks`, `update_task_status`, `open_workflow`, `draft_template`, `save_template`, `schedule_reminder`, and `log_mentor_insight`.

- [ ] **Step 1: Write failing service/evaluation tests** for the twenty required scenarios, including mechanic pre-revenue, overwhelmed founder, post-outreach follow-up, tax disclaimer, external-message refusal, duplicate plans, all status evidence rules, cross-founder rejection, audit records, empty context, invalid provider output, timeout fallback, and adapter parity.
- [ ] **Step 2: Run the focused service tests** and confirm planner/tool symbols are absent.
- [ ] **Step 3: Implement the provider adapter** around the existing OpenRouter chain using one strict JSON envelope containing `message`, `bottleneck`, `tasks`, `ui_actions`, `confirmation_required`, and optional tool calls. Normalize provider output and use a deterministic blocker-based planner when the provider times out or returns invalid JSON.
- [ ] **Step 4: Implement the tool registry** with Pydantic input validation, an explicit deny-list for prohibited actions, ownership checks, maximum-three enforcement, template approval gates, and audit input/result summaries.
- [ ] **Step 5: Implement the operator service loop** to load context, diagnose, plan, execute allowlisted tools through the adapter, persist mentor insight, and return the structured response without provider-specific fields.
- [ ] **Step 6: Make plan generation idempotent** by reading the current Johannesburg task date before calling the provider and returning the existing plan when the date already has a plan; preserve founder-edited task status and evidence.
- [ ] **Step 7: Run the service/evaluation tests** and confirm all scenarios pass against the in-memory adapter.
- [ ] **Step 8: Commit** with `git add backend/foundry_operator backend/agents.py backend/tests/foundry_operator_service_test.py && git commit -m "feat: add Foundry Operator planning service"`.

### Task 4: Add storage-agnostic `/api/operator` routes and authentication scoping

**Files:**
- Create: `backend/foundry_operator/routes.py`
- Modify: `backend/server.py` (include operator router and internal Firebase-to-founder resolver)
- Test: `backend/tests/foundry_operator_api_test.py`

**Interfaces:**
- Consumes `FoundryOperator`, `get_foundry_storage()`, and existing `enforce_firebase_session` behavior.
- Produces `GET /api/operator/context`, `POST /api/operator/plan`, `GET /api/operator/tasks`, `PATCH /api/operator/tasks/{task_id}`, `GET /api/operator/templates`, `POST /api/operator/templates/draft`, `POST /api/operator/templates`, and `POST /api/operator/reminders`.
- API responses contain only JSON-safe domain fields and the structured operator response.

- [ ] **Step 1: Write failing API tests** for route status/shape, local UUID context, Firebase UID mapping, cross-founder access rejection, idempotent plan response, valid/invalid status updates, template approval, reminder creation, and safe error responses.
- [ ] **Step 2: Run the focused API tests** and confirm the operator routes return 404.
- [ ] **Step 3: Implement route request/response models** and dependency injection for the adapter and operator service. Resolve the internal UUID from Firebase UID when auth is enforced; never accept `founder_id` from the browser as authority.
- [ ] **Step 4: Include the router in the existing FastAPI app** without changing legacy route paths, CORS behavior, health response, or existing Firebase custom-token flow.
- [ ] **Step 5: Run focused API tests plus existing backend tests** with a controlled in-memory backend and confirm the old API behavior remains passing.
- [ ] **Step 6: Commit** with `git add backend/foundry_operator/routes.py backend/server.py backend/tests/foundry_operator_api_test.py && git commit -m "feat: expose Foundry Operator API"`.

### Task 5: Replace Journey with the daily execution console

**Files:**
- Create: `frontend/src/components/operator/TaskCard.jsx`
- Create: `frontend/src/components/operator/TodayFocus.jsx`
- Create: `frontend/src/components/operator/OperatorCoachPanel.jsx`
- Create: `frontend/src/components/operator/TemplateDrawer.jsx`
- Create: `frontend/src/components/operator/ProgressSignals.jsx`
- Create: `frontend/src/lib/operatorApi.js`
- Modify: `frontend/src/rooms/Journey.jsx`
- Modify: `frontend/src/lib/api.js` only for shared auth/error behavior if needed
- Test: `frontend/src/rooms/Journey.test.jsx` or the project’s existing frontend smoke test location

**Interfaces:**
- Consumes the JSON contracts from Task 4 through `operatorApi.js`; components never call Mongo or legacy task routes directly.
- Produces a Journey view with Today’s Focus, current bottleneck, active sprint, coach panel, template drawer, progress signals, and no-full-reload task updates.

- [ ] **Step 1: Write failing UI tests or a DOM smoke harness** for loading state labels, rendering one-to-three task cards, completing/blocking/defering with required input, template approval flow, error states, and applying only successful `ui_actions`.
- [ ] **Step 2: Run the focused frontend test command** and confirm the new components/tests fail before implementation.
- [ ] **Step 3: Implement `operatorApi.js`** with `getOperatorContext`, `createDailyPlan`, `updateOperatorTask`, `listOperatorTemplates`, `draftOperatorTemplate`, `saveOperatorTemplate`, and `createOperatorReminder`, using the existing Axios instance and auth interceptor.
- [ ] **Step 4: Implement task cards and Today’s Focus** with explicit status controls, evidence/reason dialogs/inputs, priority/time display, definition of done, and optimistic UI only after API success.
- [ ] **Step 5: Implement coach/status panel and template drawer** with real backend state labels, approval required before final save, and prohibited-action messaging for external communication requests.
- [ ] **Step 6: Implement progress signals and rewrite Journey** to load operator context, request an idempotent plan, update in place after task changes, and keep a small legacy roadmap fallback only when the operator endpoint is unavailable.
- [ ] **Step 7: Run frontend tests and `npm.cmd run build`** from `frontend` and verify there are no compile errors or hardcoded backend URLs.
- [ ] **Step 8: Commit** with `git add frontend/src/components/operator frontend/src/lib/operatorApi.js frontend/src/rooms/Journey.jsx frontend/src/lib/api.js frontend/src/rooms/Journey.test.jsx && git commit -m "feat: add Foundry daily execution console"`.

### Task 6: Run end-to-end verification and package migration documentation

**Files:**
- Create: `docs/superpowers/evaluations/2026-10-31-foundry-operator-scenarios.md`
- Modify: `README.md`
- Modify: `frontend/README.md` if local operator setup needs documenting
- Modify: `test_result.md` only with fresh verification evidence

**Interfaces:**
- Consumes all backend/frontend contracts from Tasks 1–5.
- Produces a reproducible local runbook, evaluation scenario list/results, and verification evidence for build, tests, health, context, plan, status update, and template approval.

- [ ] **Step 1: Run the full backend test suite** with the prescribed environment and record exit code plus failure count.
- [ ] **Step 2: Run the full frontend build and available frontend tests** and record output.
- [ ] **Step 3: Start the backend in memory mode and frontend dev server** in separate sessions; verify `GET /api/` returns Foundry status, `GET /api/health` returns database/auth/model metadata, and the frontend returns HTTP 200.
- [ ] **Step 4: Exercise the operator flow** with a test founder: context -> plan -> task completion with evidence -> context refresh; verify task status, next action, and audit record behavior.
- [ ] **Step 5: Verify security cases**: cross-founder task ID, more than three tasks, unapproved template, prohibited external message, missing blocker reason, and missing completion evidence all fail without mutation.
- [ ] **Step 6: Document the default Mongo path and the future Supabase activation/migration steps** without asking Lovable to build or deploy anything.
- [ ] **Step 7: Run `git diff --check`, `git status --short --branch`, and review the diff for secrets or tunnel URLs before any push.**
- [ ] **Step 8: Commit** with `git add docs README.md frontend/README.md test_result.md && git commit -m "docs: verify Foundry Operator release"`.

## Execution Notes

Tasks 1–4 are backend-critical and should be completed in order. Task 5 can begin after Task 4’s response contracts are stable. Task 6 is the release gate. Use native execution in this session unless a fresh reviewer is requested; every task must end with its focused test before the next task begins.
