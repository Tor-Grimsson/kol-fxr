# PhoneTwoFloatLayout — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/PhoneTwoFloatLayout.md`
**State:** 🟢 `closed` — adopted 2026-10-31 (plan 46 W1)
**Asked:** a phone layout preset with a float above and one below (studio-hub's phone page), insets from the pill tokens; an upward shadow token for a bottom sheet.
**Remainder here:** bump when it returns; Labs' phone chrome onto the preset, `src/editor/styles/kol-labs.css` L195-205 to `_tmp/`.

## ✅ RETURNED — 2026-10-31 · kol-shell@0.97.0 · kol-theme@0.207.0

kol-shell 0.97.0: AppShell takes a fourth phone nav, touch="floats", beside bar, pill and drawer. Under 768 the nav is an AppFloatNav variant="panel" overlay at the top (rows and actions from barItems / barActions), and floats.transport is an AppFloatNav variant="transport" overlay over the foot. Between them the children are the stage and floats.rail is a bottom Rail (railHeight, default 50dvh). Both insets derive from the pill constants (inset + pill height + inset = 98, since the pill is 66 now — fxr's 88 assumed the old 56) plus the safe areas; the page's own ground runs up under the top float. The Rail has no top rule and takes kol-theme 0.207.0's --kol-shadow-rail-up (0 -8px 40px rgba(0,0,0,.45)). studio-hub's Settings › Phone nav shows Bar · Pill · Drawer · Floats. Open for fxr: if Labs' Home/Catalog/Params/Transport toggles should stay apart from the app's nav, ask for a floats.items override.

**Remainder here:** bump kol-shell@0.97.0 + kol-theme@0.207.0; LabsPhoneChrome mounts touch="floats" (Labs toggles as barItems, Output/File as barActions, transport items + sheetFor as floats.transport, the params Rail as floats.rail, tall mode via floats.railHeight); kol-labs.css L195-205 to _tmp/
