# SegmentedFilledStateFix — dark tile = selected, no ring

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/SegmentedFilledStateFix.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-26 — shipped in `@kolkrabbi/kol-theme@0.38.0`; adopted here. Remainder: none.

## Why it went there

The variant is DS chrome; the correction is the user's second same-day
ruling and `SegBar.jsx` (the declared stopgap) is the live reference render.

## What stays here

- `SegBar.jsx` + call sites, until the corrected variant lands.
- **On ship: adopt.** One-pass swap + delete the twin.

## ✅ ADOPTED — 2026-08-26

The 19 `text-oq-48 inline-flex` wrappers on SegmentedToggle icon labels are
gone (AlignmentPanel ×6 · LayerInspector ×7 · TextPanel ×6) — `.kol-seg-cell`
paints `oq-48` rest / `oq-64` hover / `fg-emphasis` active itself. The two
remaining `text-oq-48` (TransportBar's hand-rolled Cell, MobileOverlay's header
chevron) are not seg cells. `SegBar.jsx` stays retired. Verified 2026-08-26 on
kol-theme 0.58.0.

**Remainder here:** none.
