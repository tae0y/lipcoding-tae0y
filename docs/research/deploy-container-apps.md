# Azure Container Apps Deployment Procedure (Verified)

Initial deployment success: 2026-06-20
Deployment URL: `https://lipcoding-api.orangewave-6847e932.eastus2.azurecontainerapps.io`

---

## Resource Inventory

| Item | Name | Location |
|---|---|---|
| Resource Group | `rg-lipcoding` | eastus2 |
| Container Registry | `lipcodingabk8` (Basic, admin enabled) | eastus2 |
| Log Analytics | `lipcoding-logs` | eastus2 |
| Container Apps Environment | `lipcoding-env` | eastus2 |
| Container App | `lipcoding-api` | eastus2 |
| Azure OpenAI | `aoai-lipcoding-tae0yp` | eastus2 |

---

## A. Initial Deployment (Starting from Zero Resources)

### A-1. Load Environment Variables

```bash
cd /path/to/lipcoding-tae0y
set -a && source backend/.env && set +a
```

### A-2. Get ACR Credentials

```bash
ACR_PWD=$(az acr credential show -n lipcodingabk8 -g rg-lipcoding --query 'passwords[0].value' -o tsv)
```

> **zsh note**: `'passwords[0].value'` must be wrapped in **single quotes**.
> Double quotes or no quotes causes `zsh: no matches found` glob error.

### A-3. Image Build & Push (ACR Tasks — no local Docker required)

```bash
az acr build \
  --registry lipcodingabk8 \
  --image lipcoding-api:latest \
  --file ./Dockerfile \
  .
```

### A-4. Create Log Analytics Workspace

```bash
az monitor log-analytics workspace create \
  -g rg-lipcoding -n lipcoding-logs -l eastus2
```

> Takes 10-20 seconds to create. Proceed after completion.

### A-5. Create Container Apps Environment

```bash
LA_ID=$(az monitor log-analytics workspace show \
  -g rg-lipcoding -n lipcoding-logs --query customerId -o tsv)
LA_KEY=$(az monitor log-analytics workspace get-shared-keys \
  -g rg-lipcoding -n lipcoding-logs --query primarySharedKey -o tsv)

az containerapp env create \
  -n lipcoding-env \
  -g rg-lipcoding \
  -l eastus2 \
  --logs-workspace-id "$LA_ID" \
  --logs-workspace-key "$LA_KEY"
```

> Environment creation takes **2-3 minutes**. Wait for completion before proceeding.

### A-6. Create Container App

```bash
az containerapp create \
  -n lipcoding-api \
  -g rg-lipcoding \
  --environment lipcoding-env \
  --image lipcodingabk8.azurecr.io/lipcoding-api:latest \
  --registry-server lipcodingabk8.azurecr.io \
  --registry-username lipcodingabk8 \
  --registry-password "$ACR_PWD" \
  --target-port 8000 \
  --ingress external \
  --min-replicas 1 \
  --cpu 0.5 --memory 1.0Gi \
  --env-vars \
    AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
    AZURE_OPENAI_API_KEY="$AZURE_OPENAI_API_KEY" \
    AZURE_OPENAI_DEPLOYMENT="$AZURE_OPENAI_DEPLOYMENT" \
    AZURE_OPENAI_API_VERSION="$AZURE_OPENAI_API_VERSION" \
    SKIP_COPILOT_SDK=0 \
    PORT=8000
```

### A-7. Confirm URL + Health Check

```bash
FQDN=$(az containerapp show -n lipcoding-api -g rg-lipcoding \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "URL: https://$FQDN"
curl -sf "https://$FQDN/health" && echo "OK" || echo "FAIL"
```

---

## B. Redeployment (After Code Changes)

Resources (ACR, environment, Container App) already exist — **rebuild image + update app** only.

```bash
# Run from project root
cd /path/to/lipcoding-tae0y
set -a && source backend/.env && set +a

# 1) Rebuild image (frontend + backend together)
az acr build \
  --registry lipcodingabk8 \
  --image lipcoding-api:latest \
  --file ./Dockerfile .

# 2) Update Container App image (new revision auto-created)
az containerapp update \
  -n lipcoding-api \
  -g rg-lipcoding \
  --image lipcodingabk8.azurecr.io/lipcoding-api:latest

# 3) Health check
sleep 20
curl -sf "https://lipcoding-api.orangewave-6847e932.eastus2.azurecontainerapps.io/health" \
  && echo "OK" || echo "FAIL"
```

---

## C. Troubleshooting

### Check Logs

```bash
az containerapp logs show -n lipcoding-api -g rg-lipcoding --tail 50
```

### Common Issues

| Symptom | Cause | Fix |
|---|---|---|
| `zsh: no matches found: passwords[0].value` | zsh interprets `[0]` as glob | Wrap in single quotes: `'passwords[0].value'` |
| HTTP 504 Gateway Timeout | Container crash / startup failure | Check `az containerapp logs show` for root cause |
| `ModuleNotFoundError: No module named 'copilot'` | SDK missing from `requirements.txt` | Add `github-copilot-sdk>=1.0.2` and rebuild |
| Frontend appears to not load | Actually fine — HTML/JS/CSS all served | Verify with `curl -s https://<FQDN>/` for HTML response |
| Bicep deployment keeps failing | Unclear cause | Abandon Bicep, use `az containerapp create` CLI directly |

---

## D. Clean Up (After Competition Ends)

```bash
az group delete -n rg-lipcoding --yes --no-wait
```
