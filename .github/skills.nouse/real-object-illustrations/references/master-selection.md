# Master Selection and Interception Protocol

This file addresses two critical risks:

- Element listing: the model treats topic keywords, objects, and labels as a checklist and piles them into the scene.
- Master replication: the model treats a high-quality example as a traceable template and directly copies its spatial topology — phone, note, barrier, hourglass, etc.

The correct approach is to first select an example as a **quality anchor**, then extract its abstract invariants, and finally write out what must be varied for the current content. The master is not a copyable image, nor a spatial template; it only provides a quality benchmark and an action type.

## General Principles for Using Masters

Every use of a master must simultaneously satisfy:

- **Preserve invariants**: restrained proportions, negative space, realistic object texture, Xiaohei participating in the core action, labels few and precise.
- **Mandatory variation**: among the main object, spatial orientation, action relationship, prop combination, label position, viewpoint, or narrative focus, at least 3 items must differ from the master.
- **Readable before pretty**: without reading any caption, a viewer should be able to say within 3 seconds what Xiaohei is being "trapped by / blocked by / pulled by / reviewed by / filtered out by."

If the generated image looks at first glance like a reskinned version of some example, it counts as a failure, even if its background, labels, and Xiaohei are all correct.

## Standard Mode Master Index

### 01 meeting-pull-in

File:

```text
assets/examples/01-meeting-pull-in.png
```

Suitable for:

- Meetings, syncs, alignment, ad-hoc pull-ins, being called back right before leaving work.

Abstract skeleton:

- Multiple external requests apply pulling force from one side.
- Xiaohei is pulled toward a work entry point or task entry point.
- Lots of negative space, very few accessories.

Reusable relationships:

- "Tasks/meetings/messages" as the source of cards.
- Xiaohei is pulled into the main object or the work scene.
- Labels are near the source; don't plaster text on every object.

Failure signals:

- Directly copying the "left card + center Xiaohei + right computer" topology.
- The computer is too big, turning it into a product shot.
- Too many lines, like a spider web.
- Too many notes, like a feed-aggregation collage.

### 02 message-overload

File:

```text
assets/examples/02-message-overload.png
```

Suitable for:

- Message overload, tasks gushing out, "read" not equaling "done," nagging/urging.

Abstract skeleton:

- A real object acts as an "outlet / gushing point / source."
- Xiaohei is blocking, pushing, catching, pressing down, or organizing the stuff pouring out.
- The image conveys "too much is coming out, and the person can't hold it back."

Reusable relationships:

- The main object is an "outlet," not an information display screen; the outlet need not be a phone.
- Xiaohei must block, push, catch, or organize — not stand and watch.
- Labels only call out 2-4 real phrases.

Failure signals:

- Directly copying the "left phone + center note + right Xiaohei barrier + hourglass" topology.
- The current content is not about messages or phone experience, yet still forces in a phone.
- A chat UI or screenshot appears.
- The note text is too long.
- The main object is oversized, making the image look like a phone ad.

### 03 production-alert

File:

```text
assets/examples/03-production-alert.png
```

Suitable for:

- Alerts, rework, knots/tangles, problems flowing back, edge cases, being dragged back after a failed clock-out.

Abstract skeleton:

- A real long-strip object or path forms a snag, knot, backflow, or entanglement.
- Xiaohei's action is concentrated on the snag point.
- The image conveys "it was supposed to flow through, but it got stuck / came back here."

Reusable relationships:

- The cable is the physical path of the conflict.
- Xiaohei's action is concentrated on the "knot."
- Labels stay close to the problem point; don't draw out the whole process.

Failure signals:

- Directly copying the "cable running across + central knot + right Xiaohei" topology.
- The cable becomes a decorative curve with no mechanical relationship to Xiaohei.
- Labels scattered too far away, looking like poster annotations.
- Too many accessories, diluting the core "knot" scene.

### 04 code-review-rework

File:

```text
assets/examples/04-code-review-rework.png
```

Suitable for:

- Review, proofreading, double-checking, rework, acceptance, who covers the gaps.

Abstract skeleton:

- A real inspection tool locally magnifies, presses down, or frames the content.
- Xiaohei performs fixing, checking, editing, stamping, or circling within the inspection area.
- The image conveys "it looks done on the surface, but it still has to be reviewed / backstopped."

Reusable relationships:

- The magnifying glass is the physical tool for "being reviewed / needing another look."
- Xiaohei must form a clear relationship between being inspected and inspecting others.
- Labels should read like review comments, not process names.

Failure signals:

- Directly copying the "central paper stack + big magnifying glass + right red stamp" topology.
- The magnifying glass is too big, making the subject a single-object close-up.
- Xiaohei just stands inside the lens without doing any action.
- The paper stack is too full, like a collage of office stock material.

### 05 ai-automation-badge

File:

```text
assets/examples/05-ai-automation-badge.png
```

Suitable for:

- AI does it first and humans backstop, role restructuring, automation pulling things along, identity being relabeled.

Abstract skeleton:

- A real label, ID badge, or paper strip is redefining something.
- Xiaohei uses its body to stop, pull back, tear open, or hold down this label change.
- The image conveys "the system gave a new name, but the person still bears the consequences."

Reusable relationships:

- The label/paper strip represents the new definition the system imposes on the person.
- Xiaohei is in a tug-of-war with the lanyard/label.
- The subject spreads horizontally, with very few accessories.

Failure signals:

- Directly copying the "left Xiaohei + center work badge + right correction tape" topology.
- Making it an AI tool ad or a robot picture.
- Writing too many concept words like "automation / role / restructuring."
- Xiaohei stands off to the side, with no way to tell it is resisting or backstopping.

### 06 ai-resume-filter

File:

```text
assets/examples/06-ai-resume-filter.png
```

Suitable for:

- Screening, filtering, keywords, user tiering, opportunities being filtered out.

Abstract skeleton:

- A real filtering tool creates an entry and an exit.
- Xiaohei makes contact with the item being filtered: pushing it in, catching it, rescuing it, or getting it stuck.
- The image conveys "before being truly seen, it gets filtered out by the rules first."

Reusable relationships:

- The filter is the main object; all other elements serve "being filtered."
- Xiaohei's action must make contact with the card or the sieve mesh.
- Color provides only a few small rhythmic accents.

Failure signals:

- Directly copying the "central sieve + paper stack below + left Xiaohei handing over paper" topology.
- Adding more main objects beyond the sieve.
- Drawing it as a flowchart or a recruitment-system UI.
- Over-explaining labels, losing the emotional-button feel.

## Mandatory Master Lock-in Fields

Before generating each standard-mode image, you must write out:

```text
Master:
Extracted invariants:
Variation points for the current content:
3-second readability sentence for the image:
Fit to the current content:
Failure signals to avoid:
```

If these four items can't be stated clearly, don't generate — rewrite the shot list first.

Write at least 3 variation points, for example:

- Swap out the main object category.
- Change the left/right/center spatial relationship.
- Change Xiaohei's action, no longer doing the same push/pull/block.
- Remove the master's signature accessory.
- Change how the labels appear.
- Change the viewpoint or the object's pose.

## Output Interception Rules

The first image generated is always only a candidate, not the deliverable. It must be visually compared against the chosen master:

- Is the subject's proportion close to the master, rather than a product close-up or a thumbnail trinket.
- Is the negative space close to the master, rather than elements filling everything.
- Do the real objects look like they come from the same studio photo.
- Does Xiaohei carry out a master-level physical action.
- Do the labels read like emotional buttons, rather than concept explanations.
- Has "topic element listing" appeared: piling on computer, phone, note, line, and title all at once.
- Has "master replication" appeared: subject, orientation, accessories, Xiaohei's action, and label positions all looking like the old example with the words swapped.
- Is it readable in 3 seconds: without explanation, can the viewer state the conflict in the image.

Whenever "element listing," "master replication," "doesn't look like a master body-text illustration," or "can't understand the conflict" appears, you must rewrite the prompt and regenerate; it must not be delivered as the final image.
