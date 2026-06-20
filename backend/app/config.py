"""애플리케이션 런타임 설정 (스펙 계약 값).

OpenAPI 스펙(`docs/plan/openapi.yaml`)이 서버 베이스 경로를 `/api`로 고정하므로
라우터는 모두 `/api` 프리픽스 아래에 마운트한다. 환경변수로 덮어쓸 수 있다.
"""

from __future__ import annotations

import os

# OpenAPI 문서/스키마 노출 경로
DOCS_URL: str = "/docs"
OPENAPI_URL: str = "/openapi.json"

# API 베이스 경로 (openapi servers.url = "/api")
API_PREFIX: str = "/api"

# SQLite 파일 경로. 배포 시 Azure Files 볼륨(/data)에 마운트.
DB_PATH: str = os.environ.get("APP_DB_PATH", "./data/app.db")

# CORS 허용 오리진 (프론트 개발 서버)
CORS_ORIGINS: list[str] = os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# 빌드된 SPA 정적 파일 위치 (frontend `vite build` → backend/static).
# 단일 App Service에서 같은 오리진으로 서빙 → CORS 불필요.
STATIC_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")


def configure_copilot_cli_byok() -> None:
    """Copilot CLI(자식 프로세스)의 BYOK(custom provider)를 **opt-in**으로 구성한다.

    CLI는 ``COPILOT_PROVIDER_BASE_URL`` 이 설정돼 있을 때만 BYOK 모드로 전환된다
    (이때 GitHub 인증 불필요). 이 함수는 그 base_url 이 **명시적으로 주어졌을 때만**
    나머지 동반 설정(type/api_key/api_version/model)을 ``AZURE_OPENAI_*`` 로부터
    ``setdefault`` 로 채운다.

    주의: base_url 을 무조건 자동 설정하면 SDK가 구동하는 CLI의 기본 경로(에이전트
    도구 오케스트레이션)가 비어버리는 것을 확인했다. 따라서 기본값으로는 건드리지
    않고, 운영자가 ``COPILOT_PROVIDER_BASE_URL`` 을 직접 주입해 **대체(override)**
    하려는 경우에만 동작한다.
    """
    base_url = os.environ.get("COPILOT_PROVIDER_BASE_URL", "").strip()
    if not base_url:
        return  # BYOK 미활성 → 기본 SDK 경로 유지(로컬 GitHub 인증/세션 provider)
    os.environ.setdefault("COPILOT_PROVIDER_TYPE", "azure")
    api_key = os.environ.get("AZURE_OPENAI_API_KEY")
    if api_key:
        os.environ.setdefault("COPILOT_PROVIDER_API_KEY", api_key)
    os.environ.setdefault(
        "COPILOT_PROVIDER_AZURE_API_VERSION",
        os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21"),
    )
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT")
    if deployment:
        os.environ.setdefault("COPILOT_MODEL", deployment)
