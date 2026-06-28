# Container Build Strategy — Local Build vs ACR Tasks vs CI/CD (2026-06-28)

Comparing tradeoffs between container image build approaches encountered during the re-implementation deployment.

## Background

`scripts/deploy-aca.sh` uses local Docker build followed by ACR push.
This was compared against other approaches from a deployment speed optimization perspective.

## Three Approaches Compared

### 1. Local Build + ACR Push (current approach)

```bash
docker build --platform linux/amd64 -t <acr>.azurecr.io/app:tag .
docker push <acr>.azurecr.io/app:tag
```

- **Pros**: Layer cache reuse → fast rebuilds. Especially effective for heavy layers (Node.js + Copilot CLI installation, etc.).
- **Cons**: Requires local Docker daemon. `--platform linux/amd64` required on M-series Macs (cross-compilation). Upload bandwidth cost.

### 2. ACR Tasks (`az acr build`)

```bash
az acr build --registry <acr> --image app:tag --file Dockerfile .
```

- **Pros**: No local Docker required. Build and storage handled within Azure network. No platform concerns.
- **Cons**: No layer cache → every build runs `npm ci` + Copilot CLI install (~5-10 min). Must upload entire source to Azure.
- **This project's actual experience**: Dockerfile includes global `@github/copilot` CLI installation, making ACR Tasks builds slow. This is why local build was adopted during the competition.

### 3. GitHub Actions CI/CD (industry standard)

```yaml
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
    push: true
    tags: <acr>.azurecr.io/app:${{ github.sha }}
```

- **Pros**: Auto build+deploy on every `main` push. GitHub Actions cache (GHA) provides local-level speed. Reproducibility guaranteed. No developer local environment required.
- **Cons**: Initial workflow + OIDC (Federated Identity) setup required. Not yet configured for this project.

## Decision Criteria Summary

| Situation | Recommended approach |
|---|---|
| Heavy layers + rapid iteration | Local build + push |
| No local Docker, quick one-off deploy | ACR Tasks |
| Team collaboration / automation / reproducibility | GitHub Actions + GHA cache |
| Single-command deploy (including IaC) | `azd up` (internally uses ACR Tasks → no cache, be aware) |

## Practical Choice for This Project

- Personal project + low deployment frequency → **keeping local build current approach is reasonable**.
- `azure.yaml` exists so `azd up` path is possible, but azd also uses ACR Tasks internally so the same caching issue applies.
- When automation is needed, GitHub Actions + GHA cache is the first choice.

## Related Files

- [scripts/deploy-aca.sh](../../scripts/deploy-aca.sh) — current deployment script (local build approach)
- [Dockerfile](../../Dockerfile) — cause of heavy layers: Node 20 + `@github/copilot` CLI
- [azure.yaml](../../azure.yaml) — azd entry point
