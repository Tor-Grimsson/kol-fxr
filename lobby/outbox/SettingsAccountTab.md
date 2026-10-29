# SettingsAccountTab — The settings rail gains an Account tab when the user is signed in (the app's rows: picture, name, email, invites, sign out); the account row and Home's menu open Settings on that tab — one place for the user's space, not a second rail

**Filed:** 2026-10-29 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsAccountTab.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-29

## Why it went there
The user: *"why isnt account just in settings in account tab?"* — the settings rail's tabs are kol-shell's and fixed.

## What stays here
On the bump: AccountRail's rows passed as the Account tab, the rail to `_tmp/`.

## ✅ CLOSED in kol-ds-ui — 2026-10-29

Shipped **kol-shell 0.88.0**. `signIn.account: { sections, content?, footer? }` is an **Account** tab, first in the settings rail while signed in. It holds typed rows (`sections`), a node for what rows cannot say (`content`: the picture with its hover-× and Upload), and `footer: { label, onPress }` (Sign out). Without `onProfile`, the account row, from the rail's foot, Home's menu or More, opens the rail on that tab. If an app has no `settings`, the rail opens with Account alone. Walked on studio-hub, whose reference account is now this tab: Account · Settings · Shortcuts · About · Docs, the rows, and Sign out signs out.
Resolution: `kol-ds-ui/lobby/done/SettingsAccountTab.md`.

**Remainder here:** bump kol-shell 0.88.0; fxr's account as `signIn.account` (drop `onProfile`); `src/components/AccountRail.jsx` to `_tmp/`.


## ✅ ADOPTED — 2026-10-29

kol-shell 0.88.0 pinned. `signIn.account: { content: <AccountPanel/>, footer: { label: 'Sign out' } }`; `onProfile` dropped; `src/components/AccountRail.jsx` to `_tmp/2026-10-29-account-rail/`. Walked: Home's ••• account row opens Settings on Account (Account · Settings · Shortcuts · About).

**Remainder here:** none.
