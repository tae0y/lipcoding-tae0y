# 재구현 백로그 (v0.0.2)

> 작성: 2026-06-21 · 기준 커밋: `8cd0882` (0단계 정리 완료)
> 대회 제출본 = `v0.0.1` 태그. 채점 피드백 [../FEEDBACK.md](../FEEDBACK.md), 회고 [../RECALL.md](../RECALL.md).

재구현 진행 순서: **0 정리(완료) → 1 누락 아이디어 → 2 피드백 TODO → 3 UI 개선**.

---

## 1단계 — 아이디어 > PRD > OpenAPI 누락분

원래 구상([../ideation/README.md](../ideation/README.md))에는 있었으나 PRD/OpenAPI/구현에서
약화되거나 빠진 항목.

| # | 누락/약화된 아이디어 | 구상 출처 | 현재 상태 | 비고 |
|---|---|---|---|---|
| 1.1 | **작업기억 5칸 보호** — "지금 앞에 두는 항목은 최대 5개" | ideation "최대 다섯개" | UX로 강제 안 함 (inbox 무제한) | 5±2 슬롯 컨셉이 README 배경에만 존재 |
| 1.2 | **AI 자율 사전조사(진짜 외부조회)** | ideation "스스로 사람을 대신해 조사" | 단일 호출에 도구 형식만 입힘, 외부검색 없음 | RECALL/FEEDBACK 공통 지적 |
| 1.3 | **주간 트리거 실제 스케줄 배치** | PRD 3.2 "Scheduled batch on weekday+time" | `POST /suggestions/run` 수동 호출만 | 실제 스케줄러 없음 |
| 1.4 | **임베딩 유사도 랭킹(덤프 ≥5)** | PRD 3.2 "embedding similarity" | 고정문구/단순 우선순위 | 미구현 |
| 1.5 | **부하 게이트(calendarBusy=false & emotion≠bad)** | PRD 3.2 load gate | 부분 구현 (확인 필요) | 트리거 조건 검증 필요 |
| 1.6 | **info_gap 사전조사 결과의 사람-결정 보존** | ideation "계획·통합은 사람에게" | 결정 버튼은 있음 | 사전조사 실패 시 조용히 무시(개선 필요) |

> 다음 세션 액션: 위 표를 PRD 재작성 시 명시 요구사항으로 승격하고,
> 각 항목을 OpenAPI 계약/스케줄러 설계에 반영.

---

## 2단계 — 채점 피드백 → 해야할 일

[../FEEDBACK.md](../FEEDBACK.md) 항목별 점수 기반. **Responsible AI/Security/Trust가 유일한 3점**.

### P0 — 신뢰/보안 (3점, 최우선)
- [x] 2.1 **인증/권한 추가** — 패스프레이즈 + 서명 세션 쿠키(Starlette `SessionMiddleware`,
  HttpOnly·Secure·SameSite=Strict). `/api/*`·`/health/ai` 게이트 미들웨어(allowlist),
  `/api/auth/{login,logout,session}`, 프론트 로그인 게이트+401 처리, bicep 시크릿 주입.
  `APP_PASSPHRASE` 미설정 시 개방(로컬). `/docs`는 `ENABLE_DOCS` 기본 off.
- [ ] 2.2 **파괴적 동작 확인** — 삭제 시 확인 단계 / 실행 취소(undo)
- [ ] 2.3 **비밀값 관리** — API 키·ACR admin secret 직접 사용 → Key Vault / Managed Identity
- [ ] 2.4 **프롬프트 인젝션 방어 명시화** — 도구 스키마 의존 → 입력 검증/가드 명시

### P1 — Copilot SDK / 기능 완성도 (각 4점)
- [ ] 2.5 **도구가 실제 외부 검색 수행** — 모델 출력 구조화 채널 → 진짜 멀티턴 에이전트 루프 (1.2와 연결)
- [ ] 2.6 **주간 추천 실제 스케줄러 + 임베딩 랭킹** (1.3·1.4와 연결)
- [ ] 2.7 **테스트가 실제 Copilot SDK 경로 커버** — 현재 휴리스틱 우회 테스트 중심

### P2 — 클라우드/UX/임팩트 (각 4점)
- [ ] 2.8 **Azure OpenAI를 IaC로** — 기존 리소스 전제 → bicep에 포함
- [ ] 2.9 **UX 통제 장치** — 입력창 명시적 label, 사전조사 실패 노출, AI 작업 취소/결정 되돌리기
- [ ] 2.10 **생산성 정량 근거** — 절약 시간/단계 감소/오류 예방 측정 지표

---

## 3단계 — docs/assets 사진 기반 UI 개선

> 새 스크린샷·스케치가 [../assets/](../assets) 에 있음 (최신: `2026-06-21 20.58.05.png`, `20260621_*`).
> 디자인 DNA [../design/design-dna.md](../design/design-dna.md),
> ASCII 시안 [../design/ui-redesign-ascii.md](../design/ui-redesign-ascii.md) 작성 완료.

- [x] 3.1 assets 이미지 검토 후 개선 항목 목록화 → 디자인 DNA 문서로 정리
- [x] 3.2 현재 화면(Capture/Inbox/Settings)과 대조 → ASCII 시안 §5 변경 요약
- [ ] 3.3 열린 결정 4건 합의 (라이트/다크·악센트·세리프·배경 강도, DNA §6)
- [ ] 3.4 토큰·컴포넌트 코드 반영 (5칸 게이지, 글래스 표면, 203241 카드 템플릿)
- [ ] 3.5 2단계 2.9(UX 통제) 항목과 통합 반영

---

## 참고 — 현재 구현 상태 요약
- 백엔드: FastAPI + SQLite, `app/{config,db,judgment,models,main,research}.py`
- 프론트: React 19 + Vite + Tailwind, `screens/{Capture,Inbox,Settings}`
- API 계약: [openapi.yaml](openapi.yaml)
- 배포: Azure Container Apps (App Service 시도 후 선회)
