# Working Memory Inbox — Azure Deployment Guide

This guide explains how to run and deploy "Tteoolim (Working Memory Inbox)"
in the order: **local → local container → Azure**. For the app architecture
and SDK usage background see [architecture.md](architecture.md); for
infrastructure details see [infra/main.bicep](../infra/main.bicep) and
[scripts/deploy-aca.sh](../scripts/deploy-aca.sh).

Stack: A FastAPI + SQLite backend serves the built Vite SPA from a **single origin**.
On Azure the app is deployed as **Container Apps + ACR + Key Vault + User-Assigned Managed Identity**.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`)
- [Docker](https://docs.docker.com/get-docker/)
- [uv](https://docs.astral.sh/uv/) (backend run/test), [Node.js 20+](https://nodejs.org/) (frontend build)
- **Azure OpenAI** — with `createAoai=true` (default) the deployment creates the AOAI account and
  `gpt-4o` deployment as IaC, and injects the API key into Key Vault via `listKeys()` automatically.
  To reuse an existing account, set `createAoai=false` in [infra/main.bicepparam](../infra/main.bicepparam)
  and set `aoaiAccountName` to the existing account name (same-name accounts are absorbed idempotently).

## Set the Repository Root

1. Set the repository root as a variable.

    ```bash
    # bash/zsh
    REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
    cd "$REPOSITORY_ROOT"
    ```

## Environment Variables

Key environment variables read by the app. Locally, place them in `.env` at the
repository root (gitignored). For Azure deployment, inject them as shell environment
variables (see each section below).

| Variable | Required | Description |
|------|------|------|
| `AZURE_OPENAI_ENDPOINT` | ● | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_KEY` | ● | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | ● | Model deployment name (e.g. `gpt-4o`) |
| `AZURE_OPENAI_API_VERSION` | | API version (default `2024-10-21`) |
| `APP_PASSPHRASE` | △ | Single-user login secret. **Auth is enabled when set**, open mode when unset |
| `SESSION_SECRET` | | Session cookie signing key. Auto-generated if unset (sessions invalidated on restart) |
| `SKIP_COPILOT_SDK` | | `1` skips Copilot SDK and falls back to direct Azure / heuristic |
| `ENABLE_DOCS` | | `1` exposes `/docs` (off by default) |
| `SESSION_HTTPS_ONLY` | | `0` for local http testing; `1` for prod (HTTPS) — default `1` |

## Run Locally

1. Create `.env` at the repository root (fill in your keys — do not commit).

    ```bash
    # bash/zsh — $REPOSITORY_ROOT/.env
    cat > "$REPOSITORY_ROOT/.env" <<'EOF'
    AZURE_OPENAI_ENDPOINT={{AZURE_OPENAI_ENDPOINT}}
    AZURE_OPENAI_API_KEY={{AZURE_OPENAI_API_KEY}}
    AZURE_OPENAI_DEPLOYMENT=gpt-4o
    AZURE_OPENAI_API_VERSION=2024-10-21
    SKIP_COPILOT_SDK=1
    SESSION_HTTPS_ONLY=0
    EOF
    ```

    > **NOTE**: There may be no Copilot CLI GitHub auth locally. Setting `SKIP_COPILOT_SDK=1`
    > falls back to the same Azure OpenAI model via direct call (end-to-end verification is still possible).

1. Build the frontend (Vite) and output to `backend/static`.

    ```bash
    # bash/zsh
    bash "$REPOSITORY_ROOT/scripts/build.sh"
    ```

1. Run the backend. FastAPI serves the built SPA from the same origin.

    ```bash
    # bash/zsh
    cd "$REPOSITORY_ROOT/backend"
    uv run uvicorn app.main:app --reload
    ```

1. Open `http://localhost:8000` in a browser and enter an idea.

    > **NOTE**: To develop the frontend with hot-reload separately from the backend (8000),
    > run `cd frontend && npm ci && npm run dev` (`http://localhost:5173`).
    > CORS allows 5173/127.0.0.1:5173 by default.

## Run in a Local Container

Verify the same image as the deployment locally.

1. Confirm you are at the repository root.

    ```bash
    cd "$REPOSITORY_ROOT"
    ```

1. Build the container image ([Dockerfile](../Dockerfile) — multi-stage frontend build + FastAPI runtime).

    ```bash
    # bash/zsh
    docker build --platform linux/amd64 -f Dockerfile -t lipcoding:latest .
    ```

1. Run with `.env` injected.

    ```bash
    # bash/zsh
    docker run --rm -p 8000:8000 --env-file "$REPOSITORY_ROOT/.env" lipcoding:latest
    ```

1. Open `http://localhost:8000` in a browser.

    > **NOTE**: The image includes Copilot CLI but has no GitHub auth. The SDK path falls back to
    > direct Azure calls if empty. Set `SKIP_COPILOT_SDK=1` in `.env` to be explicit.

## Deploy to Azure

[scripts/deploy-aca.sh](../scripts/deploy-aca.sh) performs the full path idempotently in one command:
resource provider registration → resource group/ACR creation → image build & push →
Bicep deployment including Azure OpenAI, Key Vault, Managed Identity → health check.

1. Log in to Azure and select your subscription.

    ```bash
    # bash/zsh
    az login
    az account set --subscription {{AZURE_SUBSCRIPTION_ID}}
    ```

1. Set the required environment variables. `APP_PASSPHRASE` **must** be set (public deployment auth).

    ```bash
    # bash/zsh
    export APP_PASSPHRASE={{LOGIN_PASSPHRASE}}
    # Optional: inject a stable session secret (auto-generated if unset)
    # export SESSION_SECRET=$(openssl rand -base64 32)
    # Optional: set if your model deployment name is not gpt-4o
    # export AZURE_OPENAI_DEPLOYMENT={{DEPLOYMENT_NAME}}
    ```

    > **NOTE**: The Azure OpenAI API key no longer needs manual injection. Bicep fetches it
    > from the AOAI account via `listKeys()` and stores it in Key Vault secret `aoai-api-key` (2.8).
    > To reuse an existing AOAI account, set `createAoai=false` in
    > [infra/main.bicepparam](../infra/main.bicepparam) and set `aoaiAccountName`.

    > **NOTE**: ACR name (`ACR_NAME`), resource group (`RG`), and location (`LOCATION`) can also
    > be overridden via environment variables. Defaults: auto-generated / `rg-lipcoding` / `eastus2`.

1. Run the deployment script.

    ```bash
    # bash/zsh
    bash "$REPOSITORY_ROOT/scripts/deploy-aca.sh"
    ```

    On completion the app URL (`appUrl`) and FQDN are printed, and `/health` is checked.

    > **NOTE**: On first deployment, RBAC propagation delays can cause Key Vault reference
    > validation to fail once. **Re-running the same command** succeeds idempotently.

1. Open the printed app URL in a browser and log in with `APP_PASSPHRASE` to test idea capture.

    ```bash
    # bash/zsh — post-deployment health check
    curl -sf https://{{APP_FQDN}}/health        # basic health
    curl -sf https://{{APP_FQDN}}/health/ai      # Azure OpenAI round-trip check
    ```

## Clean Up

Delete the entire resource group when testing is complete.

```bash
# bash/zsh
az group delete -n {{RESOURCE_GROUP}} --yes --no-wait
```

> **NOTE**: Key Vault and Azure OpenAI accounts have soft-delete enabled. To re-create immediately
> with the same name, run `az keyvault purge -n {{KEY_VAULT_NAME}}` and
> `az cognitiveservices account purge -g {{RESOURCE_GROUP}} -n {{AOAI_ACCOUNT_NAME}} -l {{LOCATION}}`
> (see `keyVaultName` and `aoaiAccountName` in the deployment output).
