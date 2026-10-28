# PhoneMoreWholeNav — The phone More sheet lists every nav row above the page actions by default, with a prop to choose which rows

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PhoneMoreWholeNav.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28 · adopted 2026-10-28

## Why it went there
P6 (user, 2026-10-28): *"I think when you press [...] you should get the entire Nav menu list"* → *"yes list the whole nav. but also ship with prop so you can customise if you want to only show xyz but not abc."*. Plan 43.

## What stays here
Adopting it on the bump (plan 43).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.85.0 · kol-component 0.309.0. More lists every rail row (the pill's own and the pinned foot), then the page's actions; `moreItems` (paths or a predicate) on `PhoneNav` and `AppShell` (through `shell`) trims it. Resolution: `kol-ds-ui/lobby/done/PhoneMoreWholeNav.md`.

**Remainder here:** 📌 bump; pass `shell={{ moreItems }}` only if Home's More should list less.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.85.0 · kol-component 0.309.0 pinned. No `moreItems` passed: Home's More lists Home, Library, Editor, Labs, Randomiser, Morph, Media, the account, Settings, then New File and Walkthrough (walked at 390).

**Remainder here:** none.
