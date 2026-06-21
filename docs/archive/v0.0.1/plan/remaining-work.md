# 잔여 작업 목록

> 갱신: 2026-06-20 14:00 KST (세션 2 종료 시점)  
> 현재 HEAD: `b076654`

---

## ✅ 완료된 작업 (전체)

| 항목 | 커밋 |
|------|------|
| FastAPI 앱 골격 + DB + 모델 | `f1e363c` |
| 백엔드 엔드포인트 전체 + 통합 테스트 | `b888f0d` |
| Copilot SDK AI 입구 판정 (`judgment.py`) | `78e95e0` |
| `POST /api/ideas/{ideaId}/research` + AI 사전조사 (동기) | `78e95e0` |
| SSE 스트리밍 사전조사 (`runResearchStream`, delta 이벤트) | `b076654` |
| 프론트엔드 2화면 (CaptureScreen / InboxScreen) | `b00ab92` |
| 사전조사 실행 버튼 + 진행 텍스트 실시간 표시 | `b076654` |
| 의사결정 버튼 3종 (accepted/postponed/dismissed) | `b00ab92` |
| 주간 트리거 / 제안 조회 / 제안 결정 | `78e95e0` |
| 정적 빌드 서빙 + SPA fallback | `26c6143` |
| 데모 시나리오 대본 | `10ada85` |
| 완료 설계 문서 completed/ 이동 | `a5caf11` |

---

## 🔴 P0 — 심사관 눈에 바로 보이는 미구현

### 1. 아이디어 삭제 버튼 없음
- `api.ts`에 `deleteIdea()` 함수 있으나 `useIdeas`가 노출 안 함
- `InboxScreen`에 삭제 버튼 없음

**수정 범위 (예상 20분):**
```
frontend/src/hooks/useIdeas.ts   — deleteIdea(id) 액션 추가
frontend/src/screens/InboxScreen.tsx — 각 항목 우측에 삭제 버튼 (variant="destructive", size="sm")
```

---

## 🟡 P1 — 스펙 준수 / 테스트

### 2. `research` 엔드포인트 `response_model` 누락
- `main.py` 라우트 데코레이터에 `response_model=Research` 미선언
- FastAPI `/docs`에서 200 응답 스키마가 없음

**수정 (5분):** `main.py`에서 `JSONResponse` 제거하고 `Research` 객체 직접 반환 + `response_model=Research` 추가

### 3. `research` 엔드포인트 테스트 전무
**필요 케이스 4개 (예상 30분):**
```python
# backend/tests/test_ideas.py 또는 test_research.py
def test_research_409_not_info_gap()   # no_capacity 아이디어에 실행 시
def test_research_404_unknown_idea()    # 없는 ideaId
def test_research_200_sync()           # info_gap 아이디어, stream=false
def test_research_200_stream()         # stream=true → text/event-stream
```

---

## 🟠 P2 — 기능 품질 (시간 남으면)

### 4. InboxScreen 미커밋 변경 있음
- `git status`에 `InboxScreen.tsx` modified (unstaged)
- 설정 섹션을 `<details>` 접기로 변경한 것으로 추정
- **다음 세션 시작 전 확인 후 커밋 또는 되돌리기**

### 5. `useSuggestion` 페이지 로드마다 주간 트리거 실행
- null 반환 시 즉시 `POST /api/suggestions/run` 호출
- 데모 편의상 유지 가능; 실제 운영 배포 전 수정 권장

### 6. Screen C (아이디어 상세 화면) 미구현
- `GET /api/ideas/{ideaId}` 프론트에서 미호출
- 현재 research 결과는 InboxScreen 인라인 `<details>`로 표시 중
- **판단:** 시간 제약상 생략 가능, 인라인 표시로 대체

---

## 🔵 P3 — 사소한 스펙 편차

### 7. 경로 파라미터명 `{idea_id}` vs `{ideaId}`
- 런타임 영향 없음, FastAPI 자동 생성 OpenAPI 문서만 차이

### 8. `additionalProperties: false` 미적용
- `IdeaCreateRequest`, `TriggerSchedule`에 `extra='forbid'` 없음

---

## Azure 배포 상태

- 마지막 확인: `az webapp log deployment show` 성공 (이전 세션)
- **다음 세션 시작 시 재배포 + 엔드투엔드 확인 필수**
- 배포 명령: `scripts/build.sh` → `az webapp deploy` 또는 GitHub Actions

---

## 시간 계획 (13:57 기준)

| 시간 | 블록 | 남은 작업 |
|------|------|-----------|
| 14:00-14:30 | D 초반 | P0 삭제 버튼 + P1 response_model |
| 14:30-15:00 | D 후반 | P1 research 테스트 + 미커밋 정리 |
| 15:00-15:40 | D 마감 | UX 폴리시 + 빌드 |
| 15:40-16:10 | **E 배포** | Azure 재배포 + 엔드투엔드 확인 |
| 16:10-16:30 | **F 제출** | 제출 폼 + 데모 리허설 |
