# Experience Log

Problems hit during the build and how they were solved, logged by date so the same trap
isn't stepped on twice. The notes themselves are in Korean.

## Index

| Document | Why it exists |
|------|------|
| [2026-06-20-voice-chat-setup.md](2026-06-20-voice-chat-setup.md) | Notes on setting up the voice-chat workflow, so the setup isn't re-derived. |
| [2026-06-20-korean-stt-troubleshooting.md](2026-06-20-korean-stt-troubleshooting.md) | What broke and what fixed Korean STT misrecognition. |
| [2026-06-20-copilot-mixed-language-output.md](2026-06-20-copilot-mixed-language-output.md) | Why Copilot output came out mixed Japanese/English (Japan VPN routing). |
| [2026-06-20-sqlite-db-leaked-into-container.md](2026-06-20-sqlite-db-leaked-into-container.md) | Local SQLite DB leaked into the container image; fixed with a root `.dockerignore`. |
| [2026-06-20-submission-unpushed-commit-hash-invalid.md](2026-06-20-submission-unpushed-commit-hash-invalid.md) | Submitted a correct-but-unpushed commit hash → invalid; always push and verify on the remote first. |
| [2026-06-20-ai-poor-prioritization-under-time-pressure.md](2026-06-20-ai-poor-prioritization-under-time-pressure.md) | Under a time limit the AI failed to pick the cheapest-highest-impact task (prompt-injection guard); give it an explicit objective function, not "do what you can". |
| [2026-06-22-auth-signed-cookie-session-concepts.md](2026-06-22-auth-signed-cookie-session-concepts.md) | Study notes on the single-user passphrase + signed-cookie session auth: concepts (auth vs authz, signed vs encrypted, session vs token), the login flow, middleware ordering, cookie security flags, and limits. |
