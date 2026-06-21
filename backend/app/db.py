"""SQLite 영속화 계층.

단일 사용자 가정이므로 ORM 없이 표준 라이브러리 sqlite3 + JSON 컬럼으로 가볍게
운영한다. UserState/Suggestion은 단일 행(id 고정)으로 다룬다. 테이블은 최초 실행
시 자동 생성한다.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app import config
from app.models import (
    Idea,
    IdeaStatus,
    Suggestion,
    TriggerSchedule,
    UserState,
)

# 단일 사용자: UserState/Suggestion은 고정 id 한 행으로 보관한다.
_USER_STATE_ID = "singleton"


def _connect() -> sqlite3.Connection:
    """행을 dict 처럼 접근 가능한 커넥션을 연다."""
    Path(config.DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """테이블 생성 + 기본 UserState 시드."""
    with _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS ideas (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                status TEXT NOT NULL,
                dump_reason TEXT,
                research TEXT,
                created_at TEXT NOT NULL,
                deleted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS user_state (
                id TEXT PRIMARY KEY,
                emotion TEXT NOT NULL,
                todos TEXT NOT NULL,
                calendar_busy INTEGER NOT NULL,
                trigger_schedule TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS suggestion (
                id TEXT PRIMARY KEY,
                idea_id TEXT NOT NULL,
                reasons TEXT NOT NULL,
                decision TEXT,
                created_at TEXT NOT NULL
            );
            """
        )
        # 기존 DB 마이그레이션: CREATE TABLE IF NOT EXISTS 로는 컬럼이 추가되지
        # 않으므로 deleted_at 부재 시 ALTER TABLE 로 보강한다(소프트 삭제용).
        columns = {row["name"] for row in conn.execute("PRAGMA table_info(ideas)")}
        if "deleted_at" not in columns:
            conn.execute("ALTER TABLE ideas ADD COLUMN deleted_at TEXT")
        existing = conn.execute(
            "SELECT id FROM user_state WHERE id = ?", (_USER_STATE_ID,)
        ).fetchone()
        if existing is None:
            default = UserState(
                emotion="normal",
                todos=[],
                calendarBusy=False,
                triggerSchedule=TriggerSchedule(weekday=4, time="19:30"),
            )
            save_user_state(default, conn=conn)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Idea ------------------------------------------------------------------


def _row_to_idea(row: sqlite3.Row) -> Idea:
    research = json.loads(row["research"]) if row["research"] else None
    return Idea(
        id=row["id"],
        text=row["text"],
        status=row["status"],
        dumpReason=row["dump_reason"],
        research=research,
        createdAt=row["created_at"],
    )


def insert_idea(idea: Idea) -> Idea:
    """판정이 끝난 아이디어를 저장한다."""
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO ideas (id, text, status, dump_reason, research, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                idea.id,
                idea.text,
                idea.status.value,
                idea.dumpReason.value if idea.dumpReason else None,
                idea.research.model_dump_json() if idea.research else None,
                idea.createdAt.isoformat(),
            ),
        )
    return idea


def list_ideas(
    status: IdeaStatus | None = None, dump_reason: str | None = None
) -> list[Idea]:
    """상태/사유 필터로 아이디어를 조회한다(최신순)."""
    query = "SELECT * FROM ideas"
    clauses: list[str] = ["deleted_at IS NULL"]
    params: list[Any] = []
    if status is not None:
        clauses.append("status = ?")
        params.append(status.value)
    if dump_reason is not None:
        clauses.append("dump_reason = ?")
        params.append(dump_reason)
    query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY created_at DESC"
    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_row_to_idea(r) for r in rows]


def get_idea(idea_id: str) -> Idea | None:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM ideas WHERE id = ? AND deleted_at IS NULL", (idea_id,)
        ).fetchone()
    return _row_to_idea(row) if row else None


def update_idea(idea: Idea) -> Idea:
    with _connect() as conn:
        conn.execute(
            """
            UPDATE ideas
            SET text = ?, status = ?, dump_reason = ?, research = ?
            WHERE id = ?
            """,
            (
                idea.text,
                idea.status.value,
                idea.dumpReason.value if idea.dumpReason else None,
                idea.research.model_dump_json() if idea.research else None,
                idea.id,
            ),
        )
    return idea


def delete_idea(idea_id: str) -> bool:
    """소프트 삭제(tombstone). 이미 삭제됐거나 없으면 False.

    실제 행은 남기고 deleted_at 만 채워 undo(restore)로 되돌릴 수 있게 한다.
    """
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE ideas SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
            (_now_iso(), idea_id),
        )
        return cur.rowcount > 0


def restore_idea(idea_id: str) -> Idea | None:
    """소프트 삭제된 아이디어를 복구한다. 복구 대상이 없으면 None."""
    with _connect() as conn:
        cur = conn.execute(
            "UPDATE ideas SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
            (idea_id,),
        )
        if cur.rowcount == 0:
            return None
        row = conn.execute(
            "SELECT * FROM ideas WHERE id = ?", (idea_id,)
        ).fetchone()
    return _row_to_idea(row) if row else None


def purge_deleted() -> int:
    """tombstone(소프트 삭제된 행)를 물리 삭제한다. 삭제 건수를 반환한다.

    정리/유지보수용 내부 헬퍼. 현재 UI/엔드포인트에는 노출하지 않는다.
    """
    with _connect() as conn:
        cur = conn.execute("DELETE FROM ideas WHERE deleted_at IS NOT NULL")
        return cur.rowcount


# --- UserState -------------------------------------------------------------


def get_user_state() -> UserState:
    with _connect() as conn:
        row = conn.execute(
            "SELECT * FROM user_state WHERE id = ?", (_USER_STATE_ID,)
        ).fetchone()
    return UserState(
        emotion=row["emotion"],
        todos=json.loads(row["todos"]),
        calendarBusy=bool(row["calendar_busy"]),
        triggerSchedule=TriggerSchedule(**json.loads(row["trigger_schedule"])),
    )


def save_user_state(
    state: UserState, conn: sqlite3.Connection | None = None
) -> UserState:
    """UserState 단일 행을 upsert 한다."""
    owns = conn is None
    conn = conn or _connect()
    try:
        conn.execute(
            """
            INSERT INTO user_state (id, emotion, todos, calendar_busy, trigger_schedule)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                emotion = excluded.emotion,
                todos = excluded.todos,
                calendar_busy = excluded.calendar_busy,
                trigger_schedule = excluded.trigger_schedule
            """,
            (
                _USER_STATE_ID,
                state.emotion.value,
                json.dumps(state.todos),
                int(state.calendarBusy),
                state.triggerSchedule.model_dump_json(),
            ),
        )
        if owns:
            conn.commit()
    finally:
        if owns:
            conn.close()
    return state


# --- Suggestion ------------------------------------------------------------


def save_suggestion(suggestion: Suggestion) -> Suggestion:
    """현재 활성 추천을 단일 행으로 교체 저장한다."""
    with _connect() as conn:
        conn.execute("DELETE FROM suggestion")
        conn.execute(
            """
            INSERT INTO suggestion (id, idea_id, reasons, decision, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                _USER_STATE_ID,
                suggestion.ideaId,
                suggestion.reasons.model_dump_json(),
                suggestion.decision.value if suggestion.decision else None,
                (suggestion.createdAt or datetime.now(timezone.utc)).isoformat(),
            ),
        )
    return suggestion


def get_suggestion() -> Suggestion | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM suggestion LIMIT 1").fetchone()
    if row is None:
        return None
    idea = get_idea(row["idea_id"])
    from app.models import SuggestionReasons

    return Suggestion(
        ideaId=row["idea_id"],
        idea=idea,
        reasons=SuggestionReasons(**json.loads(row["reasons"])),
        decision=row["decision"],
        createdAt=row["created_at"],
    )
