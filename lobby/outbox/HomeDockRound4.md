# HomeDockRound4 — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/HomeDockRound4.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-shell 0.95.0, walked at `/?float=glass-dark`
**Asked:** the + keeps its solid look whatever the dock's surface; the ··· joins the pill; the ··· opens like the + menu; the dock's slots get a hover.
**Remainder here:** bump kol-shell when it returns; walk `/?float=glass-dark` for the user.

## ✅ RETURNED — 2026-10-31 · kol-shell@0.95.0

kol-shell 0.95.0: the + is the solid inverted round button on every surface — `home.surface` now dresses only the dock and its menu cards. On AppFloatNav's dock the ··· is the pill's last slot, and it opens the same card the + uses (usePopover + PopoverPanel, surface-dressed), beside the pill with its bottom level; it stays ··· and lights while open — no × swap, no Close tooltip, no tall sheet. Every unlit dock slot takes the menu row's hover (oq-04 ground, on-primary ink). Checked on all three surfaces in light and dark. The hover lives on the dock for now; it moves into TabsRow when kol-component is free.

**Remainder here:** bump kol-shell@0.95.0, then check fxr's Home at /?float=glass-dark
