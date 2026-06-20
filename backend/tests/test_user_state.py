"""UserState 조회·부분 갱신 동작 검증."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_get_user_state_returns_seeded_default(client: TestClient) -> None:
    r = client.get("/api/user-state")
    assert r.status_code == 200
    body = r.json()
    assert body["emotion"] == "normal"
    assert body["todos"] == []
    assert body["calendarBusy"] is False
    assert body["triggerSchedule"]["weekday"] == 4
    assert body["triggerSchedule"]["time"] == "19:30"


def test_update_user_state_merges_partial_emotion_only(client: TestClient) -> None:
    # 부분 갱신: emotion만 보내면 나머지는 유지된다.
    r = client.put("/api/user-state", json={"emotion": "good"})
    assert r.status_code == 200
    body = r.json()
    assert body["emotion"] == "good"
    assert body["calendarBusy"] is False  # 유지


def test_update_user_state_persists_todos_and_calendar(client: TestClient) -> None:
    r = client.put(
        "/api/user-state",
        json={"todos": ["저녁 약속", "운동"], "calendarBusy": True},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["todos"] == ["저녁 약속", "운동"]
    assert body["calendarBusy"] is True


def test_update_user_state_updates_trigger_schedule(client: TestClient) -> None:
    r = client.put(
        "/api/user-state",
        json={"triggerSchedule": {"weekday": 2, "time": "20:15"}},
    )
    assert r.status_code == 200
    sched = r.json()["triggerSchedule"]
    assert sched["weekday"] == 2
    assert sched["time"] == "20:15"


def test_update_user_state_rejects_invalid_emotion(client: TestClient) -> None:
    r = client.put("/api/user-state", json={"emotion": "angry"})
    assert r.status_code == 422


def test_update_user_state_rejects_bad_time_format(client: TestClient) -> None:
    r = client.put(
        "/api/user-state",
        json={"triggerSchedule": {"weekday": 1, "time": "25:99"}},
    )
    assert r.status_code == 422
