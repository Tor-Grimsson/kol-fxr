# StepList

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/StepList.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` · synced 2026-10-09

The Morph rail's numbered slot list (`src/editor/morph/MorphTab.jsx` `StepList`) specced as a DS molecule — list item + group, `grab` and `arrows` reorder variants, active row, × remove, dashed add row. Plan 14 § 4 → plan 17 → plan 19 § 7.

## What this repo does on the return
Bump kol-component, swap the local `StepList` for the package's (`items` / `activeIndex` / `onMove` / `onAdd` as the spec names them), retire the local copy to `_tmp/`, walk the Morph rail at 1600 and 390.
