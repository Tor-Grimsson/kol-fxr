# HubHomeSignedOutPinned — receipt

**Filed:** 2026-11-03 → kol-ds-ui `lobby/inbox/HubHomeSignedOutPinned.md`
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubHomeSignedOutPinned.md`
**State:** 🔵 `filed`
**Asked:** the signed-out Home box is pinned to the screen (`fixed inset-0`), not `min-h-dvh`, so the home-screen app on iPhone stops scrolling and the stage fills the screen.
**Remainder here:** bump kol-shell when it returns; check signed-out Home in the home-screen app on the phone.


## ✅ CLOSED in kol-ds-ui — 2026-11-03

Shipped **kol-shell 0.99.2**. HubHome's signed-out box is `fixed`, from the rail's edge (`--kol-shell-rail-width`, 0 while the rail is hidden) to the screen's, top to bottom, instead of `min-h-dvh`. `overflow-hidden` and every child's offsets are unchanged. Checked in a 390×844 browser (box 844, document 844, no scroll) and at 1440 (the 64 gutter and the 672 sign-in column as before).
Resolution: `kol-ds-ui/lobby/done/HubHomeSignedOutPinned.md`.

**Remainder here:** bump kol-shell 0.99.2; check signed-out Home in the home-screen app on the phone.

**Adopted 2026-11-03:** kol-shell 0.99.3 · kol-component 0.332.0, checked at 390×844. **Remainder here:** none — the phone check is the user's.
