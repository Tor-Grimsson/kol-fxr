# Plan — Parked for the DS (fetch locally)

**Status:** FOLDED into plan 19 § 7 (2026-10-08, local) — one list, not two. New DS gaps from a cloud session still land here; a local session folds them forward.
**Origin:** user, 2026-10-08: *"what should go to DS should just go to the parked plan, I'll fetch it there locally later"*

## Open

1. **`LayerStack` has no `onContextMenu`** (the user's 23, audit E5, 2026-10-09). The layer rows take no right-click; the canvas menu carries every layer verb (duplicate · hide · lock · flatten · release · crop · delete) and the rows should open the same list. Ask: `onContextMenu(event, layerId)` on the row (the `MediaTile` / `ContentRow` precedent), nothing else.
2. **`MediaLibrary variant="browse"` — the columns view has no empty state** (audit A11, 2026-10-09). With 0 files the rows/grid views say *No files … yet.* (`MediaLibrary.jsx:685`); the columns view shows three ruled blank columns and only the *0 files · 0 B* count line. The empty line belongs in every view. (kol-fxr's Files dialog opens in columns.)

## Filed
1. ~~**Step list → kol-component** (plan 14 § 4)~~ — filed 2026-10-09 as kol-ds-ui `StepList`; receipt `lobby/outbox/StepList.md`.
2. ~~**`SegmentedToggle` per-option `disabled`** (plan 14 § 2)~~ — filed 2026-10-09 as kol-ds-ui `SegmentedToggleOptionDisabled`; receipt `lobby/outbox/SegmentedToggleOptionDisabled.md`.
