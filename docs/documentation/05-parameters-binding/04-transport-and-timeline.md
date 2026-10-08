---
title: Transport & Timeline
type: reference
status: active
updated: 2026-10-08
description: The transport clock singleton (play/pause/stop/rewind, loop-seconds, pointer-interest gating, resetEpoch), the resolver's deep/smoothing passes, and the keyframe timeline dock.
aliases:
  - transport-and-timeline
  - transport
tags:
  - project/kol-fxr
  - editor/params
  - domain/animation
covers:
  - the transport singleton + external-store subscription model
  - resetEpoch and what it governs
  - pointer-interest gating
  - resolveLayer / resolveLayersDeep (export path)
  - the keyframe timeline (tracks, diamonds, key editor)
sources:
  - src/editor/params/transport.js
  - src/editor/params/TransportBar.jsx
  - src/editor/params/resolve.js
  - src/editor/params/TimelineDock.jsx
related:
  - "[[INDEX|parameters & binding]]"
  - "[[02-binding-and-sources|binding & sources]]"
  - "[[03-response-and-expression|response & expression]]"
---

# Transport & Timeline

## The transport clock

`src/editor/params/transport.js` is a module-level **singleton** (one editor instance) — the motion clock plus the live-input store. It exposes normalized time `t ∈ [0,1]` (matching the loops' `u`) that wraps at `loopSeconds`, plus a live pointer position for modulation.

It is an **external store, not React context**, so a 60fps tick re-renders ONLY the handful of bound-layer renderers, never the whole tree. Bound layers subscribe via `useTransportCtx(true)`; static layers pass `false` and get a stable no-op subscription — the un-animated editor pays nothing.

| Method | Effect |
|---|---|
| `play()` / `pause()` / `toggle()` | Run / hold the clock. Pause holds every sim exactly where it is. |
| `seek(frac)` | Jump to a normalized phase. |
| `stop()` | pause + `t=0` + **new epoch**. |
| `rewind()` | `t=0` + **new epoch** (keeps the play state). |
| `setLoopSeconds(s)` | Loop length in seconds (min 0.1). |
| `getCtx()` | `{ t, mouse, stage, epoch }` — the per-frame resolve context. |
| `setStagePointer(x,y)` | Stage pointer in virtual px (feeds `layerX`/`layerY`). |
| `setPointerInterest(on)` | Enable/disable pointer notifies (see gating). |

`TransportBar.jsx` is the UI — two joined icon groups flanking a loop-seconds readout: `[▶ | ❚❚]  Loop / N s  [■ | ◀◀]`. Space is **not** bound to play/pause here (Space is pan in this editor).

### The rАF loop

`tick` runs only while there is work — `playing` or any subscriber. While playing it advances `t` and notifies. While paused with subscribers it still notifies **if `anyLiveSourceActive()`** — live sources (audio, gamepad, MIDI) change outside play/mouse events, so bound layers must re-sample per frame even paused. With no work the loop parks itself (`raf = null`).

### resetEpoch

`epoch` is a monotonic counter bumped **only** by `stop()` and `rewind()` — never by `pause()`. Pause must hold every sim exactly where it is; stop/rewind mean "fresh run" (matching labs transport semantics). Free-running / stateful consumers key their reset on it:

- sims — math-spinner/orbits trails clear, penrose retrigger, optic reaction-diffusion reseed;
- video — `currentTime` / playbackRate / loop / mute reset, rewind → `trimIn`.

Snapshot hooks (`useTransportPlaying`, `useTransportEpoch`) re-render a consumer only when that value changes (not per tick), so a plain `<video>` layer can follow play/pause/reset without paying the 60fps subscription the bound-layer renderers do.

### Pointer-interest gating

`mousemove` and stage-pointer notifies are gated on `pointerInterest`, toggled by the compose layer-state watcher whenever any layer carries a mouse/stage-driven binding (`mouseX/Y`, `layerX/Y`). An editor with zero pointer bindings pays nothing for cursor movement — position state still updates, so `getCtx()` is fresh the moment a pointer binding appears.

## The resolver

`resolve.js` turns stored VALUES into concrete per-frame values.

| Function | Purpose |
|---|---|
| `resolveValue(value, ctx, layer)` | One value → concrete. Identity for constants; `track` interpolates keys; `mod` samples + shapes (see [[03-response-and-expression\|response & expression]]). |
| `hasBindings(layer)` | Any binding on the layer, incl. nested `layer.filters[i].params`. Lets the renderer skip per-frame work for fully-static layers. |
| `resolveLayer(layer, ctx)` | Flatten every binding on a layer (flat props + nested filter-stage params) to concrete values. Returns the same object untouched when static. |
| `resolveLayersDeep(layers, ctx)` | Resolve a whole layer tree (groups/children included) — the **export path** so an SVG/PNG snapshot captures the current frame of any animated prop. Identity for fully-static trees. |

Track interpolation: numbers lerp; `#rrggbb` colors lerp per-channel in RGB; anything else (palette refs, enums) steps at the segment start. Easing per segment via `ease(a.easing, …)`.

## The keyframe timeline

`TimelineDock.jsx` is docked below the canvas (via the `canvas.footer` slot). It **collapses to nothing** while the composition has no keyframe tracks — the static editor pays zero chrome; it appears when a prop is bound to Keyframes via its bind dot.

```
[t readout] [scrub ruler ...................... playhead]
[Layer · prop] [lane: ◆ diamonds at t, click adds, drag moves]
[selected key: value · easing · delete]
```

- **`collectTracks`** walks the layer tree for every `{ bind:'track' }` value and lists one lane per track.
- **Scrub ruler** — click/drag seeks the transport.
- **Lane** — click empty space adds a key at the click position, valued at the track's current value there (no visual jump). Diamonds drag to move (committed once on pointer-up — one undo entry per gesture, not a flood). Alt-click deletes (a minimum of one key stays; an empty track is a broken binding).
- **Selected-key editor** — edits the key's value and per-key easing (`EASING_OPTIONS`), or deletes it.

All writes go through `updateLayer`, re-sorting keys by `t`.
</content>

## Morph — a file kind, built in labs' Morph tab

A **morph** tweens between steps of one generator (plan 09, `src/editor/morph/`). It is a file kind: **New File → Morph** opens labs on the Morph tab, which sits in the right rail beside Generate · Style · Animation. Empty, the tab offers two doors — *From presets* (the catalog) and *From my files* (saved labs files); the first pick puts that generator on the stage and fixes the morph's generator. Then: a numbered step list (*+ Add step* through the doors, *Add current* snapshots the stage, ↑ ↓ reorder, × remove), one row for curve · Loop / Ping-pong / Once · loop length, and Save. Two steps and the stage plays.

**The editing rule.** Click a step: its settings go on the stage static, the transport pauses, and the sliders write to that step. Play, or leaving the tab, rebuilds the morph from the steps and runs it again.

**What the file holds.** `mode: 'morph'` and `morph: { loopId, steps, curve, cycle, seconds }` — each step a *copy* of the generator's settings (schema keys) plus where it came from, for the label. Playback is the keyframe tracks `buildMorph` makes from the steps (range · int · color lerp with the curve; discrete params and the seed get `hold` keys; Loop closes on the first step), so the dock shows the lanes and Save and the bake work as for any track. The randomiser opens a morph file and plays it; its Morph tab is read-only. One generator per morph. `buildMorph.check.mjs` is the builder's check.
