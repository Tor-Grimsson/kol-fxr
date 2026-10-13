# MenuDropdownItemBlockRow

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MenuDropdownItemBlockRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

`MenuDropdownItem` rows are `inline-flex`, so a content-sized menu panel measures them side by side (5 rows ≈ 795px). Ask: `flex`. Parked here as plan 17 until filed (2026-10-13).

## What this repo does on the return
bump; the `flex flex-col` on `MenuFlyout`'s panel can stay (harmless) or go; measure Starters vs Library flyouts.

**Remainder here:** none yet — on the return: the steps above.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**: `MenuDropdownItem` and the nest row are `flex`; a `w-max` panel hugs its longest label. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/MenuDropdownItemBlockRow.md`.

**Remainder here:** bump kol-component ^0.252.0, then the steps above (see the resolution's "For fxr").

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/MenuDropdownItemBlockRow.md`. The registry still lists 0.251.0 as latest — adoption waits on the publish.

**Remainder here:** bump to 0.252.0; nothing else (the `flex flex-col` panel line is harmless and goes with `MenuFlyout`).

## Adopted — 2026-10-13

kol-component 0.252.0 pinned; nothing else here (the panel line left with `MenuFlyout`). Walked: Starters 192 · Aspect 180 · Library 180 · preset leaf 180. 0 console errors.

**Remainder here:** none.
