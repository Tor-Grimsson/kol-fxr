# MenuDropdownNestFlyout

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MenuDropdownNestFlyout.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

A side-opening submenu mode for `MenuDropdownNest` — the editor's menu bar opens its submenus beside the row (Affinity). kol-fxr's `src/editor/shell/menus/MenuFlyout.jsx` is the stand-in and the reference. Parked here as plan 17 until filed (2026-10-13).

## What this repo does on the return
bump; swap `MenuFlyout` for the DS flyout in `src/editor/shell/MenuTop.jsx`, retire `menus/MenuFlyout.jsx` to `_tmp/`, walk every menu three deep.

**Remainder here:** none yet — on the return: the steps above.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**: `MenuDropdownNest flyout` (+ `scroll`, `disabled`): hover opens beside the row, leaf click closes the whole menu, flips at the right edge, nests to any depth. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/MenuDropdownNestFlyout.md`.

**Remainder here:** bump kol-component ^0.252.0, then the steps above (see the resolution's "For fxr").

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/MenuDropdownNestFlyout.md`. The registry still lists 0.251.0 as latest — adoption waits on the publish.

**Remainder here:** bump kol-component to 0.252.0 once it is on the registry; `MenuDropdownNest flyout` (+ `scroll`) replaces `MenuFlyout` in `MenuTop.jsx`; retire `menus/MenuFlyout.jsx` to `_tmp/`; walk the menus three deep.

## Adopted — 2026-10-13

kol-component 0.252.0 pinned; all 25 `MenuFlyout` uses in `MenuTop.jsx` are `MenuDropdownNest flyout` (`scroll`/`disabled` as before); `menus/MenuFlyout.jsx` retired to `_tmp/2026-10-13-menuflyout-retired/`. Walked on `vite preview`: Tools › Generative › Loops › Field three deep, a leaf click inserts Stripes and closes the whole menu. 0 console errors.

**Remainder here:** none.
