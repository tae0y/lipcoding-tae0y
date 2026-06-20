"""Pydantic 모델 — OpenAPI 스키마와 1:1 대응.

스펙(`docs/plan/openapi.yaml`)의 필드명·타입·required 여부를 그대로 따른다.
판정 결과(inbox/dump)와 사전조사(research)는 단일 사용자 가정 하에 다룬다.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class IdeaStatus(str, Enum):
    """inbox=지금 착수 가능, dump=보류."""

    inbox = "inbox"
    dump = "dump"


class DumpReason(str, Enum):
    """info_gap=정보 부족(AI 사전조사 대상), no_capacity=여유 없음."""

    info_gap = "info_gap"
    no_capacity = "no_capacity"


class Emotion(str, Enum):
    bad = "bad"
    normal = "normal"
    good = "good"


class SuggestionDecision(str, Enum):
    """accepted=지금 해볼게요, postponed=다음에, dismissed=관심없음."""

    accepted = "accepted"
    postponed = "postponed"
    dismissed = "dismissed"


class ResearchMaterial(BaseModel):
    fact: str
    url: str | None = None


class Research(BaseModel):
    """info_gap 항목에만 AI가 채우는 사전조사 산출물."""

    materials: list[ResearchMaterial]
    options: list[str]
    generatedAt: datetime | None = None


class IdeaCreateRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=2000,
        description="원문 아이디어 한 줄(최대 2000자 — 과도한 입력/남용 방어)",
    )


class Idea(BaseModel):
    id: str
    text: str
    status: IdeaStatus
    dumpReason: DumpReason | None = None
    research: Research | None = None
    createdAt: datetime


class TriggerSchedule(BaseModel):
    """주 1회 트리거(퇴근 + 20~30분 버퍼)."""

    weekday: int = Field(ge=0, le=6, description="0=월요일 ... 6=일요일")
    time: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", description="HH:MM")


class UserState(BaseModel):
    emotion: Emotion
    todos: list[str]
    calendarBusy: bool
    triggerSchedule: TriggerSchedule


class UserStateUpdate(BaseModel):
    """부분 갱신 허용. 제공된 필드만 반영한다."""

    emotion: Emotion | None = None
    todos: list[str] | None = None
    calendarBusy: bool | None = None
    triggerSchedule: TriggerSchedule | None = None


class SuggestionReasons(BaseModel):
    """추천 근거 3줄(투명성 확보)."""

    lowLoad: str
    researchDone: str
    relevance: str


class Suggestion(BaseModel):
    ideaId: str
    idea: Idea | None = None
    reasons: SuggestionReasons
    decision: SuggestionDecision | None = None
    createdAt: datetime | None = None


class SuggestionDecisionRequest(BaseModel):
    decision: SuggestionDecision


class WeeklyTriggerResult(BaseModel):
    gatePassed: bool
    suggestion: Suggestion | None = None
    skippedReason: str | None = None


class Error(BaseModel):
    message: str
