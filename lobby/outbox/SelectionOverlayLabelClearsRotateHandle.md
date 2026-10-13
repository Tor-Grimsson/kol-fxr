# SelectionOverlayLabelClearsRotateHandle

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SelectionOverlayLabelClearsRotateHandle.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

0.253.0's upright size label hangs under the rotated bounds; at 180° the rotate handle points down and lands on it (`397 ● 317`). Ask: the label clears the handle. Found adopting `SelectionOverlayLabelUpright` (plan 30 § 13).

## What this repo does on the return
bump only; rotate a layer 180° and read the label.

**Remainder here:** none yet — on the return: bump.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.255.0**: the size label hangs 6px under the rotate handle when the handle falls in its column below the box. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SelectionOverlayLabelClearsRotateHandle.md`.

**Remainder here:** bump kol-component ^0.255.0, then the resolution's closing line.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.255.0**: when the rotate handle falls in the label's column below the box, the label hangs under the handle. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SelectionOverlayLabelClearsRotateHandle.md`. The registry still lists 0.253.0 — adoption waits on the publish.

**Remainder here:** bump kol-component to 0.255.0 once it is on the registry; rotate a layer 180° and read the label.

## Adopted — 2026-10-13

kol-component 0.255.0 pinned. Walked on `vite preview`: a rectangle at 180° — handle 632–639, label 643–657, no overlap; the full plan 30 walk green, 0 console errors.

**Remainder here:** none.
