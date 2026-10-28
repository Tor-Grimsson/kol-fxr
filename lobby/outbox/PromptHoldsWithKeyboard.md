# PromptHoldsWithKeyboard — The DS `prompt` / dialog stays put when the iOS keyboard opens, and the page is not left scrolled after it closes

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PromptHoldsWithKeyboard.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-28 · adopted 2026-10-28

## Why it went there
P3 (user, 2026-10-28): *"does the UI have to move upp to show keyboard?"* with two iPhone screenshots: keyboard open (the page shoved up), keyboard closed (the page still shifted, the dialog low). Plan 43.

## What stays here
Adopting it on the bump (plan 43).


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped kol-shell 0.85.0 · kol-component 0.309.0. every DS dialog sizes its scrim to the visual viewport (rides above the keyboard), focuses its field with `preventScroll`, and puts the document scroll back when the keyboard closes and when it closes. Walked in WebKit-less Chromium iPhone 13 emulation; a real iPhone is the full test. Resolution: `kol-ds-ui/lobby/done/PromptHoldsWithKeyboard.md`.

**Remainder here:** 📌 bump; check the sign-in prompt on the phone.


## ✅ ADOPTED — 2026-10-28

kol-shell 0.85.0 · kol-component 0.309.0 pinned. Bumped. Checked in Chromium at 390 only; no WebKit here, so the real iPhone keyboard check is yours to see.

**Remainder here:** none.
