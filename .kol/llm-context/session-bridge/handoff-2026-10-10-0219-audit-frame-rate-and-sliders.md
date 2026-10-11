# Handoff — 2026-10-10 02:19

## Goal of the current arc
Two audits, the whole app, so the user does not have to find them one by one: **(1) frame rate** across every effect, generator and chain combination, and **(2) every slider** — ranges, steps, quantisation, drag behaviour. The user, 2026-10-10: *"you fixed frame rate for one thing, but I dont wanna go through everything to find more frame rate issues … audit framerate and sliders"*. Write the findings as a plan first (`.kol/llm-plan/27-…`), then build — a `/kol-goal` when the user says go.

## Last actions taken (causal trail, newest first)
- Picker close on the header row (kol-component 0.251.0, `MediaPickerCloseOnTheHeaderRow` closed); Enter → Use in `MediaPickerDialog.jsx`.
- Frame rate, Scanline + Media motion — **profiled with the CDP Profiler**, not guessed:
  - `runChain` (`filters/fxCore.js`) skips a stage whose `def.stillKey(params)` is unchanged and keeps its intermediate un-invalidated, so later stages keep their pixel caches. `invalidateSource` now bumps `canvas._fxGen` (a reused source keeps its identity). Only `fx-media` defines `stillKey` so far.
  - `fx-media` tilt draws bands (~H/400) at ≤1× css instead of 1px rows at 2×.
  - Scanline: scan paths memoized (`pathsFor`, 8-entry map), dots one path per row.
  - Result at 4× CPU throttle (labs, photo → fx-media → scanline): moving media 12 → 15 fps = still; unthrottled 60 (Chrome, MBP). The user saw ~20 fps — their browser is likely Firefox (earlier shots), slower at canvas.
- Sweep cards rebuilt as rail sections (`SweepStack`, `sweepSchema` → AutoControls). Root cause of the "buggy sliders": a `Row` component defined INSIDE the render remounted every slider per change — a drag died a few px in.
- `fx-media` ranges widened (Drift ±16, Spin ±8 whole numbers — the loop only closes on whole cycles; Tile 1–16; Zoom/Tilt/Swing/Perspective continuous); sections regrouped.
- Labels: "· cycles" tails dropped (Speed, Flow ×3, Rate).
- Plan 26 (16 items) BUILT; § 15 model in the 3D scene (Stanford Bunny in R2 `meshes/`), GL loops carry chains.

## Current state / open decision points
- Nothing in flight in code; build green; last walked on `vite preview`. Uncommitted (the user's).
- **Quantisation is a real design call, not a bug**: whole-cycle params (Drift, Spin, sweep Speed, LFO rate, Flow, vp Spin/Rate, Light orbit) snap because a fractional cycle jumps at the loop seam. The user asked "why aren't we just letting them go -100..100?" — the answer given: widen ranges, keep integers. The audit should list every integer slider and propose, per param, either a wider integer range or a *continuous* control whose value is rounded only where the seam needs it (e.g. a speed slider that maps to the nearest whole cycle and SHOWS that).

## Next intended action
1. `/ag-init`, then build + `vite preview` on a task port (note the PID, kill it after).
2. **Frame-rate sweep, measured**: Playwright + CDP `Emulation.setCPUThrottlingRate {rate: 4}` + median rAF interval over 90 frames (the `frames()` helper below), for: every effect page (labs Effects → each category → each effect) on a still photo; the same with a video; every generator family (Loops, Math, Penrose — the 55 sims, Drift, Gradients, Soft Forms, 3D Scene incl. the Model statue + ASCII); chains (effect + Post-processing ×2, fx-media + effect, generator + post). Record fps per case to a table; **profile (CDP `Profiler.start/stop`, self-time by function) only the slow ones** — map minified names back via `dist/assets/index-*.js` line (profile `lineNumber` is 0-based → `sed -n $((n+1))p`).
3. Known candidates to check first: canvas filters re-reading full-res `getImageData` per tick when the source moves (`buffersFor` in fxCore — every `runFx` filter); `lumaSampler`-style samplers creating a NEW canvas per invalidation (scanline.js `lumaSampler` allocates a canvas each time); pixi pass re-running on video (`runPixiPass` token `vid:${t}`); penrose heavyweights (lenia/smoothlife/droste/apollonian/KS, already noted as labs-cost); `stillKey` for other stages that are often static (Glass, Dither, Halftone, ASCII, Bitmap with motion 0).
4. **Slider audit**: walk every schema (`src/filters/**`, `src/loops/**`, `params/schemas/*`, `viewport.js` VP_PARAMS, `gl/catalog.js`) — list each `type: 'range'` with min/max/step; flag (a) integer steps, (b) ranges too narrow to be useful, (c) steps too coarse for the range, (d) any slider rendered through a component defined inside a render (the SweepStack bug class — grep for `const [A-Z]\w* = (` inside function bodies of panel files). Drag-test a sample in the browser (mouse down → 20 moves → up, value hits the end).
5. Write plan 27 with the table + proposals; build on the user's go.

## Working memory not yet in AGENT-CONTEXT
- fps helper used: `page.evaluate(() => new Promise(res => { const ts=[]; const tick=t=>{ts.push(t); if(ts.length<90) requestAnimationFrame(tick); else { const d=ts.slice(1).map((x,i)=>x-ts[i]).sort((a,b)=>a-b); res(Math.round(1000/d[d.length>>1])) } }; requestAnimationFrame(tick) }))` — the app's own F-key fps chip is coarser and resets per reload.
- Measurements across reloads were noisy (12 vs 35 for "the same" setup); compare conditions **inside one session**, alternating, ≥2 rounds.
- Labs draft restore shows a "Restore your last canvas?" dialog after reload — click Restore; a `?preset=` deep link rebuilds the layer (drops the chain). Injected drafts in localStorage do NOT restore — build test states through the UI.
- Set values in rail rows by focusing the row's text input (`span` label → `parentElement.querySelector('input[type=text]')`), Cmd+A, type, Enter.
- `interPool` in fxCore is shared across layers — any per-stage cache must key on the stage id (`params.id` = `${layer.id}:${stage.key}`).
- Label-column measure (`controlSize.js`) runs ≤5×/s while playing (throttled, a reflow each) — include it in the frame-rate audit.
