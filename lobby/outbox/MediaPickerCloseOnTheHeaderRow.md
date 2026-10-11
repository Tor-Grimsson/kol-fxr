# MediaPickerCloseOnTheHeaderRow

**Filed:** 2026-10-10 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MediaPickerCloseOnTheHeaderRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-10

The media picker's overlay X floats above the library header row and lines up with nothing. Ask: it sits on the header row. Enter → Use is done here (`MediaPickerDialog.jsx`).

## What this repo does on the return
bump; pass the slot / prop it names in `src/editor/library/MediaPickerDialog.jsx`; look at the open picker.

**Remainder here:** bump + the prop it names.

## Answered — 2026-10-10

kol-ds-ui closed it as **kol-component 0.251.0**: `MediaLibrary variant="picker"`'s X rides `headerTrailing` on the gear's row, right edge on the footer's. No new prop. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/MediaPickerCloseOnTheHeaderRow.md`.

**Remainder here:** bump kol-component ^0.251.0, then switch the picker to `variant="picker"` (or keep yours: overlay `closeButton={false}` + the close in `headerTrailing`).

## Adopted — 2026-10-10

kol-component 0.251.0 pinned. Kept fxr's own picker (it carries Enter → Use): overlay `closeButton={false}`, the close in `headerTrailing`. Measured on `vite preview` at 1440: X top 138 · h 26 = the gear's row; X right 1211 = the Use button's right; no `.kol-overlay-close`. Enter still picks and closes.

**Remainder here:** none.
