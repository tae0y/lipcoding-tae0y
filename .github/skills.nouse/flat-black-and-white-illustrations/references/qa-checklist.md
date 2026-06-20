# QA Checklist

## Must Pass

- 16:9 horizontal format.
- Background is clean white.
- Xiaohei is present.
- Xiaohei performs the core action — not just decoration.
- Did not replicate an old example composition; generated a new metaphor for the current article.
- Scene is absurd, creative, interesting.
- Clean and uncluttered; main subject does not exceed ~60% of canvas.
- One image, one core structure.
- Annotations are few, short, and legible.
- Annotations are in the correct language (matches article language or user-specified language).
- Orange used only for main path or arrows.
- Red used only for key points, problems, warnings, or results.
- Blue used only for supplementary notes, feedback, or system state.

## Failure Signals

If any of the following appear, regenerate or edit locally:

- Top-left corner has "Common Pitfalls / Workflow / System Architecture / Roadmap" or similar type label.
- Xiaohei looks like a mascot, emoji character, or cute cartoon.
- Scene looks like PPT, a course slide, or a formal flowchart.
- Too many elements, too many arrows, too many nodes.
- Text has become a long explanatory paragraph.
- Background has paper texture, shadow, gradient, off-white tint, or noise.
- Real UI screenshot or tech-style interface present.
- Annotation text has significant errors or is unreadable.
- Scene is too rigid with no absurd metaphor.
- Too similar to an existing composition in `assets/examples/`.
- Label language does not match the specified or expected language.

## Iteration Methods

- Too generic: make Xiaohei the action subject; add one strange-but-coherent metaphor.
- Too complex: remove nodes; keep only one action and 3-5 short annotations.
- Too cute: emphasize deadpan, blank serious expression, not cute, not mascot.
- Too PPT-like: remove the title, borders, neat grids, and excess arrows; switch to a hand-drawn scene.
- Too similar to old examples: keep the core idea, swap the main object and Xiaohei's action.
- Text errors: prefer local editing; if errors are extensive, regenerate with fewer annotations.

## Delivery Standard

A high-quality image should make the reader feel "this is a bit strange" first, then understand the structure within 1 second.

If the first impression is a tutorial page rather than an absurd product sketch on blank paper, it does not pass.
