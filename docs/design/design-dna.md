# Tteoolim Design DNA — "Quiet Glass / Color Halftone"

> Created: 2026-06-21 · Target: v0.0.2 major UI overhaul
> Basis: initial concept [../ideation/README.md](../ideation/README.md) · references [../assets/](../assets)
> Linked to backlog stage 3 [../plan/reimplementation-backlog.md](../plan/reimplementation-backlog.md).
> Redesign screen mockup: [./ui-redesign-ascii.md](./ui-redesign-ascii.md)

This document defines not **what to make pretty**, but **how to translate the initial idea
(reduce working memory load) into a visual language**. Every visual decision must derive from
the concept.

---

## 1. One-Sentence Definition

> **"A tool that empties the mind must have an empty screen."**
> Tteoolim holds thoughts that surface on *Quiet Glass*. The AI's pre-research quietly
> lives on a *Color Halftone* layer behind the glass, and the human makes **one decision**
> at a time.

---

## 2. Concept → Visual Translation (Core)

Five propositions from the initial concept mapped 1:1 to visual rules. **This table is the
body of the DNA.**

| Initial Concept Proposition | Visual Translation (DNA Rule) |
|---|---|
| "Up to five items in working memory at once" | **5-slot gauge** — always show the count of items currently in focus. The 6th item fades and is pushed to the dump automatically. *Focus elements per screen ≤ 5* |
| "Everything else is stored in the dump" | Dump is a **semi-transparent layer behind the glass** — present but not drawing the eye (low brightness · blur · small type) |
| "AI pre-researches on its own" | Pre-research progress is a **slow-breathing Color Halftone orb** animation + token streaming. Spinners prohibited |
| "Human does the planning, integration, decision" | **Single decision card** — strong typographic hierarchy + two clear buttons (`Let's try` / `Later`). One at a time |
| "Suggest at the right time when load is low" | **Convey timing through mood (atmosphere)** — dawn pastel gradient background, unrushed whitespace, soft motion |

> Rule violation = concept violation. Adding elements because they look nice increases working memory load.

---

## 3. Moodboard — Reference Asset Analysis

The images in [../assets/](../assets) were read in two categories.

### 3.1 UI Structure References (direct adoption)

- **`2026-06-21 20.58.05.png` — Liquid Glass Card**
  Frosted semi-transparent card, rounded corners, inset top highlight, soft outer glow,
  inline buttons/sliders/large action button inside the card. → **Our card/input/button surface language.**
- **`20260621_203241.jpg` — Minimal White Card (strong typography)**
  Lowercase-caps eyebrow label → large bold title → sparkline → `match` pill badge →
  tag row → description paragraph → 2 action buttons (filled 1 + dark 1). Halftone dot background.
  → **Information hierarchy template for the single decision card.**

### 3.2 Mood / Palette References (atmosphere borrowing)

- Saturn in pastel sky + flower field (`20260621_202425.jpg`) → **Dawn-light gradient background.**
- Overlapping semi-transparent colored circles (`20260621_170126.jpg`) → **Color Halftone orbs** (multiply blend).
- Dithered serif typography (`20260617_204932.jpg`) → **Serif display accent + fine grain.**
- Vintage geometric trademark (`HLHIq43...jpeg`) → **Simple, geometric icon tone.**

---

## 4. Design Tokens

### 4.1 Background (Atmosphere)

```text
Layer 0  Dawn-light pastel gradient (peach → lilac → mist)
Layer 1  Color Halftone orbs 2-3, large semi-transparent circles, multiply, slow float
Layer 2  Fine dither/grain (opacity ~4%) — removes digital flatness
Layer 3  Content (glass cards)
```

- Default tone: considering a switch from dark to **airy** (light). However, existing dark glass
  assets remain valid — light/dark decision required in §6.

### 4.2 Surface (Glass)

| Token | Value (proposed) | Usage |
|---|---|---|
| `--glass-fill` | `rgba(255,255,255,0.08)` | Card/input background |
| `--glass-border` | `rgba(255,255,255,0.40)` | 1px border |
| `--glass-hi` | `inset 0 1px 0 rgba(255,255,255,0.30)` | Top inset highlight |
| `--glass-glow` | `0 12px 44px -16px rgba(0,0,0,0.25)` | Soft outer glow |
| `--blur` | `backdrop-blur-md` (12px) | Frosted effect |
| radius | card `20px`, badge/button `pill` | Rounded glass |

### 4.3 Color (restraint + semantic color)

- **Neutral glass base** + **1 accent** (brand red `#e8252a` retained) + **semantic colors only**:
  - Ready/success `#02d95c`, destructive/danger `#e8252a`.
- Halftone orb palette (background only, not content color): low-saturation cyan, magenta, yellow.
- Prohibited: gradient text, 5+ colors simultaneously, meaningless color emphasis.

### 4.4 Typography

| Role | Font/Style |
|---|---|
| Body / UI | Pretendard Variable (keep current) |
| Eyebrow label | 11px, `uppercase`, `tracking-widest`, low brightness |
| Focus title | 28-36px, `font-extrabold`, `tracking-tight` |
| Display accent | 1 serif typeface (hero/empty states only, use sparingly) |

### 4.5 Motion

- **Token streaming** = live AI signal (keep, core "wow").
- Halftone orb **slow float** (20-30s), card **soft fade/rise**.
- Prohibited: spinners, bouncy animations, swipe decks.

---

## 5. Component DNA (203241 Card Template)

The single decision card always follows this hierarchy:

```text
eyebrow label (lowercase caps, tracking)        <- context: "this week · AI pick"
focus title (large bold)                         <- idea in one line
[ match 88% ]  <- pill badge                    <- interest relevance (next to sparkline)
#low-load  #pre-researched  #interest-relevant  <- rationale tags (pills)
description paragraph (low brightness, 2-3 lines) <- AI one-line summary
[ Let's try ]   [ Later ]                       <- action: filled primary + glass secondary
```

- Input/buttons/badges all share **glass surface language** (§4.2).
- The 5-slot working memory gauge lives in the top bar or inbox header.

---

## 6. Open Decisions (must be resolved before starting the overhaul)

1. **Light vs Dark** — assets mix light (203241) + vivid glass (glass card). Current is dark glass.
   Switch to dawn-light airy (light) or keep dark?
2. **Accent color** — retain brand red vs add a cool-tone secondary accent to match pastel mood.
3. **Serif accent scope** — hero/empty state only vs all titles.
4. **Background intensity** — vivid image (butterfly/saturn) vs restrained pastel gradient
   (latter recommended per working memory protection principle).

> All four are reflected as assumptions in [./ui-redesign-ascii.md](./ui-redesign-ascii.md).
> Finalize in tokens and code after agreement.

---

## 7. DNA Checklist (ask when implementing)

- [ ] Does this screen have 5 or fewer focus elements?
- [ ] Is there only one decision the user makes on this screen?
- [ ] Is the dump/pre-research on a back layer that doesn't draw the eye?
- [ ] Does any added decoration undermine the concept (load reduction)?
- [ ] Is color limited to 1 accent + semantic colors only?
- [ ] Is AI progress expressed via token streaming / breathing orb (no spinner)?
