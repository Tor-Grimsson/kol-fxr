---
title: Sweep stacks
type: reference
status: active
updated: 2026-10-10
description: The stackable motion rig for cell-grid filters — makeSweep, the five one-click presets, the shape/target grammar, evalSweeps compounding, and how sweeps are woven loop-safe on integer cycles.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - sweeps
covers:
  - the sweep object shape
  - shapes / targets / presets
  - evalSweeps compound rules
  - the loop-safe time contract
sources:
  - src/filters/sweeps.js
  - src/filters/fxAscii.js
  - src/filters/fxHalftoneDither.js
  - src/filters/fxBitmap.js
related:
  - "[[02-canvas-tier|canvas tier]]"
  - "[[06-effects-panel|effects panel]]"
---

# Sweep stacks

A **sweep** gives a static image "life": a time-driven scalar field `f(nx, ny, t) → 0..1` (a moving wavefront) that modulates a cell filter. Ported from the labs Dither/ASCII Motion tab (`src/filters/sweeps.js`). Filters opt in with `sweeps: true` on their def — currently the three cell-grid filters `fx-ascii`, `fx-halftone-dither`, `fx-bitmap` ([[02-canvas-tier|canvas tier]]).

## Stackable

Sweeps STACK. Each filter stage carries an ARRAY of sweeps in `params.sweeps`, and every enabled sweep **compounds** at each cell. The panel renders the stack UI (add/remove/reorder, per-sweep enable) — see [[06-effects-panel|effects panel]].

## The sweep object

```js
{ shape, target, enabled, amount, speed, width, angle }
```

`makeSweep(shape = 'linear', overrides)` mints one with brightness-band defaults (drifting left→right): `amount 0.6`, `speed 1`, `width 0.35`, `angle 0`.

**Shapes** (`SWEEP_SHAPE_OPTIONS`) — how the wavefront travels:

| value | label |
|---|---|
| `linear` | Linear bar |
| `radial` | Radial pulse |
| `wave` | Traveling wave |
| `angular` | Radar sweep |
| `noise` | Noise drift |

`ANGLED_SHAPES` = `{ linear, wave, angular }` — only these expose an Angle (a travel direction). All shapes pin their centre at `(0.5, 0.5)` — the labs panel never exposed a movable centre.

**Targets** (`SWEEP_TARGET_OPTIONS`) — what the wavefront modulates:

| value | label | Compound rule (`evalSweeps`) |
|---|---|---|
| `brightness` | Brightness | Additive luma delta (`± amount` at each wavefront), fed into the cell algorithm. |
| `geometry` | Geometry | Scale / displace / rotate compose along each travel direction. |
| `reveal` | Reveal | Max-blended mask; the engine gates the cell (raw photo underlay shows) when `reveal < 0.5`. |

## Presets (`SWEEP_PRESETS`)

Five one-click presets append a tuned sweep:

| Name | shape | target | Feel |
|---|---|---|---|
| **Scan** | linear | brightness | A bright bar sweeping across. |
| **Pulse** | radial | brightness | Concentric brightness pulse. |
| **Wave** | wave | brightness | Traveling sine stripes. |
| **Radar** | angular | brightness | A radar-style angular sweep. |
| **Reveal** | linear | reveal | A wipe that reveals the raw photo. |

## Loop-safe time

Sweeps are woven so `frame(0) === frame(1)` exactly — the editor's loop-safe time model. `speed` is **whole wavefront cycles per loop (integer)**; the labs cycles/sec speeds fold to `round(speed·4)` (min 1):

- `linear` / `radial` / `angular` — band position `wrap01(u·cycles)`, periodic.
- `wave` — phase shifts by `cycles·2π` per loop, periodic.
- `noise` — labs scrolled the lattice linearly (never seamless); here the sample window **orbits** (cos/sin of the phase, the glass.js drift trick), so it closes the loop.

## Evaluation

`sweepStates(p, u)` precomputes the frame's enabled sweep states (falling back to the legacy flat keys — `animate`/`sweepShape`/… — for any un-normalized layer; returns `null` when nothing is enabled, so engines take the `NO_SWEEP` fast path). `evalSweeps(states, nx, ny)` combines every sweep's modulation at one cell into a single reused packet — allocation-free in the per-cell hot loop. `anyReveal(states)` tells the engine to draw the raw photo underneath first so gated-off cells show it.

## Origin and travel (2026-10-10, plan 26)

The port had pinned every sweep's centre at 0.5, 0.5 and run bands one way. Each sweep now carries **`cx` / `cy`** — the origin, normalized frame coords — where a radial / radar sweep centres and a linear band starts (an XY pad in the sweep card), and **`travel`**: `forward` · `reverse` · `pingpong`. Ping-pong runs the band out and back on whole cycles, so every travel still closes at u = 1. `src/filters/sweeps.check.mjs` asserts that for every shape × travel.

**Scanline** declares `sweeps: true`: the stack feeds the engine a per-mark size multiplier (`sweepMul`) that composes with Scanline's own Form › Sweep and Pulse, which stay.
