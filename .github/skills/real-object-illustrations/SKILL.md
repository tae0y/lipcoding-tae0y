---
name: real-object-illustrations
description: |
  Generate illustrations of "Xiaohei + real objects + physical action + negative-space narrative". By default outputs 16:9 body illustrations, used for relatable images of internet office workers, workplace anxiety in the AI era, the situations of programmers/product people/creators, and metaphor images for the body text's viewpoint; when encountering "Easter-egg mode / long-scroll story image / ultra-wide / personal experience / project retrospective / product evolution / growth path", output a Xiaohei long-scroll story image. Standard mode defaults to a pure white #FFFFFF background; Easter-egg long-scroll mode uses a refined near-white background and a single real-object life line. The examples are high-quality template masters and a yardstick for output quality; you must align with their proportions, negative space, action clarity, and narrative relationships, but must not replicate their object combinations, spatial topology, Xiaohei poses, or label positions.
when-to-use: |
  Triggered when the user needs to generate high-quality "Xiaohei + real objects + physical action" illustrations for an article, post, tutorial, case study, project retrospective, or personal experience.
  Trigger words: Xiaohei real-object scene image, Xiaohei 2.0, real-object image, real objects, Xiaohei + objects, office-worker relatable image, body illustration, Easter-egg mode, long-scroll story image, ultra-wide, personal experience, project retrospective, product evolution, growth path.
  Input state: it can be a passage of body text, a topic, a set of nodes, a project/experience description, or a reference master provided by the user.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
context: fork
---

# Ian Xiaohei Real-Object Scene Image

## Core Positioning

Translate an article's viewpoint, the user's situation, personal experience, project process, product evolution, and content assets into a shareable "real-object mini-scene" or "real-object life line":

```text
Xiaohei + real objects + physical action + short labels (English or Korean, per the user's request) + negative-space narrative
```

This is not the 1.0 pure hand-drawn explanatory diagram, nor is it a slide-deck infographic. The goal of 2.0 is to let the reader first see a real, light, odd scene, then within 1 second realize "this is talking about me".

This Skill has two output specs:

- **Standard mode**: 16:9 body illustration, a single real-object mini-scene, defaulting to a pure white `#FFFFFF` background.
- **Easter-egg mode**: Xiaohei long-scroll story image, a single ultra-wide real-object life line, used for personal experience, project retrospective, product evolution, growth path, and content-asset evolution. It is centered on `assets/examples/07-long-scroll-story-master.png` as the core master, using a refined near-white background, not forced dead white.

## Differences from 1.0

- 1.0: more like a hand-drawn logic diagram on a whiteboard, suited to breaking down articles, processes, and methods.
- 2.0: more like a real-object scene in a white photo studio, suited to expressing situations, emotions, project stories, product stories, and body-text viewpoint metaphors.

If the user requests a "pure hand-drawn Xiaohei explanatory diagram / whiteboard-style flowchart / hand-drawn methodology diagram", prefer `$flat-black-and-white-illustrations`. If the user requests "real objects / real-object image / Xiaohei + objects / office-worker relatability / more of a lived texture / Xiaohei 2.0", use this Skill.

## Before Starting

Read as the task requires; do not stuff everything into context at once:

- `references/style-dna.md`: 2.0 visual DNA, proportions, negative space, color, real-object rules.
- `references/xiaohei-ip.md`: Xiaohei IP's form elasticity, actions, and taboos in 2.0.
- `references/story-extraction.md`: how to extract the user's situation, physical action, and short labels from the body text.
- `references/object-patterns.md`: real-object selection, scene types, original metaphors, and anti-replication rules.
- `references/master-selection.md`: standard-mode 01-06 master selection, quality anchors, variation requirements, and output-blocking rules.
- `references/prompt-template.md`: single-image generation prompt template.
- `references/qa-checklist.md`: post-generation quality check, failure signals, and iteration direction.
- `assets/examples/`: high-quality template masters and output-quality yardstick. `01-06` are standard 16:9 quality anchors; `07-long-scroll-story-master.png` is the sole core master for Easter-egg long-scroll mode. Standard images must align with their proportions, negative space, object realism, Xiaohei temperament, short-label density, accent-color rhythm, and action clarity; do not replicate object combinations, spatial topology, Xiaohei poses, or label positions.

Confirm before starting:

- Whether the user has provided person names, brand names, project names, or experience nodes that must be preserved.
- If the user requests "see the result / output / generate", standard mode must first pick the best-matching master from 01-06; Easter-egg mode must lock onto 07. No image generation or prompt output without a locked master.
- If the conversation context does not include having just viewed the corresponding master, you must view the chosen master image before generating or writing the prompt.

## Core Flow

### 0. Confirm Output Mode

Before doing anything else, ask the user:

> "이미지를 직접 생성할까요, 아니면 외부 툴에서 쓸 프롬프트 텍스트만 저장할까요?"

- **Mode A — Direct generation**: proceed through Steps 1 → 2 → 2B → 3 (→ 3C for Easter-egg) → 4 → 5 → 6 as written.
- **Mode B — Prompt only**: proceed through Steps 1 → 2 → 2B → 3B. Read reference files in exactly the same order as Mode A — do not skip any file.

Also confirm:

- Whether the user explicitly wants a standard 16:9 body image, or an Easter-egg long-scroll story image.

If the user's initial request already makes the mode unambiguous (e.g. "프롬프트만 뽑아줘", "generate the images"), skip the question and proceed.

### 1. Digest the Content

First extract the "situation" in the current content; do not rush to find objects:

- Who should this image resonate with?
- What is pulling, filtering, pressing, dragging back, rushing, or recombining them?
- What physical action can the abstract concept become?
- Which 2-4 short words can hit the pain point in one second?
- Which real object naturally carries this situation?

Prefer high-resonance nodes: meetings, messages, rework, review, filtering, piling on more, being replaced, failing to clock out, project stuck, content-asset accumulation, product-evolution breakpoints.

If the user requests Easter-egg mode, first break the content into 5-8 consecutive nodes:

- Left starting point: identity, origin, the earliest situation.
- Middle nodes: key experiences, project turning points, content assets, product evolution.
- Right end point: what they are doing now, core focus, conclusion, or next stage.
- Each node must have a real object, a Xiaohei action, and 1-3 lines of short annotation.

Completion marker: the reader's situation, core conflict, real object, Xiaohei action, and short labels are clear; in Easter-egg mode, 5-8 visualizable nodes have been obtained.

### 1B. Fact Anchoring

When involving personal experience, brand names, company names, project names, follower counts, time spans, or achievement numbers, only use facts from user input, user-provided materials, or facts explicitly confirmed by the user.

- Do not inherit facts the user has not provided from the master, and do not pad them into a more complete-looking resume.
- For content that cannot be confirmed, substitute a generalized label, e.g. "content platform", "project node", "user feedback", "product experiment".
- If the user requests preservation but the information is incomplete, mark it "to be confirmed" in the shot list or delivery notes; do not draw it as an established fact.

Completion marker: every specific fact can be traced back to user input or materials; facts that cannot be traced have been deleted, abstracted, or marked to-be-confirmed.

### 2. Produce the Shot List First

If the user says "analyze / think / how to illustrate", give the shot list first. For each image, write clearly:

- Which master to use
- The image's theme
- The reader's resonance point
- The physical action
- The real main object
- What Xiaohei is doing
- The short label
- Why this image is worth drawing

Standard mode defaults to 4-8 images. Easter-egg mode defaults to first producing 1 long-scroll master result image. When the user explicitly wants to "see the result / output / generate", generate directly without stopping at the plan, but you must still complete the 2B master lock internally first.

Completion marker: every candidate frame has a master, theme, resonance point, physical action, real main object, Xiaohei action, short label, and a rationale for the image.

### 2B. Master Lock (Mandatory in Standard Mode)

In standard mode, every image must complete a master lock before generation. Read `references/master-selection.md` and pick the best-matching quality anchor from `01-06`. The master is not a copyable composition; do not directly move over the spatial topology of the case's phone, sticky note, hourglass, computer, magnifier, etc.

Required fields:

```text
Master:
Extracted invariant:
Variation points for the current content:
3-second-read sentence for the frame:
Adaptation to the current content:
Failure signals to avoid:
```

Selection principles:

- Failing to clock out, alarms, rework reflow, problems tangled up: prefer `03-production-alert`.
- Messages pouring out, task overload: prefer `02-message-overload`.
- Meetings / sync / alignment pulling people back: prefer `01-meeting-pull-in`.
- Review / proofreading / backstopping / rework checks: prefer `04-code-review-rework`.
- AI automation, role restructuring, identity-label changes: prefer `05-ai-automation-badge`.
- Filtering / screening / keywords / lost opportunities: prefer `06-ai-resume-filter`.

If the current content does not fully match any master, still pick the closest one as a yardstick for proportion, negative space, and information density, then rewrite the objects, actions, and labels.

Variation requirements:

- At least 3 items different from the master: main-object category, spatial direction, Xiaohei action, prop combination, label position, viewpoint, or narrative focus.
- If the main object is the same as the master, the spatial relationship and Xiaohei action must be clearly different.
- If the spatial relationship is similar to the master, the main object, action, and accessories must be clearly different.
- You cannot turn the master case into a text-swapped version. If at first glance it looks like the old case with a swapped theme, it fails.

Hard budget:

- There can be only one core physical action.
- There can be only one real main object or a compact main-object group.
- At most 1-2 small accessories.
- At most 4 short labels, preferably 3.
- Forbidden to draw out every noun in the theme. When "element listing" appears, trim first, then generate.
- A single large dark object cannot dominate the frame; dark main objects like phones, computers, black boxes must be shrunk or swapped for a lighter real-object anchor.
- The overall scene must be lighter than or as light as the master, never fuller, larger, or heavier.

Completion marker: every standard image has a clear master, invariant, at least 3 variation points, a 3-second-read sentence, an adaptation point, and failure signals; no element listing or master replication.

### 3. Single-Image Generation (Mode A only)

Generate each image separately; do not stitch multiple into one.

Default to 16:9 landscape. The prompt must include:

- Master lock: which 01-06 case is used as the quality anchor, which invariants are extracted, and how the current image makes at least 3 variations.
- `#FFFFFF` pure white background and a white photo-studio surface, never grayish white, warm white, off-white, gradient, or vignette.
- Real photographic objects naturally integrated, with unified light/shadow and perspective.
- Xiaohei participating in the core physical action.
- 2-4 short handwritten labels (English or Korean, per the user's request).
- A small amount of blue / pink / yellow / green / red accents.
- A medium scene coverage area, but light visual weight.
- Forbidden: screenshots, UI, logos, slides, commercial illustration, sticker borders, and long explanatory passages.

Completion marker: every standard image has an independent prompt that includes proportion, background, real objects, Xiaohei action, labels, accents, and negative constraints.

### 3B. Prompt Text Output (Mode B only)

Read `references/xiaohei-ip.md`, `references/style-dna.md`, `references/object-patterns.md`, and `references/prompt-template.md` in that order before writing any prompt text.

Write one prompt per image following `references/prompt-template.md`. Save all prompts as a single Markdown file:

```text
assets/<topic-slug>-prompts/<topic-slug>-prompts.md
```

The `assets/` folder is created next to the source article file (same directory). Each prompt is numbered to match the shot list order, and includes the master-lock record from Step 2B.

Before delivering to the user, run a self-QA pass against `references/qa-checklist.md`. For each prompt, verify:

**Master compliance:**
- [ ] Master lock record is present (Master / Extracted invariants / Variation points / 3-second sentence / Fit / Failure signals).
- [ ] At least 3 variation points are named and are genuinely different from the master's object, spatial direction, Xiaohei action, prop, label position, viewpoint, or narrative focus — not a text-swap.
- [ ] The prompt does not reproduce the master's exact spatial topology or object combination.

**Prompt template compliance (cross-check `references/prompt-template.md`):**
- [ ] Every required section is filled: Core visual DNA / Template master lock / 3-second readability / Approved proportion / Scene budget / Xiaohei IP / Theme / Reader situation / Physical metaphor / Real object scene / Xiaohei action / Handwritten labels / Color accents / Constraints.
- [ ] Scene budget: one core action, one main object or compact group, ≤2 accessories, ≤4 labels.
- [ ] Background specified as pure seamless `#FFFFFF`.
- [ ] Negative constraint block is present and includes anti-copy language.

**Design DNA compliance (cross-check `references/style-dna.md`):**
- [ ] Labels are 2-4 short phrases, not titles or process steps.
- [ ] Color accents limited to 4-6 small touches; no large color areas.
- [ ] No element-listing: the prompt does not pile every theme noun into the scene.
- [ ] 3-second readability sentence is stated and would be legible without captions.

**Xiaohei IP compliance (cross-check `references/xiaohei-ip.md`):**
- [ ] Xiaohei is described as solid black bean/capsule with white dot eyes and thin limbs — not a mascot, animal, or cartoon character.
- [ ] Xiaohei performs the core physical action; removing Xiaohei would break the metaphor.

If any item fails, fix the prompt before delivering. State the result inline:

```
Self-QA: PASS  (or list specific items fixed)
```

After self-QA, confirm with the user:

- Shot list and prompts match in count and order.
- Each prompt references the master lock, Xiaohei action, real objects, labels, and style constraints from `references/prompt-template.md`.
- No prompt describes Xiaohei as a cat, animal, or mascot.

### 3C. Easter-Egg Long-Scroll Generation

When the user says "Easter-egg mode / long-scroll story image / ultra-wide / personal experience / project retrospective / product evolution / growth path / like this long image", use Easter-egg mode.

The master for Easter-egg mode is `assets/examples/07-long-scroll-story-master.png`, and its core is:

- Ultra-wide long scroll, proportion close to `2.6:1` to `3:1`.
- Refined near-white background, close to white but retaining an extremely light photo-studio air; do not go dead white and cause objects to float.
- A single thin black hand-drawn curving route running through the whole image.
- 5-8 real-object nodes, each node having a Xiaohei action.
- The nodes form natural, irregular up-and-down undulation along the route; they cannot be tightly tiled into a horizontal flow, nor made into a regular sine wave.
- There must be clear negative space and unequal spacing between nodes, with the visual center of gravity balanced left and right; do not let large objects cluster or press down on the frame.
- The route's rhythm should look hand-drawn: gentle stretches, sudden rises, shallow bends, deeper dips, and a quiet ending can mix together; avoid mechanical high-low alternation.
- The left side is the starting-point identity / opening, the right side is the current focus / conclusion.
- Node text sits close to the object, like handwritten life annotations written directly in the blank space, not infographic modules.
- Node copy by default should not be placed inside sticky notes, paper slips, cards, or label boxes; colored tape, small dots, and short underlines serve only as accents.
- Nodes use no sequence numbers, numbered dots, or step markers; they are naturally strung together by the route, objects, and short labels.
- Colored tape, small dots, and short underlines serve only as rhythm accents.

Easter-egg mode should preserve the master's spatial structure and narrative approach, but replace node themes, real objects, Xiaohei actions, node copy, and the starting- and end-point expressions according to the current content. Do not replicate Ian's personal experience, Dribbble, Muzli, Twitter/X, IBC, or other specific content, unless the user explicitly wants to make an Ian self-introduction.

Completion marker: the long-scroll prompt includes ultra-wide proportion, refined near-white background, a curved-path route, 5-8 real-object nodes, Xiaohei participating segment by segment, left start and right close, sequence-number-free nodes, and node copy after fact anchoring.

### 4. Use the Template Masters

`assets/examples/` are high-quality template masters, not rigid templates, and not an object-exclusion rule.

Output must align with these excellent standards:

- Scene coverage area.
- Negative space and air.
- Real-object light and shadow.
- The proportional relationship between Xiaohei and the object.
- Number of short labels.
- Accent-color density.
- Action type, e.g. left-right pulling, central review, objects pouring out, label renaming, screening/filtering.
- Narrative relationship, e.g. "pulled in", "can't hold it back", "being reviewed", "being renamed", "being filtered out".

When the current article highly matches the action type of a certain master, you should use it as the quality anchor, extract the action invariant, then write at least 3 variation points for the current content. The value of the template is to help judge "what physical relationship this kind of content suits", not to provide a traceable layout.

What really must be avoided is mechanically applying the template: not looking at the current content, directly copying the old case's object combination, placement relationships, Xiaohei action, and label structure. Each time, let the current article re-decide the metaphor, at minimum rewrite the label context, and adjust the action, relationship, angle, or object details according to the content.

Easter-egg mode has only one core master: `07-long-scroll-story-master.png`. Its value is not the specific objects but the skeleton of a "real-object life line": left starting point, curved-path route, node undulation, real objects carrying memory points, Xiaohei participating segment by segment, right-side close. When making a new long scroll, you must lock onto this skeleton, then replace the content.

Completion marker: it is stated which master's spatial relationship is used, and which objects, actions, and labels come from the current content.

### 5. QA and Iteration (Mode A only)

After generation, check against `references/qa-checklist.md`. Focus on:

- Whether the candidate image truly aligns with the chosen master, rather than merely containing similar elements.
- Whether the candidate image over-copies the chosen master's spatial topology, prop combination, and Xiaohei action.
- Whether the candidate image is readable in 3 seconds; if you need to explain the theme to understand it, it fails.
- Whether the real objects have a screenshot feel or sticker borders.
- Whether the scene is too large, too small, too full, or too scattered.
- Whether Xiaohei carries the core action.
- Whether the short labels are accurate, few, and readable.
- Whether the template master has been applied mechanically, rather than re-adapted to the current content.
- Whether at first glance it looks like a "real-object mini-scene", rather than a tutorial page, infographic, or material collage.
- Whether Easter-egg mode forms a continuous real-object life line: left starting point, curved-path route, node undulation, Xiaohei participating segment by segment, right-side close.

The first generated image is always only a candidate, not the delivery image. You must first view the candidate image and do a visual comparison with the chosen master. As long as any of the following problems appear, do not deliver; first rewrite the prompt or regenerate:

- Element listing: piling all the theme nouns in, lacking one clear physical conflict.
- Master replication: the subject, direction, accessories, Xiaohei action, and label position look like the old case with swapped text.
- Unreadable: when not reading the notes, the frame's conflict is unclear.
- Main object too large or pushed to the edge, like a product shot.
- Too many objects, like a material collage.
- Text labels turn into concept explanations or titles.
- Xiaohei does not carry a master-level physical action.
- The frame at first glance does not look like the body-illustration quality of `assets/examples/`.

If it does not qualify, regenerate or locally edit; do not present a low-quality image as the final delivery. You may tell the user "the candidate image did not pass QA, redoing it", but do not package it as a result showcase.

Completion marker: CRITICAL items have passed; when STANDARD items do not pass, mark the delivery state as DONE_WITH_CONCERNS and point out the next round's iteration direction.

### 6. Save and Deliver (Mode A only)

If the user is working inside the workspace, copy the final image to:

```text
assets/<topic-slug>-xiaohei-scenes/
```

Easter-egg long-scroll mode can be saved to:

```text
assets/<topic-slug>-xiaohei-long-scroll/
```

Name in order:

```text
01-topic-name.png
02-topic-name.png
```

Keep the original generated files; do not overwrite existing assets, unless the user explicitly requests replacement.

Completion marker: the image has been shown or saved to the target directory, named in order, with old assets not overwritten.

## Output Stance

Before generation: short and precise, give a shot list or generation plan.

After generation: show the image, explain its purpose, give the save path, and indicate which are most stable, which are optional, or which need another round.

Do not give lengthy theoretical explanations. Let the image speak first.

## Completion States

| State | Meaning |
| --- | --- |
| DONE | Completed the shot list or image generation, and passed the QA check |
| DONE_WITH_CONCERNS | Delivered, but there are pending optimization items such as text stability, object realism, background purity / near-white air |
| BLOCKED | Missing theme/body text/nodes, or the facts, persons, or brand information the user requested cannot be confirmed |

## Quality Gates

### Gate 1: CRITICAL (fail = not delivered as final image)

- Standard mode must have a master-lock record; Easter-egg mode must lock the 07 long-scroll master.
- Standard mode must have at least 3 variation points for the current content; it cannot be a text-swapped version of the old master.
- Xiaohei must appear and carry the core physical action.
- Real objects must look like a real mini-scene in the same white photo studio, not a screenshot collage.
- Standard mode must be a 16:9 body image; Easter-egg mode must be an ultra-wide long-scroll image.
- Standard-mode background must be close to `#FFFFFF`; Easter-egg-mode background must be clean, refined near-white.
- Labels must be short, few, and readable, not garbled or fake text or long explanations.
- No element listing may appear: piling multiple nouns, multiple objects, and multiple labels from the theme into one image.
- No master replication may appear: swapping only the text on the case's objects, orientation, accessories, and Xiaohei pose.
- The frame must be readable in 3 seconds; if it can only be understood by explaining the metaphor in the delivery notes, it cannot be delivered as the final image.
- Do not add person names, contact details, company names, logos, or private information that the user has not provided or authorized.

### Gate 2: STANDARD (fail = can continue iterating after marking)

- The frame's proportion, negative space, and scene coverage area align with the master.
- Xiaohei's form is stable, not like a meme, mascot, or children's cartoon.
- Real objects do not press the frame; there is air between nodes.
- Colored accents serve only rhythm, not stealing the subject.
- The output can state "which is most stable, which needs another round".

## Good vs Bad

**Good:**

> One real main object + one Xiaohei action + 2-4 short labels. The reader first sees a real mini-scene, then understands the situation.

**Bad:**

> Turning the viewpoint into a slide-deck flowchart, piling up many arrows, module boxes, big titles, and explanatory text, with Xiaohei merely standing to the side.

**Where it's bad:** the former tells the story through physical action and real objects; the latter explains the concept through information stacking.

## Suppressions

- Personal experience, brand names, and project names the user explicitly provides do not count as "unauthorized personal information", but do not additionally invent.
- The specific objects in the master may be reused when the content matches; that does not count as mechanical replication; mechanical replication means directly copying the old image without looking at the current content.
- Occasional slight text instability from the image-generation model does not equal Skill failure, but it must be noted at delivery with a suggestion to iterate.
