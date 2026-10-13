# SelectionOverlayLabelUpright

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SelectionOverlayLabelUpright.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

`SelectionOverlay`'s `W × H` readout rotates with the box's chrome, so a layer rotated 90° shows it on end against its right edge, at 10px. Ask: counter-rotate, centre it under the screen bounds, 12px. Plan 30 § 13.

## What this repo does on the return
bump only — the editor already passes `showLabel`; rotate a layer 90° and 45° and read the label.

**Remainder here:** none yet — on the return: bump.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.253.0**: the `W × H` label is upright, centred 6px under the rotated box's bounds, 12px. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SelectionOverlayLabelUpright.md`.

**Remainder here:** bump kol-component ^0.253.0, then the resolution's "For fxr".

## Adopted — 2026-10-13

kol-component 0.253.0 pinned. Walked on `vite preview`: a rotated rectangle's readout is horizontal under the box, 12px. At 180° the rotate handle lands on it — filed as `SelectionOverlayLabelClearsRotateHandle`.

**Remainder here:** none.
