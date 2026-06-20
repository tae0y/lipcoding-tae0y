# 잔여 작업 목록

> 갱신: 2026-06-20 (병렬 감사 결과 반영)  
> 기준: OpenAPI 스펙(`openapi.yaml`) + 감사 보고서 3종(백엔드·프론트엔드·통합)

---

## ✅ 완료된 작업

| 항목 | 커밋 |
|------|------|
| FastAPI 앱 골격 + DB + 모델 | `f1e363c` |
| 백엔드 엔드포인트 전체(9/10) + 통합 테스트 | `b888f0d` |
| Copilot SDK AI 입구 판정(`judgment.py`) | `78e95e0` |
| `POST /api/ideas/{ideaId}/research` 엔드포인트 + AI 사전조사 | `78e95e0` |
| 프론트엔드 2화면(CaptureScreen / InboxScreen) | `b00ab92` |
| 사전조사 실행 버튼 UI + 프론트엔드 빌드 | `26c6143` |
| shadcn 컴포넌트(Card/Button/Textarea/Badge/Skeleton) | `b00ab92` |
| 의사결정 버튼 3종(accepted/postponed/dismissed) | `b00ab92` |
| 주간 트리거 실행 / 현재 제안 조회 / 제안 결정 | `78e95e0` |
| 백엔드 정적 빌드 서빙 + SPA fallback | `26c6143` |

---

## 🔴 P0 — 엔드투엔드 플로우 차단 위험

### 1. 아이디어 삭제 버튼 없음
- `deleteIdea()` 함수는 `api.ts`에 있으나 `InboxScreen`에 버튼 없음
- `useIdeas` 훅이 `deleteIdea` 액션을 노출하지 않음
- 심사관이 삭제 동작을 테스트할 경우 UI에서 불가능

**수정 범위:**
1. `useIdeas.ts` — `deleteIdea(id)` 액션 노출
2. `InboxScreen.tsx` — 각 항목에 삭제 버튼 추가 (destructive 스타일)

---

## 🟡 P1 — 스펙 준수 미흡

### 2. `research` 엔드포인트에 `response_model` 누락
- `POST /api/ideas/{ideaId}/research` 라우트에 `response_model=Research` 미선언
- FastAPI 생성 OpenAPI에 200 응답 스키마가 없음
- 현재 `JSONResponse` 직접 반환으로 Pydantic 검증 우회

**수정:** `main.py` 해당 라우트에 `response_model=Research` 추가, `JSONResponse` 제거 후 `Research` 객체 직접 반환

### 3. `research` 엔드포인트 테스트 0개
- 테스트 파일에 `/research` 경로 테스트 전무
- 필요 케이스: 409(info_gap 아님), 404(없는 아이디어), 200(동기), stream 응답

---

## 🟠 P2 — 기능 품질

### 4. Screen C(상세 화면) 미구현
- `GET /api/ideas/{ideaId}` 엔드포인트가 프론트엔드에서 전혀 호출 안 됨
- 사전조사 결과는 현재 InboxScreen 인라인 `<details>`로만 표시
- **판단:** 시간 여유 있을 때 구현; 시간 없으면 인라인 표시로 대체 가능

### 5. `useSuggestion` 페이지 로드 시 자동 트리거 문제
- `getCurrentSuggestion()` 반환이 null이면 즉시 `POST /api/suggestions/run` 호출
- 주간 트리거는 스케줄 기반이어야 하나 현재 페이지 로드마다 실행
- **판단:** 데모 편의를 위해 유지 가능; 실제 배포 전 수정 권장

---

## 🔵 P3 — 사소한 스펙 편차 (배포 전 필수 아님)

### 6. 경로 파라미터명 불일치
- 백엔드: `{idea_id}` (snake_case) / 스펙: `{ideaId}` (camelCase)
- 런타임에 영향 없음, FastAPI 생성 OpenAPI 문서만 차이

### 7. `additionalProperties: false` 미적용
- `IdeaCreateRequest`, `TriggerSchedule` Pydantic 모델에 `model_config = ConfigDict(extra='forbid')` 없음

---

## 통합 상태 요약

| 항목 | 상태 |
|------|------|
| 백엔드↔프론트 URL 전체 일치 | ✅ |
| 요청 바디 형태 일치 | ✅ |
| 응답 형태 일치 | ✅ |
| CORS 설정 | ✅ |
| 정적 파일 서빙(SPA fallback) | ✅ |

---

## 작업 순서 제안 (시간 제약 기준)

```
1. [P0] 삭제 버튼 UI 연결          ← 30분
2. [P1] response_model 추가         ← 10분
3. [P1] research 테스트 4개         ← 30분
4. [P2] Screen C 구현 (시간 남으면) ← 60분
5. [P3] 나머지 (배포 전 필요 시)
```
