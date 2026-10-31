# Plan — Stam fluid and the Droste seam

**Raised:** 2026-10-31, the user after plan 49 closed. Points verbatim: *"and how do you solve this?"* (on plan 49's two open items: Stam stable fluids drawing as static discs and a checkerboard plume; Hyperbolic Droste's seam at mid-height) · *"no new /plan-shape"*. Plan 49 5.4 holds the history: Stam had gone blank (velocity to 1e38 → NaN); it was clamped to stay finite, not fixed.
**Status:** built — 2026-10-31, every phase ✅.
**Shape:** W › phase › list.
**Laws carried:** NEVER AUTO START, a sim starts on Play (plan 49 10.1) · a control that does nothing is not shown (49 10.2) · the Penrose host's palette, Mouse toggle and Layers stay as they are · `rm` is not a verb, retired code goes to `_tmp/`.
**How a phase closes:** measurable acceptance line first, gates green (`rolls.check.mjs`, `life.check.mjs`), then Playwright against his own words; motion closes on a 30 fps recording, stitched with ffmpeg and watched.

## W1 — Stam stable fluids

### 1.1 — The velocity step solves on one grid, in Stam's order — ✅ built 2026-10-31
- **Cause:** the solver treats a cell as `1/N` wide but `1/NY` tall, while the pressure solve weights all four neighbours the same. On any non-square frame the projection does not remove divergence, so pressure piles up, the curl term feeds on it, and the field ran away to 1e38 (plan 49 5.4). The same mismatch also leaves the odd/even cells decoupled, which is the checkerboard.
- **Cause, second:** with Viscosity at 0 the diffuse step is skipped, but the next steps still read its scratch buffers, which then hold the injected sources instead of the field. Velocity is advected by the sources and the dye is replaced by them, so it draws as static discs.
- The fix is one cell size for both axes (cells are square in pixels already). Diffuse writes or copies the scratch every frame, and the order is Stam's: add sources → diffuse → project → advect → project.
- Vorticity confinement scales with the cell size and is applied before the last projection. Plan 49's ±0.8 clamp and NaN scrub come out once the solver holds without them.
- **Acceptance:** at the default preset and at Viscosity 0, 30 s of play: 0 non-finite values; peak speed stays under 1.5 cells per frame without the clamp; the dye's centre of mass moves ≥ 20 % of the frame height; a checkerboard metric (mean |cell − mean of 4 neighbours| on the density) stays under 0.05; ≥ 30 fps at res 112.

### 1.2 — Dye that flows and fades — ✅ built 2026-10-31
- **Cause (follows from 1.1):** with velocity working, the dye still has no exit except the 0.993 fade, which only runs when Dye fade is on.
- Every source injects a soft-edged disc rather than a hard one. The fade stays a control but defaults on, so the frame reaches a steady state instead of filling up.
- **Acceptance:** over 60 s, lit coverage (density > 0.05) settles between 15 % and 70 % of the frame and changes by < 10 % between 40 s and 60 s; on the recording, plumes curl and no disc stays put for more than 2 s.

### W1 — built
- Rewritten core: square cells (h = 1/N both axes); walls (frame edge and glyph solids) inside every stencil: no-slip for velocity, zero-flux for pressure and dye. Stam's order: sources → diffuse → project → advect → confinement → project. Diffuse hands its buffer on at Viscosity 0, which was the dye-sat-still bug. Confinement is Fedkiw's ε·h·(N × ω). Sources and pointer are forces scaled by dt (the pointer was ~50× too strong). setBnd walked the side walls with the column count, out of bounds on any non-square frame; it is retired. Plan 49's ±0.8 clamp and NaN scrub are out. The old file is in `_tmp/2026-10-31-stam/`.
- Dye: soft-edged discs, fade per second (`exp(−0.35·dt)`, the same at 30 and 60 fps), a soft tone curve so dense cores no longer clip to flat blobs.
- Measured, default preset, 60 s: 0 non-finite values; peak speed 0.43–0.66 cells a frame with no clamp; checkerboard metric 0.003–0.004 (< 0.05); coverage 19–33 % from 10 s on, 26 → 31 % between 40 and 60 s (noise, no trend); 30 fps at res 112. Viscosity 0, 28 s: 0 non-finite, 0.6 cells a frame, coverage 22–24 %.
- Measure changed: the dye centre-of-mass line was the wrong measure (the five sources are fixed, so the centroid stays put by construction). In its place, a 6 s recording (`stam.mp4`, 60 frames) shows every plume curling and moving between frames; no disc holds still.

## W2 — Hyperbolic Droste

### 2.1 — The spiral closes on itself — ✅ built 2026-10-31
- **Cause:** the map takes `log z`, whose angle jumps from +π to −π along the left half of the horizontal centre line. A Droste spiral is seamless only when that 2π jump lands on the same point of the texture, i.e. when the constant is Escher's `α = 2πi / (2πi + log k)` and the texture repeats exactly once per scale step `k`. Here the constant is `log k / 2π + i(1 + twist)` and the texture repeats every 2/3 of log-radius, so both conditions fail. Twist at any non-integer value breaks it again.
- The constant becomes Escher's form. The stripe texture repeats in log-radius with period `log k`, and the zoom offset wraps on the same period. Twist becomes a whole number of arms per turn, the only values that close.
- **Acceptance:** across the left half of the centre line, the mean colour difference between the rows just above and just below is ≤ the mean difference between any two adjacent rows elsewhere (±10 %), at Twist 0, 1 and 2; on a 10 s recording no line appears at mid-height in any frame; the zoom loops with no jump at the wrap.
- Built: the pattern is a function of log-radius (in scale steps) and angle (in turns) with whole-number coefficients on both: `stripe = frac(bands·turn + twist·lr + ¼)`, hue by turn, a soft ring once per step. It repeats exactly per turn and per scale step, so the angle's wrap and every zoom step are identities; the old exp(c·log z) map is retired (`_tmp/2026-10-31-droste/`). Twist is whole turns per step (−4…4); the ¼ keeps a band edge off the horizontal axis, where at Twist 0 one read as a seam.
- Measured: across the centre line, the row difference on the wrap side ÷ the same on the plain side = 0.83–0.90 (Twist 0), 1.00–1.06 (1), 0.97–1.03 (2); a seam reads well above 1. Recording, 50 frames over 24 s (~6 zoom wraps, `droste.mp4`): frame-to-frame change median 8.3, max 9.6, no spike at any wrap; no line in any frame. (The first acceptance line's "any two adjacent rows elsewhere" was biased: near the axis rows cross angles fastest, so the wrap side is compared with its own mirror instead.)
