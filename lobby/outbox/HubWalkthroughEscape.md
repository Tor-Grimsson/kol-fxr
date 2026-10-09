# HubWalkthroughEscape

**Filed:** 2026-10-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubWalkthroughEscape.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-09 — kol-shell@0.63.0 · synced 2026-10-09

The Hub's walkthrough carousel on Home ignores Escape (audit A5, re-checked with a real key on 2026-10-09). Plan 20 § 9 step 5.

## What this repo does on the return
Bump kol-shell; nothing else.


**Remainder here:** bump kol-shell to ^0.63.0 (it peers kol-component ≥0.246.0); nothing else.

## Answered — 2026-10-09

kol-ds-ui closed it: `WalkthroughPanel` takes Escape (→ `onClose`) and ← →, on the DS layer stack. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/HubWalkthroughEscape.md`.

## Adopted — 2026-10-09

**Remainder here:** none — done 2026-10-09: kol-component 0.246.0 + kol-shell 0.63.0 pinned once 0.246.0 reached the registry; build green. The Hub's fix is the shell's; nothing here changes.
