# 세션 핸드오버 프롬프트

> 이 파일을 다음 Copilot 채팅 세션의 **첫 메시지**로 붙여넣어 컨텍스트를 이어받는다.

---

## 복사해서 붙여넣을 프롬프트

```
천하제일 입코딩 대회 2026 프로젝트를 이어받는다.

## 현재 시각
date 명령으로 현재 시각을 확인하고, competition-plan.md의 블록 계획과 대조해서
지금 어느 블록인지, 남은 시간이 얼마인지 알려줘.

## 프로젝트 한 줄 정의
사용자가 아이디어를 던지면 AI(Copilot SDK)가 "지금 착수 가능한가"를 판정해
inbox 또는 dump로 분류한다. dump 항목 중 info_gap은 AI가 사전조사를 해두고,
주 1회 퇴근 후 부하가 낮을 때 "지금 해볼까요?"로 제안한다. 사람이 최종 승인.

## 스택
- 백엔드: FastAPI + Copilot SDK (Python), SQLite, backend/
- 프론트: React + TypeScript + Tailwind v4 + shadcn/neutral, frontend/
- 배포: Azure App Service (backend/static/ 에 빌드 서빙)
- API 계약: docs/plan/openapi.yaml

## 현재 HEAD 커밋
b076654 — fix: Copilot SDK 연결 품질 3종 개선 (SSE 스트리밍, 진행 텍스트 표시)

## 미커밋 파일 주의
frontend/src/screens/InboxScreen.tsx — modified (unstaged)
→ git diff 로 내용 확인 후, 유효하면 커밋 / 아니면 git restore

## 즉시 해야 할 작업 (docs/plan/remaining-work.md 전문 참조)

### P0 — 삭제 버튼 없음 (20분)
1. frontend/src/hooks/useIdeas.ts — deleteIdea(id) 액션 추가
2. frontend/src/screens/InboxScreen.tsx — 각 항목에 삭제 버튼 추가
   (variant="destructive", size="sm", 클릭 시 confirm 없이 즉시 삭제)

### P1 — research 엔드포인트 response_model 누락 (5분)
backend/app/main.py의 POST /api/ideas/{idea_id}/research 라우트에
response_model=Research 추가, JSONResponse 제거하고 Research 객체 직접 반환

### P1 — research 테스트 (30분)
backend/tests/ 에 다음 4케이스 추가:
- 409: no_capacity 아이디어에 /research 호출
- 404: 없는 ideaId
- 200 sync: info_gap 아이디어, stream=false
- 200 stream: stream=true → text/event-stream Content-Type

### 배포 (블록 E, 15:40 데드라인)
scripts/build.sh 실행 → 프론트 빌드 → backend/static/ 복사 → Azure 배포
배포 후 실제 Azure URL에서 전 흐름(캡처→dump→research→제안→결정) 확인

## 심사 가중치 (잊지 말 것)
- Copilot SDK 활용도 25% — 깊이(스트리밍 + 도구 호출) 이미 구현됨, 데모에서 강조
- Azure AI 18% — Azure OpenAI 경유 강조
- Responsible AI 6% — 제안 승인이 항상 사람이 함을 명시
- 배포 데드라인: 16:30 엄수

## 참고 문서
- docs/plan/remaining-work.md — 잔여 작업 전체 목록
- docs/plan/competition-plan.md — 블록별 시간 계획
- docs/presentation/demo-scenario.md — 데모 대본 5장면
- docs/plan/openapi.yaml — API 계약 전문
```
