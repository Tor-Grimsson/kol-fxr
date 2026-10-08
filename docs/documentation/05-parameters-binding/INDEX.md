---
title: Parameters & Binding
type: index
status: active
updated: 2026-07-08
description: The param-graph — a declarative schema that auto-renders controls, and a binding layer that drives any numeric prop from keyframes or a live source (time, pointer, audio, MIDI, LFO, gamepad, expression) through a response-shaping pipeline, clocked by the transport.
aliases:
  - parameters-binding
  - param-graph
tags:
  - project/kol-fxr
  - editor/params
  - editor/modulation
  - domain/animation
related:
  - "[[../01-hierarchy/INDEX|hierarchy]]"
  - "[[01-schema-and-controls|schema & controls]]"
  - "[[02-binding-and-sources|binding & sources]]"
  - "[[03-response-and-expression|response & expression]]"
  - "[[04-transport-and-timeline|transport & timeline]]"
---

# Parameters & Binding

Two systems live in `src/editor/params/`, and they compose into one graph:

1. **Param schema** — one declarative descriptor grammar for every layer type's tunable knobs. The inspector auto-renders controls from it (`AutoControls`), so there is no hand-wired per-type JSX. The grammar is the canonical dialect the loop repo (kol-labs `contract.js`) and this editor normalize to, so imported generator/effect modules' `params:[…]` arrays drop in untranslated.
2. **Binding** — any prop's stored VALUE is a tagged union. A raw value is a constant (the whole static editor, zero overhead). A `{bind:'track'}` value is a keyframe track. A `{bind:'mod'}` value is a live source mapped onto the param's range. `resolveValue` turns a VALUE into a concrete value for the current frame.

The bridge between them is the **bind dot** (`BindDot.jsx`) — a small **source picker** beside every animatable control that converts a raw value into a binding. The binding's transform is shaped in the **Animation tab** (`ModulationEditor`), and a number or expression can be typed straight into the value box (`RangeField`).

## The value model

```
prop value  =  <raw>                                     constant (identity resolve)
            |  { bind:'track', keys:[{t,v,easing}] }     keyframes over normalized time
            |  { bind:'mod', source, transform }         live source → shaped → mapped
```

`resolveValue(value, ctx, layer)` is identity until a binding is added — so an un-animated composition pays nothing. `ctx = { t, mouse, stage, epoch }` is supplied by the transport each frame; sources resolve through the modulation-source registry. See [[04-transport-and-timeline|transport & timeline]] for `resolveLayer` / `resolveLayersDeep`.

## Data flow, one bound frame

```
transport tick ──▶ ctx {t, mouse, stage, epoch}
                        │
   source.sample(ctx, {transform, layer}) ──▶ raw 0..1
                        │
   invert → smooth(EMA) → curve(exp) → remap(range) ──▶ concrete value   (resolve.js)
                        │
   resolveLayer(layer, ctx) ──▶ flat concrete layer ──▶ renderer
```

## Sections

| Doc | Covers |
|---|---|
| [[01-schema-and-controls\|schema & controls]] | The descriptor grammar (`range`/`select`/`segmented`/`toggle`/`text`/`color`; `section`/`tab`/`when`/`animatable`/`noRandom`/`role`), how `AutoControls` renders it, and the shared control idioms (`NumberField` draft/commit, `ColorField`, `TreePicker`). |
| [[02-binding-and-sources\|binding & sources]] | The bind dot, the binding union, the source registry, and every source family — time, pointer, layer-local, LFO, audio bands, MIDI (with learn), gamepad (16 sources + learn), expression — plus the audio/MIDI/gamepad input backends. |
| [[03-response-and-expression\|response & expression]] | The per-binding response-shaping pipeline (invert → smooth → curve → remap) and the safe expression compiler + live plot. |
| [[04-transport-and-timeline\|transport & timeline]] | The transport clock (play/pause/stop/rewind, loop-seconds, pointer-interest gating, `resetEpoch`), the resolver's deep/smoothing passes, and the keyframe timeline. |

## Source map

All under `src/editor/params/`:

| File | Role |
|---|---|
| `schema.js` | Grammar helpers: `schemaDefaults` · `visibleParams` · `isAnimatable` · `paramTab` · `paramSection`. |
| `AutoControls.jsx` | Schema → controls renderer; `RangeField` gives range params direct number/expression input. |
| `BindDot.jsx` | Per-field modulate affordance — a pure source picker (height-capped, gamepad collapsed to one Joystick entry). |
| `ModulationEditor.jsx` | The Animation-tab transform editor (range/invert/smooth/curve, expr field + plot, MIDI/gamepad learn) + `ModulationList`. |
| `sources.js` | Modulation-source registry (all source families registered here). |
| `resolve.js` | `resolveValue` / `resolveLayer` / `resolveLayersDeep` + response shaping + smoothing state. |
| `expr.js` | Safe expression compiler for the `expr` source. |
| `transport.js` | Motion clock + live-input store singleton. |
| `TransportBar.jsx` | Play/pause/stop/rewind + loop-seconds UI. |
| `TimelineDock.jsx` | Keyframe timeline (tracks, diamonds, key editor). |
| `audioBands.js` | FFT analyser → level/bass/mid/high bands (mic or file). |
| `midi.js` | Web MIDI CC store + `learnCC`. |
| `gamepad.js` | Web Gamepad source set + `learnGamepad`. |
</content>
</invoke>
