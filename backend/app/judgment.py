"""입구 판정 — Copilot SDK 도구 호출 기반.

Block B 구현. 2요소(정보 준비성 + 현재 여유)를 SDK 에이전트가
두 개의 도구를 호출해 평가한다. SDK 호출 실패 시 휴리스틱으로 폴백.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os

from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from pydantic import BaseModel, Field

from app.models import DumpReason, IdeaStatus, UserState
from app.prompt_guard import guarded_idea_block

logger = logging.getLogger(__name__)


# ── Azure OpenAI provider ─────────────────────────────────────────────────────

def _provider() -> dict:
    return {
        "type": "azure",
        "base_url": os.environ["AZURE_OPENAI_ENDPOINT"].rstrip("/"),
        "api_key": os.environ["AZURE_OPENAI_API_KEY"],
        "azure": {
            "api_version": os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21")
        },
    }


# ── 도구 정의 ─────────────────────────────────────────────────────────────────

class InfoReadinessParams(BaseModel):
    ready: bool = Field(
        description="아이디어에 구체적인 다음 액션이 명시되어 당장 착수 가능하면 true. "
                    "'○○하기', '○○에 전화', '메일 보내기'처럼 동사+대상이 분명하거나 "
                    "5W1H 중 3개 이상이 포함되면 true."
    )
    reason: str = Field(description="판단 근거 한 줄")


@define_tool(
    description="아이디어 텍스트를 분석해 정보 준비성(information readiness)을 평가한다. "
                "구체적인 다음 액션 동사와 대상이 있으면 ready=true를 반환한다."
)
async def evaluate_info_readiness(params: InfoReadinessParams) -> dict:
    return {"ready": params.ready, "reason": params.reason}


class CapacityParams(BaseModel):
    has_capacity: bool = Field(
        description="calendarBusy=false이고 emotion이 bad가 아니면 true."
    )
    reason: str = Field(description="판단 근거 한 줄")


@define_tool(
    description="사용자 현재 여유(capacity)를 평가한다. "
                "캘린더가 비어있고(calendarBusy=false) 감정 상태가 bad가 아니면 여유 있음으로 판단한다."
)
async def evaluate_capacity(params: CapacityParams) -> dict:
    return {"has_capacity": params.has_capacity, "reason": params.reason}


# ── 메인 판정 함수 ─────────────────────────────────────────────────────────────

async def _judge_with_sdk(text: str, state: UserState) -> tuple[IdeaStatus, DumpReason | None]:
    """Copilot SDK 에이전트가 두 도구를 호출해 판정한다."""
    model = os.environ["AZURE_OPENAI_DEPLOYMENT"]
    provider = _provider()

    prompt = (
        guarded_idea_block(text, context="judge") + "\n\n"
        f"사용자 상태: calendarBusy={state.calendarBusy}, "
        f"emotion={state.emotion.value}, "
        f"todos={len(state.todos)}개\n\n"
        "위 아이디어 데이터를 분석해 다음 두 도구를 순서대로 호출하라:\n"
        "1. evaluate_info_readiness — 아이디어의 정보 준비성 평가\n"
        "2. evaluate_capacity — 사용자 현재 여유 평가\n\n"
        "두 도구 호출이 끝나면 반드시 아래 JSON 형식으로만 답하라(다른 텍스트 없이):\n"
        '{"status":"inbox","dump_reason":null}\n'
        '또는 {"status":"dump","dump_reason":"info_gap"}\n'
        '또는 {"status":"dump","dump_reason":"no_capacity"}\n\n'
        "규칙: 정보 준비성 OR 여유 중 하나라도 부족하면 dump. "
        "정보 준비성 부족이 우선 사유(info_gap). 여유만 없으면 no_capacity."
    )

    async with CopilotClient() as client:
        session = await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model=model,
            provider=provider,
            tools=[evaluate_info_readiness, evaluate_capacity],
        )
        resp = await session.send_and_wait(prompt)

    content: str = getattr(getattr(resp, "data", None), "content", None) or str(resp)
    # JSON 블록 추출
    start = content.find("{")
    end = content.rfind("}") + 1
    verdict = json.loads(content[start:end])

    status = IdeaStatus(verdict["status"])
    dump_reason = DumpReason(verdict["dump_reason"]) if verdict.get("dump_reason") else None
    return status, dump_reason


async def judge_idea(text: str, state: UserState) -> tuple[IdeaStatus, DumpReason | None]:
    """아이디어 텍스트와 현재 상태로 inbox/dump를 판정한다.

    Copilot SDK 에이전트가 2요소(정보 준비성 + 현재 여유)를 도구 호출로 평가.
    SKIP_COPILOT_SDK=1 이거나 SDK 실패 시 휴리스틱 폴백.
    """
    if os.environ.get("SKIP_COPILOT_SDK") == "1":
        return _heuristic_judge(text, state)
    try:
        return await asyncio.wait_for(_judge_with_sdk(text, state), timeout=10.0)
    except Exception as exc:
        logger.warning("SDK 판정 실패, 휴리스틱 폴백: %s", exc)
        return _heuristic_judge(text, state)


# ── 폴백 휴리스틱 ─────────────────────────────────────────────────────────────

_ACTIONABLE_HINTS = (
    "하기", "사기", "보내기", "예약", "신청", "등록", "전화",
    "이메일", "메일", "작성", "읽기", "정리",
    "call", "buy", "email", "book", "write",
)


def _heuristic_judge(text: str, state: UserState) -> tuple[IdeaStatus, DumpReason | None]:
    lowered = text.lower()
    info_ready = any(hint in lowered for hint in _ACTIONABLE_HINTS) or len(text.strip()) >= 20
    has_capacity = (not state.calendarBusy) and state.emotion.value != "bad"

    if info_ready and has_capacity:
        return IdeaStatus.inbox, None
    if not info_ready:
        return IdeaStatus.dump, DumpReason.info_gap
    return IdeaStatus.dump, DumpReason.no_capacity
