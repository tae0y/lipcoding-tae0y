"""주간 트리거(부하 게이트)·추천 조회·사람 결정 동작 검증."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _make_dump_idea(client: TestClient) -> str:
    """info_gap 덤프 항목 하나를 만들고 id를 반환한다."""
    return client.post("/api/ideas", json={"text": "뭔가"}).json()["id"]


def test_run_trigger_passes_gate_and_creates_suggestion(client: TestClient) -> None:
    # 기본 상태(calendarBusy=false, emotion=normal) → 게이트 통과
    idea_id = _make_dump_idea(client)
    r = client.post("/api/suggestions/run")
    assert r.status_code == 200
    body = r.json()
    assert body["gatePassed"] is True
    assert body["suggestion"]["ideaId"] == idea_id
    assert set(body["suggestion"]["reasons"]) == {"lowLoad", "researchDone", "relevance"}


def test_run_trigger_blocked_when_calendar_busy(client: TestClient) -> None:
    _make_dump_idea(client)
    client.put("/api/user-state", json={"calendarBusy": True})
    r = client.post("/api/suggestions/run")
    assert r.status_code == 200
    body = r.json()
    assert body["gatePassed"] is False
    assert body["suggestion"] is None


def test_run_trigger_blocked_when_emotion_bad(client: TestClient) -> None:
    _make_dump_idea(client)
    client.put("/api/user-state", json={"emotion": "bad"})
    r = client.post("/api/suggestions/run")
    assert r.json()["gatePassed"] is False


def test_run_trigger_with_empty_dump_returns_null_suggestion(client: TestClient) -> None:
    # 게이트는 통과하지만 덤프가 비어 추천 없음
    r = client.post("/api/suggestions/run")
    body = r.json()
    assert body["gatePassed"] is True
    assert body["suggestion"] is None
    assert body["skippedReason"]


def test_current_suggestion_returns_saved_one(client: TestClient) -> None:
    _make_dump_idea(client)
    client.post("/api/suggestions/run")
    r = client.get("/api/suggestions/current")
    assert r.status_code == 200
    assert r.json() is not None


def test_current_suggestion_is_null_when_none(client: TestClient) -> None:
    r = client.get("/api/suggestions/current")
    assert r.status_code == 200
    assert r.json() is None


def test_decision_records_human_choice(client: TestClient) -> None:
    idea_id = _make_dump_idea(client)
    client.post("/api/suggestions/run")
    r = client.post(
        f"/api/suggestions/{idea_id}/decision", json={"decision": "accepted"}
    )
    assert r.status_code == 200
    assert r.json()["decision"] == "accepted"


def test_decision_on_wrong_idea_returns_404(client: TestClient) -> None:
    _make_dump_idea(client)
    client.post("/api/suggestions/run")
    r = client.post(
        "/api/suggestions/other-id/decision", json={"decision": "accepted"}
    )
    assert r.status_code == 404
