# Plan — Frame rate and sliders, the whole app

**Status:** DONE 2026-10-10 — items 1–9, the Blocks follow-up (§ 11) and the close-out (§ 12), all verified. Decisions taken on the build, each where it bit:
- § 1: `animated: false` stays as the shorthand for "never moves" (`stillOf` reads it), so 17 defs didn't need editing.
- § 2: the helper is `src/loops/lib/glPass.js`, because filters already import from loops.
- § 3: glPass carries a bit-exact GLSL port of `intHash2` (`HASH_GLSL`). The JS second multiply rounds to 53 bits, and the shader reproduces that rounding. It matched JS on 393,216 samples, so Glass panes and Noise grain land where a saved file had them.
- § 7: randomise keeps the old span through the existing kinetic convention, `rMin`/`rMax`, which is now honoured schema-wide by both `randomizeSchema` copies.
- § 8's guard is `src/editor/params/schemas.check.mjs`. It loads the registry through Vite SSR because the registry reaches the DS's `.jsx`.
**Origin:** user, 2026-10-10: *"you fixed frame rate for one thing, but I dont wanna go through everything to find more frame rate issues … audit framerate and sliders"*.
**Evidence:** `_tmp/2026-10-10-plan-27-audit/` — `fps.jsonl` (186 cases, real GPU), `fps-swiftshader.jsonl` (the first run, software GL — discarded), `schemas.json` (1020 ranges), `drag.json` (50 drags), and the scripts that made them.

## 0. Prerequisites
- **How it was measured:** `vite preview` of the built bundle at 1440×900, labs, playing. The median rAF interval over 90 frames, read twice: at 4× CPU throttle (CDP `Emulation.setCPUThrottlingRate`) and unthrottled. Cases: one preset per generator engine (all 55 Penrose sims), all 70 filters on a 1600×2000 still, five photo chains and two generator chains.
- ⚠ **Headless Chromium renders in software unless it is told not to.** The first run was on SwiftShader and made every GL case look broken. The runs below use `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` and confirm `ANGLE Metal Renderer: Apple M1`. Any future fps walk needs those flags.
- Profiles are CDP `Profiler` self-time on the dev server (unminified names), 3 s per case.
- **Clean, no action:** all 16 shape engines, pattern, pattern loops, abstract, paratype, modulator, distress, every GL generator (drift, gradients, soft forms 2d/3d, 3D scene, forms, environment, ribbon), all 6 GL engine filters, all 35 pixi filters. These run at 60 fps, and most hold 60 even at 4×.

## 1. A still stage costs nothing (here) — the biggest, cheapest win
- **Seen:** Glass, Kaleido and Pixel sort run 15–30 fps on the M1 **with every motion param at its default 0**. Their output cannot change, yet the full-resolution pass reruns on every tick (`glass.js:356` `displace` 82%, `runFx` 88%, `sortSegment` 44%).
- **Why:** `chainAnimated` (`LayerRenderer.jsx:307`) reads `def.animated`, a flag fixed per def. Every def without `animated: false` subscribes the layer to the transport and redraws the whole chain each frame. Plan 26's `stillKey` only spares *intermediates*. The last stage always redraws.
- **Fix:** `stillKey(params)` becomes the one stillness contract. It returns a key while the output is frozen and null while it moves. `chainAnimated` asks it per stage with the stage's live params. When every stage is still and the source is still (not video, webcam or a loop), the layer drops off the transport (`useTransportCtx(false)`) and paints once per param change. Defs that gain `stillKey`:
  - glass (spin, drift, phase, pulse)
  - kaleido (spin)
  - pixel sort (sweep)
  - scanline, halftone-dither, ascii and bitmap (flow, spin and an empty `sweeps`)
  - fx-noise (flicker)
  - every `animated: false` def, which becomes a constant key and retires the flag.

  A bound param (modulation) counts as moving.

## 2. Field loops on the GPU (here)
- **Seen, M1 unthrottled:**

  | loop | fps |
  |---|---|
  | interference | 5 |
  | plasma | 10 |
  | contour | 10 |
  | gradient field | 12 |
  | swirl | 15 |
  | moire | 15 |
  | checker field | 15 |
  | rings field | 20 |
  | stripes | 30 |
  | optic moire-xor | 9 |

  At 4× they fall to 1–7. Only field halftone holds 60.
- **Why:** `field/raster.js` calls a JS `colorAt(i, j)` for every pixel of a buffer up to 1000 px wide (~1.25M calls a frame). Each call returns fresh `[r,g,b]` arrays from `mix2`/`mix3`. The profile is 75–84% inside each field fn (`interference.js:63`, `plasma.js:51`, `moire.js:306` + `gridVal`).
- **Fix:** one small shared WebGL2 helper, `src/loops/lib/glPass.js`, used by this item and § 3:
  - one offscreen GL canvas for the whole app
  - a fullscreen-triangle program cached per shader
  - `run(ctx, shader, uniforms, src?)` draws the GL canvas into the 2d `ctx` with `drawImage`, so there's no `getImageData` readback and the loop/chain contract and export stay unchanged

  Each field fn becomes a fragment shader: same maths, same periodic phase, so the loop still closes. The `camera.js` sample transform becomes a uniform matrix. `raster.js` retires to `_tmp/`. This is the "field family GPU port" already in AGENT-CONTEXT's perf backlog.

## 3. Moving per-pixel canvas filters on the same helper (here)
- **Seen:** with motion on, § 1 no longer helps. Kaleido 15 fps, Glass 30, Pixel sort 30, fx-noise 15 at 4×. All are per-pixel JS over the full backing store.
- **Fix:**
  - **Kaleido** → `glPass` (wedge fold is one line of GLSL).
  - **Glass** → `glPass` (the displacement field is already a pure function of uv, pattern and phase).
  - **fx-noise** → `glPass` (hash noise).
  - **Pixel sort stays on the CPU.** A sort is sequential, and at 30 fps moving / free when still (§ 1) it is not worth a GPU sort.

  Output must match the canvas version pixel-for-pixel at Amount 100. Checked by a diff on one still per filter, before/after.

## 4. Intermediates are read back, so say so (here)
- **Seen:** Dither (RD) → Blocks: `getImageData` is 54% of the frame.
- **Why:** the chain's pooled intermediates (`fxCore.js:130`) and the source caches are `getContext('2d')` with no hint, so Chrome keeps them on the GPU. Almost every canvas stage after them reads pixels, and each read is a GPU→CPU stall.
- **Fix:** `getContext('2d', { willReadFrequently: true })` on `interFor`'s canvases, `buffersFor`'s source, and the RD engine's output canvas. These canvases are read every frame by design. A stage that only draws (§ 2–3's `glPass`, drawImage stages) writes into the *final* ctx, which keeps the default.

## 5. The 4×-throttle tier — slower machines (here)
- **Seen:** fine on the M1, under 30 fps at 4×:

  | case | fps at 4× |
  |---|---|
  | halftone-dither | 12 |
  | ascii | 12 |
  | Scanline generator (spaced drift) | 15 |
  | Lenia | 12–15 |
  | SmoothLife | 12–15 |
  | Stam fluid | 12–15 |
  | Droste | 12–15 |
  | KS | 12–15 |

  The Penrose sims are already noted as labs-cost.
- **Fix:**
  - § 1 covers halftone-dither and ascii when still.
  - **ascii** draws from a glyph atlas (one `drawImage` per cell from a pre-rendered sheet, keyed on font, size and ramp) instead of `fillText` per cell. `fillText` is 19% of its frame.
  - Penrose heavyweights and the Scanline generator stay as they are: 60 on the M1, and their cost is the simulation itself.

## 6. Orbits — the glow is a sprite (here)
- **Seen:** `param-orbits` holds 30 fps with 82% of the main thread idle. The cost is GPU-side: 140 arcs a frame, each with `shadowBlur` (`orbits.js:130`).
- **Fix:** one pre-rendered glow sprite per (hue, glow) pair, cached in a small map, drawn with `drawImage` under `lighter`. No `shadowBlur` in the frame loop.

## 7. Whole-cycle sliders: one ladder, both directions (here)
- **Seen:** 45 integer "whole cycles per loop" sliders on five different ranges:
  - 1..4 (14 sliders)
  - 0..3 (9)
  - 0..4 (8, incl. `VP_PARAMS` vpSpin on every shape and pattern loop)
  - ±2 (5)
  - ±4 (4)

  Meanwhile fx-media is ±16/±8 and the sweep rig's Speed is ±8. Spins on 0..3 cannot run in reverse.
- **Ruling carried from 2026-10-10:** widen the ranges, keep integers. A fractional cycle jumps at the loop seam, so continuous is wrong.
- **Fix, one ladder:**
  - **Signed motion → −8..8:** spin, drift, flow, travel, orbit, moire A/B/C drift, glass/kaleido/scanline/halftone/bitmap spin. Zero means still.
  - **Counts of cycles → 1..8:** cycles, turns, breaths, trace/form/sweep cycles, vpRate.
  - fx-media keeps its ±16/±8 (it is a distance in tiles).
  - **Defaults do not move.**
  - **Out of the ladder** (structure, not motion): torus `pWinds`/`qWinds`, iridescent `winds`, spiral `turns` (2..8, geometry), modulator `breathAmp`, `optic-reaction.iters`.
  - Full list: `schemas.json`, filter `step === 1` and key/label matching spin · cycle · turn · flow · drift · rate · speed · orbit · breath · travel.

## 8. Defaults that sit off their own step grid (here)
- **Seen:** 19 sliders whose default is not a multiple of `step` from `min`. The first drag snaps it away and the default can never be reached again by hand. Examples:
  - `gl-lens.edge` 0.025 / step 0.002
  - `abstract-rd.feed` 0.0545 / 0.001
  - `optic-reaction.feed`/`kill` 0.0367/0.0649 / 0.0005
  - `harmonograph.phi` 1.57 / 0.05
  - `rose-curve.size` 0.85 / 0.02
  - `ribbon.depth`/`vignette` 0.35 / 0.02
  - `softforms.sss` 0.25 / 0.02
  - `net-01-ba.nodeSize` 2.4 / 0.5
- **Fix:** change the **step** to the coarsest divisor that lands the default (0.025 → 0.005, 0.0545 → 0.0005, 0.85 → 0.01, 1.57 → 0.01, 2.4 → 0.1). Never change the default, because the default is the look. Add a guard to `sweeps.check.mjs`'s sibling: one node check over `schemas.json` shape, failing on any off-grid default.

## 9. One slider with no label (here)
- `penrose/round2/net-01-ba.js:17` `nodeSize` has no `label` and renders its key. → `label: 'Node size'`.

## 9b. Found on the re-dump — six more unlabeled Penrose sliders (not built)
These render their key as the label, like `nodeSize` did:
- `r2-soc-01-btw.brightness`
- `r2-attr-02-aizawa.a` and `.b`
- `r2-spec-01-harmonograph.damp`
- `r2-soc-03-forestfire.growthP` and `.lightningF`

Labels are user-facing copy, so the wording is the user's call. Only the camelCase two read badly. **Done 2026-10-10 on the user's yes:** `growth chance` and `lightning chance`. The other four keep their keys.

## 11. Follow-up — Blocks on the GPU (built 2026-10-10, the user's yes)
- `fx-blocks` is a glPass shader now. Every pixel walks the tear bands backwards, then resolves its block's fate.
- **Fill › Average** gets each block's mean from a small one-pixel-per-block pre-pass, the new `uAux` texture slot in glPass.
- **Bug fixed on the way:** `bindTex` created a texture before activating its unit, so the first aux upload unbound `uSrc`. Unit first now.
- **Diff:** within 1/255 of the CPU version for defaults, motion, average and paper fills, both directions, tear, Amount and 2× backing. The earlier field and filter diffs are unchanged.
- **fps** (`fps-blocks.jsonl`, 49 cases that touch glPass or Blocks, no regressions):

  | case | fps at 4× |
  |---|---|
  | Blocks | 60 |
  | Plasma → Blocks → Noise | 20 → 60 |
  | Dither → Blocks | 15 → 30 (the rest is the Dither simulation) |

- **Walk:** both themes, 0 console errors, PNG and webm export from Blocks.

## 10. Verified clean — nothing to do
- **Drag:** 50/50 rail sliders on six pages reach both ends in a 20-move drag, the plasma page at 10 fps included. The SweepStack remount class (a component defined inside a render) has no other instance; a grep of every `.jsx` found none.
- **Range sanity:** no default outside its range, and every range has a step.
- The two kinetic `vfWdth`/`vfWght` entries have no static min/max. They are filled from the font's axes at runtime, so that's by design.

## N. Verification — PASSED 2026-10-10 (`vite preview`, Metal GL; evidence in `_tmp/2026-10-10-plan-27-audit/`)
- **fps** (`fps-after.jsonl`, all 186 cases, no regressions):
  - Every case is now ≥ 55 unthrottled.
  - All field loops, moiré, Glass, Kaleido, Noise, Pixel sort, ascii, halftone and Orbits hold 60 at 4×. Before, they ran 1–30.
  - **Still under 30 at 4×:**
    - the § 5 Penrose heavyweights and the Scanline generator (out of scope by design)
    - two chains with **Blocks**: Dither → Blocks at 15, Plasma → Blocks → Noise at 20. `fx-blocks` is still a full-resolution CPU pass plus readback. It is the next glPass candidate, not built here.
- **Profiles:** while playing, the still Glass, Kaleido and Pixel sort sit 77% idle (they were at 0%). The field loops sit 68–76% idle, and moving Glass, Kaleido and Noise 68–76%.
- **Pixel diffs** (`diff.mjs`, `fxdiff.mjs`):
  - Field loops, moiré and Noise are within 1/255.
  - Kaleido and Glass are within 1/255 except single-pixel seams where a nearest sample or band edge lands on an exact pixel boundary: ≤ 0.08% of pixels, float32 vs double.
  - Contour and stripes differ only on threshold-tie pixels.
  - ascii's atlas differs only in glyph antialiasing.
  - Orbits is visually identical and 25× faster to draw.
- **Schemas:** re-dumped. The ladder holds, `schemas.check.mjs` passes (and fails on a planted bad step), and the drag test is 50/50.
- **Walk:** both themes over 10 touched surfaces with 0 console errors. PNG and webm exports from Plasma, Glass and Kaleido are non-blank and animated.

### The original criteria
- Re-run `fps.mjs` (Metal flags) on `vite preview`. Every case listed above must reach ≥ 55 unthrottled. Field and glPass cases must reach ≥ 30 at 4×. No case may regress.
- § 1: a still photo + still Glass shows 0% scripting in a 3 s profile while playing; moving any motion param resumes the frame.
- § 2–3: before/after pixel diff per field loop at u = 0, 0.25, 0.5 and per filter on one still, within ±2/255.
- § 7–8: `schemas.json` re-dumped; the off-grid check passes; every ladder param reads −8..8 or 1..8.
- Both themes, 0 console errors, exports (PNG + webm loop) from one field loop and one glPass filter.

## 12. Close-out — Preview resolution, Pixel sort, the last labels, GL engines (2026-10-10, the user's yes)
- **Preview resolution** (Settings › Display · Full / Half): Half renders every live canvas at half its pixel ratio (`src/editor/lib/previewScale.js`), and that includes all 12 three.js renderers. Exports lift to full first (`atFullRes`); on the production build the live canvas goes 1080 → 2160 for the snapshot and back.
- **Pixel sort:** a still source uses the linear deal path. Each line is pre-ordered once per source, so a frame is one scan plus one deal, with no sort. Output is byte-identical (15 frames × 3 setups at 2160×2700) and the worst frame drops from 138 to 44 ms.
  - Moving Pixel sort in the app: **30 fps at Full, 60 at Half** (4×: 9 → 30).
  - **Full retina at 60 is not reachable:** the work is one CPU pass over 5.8M pixels plus the upload.
  - A GPU segmented sort was built and was byte-identical, but ran at 4 fps (Full) and 7 (Half). A bitonic sort of every line is 78 full-frame passes. Retired to `_tmp/2026-10-10-pixelsort-gpu-attempt/`.
- **Labels:** 16 Penrose sliders labelled in the house style (`grid res`, `steps/frame`, `nodes`, `links per node`, …). The Penrose host marks key-as-label fallbacks `unlabeled`, and `schemas.check.mjs` fails on any missing label (mutation-tested).
- **Final verification** (production build, Metal):
  - **fps:** `fps-final.jsonl`, 186 cases, all ≥ 55 unthrottled. One 4× Dither reading of 30 re-measured at 60 three times (noise).
  - **Walk:** both themes, 0 console errors, PNG + webm exports.
  - **Engines:** all 11 GL cases halve under Half.
  - **Sliders and schemas:** 50/50 drags, schemas ok.
  - **Still under 30 at 4×:** the Penrose heavyweights and the Scanline generator. Their cost is the simulation itself, as noted in § 5.
