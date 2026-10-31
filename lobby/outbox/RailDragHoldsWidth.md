# RailDragHoldsWidth — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/RailDragHoldsWidth.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.327.0, walked (plan 49 1.1)
**Asked:** NavRail keeps a dragged width (no snap); a click still snaps collapsed ⇄ expanded and resets it; a max width instead of the open width; rows follow the width.
**Remainder here:** bump kol-component (and kol-shell if it moves) when it returns; walk plan 49 1.1's acceptance.

## ✅ RETURNED — 2026-10-31 · kol-component@0.327.0

kol-component 0.327.0, NavRail's app rail (useRailDrag): a drag follows the pointer from 48 to a max of 560 and stays where it is let go — no snap, no jump (sampled across the release). A click on the grab (or Enter / Space) still snaps: any width above 48 → 48, 48 → the open width (--kol-shell-rail-open, 380), so a click resets a custom width. Below 160 the rail is icons only (a container query hides labels, section chevrons and the title), and railOpen / onSnap / aria-expanded report from that 160 threshold, live during a drag. Checked on studio-hub at 1440, light and dark: 380 → drag 300 → 302 after 1 s; drag 560 → 560; drag 900 → 560; click 300 → 48 → 380; drag 122 → icons only. Notes: the width is not persisted; a click at an icons-only custom width (e.g. 120) collapses to 48; the rail is now a container, so a position:fixed element placed inside the rail slot positions against the rail (popovers and tooltips portal to body and are unaffected).

**Remainder here:** bump kol-component@0.327.0; check any fixed-position element fxr places inside the rail slot
