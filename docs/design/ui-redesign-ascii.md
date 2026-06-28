# Tteoolim Redesign Demo — ASCII Mockup (v0.0.2)

> Created: 2026-06-21 · Based on Design DNA [./design-dna.md](./design-dna.md)
> Initial concept [../ideation/README.md](../ideation/README.md) · missing ideas restored
> [../plan/reimplementation-backlog.md](../plan/reimplementation-backlog.md) (stage 1) applied.

This document shows **information hierarchy and flow**, not pixels. Color, blur, and glow
are applied as glass surface (DNA §4.2), but in ASCII they are represented only as
`▒` (semi-transparent glass), `◍` (halftone orb), `▓` (filled button).

```text
Legend
  ▒▒▒  glass card surface (frosted · semi-transparent)   ◍   color halftone orb (background)
  ▓▓▓  primary filled button                              ░   dump (back layer, low brightness)
  ●●●○○ 5-slot working memory gauge (filled/empty)         ~   token streaming (live AI)
```

---

## 0. Common Shell — Background + Top Bar + 5-Slot Gauge

Shared across all screens. The background shows dawn-light gradient + floating halftone orbs;
the top bar always shows the **5-slot working memory gauge** (restoring initial concept "max five,"
backlog 1.1).

```text
   ◍                                                  ◍
        ╔══════════════════════════════════════════════╗
        ║  Tteoolim                       ● ● ● ○ ○  3/5 ║  ← 5-slot gauge always present
        ║  ─ Capture ── Recommend·Inbox ── Settings ─    ║
        ╚══════════════════════════════════════════════╝
              ◍                              ◍
```

- Gauge `● ● ● ○ ○` = 3 items currently in focus. **Adding a 6th** causes the oldest item
  to fade and be pushed to the dump (visual enforcement, DNA §2).

---

## 1. Capture — "Empty the Mind in One Line"

```text
        ╔══════════════════════════════════════════════╗
        ║  Tteoolim                       ● ● ● ○ ○  3/5 ║
        ╚══════════════════════════════════════════════╝

          One thought, surfacing now.                 ← serif display accent
          Drop it and clear your head.

        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒  what's on your mind…                          ▒  ← glass input
        ▒                                                ▒
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ [ Drop it ▓ ]

        ─ AI judgment ───────────────────────────────────
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒  ✅ Ready to start — moving to inbox              ▒
        ▒  "Rewrite the onboarding email"                  ▒
        ▒  ~ finding 3 related templates…                  ▒  ← token streaming
        ▒                              [ View inbox → ]    ▒
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
```

Judgment branches (only the card header changes):

```text
  ✅ Ready to start — inbox             (gauge ○ fills one slot)
  🔎 More info needed — dump (research)  ◍ orb breathes, AI research begins
  🌙 Not enough capacity now — dump      ░ quietly moves to back layer
```

> Change: the "today's state (mood · evening · tasks)" block is removed from the Capture screen
> and **moved to Settings/Inbox header** (reduces focus elements on Capture, protects working memory, DNA §7).

---

## 2. Inbox — "One Decision at a Time"

Top = single decision card (203241 template), middle = 5-slot inbox, bottom = dump (back layer).

```text
        ╔══════════════════════════════════════════════╗
        ║  Tteoolim                       ● ● ● ○ ○  3/5 ║
        ╚══════════════════════════════════════════════╝
        ▒ Current status | ☀️ clear · ✅ evening free       ▒  ← load gate summary

        ── this week · AI pick ───────────────────────────   ← eyebrow label
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒  THIS WEEK · AI PICK                           ▒
        ▒                                                ▒
        ▒  Rewrite the onboarding email    [ match 88% ] ▒  ← focus title + pill
        ▒  ▁▂▃▅▇  interest relevance ↑                   ▒  ← sparkline
        ▒                                                ▒
        ▒  #low-load  #pre-researched  #interest-relevant▒  ← rationale tags (pills)
        ▒  ~ overlaps last week's note — timing is right. ▒  ← AI one-line (streaming)
        ▒                                                ▒
        ▒      [ Let's try ▓ ]      [ Later ]            ▒  ← 2 decisions (human)
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
                                              1 / 3         ← one at a time

        ── currently in focus ──────────────  ● ● ● ○ ○
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒  • Rewrite the onboarding email          [ × ] ▒
        ▒  • Review local-first sync library        [ × ] ▒
        ▒  • Clean up API response caching          [ × ] ▒
        ▒  ○ ○  (2 slots free — room for more)            ▒
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

        ░ Dump · 12 parked ─────────────────────────── ░  ← back layer (low brightness)
        ░  ▸ Newsletter automation      [research done] ░
        ░     ◍ AI notes: comparing 3 tools… (expand)   ░
        ░  ▸ Presentation template overhaul [low capacity] ░
        ░  ▸ Side project retrospective   ◍ researching ~ ░
```

Core flow:

- **Decision card is always 1** → processing it moves to next (`1/3 → 2/3`) with a breath (working memory pacing).
- Inbox has a **5-slot cap** → when full, `Let's try` on a new suggestion is locked with "free a slot" guidance.
- Dump is gray and small → when AI pre-research completes, only `[research done]` badge quietly lights up.

---

## 3. Settings — "Right Timing + Today's State"

Load gate (mood · evening) + weekly trigger in one place. Unrushed whitespace.

```text
        ╔══════════════════════════════════════════════╗
        ║  Tteoolim                       ● ● ● ○ ○  3/5 ║
        ╚══════════════════════════════════════════════╝

        ── today's state ────────────────────────────────
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒  Mood    [ 😶 foggy ] [ 🌊 calm ] [ ☀️ clear ▓ ] ▒
        ▒  Evening [ ✅ free ▓ ]   (off = have plans)      ▒
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

        ── weekly suggestion time ───────────────────────
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
        ▒   [ Friday ▾ ]   [ 18:30 ]                       ▒
        ▒   ◍ recommended: after work + 20-30 min buffer   ▒
        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
```

- Load gate (`evening free & mood ≠ foggy`) must be satisfied for inbox suggestions to activate (backlog 1.5).
- Weekly trigger = user config for the actual scheduled batch (linked to backlog 1.3).

---

## 4. Demo Flow (1-minute script)

```text
[Capture]  enter "Rewrite the onboarding email" → Drop it
           → ✅ judgment + ~ token streaming, gauge ○ fills one slot
[Capture]  enter "Newsletter automation" → 🔎 more info needed → to dump,
           ◍ orb breathes, AI pre-research starts automatically
[Inbox]    single suggestion card 1/3 → confirm #research-done tag → [Let's try]
           → breaths to next suggestion 2/3
[Inbox]    5 slots full → adding 6th causes oldest item to fade ░ to dump
[Settings] mood ☀️ + evening ✅ → load gate satisfied → suggestions activated
```

> This demo exposes all four pillars of the initial concept in one flow:
> working memory protection · automatic pre-research · human decision · right timing.

---

## 5. Change Summary vs Current

| Area | Current (v0.0.1 dark glass) | Redesign (v0.0.2 Quiet Glass) |
|---|---|---|
| Background | Dark + bg.jpg overlay | Dawn-light pastel + halftone orbs + grain |
| Working memory | No UX enforcement (unlimited) | **5-slot gauge always present + 6th auto-dump** |
| Capture screen | Input + today's state mixed | Input + judgment only (narrowed focus), state to Settings |
| Suggestion card | 3-line rationale list | **203241 template**: eyebrow · title · match · tags · action |
| Dump | Same brightness as inbox | **Back layer** (low brightness · small) |
| Pre-research | Text progress | ◍ breathing orb + token streaming |
| Color | White/red | Glass neutral + 1 accent + semantic (green/red) |

> 4 unresolved decisions (light/dark, accent color, serif scope, background intensity):
> see [./design-dna.md](./design-dna.md) §6. Finalize in tokens/code after agreement.
