"""FastAPI 진입점 — 아이디어 인박스 API.

OpenAPI 스펙(`docs/plan/openapi.yaml`)의 경로/메서드/스키마/상태코드에 맞춰
라우트를 `/api` 프리픽스 아래에 노출한다. Block A에서는 Idea CRUD + UserState +
Suggestion 베이스라인을 구현한다(판정·추천은 임시 휴리스틱).
"""

from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

# 로컬 개발용: backend/.env가 있으면 로드 (배포 환경엔 파일이 없어 무시됨).
# 이미 설정된 환경변수는 덮어쓰지 않는다(override=False).
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=False)

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sse_starlette.sse import EventSourceResponse

from app import config, db
from app.judgment import judge_idea
from app.models import (
    DumpReason,
    Idea,
    IdeaCreateRequest,
    IdeaStatus,
    Research,
    Suggestion,
    SuggestionDecisionRequest,
    SuggestionReasons,
    UserState,
    UserStateUpdate,
    WeeklyTriggerResult,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """앱 시작 시 DB 초기화."""
    db.init_db()
    yield


app = FastAPI(
    title="작업기억 보존 아이디어 인박스 API",
    version="0.1.0",
    docs_url=config.DOCS_URL,
    openapi_url=config.OPENAPI_URL,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root() -> Response:
    """빌드된 SPA가 있으면 서빙, 없으면(로컬 백엔드 단독) /docs로."""
    index = os.path.join(config.STATIC_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)
    return RedirectResponse(url=config.DOCS_URL)


@app.get(f"{config.API_PREFIX}/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health", include_in_schema=False)
def health_smoke() -> dict[str, bool]:
    """배포 스모크용 헬스 (azure-deploy.md 계약)."""
    return {"ok": True}


@app.get("/health/ai", include_in_schema=False)
def health_ai() -> dict[str, object]:
    """Azure OpenAI 왕복 1회 — 모델 계층이 살아있는지 증명."""
    import os

    from openai import AzureOpenAI

    client = AzureOpenAI(
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
    )
    resp = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_DEPLOYMENT"],
        messages=[{"role": "user", "content": "ping"}],
        max_tokens=5,
    )
    return {"ok": True, "reply": resp.choices[0].message.content}


# --- Ideas -----------------------------------------------------------------


@app.post(f"{config.API_PREFIX}/ideas", response_model=Idea, status_code=201, tags=["ideas"])
def create_idea(payload: IdeaCreateRequest) -> Idea:
    """아이디어 캡처 + 입구 판정."""
    state = db.get_user_state()
    status, dump_reason = judge_idea(payload.text, state)
    idea = Idea(
        id=str(uuid.uuid4()),
        text=payload.text,
        status=status,
        dumpReason=dump_reason,
        research=None,
        createdAt=datetime.now(timezone.utc),
    )
    return db.insert_idea(idea)


@app.get(f"{config.API_PREFIX}/ideas", response_model=list[Idea], tags=["ideas"])
def list_ideas(
    status: IdeaStatus | None = Query(default=None),
    dumpReason: DumpReason | None = Query(default=None),
) -> list[Idea]:
    """아이디어 목록 조회(섹션 필터)."""
    return db.list_ideas(
        status=status, dump_reason=dumpReason.value if dumpReason else None
    )


@app.get(f"{config.API_PREFIX}/ideas/{{idea_id}}", response_model=Idea, tags=["ideas"])
def get_idea(idea_id: str) -> Idea:
    """아이디어 단건 조회(사전조사 노트 포함)."""
    idea = db.get_idea(idea_id)
    if idea is None:
        raise HTTPException(status_code=404, detail="아이디어를 찾을 수 없음")
    return idea


@app.delete(f"{config.API_PREFIX}/ideas/{{idea_id}}", status_code=204, tags=["ideas"])
def delete_idea(idea_id: str) -> Response:
    """아이디어 삭제."""
    if not db.delete_idea(idea_id):
        raise HTTPException(status_code=404, detail="아이디어를 찾을 수 없음")
    return Response(status_code=204)


# --- Research --------------------------------------------------------------


@app.post(
    f"{config.API_PREFIX}/ideas/{{idea_id}}/research",
    response_model=Research,
    tags=["research"],
)
async def run_research(
    idea_id: str,
    stream: bool = Query(default=False),
) -> Response:
    """info_gap 덤프 항목 AI 사전조사 실행.

    stream=false(기본): Research JSON 반환.
    stream=true: SSE 스트림 — 진행 이벤트 + 최종 result 이벤트.
    """
    from app.research import generate_research, generate_research_stream

    idea = db.get_idea(idea_id)
    if idea is None:
        raise HTTPException(status_code=404, detail="아이디어를 찾을 수 없음")
    if idea.dumpReason != DumpReason.info_gap:
        raise HTTPException(status_code=409, detail="사전조사 대상이 아님(info_gap 아님)")

    if not stream:
        research = await generate_research(idea.text)
        db.update_idea(idea.model_copy(update={"research": research}))
        return research

    # SSE 스트리밍
    async def sse_generator():
        import json as _json

        result_research = None
        async for event in generate_research_stream(idea.text):
            yield event
            if isinstance(event, dict) and event.get("event") == "result":
                try:
                    from app.models import Research
                    result_research = Research.model_validate(_json.loads(event["data"]))
                except Exception:
                    pass
        if result_research:
            db.update_idea(idea.model_copy(update={"research": result_research}))

    return EventSourceResponse(sse_generator())





@app.get(f"{config.API_PREFIX}/user-state", response_model=UserState, tags=["user-state"])
def get_user_state() -> UserState:
    """현재 부하 신호 조회."""
    return db.get_user_state()


@app.put(f"{config.API_PREFIX}/user-state", response_model=UserState, tags=["user-state"])
def update_user_state(payload: UserStateUpdate) -> UserState:
    """오늘 상태/주간 트리거 스케줄 갱신(부분 갱신)."""
    current = db.get_user_state()
    updates = payload.model_dump(exclude_unset=True)
    # model_validate로 재구성해야 중첩 모델(triggerSchedule)이 dict로 남지 않는다.
    merged = UserState.model_validate({**current.model_dump(), **updates})
    return db.save_user_state(merged)


# --- Suggestions -----------------------------------------------------------


@app.post(
    f"{config.API_PREFIX}/suggestions/run",
    response_model=WeeklyTriggerResult,
    tags=["suggestions"],
)
def run_weekly_trigger() -> WeeklyTriggerResult:
    """주간 트리거 1회 실행(배치/데모용).

    부하 게이트: calendarBusy=false AND emotion!=bad 일 때만 추천 생성.
    랭킹은 Block C에서 임베딩 연관성으로 고도화한다(현재는 사전조사 완료도 순).
    """
    state = db.get_user_state()
    gate_passed = (not state.calendarBusy) and state.emotion.value != "bad"
    if not gate_passed:
        return WeeklyTriggerResult(
            gatePassed=False, suggestion=None, skippedReason="부하 게이트 미통과"
        )

    dumps = db.list_ideas(status=IdeaStatus.dump)
    if not dumps:
        return WeeklyTriggerResult(
            gatePassed=True, suggestion=None, skippedReason="덤프 비어있음"
        )

    # 사전조사 완료 항목 우선, 없으면 첫 항목.
    target = next((d for d in dumps if d.research is not None), dumps[0])
    suggestion = Suggestion(
        ideaId=target.id,
        idea=target,
        reasons=SuggestionReasons(
            lowLoad="저녁이 비어있고 감정 상태가 받쳐줍니다.",
            researchDone=(
                "사전조사가 채워져 있습니다."
                if target.research
                else "사전조사 대기 중입니다."
            ),
            relevance="최근 관심사와 연관됩니다.",
        ),
        decision=None,
        createdAt=datetime.now(timezone.utc),
    )
    db.save_suggestion(suggestion)
    return WeeklyTriggerResult(gatePassed=True, suggestion=suggestion)


@app.get(
    f"{config.API_PREFIX}/suggestions/current",
    response_model=Suggestion | None,
    tags=["suggestions"],
)
def get_current_suggestion() -> Suggestion | None:
    """이번 주 추천 조회."""
    return db.get_suggestion()


@app.post(
    f"{config.API_PREFIX}/suggestions/{{idea_id}}/decision",
    response_model=Suggestion,
    tags=["suggestions"],
)
def decide_suggestion(idea_id: str, payload: SuggestionDecisionRequest) -> Suggestion:
    """추천에 대한 사람의 결정(최종 승인은 항상 사람)."""
    current = db.get_suggestion()
    if current is None or current.ideaId != idea_id:
        raise HTTPException(status_code=404, detail="추천을 찾을 수 없음")
    updated = current.model_copy(update={"decision": payload.decision})
    db.save_suggestion(updated)
    return updated


# --- SPA 정적 서빙 (단일 App Service) --------------------------------------


class _SPAStaticFiles(StaticFiles):
    """클라이언트 라우트 딥링크(404)는 index.html로 폴백."""

    async def get_response(self, path: str, scope):  # type: ignore[override]
        from starlette.exceptions import HTTPException as StarletteHTTPException

        try:
            response = await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise
        if response.status_code == 404:
            return await super().get_response("index.html", scope)
        return response


if os.path.isdir(config.STATIC_DIR):
    # /api·/docs·/health 라우트는 위에서 먼저 등록되어 우선 매칭된다.
    app.mount("/", _SPAStaticFiles(directory=config.STATIC_DIR, html=True), name="spa")
