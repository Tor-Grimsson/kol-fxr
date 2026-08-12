# PropertyField — the Figma property input, from the DS

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/PropertyField.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.36.0` as `variant="property"` on Input: `affordance` (letter/icon, dim, 6px gap), value hugs via mono ch-width (number-safe), `unit` adjacent at 0 gap, shell w-full left-packed; controlled usage only. 📌 **Remainder here:** bump ≥0.36.0, replace the AxisField (LayerInspector.jsx) + MetricInput (TextPanel.jsx) ch-width/negative-margin hacks with `<Input variant="property"/>`

## Why it went there

The user's call ("this input guy sucks — if you can't make it right, send a
request to kol-ds"): value↔unit adjacency is a component anatomy question,
not consumer styling.

## What stays here

- The named ch-width/negative-margin stopgaps, live until the variant ships.
- **On ship: adopt.** Swap every prefixed input onto the variant, delete the
  hacks in one pass.
