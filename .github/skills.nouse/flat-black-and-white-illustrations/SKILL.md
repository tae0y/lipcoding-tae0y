---
name: flat-black-and-white-illustrations
description: Generate Ian-style inline illustrations for articles. Use when the user asks to illustrate an article, blog post, Notion doc, workflow doc, methodology, process, structure, state, or metaphor — using keywords like “xiaohei”, “hand-drawn”, “inline illustration”, “shot list”, “remove title”, “regenerate”. Defaults to the Xiaohei IP: solid black creature, white dot eyes, thin legs, blank expression, doing something absurd but coherent. Clean white hand-drawn sketch style with sparse red/orange/blue annotations.
---

# Ian Xiaohei Inline Illustrations

## Purpose

Design and generate 16:9 horizontal inline illustrations for articles. The goal is not commercial illustration, PPT infographics, or cute cartoons — it's turning key judgments, flows, structures, states, or metaphors from the article into clean, absurd, creative, readable hand-drawn explanatory sketches.

The default visual IP is “Xiaohei” (小黑): solid black, white dot eyes, thin legs, blank expression, seriously doing something absurd but coherent. Xiaohei must participate in the core action of the scene — not stand off to the side as decoration.

## Label Language

Default: match the article language (Korean article → Korean labels, English article → English labels).

If the user specifies a language for labels, use that. Never mix languages within a single image.

## References to Load

Load on demand — do not pre-load all references at once:

- `references/style-dna.md`: visual DNA, colors, typography, prohibitions.
- `references/xiaohei-ip.md`: Xiaohei's appearance, personality, action library, prohibitions.
- `references/composition-patterns.md`: structure types, original metaphor method, anti-copy rules.
- `references/prompt-template.md`: single-image generation prompt template.
- `references/qa-checklist.md`: post-generation check and iteration rules.
- `assets/examples/`: low-frequency visual calibration only — do not enter the default generation path. Never copy compositions, objects, or labels from examples.

## Workflow

### 0. Confirm Output Mode

Before doing anything else, ask the user:

> "이미지를 직접 생성할까요, 아니면 외부 툴에서 쓸 프롬프트 텍스트만 저장할까요?"

- **Mode A — Direct generation**: proceed through Steps 1 → 2 → 3 → 4 → 5 as written.
- **Mode B — Prompt only**: proceed through Steps 1 → 2 → 3B → 4B. Read reference files in exactly the same order as Mode A — do not skip any file.

If the user's initial request already makes the mode unambiguous (e.g. "프롬프트만 뽑아줘", "generate the images"), skip the question and proceed.

### 1. Digest the Article

Read the user's article, link, Notion page, Markdown file, or screenshot. Extract:

- What is the core argument
- Which paragraphs carry cognitive turning points
- Which content benefits from illustration
- Which content should stay text-only

Do not distribute illustrations evenly. Prioritize “cognitive anchors”: core judgments, breakpoints, input-output loops, forks, before/after contrasts, one-source-many-uses, handoff paths, common pitfalls, role state changes.

### 2. Shot List First

If the user only asks to “plan illustration strategy / think about where to add images”, output a shot list first. For each image specify:

- After which paragraph it goes
- Image theme
- Core idea
- Structure type
- What Xiaohei is doing in the image
- Suggested elements
- Suggested label words (in the article's language, or the language the user specified)

Default 4-8 images. Short articles: 1-3 images. Long articles: do not exceed 9 without good reason. Enough is enough — don't turn the article into a picture book.

### 3. Single-Image Generation (Mode A only)

Read `references/xiaohei-ip.md`, `references/style-dna.md`, and `references/prompt-template.md` before writing any prompt.

Use the built-in `image_gen` to generate each image separately. Never combine multiple images into one.

Each image conveys only one core structure. The prompt must include:

- 16:9 horizontal inline article illustration
- Pure white background
- Black hand-drawn line art
- Sparse red/orange/blue handwritten annotations (language per label language rule above)
- Generous white space
- Xiaohei as the core action subject
- No PPT, no commercial illustration, no cute cartoon, no complex architecture diagram, no type label in top-left corner

Do not replicate past examples. Examples only provide style density and Xiaohei participation style — do not directly reuse known compositions unless the user explicitly requests a specific example. Always invent a fresh, strange-but-coherent metaphor from the current article.

### 3B. Prompt Text Output (Mode B only)

Read `references/composition-patterns.md`, `references/xiaohei-ip.md`, `references/style-dna.md`, and `references/prompt-template.md` in that order before writing any prompt text.

Write one prompt per image following `references/prompt-template.md`. Save all prompts as a single Markdown file:

```text
assets/<article-slug>-prompts/<article-slug>-prompts.md
```

The `assets/` folder is created next to the source article file (same directory). Name the file after the article slug. Each prompt in the file is numbered to match the shot list order.

### 4. Check and Iterate (Mode A only)

After generation, run through `references/qa-checklist.md`. If any of the following appear, regenerate or edit locally:

- Xiaohei is only decoration
- Scene is too crowded
- Looks like a flowchart or PPT
- Too much text, or label text has errors
- Top-left corner has a type label (“Common Pitfalls / Flowchart / System Architecture”)
- Art style is too cute, childish, or rigid
- Background is not clean white

### 4B. Prompt Review (Mode B only)

Before delivering to the user, run a self-QA pass against `references/qa-checklist.md`. For each prompt, verify:

**Prompt template compliance (cross-check `references/prompt-template.md`):**
- [ ] Every required section is filled: Visual DNA / Recurring IP character / Theme / Structure type / Core idea / Composition / Suggested elements / Handwritten labels / Color use / Constraints.
- [ ] Label language is specified and matches the article language (or user-specified language).
- [ ] Main subject described as staying within ~40%-60% of canvas; ≥35% blank white space preserved.
- [ ] At most 5-8 short handwritten labels per image.

**Design DNA compliance (cross-check `references/style-dna.md`):**
- [ ] Background is pure white — no gradients, shadows, paper texture, or off-white tint.
- [ ] Color rule followed: orange for main flow/arrows, red for warnings/key points only, blue for secondary notes only.
- [ ] No top-left type label ("Flowchart", "Common Pitfalls", etc.).
- [ ] No PPT infographic, formal diagram, or course-slide structure.

**Xiaohei IP compliance (cross-check `references/xiaohei-ip.md`):**
- [ ] Xiaohei described as solid black creature with white dot eyes, thin legs, blank serious expression — not a mascot, animal, or cute cartoon.
- [ ] Xiaohei performs the core conceptual action; the scene's meaning would break without Xiaohei.

**Originality:**
- [ ] Each prompt invents a fresh visual metaphor for the current article — not a direct reuse of a known composition from `assets/examples/`.

If any item fails, fix the prompt before delivering. State the result inline:

```
Self-QA: PASS  (or list specific items fixed)
```

After self-QA, confirm with the user:

- Shot list matches the prompts in count and order
- Each prompt contains Xiaohei's action, structure type, label language, and style constraints from `references/prompt-template.md`
- No prompt describes Xiaohei as a cat, animal, or mascot

### 5. Save and Deliver (Mode A only)

If the user is working within a workspace, save the final images to:

```text
assets/<article-slug>-illustrations/
```

Name sequentially:

```text
01-topic-name.png
02-topic-name.png
```

Keep the original generated files. Do not overwrite existing assets unless the user explicitly requests replacement.

## Output Format

Pre-generation strategy output: short and precise. Post-generation delivery must include:

- How many images were generated
- What each image is for
- Save path
- Which images are solid, which are optional

Do not write long style theory explanations — let the images speak.
