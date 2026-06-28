# App Design / Visual Proposal

> Direction change (2026-06-20): the "polished" visuals — custom warm-neutral palette + working
> memory meter — are **too time-consuming** and scrapped. Instead, go with **big-tech default style**
> (shadcn/ui `neutral` default = Vercel/v0/Linear look). Zero custom theming,
> use components as-is, and **spend time on features**.

Single user, 3 fixed screens. Express the concept (reduce working memory load)
**only through layout restraint** — do not decorate with color or animation.

## Principles (Big-Tech Minimal)

| Aspect | Choice | Reason |
|---|---|---|
| Theme | shadcn `neutral` **default as-is** (light) | Zero custom hex injection/tuning time. Already "big-tech look" |
| Color | Neutral gray/white + 1 accent only (primary) | Reduces decision load. Semantic color only when meaningful (destructive=red) |
| Typography | System font stack (or 1 typeface Geist/Inter) | Clean without extra installation. Minimize size steps |
| Spacing | 8px grid (`gap-4`/`p-6`), body width ~640px container | Looks organized with alignment alone |
| Components | shadcn `Card`/`Button`/`Textarea`/`Badge`/`Skeleton` | Copy-paste → use without touching |

Rule: **do not decorate.** No gradients, excessive shadows, custom colors. Alignment, whitespace, and
typographic hierarchy only.

### Color (use shadcn neutral default tokens — no direct hex)

- `background` / `card` / `border` / `muted-foreground` / `foreground` — tokens as-is.
- `primary` = default black button (1 for primary action).
- Status badges: parked/waiting use `secondary` (gray badge), destructive/delete only uses `destructive` (red).
- Verdict distinction also via text+gray badge. **Do not create a separate color palette.**

## Per-Screen Layout (simple cards + lists)

### 1. Inbox / Capture

```text
+--------------------------------------------+
|  Ideas                          [ Dump ▸ ]  |  <- thin top bar (text link)
+--------------------------------------------+
|   What's on your mind?                      |
|   +----------------------------------+      |
|   |  type an idea…                   |      |  <- Textarea
|   +----------------------------------+      |
|                          [ Drop it ]        |  <- primary button
|   -- verdict --------------------------     |
|   | Actionable now      ·  [keep] [dump]|   |  <- gray divider + text
+--------------------------------------------+
```

- Input → "Drop it" → verdict appears below via **token streaming** (keep: SDK "alive" signal).
- Loading: button `Thinking…` disabled + Textarea readonly. No spinner/shimmer.
- Error: small gray banner below input *"Judgment failed — draft saved. Retry?"* (capture not blocked).
- No auto-classification. User selects `keep`/`dump` (built-in human approval).

### 2. Dump List (parked + pre-research)

```text
+--------------------------------------------+
|  Dump · 12 parked                           |
+--------------------------------------------+
| ▸ Rewrite onboarding email      [parked]    |  <- Card + gray Badge
|     AI notes: found 3 templates… (stream)   |
| ▸ Try local-first sync lib    [researching] |
+--------------------------------------------+
```

- Single scroll, collapsible Cards. Collapsed=title+gray badge, expanded=AI notes.
- List loading: 3 `Skeleton` cards.
- Per-item errors isolated inside that card as *"Research paused. Resume?"*

### 3. Suggestion Panel (worth doing now?)

```text
+--------------------------------------------+
|  Worth doing now?                           |
+--------------------------------------------+
|   +----------------------------------+      |
|   |  Rewrite onboarding email        |      |
|   |  Why now: low effort, unblocks…  |      |  <- rationale streaming
|   |        [ Not now ]  [ Let's do it ]|    |  <- human approval
|   +----------------------------------+      |
|            1 of 3                            |
+--------------------------------------------+
```

- 1 large Card + "1 of 3" text pager (no dot/swipe animation).
- `Let's do it` (primary) → move to desk. `Not now` → next.
- Empty state: *"No suggestions right now."* (plain, no animated dots or decoration).

## Build Stack (unchanged — faster now)

**Tailwind + shadcn/ui, `neutral` default theme as-is.**

1. `Vite + React + Tailwind` base.
2. `npx shadcn@latest init` → **base color `neutral`, no palette customization.**
3. `npx shadcn@latest add card button textarea badge skeleton`.

Avoid: custom hex theming, working memory meter, swipe decks, gradient empty states — **all cut.**

## Kept "Wow" Points (2 only — low cost, high impact)

1. **Token streaming** — all verdicts/rationale. Reads as "live AI," shows SDK depth (25% score).
2. **One at a time** suggestion card — human-paced decision (responsible AI, 6% score).

> Meter, color semantics, swipe, etc. are **cut**. Review last only if time remains.

## Illustration Accent — Xiaohei (小黑) DNA

To prevent the "plainness" of big-tech minimal from feeling blank, add **one spot** (primarily
empty state/hero) of Xiaohei line art. Source: [.github/skills.nouse/flat-black-and-white-illustrations](../../.github/skills.nouse/flat-black-and-white-illustrations/references/style-dna.md).
Does not conflict with shadcn neutral — **both share white background + restraint + whitespace** DNA.

**Style rules (follow exactly):**

- Pure white background. No off-white, gradients, shadows, textures, vintage paper.
- Black hand-drawn line art (thin, slightly wobbly lines — not vector or thick outlines).
- Generous whitespace (subject 40-60%, empty space ≥35%), handwritten annotations 5-8, each 2-6 words.
- 1 image = 1 core action/structure/state/metaphor. Do not write structure type names on screen.

**Color: extreme restraint (line art is black, accent only):**

| Color | Usage | App mapping |
|---|---|---|
| Black | Line art · characters · structure · body | Default |
| Orange | Flow · paths · automation A→B | Capture→judgment→dump→suggestion handoff |
| Red | Key annotations · problems · warnings · results | Error banners, "blocked" warnings |
| Blue | Internal/system state · AI hints | AI verdict · pre-research ("AI is researching") |

**Xiaohei = subject of the work (not decoration).** Black bean shape + white dot eyes, expressionless
but slightly quirky "system operator." If removing it leaves the metaphor intact, it's too decorative → redraw.

**Spots to use in our app (2-3 panels, 1 is enough):**

- Empty dump state: Xiaohei stares at an empty desk/hole — *"nothing on your plate."*
- Pre-research in progress: Xiaohei pulls wires to gather information sources (blue hint) — *"AI is digging."*
- Judgment gate: Xiaohei pulls a "judgment" lever inside a machine (orange flow) — hero/about.

Prohibited: cute mascots, children's illustrations, PPT infographics, formal flowcharts, complex backgrounds.
Under time pressure, **put in just the empty state panel** and stop (cut the rest).

## Scope & Budget (~40 min UI, shorter than before)

- [ ] (5m) shadcn init (neutral default) + max-width container + top bar shell
- [ ] (10m) Screen 1: Textarea + button + verdict card + streaming/loading/error
- [ ] (10m) Screen 2: Collapsible Card list + Skeleton + per-item errors
- [ ] (10m) Screen 3: Single suggestion Card + "1 of 3" + approve/reject
- [ ] (5m) Empty states + spacing/contrast final pass
- [ ] (optional, time permitting) Xiaohei empty state illustration (black-white line art SVG/PNG)

If falling behind, cut in order: Xiaohei illustration → screen 3 pager to text → screen 2 expand to static → streaming to single response.
