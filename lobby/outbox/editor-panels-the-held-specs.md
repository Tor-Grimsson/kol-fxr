# editor-panels-the-held-specs — the seventeen components fxr still hand-rolls

**Filed:** 2026-09-03 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/editor-panels-the-held-specs.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` — kol-component 0.222.0 (2026-09-25), every row answered; closes on kol-fxr adopting it (synced 2026-10-07)

## Why it went there

The second half of the round-trip. `editor-set-is-behind-its-source` corrected the
twelve components the DS had already copied and deliberately held everything else,
saying porting more panels onto a frame with a rotated hue ring and no zoom context
would just move the problem. Ten of those twelve are fixed, so the hold expired and
these went out.

Seventeen components, each with its anatomy, its props, the store coupling to drop,
and the **seam** that has to become a prop or the component is unusable outside fxr.

- **Group A, 2,036 lines** — the eight the half-port ticket named: `LayerStack` 583 ·
  `TextPanel` + `ParatypeTools` 558 · `ToolPalette` 405 · `CurveEditor` 194 ·
  `KeyframeEditor` 117 · `XYPad` 73 · `InspectorRail` 72 · `NumberField` 34.
- **Group B, 1,865 lines** — nine no ticket had ever mentioned, in three families:
  the schema-driven **parameter rail** (`AutoControls` · `rolls` · `BindDot` ·
  `ModulationEditor` · `controlSize`, 991), the two **overlay siblings** of the
  SelectionOverlay they just fixed (`PathNodeOverlay` · `CropOverlay`, 474), and the
  **timeline** (`TimelineDock` · `transport`, 400).

Two are portable nearly as-is (`XYPad`, `NumberField`); `NumberField` is 34 lines and
the most-copied idiom in the editor. B1's real question is bigger than a component —
whether the package wants to own a param-schema format at all — so it is ordered last.

## What stays here

All seventeen, running and unchanged. Nothing in the ticket asks fxr to change; the
reference on every row is the fxr file to read.

**Remainder here:** none — on the return: adopt per row and re-measure in a browser.
