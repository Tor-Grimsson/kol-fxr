# ColorSwatchFieldSizing — the paint-row swatch, input-flush

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/ColorSwatchFieldSizing.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.35.0`: radius default `sm` (4px, opt-out via `tight`/`none`), named size `'control-sm'` (26px), and the stretch: `slotLeft` on Input for the one-container paint bar. Entry graduated to `done/`. 📌 **Remainder here:** bump ≥0.35.0, recompose paint rows as `<Input slotLeft={<ColorSwatch size="control-sm"/>} chars={6}/>`

## Why it went there

ColorSwatch chrome is the DS's; no consumer shim can resize/radius it or
put it inside the Input shell.

## What stays here

- Interim: swatch + hex adjacent in the paint rows (close, not the anatomy).
- **On ship: adopt.** Rebuild the rows on the one-container bar.

## ✅ ADOPTED — 2026-08-15

Input slotLeft is in use at src/editor/compose/inspectors/ColorField.jsx — verified 2026-08-15.

**Remainder here:** none.
