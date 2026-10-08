---
title: Labs Parity Audit
type: audit
status: archived
updated: 2026-07-03
description: Preset-level diff of kol-labs-single (source of truth) vs this editor — full-parity families, silent gaps, documented skips. Drove the 2026-07-03 backfill and the 2026-07-08 parity waves; all gaps now closed.
aliases:
  - labs-parity-audit
  - parity-audit
tags:
  - project/kol-fxr
  - domain/generative
  - editor/parity
sources:
  - kol-labs-single/src/sidebars.config.js
  - kol-labs-single/src/loops/registry.js
  - kol-labs-single/src/pages/*/registry.js
  - kol-labs-single/src/pages/effects/effects.config.js
  - kol-labs-single/src/pages/kinetic/scenes/groups.js
  - kol-labs-single/src/pages/gradient/*/data/*.js
  - src/loops/ (2d + gl catalogs)
  - src/filters/ (canvas2d + gl catalogs)
  - src/kinetic/
related:
  - "[[2026-07-01-param-graph|param-graph decision]]"
  - "[[../03-generative/INDEX|generative]]"
  - "[[INDEX|research index]]"
---

# Labs Parity Audit

Preset-level diff of `kol-labs-single` Effects + Generative sections (plus the Kinetic/Type/Para-type composition families, which were partially ported) against what `kol-fxr` actually ships. Labs is the source of truth. Counted from registries on both sides, 2026-07-03.

Rough totals: labs Effects+Generative ≈ **515** preset-level items; editor ships ≈ **365** (some of which are editor-authored variants that don't exist in labs, so real labs coverage is lower than the ratio suggests).

## Findings

### At full parity — no action

| Family | Labs → Editor | Note |
|---|---|---|
| Scanline generator | 30 → 30 | 6 categories, all presets |
| Pattern | 57 → 57 | all 6 categories |
| Loops: Shape + Field | 64 → 64 | see gap G2 for the third group |
| Drift | 18 → 18 | Air/Water/Cloth complete |
| Soft Forms 2D / 3D | 12+6 → 12+6 | look presets, see G8 |
| 3D-scene Forms / Environments | 8+3 → 8+3 | |
| Reaction-Diffusion variations | 11 → 11 | as Abstract loops |
| Parked Optic pages | 4 pages → 28 loop presets | halftone/moiré/reaction/mesh-gradient, editor-expanded |
| CRT family | 4 engines → 4 engines | incl. all 6 Rutt-Etra motion presets (verified in `src/filters/gl/catalog.js`) |
| Refraction Lens + Chromatic | ✓ | gl-lens 6 surfaces × 2 shapes; fx-chromatic |
| Scanline filter | 5 → 4 | mirror is webcam-only — legit skip |
| Type loops | 9 → 10 | radial/rings/path complete |
| Halftone trio | **editor exceeds labs** | dither 21 shapes × 23 modes, ascii 4 algos × 8 charsets, bitmap rig |
| Modulation | **editor exceeds labs** | adds MIDI, LFO ×3, layerX/Y; labs-side audio/expr/gamepad covered (gamepad partial: left stick only vs 4 axes + 17 buttons) |

### Silent gaps (not on any skip-list)

Ranked by size × port cost:

- **G1 — Penrose: 0 of 55.** Entire family (15 foundations + 40 territories), all canvas2d. Was on the early skip-list alongside Kinetic/Type — those two later got ported, Penrose never revisited. Largest single gap.
- **G2 — Loops Pattern group: 0 of 30.** Grids/Tessellations/Abstract/Flow/Stripes/Noise (`src/loops/pattern/` in labs, single `patternLoop` module + preset configs). Excluded at the Phase-3 import; the exclusion reason (route metadata) doesn't apply to the presets themselves.
- **G3 — Kinetic: 14 of 80 scene/element presets.** Editor took one representative per group (6 scenes + 8 elements); labs has 36 path + 35 variable + 12 motion presets. Morph six are documented (need the un-ported morph render mode); the other ~50 were silently sampled. JetBrains Mono font also substituted out.
- **G4 — Math: ~8 of 23 source presets.** Missing whole categories: **Waveforms** (epicycle, harmonic, overtone, phasor, spectrum, resonance, animate — 7) and **Fields** (waves, ripples, saddle, roots2, recip, sinz — 6), plus Parametric curves + orbits. Editor expanded spinner/threads into 16 own variants instead. The standalone **Expression generator page** (text DSL visualiser) is also absent — editor's `expr` is only a modulation source, not a generator.
- **G5 — FX Rack canvas2d: 7 missing one-liner filters.** hsv, contrast, rgb, invert, sepia, grayscale, enhance — same trivial tier as the 7 that WERE ported (fx-hsl, fx-brightness, …). Cheapest fix in this list.
- **G6 — 3D-scene Primitives: 5 fixed combos vs 9 geometries × 7 animations.** Labs: box/sphere/torus/torusKnot/cone/cylinder/icosahedron/octahedron/dodecahedron × spin/tumble/bob/pulse/sway/flip/orbit. Editor ships scene-knot/tumble/ring/glass/wire only.
- **G7 — Ribbon: 4 of 10, and only `coil` matches labs.** Labs cascade/tower/plunge/braid/fan/arch/wave/knot/slab never carried; editor's puddle/chrome/ember are editor-authored.
- **G8 — Gradients: ~7 of 12 type presets.** Missing conic (Field), mesh + aurora (Pole), dome + ripple (Volume) — mapped by id against irid-*. The 6 **look presets** (spectrum/iris/aqua/magma/candy/noir, shared with Soft Forms) don't exist as one-click looks either.
- **G9 — MSTP/Turing: 8 of 20 combos.** 4 presets × candy/spectrum only; gold/ocean/mono color sets dropped.
- **G10 — Glass: 10 of 14 looks.** Missing slivers, prismatic, prism-ripple (the chromatic-dispersion variants); kaleido exists as a param but not a look (verified in `src/filters/glass.js`). Labs' 5 frame-motion + 4 form-animation presets are folded into phase/pan params — defensible, but the preset recipes are gone.
- **G11 — 3D-scene gradient Field (sphere/plane × 6 palettes)** — the original three.js gradient-field scene; no editor counterpart found.
- **G12 — Dither photo styles: 1 of 4.** Labs 3d-scene dither page has 4 DITHER_STYLES; editor `dither` filter is RD-only.
- **G13 — Para-type: glyphs only.** 13 glyph loops ported, but the 9 **style presets** (Neutral, Didone, Geometric, Humanist, Heavy, Spindly, Tall, Square, Rounded) and the Skeleton render engine are absent (Classic only; contrast param was removed in the param audit).

### Documented skips (already ruled, no surprise)

- **Pixi FX tier** (~29 FX-rack effects) — deliberate, in the deferred pool; needs a pixi dependency.
- **Refraction Scene** (/optic/scene, 6 three.js glass-mesh presets: vitrine/frost/chrome/aquarium/prism/portal) — the "Lens 3D skipped with verdict" item.
- **Kinetic morph render mode + 6 morph presets** — needs opentype glyph-outline interpolation.
- **Scanline filter mirror** — webcam-only.
- **Interfaces section** (7 widget groups, 50 screens) — UI-composition gallery, out of editor scope.
- **Poster / Video export pages** — superseded by the editor's own Output (aspect/@Nx/PNG/webm).

## Recommendations

Port order by value-per-effort: **G5** (7 one-liner filters, an afternoon) → **G2** (one module + 30 preset configs, contract already proven) → **G4** (Waveforms/Fields categories — same WebGL engine family as surfaces/attractors already ported) → **G8/G9/G10** (preset-config-only gaps: recipes, no new engines) → **G3** (kinetic preset backfill, engine already in) → **G6/G7** (primitive/ribbon preset matrices) → **G1** (Penrose — biggest, needs its own import wave) → G11–G13 as stragglers.

User decides which of these land before/with the next review round.

## Outcome (2026-07-03, same day)

Backfill executed — **CLOSED: G2, G3, G4, G5, G7, G8, G9, G10** (see `llm-context/session-log/2026-07-03-labs-parity-backfill.md` for the per-gap detail and approximation notes). Kinetic accounting closed exactly at 80 = 14 ported + 6 morph + 60 backfilled; the labs coil ribbon geometry remains unrepresented (editor's `coil` is a curated divergent config, kept).

**G1 CLOSED same day** — the Penrose wave: all 55 presets (15 foundations + 40 territories) as a `penrose` loop category, protos byte-identical to labs, free-running MSTP idiom, masks/substrates per labs. Deps added: d3-delaunay/d3-force/simplex-noise. See `llm-context/session-log/2026-07-03-penrose-wave.md`.

**Still open: G6 (primitives 9×7 matrix), G11 (gradient-field scene), G12 (dither photo styles)** — plus the documented skips, unchanged.

**G13 correction + closure (2026-07-03, text-tools audit):** the Skeleton engine was in fact ported all along (this doc's earlier claim was wrong — `src/loops/paratype/skeleton.js`, selectable via the `engine` param); the 9 labs style presets are now ported too. Para-type also re-homed: it is NOT a Generative type (labs parks it in its own Type Lab section) — it now lives on the **misc layer**.
