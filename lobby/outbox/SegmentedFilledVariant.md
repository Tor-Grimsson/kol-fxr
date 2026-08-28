# SegmentedFilledVariant — the segmented state law, from the DS

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/SegmentedFilledVariant.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.36.0` + `@kolkrabbi/kol-theme@0.36.0`: `variant="filled"` (surface tiles, 1px gaps, selected-only inset `--kol-fg-24` ring) + stateless mode (`value={null}` → role group, no selection semantics, onClick = the action). 📌 **Remainder here:** bump ≥0.36.0, DELETE `src/editor/components/SegBar.jsx` (the declared stopgap twin) and swap the inspector alignment/transform strips

## Why it went there

The user's anti-drift law: a local twin of a DS component is the exact
two-ways-drift failure — `SegBar.jsx` exists ONLY because the variant
doesn't, is documented as a stopgap in its header, and dies on ship.

## What stays here

- `SegBar.jsx` + its call sites, until the variant lands.
- **On ship: adopt.** One-pass swap + delete.

## ✅ ADOPTED — 2026-08-15

SegBar.jsx is gone from src/editor/components/ — verified 2026-08-15.

**Remainder here:** none.
