# MenuItemOffset

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MenuItemOffset.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13 — kol-component 0.256.0, adopted at 0.257.0

`MenuItem` hardcodes `usePopover({ offset: 4 })`; in an `h-8` bar with `sm` triggers the panel floats ~7px under the bar's hairline with its own hairline — two lines and a gap. Ask: an `offset` prop (default 4). Plan 31 § 1.

## What this repo does on the return
bump; `MenuTop` passes the measured offset (one const beside `PANEL`) so the panel's top border sits on the bar's.

**Remainder here:** none yet — on the return: bump + the const.

## ✅ RETURNED — 2026-10-13 · kol-component@0.256.0

New `MenuItem offset` (number, default 4), handed to `usePopover`; negatives overlap. Verified on the showcase (`/components/menu-item`, offset variants 4 · 0 · -2): panel top minus trigger bottom measured 4, 0 and -2 px.

**Remainder here:** bump kol-component ^0.256.0; `MenuTop` passes the measured offset

## Adopted — 2026-10-13

kol-component 0.257.0 pinned (registry had moved past 0.256.0). Walked on `vite preview` (plan 32 walk, `_tmp/2026-10-13-plan-32-walk/`): the File panel top 31 on the bar bottom 32 — one hairline, no gap; `MENU_OFFSET` 2.5 in MenuTop

**Remainder here:** none.
