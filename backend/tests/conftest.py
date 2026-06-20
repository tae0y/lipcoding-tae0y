"""pytest 공용 픽스처.

각 테스트는 격리된 임시 SQLite 파일을 쓴다. `config.DB_PATH`를 monkeypatch한 뒤
`with TestClient(app)`로 lifespan(`init_db`)을 실행시켜 테이블·기본 UserState가
준비된 상태에서 시작한다. lifespan을 거치지 않으면 테이블이 없어 실패한다.
"""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app import config
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    """격리된 임시 DB를 쓰는 TestClient."""
    db_file = tmp_path / "test.db"
    monkeypatch.setattr(config, "DB_PATH", str(db_file))
    with TestClient(app) as test_client:
        yield test_client
