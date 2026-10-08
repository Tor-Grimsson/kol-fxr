---
title: Text Layer
type: reference
status: active
updated: 2026-07-08
description: The flat text layer — Right Grotesk cuts, metrics, and real vector export via opentype glyph outlines with a browser-faithful layout.
aliases:
  - text-layer
tags:
  - project/kol-fxr
  - domain/typography
  - editor/text-layer
covers:
  - the Right Grotesk cut vocabulary (width / weight / case / italic / align / metrics)
  - TextPanel — the right-rail authoring surface
  - real vector export via glyph outlines + the foreignObject fallback
  - multiline / tracking / baseline layout fidelity
  - flatten-to-vector and the workshop-vs-compose split
sources:
  - src/editor/modes/type/cuts.js
  - src/editor/modes/type/textOutline.js
  - src/editor/modes/type/buildTypeSvg.js
  - src/editor/modes/type/fontLoader.js
  - src/editor/compose/inspectors/TextPanel.jsx
  - src/editor/compose/build.js
related:
  - "[[INDEX|Type family]]"
  - "[[02-kinetic-type|Kinetic type]]"
  - "[[03-para-type|Para Type]]"
---

# Text Layer

A `text` layer is **one flat block of Right Grotesk** — static, placed (600×120 default box), draggable/resizable like any layer. It carries its typography as plain props (`width`, `weight`, `case`, `italic`, `textAlign`, `size`, `tracking`, `lineHeight`, plus `text`, `color`, `stroke`/`strokeWidth`). No animation of its own; the metric sliders can each take a bind dot, so `size`/`tracking`/`lineHeight` can be driven by the graph.

It is the simplest of the three type surfaces and the only one that vectorises to plain per-line `<path>` outlines on export.

## The cut vocabulary

Cuts live in `src/editor/modes/type/cuts.js` (which re-exports `WEIGHTS` / `familyFor` / `applyCase` from the shared `src/data/typography-cuts.js`, so the DS and styleguide use the same source).

| Field | Values | Notes |
|---|---|---|
| **Width** (`WIDTHS`) | Display · Compact · Tall · Wide · Narrow · Spatial · Tight · Mono | `familyFor(width)` maps to the Right Grotesk family; `mono` → JetBrains Mono |
| **Weight** (`WEIGHTS`) | the shared weight ramp | numeric `font-weight` |
| **Case** (`CASES`) | Aa (original) · AA (upper) · aa (lower) · Aa. (sentence) | applied by `applyCase` at render, **not** a CSS `text-transform` on the component |
| **Italic** | off / on | `font-style` |
| **Align** | left / center / right | `TEXT_SCHEMA` `textAlign` param |
| **Metrics** | Size (px) · Tracking (em) · Line-height | reuse `TEXT_SCHEMA` param defs (ranges + binding identity) |

Defaults used by the outline builder when a prop is absent: `size 96`, `tracking -0.01`, `lineHeight 1.05`, `width 'Tight'`, `weight 600`, `align 'center'`.

**Case is a content-layer choice.** `applyCase` transforms the authored string before layout — the component never auto-uppercases. `cssFor()` only emits a `text-transform` line for the live-preview CSS string, never as an enforced component style.

## TextPanel — the authoring surface

`src/editor/compose/inspectors/TextPanel.jsx` is the **Text tab of the right rail**, selection-driven (it only renders for a selected `text` layer). It harvests the Type-mode typography surface (Width / Weight / Case / Italic / Align / Metrics) onto the selected layer's own props — one home per control.

- `TEXT_TAB_KEYS` = `{ width, weight, case, italic, textAlign, size, tracking, lineHeight }` — the keys this tab owns. `ParametersPanel` filters these **out** of the text layer's schema-driven view so there's no duplicate home.
- Writes go through `useLayerEdit(id, { history: 'coalesce' })` — same coalesced-history path as `ParametersPanel`.
- **Metric rows** (`MetricRow`) reuse the `TEXT_SCHEMA` param defs so their bind dots resolve identically everywhere. A bound metric shows a read-only *animated* marker instead of a slider (the AutoControls convention — don't let the slider fight the binding).
- Fill is **not** here — it stays in the Inspector (shared paint surface). Align rides along because it has no other home.
- **Save type to library** (`saveType`) writes the layer's cut + metrics + resolved hex color as a library type spec (Type mode consumes the same shape).

**Workshop-vs-compose split.** Type mode's Variable-axis block (morph / fade / random, Cut B, Curve, Explode) is deliberately **not** on the flat text layer — compose text renders via `TypeBlock`, which has no axis-morph path. `TypeControlsPanel` flattens `axisOn` frames on their way into compose. Axis morphing is a Kinetic-type concern (see [[02-kinetic-type|Kinetic type]]).

## Real vector export

Export produces **one `<path>` per rendered line** of true glyph outlines, not rasterised text.

The challenge: `buildLayersSvg` is synchronous (the PNG / webm / eyedropper callers all build in a tight sync path), but opentype font parsing is async. The bridge (`src/editor/modes/type/textOutline.js`):

1. Export first `await warmTextFonts(layers)` — resolves every text layer's cut through the `fontLoader` promise cache and parks the parsed `Font` in a sync `warm` map (groups walked deep).
2. `textLayerFont(layer)` then answers **synchronously** at build time.
3. `textOutlinePaths(layer, font)` builds the path data.

In `build.js`, `textLayerSvg()` emits real outlines when the font is warm, wrapping them in a `<g transform>` with the resolved fill and — when a stroke is set — a centred stroke via `paint-order="stroke fill"` (the `-webkit-text-stroke` equivalent).

### The foreignObject fallback

`textLayerForeignObject()` is kept **strictly** as the fallback — a styled HTML `<div>` in a `<foreignObject>`, which only renders in browser SVG consumers (never Illustrator/Inkscape). It fires in two cases:

| Case | Why |
|---|---|
| **Mono cut** | JetBrains Mono ships woff2-only; opentype.js can't parse woff2, so it never warms |
| **Cold cache** | a sync caller (e.g. the eyedropper) that never `await`ed `warmTextFonts` |

So Mono text renders correctly on canvas but exports as non-vector; every other cut exports as real outlines.

## Layout fidelity

`textOutlinePaths` mirrors the live render (`LayerRenderer`'s TextLayer wrapper + the TypeBlock div) so outlines land exactly where the canvas shows them:

- **Vertical centering** — the line stack is flex align-center within `layer.h`, with TypeBlock's `min-height: 1em` floor (`blockH = max(lines·lineH, size)`).
- **Multiline** — hard `\n` breaks, then greedy soft-wrap at `layer.w` (`wrapLine`), with character-level breaks for a word wider than the box (`overflow-wrap: break-word`). Trailing whitespace hangs (pre-wrap) and is excluded from measured width.
- **Tracking** — letter-spacing in em after **every** glyph including the last (CSS behavior). Non-zero tracking clears the ligature features (`renderOpts`), matching the CSS rule that UAs drop optional ligatures when letter-spacing is non-zero. Kerning stays on.
- **Baselines** — the CSS half-leading model over the cut's hhea ascent/descent: `baseY = top + i·lineH + (lineH − (ascent+descent))/2 + ascent`.
- **Alignment** — per line, over `layer.w` (`left` = 0, `right` = `w − lineW`, else centered).

Measurement uses the **same** advance/kerning/letter-spacing engine that draws the glyphs (`font.getAdvanceWidth` with the render opts), so wrap points and drawn positions never disagree.

**Known drift:** kern-heavy pairs may differ sub-pixel between the live render (HarfBuzz) and vector export (opentype GPOS); Windows Chrome vertical metrics may differ a few px.

## Flatten-to-vector and the shared per-glyph builder

`src/editor/modes/type/buildTypeSvg.js` is the **Type-mode composition builder** — it computes per-glyph paths + positions (`computeFrameGlyphs`), one `<g>` per frame, and is the single source of truth so live preview and Type-mode SVG export stay in sync. It handles the axis modes (morph / random / fade) that the flat text layer doesn't, using the same half-leading layout math as `textOutline.js` but **per glyph** (the axis modes need a path per character).

Its path-command serializers (`commandsToPath`, `lerpCommands`, `commandsBbox`, `commandsMatch`) are **imported from the kinetic morph engine** (`src/kinetic/morph.js`) — the two were unified; morph.js is the export.

Compose's `flattenText` (`state.jsx`) reuses `computeFrameGlyphs` to turn a text layer into a group of per-glyph `shape{kind:'flatten'}` layers — each with its own inner SVG, `fill="currentColor"` so it re-tints from the wrapper's color, positioned in group-relative coords. One-way; undo restores. `addFlattenedFromFrame` does the same for a Type-mode frame sent to compose with `axisOn`.
</content>
