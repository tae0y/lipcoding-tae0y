"""아이디어 캡처·판정·조회·삭제 엔드포인트 동작 검증."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_idea_with_actionable_text_returns_inbox(client: TestClient) -> None:
    # 구체적 다음 액션 신호("예약/전화") + 기본 여유 → 착수 가능(inbox)
    r = client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"})
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "inbox"
    assert body["dumpReason"] is None
    assert body["id"]
    assert body["createdAt"]


def test_create_idea_with_vague_text_dumps_as_info_gap(client: TestClient) -> None:
    # 정보 준비성 부족(짧고 모호) → dump + info_gap(AI 사전조사 대상)
    r = client.post("/api/ideas", json={"text": "뭔가"})
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "dump"
    assert body["dumpReason"] == "info_gap"


def test_create_idea_when_no_capacity_dumps_as_no_capacity(client: TestClient) -> None:
    # 정보는 충분하나 저녁이 차면 → dump + no_capacity(조사 스킵)
    client.put("/api/user-state", json={"calendarBusy": True})
    r = client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"})
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "dump"
    assert body["dumpReason"] == "no_capacity"


def test_create_idea_rejects_empty_text(client: TestClient) -> None:
    # text minLength=1 → 검증 실패
    r = client.post("/api/ideas", json={"text": ""})
    assert r.status_code == 422


def test_create_idea_rejects_missing_text(client: TestClient) -> None:
    r = client.post("/api/ideas", json={})
    assert r.status_code == 422


def test_list_ideas_returns_all_created(client: TestClient) -> None:
    client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"})
    client.post("/api/ideas", json={"text": "뭔가"})
    r = client.get("/api/ideas")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_list_ideas_filters_by_status(client: TestClient) -> None:
    client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"})
    client.post("/api/ideas", json={"text": "뭔가"})
    inbox = client.get("/api/ideas", params={"status": "inbox"}).json()
    dump = client.get("/api/ideas", params={"status": "dump"}).json()
    assert all(i["status"] == "inbox" for i in inbox)
    assert all(i["status"] == "dump" for i in dump)
    assert len(inbox) == 1
    assert len(dump) == 1


def test_list_ideas_filters_by_dump_reason(client: TestClient) -> None:
    client.post("/api/ideas", json={"text": "뭔가"})  # info_gap
    r = client.get("/api/ideas", params={"status": "dump", "dumpReason": "info_gap"})
    assert r.status_code == 200
    assert all(i["dumpReason"] == "info_gap" for i in r.json())


def test_get_idea_returns_detail(client: TestClient) -> None:
    created = client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"}).json()
    r = client.get(f"/api/ideas/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_get_missing_idea_returns_404(client: TestClient) -> None:
    r = client.get("/api/ideas/does-not-exist")
    assert r.status_code == 404


def test_delete_idea_removes_it(client: TestClient) -> None:
    created = client.post("/api/ideas", json={"text": "내일 치과 예약 전화하기"}).json()
    r = client.delete(f"/api/ideas/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/ideas/{created['id']}").status_code == 404


def test_delete_missing_idea_returns_404(client: TestClient) -> None:
    r = client.delete("/api/ideas/does-not-exist")
    assert r.status_code == 404
