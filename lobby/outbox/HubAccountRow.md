# HubAccountRow — The Hub's Sign in row grows into an account row: signed in it shows the user's avatar and name and opens the app's profile page; signed out it asks email + password in the DS dialog

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubAccountRow.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28 · adopted 2026-10-28

## Why it went there
P4 (user, 2026-10-28): *"I am the only user. and we will treat me THE ONLY USER as a proper user"* … *"maybe user space? profile picture, name, custom settings?"* … *"in the rail instead of the cloud 'signed in' just says user?"*; and on the copy: *"why does it say password for library sync? … stupid."*. Plan 43.

## What stays here
Adopting it on the bump (plan 43).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.85.0 · kol-component 0.309.0. `signIn.user: { name, avatar? }` + `signIn.onProfile()`: signed out the DS dialog asks Email and Password (`modal.form`, title "Sign in") → `onPress({ email, password })`; signed in the rail row is the avatar (`Avatar size="xs"`, the initial when none) and the name, opening `onProfile()`. Without `user` the shared-password row is unchanged. Resolution: `kol-ds-ui/lobby/done/HubAccountRow.md`.

**Remainder here:** 📌 bump; pass `signIn={{ signedIn, user, onProfile: () => navigate('/account'), onPress }}`; sign-out lives on your profile page.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.85.0 · kol-component 0.309.0 pinned. `signIn={{ signedIn, user, onProfile, onPress }}` in `AppLayout.jsx`; the last-email bridge retired. Walked at 390: signed out, More › Sign in asks Email and Password and signs in; signed in, the row reads the account's name and opens `/account`.

**Remainder here:** none.
