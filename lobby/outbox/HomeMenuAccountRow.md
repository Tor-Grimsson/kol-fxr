# HomeMenuAccountRow — Signed in, Home's round menu holds only New File and Walkthrough; it should carry the account row too (the `user` glyph or the picture, the name) opening `signIn.onProfile` — signed out it already carries Sign in

**Filed:** 2026-10-29 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HomeMenuAccountRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-29

## Why it went there
The user: *"here is supposed to be user space as well"* — Home's menu signed in.

## What stays here
The bump; `onProfile` already opens the account rail.

## ✅ CLOSED in kol-ds-ui — 2026-10-29

Shipped **kol-shell 0.88.0**. Signed in, Home's menu (•••) and the phone's More sheet end on the account row: the picture when `signIn.user.avatar` is set, else the outline `user` glyph, with the name. Pressing it calls `signIn.onProfile()`, or opens the Account tab (SettingsAccountTab). Walked on studio-hub: New · Walkthrough · the account. HubAppOwnsItsRows also lets fxr reorder or replace these rows itself.
Resolution: `kol-ds-ui/lobby/done/HomeMenuAccountRow.md`.

**Remainder here:** bump kol-shell 0.88.0; look at Home's ••• signed in.


## ✅ ADOPTED — 2026-10-29

kol-shell 0.88.0 pinned. Walked signed in: ••• lists New File, Walkthrough, the account (name); it opens the Account tab.

**Remainder here:** none.
