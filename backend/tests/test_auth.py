"""인증(2.1) — 패스프레이즈 + 서명 세션 쿠키.

패스프레이즈가 설정되면 /api/* 와 /health/ai 가 401로 보호되고, 로그인 후에는
세션 쿠키로 접근이 허용된다. 미설정이면 개방 모드(기존 동작)임을 확인한다.
"""

from __future__ import annotations

from app import config


def test_open_mode_when_no_passphrase(client):
    """패스프레이즈 미설정이면 인증 없이 접근 가능(개발 기본값)."""
    assert client.get("/api/ideas").status_code == 200
    body = client.get("/api/auth/session").json()
    assert body == {"authenticated": True, "authRequired": False}


def test_protected_requires_login(client, monkeypatch):
    """패스프레이즈 설정 시 미인증 접근은 401."""
    monkeypatch.setattr(config, "APP_PASSPHRASE", "letmein")

    assert client.get("/api/ideas").status_code == 401
    assert client.get("/health/ai").status_code == 401

    session = client.get("/api/auth/session").json()
    assert session == {"authenticated": False, "authRequired": True}


def test_login_flow(client, monkeypatch):
    """잘못된 패스프레이즈는 401, 올바른 값은 세션 발급 후 접근 허용."""
    monkeypatch.setattr(config, "APP_PASSPHRASE", "letmein")

    assert (
        client.post("/api/auth/login", json={"passphrase": "nope"}).status_code == 401
    )

    ok = client.post("/api/auth/login", json={"passphrase": "letmein"})
    assert ok.status_code == 200
    assert ok.json() == {"authenticated": True}

    assert client.get("/api/ideas").status_code == 200
    assert client.get("/api/auth/session").json()["authenticated"] is True

    client.post("/api/auth/logout")
    assert client.get("/api/ideas").status_code == 401


def test_login_endpoint_public_without_session(client, monkeypatch):
    """로그인/세션 조회 엔드포인트는 세션 없이도 호출 가능해야 한다."""
    monkeypatch.setattr(config, "APP_PASSPHRASE", "letmein")
    assert client.get("/api/auth/session").status_code == 200
    # 빈 패스프레이즈는 Pydantic 검증(min_length=1)에서 422.
    assert client.post("/api/auth/login", json={"passphrase": ""}).status_code == 422
