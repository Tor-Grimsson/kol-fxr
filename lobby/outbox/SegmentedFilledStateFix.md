# SegmentedFilledStateFix — dark tile = selected, no ring

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/SegmentedFilledStateFix.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-theme@0.38.0` (pure CSS, no component bump): selected = dark `--kol-surface-secondary` tile + bright glyph, unselected transparent/dim with hover brighten, ring DELETED; cell rest ink now opaque `--kol-oq-48`. 📌 **Remainder here:** bump theme ≥0.38.0, drop the `text-oq-48` force-wraps on icon labels; SegBar.jsx stays retired

## Why it went there

The variant is DS chrome; the correction is the user's second same-day
ruling and `SegBar.jsx` (the declared stopgap) is the live reference render.

## What stays here

- `SegBar.jsx` + call sites, until the corrected variant lands.
- **On ship: adopt.** One-pass swap + delete the twin.
