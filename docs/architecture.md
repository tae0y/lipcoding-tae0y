# Architecture & Technical Depth

> The product overview lives in the [README](../README.md). This document is for
> anyone who wants to look one level deeper into **how the Copilot SDK is used** and
> **how the app is deployed on Azure**.

---

## 1. Copilot SDK Usage — A Tool Agent, Not a One-Shot Call

Both AI behaviors in this app are built on the **session + tool-call + (optional)
streaming** pattern. Instead of free-form prose, the model **invokes defined tools**,
which keeps the reasoning traceable and the output schema stable.

### 1.1 Entry Judgment — Two Tools for Two Factors

[backend/app/judgment.py](../backend/app/judgment.py)

```text
CopilotClient.create_session(
    tools = [ evaluate_info_readiness, evaluate_capacity ],
    provider = Azure OpenAI,
)
        │
        ├─ evaluate_info_readiness  →  "Is a concrete next action identifiable?"
        └─ evaluate_capacity        →  "Is there capacity right now? (evening · mood)"
        │
        ▼
   { status: inbox | dump, dumpReason: info_gap | no_capacity }
```

- If either information readiness OR capacity is lacking, it becomes `dump`.
- Missing information is the priority reason (`info_gap`); lacking only capacity is `no_capacity`.
- **Fallback:** when `SKIP_COPILOT_SDK=1` or an SDK call fails, it automatically
  degrades to a keyword/length heuristic — so the app survives a model outage during a demo.

### 1.2 Auto Research — Two Tools + SSE Streaming

[backend/app/research.py](../backend/app/research.py)

```text
CopilotClient.create_session(
    tools = [ collect_materials, frame_options ],
    streaming = True,
)
        │
        ├─ collect_materials  →  3–5 materials (fact · url)
        └─ frame_options      →  2–4 options / frames   (no single recommendation)
        │
        ▼  session.on(event)  ── ASSISTANT_MESSAGE_DELTA ──▶ SSE delta
        ▼  SESSION_IDLE ──────────────────────────────────▶ SSE result
   Research{ materials[], options[] }
```

- Token deltas are collected through an `asyncio.Queue` and streamed out via
  `EventSourceResponse` (SSE) — so the user watches the research happen **in real time**.
- **The line:** instructions like "do X next" are **deliberately not generated.**
  Only materials and options — the final decision stays with the human (augment, not replace).

### 1.3 SDK Design Principles

| Decision | Why |
|------|------|
| **Tool calls** instead of free-form prose | Stable output schema + traceable reasoning |
| **Streaming** for research | Less perceived wait + transparent progress |
| Built-in **heuristic fallback** | Availability under model/network failure |
| **No decision tool** | Enforces the "no human replacement" rule in code |

---

## 2. Azure Cloud Deployment Architecture

### 2.1 Overall Layout — Single Container, Zero CORS

```text
                    User's browser
                       │  HTTPS
                       ▼
┌───────────────────────────────────────────────────────────┐
│  Azure Container Apps (Linux, FastAPI + built SPA)          │
│  uvicorn → FastAPI (app.main:app), ingress :8000            │
│                                                            │
│   GET /            ──▶ serves the built SPA (index.html)    │
│   GET /api/*       ──▶ REST API (auth-gated)               │
│      └─ judgment / research / suggestions                   │
│                       │                                    │
│        ┌──────────────┼───────────────┐                    │
│        ▼              ▼                ▼                    │
│   Copilot SDK /   SQLite file      /health/ai               │
│   Azure OpenAI    (container FS)    (model liveness check)   │
└────────┬───────────────┬───────────────┬───────────────────┘
         │ image pull      │ secrets        │ model
         ▼ (UAMI/AcrPull)  ▼ (UAMI ref)     ▼
       ACR             Key Vault        Azure OpenAI (IaC)
```

**Key decision:** FastAPI **serves the built SPA static files from the same origin**, so
**CORS disappears entirely** and the whole thing ships as one image, one Container App.

### 2.2 Why Container Apps

| Option | Verdict |
|------|------|
| Static Web Apps + managed Functions | FastAPI must be wrapped in the Functions model → ❌ |
| App Service (Python) | `az webapp up` was simple but built on the host and mixed in secrets → ❌ |
| **Container Apps + ACR** | One Docker image runs identically local → cloud; Key Vault + Managed Identity native → ✅ |

The submission first shipped on App Service; the re-implementation moved to Container Apps
so the same container runs everywhere and secrets stay out of the host.

### 2.3 Deployment Flow

[scripts/deploy-aca.sh](../scripts/deploy-aca.sh) runs the whole path idempotently:

```bash
# one script does the rest after the frontend build → backend/static/
bash scripts/deploy-aca.sh
#    ├─ register resource providers (App / KeyVault / ManagedIdentity / CognitiveServices …)
#    ├─ create RG + ACR (admin disabled), build & push the image
#    ├─ grant the deployer Key Vault Secrets Officer (RBAC), then
#    └─ az deployment group create  → infra/main.bicep
```

The Bicep template ([infra/main.bicep](../infra/main.bicep)) provisions the UAMI, ACR,
Azure OpenAI (+ `gpt-4o` deployment), Key Vault, Log Analytics, the Container Apps
environment, and the Container App. Step-by-step guide: [deploy-azure.md](deploy-azure.md).

### 2.4 Security Posture

- **No standing secrets in the app:** `aoai-api-key`, `app-passphrase`, and
  `session-secret` live in **Key Vault**; the Container App reads them through a
  **User-Assigned Managed Identity** (`keyVaultUrl` reference), not plaintext env values.
- **Keyless image pull:** ACR `adminUserEnabled` is off; the same UAMI pulls images via
  the **AcrPull** role.
- **Azure OpenAI as IaC:** the account and `gpt-4o` deployment are created by Bicep, and
  the API key flows from `listKeys()` straight into Key Vault — the deployer never handles it.
- **App-level guards:** single-user passphrase auth, signed session cookies, and an
  explicit prompt-injection guard ([app/prompt_guard.py](../backend/app/prompt_guard.py))
  sanitize every model-bound input.
- **Data:** a single SQLite file lives on the container filesystem with `minReplicas`
  pinned to 1; durable cross-restart storage is a tracked follow-up, not yet wired.

---

## See Also

- Full API contract: [plan/openapi.yaml](plan/openapi.yaml)
- Requirements spec: [archive/v0.0.1/plan/completed/app-requirements.md](archive/v0.0.1/plan/completed/app-requirements.md)
- Screen wireframes: [archive/v0.0.1/plan/completed/ui-wireframes.md](archive/v0.0.1/plan/completed/ui-wireframes.md)
