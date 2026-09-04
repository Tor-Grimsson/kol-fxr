# Playbook — Rulers & guides as a shipped component

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Get Figma/Photoshop rulers + drag-to-create guides out of `kol-component`'s
private `Canvas.jsx` internals and into exported components any stage can use —
the editor's pan/zoom viewport and the deck's CSS-zoom stage alike.

**Standing rules (non-negotiable):**
- Verify from the registry with a cache-busted fetch before installing anything. `npm view` lied twice on 2026-09-03.
- A green build is not verification. Measure in a browser.
- Nothing gets deleted. `_tmp/<date>-<what>/`.
- fxr holds no editor source — the code lives in kol-ds-ui. This repo files and verifies; it does not build the component.

## Scope

**In:** `niceStep` · `ticksFor` · `useFrameGeom` · `CanvasRuler` · `CanvasGuides`
— all five already inside `kol-component/src/organisms/Canvas.jsx` (lines 662–930ish),
all five module-private today.

**The two couplings to break, and only these two:**
1. `CANVAS_VIRTUAL_W` (module constant) → a `virtualWidth` prop.
2. `view` — passed to `useFrameGeom` purely as a re-measure trigger, never used in the
   math → a generic dep, or drop it for a ResizeObserver.

**Already a clean seam, keep as-is:** ruler dispatches `kol:guide-drag-start`
`{axis, clientX, clientY}`, guides layer listens. The two do not know each other.

**Out of scope:** `PanZoomViewport` itself, `AlignmentGrid`, snapping, the guide
persistence model (consumer's), rulers in anything but px.

## The finding that makes this cheap

`useFrameGeom` does NOT read the pan/zoom transform. It locates `[data-canvas-frame]`
and reads `getBoundingClientRect()` relative to the container — it measures the
RENDERED result, so letterbox, fit-scale and any transform are already folded in.
**Transform-agnostic. Works over a CSS-zoom stage untouched.**

I told kol-client-olina the opposite earlier today. Correcting that is step 1, before
they file a ticket on a premise that is wrong.

## Consumers on day one

- design-editor's viewport (already uses it, privately)
- kol-client-olina's deck — 1920×1080 CSS-zoom stage, currently no rulers or guides at all

---

## Entries

[22:05] · scope · kol-component/src/organisms/Canvas.jsx:662-930
  what → scoped the extraction; five private symbols, two couplings, one existing event seam
  why → deck session asked for guides; my first answer said "welded to the viewport" and was wrong
  note → nothing to extract from design-editor — it is all already in kol-component, just unexported
  verify → read the source, confirmed `useFrameGeom` measures the DOM rect, not the transform

[22:08] · T1 · → kol-client-olina
  what → sent the correction; geometry measures the DOM rect, their CSS-zoom stage is not a blocker
  note → they stood down from filing their own ticket; their user had already said he would raise it
  after → guides moved from "not doing" to "pending a version" in their plan

[22:09] · T2 · kol-ds-ui/lobby/inbox/rulers-and-guides-are-private.md
  what → spec written: export CanvasRuler + CanvasGuides, `virtualWidth` prop, drop `view` entirely
  why → `view` never enters the math AND is redundant — rAF settle-loop + ResizeObserver already catch every change
  note → deck confirmed 1920 and that a ResizeObserver suits them better than a synthesised `view`

[22:10] · T2 · browser measurement
  what → measured CSS `zoom: 0.5` vs `transform: scale(0.5)` on a 1920 element in a relative host
  before → ticket said "nobody has measured this"    after → both return width 960, pxPer 0.5000, no branch needed
  verify → measured ✓ — the ticket now carries zero unverified claims

[22:11] · T3 · both ledgers
  what → filed; kol-ds-ui queue 3 → 4 entries, fxr outbox stub + Filed-elsewhere row + history line
  note → no duplicate ticket: olina stood down in favour of this one

[23:29] · palette · _tmp/2026-09-03-terminal-palette/palette.md
  what → sampled the user's tmux screenshot; 2.46M px, 15,367 distinct, split neutrals by value and colours by hue family
  why → he wants the terminal's colours available in the fxr colour suite, and an accent candidate to replace yellow
  note → it is Gruvbox Dark; `#1D1F20` is 80% of the screen, `#EBDCB2` fg, `#928374` gray, `#83A598` aqua
  note → magenta + purple are nearly UNUSED (a few hundred px, syntax only) — which is exactly why magenta is available
  note → the current fxr accent (yellow via kol-brand-color.css) collides with the orange/amber band already in use

──────────── RETURN: rulers-and-guides-are-private ──────────── [23:30]
  kol-component 0.203.0 · all five symbols public · no behaviour changed
  `virtualWidth` prop in, `view` GONE (not generalised — as scoped)
  the CSS-zoom measurement is in the source docstring, not just the ticket
  monitor fired both lines — LOBBY OUT + LOBBY RECEIPT. The watch works.
  ⚠ remainder says "drop the private copies" — that is the PACKAGE's to do; fxr holds no editor source
  ⚠ their gotcha: npm serves 200 on version metadata while the tarball is still 404, up to 40 min.
     kol-shell 0.53/0.54/0.55 and kol-component 0.202.0 are metadata with no artifact. Skip them.

[23:34] · T4 · verified from the TARBALL, not the version doc
  what → fetched kol-component-0.203.0.tgz directly: HTTP 200, 3,599,022 bytes, five symbols in package/src/index.js
  why → their gotcha: npm serves 200 on version METADATA while the artifact is still 404, up to 40 min
  after → useFrameGeom(containerRef, virtualWidth) · CanvasRuler({containerRef, virtualWidth, disabled}) · CanvasGuides({...})
  verify → `view` absent from all three signatures ✓ · virtualWidth defaulted to CANVAS_VIRTUAL_W ✓
  note → `setGuides` kept its name; my onChange rename was not taken, and does not matter

[23:35] · T5 · → kol-client-olina
  what → handed them the version, the three signatures, the data-canvas-frame contract, and the tarball-not-metadata habit
  note → flagged one thing I cannot test from here: at 1920 virtual their pxPer is ~half the editor's, so the
         1-2-5 ladder will pick a COARSER step (200s/500s not 100s). Correct behaviour, but the first thing
         that will look wrong to someone expecting the editor's spacing.

──────────── MILESTONE: rulers + guides shipped ──────────── [23:35]
  filed 22:11 → returned 23:30 → verified 23:34. Ticket to published component in 79 minutes.
  scope held exactly: two couplings named, two couplings broken, zero behaviour changed.
  the one claim I measured rather than asserted (CSS zoom == transform) is now in the component's docstring.
  remaining: olina's adoption — theirs to run, and the proof the seam was real.

[00:0x] · T5 · ADOPTED — kol-client-olina, built app
  what → deck runs the rulers + guides at virtualWidth 1920; the split is proven, not just shipped
  verify → 755px frame → pxPer 0.393 → ladder picks 250 (labels 0·250·500·750·1000·1250) — stepped past
           100/200 to clear the 80px floor, exactly the prediction I sent them
  verify → guide dropped at the frame midpoint recorded h:[540] = half of 1080 · virtual maths correct at their size
  note → nothing to pass for `view`; ResizeObserver + rAF settle covered their resize AND their width cap unaided
  note → guides live on the slide DOCUMENT there, so they ride their undo stack and localStorage draft
  ⚠ docstring gap they hit: `position: relative` + `data-canvas-frame` read as ONE element in a single-canvas app.
    Satisfying both with the same node makes the ruler paint over the artwork. It must be a SIBLING of the frame
    inside a padded container. Passed to kol-ds-ui.

──────────── MILESTONE: rulers + guides, end to end ──────────── [00:0x]
  filed 22:11 → published 23:30 → verified 23:34 → adopted by a second consumer the same night
  the seam was real: two consumers, two stages (pan/zoom and CSS-zoom), one component, zero branches
  every claim measured — CSS zoom == transform, the tarball not the version doc, the tick ladder at 1920

