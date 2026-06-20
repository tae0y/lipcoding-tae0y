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


def _make_client() -> CopilotClient:
    """SDK 런타임 클라이언트 생성.

    BYOK 모드(``COPILOT_PROVIDER_BASE_URL`` 설정)일 때는 ``use_logged_in_user=False``
    로 강제한다. 그래야 번들 런타임이 ``--no-auto-login`` 으로 떠서 GitHub 로그인
    사용자 없이도(헤드리스 서버/컨테이너) BYOK 프로바이더로 동작한다. 이 플래그가
    없으면 기본값이 ``True`` 라 런타임이 GitHub 자동 로그인을 시도하다 막혀
    빈 결과로 끝난다(운영 컨테이너 증상).
    """
    if os.environ.get("COPILOT_PROVIDER_BASE_URL", "").strip():
        return CopilotClient(use_logged_in_user=False)
    return CopilotClient()


# ── 도구 정의 ─────────────────────────────────────────────────────────────────
#
# 핵심: 도구는 "장식"이 아니라 에이전트의 실제 출력 채널이다.
# 에이전트가 도구를 호출하면 핸들러가 받은 구조화 인자를 store에 적재하고,
# 최종 Research 는 모델이 추가로 뱉는 JSON 덩어리가 아니라 store(=도구 호출 결과)에서
# 조립한다. 이것이 "API 한 번 호출" → "도구 호출 오케스트레이션"의 본질적 차이.


class CollectMaterialsParams(BaseModel):
    materials: list[dict] = Field(
        description="재료 목록. 각 항목은 {fact: str, url?: str} 형식. "
                    "아이디어에 '바로 착수'하는 데 쓰이는 구체적 사실 3~5개. "
                    "예: 적정 인원·주기 같은 수치, 준비 체크리스트 항목, 쓸 만한 툴·플랫폼 이름, "
                    "흔한 실패 요인, 참고할 사례. "
                    "금지: 아이디어 그 자체를 정의·재진술하는 문장('○○은 ~이다', '○○은 ~할 수 있다'). "
                    "일반론·사전적 설명이 아니라 실행자가 당장 참고할 정보만 담는다."
    )


class FrameOptionsParams(BaseModel):
    options: list[str] = Field(
        description="아이디어를 진전시킬 '다음에 시도할 구체적 행동 프레임' 2~4개. "
                    "각 옵션은 한 문장으로, 무엇을 어떻게 할지 분명히 서술한다. "
                    "금지: 아이디어를 일반적으로 운영하는 방식을 추상적으로 나열하는 것. "
                    "사람이 바로 고를 수 있는 구체적 선택지여야 한다."
    )


def _make_research_tools(store: dict, on_tool=None) -> list:
    """이번 생성 1회에 바인딩된 도구 2개를 만든다.

    핸들러가 받은 구조화 인자를 ``store`` 에 적재한다(= 도구 호출이 곧 결과).
    ``on_tool(name, count)`` 가 주어지면 도구 발화를 외부(스트림)로 알린다.
    """

    @define_tool(
        description="아이디어 실행에 바로 쓰이는 구체적 사실·참고 재료를 수집해 보관한다. "
                    "아이디어를 정의하지 않고, 착수에 필요한 수치·체크리스트·툴 이름·실패 요인 같은 "
                    "구체적 사실(fact)과 선택적 URL 목록을 받는다."
    )
    async def collect_materials(params: CollectMaterialsParams) -> dict:
        materials: list[ResearchMaterial] = []
        for m in params.materials:
            try:
                materials.append(ResearchMaterial(**m))
            except Exception:
                materials.append(ResearchMaterial(fact=str(m), url=None))
        store["materials"] = materials
        if on_tool is not None:
            on_tool("collect_materials", len(materials))
        return {"ok": True, "collected": len(materials)}

    @define_tool(
        description="아이디어를 실행하는 다양한 접근법/프레임/선택지를 보관한다. "
                    "사람이 최종 결정할 수 있도록 선택지만 제공하고, 특정 옵션을 추천하지 않는다."
    )
    async def frame_options(params: FrameOptionsParams) -> dict:
        options = [str(o) for o in params.options]
        store["options"] = options
        if on_tool is not None:
            on_tool("frame_options", len(options))
        return {"ok": True, "framed": len(options)}

    return [collect_materials, frame_options]


def _research_from_store(store: dict) -> Research | None:
    """도구 호출로 적재된 store 에서 Research 를 조립한다."""
    materials = store.get("materials")
    options = store.get("options")
    if not materials and not options:
        return None
    return Research(
        materials=materials or [],
        options=options or [],
        generatedAt=datetime.now(timezone.utc),
    )


def _research_from_json(content: str) -> Research | None:
    """폴백: 모델이 텍스트로 뱉은 JSON 덩어리에서 Research 를 복구한다."""
    try:
        start = content.find("{")
        end = content.rfind("}") + 1
        data = json.loads(content[start:end])
    except Exception:
        return None
    materials = []
    for m in data.get("materials", []):
        try:
            materials.append(ResearchMaterial(**m))
        except Exception:
            continue
    options = [str(o) for o in data.get("options", [])]
    if not materials and not options:
        return None
    return Research(
        materials=materials,
        options=options,
        generatedAt=datetime.now(timezone.utc),
    )


# ── Azure Foundry 직접 호출 폴백 ───────────────────────────────────────────────
#
# Copilot SDK 런타임(CLI)이 없는 환경(배포 컨테이너)에서도 "같은 Foundry/Azure
# OpenAI 모델"로 진짜 사전조사를 생성하기 위한 2순위 경로. SDK 에이전트 오케스트레이션이
# 1순위이고, 그게 비거나 실패할 때만 이 직접 호출이 동작한다(휴리스틱보다 우수).

_AZURE_SYSTEM = (
    "너는 사전조사 도우미다. 사용자가 던진 아이디어의 '바로 착수'를 돕는 자료를 만든다.\n"
    "반드시 아래 JSON 객체 하나만 출력한다(다른 텍스트 금지):\n"
    '{"materials":[{"fact":"...","url":null}],"options":["..."]}\n'
    "- materials: 착수에 바로 쓰이는 구체적 사실 3~5개(적정 수치, 준비 체크리스트, "
    "쓸 만한 툴·플랫폼 이름, 흔한 실패 요인, 참고 사례). url은 알면 넣고 모르면 null.\n"
    "- options: 다음에 시도할 구체적 행동 프레임 2~4개(각 한 문장).\n"
    "금지: 아이디어를 정의·재진술하는 일반론('○○은 ~이다'), '다음 액션을 ○○하라'는 지시."
)


def _azure_research_sync(idea_text: str) -> Research | None:
    try:
        from openai import AzureOpenAI
    except Exception:
        return None
    try:
        client = AzureOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"].rstrip("/"),
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
        )
        resp = client.chat.completions.create(
            model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
            messages=[
                {"role": "system", "content": _AZURE_SYSTEM},
                {"role": "user", "content": f"아이디어: {idea_text}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )
        content = resp.choices[0].message.content or ""
        return _research_from_json(content)
    except Exception as exc:
        logger.warning("Azure 직접 사전조사 실패: %s", exc)
        return None


async def _azure_research(idea_text: str) -> Research | None:
    """SDK 런타임이 없는 환경용 Foundry/Azure OpenAI 직접 호출(블로킹→스레드)."""
    return await asyncio.to_thread(_azure_research_sync, idea_text)


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
    """info_gap 사전조사 생성.

    1순위 Copilot SDK 에이전트(도구 호출 오케스트레이션) →
    2순위 같은 Foundry/Azure OpenAI 모델 직접 호출 →
    3순위 휴리스틱. SKIP_COPILOT_SDK=1 이면 SDK를 건너뛴다.
    """
    if os.environ.get("SKIP_COPILOT_SDK") != "1":
        try:
            return await _generate_research_sdk(idea_text)
        except Exception as exc:
            logger.warning("SDK 사전조사 실패, Foundry 직접 호출 폴백: %s", exc)
    research = await _azure_research(idea_text)
    if research is not None:
        return research
    return _heuristic_research(idea_text)


async def _generate_research_sdk(idea_text: str) -> Research:
    """Copilot SDK 에이전트가 도구 호출로 사전조사를 생성한다.

    결과는 도구 호출(store)에서 조립한다. 모델이 도구를 호출하지 않은 예외적
    경우에만 텍스트 JSON 폴백을 시도한다.
    """
    model = os.environ["AZURE_OPENAI_DEPLOYMENT"]
    provider = _provider()

    store: dict = {}
    tools = _make_research_tools(store)

    prompt = (
        f"아이디어: {idea_text!r}\n\n"
        "너는 사전조사 에이전트다. 아래 두 도구를 직접 호출해 조사를 완성하라:\n"
        "1. collect_materials — 착수에 바로 쓰이는 구체적 사실 3~5개\n"
        "2. frame_options — 다음에 시도할 구체적 행동 프레임 2~4개\n\n"
        "결과는 오직 도구 호출로만 전달한다. 도구를 호출하지 않으면 아무 결과도 저장되지 않는다.\n"
        "별도의 설명 문장이나 JSON 텍스트를 추가로 출력할 필요는 없다.\n\n"
        "매우 중요 — 반드시 지켜라:\n"
        "- 아이디어가 무엇인지 정의·설명하지 말 것. 사용자는 이미 안다. "
        "'○○은 ~이다', '○○은 ~할 수 있다' 같은 일반론·사전적 문장은 금지.\n"
        "- 대신 실행자가 당장 참고할 구체 정보만: 적정 수치, 준비 체크리스트, "
        "쓸 만한 툴·플랫폼 이름, 흔한 실패 요인, 참고 사례.\n"
        "- '다음 액션을 ○○하라'는 지시는 생성하지 말 것. "
        "재료와 선택지만 제공하고 결정은 사람의 몫으로 남긴다."
    )

    async with _make_client() as client:
        session = await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model=model,
            provider=provider,
            tools=tools,
        )
        resp = await session.send_and_wait(prompt)

    research = _research_from_store(store)
    if research is not None:
        return research

    # 폴백: 모델이 도구 대신 텍스트로 답한 경우
    content: str = getattr(getattr(resp, "data", None), "content", None) or str(resp)
    research = _research_from_json(content)
    if research is not None:
        logger.info("도구 호출 없음, 텍스트 JSON 폴백 사용")
        return research
    raise RuntimeError("사전조사 도구 호출 결과 없음")


# ── SSE 스트리밍 생성 ──────────────────────────────────────────────────────────

async def generate_research_stream(idea_text: str) -> AsyncIterator[dict]:
    """info_gap 사전조사 스트림.

    1순위 Copilot SDK 에이전트(도구 호출 스트리밍) → 2순위 Foundry/Azure OpenAI
    직접 호출 → 3순위 휴리스틱. SKIP_COPILOT_SDK=1 이면 SDK를 건너뛴다.
    """
    if os.environ.get("SKIP_COPILOT_SDK") != "1":
        try:
            async for ev in _generate_research_stream_sdk(idea_text):
                yield ev
            return
        except Exception as exc:
            logger.warning("SDK 사전조사 스트림 실패, Foundry 직접 호출 폴백: %s", exc)

    # 2순위: 같은 Foundry/Azure OpenAI 모델로 직접 사전조사 생성
    yield {"event": "delta", "data": "Azure Foundry 모델로 사전조사를 생성합니다…\n"}
    research = await _azure_research(idea_text)
    if research is not None:
        yield {"event": "result", "data": research.model_dump_json()}
        return

    # 3순위: 휴리스틱
    async for ev in _heuristic_research_stream(idea_text):
        yield ev


async def _generate_research_stream_sdk(idea_text: str) -> AsyncIterator[dict]:
    """Copilot SDK 스트리밍으로 사전조사를 생성하며 SSE 이벤트를 yield한다.

    이벤트 종류:
    - {"event": "delta", "data": "<텍스트 조각>"}  — 에이전트 추론 + 도구 발화 표시
    - {"event": "tool",  "data": "<{name,count} JSON>"}  — 도구 호출(기계용)
    - {"event": "result","data": "<Research JSON>"}  — 도구 호출로 조립된 최종 결과

    최종 Research 는 도구 호출(store)에서 조립한다 — 모델의 JSON 덤프가 아니라
    실제 도구 호출 결과를 신뢰한다.
    """
    model = os.environ["AZURE_OPENAI_DEPLOYMENT"]
    provider = _provider()

    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    full_content: list[str] = []
    store: dict = {}

    def on_tool(name: str, count: int) -> None:
        # 사람이 읽는 delta(프론트가 그대로 렌더) + 기계용 tool 이벤트
        queue.put_nowait({"event": "delta", "data": f"\n🔧 {name} — {count}건 정리\n"})
        queue.put_nowait(
            {"event": "tool", "data": json.dumps({"name": name, "count": count}, ensure_ascii=False)}
        )

    tools = _make_research_tools(store, on_tool=on_tool)

    def on_event(event) -> None:
        etype = str(getattr(event, "type", type(event).__name__))
        if "MESSAGE_DELTA" in etype or "STREAMING_DELTA" in etype or "assistant.message_delta" in etype:
            delta = getattr(getattr(event, "data", None), "delta_content", None) or ""
            if delta:
                full_content.append(delta)
                queue.put_nowait({"event": "delta", "data": delta})
        elif "IDLE" in etype:
            queue.put_nowait(None)  # 완료 신호

    prompt = (
        f"아이디어: {idea_text!r}\n\n"
        "너는 사전조사 에이전트다. collect_materials 도구와 frame_options 도구를 "
        "각각 한 번 이상 반드시 호출하라. 결과는 오직 도구 호출로만 전달한다"
        "(별도 JSON/설명 텍스트 불필요). 도구를 호출하지 않으면 결과가 저장되지 않는다.\n"
        "매우 중요: 아이디어가 무엇인지 정의·설명하지 말 것('○○은 ~이다' 금지). "
        "사용자는 이미 안다. 대신 착수에 바로 쓰이는 구체적 사실(수치·체크리스트·툴 이름·"
        "실패 요인·참고 사례)과 다음에 시도할 구체적 행동 프레임만 담아라."
    )

    async with _make_client() as client:
        session = await client.create_session(
            on_permission_request=PermissionHandler.approve_all,
            model=model,
            provider=provider,
            streaming=True,
            tools=tools,
            on_event=on_event,
        )
        await session.send(prompt)

        while True:
            item = await asyncio.wait_for(queue.get(), timeout=90)
            if item is None:
                break
            yield item

    # 도구 호출 결과(store)로 최종 Research 조립. 없으면 텍스트 JSON 폴백.
    research = _research_from_store(store) or _research_from_json("".join(full_content))
    if research is not None:
        yield {"event": "result", "data": research.model_dump_json()}
    else:
        # SDK 런타임이 빈 결과만 낸 경우(예: CLI 미인증) → 상위 래퍼가 Foundry 직접 호출 폴백하도록 전파
        logger.warning("사전조사 스트림 결과 비어있음, Foundry 직접 호출로 폴백")
        raise RuntimeError("empty research stream")
