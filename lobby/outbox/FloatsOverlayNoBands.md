# FloatsOverlayNoBands — receipt

**Filed:** 2026-11-03 → kol-ds-ui `lobby/inbox/FloatsOverlayNoBands.md`
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FloatsOverlayNoBands.md`
**State:** 🔵 `filed`
**Asked:** `touch="floats"` floats overlay the content: no top padding on the stage and no padded foot on the bottom Rail. This reverses the insets fxr asked for in PhoneTwoFloatLayout.
**Remainder here:** bump kol-shell when it returns; check Labs on the phone, with the Rail open and closed.


## ✅ CLOSED in kol-ds-ui — 2026-11-03

Shipped **kol-shell 0.99.3**. `touch="floats"`: the stage has no top padding and starts at y=0 under the status bar and the top float (wash rule unchanged). The bottom Rail has no foot padding; its rows run under the transport, and a spacer past the last row (98 + safe area) adds scroll range only, so the last row scrolls clear with no band while unscrolled. Checked at 390×844, light and dark, on studio-hub's Phone nav › Floats: stage top 0, transport over the Rail's rows, last row clears it at the end of the scroll.
Resolution: `kol-ds-ui/lobby/done/FloatsOverlayNoBands.md`.

**Remainder here:** bump kol-shell 0.99.3; check Labs on the phone, with the Rail open and closed.

**Adopted 2026-11-03:** kol-shell 0.99.3 · kol-component 0.332.0, checked at 390×844. **Remainder here:** none — the phone check is the user's.
