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

### source-of-truth/ — the immutable reference

Official material from the organizers, kept verbatim and used only as ground truth.

| Document | Why it exists |
|------|------|
| [competition-notice.md](source-of-truth/competition-notice.md) | The original competition announcement (rules, required elements, deadlines). |
| [judgement-criteria.md](source-of-truth/judgement-criteria.md) | The original judging rubric, used to prioritize work by weight. |

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
| [app-requirements.md](plan/app-requirements.md) | The requirements spec locked in a grilling session, handed off as the source for implementation. |
| [ui-wireframes.md](plan/ui-wireframes.md) | The two-screen ASCII wireframes confirmed in the same session. |
| [openapi.yaml](plan/openapi.yaml) | The REST API contract the backend and frontend both follow. |
| [openapi.json](plan/openapi.json) | A JSON conversion of the contract for tooling. |
| [completed/](plan/completed) | Design docs frozen once their work was implemented. |
| [archive/v0.0.1/](archive/v0.0.1) | Competition-era docs (root PRD/README + plan schedule, remaining-work, handover), frozen at v0.0.1. |

### presentation/ — the pitch

| Document | Why it exists |
|------|------|
| [demo-scenario.md](presentation/demo-scenario.md) | The live demo script (five scenes + backup plan) to show the value in three minutes. |
| [build_deck.py](presentation/build_deck.py) | A script that generates the presentation slides (.pptx). |

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
