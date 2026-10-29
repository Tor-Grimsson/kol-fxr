# HubAppOwnsItsRows — Let the app supply the Hub's rows itself — Home's round menu, the rail's pinned foot, the phone More sheet, the signed-out page's slots — so a row added, removed or reordered is an app edit, not a DS ticket

**Filed:** 2026-10-29 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubAppOwnsItsRows.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-29

## Why it went there
The user: *"file it so it has more flexibility, I dont wanna file every goddamn change"*.

## What stays here
On the bump: the account row in Home's menu through `home.menu` (covers `HomeMenuAccountRow`).

## ✅ CLOSED in kol-ds-ui — 2026-10-29

Shipped **kol-shell 0.88.0**. All four places take a function of the Hub's rows, `(defaults) => rows`:
- `home.menu` is the masthead's round button (signed in).
- `home.signedOutActions` is the + on the signed-out page.
- `shell.foot` is the rail's pinned foot.
- `AppHub phoneNav.more` is the phone pill's More sheet.

Rows are `{ icon, label, onPress | path, avatar? }`; a pressing row travels the rail as a sentinel, and the Hub still draws every row. Absent, nothing changes. Walked on studio-hub with temporary probes, since removed: a row added to Home's menu presses, and a row added to the rail's foot sits first and presses. `phoneNav.more` shares the code path but was not walked on a touch device.
Resolution: `kol-ds-ui/lobby/done/HubAppOwnsItsRows.md`.

**Remainder here:** bump kol-shell 0.88.0; your Home menu, foot and More edits live in fxr from now on.


## ✅ ADOPTED — 2026-10-29

kol-shell 0.88.0 pinned. Bumped; nothing to change yet — the next menu, foot or More edit is fxr's own (`home.menu`, `shell.foot`, `phoneNav.more`, `home.signedOutActions`).

**Remainder here:** none.
