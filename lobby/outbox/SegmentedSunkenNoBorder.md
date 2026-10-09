# SegmentedSunkenNoBorder

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/SegmentedSunkenNoBorder.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-09

The sunken `SegmentedToggle` keeps a transparent 1px border, so the strip's cells are 24 inside the pinned 26 and it reads shorter than a Button sm. User: *"there shouldnt be a border in that tone. only divider between the buttons"*. Plan 17 item 3.

## What this repo does on the return
bump kol-theme; look at the labs rail strip beside a Button sm.

**Remainder here:** bump kol-theme to ^0.171.0; look at the labs rail strip beside a Button sm.

## Answered — 2026-10-09

kol-ds-ui closed it as **kol-theme 0.171.0**: the sunken/inverse strip sets `border-width: 0`;
cells fill the pinned height, the 1px dividers stay. No prop change — the bump is the adoption.
Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SegmentedSunkenNoBorder.md`.

## Answered — 2026-10-09

kol-ds-ui closed it as **kol-theme 0.171.0**: `border-width: 0` in the sunken/inverse strip, the height pin untouched, dividers kept. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/SegmentedSunkenNoBorder.md`.

## Adopted — 2026-10-09

**Remainder here:** none — kol-theme 0.171.0 pinned; the look beside a Button sm is the user's to check in the labs rail.
