"""POST /api/ideas/{idea_id}/research 엔드포인트 테스트 4케이스."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.models import Research, ResearchMaterial

_STUB_RESEARCH = Research(
    materials=[ResearchMaterial(fact="테스트 사실", url=None)],
    options=["옵션 A", "옵션 B"],
    generatedAt=datetime(2026, 1, 1, tzinfo=timezone.utc),
)


def _make_info_gap_idea(client: TestClient) -> dict:
    """info_gap 덤프 항목(짧고 모호한 텍스트)을 생성하고 반환한다."""
    r = client.post("/api/ideas", json={"text": "뭔가"})
    assert r.status_code == 201
    idea = r.json()
    assert idea["dumpReason"] == "info_gap", "픽스처 전제 조건 실패"
    return idea


def _make_no_capacity_idea(client: TestClient) -> dict:
    """no_capacity 덤프 항목을 생성하고 반환한다."""
    client.put("/api/user-state", json={"calendarBusy": True})
    r = client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"})
    assert r.status_code == 201
    idea = r.json()
    assert idea["dumpReason"] == "no_capacity", "픽스처 전제 조건 실패"
    return idea


# ── 케이스 1: 409 — info_gap 아닌 항목 ───────────────────────────────────────

def test_research_409_not_info_gap(client: TestClient) -> None:
    """no_capacity 아이디어에 /research 호출 시 409."""
    idea = _make_no_capacity_idea(client)
    r = client.post(f"/api/ideas/{idea['id']}/research")
    assert r.status_code == 409


# ── 케이스 2: 404 — 없는 ideaId ───────────────────────────────────────────────

def test_research_404_unknown_idea(client: TestClient) -> None:
    """없는 ideaId에 /research 호출 시 404."""
    r = client.post("/api/ideas/does-not-exist/research")
    assert r.status_code == 404


# ── 케이스 3: 200 동기 — stream=false ────────────────────────────────────────

def test_research_200_sync(client: TestClient, monkeypatch) -> None:
    """info_gap 아이디어, stream=false → Research JSON 반환."""
    import app.research as research_module

    async def mock_generate_research(idea_text: str) -> Research:
        return _STUB_RESEARCH

    monkeypatch.setattr(research_module, "generate_research", mock_generate_research)

    idea = _make_info_gap_idea(client)
    r = client.post(f"/api/ideas/{idea['id']}/research", params={"stream": "false"})
    assert r.status_code == 200
    body = r.json()
    assert "materials" in body
    assert "options" in body
    assert body["materials"][0]["fact"] == "테스트 사실"


# ── 케이스 4: 200 스트림 — stream=true ───────────────────────────────────────

def test_research_200_stream(client: TestClient, monkeypatch) -> None:
    """info_gap 아이디어, stream=true → text/event-stream Content-Type."""
    import json as _json

    import app.research as research_module

    async def mock_generate_research_stream(idea_text: str):
        yield {"event": "delta", "data": "조사 중..."}
        yield {
            "event": "result",
            "data": _json.dumps(_STUB_RESEARCH.model_dump(mode="json")),
        }

    monkeypatch.setattr(
        research_module, "generate_research_stream", mock_generate_research_stream
    )

    idea = _make_info_gap_idea(client)
    r = client.post(f"/api/ideas/{idea['id']}/research", params={"stream": "true"})
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
