---
applyTo: "frontend/**"
---

# Frontend Rules (Vue/React + Vite)

- Set the port and API base path to the spec values (in the env placeholders in
  `vite.config.js`). The defaults are just Vite conventions (5173→8000), not a contract —
  set them after checking `docs/spec.md`.
- Show status codes/errors to the user, but **grading is usually API-based** — for the
  frontend, a working flow comes first.
- CORS: allow the frontend origin on the backend (`FRONTEND_ORIGIN` in `app/config.py`).
- Keep auth tokens in memory or localStorage. Protected routes redirect to login when there
  is no token.

## Design must go through the `frontend-design` skill

No raw HTML. Use consistent tokens (color, spacing, typography) and work in components. But
within the competition time, **working features > pixel perfection**. Pick a UI kit you can
comply with quickly (e.g. one CSS framework) and use it consistently.

## Build / run

```bash
cd frontend
npm install
npm run dev      # development (port from FRONTEND_PORT env, default 5173)
npm run build    # quality gate
```
