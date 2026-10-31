# HomeDockShadow — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/HomeDockShadow.md` (plan 45 3.1)
**State:** 🔵 `filed`
**Asked:** the signed-out Home dock (`AppFloatNav variant="dock"`) wears the float shadow Labs' transport pill has.
**Remainder here:** bump kol-shell when it returns; check the dock's `box-shadow` against Labs' pill in both themes.

## ✅ RETURNED — 2026-10-31 · kol-shell@0.91.3

HubHome passes shadow={stage != null} to its AppFloatNav variant="dock", so the signed-out Home dock wears the transport pill's --kol-shadow-float over a stage; the dock preset stays shadow-free for plain surfaces. Measured on studio-hub: the dock's box-shadow is rgba(0,0,0,.4) 0 8px 24px -8px, rgba(0,0,0,.3) 0 2px 6px -2px in light and dark — var(--kol-shadow-float), the transport's. kol-shell 0.91.3 also carries the stage slide (translate, no resize) from 2026-10-30.

**Remainder here:** bump kol-shell 0.91.3

## Adopted — 2026-10-31 · kol-shell 0.91.3

Bumped; the dock's shadow matches Labs' transport pill in light and dark. 0.91.3 also slides the stage into the grey, so `HomeStage.jsx`'s own follow retired.

**Remainder here:** none.
