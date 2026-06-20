"""AI 사전조사 생성 — Copilot SDK 도구 호출 기반.

Block C 구현. info_gap 덤프 항목에 대해 Copilot SDK 에이전트가
materials(재료·참고 사실) + options(선택지/프레임)를 생성한다.
"다음 액션 결정"은 생성하지 않음 — 강화(augment) 원칙.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import AsyncIterator

from copilot import CopilotClient, PermissionHandler
from copilot.tools import define_tool
from pydantic import BaseModel, Field

from app.models import Research, ResearchMaterial

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

class CollectMaterialsParams(BaseModel):
    materials: list[dict] = Field(
        description="재료 목록. 각 항목은 {fact: str, url?: str} 형식."
                    "아이디어 실행에 필요한 핵심 사실, 참고 정보, 수치를 3~5개 포함."
    )


@define_tool(
    description="아이디어 실행에 필요한 핵심 사실과 참고 재료를 수집한다. "
                "사실(fact)과 선택적 URL로 구성된 목록을 반환한다."
)
async def collect_materials(params: CollectMaterialsParams) -> dict:
    return {"materials": params.materials}


class FrameOptionsParams(BaseModel):
    options: list[str] = Field(
        description="아이디어를 실행하는 선택지 또는 접근 프레임 2~4개. "
                    "각 옵션은 한 문장으로 구체적으로 서술한다."
    )


@define_tool(
    description="아이디어를 실행하는 다양한 접근법/프레임/선택지를 제시한다. "
                "사람이 최종 결정할 수 있도록 선택지만 제공하고, 특정 옵션을 추천하지 않는다."
)
async def frame_options(params: FrameOptionsParams) -> dict:
    return {"options": params.options}


# ── 폴백 휴리스틱 ─────────────────────────────────────────────────────────

def _heuristic_research(idea_text: str) -> Research:
    """AOAI 미설정/SDK 실패 시 사용할 최소 사전조사(500 크래시 방지)."""
    return Research(
        materials=[
            ResearchMaterial(
                fact=f"'{idea_text}' 실행에 필요한 핵심 정보를 먼저 모아두면 착수가 쉬워집니다.",
                url=None,
            ),
        ],
        options=[
            "필요한 자료·링크를 한곳에 모아 정리하기",
            "30분 안에 시도해볼 가장 작은 버전 정의하기",
            "비슷한 사례나 경험자를 한 명 찾아보기",
        ],
        generatedAt=datetime.now(timezone.utc),
    )


async def _heuristic_research_stream(idea_text: str) -> AsyncIterator[dict]:
    """휴리스틱 사전조사를 SSE delta+result로 흘려보낸다."""
    research = _heuristic_research(idea_text)
    yield {"event": "delta", "data": "AI 사전조사를 사용할 수 없어 기본 안내를 제공합니다."}
    yield {"event": "result", "data": research.model_dump_json()}


# ── 동기 생성 ───────────────────────────────────────────────────────────

async def generate_research(idea_text: str) -> Research:
    """info_gap 사전조사 생성. SKIP_COPILOT_SDK=1 또는 SDK 실패 시 휴리스틱 폴백."""
    if os.environ.get("SKIP_COPILOT_SDK") == "1":
        return _heuristic_research(idea_text)
    try:
        return await _generate_research_sdk(idea_text)
    except Exception as exc:
        logger.warning("SDK 사전조사 실패, 휴리스틱 폴백: %s", exc)
        return _heuristic_research(idea_text)


async def _generate_research_sdk(idea_text: str) -> Research:
    """Copilot SDK 에이전트가 도구 호출로 사전조사를 생성한다."""
    model = os.environ["AZURE_OPENAI_DEPLOYMENT"]
    provider = _provider()

    prompt = (
        f"아이디어: {idea_text!r}\n\n"
        "이 아이디어의 실행 가능성을 높이기 위해 다음 두 도구를 순서대로 호출하라:\n"
        "1. collect_materials — 실행에 필요한 핵심 사실 3~5개 수집\n"
        "2. frame_options — 접근 가능한 선택지/프레임 2~4개 제시\n\n"
        "중요: '다음 액션을 ○○하라'는 지시는 생성하지 말 것. "
        "재료와 선택지만 제공하고 결정은 사람의 몫으로 남긴다.\n\n"
        "두 도구 호출이 끝나면 아래 JSON 형식으로만 답하라(다른 텍스트 없이):\n"
        '{"materials":[{"fact":"...","url":null}],"options":["..."]}'
    )

    async with CopilotClient() as client:
        session = await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model=model,
            provider=provider,
            tools=[collect_materials, frame_options],
        )
        resp = await session.send_and_wait(prompt)

    content: str = getattr(getattr(resp, "data", None), "content", None) or str(resp)
    start = content.find("{")
    end = content.rfind("}") + 1
    data = json.loads(content[start:end])

    return Research(
        materials=[ResearchMaterial(**m) for m in data.get("materials", [])],
        options=data.get("options", []),
        generatedAt=datetime.now(timezone.utc),
    )


# ── SSE 스트리밍 생성 ──────────────────────────────────────────────────────────

async def generate_research_stream(idea_text: str) -> AsyncIterator[dict]:
    """info_gap 사전조사 스트림. SKIP_COPILOT_SDK=1/SDK 실패 시 휴리스틱 폴백."""
    if os.environ.get("SKIP_COPILOT_SDK") == "1":
        async for ev in _heuristic_research_stream(idea_text):
            yield ev
        return
    try:
        async for ev in _generate_research_stream_sdk(idea_text):
            yield ev
    except Exception as exc:
        logger.warning("SDK 사전조사 스트림 실패, 휴리스틱 폴백: %s", exc)
        async for ev in _heuristic_research_stream(idea_text):
            yield ev


async def _generate_research_stream_sdk(idea_text: str) -> AsyncIterator[dict]:
    """Copilot SDK 스트리밍으로 사전조사를 생성하며 SSE 이벤트를 yield한다.

    이벤트 종류:
    - {"event": "delta", "data": "<텍스트 조각>"}
    - {"event": "result", "data": "<Research JSON>"}
    """
    model = os.environ["AZURE_OPENAI_DEPLOYMENT"]
    provider = _provider()

    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    full_content: list[str] = []

    def on_event(event) -> None:
        etype = str(getattr(event, "type", type(event).__name__))
        if "ASSISTANT_MESSAGE_DELTA" in etype or "assistant.message_delta" in etype:
            delta = getattr(getattr(event, "data", None), "delta_content", None) or ""
            if delta:
                full_content.append(delta)
                queue.put_nowait({"event": "delta", "data": delta})
        elif any(t in etype for t in ("SessionEventType.IDLE", "session.idle", "IDLE")):
            queue.put_nowait(None)  # 완료 신호

    prompt = (
        f"아이디어: {idea_text!r}\n\n"
        "collect_materials와 frame_options 도구를 호출해 사전조사를 수행하라.\n"
        "모든 도구 호출이 끝나면 아래 JSON 형식으로만 결과를 출력하라:\n"
        '{"materials":[{"fact":"...","url":null}],"options":["..."]}'
    )

    async with CopilotClient() as client:
        session = await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model=model,
            provider=provider,
            streaming=True,
            tools=[collect_materials, frame_options],
            on_event=on_event,
        )
        await session.send(prompt)

        while True:
            item = await asyncio.wait_for(queue.get(), timeout=90)
            if item is None:
                break
            yield item

    # 스트림이 끝나면 축적된 내용으로 Research 객체를 만들어 result 이벤트로 전달
    content = "".join(full_content)
    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        data = json.loads(content[start:end])
        research = Research(
            materials=[ResearchMaterial(**m) for m in data.get("materials", [])],
            options=data.get("options", []),
            generatedAt=datetime.now(timezone.utc),
        )
        yield {"event": "result", "data": research.model_dump_json()}
    except Exception as exc:
        logger.error("사전조사 스트림 파싱 실패: %s | content=%r", exc, content[:200])
        yield {"event": "error", "data": str(exc)}
