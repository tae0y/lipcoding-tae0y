# Azure 배포 경로 조사

심사 18%(Azure AI & Cloud). 15:40 배포 데드라인 보험.

출처: [.github/skills/azure-static-web-apps/SKILL.md](../../.github/skills/azure-static-web-apps/SKILL.md),
[.github/skills/azure-deployment-preflight/SKILL.md](../../.github/skills/azure-deployment-preflight/SKILL.md).

## 결론: App Service 단일 앱

**FastAPI 백엔드가 빌드된 SPA 정적 파일을 함께 서빙**하고, `az webapp up` 으로 하나의
App Service에 배포한다. 네이티브 Python, Docker 없음, Functions 래핑 없음.
**리소스 1개, 배포 1번, CORS 0.**

### 호스팅 옵션 비교

| 옵션 | FastAPI 적합도 | 셋업 비용 | 해커톤 판정 |
|---|---|---|---|
| Static Web Apps + managed Functions | ⚠️ 낮음. 관리형 API는 Azure Functions 모델이라 FastAPI 래핑 필요 | SPA는 낮음, FastAPI는 **높음** | ❌ FastAPI엔 부적합 |
| Container Apps | ✅ 무엇이든 실행 | **높음** — Dockerfile + ACR 빌드 + ingress | ❌ 첫 배포 너무 느림 |
| **App Service (Python)** | ✅ **네이티브**. Oryx가 `requirements.txt` 빌드, uvicorn 워커 | **낮음** — `az webapp up` 한 방 | ✅ **선택** |

같은 오리진에서 SPA를 서빙하면 CORS가 통째로 사라진다. 프론트를 꼭 분리해야 하면
나중에 SWA를 붙이되, 처음부터 분리하지 말 것.

## CLI 단계 (생성 → 배포 → 검증)

```bash
RG=rg-lipcoding
LOC=eastus2
APP=lipcoding-$RANDOM            # 전역 고유 이름
PLAN=plan-lipcoding

az login
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"

# 1) 리소스 그룹
az group create -n $RG -l $LOC

# 2) SPA 먼저 빌드 → FastAPI가 StaticFiles로 서빙할 위치에 복사
#    (frontend) npm ci && npm run build

# 3) 생성 + 배포 한 번에 (requirements.txt 있는 backend 폴더에서)
az webapp up \
  --name $APP --resource-group $RG --location $LOC \
  --runtime "PYTHON:3.12" --sku B1            # B1: Always On 지원(콜드스타트 방지)

# 4) uvicorn 워커로 기동 강제
az webapp config set -g $RG -n $APP \
  --startup-file "gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 main:app"
#    ^ module:app 조정 (예: app.main:app)

# 5) 워밍 유지
az webapp config set -g $RG -n $APP --always-on true

# 6) 공개 URL 검증
az webapp show -g $RG -n $APP --query defaultHostName -o tsv
curl -i https://$APP.azurewebsites.net/health
```

> 15:40 재배포: 같은 폴더에서 `az webapp up` 재실행 → 기존 앱 재사용, 코드만 푸시.

## Azure OpenAI 설정 + secret

```bash
AOAI=aoai-lipcoding-$RANDOM
AOAI_LOC=eastus2                 # 모델 가용 리전 확인
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

앱이 필요로 하는 환경변수:

| Var | 값 |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | `$AOAI_ENDPOINT` |
| `AZURE_OPENAI_API_KEY` | `$AOAI_KEY` |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o-mini` (**배포 이름**, 모델 이름 아님) |
| `AZURE_OPENAI_API_VERSION` | `2024-10-21` (현 GA) |

App Settings로 주입(저장 시 암호화, env로 노출):

```bash
az webapp config appsettings set -g $RG -n $APP --settings \
  AZURE_OPENAI_ENDPOINT="$AOAI_ENDPOINT" \
  AZURE_OPENAI_API_KEY="$AOAI_KEY" \
  AZURE_OPENAI_DEPLOYMENT="$DEPLOY" \
  AZURE_OPENAI_API_VERSION="2024-10-21"
```

> 리포/프론트에 키 하드코딩 금지. 서버에서 `os.environ` 으로만 읽기.
> 시간 남으면: Managed Identity + `Cognitive Services OpenAI User` 롤 + `DefaultAzureCredential` 로 키 제거.

## 스모크 테스트 (기능 전에 "배포된다" 증명)

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
curl -fsS https://$APP.azurewebsites.net/            # SPA index 로드
curl -fsS https://$APP.azurewebsites.net/health      # {"ok":true}
curl -fsS https://$APP.azurewebsites.net/health/ai   # {"ok":true,"reply":...}
# 실패 시: az webapp log tail -g $RG -n $APP
```

세 개 모두 200 = 스모크 게이트 통과. 기능 작성 전 통과해 둘 것.

## 함정

- **콜드스타트** → B1 + `--always-on true`. Free/Shared는 Always On 불가, 잠듦.
- **CORS** → FastAPI가 SPA 서빙하면 없음. 나중에 SWA로 분리하면 `CORSMiddleware` 추가.
- **리전/모델 가용성** → `gpt-4o-mini` GlobalStandard는 모든 리전에 없음. `eastus2`/`swedencentral` 안전.
- **배포 이름 vs 모델 이름** → SDK `model=` 은 **배포 이름**. 불일치 = `DeploymentNotFound`.
- **API 버전** → GA 값(`2024-10-21`). 잘못된/프리뷰 버전은 흔한 무음 404.
- **쿼터** → 신규 구독은 AOAI 액세스/쿼터 승인 필요할 수 있음. **가장 먼저 확인** — 유일하게 몇 시간 막을 수 있는 단계.
- **시작 명령** → uvicorn-worker 시작 파일 없으면 Oryx가 WSGI로 가정, FastAPI 부팅 실패.
- **SPA 라우팅 404** → `StaticFiles(..., html=True)` + 클라이언트 라우트용 catch-all로 `index.html` 반환.

## "배포 먼저" 체크리스트

- [ ] `az login` + 구독 설정; **AOAI 액세스/쿼터 확인**
- [ ] `az group create`
- [ ] SPA 빌드 → FastAPI 서빙 위치에 배치
- [ ] FastAPI에 `/health` 라우트
- [ ] `az webapp up` (PYTHON:3.12, B1) 성공
- [ ] uvicorn 시작 명령 + `--always-on`
- [ ] AOAI 계정 + `gpt-4o-mini` 배포 생성
- [ ] App Settings 4개 주입
- [ ] `curl /`, `/health`, `/health/ai` 전부 200 → 스모크 게이트 통과
- [ ] ~15:40 `az webapp up` 재실행으로 최종 배포
