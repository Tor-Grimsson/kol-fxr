---
title: Para Type
type: reference
status: active
updated: 2026-07-08
description: The Para Type misc layer — procedural glyph engines, the specimen grid with filter sets and guides/anatomy overlays, flatten-to-vector, and the XY explore pad.
aliases:
  - para-type
  - paratype
tags:
  - project/kol-fxr
  - domain/typography
  - editor/para-type
covers:
  - the misc layer as Para Type's home + full-frame default
  - the classic / skeleton procedural glyph engines and anatomy params
  - the specimen grid, filter sets, and guides / anatomy overlays
  - flatten-to-vector (real engine paths → shape layers)
  - the XY explore pad
sources:
  - src/loops/paratype/glyph.js
  - src/loops/paratype/specimen.js
  - src/loops/paratype/flatten.js
  - src/loops/paratype/classic.js
  - src/loops/paratype/skeleton.js
  - src/editor/compose/inspectors/ParatypeTools.jsx
  - src/editor/compose/inspectors/XYPad.jsx
  - src/editor/compose/state.jsx
related:
  - "[[INDEX|Type family]]"
  - "[[01-text-layer|Text layer]]"
  - "[[02-kinetic-type|Kinetic type]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
---

# Para Type

Para Type is a **procedural type specimen** — glyphs drawn from anatomy parameters (x-height, stem width, aperture, superness…), not from a font file. It's the first entry on the **misc layer** (`MISC_TREE`), the placeholder home for rule-driven generators that are neither Generative types nor Effects (see [[../01-hierarchy/INDEX|hierarchy]]).

The misc layer rides the **loop render vehicle** (`loopGroup` / `presetId` / `loopId` + flat params), so Para Type is authored through the ordinary Parameters panel plus one extra tool surface. Its render is **static** — `u` is intentionally unused; the draw is a pure function of the anatomy params, so `frame(u)` is constant and trivially seamless.

**Full-frame default.** Misc layers now fill the export frame, like the loops (`fullCanvas` in `state.jsx` `case 'misc'`) — matching the labs Type Lab, resizable/movable afterward.

## The procedural engines

`src/loops/paratype/glyph.js` is the loop definition (`id: 'paratype-glyph'`, `group: 'paratype'`, `kind: '2d'`). It dispatches to two engines in `specimen.js`'s `ENGINES` map:

- **classic** (`classic.js`) — the serif-capable engine (serif / jut params live here).
- **skeleton** (`skeleton.js`) — the stroke-skeleton engine.

`renderGlyph(engine, glyph, params)` returns `{ width, paths: [{ d, part, fillRule? }] }` in **font units** (baseline at `y=0`, y-up). `GLYPH_ORDER` is the 13-glyph lowercase set: `o l i d b p q c e n h m t`.

### Anatomy params

Each knob gates to the glyphs (and engine) whose renderer actually reads it (`isG` / `hasG` / `isClassic` `when`-gates); in the specimen layout every glyph renders, so the glyph gates open up. Grouped by role:

| Group | Params |
|---|---|
| **Metrics** | x-height · ascender · descender · overshoot |
| **Weights** | stem width · round width · bowl width · hairline |
| **Expressive** (METAFONT / Amstelvar / Prototypo lineage) | aperture · arch height · shoulder · superness · serif · jut |
| **Resolution** | segments |
| **View** (chrome, never randomized) | layout · glyph set (filterSet) · visible · guides · anatomy |

Dropped from the labs original (dependency- or pipeline-driven): mathjs expression params, and the `PARAM_DEFS` keys the ported engines never read (`capHeight`, `roughen`, `warp*`, `perlin*`, etc. — those fed the page-level FX pipeline, not the glyphs).

## The specimen grid

`src/loops/paratype/specimen.js` is the **geometry core** — one home for glyph rendering, fit math, and grid layout, shared by the loop draw (`glyph.js`) and the flatten builder (`flatten.js`) so canvas pixels and flattened shapes always agree.

Two layouts (the `layout` param):

- **single** — the one focus `glyph` centered at 80% fit.
- **specimen** — the labs review loop: a big focus glyph over the top ~40%, the full glyph grid filling the rest, in one canvas.

**Filter sets** (`FILTER_SETS`) scope the grid: `All` · `Rounds` (o c e) · `Stems` (l i t) · `Bowls` (d b p q) · `Arches` (n m h) · `Ascenders` (l d b h t) · `Descenders` (p q). `visibleCount` (6 / 8 / 10 / all) truncates the list. `visibleGlyphList` + `specimenLayout` compute the `repeat(auto-fit, minmax(96px, 1fr))`-style grid.

`glyphPlacements(p, w, h)` is the **shared seam** — `kind: 'focus'` for the big glyph, `kind: 'cell'` for grid entries. Both the canvas draw and the flatten builder walk it.

### Guides + anatomy overlays

Two optional overlays on the big glyph, drawn from the placement transform so the lines sit on the engine's actual metrics (z-order: guides under the glyph, anatomy over it):

- **Guides** (`drawGuides`) — baseline solid, x-height / ascender / descender dashed.
- **Anatomy** (`drawAnatomy`) — labeled callouts (`asc` / `x` / `base` / `desc`).

Both are metric-derived, so they ported 1:1; the `cap` line is dropped with the `capHeight` param (the lowercase-only engines never read it).

## Flatten-to-vector

`src/loops/paratype/flatten.js` — `buildParatypeFlattenGroup(layer, colors, newId)` turns the misc layer into a **group of editable vector shapes**: one `shape{kind:'flatten'}` child per drawn glyph, each with its own inner SVG of the engine's **real paths**, positioned group-relative via the **same** `glyphPlacements` math the canvas draw uses — so the vector result lands exactly on the raster it replaces.

- Grid chrome (cell borders, labels) and the guide/anatomy overlays are **view chrome, not artwork** — they don't flatten.
- The `bg` becomes a backing rect child unless `bgOn === false` (then transparent).
- In-place group replacement (the `flattenPattern` / `flattenText` precedent); **one-way, undo restores**.

Invoked via `flattenParatype(layerId)` (`state.jsx`), surfaced as **Flatten to vector** in the tools panel.

## Tools — flatten + explore

`src/editor/compose/inspectors/ParatypeTools.jsx` mounts once in `ParametersPanel`'s LoopFields and self-gates on the loop id (costs nothing for other loops):

- **Generate tab** → the *Flatten to vector* button.
- **Style tab** → the **XY explore pad** (labs `XYTab`): two axis dropdowns over the loop's visible **range** params + a 2D pad (`XYPad.jsx`) that writes both axes in one coalesced patch. Axis choices persist on the layer as `_xyX` / `_xyY` (the off-schema `_framePreset` idiom) so they survive reselection.

`XYPad.jsx` is a presentation-only 2D control pad (drag one puck to vary two values), ported from the labs para-type lab (itself Font-Playground-inspired) and rail-adapted to fill its container as a square. Axis meaning, ranges, and the write path belong to the caller.
</content>
