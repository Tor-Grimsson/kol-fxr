# ItemList — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/ItemList.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.330.0, walked
**Asked:** a reorderable list of rows: number · swatch · eye · name · inline control · actions, one row selected (plan 51 4.4).
**Remainder here:** when it returns, swap fxr's local piece for it and retire the local one to `_tmp/`.

## 🟠 RETURNED — 2026-10-31 · built, awaiting publish

No new component: `StepList` (the numbered, hand-ordered list fxr's Morph tab already uses) is the shipped part, extended — rows take optional `swatch`, `shown` (an eye; `onToggleShown(i)`), `control` (an inline node after the name; the name narrows to w-20) and `actions` (`[{ icon, label, onClick, hidden }]`, a hidden one keeps its slot, never shows disabled). The whole row selects; reorder by grab, arrows or actions; `size` rides the control ramp. A plain list renders as before. Decided for review: extend over a second numbered list; the selection stays `activeIndex` (index, not id).

Not on npm yet — kol-component needs a minor publish; synced: 2026-10-31 from kol-ds-ui `lobby/INDEX.md`.

**Remainder here:** bump kol-component when published; Soft forms' and Penrose's Layers sections render `StepList` with the row slots (`activeIndex = items.findIndex(id)`), LayerRow retires to `_tmp/`.


## ✅ RETURNED — 2026-10-31

🟢 `closed` in **kol-ds-ui**: `StepList` row slots (`swatch` · `shown`/`onToggleShown` · `control` · `actions`) in @kolkrabbi/kol-component@0.330.0.

**Remainder here:** bump kol-component to ≥0.330.0; Soft forms' and Penrose's Layers sections render `StepList` with the row slots (`activeIndex = items.findIndex(id)`), LayerRow retires to `_tmp/`.

**Adopted:** both Layers sections render StepList (Soft forms reorders by drag — StepList's arrows grey out at the ends); LayerRow in `_tmp/2026-10-31-layerrow/`.
