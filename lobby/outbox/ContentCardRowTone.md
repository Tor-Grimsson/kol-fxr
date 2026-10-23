# ContentCardRowTone — card and row take a `tone`, not only a raw `bg`

**Filed:** 2026-10-22 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentCardRowTone.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-10-22

## Why it went there
The user wants the file card and row's ground set by tone; today only a raw `bg` exists and its hover does not follow.

## What stays here
Pass `tone` on the file card and row once it ships.

## ✅ RETURNED — 2026-10-22 · kol-component@0.288.0

kol-component 0.288.0: `ContentCard` and `ContentRow` take `tone` (the control ladder). The rest ground and its hover step come from the one bundle; `bg` still wins the rest fill. Child controls without their own tone inherit it, as under any tone wrapper.

**Remainder here:** bump kol-component@0.288.0, pass `tone` on the file card and row.
