# Copilot SDK 에이전트 오케스트레이션 — 경험 노트

**날짜:** 2026-06-20 (천하제일 입코딩 대회 당일)  
**문맥:** 사전조사(research) 기능을 "API 한 번 호출"에서 진짜 에이전트 도구 오케스트레이션으로 전환하고 운영 컨테이너에서 동작시키기까지의 여정

---

## 1. 전환 전 문제: SDK를 API처럼 쓰는 패턴

기존 코드의 증상:

```python
# ❌ 도구가 passthrough — 인자를 그냥 돌려줌
@define_tool(...)
async def collect_materials(params) -> dict:
    return {"materials": params.materials}   # 그냥 echo

# ❌ 최종 결과는 모델이 텍스트로 뱉은 JSON 덩어리를 파싱
content = resp.data.content
data = json.loads(content[content.find("{"):content.rfind("}")+1])
```

→ 도구 호출은 형식뿐이고 실제 결과는 모델의 텍스트 JSON에 의존  
→ 도구 정의가 존재해도 "에이전트 오케스트레이션"이 아닌 "API 래퍼"

---

## 2. 진짜 오케스트레이션 패턴: store capture

**핵심 원칙:** 도구 핸들러가 받은 인자를 `store`에 저장 → 최종 결과를 store에서 조립

```python
def _make_research_tools(store: dict, on_tool=None) -> list:
    @define_tool(description="...")
    async def collect_materials(params) -> dict:
        store["materials"] = [ResearchMaterial(**m) for m in params.materials]
        if on_tool: on_tool("collect_materials", len(store["materials"]))
        return {"ok": True, "collected": len(store["materials"])}  # ← 에이전트에 피드백

    @define_tool(description="...")
    async def frame_options(params) -> dict:
        store["options"] = [str(o) for o in params.options]
        if on_tool: on_tool("frame_options", len(store["options"]))
        return {"ok": True, "framed": len(store["options"])}

    return [collect_materials, frame_options]

# 사용: 도구 호출 결과에서 Research 조립
research = _research_from_store(store)  # JSON 파싱 의존 X
```

**효과:**
- 도구 호출이 장식이 아닌 실제 출력 채널
- 모델이 도구를 안 부르면 결과가 없음 → 진짜 오케스트레이션
- `on_tool` 콜백으로 스트리밍에 "🔧 collect_materials — 5건 정리" delta 노출 → 데모에서 오케스트레이션 가시화

---

## 3. 운영 컨테이너 BYOK 실패 원인과 해결

### 증상
- 로컬(CLI 인증 있음): SDK 도구 호출 정상 (collect 5건 / frame 4건)
- prod 컨테이너: `content=''` 빈 idle → error

### 원인 1: Dockerfile에 Copilot CLI 없음

```dockerfile
# ❌ Before: Python 런타임만, CLI 없음
FROM python:3.12-slim
```

```dockerfile
# ✅ After: Node 20 + @github/copilot 설치
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*
RUN npm install -g @github/copilot
```

### 원인 2: `use_logged_in_user` 기본값이 True

Python SDK의 `CopilotClient` 기본값:
```python
use_logged_in_user=True   # → 번들 CLI가 GitHub 로그인 사용자를 요구
```

컨테이너에 GitHub 로그인 사용자가 없으면 CLI가 막힘 → 빈 idle

**해결:** BYOK 모드에서는 `use_logged_in_user=False`로 클라이언트 생성

```python
def _make_client() -> CopilotClient:
    if os.environ.get("COPILOT_PROVIDER_BASE_URL", "").strip():
        return CopilotClient(use_logged_in_user=False)  # ← 헤드리스 BYOK
    return CopilotClient()
```

이 플래그가 있으면 번들 런타임이 `--no-auto-login`으로 떠서 GitHub 인증 없이 BYOK 프로바이더만 사용.

### 원인 3: 스트리밍 모드에서 도구 호출이 불안정한 프롬프트

`send_and_wait` 경로는 도구를 잘 부르는데 `send + streaming=True` 경로는 안 부름.

**해결:** 프롬프트에 명시적 강제 지시 추가

```python
# ❌ 약한 표현
"collect_materials와 frame_options 도구를 직접 호출해 사전조사를 완성하라."

# ✅ 강제 표현  
"collect_materials 도구와 frame_options 도구를 각각 한 번 이상 반드시 호출하라. "
"도구를 호출하지 않으면 결과가 저장되지 않는다."
```

---

## 4. 폴백 체인 (엔드투엔드 baseline 보호)

```
1순위: Copilot SDK 에이전트 (로컬 CLI / BYOK 컨테이너)
    ↓ 실패/빈 결과
2순위: Azure Foundry 직접 호출 (openai AzureOpenAI, JSON mode)
    ↓ 실패
3순위: 휴리스틱
```

이 구조 덕분에:
- prod에서 SDK 경로가 막혀도 **Foundry로 진짜 AI 사전조사** 제공
- SDK + BYOK가 정상이면 도구 오케스트레이션 + 스트리밍 delta 가시화까지

---

## 5. BYOK 컨테이너 설정 요약

컨테이너 env에 추가할 변수:

| 변수 | 값 | 비고 |
|---|---|---|
| `COPILOT_PROVIDER_BASE_URL` | `https://<aoai>.openai.azure.com` | 설정하면 BYOK 활성 |
| `COPILOT_PROVIDER_TYPE` | `azure` | |
| `COPILOT_PROVIDER_API_KEY` | `<API_KEY>` | |
| `COPILOT_PROVIDER_AZURE_API_VERSION` | `2024-10-21` | |
| `COPILOT_MODEL` | `gpt-4o` | 배포 이름 |

→ `AZURE_OPENAI_*` 가 이미 있으면 `config.setup_byok_env()` 헬퍼가 자동으로 채워줌

**GitHub 토큰 불필요** (BYOK 활성 시 GitHub 인증 우회)

---

## 6. 배포 패턴 (로컬 → ACR)

ACR 원격 빌드(az acr build)는 편리하지만 Copilot CLI 설치처럼 빌드가 무거워지면 시간이 길어짐.  
로컬 Docker 빌드 → ACR 푸시가 캐시 활용으로 더 빠른 경우가 있음.

```bash
# linux/amd64 필수 (맥 M 시리즈 arm64 → ACA가 amd64 요구)
docker build --platform linux/amd64 \
  -t lipcodingabk8.azurecr.io/lipcoding-api:TAG \
  -t lipcodingabk8.azurecr.io/lipcoding-api:latest .
docker push lipcodingabk8.azurecr.io/lipcoding-api:TAG
az containerapp update -n lipcoding-api -g rg-lipcoding \
  --image "lipcodingabk8.azurecr.io/lipcoding-api:TAG"
```

---

## 7. 심사 점수 관점 (Copilot SDK 25%)

단순 호출 vs 오케스트레이션의 차이:

| 항목 | 단순 호출 | 에이전트 오케스트레이션 |
|---|---|---|
| 도구 역할 | JSON 파싱 전 장식 | 실제 출력 채널 |
| 결과 조립 | 모델 텍스트 JSON 파싱 | store(도구 호출 결과) |
| 스트리밍 가시화 | 토큰만 | 도구 발화 delta 포함 |
| prod 독립성 | JSON 파싱 실패 시 크래시 | store 없으면 Foundry 폴백 |

"에이전트 + 도구 호출 + 스트리밍"이 Copilot SDK 깊이 점수를 끌어올리는 조합.
