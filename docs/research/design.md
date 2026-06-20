# 앱 디자인/비주얼 제안

단일 사용자, 3화면 고정, Tailwind 수준 스타일. 작업기억 부하 감소가 컨셉.

## 비주얼 방향

| 측면 | 선택 | 이유 |
|---|---|---|
| 무드 | 차분·여백·"빈 책상" 느낌(바쁜 대시보드 X) | 핵심은 머리를 *비우는* 것. 잡다함은 컨셉과 모순 |
| 팔레트 | 웜 뉴트럴 베이스 + 차분한 단일 강조색 | 결정 부하↓, 웜 뉴트럴이 화이트보다 눈 피로↓ |
| 타이포 | `Inter` + 큰 행간, verdict용 디스플레이 1웨이트 | 한 서체·적은 크기 = 시각 파싱 부하↓ |
| 밀도 | 낮음. 넉넉한 패딩(`p-6`/`gap-6`), 본문 폭 ~640–720px | 화면당 ≤5개 강제, 작업기억 프레이밍과 일치 |

### 팔레트 (hex)

```text
Background    #FAF9F6  (warm paper)
Surface/card  #FFFFFF
Border/hair   #ECEAE3
Text primary  #1F2421  (near-black green-grey)
Text muted    #6B7280
Accent (calm) #4F7D6E  (sage/teal — go/approve)
Accent soft   #E7F0EC  (accent tint, chips/fills)
Warn/dump     #C08A3E  (muted amber — parked)
Error         #B4544A  (muted clay red, never bright)
```

규칙: **순수 채도 색 금지.** 전부 탈채도 → 화면이 "소리치지" 않음.

## 화면별 레이아웃

### 1. 인박스 / 캡처

```text
┌────────────────────────────────────────────┐
│  ●●●○○   working memory: 3 / 5 in mind      │  ← 상단 5슬롯 미터
├────────────────────────────────────────────┤
│   What's on your mind?                      │
│   ┌──────────────────────────────────┐      │
│   │  type an idea…                   │      │
│   └──────────────────────────────────┘      │
│                      [ Drop it ]            │
│   ── AI verdict ──────────────────────      │
│   │ ✦ Actionable now                  │     │  ← 스트리밍
│   │   [ Keep on desk ]  [ Send to dump]│    │
└────────────────────────────────────────────┘
```

- 입력 → Enter/"Drop it" → verdict가 아래로 스트리밍(토큰 단위, 첫 토큰 전 펄스 점).
- 로딩: 입력 보더 쉬머 + 버튼 `Thinking…` 비활성.
- 에러: 입력 아래 muted-clay 배너 *"판정에 못 닿음 — 초안으로 저장됨. 재시도?"*(캡처는 안 막음).
- **사람 승인 내장**: verdict는 자동 분류 X, 사용자가 "Keep on desk"/"Send to dump" 선택.

### 2. 덤프 리스트 (보관 + 사전조사)

```text
┌────────────────────────────────────────────┐
│  Dump · 12 parked ideas        [ filter ▾ ] │
├────────────────────────────────────────────┤
│ ▸ Rewrite onboarding email                  │
│   amber chip: parked · 2d ago               │
│   ┌ AI notes ─────────────────────────┐     │
│   │ • Found 3 templates…  (streaming) │     │
│   └───────────────────────────────────┘     │
│ ▸ Try local-first sync lib                  │
│   amber chip: researching… ◴               │  ← 진행 중 상태
└────────────────────────────────────────────┘
```

- 단일 스크롤 컬럼, 접히는 카드. 접힘=제목+amber chip, 펼침=AI 사전조사 노트.
- 스트리밍: 리서치 노트가 불릿 단위로 하나씩. 진행 중 카드는 `researching… ◴`.
- 리스트 로딩: 스켈레톤 카드 3개(스피너 없음).
- 항목별 에러: 제목 유지 + *"리서치 일시정지. 재개?"* — 실패가 카드 하나에 격리.

### 3. 제안 패널 (지금 해볼만?)

```text
┌────────────────────────────────────────────┐
│  Worth doing now?                           │
│  One thing at a time — you decide.          │
├────────────────────────────────────────────┤
│   ┌──────────────────────────────────┐      │
│   │  Rewrite onboarding email        │      │
│   │  Why now: low effort, blocks 2…  │      │  ← 근거 스트리밍
│   │   [ Not now ]      [ Let's do it ]│     │  ← 사람 승인
│   └──────────────────────────────────┘      │
│        ● ○ ○   (1 of 3 suggestions)         │
└────────────────────────────────────────────┘
```

- 한 번에 큰 카드 1장(덱/스와이프 느낌) + 점 페이저. "≤5 in mind" 강화.
- `Let's do it`(sage) → 책상으로 이동 + 간단 확인. `Not now` → 다음 카드.
- 스트리밍: 버튼 활성화 전 "Why now" 근거가 스트리밍.
- 에러/빈 상태: *"지금은 제안 없음 — 덤프가 평온합니다."*(빈 상태를 *좋은* 상태로 취급).

## 빠른 빌드 스택 (4시간 적합)

**추천: Tailwind + shadcn/ui (내부 Radix headless).**

- `Card` `Button` `Textarea` `Badge` `Skeleton` `Progress` — 3화면에 필요한 프리미티브
  정확히 제공, 리포에 복붙(무거운 의존 없음). 접근성 + CSS 변수 테마.

셋업(고수준):

1. `Vite + React + Tailwind` 베이스.
2. `npx shadcn@latest init` → base color neutral, CSS 변수에 팔레트 hex 주입.
3. `npx shadcn@latest add card button textarea badge skeleton progress`.

회피: MUI/Chakra 같은 풀 킷 — 무겁고 미니멀 미학과 충돌, 리스타일 느림.

## 저비용 "와우" 포인트

1. **5슬롯 작업기억 미터**(`●●●○○`) 인박스 상단 고정 — 캡처 시 슬롯이 차고, 5 초과 시
   가볍게 흔들/탈채도 → 인지 프레이밍을 직접 시각화. (~10분, 순수 CSS)
2. **토큰 스트리밍** 모든 AI verdict/근거 — 즉시 "라이브 AI"로 읽힘.
3. **차분한 빈 상태**를 기능으로: 빈 덤프 = *"짊어진 게 없네요. 좋습니다."* + 흐린 호흡 점.
4. **한 번에 하나** 제안 덱 — 의도적 페이싱이 "사람이 결정"의 가치를 크게 보여줌.
5. **verdict 색 시맨틱** — sage=실행가능, amber=보관. 두 눈길, 읽을 필요 없음.

## 스코프 & 예산 (~1시간 UI)

- [ ] (10m) Tailwind + shadcn init, 팔레트 테마 변수, max-width 컨테이너 + 레이아웃 셸
- [ ] (15m) 화면1: textarea + 버튼 + verdict 카드 + 스트리밍/로딩/에러
- [ ] (10m) 5슬롯 메모리 미터 컴포넌트(상단 바 재사용)
- [ ] (10m) 화면2: 접히는 카드 리스트 + 스켈레톤 + 항목별 리서치/에러
- [ ] (10m) 화면3: 단일 제안 카드 + 점 페이저 + 승인/기각
- [ ] (5m) 빈 상태 + 최종 간격/대비 패스

**예산 내.** 뒤처지면 먼저 컷할 오버버짓:

- 제안 덱 스와이프/드래그 애니 → 단순 페이드 + 버튼.
- 덤프 실제 필터 드롭다운 → 정적 라벨 먼저.
- 메모리 미터 "흔들" 애니 → 정적 탈채도면 충분.
