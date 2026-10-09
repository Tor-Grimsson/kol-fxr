# SegmentedToggle — per-option `disabled`

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SegmentedToggleOptionDisabled.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` · synced 2026-10-09

`SegmentedToggle` options have no `disabled` (0.244.0); the Morph rail's mode strip fakes a blocked cell with `dim()` + tooltip + a refusing `onChange` (`MorphTab.jsx:41-72`). Plan 14 § 2 → plan 17 → plan 19 § 7.

## What this repo does on the return
Bump kol-component + kol-theme, delete `dim()` and the `onChange` guard in `MorphTab.jsx`, pass `disabled: !!blocked[v]` on each mode option, check a blocked cell at 1600 and 390 (dimmed, tooltip, ←/→ skips it).
