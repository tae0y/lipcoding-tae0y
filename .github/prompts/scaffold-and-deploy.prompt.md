---
mode: agent
description: 다음 세션 킥오프 — 빈 프론트/백 스켈레톤을 만들고 Azure에 직접 배포(엔드투엔드 검증)
---

# 스켈레톤 + Azure 배포 (사전 준비: 인프라 뚫기)

조사 결과를 바탕으로 **빈 앱을 엔드투엔드로 배포**한다. 목표는 "기능"이 아니라
**막힐 만한 곳(SDK 첫 호출 · Azure 배포 · secret 주입)을 전부 뚫어두는 것**이다.

## 먼저 읽을 것

- [docs/research/azure-deploy.md](../../docs/research/azure-deploy.md) — App Service 단일 앱 경로, AOAI 설정, 스모크 테스트
- [docs/research/copilot-sdk.md](../../docs/research/copilot-sdk.md) — SDK 설치 + Azure BYOK provider, 첫 호출 검증 스켈레톤
- [.github/skills/azure-deployment-preflight/SKILL.md](../skills/azure-deployment-preflight/SKILL.md) — Bicep 검증 + what-if 프리플라이트
- [docs/plan/competition-plan.md](../../docs/plan/competition-plan.md) — 시간 배분 / 스코프

## 아키텍처 (고정)

- **단일 App Service.** FastAPI 백엔드가 빌드된 SPA 정적 파일을 `StaticFiles`로 함께 서빙 → CORS 0, 리소스 1, 배포 1.
- 백엔드: Python 3.12 + FastAPI + uvicorn 워커.
- 프론트: Vite + React + Tailwind (shadcn은 다음 단계, 지금은 빈 셸).
- 모델 계층: Azure OpenAI (BYOK), 키는 App Settings로만 주입.
- **인프라는 Bicep IaC로 선언.** `infra/main.bicep`에 App Service plan + web app + Azure OpenAI + app settings를 정의하고, what-if 프리플라이트로 검증 후 배포 → 재현 가능 + 재배포 안전.
- 코드 배포(앱 빌드 산출물)는 인프라 배포와 분리: 인프라는 Bicep, 코드는 `az webapp deploy`(zip).

## 작업 순서

1. **리포 스캐폴딩**
   - `backend/` (FastAPI: `app/main.py`, `requirements.txt`), `frontend/` (Vite+React+Tailwind).
   - `.env.example` 작성: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`. 실제 `.env`는 `.gitignore`.
   - 데이터 모델 스텁: `Idea { id, text, status: inbox|dump|suggested, research }`.
2. **백엔드 헬스 라우트**
   - `GET /health` → `{"ok": true}`.
   - `GET /health/ai` → Azure OpenAI에 "ping" 1회 호출, 응답 반환 (azure-deploy.md 스니펫).
   - `StaticFiles(..., html=True)` 마운트 + 클라이언트 라우트용 catch-all로 `index.html` 반환.
3. **프론트 빌드 → 백엔드가 서빙**
   - `npm run build` 산출물을 FastAPI가 서빙하는 위치에 배치(스크립트화).
4. **Copilot SDK 첫 호출 검증** (배포와 별개로 로컬에서)
   - `copilot --version` 확인 → `pip install github-copilot-sdk pydantic python-dotenv`.
   - copilot-sdk.md의 검증 스켈레톤 실행 → Azure 경유로 `OK` 출력 확인.
   - `streaming:True`로 `event.type` 한 번 출력 → delta/idle 이벤트 이름 고정 후 메모에 기록.
5. **Bicep 인프라 작성** (`infra/main.bicep` + `main.bicepparam`)
   - 리소스: App Service plan(B1, Linux/Python 3.12) + web app(uvicorn 시작 명령, `alwaysOn: true`) + Azure OpenAI 계정 + `gpt-4o-mini` 배포.
   - web app `appSettings`에 AOAI 4개 값 주입(`AZURE_OPENAI_ENDPOINT/_API_KEY/_DEPLOYMENT/_API_VERSION`). 키는 파라미터/secure로, 리포에 하드코딩 금지.
6. **프리플라이트 + 배포**
   - `az login` → **AOAI 액세스/쿼터 먼저 확인** (가장 큰 블로커).
   - `az bicep build` 문법 검증 → `az deployment group what-if`로 변경 미리보기(프리플라이트 스킬).
   - `az deployment group create`로 인프라 배포.
   - 코드 배포: 빌드된 앱을 zip → `az webapp deploy --type zip`.
7. **스모크 게이트**
   - `curl /`, `/health`, `/health/ai` 전부 200 확인. 실패 시 `az webapp log tail`.

## 성공 기준 (검증)

- [ ] 공개 Azure URL에서 빈 프론트가 로드된다 (`curl /` 200 + HTML).
- [ ] `/health` 200, `/health/ai`가 Azure 모델 응답을 반환한다.
- [ ] 로컬에서 Copilot SDK가 Azure provider 경유로 `OK`를 출력한다.
- [ ] secret이 리포/프론트에 하드코딩되지 않고 Bicep secure 파라미터 → App Settings로만 주입된다.
- [ ] `what-if` 프리플라이트가 깨끗하고, 재배포(`az deployment group create` 재실행)가 멱등하게 동작한다.

## 하지 말 것

- 기능 구현 (judge/research 툴은 다음 블록). 지금은 **빈 셸 + 배선**만.
- 인증/회원가입, 화려한 디자인, 화면 4개 이상.
- Azure Speech / STT (스킵).

## 결과 기록

- 검증된 명령·이벤트 이름·SDK/CLI 버전을 리포 메모리(`/memories/repo/`)에 저장.
- 막힌 지점과 해결책을 [docs/experience/](../../docs/experience/)에 1줄씩.
