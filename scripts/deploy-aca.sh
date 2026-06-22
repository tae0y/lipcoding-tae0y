#!/usr/bin/env bash
# Azure Container Apps 배포 스크립트 (Bicep 기반)
#
# 사용:
#   export AZURE_OPENAI_API_KEY="<key>"
#   bash scripts/deploy-aca.sh
#
# 또는 ACR 이름 직접 지정:
#   ACR_NAME=lipcoding1234 bash scripts/deploy-aca.sh
#
# 전제조건:
#   az login + az account set --subscription <ID>
#   AZURE_OPENAI_API_KEY 환경변수 설정
#   Microsoft.App 공급자 등록 (스크립트가 자동 처리)
set -euo pipefail

# ── 설정 ────────────────────────────────────────────────────────────────────
RG="${RG:-rg-lipcoding}"
LOCATION="${LOCATION:-eastus2}"
ACR_NAME="${ACR_NAME:-lipcoding$(date +%s | tail -c5)}"  # 기본: 타임스탬프 접미어
APP_NAME="${APP_NAME:-lipcoding-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
BICEP_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/infra/main.bicep"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── 헬퍼 ────────────────────────────────────────────────────────────────────
log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ── 1. 필수 환경변수 확인 ────────────────────────────────────────────────────
: "${AZURE_OPENAI_API_KEY:?'ERROR: AZURE_OPENAI_API_KEY 환경변수를 설정하세요'}"
: "${APP_PASSPHRASE:?'ERROR: APP_PASSPHRASE 환경변수를 설정하세요(단일 사용자 로그인 비밀)'}"
# 세션 서명 키: 미지정 시 1회용 자동 생성(이후 재배포 시 세션 무효화).
# 안정적인 세션 유지가 필요하면 SESSION_SECRET 을 직접 주입하라.
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -base64 32)}"

# ── 2. 리소스 공급자 등록 ────────────────────────────────────────────────────
for provider in Microsoft.App Microsoft.OperationalInsights Microsoft.ContainerRegistry Microsoft.KeyVault Microsoft.ManagedIdentity; do
  STATE=$(az provider show -n "$provider" --query registrationState -o tsv 2>/dev/null || echo "NotRegistered")
  if [[ "$STATE" != "Registered" ]]; then
    log "$provider 등록 중..."
    az provider register -n "$provider" --wait
  fi
done

# ── 3. 리소스 그룹 ───────────────────────────────────────────────────────────
log "리소스 그룹: $RG ($LOCATION)"
az group create -n "$RG" -l "$LOCATION" --output none

# ── 4. ACR 사전 생성 (이미지 빌드에 필요) ───────────────────────────────────
# admin 비밀 비활성 → 앱은 Managed Identity 로 풀(2.3). 빌드/푸시는 az AAD 토큰 사용.
log "ACR 생성/확인: $ACR_NAME"
az acr create -n "$ACR_NAME" -g "$RG" --sku Basic --admin-enabled false \
  --output none 2>/dev/null || log "ACR 이미 존재함, 재사용"

# MI 풀은 ARM audience 토큰 인증이 활성화돼야 함.
az acr config authentication-as-arm update -r "$ACR_NAME" --status enabled --output none 2>/dev/null || true

ACR_LOGIN_SERVER=$(az acr show -n "$ACR_NAME" -g "$RG" --query loginServer -o tsv 2>/dev/null | tr -d '\n\r ')
if [[ -z "$ACR_LOGIN_SERVER" ]]; then
  echo "ERROR: ACR '$ACR_NAME' loginServer를 가져오지 못했습니다." >&2; exit 1
fi
IMAGE="${ACR_LOGIN_SERVER}/${APP_NAME}:${IMAGE_TAG}"
log "이미지 경로: $IMAGE"

# ── 5. 이미지 빌드 + 푸시 (로컬 Docker) ─────────────────────────────────────
log "ACR 로그인: $ACR_NAME"
az acr login -n "$ACR_NAME"

log "로컬 Docker 빌드: $IMAGE"
docker build --platform linux/amd64 -t "$IMAGE" -f "$ROOT/Dockerfile" "$ROOT"

log "이미지 푸시: $IMAGE"
docker push "$IMAGE"

# ── 5.5 배포자 Key Vault 시크릿 기록 권한 ────────────────────────────────────
# bicep 이 Key Vault 에 시크릿을 기록하려면 배포 주체(현재 az 로그인)가 데이터
# 평면 권한을 가져야 한다. RG 범위로 'Key Vault Secrets Officer' 를 부여해 둔다
# (RBAC 모델 KV 에 상속). 전파 지연을 흡수하도록 배포 전에 먼저 부여한다.
log "배포자 Key Vault 권한 확인/부여"
DEPLOYER_OID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || true)
DEPLOYER_TYPE="User"
if [[ -z "$DEPLOYER_OID" ]]; then
  SP_APPID=$(az account show --query user.name -o tsv 2>/dev/null || true)
  DEPLOYER_OID=$(az ad sp show --id "$SP_APPID" --query id -o tsv 2>/dev/null || true)
  DEPLOYER_TYPE="ServicePrincipal"
fi
if [[ -n "$DEPLOYER_OID" ]]; then
  RG_ID=$(az group show -n "$RG" --query id -o tsv)
  az role assignment create \
    --role "Key Vault Secrets Officer" \
    --assignee-object-id "$DEPLOYER_OID" \
    --assignee-principal-type "$DEPLOYER_TYPE" \
    --scope "$RG_ID" --output none 2>/dev/null \
    && log "Key Vault Secrets Officer 부여(전파 대기 ~30s)" && sleep 30 \
    || log "역할 이미 존재하거나 권한 부족 — 기존 부여 가정하고 진행"
else
  log "⚠ 배포자 objectId 확인 실패 — KV 시크릿 기록이 실패하면 수동 부여 필요"
fi

# ── 6. Bicep 배포 ────────────────────────────────────────────────────────────
AOAI_ENDPOINT=$(az cognitiveservices account show \
  -g rg-lipcoding -n aoai-lipcoding-tae0yp \
  --query properties.endpoint -o tsv)

log "Bicep 배포 시작..."
az deployment group create \
  --resource-group "$RG" \
  --template-file "$BICEP_FILE" \
  --parameters \
    acrName="$ACR_NAME" \
    containerImage="$IMAGE" \
    aoaiEndpoint="$AOAI_ENDPOINT" \
    aoaiApiKey="$AZURE_OPENAI_API_KEY" \
    aoaiDeployment="${AZURE_OPENAI_DEPLOYMENT:-gpt-4o}" \
    appPassphrase="$APP_PASSPHRASE" \
    sessionSecret="$SESSION_SECRET" \
    location="$LOCATION" \
  --output json | \
  python3 -c "
import sys, json
out = json.load(sys.stdin)
props = out.get('properties', {}).get('outputs', {})
fqdn = props.get('appFqdn', {}).get('value', '')
url  = props.get('appUrl',  {}).get('value', '')
print(f'FQDN: {fqdn}')
print(f'URL:  {url}')
"

# ── 7. 헬스체크 ──────────────────────────────────────────────────────────────
FQDN=$(az containerapp show -n "${APP_NAME}" -g "$RG" \
  --query properties.configuration.ingress.fqdn -o tsv 2>/dev/null || echo "")

if [[ -n "$FQDN" ]]; then
  log "헬스체크: https://$FQDN/health"
  sleep 10
  curl -sf --max-time 30 "https://$FQDN/health" && log "✓ /health OK" \
    || log "⚠ /health 아직 준비 중 — 잠시 후 재시도"
fi
