# Session: Frame-budget audit + the NaN crash root fix

**Date:** 2026-08-09
**Agent:** Grim (Fable 5)
**Summary:** The recurring editor-killing crash was root-caused (`rampRGB(NaN)` → `stops[NaN][0]`) and guarded, then a two-agent frame-budget + anti-strobe audit swept all 55 penrose sims: seven genuinely quadratic/unbounded loops bounded, every per-element `shadowBlur` removed, per-frame allocations hoisted, draw storms batched, strobe sources slowed to ≥300ms, and NaN clamped at its physics sources.

## Changes Made

### Files Modified
- `src/loops/penrose/common.js` — `rampRGB` hardened: NaN intensity → black pixel instead of the editor crash ("can't access property 0, a is undefined"); 5-stop hex parse memoized by palette signature (was re-parsed per CALL, in per-element hot paths). `strokeOutline` memoized per `sdf.data` (was re-scanning the full mask grid EVERY frame in EVERY sim, ~250k samples at 2000px) and batched to one path/fill.
- `src/loops/penrose/protos/*` (15 sims) — quadratics bounded: space-col attractor→branch scan spatially bucketed (was ~17M checks/frame), force-container edge render grid-bucketed (was all-pairs at N=1200), front-pack spawn/grow collision bucketed; triggered-DLA walker pool (900) + aggregate (4000) hard-capped; quadtree `LEAF_CAP` 6000 + eased lens; RD's per-frame canvas creation hoisted + 256-LUT; shadowBlur purged; draws batched; press impulses capped ~3% canvas/frame.
- `src/loops/penrose/round2/*` (39 sims) — 7 quadratic/unbounded bounded (Wilson per-commit full-grid filter → swap-remove pool, sandpile 2000-sweep avalanche → 60/frame resumable, MST unbounded Kruskal scan → 400/frame, BA sampling 400→80 attempts, geom-03 manual 4M-iteration upscale → native drawImage, hat lattice capped 4000 before O(N²) adjacency, Stam full-canvas ~16MB blit → grid-sized buffer); per-frame allocation hoists everywhere (topology/flame/NCA were allocating 15k–180k arrays/frame); draw storms batched (Thomas: 24k strokes → ≤32 paths); **strobe fixes**: forest-fire 8 gens/frame → 4 (the named "generations strobe"), MST pulse 3.3Hz → 1Hz, eden colony churn ~9× slower, all instant flips eased ≥300ms; **NaN at source**: FHN u³ clamp, Stam negative-dt floor, KS ±50 clamp + tOffset overflow wrap, flame NaN chaos-point re-seed (was fading the flame to black forever).
- `src/loops/penrose/round2/wave-04-kuramoto-sivashinsky.js` — build-breaking `const Edt` reassignment fixed (fills in place; node --check can't catch const reassignment, rolldown did).

### Features Added/Removed
- None user-facing — perf/stability pass; sim character deliberately preserved.

## Current State

### Working
- Build green; fuzz 36 sims clean through tap/hold/drag cycles, 18 browser-only (offscreen canvases/Path2D — more than before because perf hoists moved canvas allocation to init).
- The `a is undefined` crash class is dead twice over: guarded at the renderer, clamped at every physics source the audit found.

### Known Issues
- Lenia/SmoothLife at max radius+resolution ≈ 55M multiply-adds/frame — param-bounded, left as the user's dial (kernel radius IS the physics).
- Flagged, unfixed (pre-existing, cheap): 13-layered's cross-layer scan cell size under-covers `repelR` at defaults.
- Audit's visual deltas are compositing-only (alpha quantized ≤1/32, depth-grouped overlaps) — should be invisible; user's eye is the test.

## Next Steps
1. User visual + feel pass over the audited catalog (frame rate and strobe complaints were the drivers — verify both died).
2. Tune named stragglers per complaint (all constants are one-liners now).
3. Parked: authored-form mode; grab/fling generalization.
