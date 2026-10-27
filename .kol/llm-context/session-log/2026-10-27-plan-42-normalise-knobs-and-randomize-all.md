# Session: Plan 42 — normalise knobs and Randomize all

**Date:** 2026-10-27
**Agent:** kol-fxr (local, MBP)
**Summary:** Plan 41 W5 became plan 42: audited all 72 loops at param level, then built it end to end. At most 12 rows per rail tab, Randomize all rolls the look not the structure, unspanned ranges roll the middle half.

## Changes Made

### Files Modified
- `package.json` — kol-component 0.305.0.
- `src/editor/params/AutoControls.jsx` — a section with any `collapsed: true` param renders as the DS `AccordionPanel`, closed.
- `src/editor/params/schema.js` — grammar documents `collapsed`, `rMin`/`rMax`.
- `src/editor/lib/rng.js` — a range without `rMin`/`rMax` rolls the middle half of its slider.
- `src/loops/penrose/host.js` — `STRUCTURAL` key set (noRandom across 55 sims), shape + opacities noRandom, colours + opacities in a closed Color section after the sim's knobs.
- `src/loops/lib/fill.js`, `pattern/patternLoop.js`, `scanline/engine.js`, `math/{expression,waveform,curves,spinner,threads,surface,fields}.js`, `gl/catalog.js` (Iridescent, Soft forms, 3D scene, Ribbon, Drift, Mesh, Forms, Environment), `paratype/glyph.js`, `flow/{asciiField,glyphVortex,voronoiPulse,obstacleFlow}.js`, `optic/{moire,halftone,reaction}.js`, `abstract/presets.js`, `distress/engine.js` — closed sections and noRandom per the plan's appendix.
- `src/editor/params/rolls.check.mjs` (new) — every preset: ≤12 rows per tab, ≤10 non-colour values per Randomize all.
- `src/pages/fxChangelogRows.js` — "Calmer Randomize all" row.
- `docs/documentation/03-generative/02-scoped-randomize.md`, `05-parameters-binding/01-schema-and-controls.md` — the default span and `collapsed`.
- `.kol/llm-plan/42-normalise-knobs-and-randomize-all.md` (new, all ✅); plan 41 W5 points to it.

### Features Added/Removed
- Added: closed sections on the rail; calmer Randomize all in every generator family.

## Current State

### Working
- `rolls.check` ok on 473 presets; `schemas.check`, `palette.check` ok.
- Browser: 4,730 seeded rolls left every noRandom param still and every range in span; Labs walk of Penrose and Ribbon; console clean.

### Known Issues
- Closed sections use the DS Accordion type and padding: "Color +" in its own voice, looser gaps than the rail.
- Spans are the middle-half rule, not tuned per param by eye.
- Agent calls the user has not seen: Ribbon seed on Gen + Detail/Color/Glass/View/Post closed; Pattern Frame/Form closed on Style instead of moved to Anim.

## Next Steps
1. User walks Randomize all across families; tune any span he dislikes with `rMin`/`rMax`.
2. Plan 38: text frames + Character / Paragraph panels.
