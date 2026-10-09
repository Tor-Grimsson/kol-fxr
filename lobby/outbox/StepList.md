# StepList

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/StepList.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-09 — kol-component 0.245.0 (+ kol-theme 0.169.0) · synced 2026-10-09

The Morph rail's numbered slot list (`src/editor/morph/MorphTab.jsx` `StepList`) specced as a DS molecule — list item + group, `grab` and `arrows` reorder variants, active row, × remove, dashed add row. Plan 14 § 4 → plan 17 → plan 19 § 7.

## What this repo does on the return
Bump kol-component, swap the local `StepList` for the package's (`items` / `activeIndex` / `onMove` / `onAdd` as the spec names them), retire the local copy to `_tmp/`, walk the Morph rail at 1600 and 390.

**Remainder here:** bump kol-component to ^0.245.0; swap `MorphTab.jsx`'s local `StepList` for the
import (`stepLabel()` / `reorderStep()` / `removeStep()` → props, `cs` → `size`); retire the copy to `_tmp/`.

## Answered — 2026-10-09

kol-ds-ui closed it as **kol-component 0.245.0**: `StepList` with the spec's props. One deviation,
stated: `grab` is a pointer sort (works under a finger), lifted from `RecordManager` into
`hooks/usePointerSort` — not `LayerStack`'s HTML drag. Walked on `/components/step-list`.
Resolution: `~/dev/projects/kol-ds-ui/lobby/done/StepList.md`.

## Adopted — 2026-10-09

**Remainder here:** none — done 2026-10-09: kol-component 0.245.0 + kol-theme 0.169.0 pinned; `MorphTab.jsx` on the DS `StepList` (`grab`, pointer sort) and `options[].disabled` on the mode strip, `dim()` and the `onChange` guard gone; the local list retired to `_tmp/2026-10-09-morph-steplist/`. Walk: plan 20 § 9 step 0's preview.
