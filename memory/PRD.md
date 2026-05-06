# Foundry — AI Command Center for Entrepreneurs

## Original problem statement
Use free OpenRouter models for an entrepreneurship-coaching app. Audience: all entrepreneurs in all industries. Brand renamed from "Vula Engine" to **Foundry**.

## Vision
A "Founder's Office" web app with multi-agent AI guides for: ideation → compliance → brand → operations → marketing → sales practice. Tone: 8-year-old logic, no fluff, anti-hallucination guardrails on every agent.

## Tech stack
- Backend: FastAPI + Motor (MongoDB) + httpx (OpenRouter).
- Frontend: React + Tailwind + Phosphor Icons + Framer Motion. PWA-ready.
- AI: OpenRouter free fallback chain (11 models): gemma-4-31b → gemma-4-26b → gpt-oss-120b → gpt-oss-20b → glm-4.5-air → minimax-m2.5 → hy3-preview → nemotron-3-super-120b → nemotron-3-nano-30b → nemotron-nano-9b → openrouter/auto.

## Implemented
- 5-step onboarding (30 industries inc. Engineering, NPO/NGO, Mining, Pharmacy, Insurance, etc.)
- 7 rooms: Briefing, Legal Desk, Design Studio (Brand + Profile Builder), Marketing War Room, Operations Floor (Systems + SOP + Task list), Sales Gym, Vault.
- Multi-agent chat (9 agents) with anti-hallucination guardrails (must say "I'm not sure", must end legal/compliance with "Confirm with a licensed professional").
- 11-model fallback chain (auto-switches when one is rate-limited or down).
- Privacy Policy + Terms of Service pages (POPIA/GDPR/CCPA-ready language).
- SEO: title, description, Open Graph, Twitter Card, JSON-LD SoftwareApplication schema, robots.txt, sitemap.xml.
- PWA: manifest.json, theme-color, apple-touch-icon, installable on iOS/Android home screen.
- Foundry brand: anvil + spark gold logo, favicon.svg.
- AI thinking indicator with elapsed-seconds counter.
- Footer disclaimer "AI may make mistakes. Verify with a licensed professional."

## Test status
- Iteration 1: 18/18 passed.
- Iteration 2: 20/20 passed (rebrand, guardrails, fallback, fallback-on-unknown-agent).

## Backlog (P1 → P2)
- Voice input (Web Speech API) for chat & onboarding.
- Diagnostic intake (registered? knowledge level?) → personalized "Your Journey" room.
- PDF export from Vault.
- Per-session AI rate-limit guard.
- Short-circuit OpenRouter on 401/403 (don't burn fallback chain on bad key).
- Optional: GET /api/chats history endpoint.
- Native Play Store / App Store wrap (Capacitor) for v2.
- Industry-specific deep-dive packs (poultry, barber, honey, EV, NPO, etc.).

## Known minor
- Preview gateway can 502 on first request after idle (cold start). Retries succeed.
