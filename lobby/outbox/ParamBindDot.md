# ParamBindDot — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/ParamBindDot.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.330.0, walked
**Asked:** the small dot beside a param row that shows it is bound (modulated) and opens a menu (plan 51 4.4).
**Remainder here:** when it returns, swap fxr's local piece for it and retire the local one to `_tmp/`.

## 🟠 RETURNED — 2026-10-31 · built, awaiting publish

`ParamBindDot`, a new molecule on `Menu` (kol-component, unreleased): `bound` (accent fill + ring), `mode` (tooltip "Bound · <mode>" and the accessible name), `items` (every Menu row key — `{ label, onClick, checked }`…), `label`, `tooltip`, `size` (hit box a field's height: xs 22 · sm 26 · md 32), `align`, `minWidth`. Rest: a hollow oq-48 ring; hover and open: oq-80.

Not on npm yet — kol-component needs a minor publish; synced: 2026-10-31 from kol-ds-ui `lobby/INDEX.md`.

**Remainder here:** bump kol-component when published; BindDot renders `ParamBindDot` (its entries as `items`, `checked` on the current mode), 0 raw `<button>` in `params/`.


## ✅ RETURNED — 2026-10-31

🟢 `closed` in **kol-ds-ui**: `ParamBindDot` (molecule on Menu) exported in @kolkrabbi/kol-component@0.330.0.

**Remainder here:** bump kol-component to ≥0.330.0; BindDot renders `ParamBindDot` (its entries as `items`, `checked` on the current mode), 0 raw `<button>` in `params/`.

**Adopted:** BindDot renders it; the old dot in `_tmp/2026-10-31-binddot/`.
