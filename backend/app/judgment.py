"""입구 판정 — 임시 휴리스틱.

Block A 베이스라인용. Block B에서 Copilot SDK 도구 호출로 교체한다.
2요소(정보 준비성 + 현재 여유)를 단순 규칙으로 흉내내어 엔드투엔드를 먼저 굴린다.
"""

from __future__ import annotations

from app.models import DumpReason, IdeaStatus, UserState

# "다음 액션"이 구체적인지 가늠하는 동사 신호 (정보 준비성 프록시)
_ACTIONABLE_HINTS = (
    "하기",
    "사기",
    "보내기",
    "예약",
    "신청",
    "등록",
    "전화",
    "이메일",
    "메일",
    "작성",
    "읽기",
    "정리",
    "call",
    "buy",
    "email",
    "book",
    "write",
)


def judge_idea(text: str, state: UserState) -> tuple[IdeaStatus, DumpReason | None]:
    """아이디어 텍스트와 현재 상태로 inbox/dump를 판정한다.

    규칙(임시):
    - 정보 준비성: 텍스트가 짧고 구체 동사 신호가 없으면 info_gap.
    - 현재 여유: 저녁이 차거나 감정이 나쁘면 no_capacity.
    둘 다 통과해야 inbox.
    """
    info_ready = _has_actionable_signal(text)
    has_capacity = (not state.calendarBusy) and state.emotion.value != "bad"

    if info_ready and has_capacity:
        return IdeaStatus.inbox, None
    if not info_ready:
        # 정보 부족이 우선 사유 — AI 사전조사 대상
        return IdeaStatus.dump, DumpReason.info_gap
    return IdeaStatus.dump, DumpReason.no_capacity


def _has_actionable_signal(text: str) -> bool:
    """구체적 다음 액션 신호가 있는지 대략 판단한다."""
    lowered = text.lower()
    if any(hint in lowered for hint in _ACTIONABLE_HINTS):
        return True
    # 충분히 길고 명사구가 있으면 일단 착수 가능으로 본다.
    return len(text.strip()) >= 20
