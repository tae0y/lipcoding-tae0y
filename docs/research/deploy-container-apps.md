# Azure Container Apps 배포 절차 (검증 완료)

최초 배포 성공 일시: 2026-06-20  
배포 URL: `https://lipcoding-api.orangewave-6847e932.eastus2.azurecontainerapps.io`

---

## 리소스 현황

| 항목 | 이름 | 위치 |
|---|---|---|
| 리소스 그룹 | `rg-lipcoding` | eastus2 |
| Container Registry | `lipcodingabk8` (Basic, admin enabled) | eastus2 |
| Log Analytics | `lipcoding-logs` | eastus2 |
| Container Apps 환경 | `lipcoding-env` | eastus2 |
| Container App | `lipcoding-api` | eastus2 |
| Azure OpenAI | `aoai-lipcoding-tae0yp` | eastus2 |

---

## A. 최초 배포 (리소스가 없는 상태에서 처음 시작)

### A-1. 환경변수 로드

```bash
cd /path/to/lipcoding-tae0y
set -a && source backend/.env && set +a
```

### A-2. ACR 자격증명 가져오기

```bash
ACR_PWD=$(az acr credential show -n lipcodingabk8 -g rg-lipcoding --query 'passwords[0].value' -o tsv)
```

> **zsh 필수 주의**: `'passwords[0].value'`는 반드시 **작은따옴표**로 감싸야 함.  
> 큰따옴표나 따옴표 없이 쓰면 `zsh: no matches found` glob 오류 발생.

### A-3. 이미지 빌드 & 푸시 (ACR Tasks — 로컬 Docker 불필요)

```bash
az acr build \
  --registry lipcodingabk8 \
  --image lipcoding-api:latest \
  --file ./Dockerfile \
  .
```

### A-4. Log Analytics 워크스페이스 생성

```bash
az monitor log-analytics workspace create \
  -g rg-lipcoding -n lipcoding-logs -l eastus2
```

> 생성에 10–20초 소요. 완료 후 다음 단계 진행.

### A-5. Container Apps 환경 생성

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

> 환경 생성에 **2–3분** 소요. 완료까지 대기 후 다음 단계 진행.

### A-6. Container App 생성

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

### A-7. URL 확인 + 헬스체크

```bash
FQDN=$(az containerapp show -n lipcoding-api -g rg-lipcoding \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "URL: https://$FQDN"
curl -sf "https://$FQDN/health" && echo "OK" || echo "FAIL"
```

---

## B. 재배포 (코드 수정 후 업데이트)

리소스(ACR, 환경, Container App)는 이미 존재하므로 **이미지 재빌드 + 앱 업데이트**만 하면 됩니다.

```bash
# 프로젝트 루트에서 실행
cd /path/to/lipcoding-tae0y
set -a && source backend/.env && set +a

# 1) 이미지 재빌드 (프론트엔드 + 백엔드 함께 빌드)
az acr build \
  --registry lipcodingabk8 \
  --image lipcoding-api:latest \
  --file ./Dockerfile .

# 2) Container App 이미지 교체 (새 리비전 자동 생성)
az containerapp update \
  -n lipcoding-api \
  -g rg-lipcoding \
  --image lipcodingabk8.azurecr.io/lipcoding-api:latest

# 3) 헬스체크
sleep 20
curl -sf "https://lipcoding-api.orangewave-6847e932.eastus2.azurecontainerapps.io/health" \
  && echo "OK" || echo "FAIL"
```

---

## C. 트러블슈팅

### 로그 확인

```bash
az containerapp logs show -n lipcoding-api -g rg-lipcoding --tail 50
```

### 자주 겪은 문제

| 증상 | 원인 | 해결 |
|---|---|---|
| `zsh: no matches found: passwords[0].value` | zsh가 `[0]`를 glob으로 해석 | `'passwords[0].value'` 작은따옴표로 감싸기 |
| HTTP 504 Gateway Timeout | 컨테이너 크래시 / 시작 실패 | `az containerapp logs show` 로 원인 확인 |
| `ModuleNotFoundError: No module named 'copilot'` | `requirements.txt`에 SDK 누락 | `github-copilot-sdk>=1.0.2` 추가 후 재빌드 |
| 프론트가 안 뜨는 것처럼 보임 | 실제로는 정상 — HTML·JS·CSS 모두 서빙됨 | `curl -s https://<FQDN>/` 로 HTML 응답 직접 확인 |
| Bicep 배포 반복 실패 | 원인 불명확 | Bicep 포기, `az containerapp create` CLI 직접 사용 |

---

## D. 리소스 정리 (대회 종료 후)

```bash
az group delete -n rg-lipcoding --yes --no-wait
```
