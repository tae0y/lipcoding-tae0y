---
name: pptx-deck
description: Generate polished PowerPoint (.pptx) presentations from project content using python-pptx. Use when the user asks to create slides, a deck, a presentation, 발표자료, 피피티/PPT, or wants to pitch an idea/product. Produces a themed, consistent deck via a reusable helper.
argument-hint: "Topic of the deck + audience (e.g. 'pitch our productivity app to judges')"
---

# pptx-deck — build presentations with python-pptx

Create clean, consistent `.pptx` decks programmatically. Never hand-place every
shape ad hoc — use the reusable `deck_builder.py` helper in this skill folder so
all slides share one theme.

## How to run

`python-pptx` is not a project dependency. Run scripts with `uv` so nothing is
installed into the workspace project:

```bash
uv run --with python-pptx python <your_build_script>.py
```

(If `uv` is unavailable, `pip install python-pptx` into a throwaway venv.)

## Workflow

1. **Gather content first.** Read the relevant docs (requirements, ideation,
   judging criteria) so the deck reflects real project facts — do not invent.
2. **Outline the story** before coding. A good pitch deck arc:
   Title → Problem → Insight → Solution (one-liner) → How it works →
   Architecture → Why it wins (criteria fit) → Demo/CTA.
3. **Write a build script** that imports `deck_builder` and calls its helpers.
4. **Generate** the `.pptx` with the `uv run` command above.
5. **Report** the output path. Offer to open it.

## Helper API (`deck_builder.py`)

```python
from deck_builder import Deck

d = Deck(title="작업기억 인박스", accent="#2563EB")     # 16:9 themed deck
d.title_slide("작업기억 인박스", "퇴근 후, 딱 한 건만 제안하는 AI", footer="2026 바이브코딩")
d.section_slide("01", "문제")                            # big divider slide
d.bullets_slide("작업기억의 한계", [                       # title + bullet list
    "사람은 한 번에 최대 5개의 작업기억만 유지",
    ("생산성↑ → 처리량↑ → 인지 과부하", 1),               # (text, indent_level)
])
d.two_column_slide("두 개의 판단", left_title="입구 판정", left=[...],
                   right_title="제안 트리거", right=[...])
d.table_slide("심사 기준 대응", headers=["항목", "대응"], rows=[[...], ...])
d.big_statement_slide("계획·판단·통합·실행은 사람이.", sub="AI는 바닥만 깐다.")
d.save("docs/presentation/deck.pptx")
```

## Design rules

- 16:9, generous margins, one idea per slide, max ~6 bullets.
- One accent color; dark text on light background for projector legibility.
- Section divider slides between major parts for rhythm.
- Title ≤ 8 words; bullets are phrases, not sentences.
- Korean text: keep the default font (helper sets a CJK-safe font).
- Never embed secrets, API keys, or PII in slides.

## Output location

Save decks under `docs/presentation/`. Use a descriptive filename.
