# Azure Deployment Path Research

Scoring weight 18% (Azure AI & Cloud). Deployment deadline insurance at 15:40.

Sources: [.github/skills/azure-static-web-apps/SKILL.md](../../.github/skills/azure-static-web-apps/SKILL.md),
[.github/skills/azure-deployment-preflight/SKILL.md](../../.github/skills/azure-deployment-preflight/SKILL.md).

---

## Progress (2026-06-20)

### Container Apps Path — Skeleton Complete, Image Built

Switched deployment path to Container Apps because App Service (`lipcoding-tae0yp`) was unresponsive.

| Step | Status | Notes |
|---|---|---|
| Register `Microsoft.App` provider | ✅ Done | Including `Microsoft.OperationalInsights`, `Microsoft.ContainerRegistry` |
| Create ACR `lipcodingabk8` | ✅ Done | eastus2, Basic SKU |
| Docker image build & push | ✅ Done | ACR Tasks (ch2), `lipcoding-api:latest` |
| Bicep deployment (`infra/main.bicep`) | ⏳ Next | Run `bash scripts/deploy-aca.sh` |

**Redeploy command:**
```bash
export AZURE_OPENAI_API_KEY="..."   # or source backend/.env
ACR_NAME=lipcodingabk8 bash scripts/deploy-aca.sh
```

### Generated Infrastructure Files

| File | Role |
|---|---|
| `Dockerfile` | Multi-stage: node→Vite build + python:3.12-slim |
| `infra/main.bicep` | ACR + LogAnalytics + CA Env + Container App |
| `infra/main.bicepparam` | Parameters (API key via `readEnvironmentVariable`) |
| `scripts/deploy-aca.sh` | Provider registration→ACR build→Bicep deploy→health check automation |

---

## Conclusion: App Service Single App (Initial Plan)

**FastAPI backend serves the built SPA static files from the same origin**, deployed to a single
App Service with `az webapp up`. Native Python, no Docker, no Functions wrapping.
**1 resource, 1 deployment, CORS 0.**

### Hosting Options Comparison

| Option | FastAPI fit | Setup cost | Hackathon verdict |
|---|---|---|---|
| Static Web Apps + managed Functions | ⚠️ Low. Managed API is Azure Functions model, requires FastAPI wrapping | SPA low, FastAPI **high** | ❌ Not suited for FastAPI |
| Container Apps | ✅ Runs anything | **High** — Dockerfile + ACR build + ingress | ❌ Too slow for first deployment |
| **App Service (Python)** | ✅ **Native**. Oryx builds `requirements.txt`, uvicorn workers | **Low** — `az webapp up` one command | ✅ **Selected** |

Serving the SPA from the same origin eliminates CORS entirely. If frontend must be separated later,
add SWA then — do not separate from the start.

## CLI Steps (Create → Deploy → Verify)

```bash
RG=rg-lipcoding
LOC=eastus2
APP=lipcoding-$RANDOM            # globally unique name
PLAN=plan-lipcoding

az login
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"

# 1) Resource group
az group create -n $RG -l $LOC

# 2) Build SPA first → copy to where FastAPI serves StaticFiles
#    (frontend) npm ci && npm run build

# 3) Create + deploy in one step (from backend folder with requirements.txt)
az webapp up \
  --name $APP --resource-group $RG --location $LOC \
  --runtime "PYTHON:3.12" --sku B1            # B1: supports Always On (prevents cold start)

# 4) Force uvicorn worker startup
az webapp config set -g $RG -n $APP \
  --startup-file "gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 main:app"
#    ^ adjust module:app (e.g. app.main:app)

# 5) Keep warm
az webapp config set -g $RG -n $APP --always-on true

# 6) Verify public URL
az webapp show -g $RG -n $APP --query defaultHostName -o tsv
curl -i https://$APP.azurewebsites.net/health
```

> Redeploy at 15:40: re-run `az webapp up` from the same folder → reuses existing app, pushes only code.

## Azure OpenAI Setup + Secrets

```bash
AOAI=aoai-lipcoding-$RANDOM
AOAI_LOC=eastus2                 # check model availability by region
DEPLOY=gpt-4o-mini

az cognitiveservices account create \
  -n $AOAI -g $RG -l $AOAI_LOC \
  --kind OpenAI --sku S0 --custom-domain $AOAI --yes

az cognitiveservices account deployment create \
  -g $RG -n $AOAI --deployment-name $DEPLOY \
  --model-name gpt-4o-mini --model-version "2024-07-18" \
  --model-format OpenAI --sku-name GlobalStandard --sku-capacity 20

AOAI_ENDPOINT=$(az cognitiveservices account show -n $AOAI -g $RG --query properties.endpoint -o tsv)
AOAI_KEY=$(az cognitiveservices account keys list -n $AOAI -g $RG --query key1 -o tsv)
```

Environment variables the app needs:

| Var | Value |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | `$AOAI_ENDPOINT` |
| `AZURE_OPENAI_API_KEY` | `$AOAI_KEY` |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o-mini` (**deployment name**, not model name) |
| `AZURE_OPENAI_API_VERSION` | `2024-10-21` (current GA) |

Inject via App Settings (encrypted at rest, exposed as env):

```bash
az webapp config appsettings set -g $RG -n $APP --settings \
  AZURE_OPENAI_ENDPOINT="$AOAI_ENDPOINT" \
  AZURE_OPENAI_API_KEY="$AOAI_KEY" \
  AZURE_OPENAI_DEPLOYMENT="$DEPLOY" \
  AZURE_OPENAI_API_VERSION="2024-10-21"
```

> Never hardcode keys in repo or frontend. Read via `os.environ` on the server only.
> If time allows: Managed Identity + `Cognitive Services OpenAI User` role + `DefaultAzureCredential` to remove the key.

## Smoke Test (prove "it deploys" before any features)

```python
@app.get("/health")
def health(): return {"ok": True}

@app.get("/health/ai")
def health_ai():
    import os
    from openai import AzureOpenAI
    c = AzureOpenAI(api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
                    api_key=os.environ["AZURE_OPENAI_API_KEY"])
    r = c.chat.completions.create(model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
                                  messages=[{"role":"user","content":"ping"}], max_tokens=5)
    return {"ok": True, "reply": r.choices[0].message.content}
```

```bash
curl -fsS https://$APP.azurewebsites.net/            # SPA index loads
curl -fsS https://$APP.azurewebsites.net/health      # {"ok":true}
curl -fsS https://$APP.azurewebsites.net/health/ai   # {"ok":true,"reply":...}
# On failure: az webapp log tail -g $RG -n $APP
```

All three returning 200 = smoke gate passed. Pass this before writing any features.

## Pitfalls

- **Cold start** → B1 + `--always-on true`. Free/Shared tiers don't support Always On and go idle.
- **CORS** → None when FastAPI serves the SPA. If later separated to SWA, add `CORSMiddleware`.
- **Region/model availability** → `gpt-4o-mini` GlobalStandard is not available in all regions. `eastus2`/`swedencentral` are safe.
- **Deployment name vs model name** → SDK `model=` is the **deployment name**. Mismatch = `DeploymentNotFound`.
- **API version** → Use GA value (`2024-10-21`). Wrong/preview versions silently return 404.
- **Quota** → New subscriptions may need AOAI access/quota approval. **Check first** — the one step that can block for hours.
- **Startup command** → Without a uvicorn-worker startup file, Oryx assumes WSGI, FastAPI fails to boot.
- **SPA routing 404** → `StaticFiles(..., html=True)` + catch-all returning `index.html` for client routes.

## "Deploy First" Checklist

- [ ] `az login` + set subscription; **check AOAI access/quota**
- [ ] `az group create`
- [ ] Build SPA → place in FastAPI serving location
- [ ] Add `/health` route to FastAPI
- [ ] `az webapp up` (PYTHON:3.12, B1) succeeds
- [ ] uvicorn startup command + `--always-on`
- [ ] Create AOAI account + `gpt-4o-mini` deployment
- [ ] Inject 4 App Settings
- [ ] `curl /`, `/health`, `/health/ai` all return 200 → smoke gate passed
- [ ] ~15:40 re-run `az webapp up` for final deployment
