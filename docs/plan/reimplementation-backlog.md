# Re-implementation Backlog (v0.0.2)

> Created: 2026-06-21 · Last updated at commit: `3a0bf19`
> Competition submission = `v0.0.1` tag. Scoring feedback [../FEEDBACK.md](../FEEDBACK.md), retrospective [../RECALL.md](../RECALL.md).

Re-implementation order: **0 cleanup (done) → 1 missing ideas → 2 feedback TODOs → 3 UI improvements**.

---

## Progress (2026-06-21)

| Item | Status | Commit |
|---|---|---|
| Stage 0 cleanup (archive move · static untracked · AGENTS cleanup) | ✅ Done | `8cd0882`, `cfefcf2` |
| Stages 1·2·3 itemized (this document) | ✅ Done | `56ae78b` |
| 2.1 Auth — passphrase + signed session cookie | ✅ Done | `4560185` |
| 3.1·3.2 UI mockup — Design DNA + ASCII redesign | ✅ Done | `3a0bf19` |
| 2.2 Soft delete + undo | ✅ Done | `84faad1`, `0198bad` |
| 2.3 Secret Key Vault-ification (UAMI + KV + ACR MI pool) | ✅ Done | `1db94be` |
| 2.4 Prompt injection defense explicit (input sanitization + detection + trust boundary) | ✅ Done | (this session) |
| **Next** | Track C: 3.3 design decision consensus·3.4 token unification · Track E: 2.6-2.7 Copilot SDK completeness | — |

> `main` is ahead of `origin/main` (unpushed). Run tests: `cd backend && uv run python -m pytest -q`
> (no bare `python`/`pip` in PATH — always use `uv run`). Auth implementation details in repo memory
> `/memories/repo/verified-facts.md` under "Auth (2.1)".

---

## Stage 1 — Ideas > PRD > OpenAPI Missing Items

Items present in the original concept ([../ideation/README.md](../ideation/README.md)) but weakened
or dropped in PRD/OpenAPI/implementation.

| # | Missing/weakened idea | Concept source | Current state | Notes |
|---|---|---|---|---|
| 1.1 | **5-slot working memory protection** — "max 5 items in front at once" | ideation "max five" | Not UX-enforced (inbox unlimited) | 5±2 slot concept exists only in README background |
| 1.2 | **AI autonomous pre-research (real external lookup)** | ideation "researches on behalf of the person" | Single call with tool form only, no external search | Common point in RECALL/FEEDBACK |
| 1.3 | **Weekly trigger as actual scheduled batch** | PRD 3.2 "Scheduled batch on weekday+time" | Only `POST /suggestions/run` manual call | No real scheduler |
| 1.4 | **Embedding similarity ranking (dump ≥ 5)** | PRD 3.2 "embedding similarity" | Fixed phrases/simple priority | Not implemented |
| 1.5 | **Load gate (calendarBusy=false & emotion≠bad)** | PRD 3.2 load gate | Partial implementation (needs verification) | Trigger condition validation needed |
| 1.6 | **Human-decision preservation for info_gap pre-research results** | ideation "planning·integration is the human's job" | Decision button exists | Pre-research failure silently ignored (needs improvement) |

> Next session action: promote the table above to explicit requirements in the PRD rewrite,
> and reflect each item in OpenAPI contract/scheduler design.

---

## Stage 2 — Scoring Feedback → Action Items

Based on per-item scores from [../FEEDBACK.md](../FEEDBACK.md). **Responsible AI/Security/Trust is the only 3-point item**.

### P0 — Trust/Security (3 points, highest priority)
- [x] 2.1 **Add auth/authorization** — passphrase + signed session cookie (Starlette `SessionMiddleware`,
  HttpOnly·Secure·SameSite=Strict). Auth gate middleware on `/api/*`·`/health/ai` (allowlist),
  `/api/auth/{login,logout,session}`, frontend login gate+401 handling, bicep secret injection.
  Open mode when `APP_PASSPHRASE` unset (local). `/docs` off by default via `ENABLE_DOCS`.
- [x] 2.2 **Destructive action confirmation** — soft delete (tombstone)+undo. `ideas.deleted_at` column
  +migration, delete=tombstone·excluded from list, `POST /api/ideas/{id}/restore` (undo),
  internal `purge_deleted()` cleanup helper. Frontend: optimistic removal + 10-second glass undo toast
  (Design DNA glass surface). Updated openapi.yaml/json, 4 backend tests added (38 passing).
- [x] 2.3 **Secret management** — User-Assigned Managed Identity + Key Vault (RBAC). App secrets
  (`aoai-api-key`/`app-passphrase`/`session-secret`) plaintext injection → Key Vault storage·UAMI reference
  (`keyVaultUrl`). ACR `adminUserEnabled:false` + UAMI `AcrPull` for MI pool (removes admin secret).
  `deploy-aca.sh`: grant deployer `Key Vault Secrets Officer` at RG scope + enable ARM token auth.
- [x] 2.4 **Prompt injection defense explicit** — tool schema dependence → explicit guard module
  (`app/prompt_guard.py`). Input sanitization (NFKC·control char removal·delimiter escape neutralization·length cap),
  injection detection (EN/KO override·role·reveal pattern logging), trust boundary delimiter+guard preamble
  declares "data only, not instructions." Applied to all LLM prompt paths in `judgment.py`·`research.py`
  (SDK judgment·SDK pre-research sync/stream·Azure direct fallback). Stored original unchanged,
  sanitized copy only sent to model. 14 tests added (`tests/test_prompt_guard.py`, 52 passing).

### P1 — Copilot SDK / Feature Completeness (4 points each)
- [x] 2.5 **Tools perform real external search** — Tavily `web_search` tool added + multi-turn agent loop
  (enforced order: web_search → collect_materials → frame_options, includes real URLs). (linked to 1.2)
- [ ] 2.6 **Weekly recommendation real scheduler + embedding ranking** (linked to 1.3·1.4)
- [ ] 2.7 **Tests cover actual Copilot SDK path** — current tests are heuristic-bypass centric

### P2 — Cloud/UX/Impact (4 points each)
- [x] 2.8 **Azure OpenAI as IaC** — bicep includes AOAI account+`gpt-4o` deployment (`createAoai` toggle for
  new/existing, same-name account absorbed idempotently). KV secret `aoai-api-key` filled via `listKeys()`,
  eliminating manual key injection by deployer (removed `aoaiApiKey`/`aoaiEndpoint` parameters; endpoint
  derived from resource). `deploy-aca.sh`: removed key/endpoint injection logic + registered `Microsoft.CognitiveServices`.
- [ ] 2.9 **UX control mechanisms** — explicit label for input, pre-research failure exposure, AI task cancel/decision reversal
- [ ] 2.10 **Productivity quantitative evidence** — saved time/reduced steps/error prevention metrics
- [ ] 2.11 **`azd up` one-line deploy wrapper** — `azure.yaml` + reuse existing `infra/main.bicep`
  for azd convention packaging. Keep **only one** of the current `scripts/deploy-aca.sh` path (avoid duplication).

---

## Stage 3 — docs/assets Photo-Based UI Improvements

> New screenshots/sketches in [../assets/](../assets) (latest: `2026-06-21 20.58.05.png`, `20260621_*`).
> Design DNA [../design/design-dna.md](../design/design-dna.md),
> ASCII mockup [../design/ui-redesign-ascii.md](../design/ui-redesign-ascii.md) complete.

- [x] 3.1 Review assets images, list improvement items → formalized as Design DNA document
- [x] 3.2 Compare with current screens (Capture/Inbox/Settings) → ASCII mockup §5 change summary
- [ ] 3.3 Resolve 4 open decisions (light/dark·accent·serif·background intensity, DNA §6)
- [ ] 3.4 Reflect tokens·component code (5-slot gauge, glass surface, 203241 card template)
- [ ] 3.5 Integrate with stage 2 item 2.9 (UX control mechanisms)
