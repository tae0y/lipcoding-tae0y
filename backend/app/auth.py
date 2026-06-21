"""단일 사용자 패스프레이즈 인증.

설계(2.1): 공개 배포된 단일 사용자 앱에 최소 침습적 인증을 추가한다.
- 비밀은 패스프레이즈 하나(``config.APP_PASSPHRASE``). 설정되면 인증 활성화.
- 로그인 성공 시 Starlette ``SessionMiddleware`` 의 서명 쿠키에 ``authed`` 플래그를
  기록한다(HttpOnly·Secure·SameSite=Strict → XSS/CSRF 완화).
- 라우트 보호는 ``main.py`` 의 게이트 미들웨어가 ``/api/*`` 와 ``/health/ai`` 에 대해
  세션을 검사하는 방식으로 한다(allowlist).
"""

from __future__ import annotations

import hmac

from app import config

# 인증이 켜져 있어도 세션 없이 접근 가능한 /api 경로(로그인/세션조회/로그아웃).
PUBLIC_API_PATHS: frozenset[str] = frozenset(
    {"/api/auth/login", "/api/auth/logout", "/api/auth/session"}
)

SESSION_KEY = "authed"


def is_auth_enabled() -> bool:
    """패스프레이즈가 설정돼 있으면 인증이 활성화된 것으로 본다."""
    return bool(config.APP_PASSPHRASE)


def verify_passphrase(candidate: str) -> bool:
    """상수시간 비교로 패스프레이즈를 검증한다(타이밍 공격 완화)."""
    secret = config.APP_PASSPHRASE
    if not secret:
        return False
    return hmac.compare_digest(candidate.encode("utf-8"), secret.encode("utf-8"))


def is_protected_path(path: str) -> bool:
    """게이트가 인증을 요구해야 하는 경로인지 판정한다."""
    if path == "/health/ai":
        return True
    if path.startswith("/api/") and path not in PUBLIC_API_PATHS:
        return True
    return False
