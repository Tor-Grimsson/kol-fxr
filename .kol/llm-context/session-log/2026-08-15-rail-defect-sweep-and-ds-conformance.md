# Session: Rail defect sweep — DS conformance, one control class at a time

**Date:** 2026-08-15
**Agent:** Grim (Opus 5)
**Summary:** Twelve defects raised off five screenshots; seven landed as DS-conformance fixes (input, labels, sections/dividers, preset roll, rail width, helper prose, focus), four DS gaps filed as tickets, and the spacebar "steal" disproved by live probe.

## Changes Made

### Files Modified
- `src/editor/params/TransportBar.jsx` — loop readout rebuilt on the shipped `Input variant="property"` (`affordance="Loop /"`, `unit="s"`); new `LoopField` does draft-then-commit so the store's floor lands on COMMIT, not per keystroke. `SIZES.mono` retired (scale comes from the DS Input's `size`).
- `src/editor/params/AutoControls.jsx` — THREE `inline` early-returns deleted; they existed only to hand-roll a label, and the generic `LabeledControl` return already rendered the same structure. Group wrapper → DS `Section`. Added the **picking-cluster split**: a sectionless group breaks after its leading run of selects.
- `src/editor/params/rolls.jsx` — new `computePresetRoll(layer, seed)` + `presetRollPool(layer)`, lifted out of MobileOverlay.
- `src/editor/compose/inspectors/ParametersPanel.jsx` — **Randomize preset** button on the Generate tab (gated on a non-empty pool).
- `src/editor/mobile/MobileOverlay.jsx` — local `shufflePreset` deduped onto the shared roll; four imports dropped.
- `src/editor/labs/LabsParams.jsx` — four hand-rolled section wrappers → DS `Section`.
- `src/editor/labs/labs.css` (since moved by the adoption session) — uppercase cascade hack DELETED; hairline unscoped from `.kol-labs-fx`; both rails onto one width standard, right rail on its own `--kol-rail-w`.
- `src/editor/compose/inspectors/{EffectsPanel,KineticPanel}.jsx` + `ParametersPanel.jsx` — all four `ANIM_HINT` declarations and nine render sites removed.
- `src/editor/components/Hint.jsx` (NEW, since reduced to 3 lines by the adoption) — the placeholder gate.
- `src/editor/lib/appSettings.js` — `showHints` (since removed; the DS owns it now).
- `src/editor/state/keymap.js` — `toggle-hints` on `I`.
- `src/loops/penrose/round2/fluid-03-stam.js` / `fluid-05-sph.js` — two self-redundant compound preset names shortened.

### Features Added/Removed
- **Added:** Randomize preset (rolls WHICH preset, an axis with no button outside mobile). Placeholder-text gate, default OFF.
- **Removed:** all helper prose; the labs uppercase `text-transform`; five hand-rolled label spans.

## Current State

### Working
- Build green after every step. Divider lands below the Seed/Scatter dropdowns; labels render one casing; the loop field accepts free typing.

### Known Issues
- **Four premises of mine were wrong and are corrected in the record:** labs mounts `OutputCanvas`, not `Canvas` (killed a double-toggle theory); the rails were 16rem vs 20rem, NOT "already the same" — the `var(--kol-sidenav-w, 20rem)` fallback never applied; the kol-ds-ui showcase does NOT suppress focus rings; and no `outline: none !important` existed in `kol-editor.css`. The last two went into a filed ticket before being checked.
- **Spacebar "steal" does not reproduce.** Probed headless in both views, focused and unfocused: transport toggles 4/4, leaf/tab never activates, zero console errors. Stale cache is the leading explanation.
- Never reproduced: the duplicate zoom chip; the "loops sidebar" complaint (no screenshot).
- `I` was originally bound to `H`, which is `toggle-visibility` — caught by the kol-ds-ui agent, fixed.

## Next Steps
1. User re-test of the spacebar on a hard reload — if it recurs, capture WHICH view.
2. The eyebrow sweep: ~15 places still hand-type `kol-helper-10 text-meta` instead of using `Section`. Deferred by the user (filed).
3. Section eyebrows read sentence-case now that nothing auto-uppercases — author them uppercase if that's wanted.
