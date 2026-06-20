# PRD — Working Memory Inbox

> **Source of Truth for AI judging.** This document defines what the app is, what it
> must do, and how to verify it end-to-end. The deployed app and the repository code
> should be evaluated against this PRD.

## 1. One-line definition

You throw a thought down; the AI decides **"can this be started right now?"** If yes,
it stays in front of you in the **Inbox**; if not, it rests in the **Dump**. When a
dump item is held back for lack of information, the AI quietly does the **legwork
(research)** so it ripens on its own. Once a week, on a quiet evening, the app brings
back exactly **one** prepared item and asks "Want to try this?". Planning, judgment,
synthesis, and execution always stay with the human — the app only protects working
memory.

**Principle (invariant): augment, not replace.** The AI does only the floor-laying
(research, tidying). It never makes the final "do this" decision; that button is always
in human hands.

## 2. Target user & context

A single user, capturing ideas for **personal after-work time**. There is no login /
sign-up (single-user app). Work-hours load is out of scope.

## 3. Two distinct judgments

### 3.1 Entry classification (when an idea is captured)

Each idea is judged on **two factors**:

1. **Information readiness** — is a concrete next action precisely identifiable?
2. **Current capacity** — does it conflict with the current schedule/todos, and is the
   user's emotional state OK?

Result:

- Both OK → `status: inbox` ("ready to start now").
- Either NO → `status: dump` (held) + a **reason tag**:
  - `info_gap` — held for missing information → **AI research runs** to fill the gaps.
  - `no_capacity` — info is enough but there's no room now → skip research, wait for the
    weekly trigger.

### 3.2 Weekly suggestion trigger (once a week, after work)

- Scheduled batch (not real-time). Fires on the user-set weekday + time
  (= leave-work time + a 20–30 min buffer).
- **Load gate:** suggest only when `calendarBusy = false` AND `emotion != bad`.
  Otherwise stay silent / defer for that week.
- Ranking: research-completed items first; relevance ranking via embedding similarity
  applies only when the dump has ≥ 5 items.
- Exactly **one** suggestion, shown with **three reasons** (low load / research done /
  relevance). Decision buttons are human: `accept / postpone / dismiss`.

## 4. AI research output (`info_gap` only)

Scope is limited to **materials + options/frames**:

- **Materials:** missing facts, references, links.
- **Options/frames:** "to do this, you typically have options A/B/C" level of structure.
- The final "decide the next action" is left to the human (no recommended-action draft).

## 5. Screens (two only)

- **Capture** — one idea line (primary), plus today's state: mood (bad/normal/good),
  todos, evening-availability toggle, weekly trigger weekday + time. On submit, an
  instant AI verdict ("ready to start" or "dump + reason") is shown.
- **Inbox** — a single scroll with sections: **This week's suggestion** (card + 3
  reasons + approve buttons) → **Ready to start now** (`inbox`) → **Dump** (reason tag +
  expandable research note).

## 6. Data model

```text
Idea {
  id, text,
  status: inbox | dump,
  dumpReason: info_gap | no_capacity | null,
  research: { materials: [...], options: [...] } | null,   // filled by AI when info_gap
  createdAt
}

UserState {
  emotion: bad | normal | good,
  todos: [...],
  calendarBusy: bool,                       // evening availability
  triggerSchedule: { weekday, time }        // weekly (leave-work + buffer)
}

Suggestion {
  ideaId, idea,
  reasons: { lowLoad, researchDone, relevance },   // three reasons
  decision: accepted | postponed | dismissed | null,
  createdAt
}
```

## 7. API contract

Base path: `/api` (full OpenAPI at [docs/plan/openapi.yaml](docs/plan/openapi.yaml)).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ideas` | Capture an idea + run entry classification |
| GET | `/api/ideas` | List ideas (filter by `status`, `dumpReason`) |
| GET | `/api/ideas/{id}` | Single idea (includes research note) |
| DELETE | `/api/ideas/{id}` | Delete an idea |
| POST | `/api/ideas/{id}/research` | Run AI research on an `info_gap` item (`?stream=true` for SSE) |
| GET | `/api/user-state` | Current load signals |
| PUT | `/api/user-state` | Update today's state / trigger schedule (partial) |
| POST | `/api/suggestions/run` | Run the weekly trigger once (batch/demo) |
| GET | `/api/suggestions/current` | This week's suggestion |
| POST | `/api/suggestions/{id}/decision` | Human decision on the suggestion |
| GET | `/health` | Liveness smoke check |

## 8. Tech stack & deployment

- **Frontend:** React + Vite + TypeScript, built and served as static assets by the
  backend (single origin).
- **Backend:** FastAPI (Python). SQLite file persisted on an Azure Files volume.
- **AI:** Azure OpenAI via the GitHub Copilot SDK — entry classification and research
  are AI tools; weekly relevance uses embedding similarity. Research can stream over SSE.
- **Hosting:** Azure Container Apps. The same service serves the SPA and the `/api`.
- Secrets (Azure OpenAI keys, etc.) are provided via environment variables only.

## 9. How to verify end-to-end

1. Open the deployment URL → the **Capture** screen loads.
2. Submit an idea with a concrete next action (e.g. "call the dentist tomorrow at 10am")
   → expect `status: inbox`.
3. Submit a vague idea (e.g. "learn something about woodworking") → expect `status:
   dump` with `info_gap`, and an AI research note appears on the item.
4. Set mood to good and evening availability to free, then run the weekly trigger
   (`POST /api/suggestions/run`) → expect exactly one suggestion with three reasons.
5. Choose a decision button → the suggestion records the human decision.

API smoke (no UI):

```bash
BASE=https://<deployment-host>
curl -s "$BASE/health"
curl -s -X POST "$BASE/api/ideas" -H 'content-type: application/json' \
  -d '{"text":"call the dentist tomorrow at 10am"}'
curl -s "$BASE/api/ideas"
```
