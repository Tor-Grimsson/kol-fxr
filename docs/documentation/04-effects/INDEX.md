---
title: Effects
type: index
status: active
updated: 2026-07-08
description: The filter/effects system — a per-layer post-FX chain that runs across three tiers (Canvas-2D, Pixi GPU, terminal GL engine), the Effects panel that drives it, and how chains render and export.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - effects
related:
  - "[[../01-hierarchy/INDEX|hierarchy]]"
  - "[[01-filter-chain|filter chain]]"
  - "[[02-canvas-tier|canvas tier]]"
  - "[[03-pixi-tier|pixi tier]]"
  - "[[04-gl-engine-tier|gl engine tier]]"
---

# Effects

The EFFECT method (hierarchy level 1 — see [[../01-hierarchy/INDEX|hierarchy]]) is everything that transforms a source instead of generating it. A source is a photo, a video/webcam frame, a live loop canvas, or the SVG raster of a shape/text/pattern/path. A layer carries a **chain** of effect stages, and the renderer runs that chain across three engine tiers before painting the layer's canvas.

## The one-line model

```
layer.filters = [{ id, key, enabled, params }, …]   (cap 8)

render tier order (independent of array position):
   Canvas-2D stages  →  Pixi GPU batch  →  ONE terminal GL engine
```

Every effect def lives in one registry (`src/filters/index.js`). Its `kind` field decides which tier runs it: absent = Canvas-2D, `kind:'pixi'` = GPU batch, `kind:'engine'` = terminal GL. The chain model, the tier split, and the backward-compat normalizer all live in `src/editor/compose/filterChain.js`.

## Sections

| Doc | What it covers |
|---|---|
| [[01-filter-chain\|filter chain]] | The `layer.filters[]` data model, `MAX_FILTERS`, `makeStage`, `normalizeLayerFilters`, tier-ordering helpers, tier-aware `addFilter`, and legacy single-`filterId` back-compat. |
| [[02-canvas-tier\|canvas tier]] | Tier 1 — the Canvas-2D filters (`fxCore.runChain`, glass / scanline / dither / radar FX / ASCII / halftone / bitmap / FX-rack). Full catalog + the per-source cache + dry/wet Amount contract. |
| [[03-pixi-tier\|pixi tier]] | Tier 2 — the ~35-effect Pixi GPU batch (`pixi/{adapter,pipeline,defs}.js`), the one persistent Pixi Application, the lazy code-split chunk, and the async supersede compositing pattern. |
| [[04-gl-engine-tier\|gl engine tier]] | Tier 3 — the terminal three.js engine filters (`gl/`, synths / distortion / lens / Rutt-Etra scan), why there's at most one and it's always last, and the lazy engine host. |
| [[05-sweeps\|sweeps]] | The stackable motion rig (`sweeps.js`) — one-click Scan / Pulse / Wave / Radar / Reveal presets on the ASCII / halftone-dither / bitmap cell filters, woven loop-safe. |
| [[06-effects-panel\|effects panel]] | The `EffectsPanel` UI — chain rows, add/replace picker flow, category sync, the Preset dropdown, per-stage seeded randomize, and the sweep-stack controls. |
| [[07-render-export\|render & export]] | How the renderer dispatches each layer type to an effect host (`LayerRenderer`), retina dpr handling, and export via the live-canvas snapshot (`build.js`). |

## Where it surfaces

- **Effects menu** (top bar) — applies a filter to the selected layer, jumps to Parameters.
- **Effects panel** (right rail) — the chain editor; adds/reorders/removes stages, edits per-stage params, drives motion.
- **Effect · X pointer row** (Inspector) — quick affordance on any effectable layer.
