<div align="center">

# Working Memory Inbox

**Throw the thought down, and keep your head clear.**

Some ideas are ready to start the moment they arrive. Others need time to ripen.

</div>

---

Drop an idea in a single line. What you can start now stays in front of you; what
isn't ripe yet is set aside — and while you're not looking, the AI quietly does the
legwork so it's ready when the time comes. Deciding what to actually do is always yours.

## Getting Started

```bash
# backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000

# frontend
cd frontend && npm ci && npm run dev    # http://localhost:5173
```

Open `http://localhost:5173`, then jot down whatever just crossed your mind.
Azure deployment is covered in [docs/architecture.md](docs/architecture.md).

## How It Works

1. **Throw** — write a passing thought in one line.
2. **Set aside** — if it's ready to start, it stays as a **To Do**; if it's still
   half-formed, it rests in the **Dump** instead of crowding your head.
3. **Prepare, quietly** — behind the scenes, the AI gathers the missing materials and
   options, so a set-aside idea keeps ripening without you tending it.
4. **Offer** — when a quiet evening comes around, it brings back exactly one — already
   prepped — and asks: "Want to try this?"

There are only two screens. **Capture** holds one idea line plus today's state
(mood · evening availability · todos). **Inbox** unrolls this week's suggestion →
what you can start now → the dump, in a single scroll. The final decision button is
always in human hands — the AI never says "do this," it only lays out materials you
can choose from.

Built with React · FastAPI · Azure OpenAI. How the Copilot SDK is used and the
deployment architecture live in [docs/architecture.md](docs/architecture.md); the
rest of the design and the API contract live in [docs/](docs).

## Roadmap

- Rank the weekly suggestion by interest-embedding similarity as the dump grows
- Enrich research output with richer materials and links
- Public deployment on Azure App Service

## Background Story

As productivity grows, so does the pile of things to do — yet the working memory a
person can hold at once is still just 5±2 slots. The moment you stack "I'll get to it
later" ideas in your head, you lose one of those slots. But hand everything to the AI,
and the very capacity to plan, judge, and synthesize withers along with it.

> **Why a handful?** Cognitive research has long held that working memory holds only a
> few items at once. George Miller's classic estimate was 7±2
> ([Miller, 1956](https://psychclassics.yorku.ca/Miller/)); later work narrowed it to
> about 4, roughly 3–5
> ([Cowan, 2001](https://doi.org/10.1017/S0140525X01003922)). Either way, the ceiling
> is small — which is exactly the slot this app tries to protect.

So this app draws a line. The AI carries the burdensome research and tidying, but never
touches the part that is yours: deciding what to do and when. It empties your working
memory while preserving your capacity — and slips you just one thing only when your
load has eased.
