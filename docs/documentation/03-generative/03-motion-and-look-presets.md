---
title: Motion & Look Presets
type: reference
status: active
updated: 2026-07-08
description: The Motion Frame/Form preset tables per loop family, the Soft Forms Look recipes, and the 'Custom' sentinel that fires when a covered param is hand-edited.
tags:
  - project/kol-fxr
  - domain/generative
  - editor/presets
aliases:
  - motion-presets
  - look-presets
covers:
  - Frame vs Form axes and the compose rule
  - per-family motion tables + the viewport fallback
  - the Custom sentinel (axisKeys)
  - Soft Forms Look recipes
sources:
  - src/editor/params/motionPresets.js
  - src/editor/params/lookPresets.js
  - src/editor/compose/inspectors/ParametersPanel.jsx
related:
  - "[[INDEX|generative]]"
  - "[[01-loop-layer|the loop layer]]"
  - "[[02-scoped-randomize|scoped randomize]]"
---

# Motion & Look Presets

Named param patches surfaced as **dropdowns** in the Parameters panel — a quick-select layer over the raw sliders. Two independent systems: motion (Frame/Form) and look.

## Motion Frame / Form presets (`src/editor/params/motionPresets.js`)

A loop family's motion splits into two orthogonal axes:

- **Frame** — the whole figure/pattern *moves* (spin, pan, flow, orbit).
- **Form** — it modulates *in place* (pulse, sweep, ripple, breathe).

The tables are the labs quick-select tables translated to the editor schemas, keyed by loop id. Each preset **patches only its own axis**, so the two compose freely — a Frame:`spin` and a Form:`breathe` coexist. `static` is the real motion-off for its axis.

**Tables by loop id** (via `motionPresetsFor(loopId, layer)`):

| Loop | Frame / Form source | Notes |
|---|---|---|
| `scanline` | `SCANLINE` | flow/spin (Frame), sweep/pulse (Form). |
| `pattern-rules` | resolved per `layer.render` | `tiles` → tile-pan + per-cell; `field` → band frame (organic gets a two-axis variant); `weave` → per-crossing. |
| `math-waveform` | `WAVEFORM` | flow/panDir (Frame), speed/stagger/pulse/fade/swing (Form). |
| `math-surface` | `SURFACE` | integer orbit turns (Frame), morph/ripple/fade (Form). |
| `math-field` | per `layer.kind` | `scalar` → flow/swirl/drift; `complex` → hue/cspin/czoom + rings. |
| *vp-carrying loops* | `VIEWPORT` fallback | Any loop that got the contract-layer viewport fold (`vpSpin` present) but has no native table → the labs viewport Frame/Form (spin/zoom, pulse/wobble). |

Values are the labs tables verified key-by-key against the editor schema; params the editor never ported (labs drift angle, sway/tilt/dolly, `formSpeed`) are dropped or mapped to the nearest legal quantized value. Rates are quantized to **whole loop cycles** (e.g. labs spin `0.6` → `1`) so the loop stays seamless.

## The `Custom` sentinel

The dropdown value lives on the layer as `_framePreset` / `_formPreset`. Two events set it to `'custom'`:

1. **Picking a preset from the picker** — a full param reset no longer matches any motion preset ([[01-loop-layer|the loop layer]] `applyPreset`).
2. **Hand-editing any param the axis covers** — `axisKeys(presets)` is the union of keys an axis's presets patch; `ParametersPanel.setParamProp` flips `_framePreset`/`_formPreset` to `custom` whenever an edited key is in that union.

`Custom` is only offered in the dropdown **while it is active** (`motionOpts`), so it never reads as a second pickable "off".

## Look presets (`src/editor/params/lookPresets.js`)

The labs LOOK recipes — palette / iridescence combos overlaid on top of any preset — as loop-keyed param patches. Currently the **Soft Forms** looks (`softforms` + `softforms3d` share one list, `SOFTFORMS_LOOKS`):

`Spectrum` · `Iris` · `Aqua` · `Magma` · `Candy` · `Noir` — each a patch of `palette` / `spectral` / `hue` / `irid` (+ `rim` for Noir), all keys in the shared `SOFTFORMS_PARAMS` schema.

`lookPresetsFor(loopId)` returns the map or `null`. **Iridescent is deliberately absent**: its catalog def already carries a `look` param whose `GRAD_LOOKS` recipes are overlaid engine-side on every `setParams`, so a separate Look dropdown would double up.

## Panel wiring (`ParametersPanel.jsx` → `LoopFields`)

- **Look** dropdown (Generate tab) — `applyLook(name)` patches `{ _lookPreset: name, ...looks[name] }`.
- **Frame / Form** dropdowns (Animation tab) — `applyMotionPreset(axisProp, presets)(id)` patches `{ [axisProp]: id, ...preset.params }`.
- **Hand-edit hand-off** — `setParamProp(k, v)` flips whichever of `_framePreset` / `_formPreset` / `_lookPreset` cover `k` to `custom`, in the same coalesced write.
- **Randomize hand-off** — a motion-scope or look-touching roll flips the matching dropdown to `custom` too (see [[02-scoped-randomize|scoped randomize]]).
</content>
