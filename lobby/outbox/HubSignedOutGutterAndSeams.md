# HubSignedOutGutterAndSeams — one 64 gutter on the signed-out Home, the rail hidden while signed out, Sign in as a page, the Account tab's sign out as frame D2's button in the rail footer

**Filed:** 2026-10-29 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubSignedOutGutterAndSeams.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-29

## Why it went there
The user, on the signed-out Home and Settings › Account: *"SUGGEST FIXES"* → *"do it"*. All four live in kol-shell (HubHome, AppHub, HubSettingsRail).

## What stays here
On the bump, retire to `_tmp/`: the rail rAF in `src/components/HomeStage.jsx`, `toSignInPage` in `src/AppLayout.jsx` (pass `signIn.page: '/signin'`), and the Sign out button in `src/components/AccountPanel.jsx` (pass `account.footer`).

## ✅ RETURNED — 2026-10-29

🟢 `closed` in **kol-ds-ui** — **kol-shell 0.90.0**. Per part: (1) the signed-out Home's mark, + and dock sit on one 64 gutter on a desk (the mark 80→64 left, the + 72→64 top, the walkthrough on the mark's line); (2) `AppShell railHidden` + `home.railHidden` — the rail is hidden on first paint and on route entry, unset it follows the signed-out Home, `\` still toggles it and signing in returns it (fixed in the shell, no consumer is a frame late); (3) `signIn.page` (a path, or a function) — signed out, the rail's foot row, the signed-out + and the phone's More all route there instead of the DS dialog, and `AppStudio` now forwards `phoneNav`; (4) `account.footer` is frame D2's full-width `Button size="md"` in the rail's `RailFoot` on the Account tab, where the toggle and reset sit on the other tabs. Walked on studio-hub (`_tmp/2026-10-29-hub-signed-out/`, 8 shots).

**Remainder here:** 📌 bump kol-shell 0.90.0; retire to `_tmp/` the `HomeStage` rAF (`src/components/HomeStage.jsx`), `toSignInPage` on `shell.foot` / `home.signedOutActions` (`src/AppLayout.jsx`) and the Sign out button in `src/components/AccountPanel.jsx`; pass `signIn.page: '/signin'` and `account.footer: { label: 'Sign out', onPress: signOutLibrary }`. Then the phone More's Sign in opens `/signin`.

## ✅ ADOPTED — 2026-10-29

kol-shell 0.90.0 pinned. fxr passes `signIn.page: '/signin'` and `account.footer`; the HomeStage rAF, `toSignInPage` and AccountPanel's own Sign out are out (copies in `_tmp/2026-10-29-hub-signed-out-workarounds/`). Walked at 1440 signed out: no rail on load, mark and + both 64 from their edges, `\` returns the rail, the rail's Sign in lands on `/signin` with no dialog. The Account tab's foot is unwalked signed in; the phone More is unwalked on a device.

**Remainder here:** none.
