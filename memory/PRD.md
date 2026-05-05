# Vula Engine / Business Launchpad — PRD

## Original problem statement
> i want to use this free models for my ai, https://openrouter.ai/collections/free-models, https://github.com/baloyigranny0-hub/business-launchpad. look at this chat to understand how we building this https://gemini.google.com/share/fcf36178bd29 and how the user is using the app and what kind of entrepreneur are we building for.

User clarifications:
- Use **OpenRouter free models**, default **`google/gemma-4-31b-it:free`** (with auto-fallback chain).
- Audience: **all kinds of entrepreneurs in all industries** (not SA-only).
- GitHub repo `baloyigranny0-hub/business-launchpad` returned 404 — built fresh on existing /app stack.

## Vision
A "Founder's Office" command-center web app with multi-agent AI guides for: ideation → compliance → brand → operations → marketing → sales practice. Tone: 8-year-old logic, no fluff.

## User personas
- Solo founder with just an idea.
- Operator running an existing micro-business needing to formalize.
- Industry: any (food, tech, logistics, hospitality, beauty, services, etc.).

## Tech stack
- Backend: FastAPI + Motor (MongoDB) + httpx (OpenRouter).
- Frontend: React + Tailwind + Phosphor Icons + Framer Motion.
- AI: OpenRouter free chain — gemma-4-31b → gemma-4-26b-a4b → glm-4.5-air → gpt-oss-20b → nemotron-nano-9b.

## Architecture
- `/api` prefix for all backend routes.
- Anonymous session via `localStorage.vula_session_id` (no auth in v1).
- Profile upsert by `session_id` (one founder per session).
- Mongo collections: `profiles`, `chats`, `vault`, `tasks`. All reads use `{_id: 0}`.

## Implemented (May 5, 2026)
- Onboarding wizard (5 steps): name → industry/country → stage → idea → review.
- Sidebar shell with 7 rooms + founder card + collapse + reset.
- Briefing Room: Research Agent (Lean Canvas, competitor scan).
- Legal Desk: Compliance Scout + curated portal directory (CIPC/SARS/COIDA/IR/SEDA + global).
- Design Studio: Brand Agent + Profile Builder (one-click generate company profile).
- Marketing War Room: Marketing Strategist (Strategy A vs B).
- Operations Floor: Systems Agent + SOP Generator + persistent task list.
- Sales Gym: Roleplay coach (skeptical prospect → "coach me" feedback).
- Vault: Save/list/view/download(.md)/delete agent outputs.
- Markdown rendering (headings, lists, tables, code, links, blockquotes).
- 18/18 backend tests passed (iteration_1.json).

## Backlog
- P1: Auth + multi-device sync.
- P1: PDF export from Vault (currently .md).
- P1: Per-session AI rate-limit (protect free-tier quota).
- P2: Daily Briefing card on a Home/Today route with deadline alerts.
- P2: Industry-specific deep-dive packs (poultry, barber, honey, etc.).
- P2: Government portal "handover" wizard with copy-paste assistant.
- P3: Offline mode / on-device inference.
- P3: Funding & grants directory by country/industry.

## Next tasks
- Hook a daily reminder/briefing card.
- Add PDF export for company profile and roadmap.
