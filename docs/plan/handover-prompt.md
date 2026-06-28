# Session Handover — lipcoding-tae0y (Working Memory Inbox)

> Paste this as the first message of the next session to carry over context.
> Created: 2026-06-28 · HEAD at handover: `1d369ba` (tag `v0.0.2`)

## One-Line Definition

Throw in an idea and AI (Copilot SDK + Azure OpenAI) judges "can I start this now?"
to classify it as inbox or dump. For dump items tagged `info_gap`, AI does pre-research.
Once a week, when load is low, it proposes one item — the human makes the final decision.

## Stack / Deployment

- Backend: FastAPI + Copilot SDK (Python) + SQLite — `backend/`
- Frontend: React + TS + Tailwind v4 — `frontend/` (build output in `backend/static`, gitignored)
- Deploy: Azure Container Apps via `export APP_PASSPHRASE=<secret> && bash scripts/deploy-aca.sh`
  - The script builds the image locally with Docker, pushes to ACR, then runs
    `az deployment group create` against `infra/modules/resources.bicep` (resource-group scope).
  - URL: <https://lipcoding-api.livelyforest-913242f3.eastus2.azurecontainerapps.io/>
  - Login passphrase: `dudco` (`APP_PASSPHRASE`)

## Current State

- `HEAD` = `1d369ba`, tag `v0.0.2` points here (pushed to remote). `main` == `origin/main`.
- Work completed in the previous session:
  1. Fixed deployment scope error (`main.bicep` subscription scope →
     `resources.bicep` resource-group scope to match `az deployment group create`).
  2. Migrated from deprecated `gpt-4o` to **`gpt-5-mini`** (GA, `GlobalStandard`,
     version `2025-08-07`, api `2025-04-01-preview`). Adapted code for the reasoning
     model: `max_tokens` → `max_completion_tokens`, removed `temperature`
     (`backend/app/main.py`, `backend/app/research.py`).
  3. Fixed a frontend bug where data was fetched before authentication, producing a
     stale 401 "connection unstable" banner. Added an `enabled` gate to the three hooks
     (`useIdeas` / `useUserState` / `useSuggestion`) so they fetch only after auth is
     confirmed. Verified with Playwright on the live deployment.

## Next Task (Goal for This Session)

**The AI gate judgment is actually failing and silently falling back to the heuristic.**
Recurring server log line:

```text
SDK 판정 실패, 휴리스틱 폴백: failed
```

- Location: `backend/app/judgment.py:124-125`
  (`except Exception as exc` → `logger.warning("SDK 판정 실패, 휴리스틱 폴백: %s", exc)`).
- SDK call site: `judgment.py:94` — `async with CopilotClient() as client:` + `create_session(...)`.
- BYOK setup: `config.configure_copilot_cli_byok()` at the top of `backend/app/main.py`
  (runs once at import). The Azure provider comes from `_provider()` in
  `judgment.py` / `research.py` plus the `AZURE_OPENAI_*` env vars.
- The exception currently logs only as `failed`, so the root cause is hidden. **First,
  log the full stack trace** — temporarily change `logger.warning(..., exc)` to
  `logger.exception(...)`, or reproduce in a debug environment.

### Hypotheses (to verify)

1. The container lacks the Copilot CLI runtime/bundle, or BYOK auto-login
   (`--no-auto-login`) is not configured. `research.py`'s `_make_client()` handles this
   with `use_logged_in_user=False`, but `judgment.py:94` calls a bare `CopilotClient()`.
   **`judgment.py` likely needs the same BYOK branch.** (Strong candidate.)
2. After switching to `gpt-5-mini`, the SDK path fails due to reasoning-model
   parameter/model-name incompatibility.
3. Confirm `AZURE_OPENAI_DEPLOYMENT=gpt-5-mini` is actually passed through to the SDK provider.

### Debugging Steps

- Logs: `az containerapp logs show -n lipcoding-api -g rg-lipcoding --tail 100 --type console`
- AI health: `curl https://<FQDN>/health/ai` (direct `AzureOpenAI` path — if this works,
  only the SDK path is broken).
- Isolate the direct path (`research.py` `_azure_research_sync`) vs the SDK path to see
  which one dies.
- Local repro: set `AZURE_OPENAI_*` in `backend/.env`, then
  `cd backend && uv run python -m pytest -q` (no bare `python`/`pip` in PATH — always use
  `uv run`). Note: tests bypass the SDK path, so they are insufficient to validate the SDK.

## Cautions

- Each redeploy regenerates `SESSION_SECRET`, invalidating existing browser sessions
  (re-login required). For stable sessions, `export SESSION_SECRET=<fixed value>`.
- Commit only the files actually changed in the session, staged explicitly (no `git add -A`).
- References: `docs/research/copilot-sdk.md`, repo memory `/memories/repo/verified-facts.md`.
