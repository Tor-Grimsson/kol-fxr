# PropertyField — the Figma property input, from the DS

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/PropertyField.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-26 — shipped in `@kolkrabbi/kol-component@0.36.0` as `variant="property"` on Input; adopted here. Remainder: none.

## Why it went there

The user's call ("this input guy sucks — if you can't make it right, send a
request to kol-ds"): value↔unit adjacency is a component anatomy question,
not consumer styling.

## What stays here

- The named ch-width/negative-margin stopgaps, live until the variant ships.
- **On ship: adopt.** Swap every prefixed input onto the variant, delete the
  hacks in one pass.

## ✅ ADOPTED — 2026-08-26

`AxisField` (LayerInspector.jsx) and `MetricInput` (TextPanel.jsx) both sit on
`NumberField` → `<Input variant="property"/>`; the ch-width / negative-margin
hacks were already gone — only the stale stopgap comments claimed otherwise,
and those are deleted. Verified 2026-08-26 on kol-component 0.76.4.

**Remainder here:** none.
