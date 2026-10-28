# HubHomeSignedOut — `HubHome` signed out: no catalog, a full-bleed stage slot (the app's live generator), the heading alone, the round + (New File, Walkthrough, Sign in) and the chrome pill — frames A2 and B2

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/HubHomeSignedOut.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-10-28

## Why it went there
user, 2026-10-28: *"we shouldnt see any files until you've LOGGED-IN. we should rather have something unique to an unlogged experience"* → ruled: a live generative stage; frames A2 (phone) and B2 (desktop) on the canvas. Plan 44.

## What stays here
Adopting it on the bump (plan 44 W3).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.86.0 · kol-component 0.311.0. `home.signedOut` (or `home.stage` with no files): no catalog; `home.stage` full-bleed behind; the mark top-left alone (48 phone · 112 desk); the round `+` (× open) with New, Walkthrough and Sign in; `home.chromes` as the desk dock and the phone pill, More listing the rail, then the actions, then the pinned foot (frame A2's order); the walkthrough over the stage. Walked on studio-hub at 1440 and iPhone 13 against A2 · B2 (`_tmp/2026-10-28-hub-signed-out/`, 6/6). The round button is the DS's `lg` (40), not B2's 48. Resolution: `kol-ds-ui/lobby/done/HubHomeSignedOut.md`.

**Remainder here:** 📌 bump; pass `home={{ signedOut: !signedIn, stage: <your generator canvas />, chromes: [{ icon, label, onPress }], action, … }}`; label the action New File.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.86.0 · kol-component 0.311.0 pinned. `home={{ signedOut: !session (accounts only), stage: <HomeStage/>, chromes }}` in `AppLayout.jsx`; `src/components/HomeStage.jsx` the growing line in CSS px. Walked 1440 + 390 signed out: no files, the stage, + with New File · Walkthrough · Sign in, the dock / pill; sign in shows the files, sign out returns. Gap filed: `PhonePillMoreTurnsToClose`.

**Remainder here:** none.
