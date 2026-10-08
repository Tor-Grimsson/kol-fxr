---
title: Response & Expression
type: reference
status: active
updated: 2026-07-08
description: The per-binding response-shaping pipeline (invert → smooth → curve → remap) applied to every mod source, and the safe expression compiler + live plot behind the expr source.
aliases:
  - response-and-expression
  - response-shaping
tags:
  - project/kol-fxr
  - editor/modulation
  - domain/animation
covers:
  - the four-op response-shaping pipeline and its identity defaults
  - the expr compiler (strict prelude, shadowed globals, ponytail ceiling)
  - the seconds-vs-loop-time contract and usesLive flag
  - the transform editor + live expression plot in the Animation tab
  - typing an expression directly into a value (RangeField)
sources:
  - src/editor/params/resolve.js
  - src/editor/params/expr.js
  - src/editor/params/ModulationEditor.jsx
  - src/editor/params/AutoControls.jsx
related:
  - "[[INDEX|parameters & binding]]"
  - "[[02-binding-and-sources|binding & sources]]"
  - "[[04-transport-and-timeline|transport & timeline]]"
---

# Response & Expression

## Response shaping

Every `{ bind:'mod' }` binding's normalized 0..1 signal passes through four ops in a fixed order before it hits the param's range, in `resolveMod` (`resolve.js`). Each op is **identity at its default**, so pre-existing bindings are bit-unchanged — the pipeline was added without touching stored values.

```
source 0..1 ──▶ invert ──▶ smooth (EMA) ──▶ curve (exp) ──▶ remap (range) ──▶ value
```

| Op | Transform field | Default | Effect |
|---|---|---|---|
| **invert** | `invert` | off | `raw = 1 - raw` — flip the signal. |
| **smooth** | `smooth` (0..0.95) | `0` (raw) | EMA temporal lag. `raw = prev + (raw - prev) * (1 - min(0.95, smooth))`; heavier `smooth` = more lag. |
| **curve** | `curve` (0.25..4) | `1` (linear) | Response exponent `raw^curve` on the 0..1 signal (only applied when `>0` and `≠1`). |
| **remap** | `range` `[lo, hi]` | param `[min,max]` | Spread 0..1 into `lo + (hi-lo)·raw`. `range` **is** the output remap — labs' lo/hi ≡ our range, no separate second mapping. If no range, the 0..1 signal passes through. |

The transform editor — `ModulationEditor`, in **Parameters → Animation tab** (moved out of the bind-dot popover, which is now just the source picker) — exposes Range, Invert, Smooth (`0–0.95` step `0.05`), Curve (`0.25–4` step `0.05`), plus LFO rate/phase where relevant. `ModulationList` renders one editor per bound param on the layer.

### Smoothing state

The EMA is stateful — its previous value is keyed on the **binding object** in a `WeakMap` (`smoothState`). Bindings persist in layer state until rewritten, so object identity is the natural key; a transform rewrite yields a new object and thus resets the smoother, which is correct. The EMA advances once per `resolveMod` call, so a resolve pass must run exactly once per frame.

A deterministic pass (the webm bake) must not inherit or advance live EMAs — it supplies its own private store via `ctx.smoothState`. `makeSmoothingState()` mints a fresh `WeakMap`; spread it into every ctx of that pass: `{ ...transport.getCtx(), smoothState: makeSmoothingState() }`.

## Expression source

`src/editor/params/expr.js` is the compiler behind the `expr` modulation source — a port of labs' `exprParam.js`. A hand-rolled `new Function()` compiler (no parser dependency), compiled once per string and cached forever.

### Contract

- **Time is SECONDS.** `t` is the engine playhead in seconds, exactly like labs. The editor's `ctx.t` is normalized loop time 0..1, so the `expr` source feeds `ctx.t * loopSeconds`. With an integer loop length every period-1 oscillator (`wave`/`saw`/`tri`/`pulse`/`ease`/`bell`/`step`) wraps seamlessly at the loop point, and the labs example strings keep their exact speeds.
- **Output is the normalized source signal.** Oscillators are 0..1 and `sampleSource` clamps the result before `transform.range` maps it onto the param. `max` is the variable 1 and `min` the variable 0 (the oscilloscope knob-range idiom) — **not** `Math.min`/`Math.max`. Use `clamp(x,a,b)` where a picker is needed.
- **Prelude** exposes a rich Math scope: constants (`PI TAU PHI E SQRT2 …`), the Math functions, and helpers `frac mod clamp lerp smooth wave saw tri pulse ease bell step rand`.
- **`usesLive`** flags an expression that references an audio band (`level`/`bass`/`mid`/`high`) or `rand()` — the consumer must re-sample per frame even while the transport is paused. The `expr` source re-warms a decaying `active` flag on each live sample, so the paused-notify loop stays alive ~0.5s past the last live binding.

### Safety — the ponytail ceiling

The compiler runs under `"use strict"` and shadows the dangerous globals as never-passed parameters (bound to `undefined`) so an expression string — which may arrive in a loaded/shared settings `.json` — can't reach the network, DOM, or storage: `globalThis window self document fetch XMLHttpRequest localStorage sessionStorage indexedDB navigator location top parent frames opener Function WebSocket Worker importScripts`. `eval`/`import` are reserved in strict code and can't be shadowed.

This is **scope-shadowing, not a real sandbox** — constructor chains can still escape (`ponytail:` ceiling in the source). The documented upgrade path if it ever matters is SES / worker isolation.

Failure modes are total: a compile/probe failure yields `{ ok:false, fn:()=>0 }`; the compiled `fn` never throws and never returns a non-finite value — a runtime fault returns the last good value for that expression, or 0 before one exists. A probe at `t=1` with silent audio rejects strings that parse but don't evaluate to a number, so half-typed input degrades to `ok:false`. `isValidExpr(str)` exposes the flag.

### Entering an expression

Two ways to bind the `expr` source, both landing on the same `{ bind:'mod', source:'expr', transform:{ expr, range } }`:

1. **Dot → Expression**, then edit the string in the Animation-tab `ModulationEditor` (with the plot + click-to-fill examples).
2. **Direct input** — type the expression straight into the param's value box (`RangeField`, [[02-binding-and-sources#direct-input-on-the-value|direct input]]). Any non-numeric string that `compileExpr` accepts becomes the binding; a number there is a constant instead.

### Live plot

The Animation-tab `ModulationEditor` renders `ExprPlot` when the `expr` source is bound — an oscilloscope-lite canvas (labs' `Oscilloscope.jsx` draw loop, trimmed). It plots the expression over ONE loop (`t = 0..loopSeconds` across the width), with:

- grid rails + labels at the curve's min / mid / max;
- dashed reference rails at the clamp bounds 0 / 1 (labs' knob-range references, normalized);
- a playhead at the transport's current loop phase, the live trace up to it, and the current-value dot.

It redraws per rAF while mounted, so audio/rand expressions animate live. Colors read the mounted element's computed style (text color + `--kol-accent-primary`), so the plot follows the editor theme. Below it, a click-to-fill list of example strings (`wave(t*2)`, `saw(t)*0.8`, `pulse(t, 0.3)`, `rand()`, …) patches `transform.expr`.
</content>
