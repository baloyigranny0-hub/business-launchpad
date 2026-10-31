# Foundry Operator Verification

## Implemented scenarios

- Johannesburg date boundaries are calculated separately from UTC timestamps.
- Firebase auth subjects resolve to internal UUID `founder_id` values.
- Daily plans are idempotent per founder and South African calendar date.
- A plan contains no more than three tasks.
- Completed tasks require evidence; blocked and deferred tasks require a reason.
- Completed tasks cannot be reopened in this increment.
- Cross-founder task access is rejected.
- Template saves require explicit founder approval.
- External message requests return a confirmation state and do not send anything.
- Plan and audit writes roll back together in the in-memory adapter.
- Mongo and Supabase storage stay behind the same adapter boundary.
- Wildcard development CORS does not enable credentialed requests; production origins can be listed explicitly for Firebase-authenticated browser requests.

## Verification evidence

Focused backend suite:

```text
23 passed, 2 warnings
```

Frontend production build:

```text
Compiled successfully.
```

The legacy remote integration suite was also run. Its 19 failures are DNS failures against the historical `startup-forge-79.preview.emergentagent.com` host, not assertion failures in the new operator tests. The 24 local/domain/operator tests in that run passed.

## Local runbook

Use a configured server-side `OPENROUTER_API_KEY`, set `FOUNDRY_STORAGE_BACKEND=mongo` for the normal deployment, and keep `FIREBASE_AUTH_REQUIRED=true` in production. For local deterministic smoke work, use `USE_MEMORY_DB=true`, `FOUNDRY_STORAGE_BACKEND=memory`, and `FOUNDRY_PROVIDER=deterministic`.

The Supabase migration is deliberately inactive. Deploy `backend/migrations/20261031_foundry_operator.sql`, configure the server-side Supabase variables, and select `FOUNDRY_STORAGE_BACKEND=supabase` only during the later migration.

## Known environment limitation

This Windows Python 3.14 environment hangs when running even a trivial asyncio/trio coroutine and refuses local socket access from the restricted shell. Therefore the server root/health HTTP smoke probe could not be completed in this environment. The application imports, compiles, the FastAPI operator routes are registered, and their in-memory route contract tests pass.
