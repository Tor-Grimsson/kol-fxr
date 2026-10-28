# PublicSansByLink — Public Sans by a Google Fonts link, not a self-hosted file every app carries

**Filed:** 2026-10-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PublicSansByLink.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-10-28

## Why it went there
User, 2026-10-28: *"I think Public should just use link. ticket that to DS"*. kol-theme's `core` declares Public Sans self-hosted at `/fonts/public-sans/`; fxr never uses it. Plan 44.

## What stays here
Nothing to adopt but the bump; fxr adds no public-sans folder.


## ✅ CLOSED in kol-ds-ui — 2026-10-28

Shipped **kol-theme 0.195.0**. `kol-typography.css` declares no Public Sans `@font-face`; the sheet's `--body` still names it, and an app that renders a document sheet adds the Google Fonts css2 link (variable weight, italic) — apps/document and the showcase do. README: Public Sans is not a file an app serves. kol-ds-ui's `public/fonts/public-sans/` to `_tmp/`. Walked: apps/document `/project` renders `.kol-sheet` in Public Sans from the link, no `/fonts/public-sans` request. Resolution: `kol-ds-ui/lobby/done/PublicSansByLink.md`.

**Remainder here:** 📌 bump kol-theme; nothing else — fxr renders no document sheet, so it needs no link.


## ✅ ADOPTED — 2026-10-28

kol-theme 0.195.0 pinned. `kol-typography.css` declares no Public Sans; Labs on `vite preview` requests only `/fonts/jetbrains-mono/…`, 0 console messages.

**Remainder here:** none.
