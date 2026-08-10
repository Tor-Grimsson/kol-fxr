# Session: Oscilloscope rail arc + three input laws

**Date:** 2026-08-09
**Agent:** Grim (Fable 5)
**Summary:** Same-day continuation after the category-law log: the Oscilloscope grew its full rail surface (working scope chips, Wild generator, Fit/Reset, X/Y zooms), the Fit feedback-loop and aliasing defects were root-caused against labs source, and three durable UI laws landed in memory (opaque icons, filled inputs, typed-input-outranks-slider).

## Changes Made

### Files Modified
- `src/editor/compose/inspectors/ParametersPanel.jsx` — ⌥-click on any scope chip AND Randomize all = **reset that scope** (`resetScope`: preset-pinned values ∪ schema defaults, one history entry). **Wild** button (math-expression only) in the scope grid — seeded procedural expression, same `_rollSeed` flow. **Fit/Reset** pair in the Style tab (Fit → `fitBounds`; Reset → the View scope reset).
- `src/editor/lib/rng.js` — `randomizeSchema` honors a schema-authored `p.roll(rng)` hook (generic: params unrollable by type supply their own seeded generator).
- `src/loops/math/expression.js` — `expr` rolls via the hook (curated labs-EXAMPLES pool → Expression chip and Randomize all both swap the expression); Bounds section folded into View (user call); `wildExpression` (grammar compositor: nested rate modulation, convex blends, normalized products, pulse gates — fuzz-verified 500 seeds, 0 gate rejections); labs' View **X/Y zooms** as params (Scale slider skipped — labs derives it, sets both); **eval pinned to (min 0, max 100)** everywhere — the knob range is the helpers' fixed scale, bounds are viewport ONLY; `fitBounds` = labs' one-shot fit + zooms→1 + **10% Y headroom, none on X** + sample density scaled with the window (240/s, capped 20k).
- `src/editor/params/AutoControls.jsx` — text param Textarea `ghost`→`filled` (ghost RESOLVES to outline in the shipped atom since the 2026-07-08 chrome law); RangeField typed-commit **unclamped** — slider min/max bounds the drag only.
- `src/editor/params/TransportBar.jsx` — cells paint the opaque scale (`text-oq-48`→`text-oq-96`; hover via raw token — kol-opaque ships bg-* hovers only, header promises more: DS gap, unticketed).
- `src/editor/params/AudioInputRow.jsx` — SegmentedToggle `size="sm"` (rode the post-0.5.0 default md/32px).

### Features Added/Removed
- Oscilloscope rail: Expression · View · Colour · Wild chips (2×2), Fit/Reset, X/Y zooms — the labs Expression page surface complete minus drag-pan.
- Three standing laws → memory: **opaque-icons-no-alpha-tokens** (multi-path glyphs compound at overlaps), **filled-inputs-never-outline**, **typed-input-outranks-slider-range**.

## Current State

### Working
- Fit verified stable on the two field-reported failures: `wave(t*2.5)*2` (was diverging to 685442 — eval fed live bounds into max-scaled helpers; now identical on repeat press) and `ease(t*2, 4)` on a 30s window (was aliased to max 41 — fixed sample grid stepped over the 0.5s spike tips; now reads the true 100).
- Wild/pool rolls, zoom-aware draw, and the reset paths all node-verified against drawn geometry (the lesson kept: assert geometry, not canvas-call counts).

### Known Issues
- Two same-session authored-then-fixed bugs worth remembering: the `Math`-in-SHADOWED compile killer, and a JSX comment in a non-JSX expression (vite parse error). Both caught by the user's browser, not my first checks.
- kol-opaque's missing text/border hover classes — DS gap, ticket not filed.
- Labs' scope drag-pan (panX/panY) not ported — zooms center on the bounds midpoint.

## Next Steps
1. User's visual pass over the full Oscilloscope rail.
2. File the kol-opaque hover-classes gap to the kol-ds-ui lobby if wanted.
3. Consider an opaque-icons sweep across the remaining labs/editor chrome (TransportBar done; rule is in memory).
