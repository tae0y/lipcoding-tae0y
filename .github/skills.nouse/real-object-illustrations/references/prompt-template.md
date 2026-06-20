# Image Generation Prompt Templates

Generate each image separately. Replace the variables based on the current content; do not combine multiple images into one.

## Standard 2.0 Template

```text
Generate one standalone 16:9 horizontal article illustration in Xiaohei Scenes 2.0 style.

Core visual DNA:
Pure seamless #FFFFFF white background. A clean pure-white studio surface. No off-white, no warm white, no grey vignette, no background gradient, no paper texture. Real photographed objects naturally integrated with very light contact shadows only. Hand-drawn Xiaohei interacts physically with the real objects. Premium, restrained, weird, clear, not cute poster, not PPT, not infographic.

Template master lock:
Use {master file, e.g. assets/examples/03-production-alert.png} as a quality anchor, not a layout to copy. Extract only these invariants: {invariants such as ratio / whitespace / real object texture / clarity of Xiaohei's action / sparse labels}. Required mutations for this image: {at least 3 mutation points: main object category, spatial direction, Xiaohei's action, props, label position, viewpoint, or narrative focus}. Do not reproduce the master image's exact spatial topology, object combination, prop placement, Xiaohei pose, or label placement. The image must feel like the same quality family, but clearly be a new visual metaphor grown from the current theme.

3-second readability:
Without reading any explanation, a viewer should understand this conflict in 3 seconds: {3-second readable sentence of the scene}. If the metaphor requires explanatory context, simplify or change the physical action.

Approved proportion:
The high-quality template examples are the required quality standard for restraint, whitespace, object realism, Xiaohei presence, label density, and color accent rhythm. The whole scene footprint should feel medium-light: about 52%-64% of canvas width and 32%-44% of canvas height for first-pass previews. Do not make it miniature. Do not make it close-up. Any single dark object, such as a phone, laptop, or black box, must stay visually light and must not dominate the composition. Objects need air between them.

Scene budget:
One core physical action only. One real main object or one compact main object group only. At most 1 small prop for first-pass previews, 2 maximum only when necessary. At most 3 handwritten labels (English or Korean, per the user's request). Do not include every noun from the theme. Remove any object that does not serve the core physical conflict. Avoid using the same signature prop set as the selected master.

Xiaohei IP:
Small black solid irregular bean / soft capsule creature with tiny white dot eyes, thin arms and legs, blank serious expression. Xiaohei may be slightly taller, shorter, fatter, or thinner depending on the object and action, but changes are subtle. Xiaohei must perform the core physical action, not decorate the scene.

Theme:
{theme}

Reader situation:
{reader situation / pain point}

Physical metaphor:
{the physical action the abstract idea is translated into}

Real object scene:
{real main object + small props + how the objects are arranged}

Xiaohei action:
{what Xiaohei is specifically doing}

Handwritten labels (English or Korean, per the user's request):
{short label 1} / {short label 2} / {short label 3} / {optional short label 4}

Color accents:
Use only sparse small accents: cobalt blue tape, soft pink tape, lemon yellow tab or dot, tiny green dot, tomato-red underline or warning mark. 4-6 accents total.

Constraints:
No UI screenshot, no app logo, no unrequested company name, no unrequested personal information, no pasted rectangular photo edge, no collage chaos. User-provided names, project names, and self-introduction facts may appear only when they are essential to the requested image. No big title. No long explanation. No workflow chart. No multiple scenes. No office room background. No dark tech background. No off-white background, no grey background, no vignette, no gradient. No concept inventory, no element checklist image, no dumping laptop + phone + papers + cords unless they form one compact main object group. Do not copy the selected master as a topic-swap. Do not repeat its exact object combination, left-right layout, Xiaohei pose, prop set, or label positions. The examples are high-quality template masters and the required quality bar, not layouts to trace.
```

## Minimal Variant

For cover-like images, strong metaphors, and poster-style article illustrations:

```text
Ultra restrained Xiaohei Scenes 2.0 variant. Keep one real core object, one Xiaohei action, and 2-3 short handwritten labels (English or Korean, per the user's request). Scene still uses real object photography on a pure white studio surface. Preserve object scale and breathing room. Do not explain the full system; keep one strange but precise physical metaphor.
```

## Easter-Egg Long-Scroll Mode Template

For personal experiences, project retrospectives, product evolution, growth paths, and content asset evolution. The core master is `assets/examples/07-long-scroll-story-master.png`. The goal is one continuous real-object life line.

```text
Generate one ultra-wide horizontal Xiaohei long-scroll story image in Xiaohei Scenes 2.0 style.

Use the long-scroll master example assets/examples/07-long-scroll-story-master.png as the core template master and quality bar. Preserve its spatial logic and narrative rhythm, not its specific Ian personal facts.

Core visual DNA:
An ultra-wide white-space long scroll, about 2.6:1 to 3:1 ratio. A thin hand-drawn black winding line travels from left to right across the whole image. Along the route, 5-8 real object milestone nodes appear with airy spacing and gentle vertical ups and downs. Each node has Xiaohei physically interacting with the object or the route. Small handwritten notes (English or Korean, per the user's request) sit close to each node. The milestone nodes must not use numbers, numbered circles, step labels, or visible sequence markers; the order should feel natural through the winding route. The left side starts with identity / origin text. The right side closes with current focus / conclusion / next stage.

Strict long-scroll master layout requirements:
The route must feel hand-drawn and organic, not mathematical. Use irregular vertical rhythm and uneven node spacing: one quiet low stretch, one sudden climb, one shallow arc, one deeper dip, then an unforced right-side finish. Do not create a regular sine wave, do not alternate high-low-high-low, and do not place milestones at equal intervals. Do not align all milestones on one baseline. Keep the layout loose and balanced, with large clean white gaps between nodes; no dense cluster, no full-width object pile, no oversized central hero object. Node copy should be handwritten directly in the open white space beside or under objects, not inside sticky notes, cards, paper slips, labels, or caption boxes. Use colored tape, dots, and short underlines only as tiny rhythm accents, not as text containers.

Background:
Use a premium near-white background, not dead pure white. Keep a subtle white studio air feeling close to #FAFAF8 or #FBFBFA. The background must still be clean, light, and high-end: no dirty grey, no warm yellow, no paper texture, no heavy vignette, no poster gradient. Only very light contact shadows under objects and Xiaohei.

Xiaohei IP:
Small black matte rounded bean / soft capsule Xiaohei, slightly chubby, simple white oval eyes, tiny thin arms and legs. Cute but premium, weird but restrained. Xiaohei must participate in each milestone action, not decorate the route.

Story theme:
{long-scroll theme}

Left opening:
{left-side identity / starting point / opening copy}

Milestone nodes, written as unnumbered natural life notes:
- {node theme} | object: {real object} | Xiaohei action: {action} | note: {short note}
- {node theme} | object: {real object} | Xiaohei action: {action} | note: {short note}
- {node theme} | object: {real object} | Xiaohei action: {action} | note: {short note}
- {node theme} | object: {real object} | Xiaohei action: {action} | note: {short note}
- {node theme} | object: {real object} | Xiaohei action: {action} | note: {short note}
- {optional node}
- {optional node}
- {optional node}

Right closing:
{right-side current focus / conclusion / next stage}

Color accents:
Sparse rhythm accents only: tiny blue tape, soft pink tape, small yellow tab or dot, tiny green dot, tomato-red underline. Accents should mark milestones and route rhythm, not become decoration noise.

Constraints:
Do not redesign into a timeline infographic. Do not create separate cards or modules. Do not add numbered circles, step numbers, milestone numbers, or timeline markers. Do not put every milestone note on sticky notes, paper slips, cards, flags, or boxed labels. Do not make a tight horizontal row. Do not make a regular sine-wave route. Do not make equal node spacing. Do not make one giant object dominate the whole canvas. Do not make it a PPT, poster, UI screenshot, dashboard, collage, or multiple scenes. Do not copy the original Ian personal details, Dribbble, Muzli, Twitter/X, IBC, or the exact objects unless the user is explicitly making Ian's self-intro or provides equivalent facts to include. Keep the long-scroll master skeleton: left opening, organic winding route with irregular vertical rhythm, airy real object nodes, Xiaohei at every node, freehand notes in open space, right closing, premium near-white background.
```

## Batch Multi-Image Generation Prompt

When the user requests generating multiple images at once, first write an independent theme for each one, then call the image generation tool one by one:

```text
Create 8 separate 16:9 images, one by one, not a collage. Before each image, lock one specific standard template master from assets/examples/01-06 as a quality anchor. For each image, list invariants and at least 3 required mutations so it cannot become a master-image topic swap. Maintain the same Xiaohei Scenes 2.0 restraint, pure-white studio style, object realism, sparse labels, and color rhythm across the series. Do not deliver the first generated candidate until it has been visually compared with the selected master and passed QA for originality, scale, and 3-second readability.
```

In easter-egg long-scroll mode, generate 1 master mockup first by default, then iterate after confirmation.

## Common Negative Constraints

```text
Negative for standard 16:9 mode: no UI screenshot, no phone chat interface, no code editor screenshot, no GitHub screenshot, no unrequested app logo, no unrequested company logo, no personal photo, no dense text, no huge red arrows, no PPT infographic, no formal flowchart, no business dashboard, no cute mascot, no children's cartoon, no 3D render, no dark cyberpunk, no off-white background, no grey background, no background gradient, no vignette, no paper texture, no frame, no pasted rectangular image.
Additional negative for standard mode: no concept inventory, no element checklist image, no overloaded scene, no multiple unrelated objects, no laptop-and-phone-and-papers pile unless it is one compact physical scene, no big product close-up, no tags scattered everywhere.
Anti-copy negative for standard mode: no direct master replica, no topic-swap remake of the selected example, no same phone + paper slips + Xiaohei shield + hourglass arrangement, no same laptop + cards + pull-lines arrangement, no same magnifier + paper stack + stamp arrangement, no same badge + correction tape arrangement, no same sieve + resume stack arrangement.

Negative for long-scroll mode: no UI screenshot, no phone chat interface, no code editor screenshot, no unrequested app logo, no unrequested company logo, no dense text blocks, no separate cards, no boxed timeline, no numbered circles, no step numbers, no milestone numbers, no visible sequence badges, no PPT infographic, no formal flowchart, no business dashboard, no cute mascot, no children's cartoon, no dark cyberpunk, no dirty grey background, no warm yellow background, no heavy vignette, no poster gradient, no paper texture, no pasted rectangular image, no multi-image collage.
```

## Local Edit Prompts

Remove incorrect text:

```text
Edit the provided image. Remove only the incorrect handwritten text "{incorrect text}" and its underline. Replace it with clean white background matching the surrounding area. Preserve all real objects, Xiaohei, shadows, accents, composition, and image quality.
```

Reduce complexity:

```text
Regenerate the image with the same core metaphor, but reduce visual complexity. Keep one main real object, one Xiaohei action, at most 3 short labels, 1-2 small props, and sparse color accents. Preserve medium scene coverage and airy spacing.
```

Fix Xiaohei:

```text
Keep the scene and objects similar, but adjust Xiaohei only: make it a recognizable black solid Xiaohei with tiny white dot eyes, thin limbs, blank serious expression, and a slightly irregular bean/capsule body. It can be subtly fatter or thinner for the action, but must not become a cute mascot.
```
