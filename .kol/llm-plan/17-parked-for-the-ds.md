# Plan — Parked for the DS (fetch locally)

**Status:** OPEN LIST. Every DS gap a cloud session finds goes here; a local session files them to kol-ds-ui as lobby tickets, one each, and strikes the line.
**Origin:** user, 2026-10-08: *"what should go to DS should just go to the parked plan, I'll fetch it there locally later"*

## Open

1. **Step list → kol-component** (plan 14 § 4). The Morph rail's numbered list — `StepList` in `src/editor/morph/MorphTab.jsx` — as a list item + group, two variants: (1) arrows, (2) the grab handle (`drag-handle`, HTML drag). Swap the local copy for the package's once shipped.
2. **`SegmentedToggle` per-option `disabled`** (plan 14 § 2). Options take `{ value, label, ariaLabel, tooltip }` only (0.244.0); a greyed cell here is a dimmed label with the reason as its tooltip and an `onChange` that refuses it (`MorphTab.jsx`, `dim`). The DS cell should take `disabled` and draw it.

## Filed
_(none yet)_
