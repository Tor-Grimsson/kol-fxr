# Session: Plan 27 closed — frame rate and sliders, the whole app

**Date:** 2026-10-11 (work 2026-10-10 → 11)
**Agent:** kol-fxr (local, MBP)
**Summary:** The handoff's audit was measured, written up as plan 27 and built, followed by the Blocks GPU port, a Preview resolution setting and the close-out. Everything is verified on `vite preview` with Metal GL.

## Changes Made

### Files Modified
- `.kol/llm-plan/27-frame-rate-and-sliders.md`: the plan, its build decisions, § 11 (Blocks) and § 12 (close-out). Status: DONE.
- `src/loops/lib/glPass.js` (new): the shared WebGL2 pass. It has two texture slots, dispatches uniforms by GL type, and includes `HASH_GLSL`, a bit-exact GLSL port of `intHash2`.
- `src/loops/field/fieldGL.js` (new) and the nine field loops: now GLSL. `optic/moire.js` is GLSL too.
- `src/filters/fxCore.js`:
  - `stillUnless` and `stillOf` (the stillness contract)
  - `glFx` (a runFx processor as a shader)
  - `willReadFrequently` on the chain intermediates
- `src/filters/glass.js`, `fxRadar.js` (Kaleido), `fxEffects.js` (Noise), `fxBlocks.js`: these run on glFx now.
- `src/filters/fxRadar.js`: Pixel sort's linear deal path for still sources.
- `src/filters/fxAscii.js`: the glyph atlas.
- `src/loops/math/orbits.js`: glow sprites.
- `stillKey` added to the moving canvas defs. `chainAnimated` in `LayerRenderer.jsx` reads stillness from the live params.
- About 45 whole-cycle sliders now run −8..8 or 1..8. `rMin`/`rMax` keep randomise within the old span, honoured by both `randomizeSchema` copies. 19 steps were fixed so each default lands on its slider's step grid.
- Labels: "node size", "growth chance", "lightning chance", plus 16 Penrose labels in the existing style. `penrose/host.js` marks key-as-label fallbacks `unlabeled`.
- `src/editor/params/schemas.check.mjs` (new): fails on a default off its step grid or a missing label. It loads the registry through Vite SSR.
- `src/editor/lib/previewScale.js` (new) plus Settings › Display › **Preview resolution · Full / Half**. It covers the 2D layers and all 12 three.js renderers. `atFullRes` wraps every export.
- `@kolkrabbi/kol-icons` 0.35.0 → 0.37.0. Two done receipts were closed (`browse-surface-honours-display-name`, `OneGrabGestureBothRails`).

### Moved to `_tmp/`
- `src/loops/field/raster.js` and the CPU filter snapshots, to `_tmp/2026-10-10-plan-27-cpu-field/`.
- The GPU Pixel sort attempt, to `_tmp/2026-10-10-pixelsort-gpu-attempt/`. It was byte-identical but ran at 4 fps against 30 on the CPU.
- The evidence (fps sweeps, diffs, scripts), in `_tmp/2026-10-10-plan-27-audit/`.

## Current State

### Working
- All 186 measured cases run at ≥ 55 fps unthrottled. The field loops, moiré, Glass, Kaleido, Noise, Blocks, Pixel sort (still), ascii, halftone and Orbits hold 60 even at 4× throttle.
- GPU ports match the CPU output within 1/255. The exceptions are single-pixel threshold and boundary ties, which affect ≤ 0.08% of pixels. Noise, Blocks and Pixel sort are exact.
- Both themes, 0 console errors. PNG and webm exports work, and they lift to full resolution under Half.

### Known Issues
- A moving Pixel sort runs at 30 fps at full retina and 60 at Half. That's the CPU ceiling.
- The Penrose heavyweights and the Scanline generator run at 12–20 fps at 4× throttle. The cost is the simulation itself.
- ⚠ An fps walk needs headless Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. Without the flags it renders on SwiftShader and every GL number is wrong.
- ⚠ Editing a module that holds state (like `previewScale.js`) while the dev server runs can leave two instances. Restart with `--force` before you trust a probe.

## Next Steps
- None from this arc.
