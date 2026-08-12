# MenuItemDescenderClip — menu labels clip their descenders

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/MenuItemDescenderClip.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.35.0`: `leading-normal` on the truncating span, and the defect class swept (MenuDropdownNest, ColorInputRow ×2, FieldRow hint, RecordManager saveState too). Entry graduated to `done/`. 📌 **Remainder here:** bump ≥0.35.0 — the menubar descenders uncllip at the bump; the three local toolbar `leading-normal` spans are the same fix and can stay

## Why it went there

The span lives in the shipped `MenuItem.jsx`; consumers are barred from
patching DS chrome (the 2026-08-09 no-shims ruling). The type protocol makes
`kol-helper-*` line-height-1 by design — the defect is pairing it with an
overflow-hidden truncation span, which only the DS can fix.

## What stays here

- `leading-normal` on the truncate spans of our own ShapeDropdown /
  BooleanDropdown / TextDropdown rows (ToolPalette) — same visual family,
  our markup, fixed at the source here.
- **On ship: adopt.** Bump and eyeball the menubar's descender labels.
