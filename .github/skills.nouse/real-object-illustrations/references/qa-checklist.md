# QA Checklist

## Must-Pass Items

- Before generating in standard mode, you have already locked onto one of the master templates 01-06, and explained the invariants extracted, at least 3 variation points for the current content, the 3-second readability sentence, and the failure signals to avoid.
- Standard mode is 16:9 landscape; Easter-egg mode is an ultra-wide long scroll, close to `2.6:1` to `3:1`.
- Standard mode background is pure white, clean, textureless, close to `#FFFFFF`.
- Easter-egg mode background is a refined near-white, close to `#FAFAF8` / `#FBFBFA`, with an extremely faint studio air feel, but it must not be dirty gray, warm yellow, beige, vignetted, or a poster gradient.
- Negative space must be clean, with no dirty gray, vignetting, heavy gradients, or paper texture.
- Real objects look like they were all shot in the same white studio.
- Only a very light contact shadow is allowed beneath the objects; it must not tint the entire background gray.
- No rectangular screenshot borders, image seams, UI screenshots, unrequested logos, or personal information that was not provided.
- Xiaohei is present.
- Xiaohei carries the core physical action; it is not decoration.
- The standard-mode image has only one core scene; Easter-egg mode is one continuous long-scroll storyline.
- Standard mode has 2-4 short labels (English or Korean, per the user's request); Easter-egg mode has 1-3 lines of short annotation per node. All text must be readable, accurate, and feel like real context.
- Easter-egg mode has no node numbers, numbered dots, step numbers, or obvious timeline markers.
- Accent colors are few and refined, not stealing focus from the subject.
- Standard mode scene coverage is close to the 16:9 master: medium coverage, with air between objects.
- Easter-egg mode node density is close to the long-scroll master: a continuous route, nodes with naturally irregular rises and falls, opening and closing on the left and right, loose overall rather than cramped.
- Easter-egg mode nodes are not equidistant; the route must not look like a regular sine wave, nor mechanically alternate high and low.
- Easter-egg mode node text reads like handwritten annotation written directly into the blank space; it must not rely mainly on sticky notes, paper slips, cards, or label boxes to carry the text.
- Overall quality must reach master level: proportion, negative space, real-object texture, Xiaohei's character, short-label density, and accent-color rhythm must all align.
- No mechanical copying of the example images; even if a master action type is used, the objects, action, labels, relationships, accessories, or angle have already been adapted to the current content.
- No element-listing: you must not pile every computer, phone, paper slip, line, title, and accessory you can think of from the theme into the image.
- No master replication: you must not take the master's main object, left-right relationship, Xiaohei action, signature accessory, and label position and simply swap the text.
- The image must be readable in 3 seconds; the reader can state the core physical conflict without reading the captions.
- Easter-egg mode must be a real-object life-line like `07-long-scroll-story-master.png`: a starting point on the left, a winding route, 5-8 nodes, Xiaohei participating segment by segment, and a resolution on the right.

## Post-Generation Master Comparison

The first generated image counts only as a candidate, not a deliverable. Before delivery you must view the candidate image alongside the chosen master and judge item by item:

- Whether the candidate's subject size is close to the master, rather than a product close-up.
- Whether the candidate's negative space is close to the master, rather than a full-bleed pile of elements.
- Whether the candidate has only one core physical conflict.
- Whether the candidate's Xiaohei action is as clear and mechanically grounded as the master's.
- Whether the candidate's real objects are unified, or look like a collage of stock assets.
- Whether the candidate's labels are few, short, and read like real phrasing.
- Whether the candidate merely "contains the objects in the prompt" but fails to form a master-level scene.
- Whether the candidate looks like a reskin of the chosen master.
- Whether the candidate looks heavy because the subject is too large, a dark object is too dominant, or there is insufficient negative space.
- Whether the candidate is readable in 3 seconds.

If any item clearly fails, it cannot be delivered as the final image; you must rewrite the prompt or regenerate.

## Failure Signals

If any of the following occur, regenerate or do a local edit:

- Subject too large, like a product hero shot or poster close-up.
- Subject too small, like a thumbnail or figurine, with insufficient information.
- Objects crammed into a clump, with too much visual weight.
- Element-listing: multiple objects corresponding to the theme words are all included, but none has a clear action.
- Master replication: composition, objects, Xiaohei action, and accessories look like an old case with the text swapped.
- Unreadable: you need the theme explained to know what the image is saying.
- Real objects have a screenshot feel, sticker feel, or crop boundaries.
- Standard-mode background is not pure white, but gray-white, warm-white, off-white, vignetted, or gradient.
- Easter-egg mode background turns dead white, causing objects to float, or turns dirty gray / warm yellow / vignetted, making the image look cheap.
- Xiaohei turns into a meme, mascot, or children's cartoon.
- Xiaohei just stands by and watches.
- Too many or too long labels, typos, garbled or fake text, or unreadable text.
- The image looks like a PowerPoint, flowchart, course slide, or commercial poster.
- An office background, night scene, tech UI, robot, or cyber style appears.
- Treating `assets/examples/` as a fixed formula, causing every image to look like an old case.
- Treating `assets/examples/` as an object-exclusion rule, causing user content that clearly suits a certain master composition to be forcibly swapped into an inaccurate expression.
- Easter-egg mode lacks a continuous long-scroll storyline: no shared path, rhythm of rises and falls, or right-side resolution between nodes.
- Easter-egg mode shows yellow numbered dots, step numbers, or milestone sequence numbers, making the image look like an infographic.
- Easter-egg mode nodes arranged in a flat horizontal line, objects clustered into a clump, with unbalanced visual center of gravity, lacking the up-and-down undulation and negative-space rhythm of the master.
- Easter-egg mode route is too regular, like an algorithmic waveform or decorative curve; nodes arranged equidistantly and alternating high and low, making the image rigid.
- Easter-egg mode writes the text for every segment on a sticky note, paper slip, card, or label box, making the image look like a process explanation rather than a long-scroll story.
- Easter-egg mode copies Ian's personal experience, Dribbble, Muzli, Twitter/X, IBC, and other specific content when the user did not ask for an Ian self-introduction and did not provide equivalent facts.

## Proportion Self-Check

Ask yourself:

- Which master am I choosing right now? Does the candidate look at first glance like a sibling of it?
- Does the candidate look at first glance like a master reskin? If so, it fails outright.
- Does the scene have the master's kind of medium coverage area?
- Is it "covered enough, but not crammed"?
- Is there air between the objects?
- Is the real main object too huge or too close to the edge?
- Is a single dark object too large, too heavy, weighing down the image?
- Has Xiaohei undergone only subtle bodily changes, rather than turning into a different character?

## Information Density Self-Check

- Does standard mode have only 1 core physical action?
- Does standard mode have only 1 main object or one compact main-object group?
- Does standard mode have at most 1-2 small accessories?
- Does standard mode have only 1 Xiaohei action subject?
- Does standard mode have at most 4 short labels?
- Can standard mode be read in one sentence: what is trapping Xiaohei, and in what way?
- Does each Easter-egg mode node tell only one stage of memory?
- Has Easter-egg mode avoided writing the whole process as an instruction manual?
- Has Easter-egg mode completely avoided numbered nodes, relying only on the route and objects to express sequence?
- Does Easter-egg mode have clear but irregular up-and-down undulation, rather than one flat, plain horizontal line or sine wave?
- Do the Easter-egg mode node spacings vary in length, rather than being placed evenly?
- Does the Easter-egg mode text land directly in the blank space, rather than being wrapped in sticky notes, paper slips, cards, or label boxes?

## Originality Self-Check

The examples are high-quality template masters and a yardstick for output quality. Every time, you must answer:

- Which master was chosen? Why this one, and not the others?
- What invariants were extracted from the master?
- What are at least 3 variation points for the current content?
- What is the unique situation of the current article?
- Why does the real main object of the current image suit this situation?
- Does this physical action grow out of the body text?
- If a master action type was used, where has it already been adapted to the current content?
- Have you treated the master as a fixed formula or an object-exclusion rule?
- Have you treated the master as a composition to be traced?
- If it is Easter-egg mode: which nodes, objects, actions, and right-side conclusion come from the current content, rather than replicating `07-long-scroll-story-master.png`?

If the answers are vague, rewrite the shot list first, then generate.

## Iteration Method

- Too heavy: reduce the area of large black objects, widen the spacing between objects, delete small accessories.
- Too empty: keep the negative space, but make a clearer physical action occur between the main object and Xiaohei.
- Too messy: delete secondary paper slips, arrows, and labels, keeping only 3 short words.
- Too much like a PowerPoint: remove structural arrows, module boxes, and titles, switching to a real-object scene.
- Too much like a stock-asset collage: emphasize the same white studio, unified light and shadow, and soft shadows.
- Xiaohei is wrong: only adjust Xiaohei's body, not the overall scene proportions.
- Too much like an example: keep the template's effective skeleton, but rewrite the label context, and adjust the action, relationships, angle, or main-object details.
- Easter-egg long scroll too scattered: reduce nodes to 5-7, strengthen the continuity of a single route.
- Easter-egg long scroll too much like an infographic: remove module boxes, year labels, and structural arrows, switching to real-object nodes and handwritten life annotations.
- Easter-egg long scroll background too dead-white: switch to a refined near-white air feel, keeping only light contact shadows.
- Easter-egg long scroll background too dirty: raise the overall whiteness, remove vignetting, grayscale, and paper texture.

## Delivery Judgment

A qualified image should make the reader:

1. At first glance feel the image is clean, and a little strange.
2. At second glance understand the physical conflict between the real object and Xiaohei.
3. After seeing the short labels, resonate with or understand the point.

If at first glance it looks like a tutorial page, an ad image, a stock-asset collage, or an AI show-off image, it is not qualified.
