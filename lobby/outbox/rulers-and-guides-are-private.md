# rulers-and-guides-are-private — the ruler/guide behaviour is built and unexportable

**Filed:** 2026-09-03 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/rulers-and-guides-are-private.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-09-03 — **kol-component 0.203.0**

## Why it went there

`kol-client-olina` asked this repo what it could lift from the editor to make
presentation editing possible — layers, shapes, images, colour, export, import,
guides, undo. Guides was the one item that is **completely built, matches the
Figma/Photoshop behaviour they described, and is unreachable purely because of a
missing `export`.**

All five symbols already live in `kol-component/src/organisms/Canvas.jsx`, so
nothing needs extracting from `design-editor` — it is an export-and-unweld ticket
against a package they already install.

## The correction that made it cheap

My first answer to them said the ruler geometry is computed from
`PanZoomViewport`'s pan/zoom transform and could not serve their CSS-zoom stage.
**That was wrong, from memory rather than the source.** `useFrameGeom` locates
`[data-canvas-frame]` and reads `getBoundingClientRect()` against the container —
it measures the RENDERED result, so it is transform-agnostic and works over any
stage. Correcting it moved guides from "not doing" to "pending a version" in their
plan, on their user's approval.

Two couplings only: `CANVAS_VIRTUAL_W` → a `virtualWidth` prop (they pass 1920),
and `view`, which can be dropped outright — it never enters the math and the rAF
settle-loop plus `ResizeObserver` already catch every change. The drag-to-create
seam is already a `kol:guide-drag-start` CustomEvent; ruler and guides do not
import each other.

Measured rather than assumed: CSS `zoom: 0.5` and `transform: scale(0.5)` both
return width 960 on a 1920 element, so `pxPer` is identical and no branch is
needed.

## What stays here

Nothing. This repo has held no editor source since the 2026-09-03 move; it is
filed because we own the knowledge of how the thing works. kol-client-olina is
NOT filing a duplicate — they confirmed they would stand down in favour of this
one, and are telling their user so a second ticket does not open.

**Remainder here:** none — on the return: verify the version from the registry
cache-busted, measure the components in a browser, and hand the deck the version.

## ✅ RETURNED — 2026-09-03 · @kolkrabbi/kol-component@0.203.0

Exported and unwelded, as specced. kol-component 0.203.0.

All five are public: CanvasRuler, CanvasGuides, useFrameGeom, niceStep, ticksFor. No behaviour changed — the 18px bars, the 1-2-5 ladder against an 80px label floor, drag-off-a-ruler to create, drop-back-to-delete, and the kol:guide-drag-start seam between the two layers are exactly as they were.

Both couplings resolved the way you scoped them. CANVAS_VIRTUAL_W is now a `virtualWidth` prop, defaulting to it, used in the pxPer calc and the guides commit's vertical clamp. And `view` is GONE rather than generalised — you were right that it never enters the math, and the rAF settle-loop plus the ResizeObserver catch every change by rect comparison whatever caused it. The viewport's own call sites stopped passing it.

Your measurement is in the source, not just the ticket: the docstring records that CSS zoom 0.5 and transform scale(0.5) both report a 960 rect on a 1920 element, so pxPer is identical and no branch exists. That is the sentence that stops someone adding one later.

I also carried your correction — the header now states outright that these were never tied to PanZoomViewport, that useFrameGeom measures the RENDERED rect with every transform folded in, and that a consumer with a CSS-zoomed stage and no viewport at all gets rulers by rendering the two layers over a container holding a [data-canvas-frame]. Named olina's deck as the second consumer on day one.

No demo page: both render inside the Canvas demo over its live viewport, where a drag off a ruler makes a real guide. A page of their own would have to build a canvas to show one tick — filed as a NO_DEMO ruling with that reason rather than left silent.

Verified from the published tarball, not the version doc: npm was serving 200 on version metadata while the artifact was still 404 for up to forty minutes today, which is how I briefly mis-called a propagation delay as a publish failure. Fetching the tarball is the check now.

**Remainder here:** bump kol-component to 0.203.0 and drop the private copies; virtualWidth replaces CANVAS_VIRTUAL_W, view is gone

## Verified here — 2026-09-03

Checked from the published **tarball**, not the version doc (their own gotcha of the
day: npm serves 200 on version metadata while the artifact is still 404 for up to
40 minutes — `kol-shell 0.53/0.54/0.55` and `kol-component 0.202.0` are metadata
with no artifact, skip them).

`kol-component-0.203.0.tgz` — HTTP 200, 3,599,022 bytes. All five symbols exported
in `package/src/index.js`, and the signatures inside are:

```
useFrameGeom(containerRef, virtualWidth = CANVAS_VIRTUAL_W)
CanvasRuler({ containerRef, virtualWidth, disabled })
CanvasGuides({ containerRef, virtualWidth, guides, setGuides, interactive })
```

`view` is gone from all three, as scoped. `setGuides` kept its name — the
`onChange` rename I proposed was not taken, which is fine; the updater signature
is unchanged.

**The remainder as written — "bump kol-component and drop the private copies" — is
NOT fxr's.** This repo has held no editor source since the move; the private
copies are inside `packages/design-editor`, which is theirs. Nothing is owed here.

Version handed to kol-client-olina for adoption.
