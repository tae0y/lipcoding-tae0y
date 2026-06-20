Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Voice-dictated instructions

My instructions reach you through a microphone (speech-to-text), so the transcript may contain
errors, missing words, or odd phrasing.

- Infer my intent from context and proceed — don't stall on small transcription glitches.
- Don't ask for confirmation on routine, reversible steps; just do them.
- Only stop to confirm when something is genuinely necessary and ambiguous — e.g. a destructive
  or hard-to-reverse action, or a decision that materially shapes the app.
- If a specific word or term is unclear or seems mis-transcribed, ask what I meant rather than guessing.

## Time-aware execution (competition plan)

This is a timed competition. Work against the time-allocation plan in
[docs/plan/competition-plan.md](docs/plan/competition-plan.md).

- Before non-trivial work, check the current time by running `date` in the shell
  (do NOT rely on context-provided dates — they only carry the date, not the time).
- Map the current time to the plan's blocks (사전 준비 / 입코딩 A–F) and tell me which
  block we are in and how much time is left in it.
- Prioritize tasks by the plan: protect the "엔드투엔드로 돈다" baseline and the
  15:40 배포 데드라인. If we are behind schedule, say so and propose what to cut.
- Keep scope to the plan (3 screens, the 필수 3종). Flag any work that drifts beyond it.

## Git commits

- When committing, only stage and commit the files that were actually worked on in
  **this** session. Do not blanket-add everything (no `git add -A` / `git add .`).
- Stage files explicitly by path so unrelated or in-progress work stays untouched.
- If you're unsure whether a changed file belongs to this session's work, ask before
  including it rather than committing it by default.