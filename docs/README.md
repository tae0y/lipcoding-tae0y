# Project Documentation

Everything about Working Memory Inbox — design, research, planning, and presentation.
For the product overview see the root [README](../README.md); for technical depth see
[architecture.md](architecture.md).

> The internal working documents below are kept in **Korean** (they are the team's
> working notes). This index exists so an English reader can understand **why each
> document was created** and decide what to open — every description here is in English.

## Document Index

### Top level

| Document | Why it exists |
|------|------|
| [architecture.md](architecture.md) | Explains how the Copilot SDK is used and how the app is deployed on Azure — the technical depth a reviewer would want after the README. |
| [FEEDBACK.md](FEEDBACK.md) | The competition judging feedback, kept as the basis for re-implementation priorities. |
| [RECALL.md](RECALL.md) | The personal retrospective after the competition. |

### ideation/ — where it began

| Document | Why it exists |
|------|------|
| [README.md](ideation/README.md) | The first ideation note that framed the core idea: preserve human working memory (5±2) by offloading only the legwork to AI. |

### research/ — parallel pre-research

Investigations run alongside requirements so each topic was "ready to start" before coding.

| Document | Why it exists |
|------|------|
| [copilot-sdk.md](research/copilot-sdk.md) | Pinned down how to use the Copilot SDK with depth (tools + Azure BYOK) for the SDK criterion. |
| [azure-deploy.md](research/azure-deploy.md) | Chose the deployment path (App Service, single app) as insurance against the deadline. |
| [stt.md](research/stt.md) | Scoped speech-to-text options for the voice-coding constraint; decided to skip unless time allowed. |
| [design.md](research/design.md) | Set the low-load visual tone (Tailwind + shadcn neutral) aligned with the working-memory theme. |

### plan/ — the build baseline

What the implementation is held against: requirements, contract, schedule, remaining work.

| Document | Why it exists |
|------|------|
| [openapi.yaml](plan/openapi.yaml) | The REST API contract the backend and frontend both follow. |
| [openapi.json](plan/openapi.json) | A JSON conversion of the contract for tooling. |
| [reimplementation-backlog.md](plan/reimplementation-backlog.md) | The v0.0.2 re-implementation backlog (missing ideas, feedback TODOs, UI work). |

### archive/v0.0.1/ — frozen at competition submission

Competition-era material, frozen at the `v0.0.1` tag and kept for reference only.

| Path | Why it exists |
|------|------|
| [PRD.md](archive/v0.0.1/PRD.md) · [README.md](archive/v0.0.1/README.md) | The submission's product spec and readme. |
| [plan/](archive/v0.0.1/plan) | Schedule, remaining-work audit, handover prompt, and the frozen design docs (completed/). |
| [source-of-truth/](archive/v0.0.1/source-of-truth) | The organizers' competition notice and judging rubric. |
| [presentation/](archive/v0.0.1/presentation) | The live demo script and slides. |

### experience/ — lessons logged

| Document | Why it exists |
|------|------|
| [2026-06-20-voice-chat-setup.md](experience/2026-06-20-voice-chat-setup.md) | Notes on setting up the voice-chat workflow, so the setup isn't re-derived. |
| [2026-06-20-korean-stt-troubleshooting.md](experience/2026-06-20-korean-stt-troubleshooting.md) | What broke and what fixed Korean STT misrecognition. |

## Documentation Convention

Documents in this folder follow the GitHub Copilot SDK cookbook's documentation rules.

- **Every folder has a `README.md` index.** The index catalogs that folder's documents
  in a table (document · why it exists / status).
- **When you add a document,** register it in that folder's index with one line.
- One **H1 per document**, **language-tagged** code blocks, related documents linked by
  **relative path**.
- Index descriptions are written in **English**; the working documents themselves stay in
  **Korean**.
- Keep it **concise** — no filler, no hype, no emoji overuse.

The global Markdown rules live in [.github/instructions/markdown.instructions.md](../.github/instructions/markdown.instructions.md).
