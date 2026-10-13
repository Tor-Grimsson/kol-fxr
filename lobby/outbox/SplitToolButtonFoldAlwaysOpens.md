# SplitToolButtonFoldAlwaysOpens

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SplitToolButtonFoldAlwaysOpens.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

`SplitToolButton`: `disabled` kills the whole trigger so the Rotate / Boolean folds cannot open with nothing selected, and `variants` have no per-row `disabled`; the panel is `w-max` over `w-full inline-flex` rows, so it opens as wide as the canvas (the `MenuDropdownItemBlockRow` defect, unfixed here). Plan 30 § 12.

## What this repo does on the return
bump; `ToolPalette.jsx` passes `disabled` per variant (`!canXform` on the Rotate rows, `!canBool` on the Boolean rows) and drops it from the folds; open each fold with and without a selection.

**Remainder here:** none yet — on the return: the steps above.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.253.0**: `disabled` disarms the trigger's action only — the fold opens; `variants[].disabled` greys a row; rows are `flex`, the panel hugs its longest row. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SplitToolButtonFoldAlwaysOpens.md`.

**Remainder here:** bump kol-component ^0.253.0, then the resolution's "For fxr".

## Adopted — 2026-10-13

kol-component 0.253.0 pinned; `ToolPalette.jsx` passes `disabled` per row on the Rotate and Boolean folds (the fold keeps its own `disabled`, which now only disarms the trigger). Walked on `vite preview`: nothing selected, the Rotate fold opens, four rows greyed, panel 191px; with a layer, Rotate 90° left runs. 0 console errors.

**Remainder here:** none.
