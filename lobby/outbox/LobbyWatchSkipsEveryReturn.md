# LobbyWatchSkipsEveryReturn — `lobby --watch` gated on a field returns never touch

**Filed:** 2026-08-30 → **dotfiles**
**Entry:** `~/.dotfiles/lobby/done/LobbyWatchSkipsEveryReturn.md`
**Ledger:** `~/.dotfiles/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-31 — fix live in `bin/lobby:227`

## Why it went there

`bin/lobby` is a dotfiles script. The defect was found here — four returned
receipts in one fxr session and the watch emitted one line, and that one was a
hand-edited receipt, not a return — and **patched in place there** the same
session. Filed for the record, and because the reasoning is worth keeping.

## What stays here

Nothing. The watch reads this repo's `outbox/`; no fxr file changes.

**Remainder here:** none.

## ✅ RETURNED — 2026-08-31 · bin/lobby:227

`receipt_pending()` now checks for a `## RETURNED` section first (`grep -qE '^## .*RETURNED'`, matching `## ✅` and the older `## ↩`) and falls back to the `**Last known:**` header only when there is none — so a return that never rewrites that header is no longer read as still-pending. Verified live: the session Monitor emitted `LOBBY RECEIPT — mode-self-arms-from-its-own-docs ← humpty` and stayed armed, and fxr's three returned receipts all read ANSWERED where all three were silent before. The same pass removed the arm-time exit guard, so the watch holds for the session instead of dying on a quiet outbox.

**Remainder here:** none — the `Last known` vs `## RETURNED` duplication is a dotfiles design call, recorded in its AGENT-CONTEXT
