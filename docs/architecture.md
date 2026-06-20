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

### 2.1 Overall Layout — Single App Service, Zero CORS

```text
                    User's browser
                       │  HTTPS
                       ▼
┌───────────────────────────────────────────────────────────┐
│  Azure App Service (Linux, Python 3.12, Always On)          │
│  gunicorn → uvicorn worker → FastAPI (app.main:app)         │
│                                                            │
│   GET /            ──▶ serves the built SPA (index.html)    │
│   GET /api/*       ──▶ REST API                            │
│      └─ judgment / research / suggestions                   │
│                       │                                    │
│        ┌──────────────┼───────────────┐                    │
│        ▼              ▼                ▼                    │
│   Copilot SDK    SQLite file      /health/ai                │
│        │         /data/app.db     (model liveness check)    │
│        ▼              │                                    │
└────────┼──────────────┼────────────────────────────────────┘
         ▼              ▼
   Azure OpenAI   Azure Files volume (data survives restarts)
```

**Key decision:** FastAPI **serves the built SPA static files from the same origin.**
Frontend and backend are not split, so **CORS disappears entirely** and the whole thing
ships as one resource, one deployment.

### 2.2 Why App Service

| Option | Verdict |
|------|------|
| Static Web Apps + managed Functions | FastAPI must be wrapped in the Functions model → ❌ |
| Container Apps | Dockerfile + ACR build + ingress → first deploy too heavy → ❌ |
| **App Service (Python)** | Oryx builds `requirements.txt` natively, `az webapp up` in one shot → ✅ |

### 2.3 Deployment Flow

```bash
# 1) build the frontend → copy into backend/static/ (scripts/build.sh)
./scripts/build.sh

# 2) create + deploy in one shot from the backend folder
az webapp up --name $APP --resource-group $RG \
  --runtime "PYTHON:3.12" --sku B1            # B1 = Always On (no cold start)

# 3) start with a uvicorn worker
az webapp config set -g $RG -n $APP \
  --startup-file "gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app"
```

Detailed steps and verification commands: [research/azure-deploy.md](research/azure-deploy.md)

### 2.4 Persistence & Security

- **Data:** a single SQLite file is mounted on an **Azure Files volume**, so ideas,
  research, and suggestions survive container restarts. With a single user, the replica
  count is pinned to 1.
- **Secrets:** the Azure OpenAI endpoint, key, and deployment name are injected
  **only through environment variables** ([.env.sample](../.env.sample)). No plaintext
  keys live in the code or repository.

---

## See Also

- Full API contract: [plan/openapi.yaml](plan/openapi.yaml)
- Requirements spec: [plan/app-requirements.md](plan/app-requirements.md)
- Screen wireframes: [plan/ui-wireframes.md](plan/ui-wireframes.md)
