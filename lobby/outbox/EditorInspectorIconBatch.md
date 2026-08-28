# EditorInspectorIconBatch — ten Figma-inspector glyphs

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/EditorInspectorIconBatch.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-icons@0.15.0` (registry-verified): all ten glyphs minted after frame-by-frame approval — layout +5 (`resize-fixed` `resize-auto-w` `resize-auto-h` `constrain` `corner-radius`), tools +3 (`opacity` `angle` `mask`), typography +2 (`line-height` `letter-spacing`). 📌 **Remainder here:** bump ≥0.15.0 and swap the interim stand-ins (text labels, `maximize`, `ptrn-dot`, `rows`, `type`, the "R" prefix) for the real names in one pass; `mask` waits on its feature flag

## Why it went there

Set icons are the DS's to mint — the editor runs shipped drawings and text
labels as stand-ins, never local set icons.

## What stays here

- The stand-ins listed in the entry's table, live in the inspector today.
- **On ship: adopt.** Bump + swap names in one pass; the mask glyph stays
  unused until the mask feature exists (flagged separately).

## ✅ ADOPTED — 2026-08-15

kol-icons is pinned ^0.17.0, well past the 0.15.0 this asked for — verified 2026-08-15.

**Remainder here:** none.
