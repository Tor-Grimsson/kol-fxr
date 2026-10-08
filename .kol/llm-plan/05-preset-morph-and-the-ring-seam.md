# Plan — Morph: a stage that tweens between saved presets · and the ring seam

**Status:** BUILT 2026-10-08, here, both parts — **the seam:** `src/loops/scanline/engine.js` rings are `closed` paths of n points and `renderScanlines` pre-rolls a closed path once (field values cached) before emitting from the carry; the before/after crops at 3 o'clock (`_tmp/2026-10-07-hub-walk/seam-{before,after}-crop.png`) show the row of holes gone; the filter variant shares the walker. **Morph…:** `src/editor/morph/` — `buildMorph.js` (pure, + `buildMorph.check.mjs`, 14 asserts), `MorphDialog.jsx` on FilesDialog's shape, `MorphDialogHost.jsx` mounted in labs and the editor, the File tab's Morph… button. Walked in labs: three scanline presets saved, picked in order, Build → the layer carries `ringCount` keys 60 → 36 → 100 → 60 with `in-out`, `mark` steps with `hold`, 0 console errors. Not done: OKLCH colors, the crossfade for differing geometries (§ 3), Once/Ping-pong only unit-checked. · **Origin:** user ask 2026-10-08 — *"say I have 5 presets from generate scanlines. Can we make a special 'morph' or 'blend' stage, that makes some algorithmic blending between the presets? either math based to go from 1 to 2 to 3 to 4, 5, 6 etc. or some other transition?"* — and, secondary, the gap at 3 o'clock on scanline Rings.
**Scope ruling:** every file below was read in `kol-ds-ui/packages/design-editor/src` at 0.22.0. Both pieces are the package's; fxr owns no line of either. The deliverable here is the spec; the build is a DS ticket.

## 1. Can it be done? Yes — the value model already is the morph

What exists (`editor/params/resolve.js`, `easing.js`, `TimelineDock.jsx`, the docs' `05-parameters-binding`):

- A prop's stored value is a union: a raw constant · `{ bind: 'track', keys: [{ t, v, easing }] }` · `{ bind: 'mod', source, transform }`.
- `resolveTrack` lerps numbers, lerps `#rrggbb` colors per channel, and **steps** anything else at the segment start. Per-key easing: `linear · ease · in · out · in-out · hold`.
- `t ∈ [0, 1]` over the transport's loop length; before the first key the first value holds, after the last the last — so a seamless cycle needs its last key equal to its first.
- The `TimelineDock` lists one lane per track anywhere in the layer tree and edits keys; it draws nothing while there are none.
- The webm bake resolves every binding per frame (`resolveLayersDeep` with its own smoothing store).
- A saved preset is the document as stored — bindings included — so a morph saves, reloads and exports like any preset.
- A labs preset is a library item whose one loop layer is `{ loopGroup, presetId, loopId, …flat params }` (`loops/registry.js:144`, `compose/state.jsx:426`).

So **Morph(P1 … PN)** is P1's layer with, for every schema param whose value differs across the N, a track whose keys are the N values at `t = i/N` and a closing key at `t = 1` equal to the first. Nothing new in the resolver, the clock, the timeline or the export. What is new is the picker and the one function that builds the tracks.

## 2. The design

**Where.** Labs' File tab gets **Morph…** beside Files…; the editor's File menu the same. It opens a dialog on `FilesDialog`'s shape: the library's presets whose layer `loopId` equals the current layer's — same generator only — picked **in order** (2 … N, numbered as picked). Options in the dialog:

| option | values | default |
|---|---|---|
| Curve | `EASING_OPTIONS` | Ease in-out |
| Cycle | **Loop** A → … → N → A · **Ping-pong** A → … → N → … → A · **Once** A → … → N | Loop |
| Loop length | the transport's `loopSeconds`, shown and editable | current |

**Build** replaces the current layer with the morph layer; the dock appears with a lane per tracked param.

**The build rule, per schema param** (`editor/params/schema.js` types):

| type | across the presets | becomes |
|---|---|---|
| `range` · `int` | differs | a track, lerped with the chosen curve |
| `color` | differs | a track — RGB lerp today; OKLCH is the DS's call |
| `select` · `toggle` · `segmented` · `text` | differs | a track with `hold` keys — a **cut** at each key, and the dialog says so before Build: *"Steps, not tweens: Geometry · Mark"* |
| `seed` (a `range` that is not continuous) | differs | **held at P1's value** — lerping a seed scrambles the noise every frame; a *Step seeds* toggle makes it a cut instead |
| the `anim`-tab integers (`flow`, `spin`) | differs | lerped like any range; note that a fractional cycle mid-morph is not itself seamless, the loop as a whole still is |
| any | equal | untouched — stays a raw value |

**Keys.** Loop: `t_i = i/N`, closing key at 1 = P1. Ping-pong: 2N segments out and back. Once: `t_i = i/(N−1)`, no closing key — it clamps at N and is **not** a seamless loop; the dialog marks it.

After Build it is ordinary state: drag keys in the dock, bind a knob to an LFO on top of the morph, **Save…** it as a preset, bake a webm.

## 3. The other transition — crossfade

Where discrete params differ (rows → rings), a parametric tween is a cut. The other way is a **crossfade**: N loop layers with staggered opacity tracks (1 → 0 / 0 → 1). That is the compositor's domain — two layers — not labs', which is one generator on one stage. Phase 2, in the editor: Morph… builds a group of N layers with opacity tracks when discrete params differ, a tween when they do not. Costs 2× render during an overlap. Not phase 1.

## 4. The ring seam — a bug, filed on its own

**Cause** (`loops/scanline/engine.js:157-172` and the accumulator at `:97-105`): the running sum starts at 0 on each path's first point, so the first mark lands one full gap in, and the last partial sum is thrown away. Rows and columns hide that margin off-canvas with `OVERSCAN`; a ring's first point is at `θ = spin + swirl·…` — 3 o'clock at the defaults — and on-canvas, so every ring carries a gap of one to two gap-widths at the seam. The spiral has the same at its centre, radial at its centre (small).

**Fix:** closed paths pre-roll. `buildPaths` marks rings `closed: true` and emits `n` points (`j < n`, no duplicated endpoint); `renderScanlines` walks a closed path **twice** — pass one computes each point's field value and the carry, pass two emits marks starting from the carried `acc`. Field values cached from pass one, so no second fbm. The seam gap becomes an ordinary gap, `spin` moves nothing visible, and the filter variant (`filters/scanline.js` calls the same `renderScanlines`) is fixed with it.

**Done when:** Rings at the screenshot's settings (60 rings · min 5 · max 26 · noise) shows no gap at 3 o'clock at spin 0 and spin 1; `frame(0) === frame(1)` still holds.

## 5. What is fxr's

Nothing to build. On the return: bump, open `/labs`, build a three-preset morph and bake a 4 s webm; open Rings and look at 3 o'clock.

## Steps, on go

1. File **`preset-morph`** to the DS — § 1–3 as the spec, § 2's tables as the acceptance.
2. File **`scanline-ring-seam`** to the DS — § 4.
3. On the returns: bump and the two checks in § 5.

## His calls, recorded, not decided here

- Where Morph… lives: the File tab (proposed) or the Animation tab beside Frame / Form.
- Color lerp space: RGB (what resolves today) or OKLCH.
- Ping-pong and Once: with Loop in phase 1, or after.
