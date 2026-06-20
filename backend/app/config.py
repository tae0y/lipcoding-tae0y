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
