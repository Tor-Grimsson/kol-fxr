# LabsNavIcons — the labs sidebar's 15 nav glyphs

**Filed:** 2026-08-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/LabsNavIcons.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-09 — shipped in `@kolkrabbi/kol-icons@0.14.0`: 11 of the 15 names minted as real drawings (plus `globe`, and `dith-drift` — the labs dash drawing kept beside the rack wave that took the `dith-flow` name), the new `pattern` group born. Four names deliberately NOT minted — they duplicate shipped drawings. 📌 **Remainder here:** bump `@kolkrabbi/kol-icons` to ≥0.14.0 **and** edit labs' `GROUP_ICONS` map — `target-lock`→`target` · `monitor`→`desktop` · `phone`→`mobile` · `cycle`→`refresh`; if labs' Drift nav wants the dash drawing rather than the wave, it requests `dith-drift`

## Why it went there

Set icons are the DS's to mint — consumers never ship set icons locally. The
labs sidebar's 15 glyph names were absent from kol-icons ≤0.13.0, so the
editor's labs mode substituted nearest-match guesses (grid for ptrn-dot,
desktop for monitor, refresh for cycle…).

## What stays here

- **On ship: adopt.** Bump `@kolkrabbi/kol-icons` to ≥0.14.0, swap the four
  mapped names in `GROUP_ICONS`, and verify the labs nav renders every group
  glyph (Randomize buttons stay on `refresh`).
- Nothing else — no local registration to retire.

## ✅ ADOPTED — 2026-08-15

The GROUP_ICONS swap landed; the only remaining `target-lock` in LabsNav.jsx is a comment recording the mapping (:49) — verified 2026-08-15.

**Remainder here:** none.
