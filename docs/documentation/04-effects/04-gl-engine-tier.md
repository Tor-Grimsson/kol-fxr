---
title: GL engine tier
type: reference
status: active
updated: 2026-07-08
description: Tier 3 — the terminal three.js engine filters. The data-only catalog, the lazy engine host, why there's at most one engine stage and it's always last, the pre-engine feed pipeline, and camera drag.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - gl-engine-tier
covers:
  - the kind:'engine' def contract
  - the lazy gl/host.js engine host
  - the terminal / feed-canvas pipeline
  - the six engine filters
sources:
  - src/filters/gl/catalog.js
  - src/filters/gl/host.js
  - src/editor/compose/LayerRenderer.jsx
related:
  - "[[01-filter-chain|filter chain]]"
  - "[[02-canvas-tier|canvas tier]]"
  - "[[03-pixi-tier|pixi tier]]"
---

# GL engine tier

Tier 3 — the **terminal** tier. A GL engine filter is a three.js engine that reads the upstream-processed source and renders the final layer canvas. It's the last thing in the chain, and there is **at most one** per layer ([[01-filter-chain|filter chain]]).

## Why terminal, why one

Engine filters are feedback-based or time-accumulating (trails buffers, scan-line integration) and **free-running** — not seamless-looped, labs parity. That shape matches a dedicated renderer (`EngineFilterLayer`), not a mid-chain pass. So `enabledEngineStage` returns exactly one stage; canvas and pixi adds always insert before it, and the panel forbids moves that would cross it.

## Data / engine split

Same split as the pixi tier and the loops system:

| File | Role |
|---|---|
| `gl/catalog.js` | DATA ONLY — the `{ id, label, kind:'engine', engine, params }` defs + editor schemas. Consumed eagerly by the registry/picker; no three.js import. |
| `gl/host.js` | The ONLY module importing the three.js engines. Lazy-loaded via `import('../../filters/gl/host.js')` when a filtered layer mounts, so three stays out of the base bundle. |

`gl/host.js` exposes a uniform surface (every ported engine shares the synthBase contract, so only construction switches on the def):

```
createEngine(def, canvas)          → engine mounted on the layer canvas
setSource(def, engine, srcCanvas)  → push the fitted/processed source
touchSource(def, engine)           → flag the source texture for re-upload
applyParams(def, engine, params)   → flat params → engine
driveEngine(def, engine, {u, dt})  → one frame (dt drive; free-running)
setCameraDrag(def, engine, on)     → enable/disable OrbitControls
destroyEngine(engine)              → teardown
```

## The pre-engine feed

The engine reads a **stable feed canvas**, so the earlier tiers must composite into one identity that the engine's `CanvasTexture` binds to. `LayerRenderer.chainIntoFeed` runs the canvas stages then the pixi batch into a reused feed canvas, preserving tier order:

```
fitted source → canvas stages (runChain) → pixi batch (runPixiPass) → engine source
```

Live sources (video/webcam) and in-place chain repaints redraw the feed in place and call `touchSource` so the texture re-uploads (the video idiom). Engines advance on `dt` only while the transport plays (`dt = 0` repaints the held frame).

## Hosts

Three `LayerRenderer` components mount the engine depending on the source:

- **`EngineFilterLayer`** — a filtered photo/video/webcam layer terminating in a GL engine.
- **`EngineLoopFilterLayer`** — a GL engine on a 2D loop layer (labs relief-over-generated-pattern): the loop's live canvas is the engine's source.
- (`EngineLoopLayer` is the GL *loop* host — a generative engine, not a filter — but shares the same lazy-host shape.)

**Host eligibility:** photo and 2D loop layers can host a GL engine (their live pixels feed the source). Engine *loops* can't host effects (no GL source path); other effectable vector types are canvas/pixi only.

## Catalog (`GL_FILTERS`)

| id | label | engine | Notes |
|---|---|---|---|
| `gl-trails` | Trails | `trails` | Phosphor-persistence feedback (labs CRT family). |
| `gl-scan` | Rutt-Etra | `scan` | Scan-line relief. `orbit: true` — real OrbitControls, driven by the layer's camera-drag toggle. |
| `gl-slitscan` | Slitscan | `slitscan` | Time-axis slit (shines on changing sources). |
| `gl-disco` | Disco | `disco` | Kaleido/mirror + pan/zoom/spin, 70s-palette lock. |
| `gl-distort` | Distortion | `distort` | Pointer/auto-path displacement + RGB shift; cursor record/replay. |
| `gl-lens` | Lens | `lens` | Refracting surface (glass/ripple/ice/mirror/kaleido/waves). Preset param `type`. |

## Camera drag

`orbit: true` defs (only `gl-scan` here) carry real three.js `OrbitControls`, which start **disabled**. The editor's orbit mode (the C tool) enables them via `setCameraDrag`; while on, the layer canvas swallows `pointerdown`/`mousedown` so the editor's move-drag router never sees them, and the cursor becomes grab. This settles the Rutt-Etra pointer conflict.
