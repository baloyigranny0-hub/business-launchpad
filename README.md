# Here are your Instructions

## Foundry Operator

The Journey room is now a daily execution console backed by the `backend/foundry_operator` adapter boundary. MongoDB remains the default deployment store; `FOUNDRY_STORAGE_BACKEND=memory` is intended for deterministic local checks, and `supabase` is an explicit later migration path.

Production configuration should provide `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, and Firebase credentials when auth enforcement is enabled. Keep all provider and storage keys on the server. The frontend only receives `/api/operator` JSON responses.

See `docs/superpowers/evaluations/2026-10-31-foundry-operator-scenarios.md` for the verification record and migration notes.
