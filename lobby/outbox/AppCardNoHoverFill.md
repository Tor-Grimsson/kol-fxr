# AppCardNoHoverFill — a clickable `app` card takes no surface hover fill

**Filed:** 2026-10-23 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/AppCardNoHoverFill.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## Why it went there
Home and `/library` cards open their file on click, so the DS `app` card is interactive and draws the
`secondary` tone's hover fill (measured rest `rgb(18,18,21)` → hover ≈ `rgb(37,37,39)`). The user ruled no
hover bg on the file card (2026-10-22); `app` forces the tone, fxr cannot turn it off.

## What stays here
Nothing but the bump.

**Remainder here:** none yet — on the return: bump.

## ✅ RETURNED — 2026-10-22 · kol-component@0.293.0

kol-component 0.293.0: a clickable `app` card or row has no hover fill — file’s ruling; rest ground unchanged. Nothing to pass.

**Remainder here:** bump kol-component@0.293.0.


## Adopted — 2026-10-23
Bumped to kol-component 0.293.0; measured on Home: a clickable card's background is `rgb(18, 18, 21)` at rest and on hover (plan 39 § 2.1).

**Remainder here:** none.
