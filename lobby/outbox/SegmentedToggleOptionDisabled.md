# SegmentedToggle — per-option `disabled`

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SegmentedToggleOptionDisabled.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-09 — kol-component 0.245.0 (+ kol-theme 0.169.0) · synced 2026-10-09

`SegmentedToggle` options have no `disabled` (0.244.0); the Morph rail's mode strip fakes a blocked cell with `dim()` + tooltip + a refusing `onChange` (`MorphTab.jsx:41-72`). Plan 14 § 2 → plan 17 → plan 19 § 7.

## What this repo does on the return
Bump kol-component + kol-theme, delete `dim()` and the `onChange` guard in `MorphTab.jsx`, pass `disabled: !!blocked[v]` on each mode option, check a blocked cell at 1600 and 390 (dimmed, tooltip, ←/→ skips it).

**Remainder here:** bump kol-component to ^0.245.0 and kol-theme to ^0.169.0; delete `dim()` and
the `onChange` guard in `MorphTab.jsx`; pass `disabled: !!blocked[v]`.

## Answered — 2026-10-09

kol-ds-ui closed it as **kol-component 0.245.0 + kol-theme 0.169.0**: `options[].disabled` —
aria-disabled, oq-24 ink, press refused, ←/→ skip it, tooltip still gives the reason, may stay the
current value. Walked on `/components/segmented-toggle`.
Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SegmentedToggleOptionDisabled.md`.

## Adopted — 2026-10-09

**Remainder here:** none — done 2026-10-09: kol-component 0.245.0 + kol-theme 0.169.0 pinned; `MorphTab.jsx` on the DS `StepList` (`grab`, pointer sort) and `options[].disabled` on the mode strip, `dim()` and the `onChange` guard gone; the local list retired to `_tmp/2026-10-09-morph-steplist/`. Walk: plan 20 § 9 step 0's preview.
