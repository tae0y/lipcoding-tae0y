# SQLite DB File Leaked into Container Image (2026-06-20)

Recording the issue where a locally generated SQLite DB file (`backend/data/app.db`) was
accidentally included in the container image build.

## Symptom

- The `COPY backend/ ./` step in the `Dockerfile` copied all of `backend/`, including
  the locally generated runtime DB file `backend/data/app.db` (~28KB) into the image.
- The file was excluded from git via `.gitignore` (`data/` in `backend/.gitignore`), but
  **Docker build context copies files from disk regardless of git tracking status**.

## Cause

- The build context was the repo root (`.`) and there was no `.dockerignore` at the root.
- So `az acr build`/`docker build` sent all files in the working directory (local DB, `.venv`,
  `node_modules`, `.env`, etc.) to the context.

## Fix

- Added `.dockerignore` at the repo root to exclude DB, runtime data, secrets, and caches:
  - `backend/data/`, `data/`, `**/*.db`, `**/*.sqlite*`, `**/*.db-wal/-shm/-journal`
  - Also excluded `.venv`, `node_modules`, `dist`, `.env*`, `.git`, `docs`, `infra`, etc.
- The DB is auto-created at app startup — no need to bake it into the image.
  - FastAPI `lifespan` → `db.init_db()` call (`backend/app/main.py`).
  - `_connect()` creates the directory with `Path(DB_PATH).parent.mkdir(...)` and
    `sqlite3.connect()` creates the empty file (`backend/app/db.py`).

## Notes

- `.gitignore` does **not** prevent files from entering the container. Docker requires a
  separate `.dockerignore`. (git-ignored ≠ excluded from build context)
- The container filesystem is ephemeral — the DB is reset on every restart/redeploy. To persist
  data, mount a durable volume (e.g. Azure Files on Container Apps) at `/app/data`.
- Keeping the image clean is safer: a leaked local DB can expose stale data during demos, and
  unnecessarily inflates build cache and image size.
