# FloatsOwnItems — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/FloatsOwnItems.md`
**State:** 🟢 `closed` — kol-shell 0.98.0, bumped 2026-10-31; dock nesting adopted and walked (plan 46 § 2.1); `floats.items` adopted in plan 46 W1
**Asked:** `touch="floats"` takes `floats.items` / `floats.actions` — a page's own rows in the top float, the app's nav untouched when unset; and nested submenus — a sub row opens its own rows, on every AppFloatNav variant (added 2026-10-31).
**Remainder here:** bump kol-shell when it returns; plan 46 1.1 passes Labs' toggles as `floats.items`; plan 46 W2 nests the dock's Labs rows.

## ✅ RETURNED — 2026-10-31 · kol-shell@0.98.0

kol-shell 0.98.0. AppShell touch="floats" takes floats.items (AppFloatNav items for the top float's slots) and floats.actions ([{ label, icon?, onPress, sub? }], replacing barActions as More's actions); unset, it is exactly 0.97.0. The rule for every app: More always holds the app's whole nav, so a page's rows replace the slots, never the way back (phoneNav.sheetItems still overrides). Nested submenus on every AppFloatNav variant: items[].sub[].sub to any depth, the same row shape, a chevron on a row that opens a level. On the dock a level opens beside its parent (the + menu's card); on every phone variant it replaces the rows under a Back row. A leaf runs onPress (or routes its path) and closes every level; Escape and an outside press close all; ↑↓ move, → / Enter open, ← back. studio-hub shows Labs › Generative › Fields › Noise on the dock and the phone pill, and /chrome/labs* passing its own rows. Note: a page that rebuilds its rows while a level is open keeps the old rows until it is reopened.

**Remainder here:** bump kol-shell@0.98.0; Labs passes floats.items / floats.actions on its own route; Home's dock Labs → Generative → its groups as nested sub rows (leaves need onPress or path)
