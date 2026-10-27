# Plan — Normalise exposed knobs and Randomize all

**Raised:** 2026-10-27, plan 41 W5 (audit + proposed rule, `.kol/llm-plan/41-tunnel-grab-and-the-mobile-way-out.md` § W5).
**Status:** ✅ built 2026-10-27, every W. `node src/editor/params/rolls.check.mjs` passes on all 473 presets; 4,730 seeded rolls in the browser left every structural param still and every range inside its span. Open: nothing.
**Shape:** W › phase › list.
**Laws carried:** the editor is this repo's source, no DS tickets for editor work; never delete, retire to `_tmp/`; user copy verbatim (param labels unchanged); Tailwind first; no "·" as a separator.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## The rule (one rule, all families)

- **At most 12 knobs visible per rail tab** (Gen, Style, Anim), on every preset. Form and look first; the rest go in a named section that stays collapsed.
- **Randomize all rolls the look, not the structure.** Counts, caps, grid resolution, iterations, timesteps, positions, modes and form swaps are `noRandom` (they keep their own scope buttons). Every rolled range carries `rMin`/`rMax`. 10 or fewer values per press plus the palette; families that roll fewer stay as they are.
- **Colours roll as one palette.** Already true, see finding 1.

## Phase 0 findings (2026-10-27)

1. **Colours already roll as one palette.** `randomizeSchema` in `src/editor/lib/rng.js` rolls one `rollPalette` per press and hands out roles (or the palette in turn). Where a family has a Palette select instead (Optic, Drift, Gradients, Soft forms, Abstract, Flame), that select is its colour roll and keeps rolling.
2. **Nothing can collapse today.** `AutoControls` renders sections flat; the DS has `Accordion` / `AccordionPanel` (kol-component). One shared change gives every family the collapsed section.
3. **Almost no rolled range has a span.** 16 of the 843 ranges Randomize all touches carry `rMin`/`rMax`, 13 of them in Loops › Simple. The rest roll across the whole slider, which is why rolls hit the ends. Existing spans are kept.
4. **Penrose opacities roll 0 to 5.** Four opacity sliders (default 1, Dim 5) roll across the whole span every press, the loudest single cause of bad Penrose rolls.
5. **Gradients rolls position and shape.** Tunnel rolls Centre X, Centre Y and Shape, so a press can throw the tunnel off-frame or swap circle for star.
6. **Pattern puts motion on Style.** Its Frame and Form sections (12 knobs on tile kinds) sit on the Style tab. They don't roll, but they are why Argyle shows 24.

Visible on Style, most across all presets, over 12: Pattern 24 (Argyle), 3D Scene › Primitive 23, Ribbon 21, Penrose 13–19, Waveform 18, Surface 18, Glyph 16, Gradients 16 (Tunnel), 3D Scene › Soft forms 16, Scanline 16, Oscilloscope 15, Threads 15, Lissajous, Spiral and Rose curve 14, Soft forms 14, Concentric arcs, Arc sweep and Orbit dots 13, Curves 13, Spinner 13, Moiré grids 13, Math › Field 13, ASCII field 13. Gen and Anim are 12 or fewer everywhere.

Randomize all today, most per press: 3D Scene › Primitive 22, Penrose 14–20, Ribbon 20, Waveform 18, Surface 17, Gradients 15, Scanline 15, Oscilloscope 14, Threads 14, Pattern 13, Curves 13, Glyph 13. Everything else 12 or fewer.

New spans are the middle half of each slider (25% to 75%), a first pass to rule on, not tuned by eye.

## W0 — Shared

### 0.1 — Collapsed section — ✅ built 2026-10-27
Acceptance: a schema section marked collapsed renders closed in the Labs rail and the editor inspector, opens on press, and its params still roll when their scope is on.
- `AutoControls` renders a section flagged `collapsed: true` as the DS `AccordionPanel`. One file.
- Built differently: the spans live once in `src/editor/lib/rng.js` (a range with no `rMin`/`rMax` rolls the middle half) instead of on each of ~840 params; a schema span still wins.

## W1 — Penrose (55 loops)

### 1.1 — Colour section collapsed — ✅ built 2026-10-27
Acceptance: every Penrose loop's Style tab shows 10 or fewer knobs; the 5 colours and 4 opacities sit in a closed Color section.
- Host params in `src/loops/penrose/host.js`, one edit covers all 55. Style becomes the loop's own knobs plus interaction (max 10, Packing + Lloyd and Predator–prey).

### 1.2 — Roll the look — ✅ built 2026-10-27
Acceptance: Randomize all on any Penrose loop moves 8 or fewer values plus the palette, none of them shape, an opacity, a count, a cap, grid resolution, recursion depth or a timestep, and no range lands outside its span.
- `shape` and the four opacities go `noRandom` in host.js; per-loop structural params go `noRandom` in each proto; every kept range gets the span in the appendix.

## W2 — Math

### 2.1 — Collapse past 12 — ✅ built 2026-10-27
Acceptance: every Math loop shows 12 or fewer on Style, on every preset.
- Waveform: the six weight and opacity sliders into a closed Strokes section. Surface: Reference (axes, yaw, pitch, distance) and Color closed. Curves: Reference closed. Oscilloscope and Field: Color closed. Threads and Spinner: weight, glow and ball size into a closed Glow section.

### 2.2 — Roll the look — ✅ built 2026-10-27
Acceptance: Randomize all on Waveform moves 8, Surface 8, Oscilloscope 3; none of wave, harmonics, kind, function, view window or position.
- Waveform also stops rolling its three opacities (11 → 8). Field keeps Range only; its kind, function and centre are structure.

## W3 — 3D Scene and Soft forms

### 3.1 — Collapse past 12 — ✅ built 2026-10-27
Acceptance: Primitive, Soft forms and 3D Scene › Soft forms show 12 or fewer on Style; Ribbon shows 14 (see 3.3).
- Primitive: Lighting, Camera and Guides closed, and arrangement, spread and stagger into a closed Arrangement section. 3D Scene › Soft forms: Camera and Form closed. Soft forms: Form closed.

### 3.2 — Roll the look — ✅ built 2026-10-27
Acceptance: Primitive rolls 9, Ribbon 10, both Soft forms 10, plus colour; none of primitive, count, arrangement, material, wireframe, seed or loops.
- Primitive rolls key light, angle and height only (fill, rim and ambient stay put). Ribbon stops flatness, corner, depth and dispersion. Soft forms stop rim shift.

### 3.3 — Ribbon past 12 — ✅ built 2026-10-27 (agent's call)
- Ribbon has 21 visible, 9 of them Geometry. Seed moves to Gen; depth, flatness and corner close as Detail; colour and backdrop as Color; metalness, IOR and dispersion as Glass; wireframe, stroke and FOV as View; Post closed. Style shows 12.

## W4 — The rest

### 4.1 — Collapse past 12 — ✅ built 2026-10-27
Acceptance: Pattern, Scanline, Gradients, Glyph, Moiré grids, ASCII field and the Simple loops show 12 or fewer on Style, on every preset.
- Pattern: Color, Frame and Form close on Style (Argyle 24 → 8). Built differently: moving Frame and Form to Anim would put Anim at 20. Scanline: Mark and Color closed (16 → 11). Gradients: Centre X, Centre Y and Grab into a closed Position section, scanlines and grain into a closed Finish section (Tunnel 16 → 11). Glyph: Metrics and Expressive closed (16 → 10). Moiré grids, ASCII field: Color closed. Lissajous, Spiral, Rose curve, Concentric arcs, Arc sweep, Orbit dots: their Fill section (Color) closed (14 → 8).

### 4.2 — Spans on every rolled range — ✅ built 2026-10-27
Acceptance: every family's Randomize all moves 10 or fewer values plus colour, each range inside its span (appendix).
- Pattern 13 → 5, Scanline 15 → 6, Gradients 15 → 10 (stops Centre X, Centre Y, Shape), Glyph 13 → 10, Drift stops Style (the field kind). Loops › Simple, Pattern › Field, Flow, Optic, Abstract, Modulator, Distressor get spans only.

## W5 — Close out

### 5.1 — FX changelog row — ✅ built 2026-10-27
Acceptance: Dev › FX changelog has a row for the normalised rolls on top.

## Appendix — Randomize all, per loop

"Rolls now" = values Randomize all moves today, colours counted each, as a range where presets differ. "Rolls after" = non-colour values after the rule, plus Palette or Look selects where a family rolls colour that way; colour params add one palette on top. "(kept)" marks a span the schema already has.

**Penrose** (every loop also never rolls Shape and the four opacities)

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| PACKING + LLOYD | 20 | 8 | minR 7.5–19, maxR 32–64, radiusScale 0.6–1, padding 2.5–7.5, relax 0.14–0.38, spokes 15–32, bounce 0.25–0.75, interact 0.75–2.3 | attempts, loop |
| CIRCLE PACKING (GROWING) | 16 | 4 | growStep 0.57–1.5, minR 3.8–9.3, maxR 37–79, interact 0.75–2.3 | maxCircles, seedsPerFrame |
| QUADTREE SUBDIVISION | 15 | 4 | minS 18–46, inscribe 0.55–0.85, dot 2.3–6.1, interact 0.75–2.3 | cadence |
| D3-FORCE · SDF CONTAINER | 17 | 5 | minR 5.8–15, rJitter 7.5–23, charge -23–-7.5, chargeDist 38–93, interact 0.75–2.3 | count, margin |
| DIFFERENTIAL CURVE GROWTH | 18 | 6 | repulRadius 8–16, repulStrength 0.29–0.76, springTarget 5–11, springStrength 0.16–0.45, splitAt 9–19, interact 0.75–2.3 | seedN, maxNodes |
| SPACE COLONIZATION | 15 | 4 | perception 65–160, killDist 9–23, stepSize 3.3–7.8, interact 0.75–2.3 | attractorCount |
| DIFFUSION-LIMITED AGGREGATION | 15 | 3 | stickDist 3.8–9.3, step 1.9–4.6, interact 0.75–2.3 | nWalkers, maxStuck |
| L-SYSTEM / FRACTAL BRANCH | 17 | 6 | startLength 9–19, branchChance 0.25–0.75, forkAngle 0.38–0.92, angleJitter 0.25–0.75, lengthDecay 0.54–0.81, interact 0.75–2.3 | maxDepth |
| BOIDS / FLOCKING | 18 | 7 | neighbor 21–47, sepR 7.5–19, sepW 0.15–0.45, aliW 0.075–0.22, cohW 0.05–0.15, maxSpeed 1.9–4.6, interact 0.75–2.3 | N |
| FLOW FIELD | 16 | 5 | scale 0.0083–0.023, speed 1.2–3.1, life 180–460, foodRegrow 0.9–2.3, interact 0.75–2.3 | count |
| REACTION-DIFFUSION (GRAY-SCOTT) | 17 | 5 | feed 0.033–0.077, kill 0.05–0.07, dA 0.53–1.2, dB 0.33–0.78, interact 0.75–2.3 | iter, seeds |
| CLIFFORD ATTRACTOR (SDF-CLIPPED) | 15 | 4 | scale 0.2–0.4, size 1.8–3.3, fade 0.082–0.23, interact 0.75–2.3 | points |
| LAYERED (PACK × FLOW) | 18 | 6 | minR 9–19, maxR 35–65, noiseScale 0.011–0.03, repelR 21–47, repelStrength 1–3, interact 0.75–2.3 | attempts, particles |
| LAYERED · PREDATOR–PREY (A ↔ B) | 20 | 8 | minR 9–19, maxR 35–65, circleLife 900–2300, eraserReach 17–39, damagePerTick 0.82–2.3, cellGrow 0.058–0.15, hunterSpeed 1.4–3.1, interact 0.75–2.3 | attempts, erasers |
| TRIGGERED GROWTH (CLICK) | 16 | 4 | cellSize 13–31, step 1.6–3.9, stickDist 3.3–7.8, interact 0.75–2.3 | walkers, autoSeeds |
| FITZHUGH-NAGUMO | 17 | 6 | dU 0.54–1.5, dV 0.13–0.38, eps 0.029–0.076, a -0.25–0.25, b 0.45–1.1, interact 0.75–2.3 | res |
| SEASHELL GROWTH FRONT | 17 | 6 | dA 0.05–0.15, dB 0.57–1.5, c 0.058–0.15, mu 0.058–0.15, speed 1.1–3, interact 0.75–2.3 | res |
| BIOMECHANICAL TROPISM | 17 | 5 | angle 23–48, tropism 0.38–1.1, growRate 1.1–3, taper 0.61–0.84, interact 0.75–2.3 | maxDepth, showLoad |
| PHYLLOTAXIS SPIRAL FILL | 17 | 4 | axisStep 1.4–3.1, armScale 0.9–2.3, waveAmp 0.13–0.38, interact 0.75–2.3 | spawnRate, plants, showAxis |
| LENIA | 16 | 4 | R 8.3–15, mu 0.2–0.4, sigma 0.037–0.092, interact 0.75–2.3 | res, dt |
| SMOOTHLIFE | 17 | 5 | ri 3.5–6.5, ro 8.3–15, b1 0.25–0.35, b2 0.38–0.52, interact 0.75–2.3 | res, dt |
| BTW SANDPILE | 16 | 3 | threshold 3.5–6.5, brightness 0.88–1.6, interact 0.75–2.3 | res, dropsPerFrame, maxRelax |
| FOREST FIRE | 15 | 3 | growthP 0.021–0.06, lightningF 0.0013–0.0038, interact 0.75–2.3 | res, stepsPerFrame |
| μNCA | 15 | 4 | rate 0.3–0.7, speed 1.1–2.4, bright 1.1–2.4, interact 0.75–2.3 | res |
| DyNCA | 16 | 5 | angle 90–270, speed 0.16–0.39, rate 0.4–0.8, bright 1.1–2.4, interact 0.75–2.3 | res |
| STAM STABLE FLUIDS | 16 | 4 | visc 0.0001–0.0003, conf 2–6, splat 0.45–1.1, interact 0.75–2.3 | res, dyefade |
| SPH FLUID | 16 | 4 | stiff 110–300, visc 0.38–1.1, gravity 0.5–1.5, interact 0.75–2.3 | count, trails |
| VICSEK BANDS | 16 | 5 | v0 0.9–2.3, noise 0.25–0.75, R 13–31, trail 0.25–0.75, interact 0.75–2.3 | N |
| MIPS / LIVING DROPLET | 16 | 5 | v0 1.2–3.1, Dr 0.054–0.15, rhoM 2.4–6.1, rep 0.57–1.5, interact 0.75–2.3 | N |
| AIZAWA TRAIL | 16 | 4 | a 0.82–1.1, b 0.55–0.85, c 0.45–0.75, interact 0.75–2.3 | dt, tail |
| THOMAS CYCLIC | 16 | 3 | b 0.14–0.21, spin 0.13–0.38, interact 0.75–2.3 | dt, trails, tail |
| CHLADNI MEMBRANE | 15 | 2 | speed 0.29–0.76, nodal 0.077–0.19 | res, modeA, modeB |
| KURAMOTO-SIVASHINSKY CHAOS | 15 | 2 | scale 1.4–3.1, interact 0.75–2.3 | res, dt, steps |
| FIGURE-8 CHOREOGRAPHY | 16 | 4 | G 1.3–3.8, perturb 0.13–0.38, trail 0.25–0.75, interact 0.75–2.3 | dt, substeps |
| PLUMMER CORE COLLAPSE | 17 | 5 | G 0.79–2.3, eps 2.9–7.6, wall 0.5–1.5, trail 0.25–0.75, interact 0.75–2.3 | N, dt |
| HYPERBOLIC DROSTE SPIRAL | 17 | 5 | zoom 0.98–2.3, scale 1.8–3.3, twist -0.5–0.5, bands 5.5–13, interact 0.75–2.3 | cx, cy |
| APOLLONIAN GASKET | 16 | 5 | breathe 0.25–0.75, rot 0.25–0.75, stroke 0.98–2.3, glow 0.25–0.75, interact 0.75–2.3 | depth |
| ALPHA-SHAPE SWEEP | 15 | 3 | speed 0.41–1.1, jitter 1–3, interact 0.75–2.3 | N, reverse |
| APOLLONIUS DIAGRAM | 15 | 4 | waveSpd 0.82–2.3, wOffset 15–45, blur 1–3, interact 0.75–2.3 | N |
| CURVE SHORTENING FLOW | 16 | 3 | sdfPull 0.75–2.3, seedR 18–46, interact 0.75–2.3 | N0, dt, outward |
| REPULSIVE CURVES | 16 | 5 | alpha 2.1–3.4, repK 0.5–1.5, sdfPull 0.75–2.3, tensK 0.25–0.75, interact 0.75–2.3 | N0 |
| HOPF FIBRATION | 16 | 4 | spin 0.38–1.1, cam 3.5–6.5, alpha 0.24–0.61, interact 0.75–2.3 | fibers, pts |
| CLIFFORD TORUS 4D | 16 | 6 | grid 20–40, spin1 0.38–1.1, spin2 0.38–1.1, cam 2.6–4.9, alpha 0.3–0.7, interact 0.75–2.3 | — |
| HAT MONOTILE 2023 | 17 | 5 | scale 37–79, pulse 0.25–0.75, rate 5.5–13, regrow 0.037–0.092, interact 0.75–2.3 | depth, outlines |
| PENROSE P3 RHOMBS | 15 | 3 | tileScale 53–120, spin 0.13–0.38, interact 0.75–2.3 | depth, fillOpacity |
| CHEMOTAXIS PHYSARUM | 17 | 6 | sensAng 0.45–1.1, sensDist 9.8–23, deposit 0.082–0.23, decay 0.89–0.95, foodW 0.25–0.75, interact 0.75–2.3 | agents |
| COMPETITIVE PHYSARUM | 17 | 6 | sensAng 0.45–1.1, sensDist 9.8–23, deposit 0.082–0.23, decay 0.89–0.95, repel 0.38–1.1, interact 0.75–2.3 | agents |
| FLAME FRACTAL | 15 | 4 | drift 0.25–0.75, gamma 0.4–0.8, palette, interact 0.75–2.3 | iters |
| BUDDHABROT | 14 | 1 | decay 0.93–0.97 | samples, maxIter, nebula |
| WILSON LERW / UST | 14 | 2 | walkerBright 0.4–0.8, interact 0.75–2.3 | stepsPerFrame, lattice |
| EDEN GROWTH | 15 | 2 | variantB 0.25–0.75, interact 0.75–2.3 | stepsPerFrame, lattice, seeds |
| DAMPED HARMONOGRAPH | 16 | 4 | phi 1.6–4.7, damp 0.037–0.11, trail 1200–3100, interact 0.75–2.3 | f1, f2 |
| MAURER ROSE | 15 | 3 | drift 0.13–0.38, alpha 0.33–0.78, interact 0.75–2.3 | n, d |
| BARABÁSI-ALBERT | 15 | 2 | nodeSize 1.9–4.6, interact 0.75–2.3 | N, m, addPerSec |
| MST MEDIAL AXIS VEIN | 14 | 2 | depthBias 0.25–0.75, interact 0.75–2.3 | N, edgesPerSec |
**Loops › Simple**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Circle morph | 7 | 4 | fill, minR 0.14–0.31, maxR 0.38–0.54, spin 0–3 (kept) | — |
| Square ↔ circle | 7 | 4 | fill, size 0.38–0.54, nMax 5.3–9.8, spin 0–3 (kept) | — |
| Star morph | 6 | 3 | fill, size 0.38–0.52, spin 0–3 (kept) | — |
| Blob | 7 | 4 | fill, amp 0.1–0.3, size 0.38–0.52, spin 0–3 (kept) | — |
| Lissajous | 9 | 6 | fill, fillShape, fillRule, weight 6.8–18, size 0.61–0.84, showDot | — |
| Spiral | 10 | 7 | fill, fillShape, fillRule, weight 8.3–23, spin 1–4 (kept), size 0.7–0.9, showGuide | — |
| Rose curve | 10 | 7 | fill, fillShape, fillRule, spin 0–3 (kept), weight 6.8–18, size 0.61–0.84, showGuide | — |
| Ring pulse | 6 | 3 | weight 8.3–23, size 0.63–0.88, drift 1–4 (kept) | — |
| Concentric arcs | 9 | 6 | fill, ringFill, gap 0.19–0.46, spin 1–4 (kept), weight 11–30, size 0.7–0.9 | — |
| Bars wave | 6 | 4 | minH 0.13–0.31, maxH 0.54–0.82, cycles 1–4 (kept), waves 1.5–4.5 | — |
| Wave grid | 7 | 4 | cycles 1–4 (kept), wavesX 1.5–4.5, wavesY 1.5–4.5, maxDot 0.5–0.9 | — |
| Checker pulse | 5 | 2 | cycles 1.8–3.3, waves 1.5–4.5 | — |
| Grid rotor | 7 | 5 | turns 1–3 (kept), wavesX 1.5–4.5, wavesY 1.5–4.5, len 0.47–0.82, weight 6.8–18 | — |
| Arc sweep | 9 | 6 | fill, ringFill, turns 1–4 (kept), trail 3–7, size 0.7–0.9, showGrid | — |
| Radial bars | 8 | 5 | minR 0.14–0.31, maxR 0.54–0.81, cycles 1–4 (kept), waves 2.8–6.3, weight 8.3–23 | — |
| Orbit dots | 8 | 5 | fill, ringFill, size 0.61–0.84, dotR 6–14, showPath | — |

**Pattern › Rules, Pattern Loops**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Pattern | 7–13 | 5 | stripe kinds: stripeAngle 45–140, duty 0.29–0.76, edgeSoftness 0.25–0.75, waveAmp 0.25–0.75, waveFreq 1.1–3; tile kinds: gap -10–50, stretch, colorRule | stripePitch, offsetX, offsetY, bandCount, shape, cols, rows, cell, showGrid |

**Pattern › Field**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Stripes | 4 | 2 | freq 4.8–12, sharp 0.25–0.75 | — |
| Checker field | 4 | 2 | freq 4.8–12, soft 0.27–0.76 | — |
| Halftone | 4 | 2 | maxDot 0.57–1.1, freq 3.8–9.3 | — |
| Gradient field | 5 | 2 | freq 3.8–9.3, warp 0.75–2.3 | — |
| Plasma | 4 | 1 | freq 3.8–9.3 | — |
| Rings field | 4 | 1 | freq 4.8–12 | — |
| Interference | 4 | 1 | freq 4.8–12 | — |
| Swirl | 4 | 1 | twist 2–6 | — |
| Moiré | 5 | 2 | freq1 4.3–11, freq2 4.3–11 | — |
| Contour | 4 | 1 | freq 3.8–9.3 | — |

**Scanline**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Scanline | 14 | 6 | minGap 6.8–18, maxGap 19–49, contrast 1.2–3.1, displace 0.25–0.75, freq 1.1–3, markSize 0.9–2.3 | geometry, rows, weave, field, seed, mark |

**Optic**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Halftone matrix | 9 | 6 | palette, layout, density 23–61, dotScale 0.65–1.6, contrast 1.2–3.1, rotate 90–270 | field, shape |
| Moiré grids | 12 | 6 | combine, hardness 0.25–0.75, g1Freq 8.3–23, g1Angle 45–140, g2Freq 8.3–23, g2Angle 45–140 | g1Type, g2On, g2Type, g3On |
| Reaction diffusion | 4 | 3 | palette, scatterSeed 26–75, gain 2.3–4.8 | seed |
| Mesh gradient | 9 | 7 | distort 0.38–0.92, glow 0.25–0.75, grain 0.05–0.15, palette, hueShift 90–270, bgAmount 0.25–0.75, bgStyle | seed, shape |

**Abstract**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Reaction-diffusion | 6 | 5 | variation, feed 0.033–0.077, kill 0.05–0.07, palette, speed 0.9–2.3 | seed |
| Turing pattern | 5 | 5 | scalePreset, colors, colorMode, relief 2–6, speed 0.9–2.3 | — |

**Math**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Oscilloscope | 14 | 3 | gridOpacity 0.13–0.38, gridWeight 1.1–2.4, traceWeight 1.9–4.6 | min, max, sec, ofs, margin, zoomX, zoomY, axis |
| Waveform | 18 | 8 | rolloff 0.38–1.1, phase 90–270, circlesWeight 3.2–9.1, loopWeight 3.2–9.1, graphWeight 3.4–9.1, graphLength 0.29–0.76, graphDot 1–3, baseScale 0.72–1.6 | wave, harmonics, posX, posY, axes, circlesOpacity, loopOpacity, graphOpacity |
| Curves | 13 | 5 | weight 1.9–4.6, fill, yaw 90–270, pitch -40–40, dist 2.6–4.9 | clip, mode, guides, copies, spiral, axes |
| Spinner | 10 | 6 | drift 0.05–0.15, span 0.75–1.3, reach 0.55–0.85, weight 1.9–4.6, glow 6–18, ballR 6.5–16 | mono, heads, count |
| Threads | 13 | 6 | reach 0.4–0.8, pull 0.13–0.38, infR 0.23–0.47, weight 1.9–4.6, glow 6–18, ballR 23–61 | mono, heads, form, wings, perWing, lines |
| Surface | 17 | 8 | height 1.1–3, morph 0.25–0.75, ripple 0.25–0.75, fade 0.25–0.75, weight 1.2–3.1, yaw 90–270, pitch -40–40, dist 2.6–4.9 | kind, fn, mode, domain, contours, axes |
| Field | 7–11 | 1 | range 11–30 | kind, fn, cx, cy, flow, dots, axes |
| Orbits | 5 | 2 | mutual, glow 7.5–23 | count, mono |

**Para-type**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Glyph | 6–13 | 10 | xHeight 85–180, ascender 110–210, overshoot 5–15, stemWidth 17–46, oWidth 78–170, hairWidth 7.9–23, archHeight 0.64–0.91, shoulder 0.1–0.3, serif 0.25–0.75, superness 0.45–1.1 | glyph, engine |

**Modulator**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Modulator | 9 | 7 | intensity 100–300, frequency 58–150, separation 10–30, breathAmp 10–30, depth 33–78, size 0.55–0.85, weight 2.4–6.1 | — |

**Distressor**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Distressor | 7 | 4 | amount 20–60, frequency 26–75, smoothness 25–75, size 0.55–0.85 | mode |

**Flow**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Obstacle flow | 8 | 4 | radius 0.063–0.13, rings 2–6, drift 0.087–0.26, weight 0.94–2.3 | lines |
| Charge lines | 9 | 4 | perCharge 17–38, arrows 0.75–2.3, drift 0.075–0.22, weight 0.94–2.3 | — |
| Glyph vortex | 10 | 4 | size 0.7–1.3, scaleBy 0.25–0.75, swirl 2.4–6.1, noise 0.25–0.75 | glyph, cols, seed |
| ASCII field | 11 | 5 | glyphScale 0.88–1.6, contrast 0.9–2.3, scale 1.1–3, speed 2.3–4.8, accentMix 0.25–0.75 | field, charset, seed |
| Voronoi pulse | 11 | 5 | inset 0.01–0.03, round 0.015–0.045, glow 0.25–0.75, reach 0.1–0.3, drift 0.03–0.09 | points, seed |

**Letter gap**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Letter gap | 8 | 5 | decor, size 0.11–0.24, gap 0.38–1.1, breathe 0.25–0.75, weight | — |

**Drift**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Air | 9 | 8 | palette, freq 0.98–2.3, warp 0.75–2.3, sheen 0.38–1.1, contrast 0.85–2, grain 0.05–0.15, coverage 0.25–0.75, soft 0.25–0.75 | style |
| Water | 10 | 9 | palette, freq 0.98–2.3, sheen 0.38–1.1, contrast 0.85–2, grain 0.05–0.15, amp 0.38–1.1, chop 0.38–1.1, foam 0.25–0.75, light 90–270 | style |
| Cloth | 9 | 8 | palette, freq 0.98–2.3, sheen 0.38–1.1, contrast 0.85–2, grain 0.05–0.15, fold 0.5–1.5, drape 0.38–1.1, light 90–270 | style |

**Gradients**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Iridescent | 6–15 | 10 | look, spectral, palette, angle 1.6–4.7, size 0.58–1.5, freq 2.1–6.1, squash 1.1–2.4, soft 0.27–0.76, lines 0.075–0.22, irid 0.5–1.5, hue 0.25–0.75, warp 0.5–1.5, grain 0.05–0.15 | shape, posX, drop |

**Soft forms**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Soft forms | 11–12 | 10 | palette, spectral, backdrop, hue 0.25–0.75, irid 0.5–1.5, sheen 0.38–1.1, gloss 26–69, rim 0.5–1.5, rimPow 2.3–4.8, sss 0.25–0.75, grain 0.05–0.15 | rimShift |

**3D Scene › Soft forms**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Soft forms 3D | 11–12 | 10 | palette, spectral, backdrop, hue 0.25–0.75, irid 0.5–1.5, sheen 0.38–1.1, gloss 26–69, rim 0.5–1.5, rimPow 2.3–4.8, sss 0.25–0.75, grain 0.05–0.15 | rimShift |

**3D Scene › Primitive**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| 3D scene | 15–22 | 9 | spread 1.6–3.9, objectSize 0.9–2.3, stagger 0.25–0.75, roughness 0.25–0.75, metalness 0.25–0.75, strokeWidth 3.3–7.8, lightKey 1–3, lightAngle 90–270, lightElevation 14–61 | primitive, detail, pWinds, qWinds, count, arrangement, materialType, flatShading, wireframe, environment, lightFill, lightRim, lightAmbient, lightOrbit |

**3D Scene › Forms**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Forms | 9 | 5 | cycles 1–6 (kept), pointSize 0.058–0.15, turns 1.9–4.6, radius 0.65–1.6, height 1.4–3.1 | form, samples |

**3D Scene › Environment**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Environment | 6 | 3 | env, cycles 1–6 (kept), amp 0.38–1.1 | samples |

**3D Scene › Ribbon**

| Loop | Rolls now | Rolls after | Rolled, with span | Never rolled |
|---|---|---|---|---|
| Ribbon | 19–20 | 10 | height 1.4–3.1, gap 0.63–1.3, curl 0.75–2.3, width 0.38–0.92, roughness 0.25–0.75, ior 1.4–2, aberration 0.75–2.3, bloom 0.5–1.5, vignette 0.25–0.75, grain 0.05–0.15 | seed, loops, depth, materialType, wireframe, ribbonThickness, corner, dispersion |
