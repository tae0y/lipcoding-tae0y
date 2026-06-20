---
applyTo: "backend/**/*.py"
---

# FastAPI Rules (optimized for spec grading)

This competition is graded on **OpenAPI spec compliance**. FastAPI auto-generates OpenAPI,
so it's a weapon. The key is matching the spec's paths, methods, request/response schemas,
and status codes **exactly**.

## Required setup (runtime contract — confirm this year's values in `docs/spec.md`)

- Collect the base path, port, and docs URL in the **TODO placeholders in `app/config.py`**.
  These are the contract the grader looks at first, so fill them via `spec-ingest` and have
  the code read those values.
- Match the root (`/`) behavior (redirect target, etc.) and the Swagger/OpenAPI exposure
  paths to the spec.

```python
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from app import config  # port/path placeholders (filled from the spec)

app = FastAPI(docs_url=config.DOCS_URL, openapi_url=config.OPENAPI_URL)

@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url=config.DOCS_URL)
```

Run: `uv run uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload`

## Schema = the grading contract

- Define a **Pydantic model** for every request/response so it appears precisely in OpenAPI.
  The grader compares OpenAPI against the actual responses — match field names, types, and
  required-ness 1:1 with the spec.
- Use status codes per the spec (`200/201/400/401/404/409/...`). Don't flatten everything to
  a default 200.
- For validation failures, map to **the code the spec requires** (usually 400) instead of
  FastAPI's default 422.

## Auth (confirm token type, claims, and expiry in the spec)

- Match the token scheme, claim set, and expiry time **exactly to the spec** (e.g. JWT /
  RFC 7519 claims).
- Use enum values (roles, etc.) exactly as written in the spec. Don't change them arbitrarily.
- Centralize token verification on protected endpoints with `Depends`.

## DB

- SQLite, with tables auto-created on first run. No cloud dependency (it must run locally to
  be graded).
- Since it's a single-session competition, keep the ORM lightweight (SQLModel/SQLAlchemy,
  whichever you're comfortable with). No over-engineering.

## File upload (if the spec has uploads)

- Validate the allowed formats, sizes, and resolution constraints per the spec. On
  validation failure, return the status code the spec requires.
- Storage location (DB / filesystem, etc.) also follows whatever the spec dictates.
