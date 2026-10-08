---
title: Binding & Sources
type: reference
status: active
updated: 2026-07-08
description: The bind dot (a pure source picker) and the binding union, direct number/expression input on the value, the modulation-source registry, every source family (time, pointer, layer-local, LFO, audio, MIDI, gamepad, expression) with learn, and the audio/MIDI/gamepad input backends + their external-connection gates.
aliases:
  - binding-and-sources
  - modulation-sources
tags:
  - project/kol-fxr
  - editor/modulation
  - domain/animation
covers:
  - BindDot as a pure source picker + the tagged-union value model
  - direct input (number = constant, expression = bind) via RangeField
  - the transform editor's home in the Animation tab (ModulationEditor)
  - the source registry contract
  - all source families incl. gamepad (collapsed to one Joystick entry) + learn
  - audioBands / midi / gamepad input backends + secure-context / permission gates
sources:
  - src/editor/params/BindDot.jsx
  - src/editor/params/ModulationEditor.jsx
  - src/editor/params/AutoControls.jsx
  - src/editor/params/sources.js
  - src/editor/params/audioBands.js
  - src/editor/params/midi.js
  - src/editor/params/gamepad.js
related:
  - "[[INDEX|parameters & binding]]"
  - "[[03-response-and-expression|response & expression]]"
  - "[[04-transport-and-timeline|transport & timeline]]"
---

# Binding & Sources

A layer prop stores one of three shapes. `isBinding(v)` (an object with a string `bind`) distinguishes a binding from a constant.

```
<raw>                                     constant — resolveValue is identity
{ bind:'track', keys:[{t,v,easing}] }     keyframes over normalized loop time
{ bind:'mod',   source, transform }       live source → shaped → mapped onto range
```

## The bind dot — a source picker

`BindDot.jsx` is the per-field **modulate** affordance rendered beside every animatable control (via `AutoControls`'s `renderAnimate` seam). A hollow dot means constant; a filled accent dot means bound. Clicking opens a **pure source picker** — no settings, just the list:

| Menu entry | Effect |
|---|---|
| **Constant** | Unbind — the prop freezes at its current resolved value (`resolveValue(value, transport.getCtx(), layer)`). |
| **Keyframes** | Write a flat 2-key track at the current value; the [[04-transport-and-timeline\|timeline]] edits it. |
| **‹source›** | `{ bind:'mod', source, transform:{ range:[min,max] } }` — the param's `[min,max]` is the default output range. Picking closes the popover. |

Color params only offer Constant / Keyframes (no mod sources — the source signal is scalar).

The picker is **height-capped** — `maxHeight: 50vh` + internal scroll, set on the floating element itself (`PopoverPanel`'s `style`, merged onto `refs.setFloating`) so `@floating-ui`'s flip/shift can keep it on-screen; a taller list can no longer push the page. The ~16 individual gamepad sources are **collapsed into one "Joystick" entry** (binds the first pad axis; re-point the exact control with Learn in the Animation tab) so the list stays short.

**The transform editor is NOT in this popover.** Range, Invert, Smooth, Curve, the expression field + plot, and MIDI/gamepad Learn all live in **Parameters → Animation tab** — `ModulationEditor`, rendered once per bound param by `ModulationList`. The popover only *picks* the source; you *shape* it in the Animation tab. (This split is why the popover can't overflow the viewport anymore.) See [[03-response-and-expression|response & expression]] for what the transform fields do.

## Direct input on the value

A range param's value box (`RangeField` in `AutoControls.jsx`) takes direct input, TouchDesigner-style — no need to open the dot:

- Type a **number** → a constant (clamped to `[min,max]`).
- Type an **expression** (`sin(t)`, `wave(t*2)`, anything non-numeric that compiles) → binds it to the `expr` source, keeping the param's `[min,max]` as the range.
- A string that won't compile reverts to the shown value.

While a param is bound, its slider goes read-only and the thumb **tracks the live resolved value** every transport tick (subscribes to the transport only when bound); the box shows the expression (still editable) or the live number.

## The source registry

Sources are registered in `src/editor/params/sources.js`. A source turns live input into a normalized **0..1** signal that the resolver maps onto a param's range.

Registry entry contract:

| Field | Meaning |
|---|---|
| `id` | Unique key referenced by `{ bind:'mod', source: id }`. |
| `label` | Display name in the bind menu. |
| `sample(ctx, opts)` | `→ 0..1`. `ctx = { t, mouse, stage, epoch }`; `opts = { transform, layer }`. |
| `live` | True if the source changes outside transport time / mouse events (audio, MIDI, gamepad). The transport re-notifies per frame while one is active. |
| `ensure?` | Async setup on first bind (mic permission, MIDI access) — called from the bind UI so permission prompts ride a user gesture. |
| `active?()` | Live source currently producing a signal — polled by `anyLiveSourceActive()`. |
| `hidden?` | Kept out of the bind menu (back-compat aliases). |

`sampleSource(id, ctx, opts)` clamps every result to 0..1 (non-finite → 0). `anyLiveSourceActive()` is what the transport polls to keep notifying while paused — live modulation must track input without play.

## Source families

| Source(s) | id(s) | Signal |
|---|---|---|
| **Time** | `time` | `ctx.t` — normalized loop phase 0..1. |
| **Mouse** | `mouseX` `mouseY` | Pointer over the window, normalized. |
| **Layer-local pointer** | `layerX` `layerY` | Pointer within the layer's own bounds (0..1, clamped); 0.5 until the pointer enters the stage. Reads `ctx.stage` (virtual-canvas px, fed by `CanvasArea`). |
| **LFO** | `lfo-sine` `lfo-triangle` `lfo-square` | Pure functions of loop time — scrub-safe, seamless at integer rates. `rate` (cycles per loop) and `phase` (0..1) come from the transform. |
| **Audio** | `audio-level` `audio-bass` `audio-mid` `audio-high` | FFT bands from the shared analyser. `live`; `ensure` enables audio. (`audio` is a hidden back-compat alias to level.) |
| **MIDI** | `midi` | Last-seen CC value; `transform.cc` picks the knob (MIDI learn). |
| **Gamepad** | 16 ids, see below | Web Gamepad axes/buttons/derived; `learnGamepad` re-points the binding. |
| **Expression** | `expr` | A compiled expression over loop seconds; see [[03-response-and-expression\|response & expression]]. |

## Gamepad sources

`src/editor/params/gamepad.js` exposes `GAMEPAD_SOURCES` — 16 descriptors registered into the source registry. The bind-dot picker **collapses all 16 into a single "Joystick" entry** (it binds the first pad axis); the full set stays reachable — bind Joystick, then **Learn** in the Animation-tab editor to re-point to any stick / trigger / button. The Gamepad API is **poll-only**, so there is no persistent poll loop: each source reads `navigator.getGamepads()` live inside its `sample`, and the transport's tick re-samples every frame while a pad is connected (`active: padConnected`). Standard mapping (DualShock / DualSense / Xbox in Chrome).

| Group | ids | Read |
|---|---|---|
| Sticks (axes) | `pad-leftX` `pad-leftY` `pad-rightX` `pad-rightY` | axis −1..1 → 0..1 |
| Triggers (analog) | `pad-LT` (L2) `pad-RT` (R2) | button analog value 0..1 |
| Face buttons | `pad-a` `pad-b` `pad-x` `pad-y` | pressed bit 0/1 |
| Bumpers | `pad-L1` `pad-R1` | pressed bit 0/1 |
| Derived | `pad-leftAngle` `pad-leftForce` `pad-rightAngle` `pad-rightForce` | stick angle (atan2 → 0..1) / push magnitude (hypot, clamped) |

Two hidden aliases (`padX` / `padY`) keep pre-expansion bindings pointed at the left stick.

**`learnGamepad()`** mirrors MIDI learn: arm, then wiggle a stick / press a button; it resolves with the matching source id (or null after a 10s timeout). Poll-based (spins a short-lived rAF, tears itself down) because the API has no input events. An axis must travel half its range (`AXIS_MOVE = 0.5`) to count, so resting drift never false-triggers. Because the pad has many discrete sources, learn **re-points** the binding's `source` (keeping the transform) rather than patching a transform field like MIDI does. Derived sticks are not learnable — picked from the menu.

## Input backends

The live sources read three feature-detected backends. Each degrades to reading 0 when unavailable, so a bound param simply holds still.

### Connecting externally (repo behaviour)

Three source families reach **outside the page** to real device / browser APIs — each gated, each triggered only by a user gesture (the pick calls the source's `ensure()`, so permission prompts and autoplay policy are satisfied). Nothing connects until you bind a source; there is no background device polling.

| Source | External API | Gate |
|---|---|---|
| **Mic** (`audio-*`) | `getUserMedia` | **Secure context only** (`https:` or `localhost`). On an http LAN-IP dev URL `navigator.mediaDevices` is `undefined` and the mic never prompts. `AudioInputRow` guards `window.isSecureContext` and surfaces the reason rather than silently reverting to Off. |
| **MIDI** (`midi`) | `requestMIDIAccess` (Web MIDI) | Permission prompt on first use; Chrome-first (Firefox behind a flag). |
| **Joystick** (`pad-*`) | Gamepad API | No permission, but the pad only appears in `navigator.getGamepads()` after a first input. |

The **audio-file** input is local (a `File` → object-URL `<audio>` looped through the analyser) — no network, but it is still `.play()`-gated by the browser's autoplay policy, hence the user-gesture requirement.

### Audio — `audioBands.js`

One analyser whose smoothed bands feed the audio sources. Ported from labs `audioSource.js` (bin-fraction FFT split + asymmetric smoothing), extended with an audio-**file** input.

- `enableAudio({ file? })` — mic when no file; a File/Blob routes a looping, audible `<audio>` through the analyser instead. Idempotent per kind; switching mic ↔ file tears down and rebuilds. Off until a user gesture (mic permission / autoplay policy).
- Bands: `level` (RMS of time-domain data), `bass` / `mid` / `high` (frequency bins split at 4% / 25% of the spectrum). Smoothing is asymmetric — fast **attack** (0.5) so transients read, slow **release** (0.12) so bound params don't strobe.
- `readAudio()` returns the live mutated `{ level, bass, mid, high }` object; `isAudioEnabled()` / `audioSourceKind()` report state. The transport footer's audio row (`AudioInputRow.jsx`) toggles Off · Mic · Track.

### MIDI — `midi.js`

Web MIDI CC values. One `requestMIDIAccess`, all inputs listened, hot-plug aware (`onstatechange` re-wires). Keeps the last-seen value per CC number (any channel) as 0..1 (`d2 / 127`, control-change status only). `readCC(n)` / `anyCCSeen()`. **`learnCC()`** is a one-shot promise resolving with the next CC number touched (or null on a 10s timeout so an armed learn can't dangle). Chrome-first (Firefox behind a flag).

### Gamepad — `gamepad.js`

Covered above. `readPad()` returns the first connected pad; `padConnected()` gates the live re-sample; `isGamepadSource(id)` recognizes both `pad-*` ids and the `padX`/`padY` aliases.
</content>
