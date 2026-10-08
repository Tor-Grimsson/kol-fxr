---
title: Parameter graph + inspector controls
type: decisions
status: archived
updated: 2026-07-02
description: One reactive param model behind inspector controls, keyframes, modulation, and effect knobs — so they don't drift into four systems. Resolved to Option B (schema-driven graph); fully executed.
aliases:
  - param-graph
  - param-graph-rfc
tags:
  - project/kol-fxr
  - editor/parameters
  - domain/architecture
  - domain/motion
related:
  - "[[2026-07-01-render-fork|render-fork decision]]"
  - "[[../05-parameters-binding/INDEX|parameters & binding]]"
  - "[[INDEX|research index]]"
---

# Parameter graph + inspector controls

The single load-bearing bet for the whole roadmap. Get this right and timeline / modulation / effect knobs / inspector controls are all one system; get it wrong and they're four systems that drift.

## Why

Four separate asks secretly want the same primitive:

- **Inspector controls** — render an editable knob for a prop.
- **Timeline keyframes** — a prop's value over time.
- **Modulation** — a prop driven live by mouse / audio / joystick.
- **Effect params** — an effect's knobs, which also want keyframes and modulation.

Build these independently and you get four value models that disagree at the edges (undo, serialization, "what's the current value"). One graph makes them views onto shared state.

## Current state

Layer props are plain fields on the layer object (`x`, `color`, `strokeWidth`, …). The inspector hand-wires a control per prop per type (`PositionFields`, `ColorField`, the flip/rotate row). There is no notion of a prop being anything other than a constant.

## Target — the graph

Every animatable prop resolves through a **binding**:

- `constant` — a literal value (today's behavior; the default).
- `track` — keyframes: `[{ t, value, easing }]`, evaluated at the current time.
- `modulation` — `{ sourceId, transform }` where a registered source emits a signal and `transform` maps it (range, curve, math) onto the prop's domain.

A layer declares its params via a **schema** (`{ key, type, min, max, step, default, animatable }`). The inspector reads the schema and auto-renders the right control — no per-type wiring. The same schema tells the timeline which tracks are legal and the modulation UI which targets exist.

A **runtime evaluator** resolves the graph to concrete values each frame when the transport is playing (or once, on edit, when it's stopped). Rendering-agnostic: a resolved value feeds a DOM layer or a GL layer identically.

## Options considered

- **A — plain fields + bespoke timeline + bespoke modulation (rejected).** Fastest to a first demo, but three value models and guaranteed drift. This is the trap.
- **B — one param graph, schema-driven (recommended).** More upfront design; every later feature is a thin consumer. Matches how effect.app / Rive / AE actually model this.
- **C — adopt a full reactive-signals library.** Overkill and a heavy dep for what a small evaluator does; revisit only if hand-rolled evaluation can't keep 60fps.

## Recommendation

**Option B.** Build schema → evaluator → sources, in that order, on the existing DOM/SVG layers so it pays off before any GL work.

## Audit findings (kol-labs-single effects repo, 2026-07-01)

**~75% of this graph already exists in the effects repo — the work is consolidation, not invention.** Adopt/port its model rather than designing from scratch.

- **Declarative param schema already exists** — the `src/loops/contract.js` "Loop contract": `{ key, label, type:'range'|'color'|'toggle'|'select', min, max, step, default }` + extensions (`role` theme-binding, `noRandom`, `tab`). ~44 loop modules + ~120 effects carry schemas. **But there are two grammars** — loops use a `params:[{…}]` array, `src/pages/effects/effects.config.js` uses a `params:{key:{…}}` object — and **3–4 duplicate auto-render panels** (`LoopControls`, `interfaces/ParamControls`, `radar/FxParamControl`, `penrose/knobs`). Consolidate to **one schema + one inspector**.
- **Pure-time animation already exists** — a loop is a pure function of normalized `u∈[0,1]` (`contract.js`), driven by a shared transport-aware player (`LoopPlayer2D`: seek/setParams/setTransport/loop/duration). That *is* the evaluator+transport of Phase 2, minus keyframe tracks.
- **Live modulation already exists** — Web Audio `AnalyserNode` bands (`level/bass/mid/high`, `src/lib/audioSource.js`), TouchDesigner-style expression params (`t`, oscillators, audio bands as free variables, `src/lib/exprParam.js` `resolveParams` per frame), and spatial LFO "sweeps." The `Slider`'s `liveGet` prop + the `LiveClock` context are ready-made injection seams for external sources. Seeded PRNG + schema-driven randomizer already present (`src/lib/rng.js`).
- **Genuinely new (the real 25%):** (1) a **keyframe timeline with tracks** — the repo deliberately uses expressions *instead of* keyframes (`exprParam.js` is explicitly the anti-keyframe approach), so tracks are new; (2) **pointer/mouse as a modulation source** — only audio + transport-time are first-class variables today (there's no `mouseX` in the expression grammar), though `liveGet`/`LiveClock` are where a pointer/timeline driver plugs in without touching effects.

**Revised plan:** Phase 1 (schema) becomes *unify the two existing grammars into one canonical descriptor and collapse the duplicate panels into one inspector*. Phase 2 keeps `u`-based pure-time (lift `LoopPlayer2D`'s transport) and **adds** the new keyframe-track layer on top of expressions. Phase 3 lifts the audio/expression modulation layer wholesale and adds pointer as a new source via the `liveGet` seam.

## Phases

1. **Schema** — param descriptors per layer type; inspector auto-renders from them. Ship with all props still `constant` (no behavior change, pure refactor win).
2. **Evaluator** — bindings + a transport (play/pause/loop/scrub); tracks resolve over time. This is the timeline.
3. **Sources** — a modulation-source registry (time, mouse, audio FFT, joystick); bindings can target a source.

## Decisions (resolved 2026-07-02)

All three open questions answered so Phase 1 can start. Import order: **self-contained generators before scene-sampler effects**, and within generators, **Loops first** — it's the one item in the "Generative" family already built to the portable contract (zero-dep canvas2d, declarative params, registry, `LoopPlayer` runtime). The rest of that family is self-contained but bespoke per-page: the three.js ones (Drift, Gradients, Soft Forms, 3D Scene — the last IS the 3D-layer item) are Wave 2 on the same seam; canvas2d bespoke ones (Math, Penrose, Pattern, Scanline) port individually.

- **Q1 — Keyframe interpolation → cubic-bezier tuple in data, named presets in UI.** Each segment's easing is a bezier 4-tuple (`linear=[0,0,1,1]`, `ease=[.25,.1,.25,1]`) plus a `'hold'` sentinel for discrete steps. UI ships named presets (dropdown) first; a curve editor is purely-additive later UI — no data migration, because the model is always the general curve.
- **Q2 — Serialization → inline on the layer prop.** A prop value is a tagged union: a raw constant (back-compat: existing layers are all-constants) or a binding object. Every layer op (duplicate/group/undo/delete/draft/preset) deep-copies the layer today, so animation rides along free; a sidecar doc would force two-structure sync — the drift trap.
- **Q3 — Export → preview-only first.** Live motion is the Phase 2 payoff; PNG/SVG export already captures the current frame. Video bake is a later phase, lifting the repo's `recordLoop` (MediaRecorder, one seamless `u:0→1` sweep).

### Canonical shapes Phase 1 builds

```js
// param descriptor (adopt loops' array grammar; normalize effects' object grammar into it)
{ key, label, type: 'range'|'color'|'toggle'|'select'|'point',
  min, max, step, default, options?, animatable? }

// prop value — resolver treats a bare value as constant (free back-compat)
value ::= <raw>
        | { bind:'track', keys:[{ t, v, easing }] }   // easing: [x1,y1,x2,y2] | 'hold'
        | { bind:'mod',   source, transform }          // transform: {range, curve, ...}
```

## Superseded open questions

~~Keyframe interpolation / serialization location / export baking~~ — all resolved above.

## Acceptance

The color-modes feature and at least one motion demo (a keyframed prop + a mouse-modulated prop) both run through the *same* evaluator, with undo/serialization working, before effects work starts.
