# ToolPaletteVertical

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ToolPaletteVertical.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13 — kol-component 0.256.0, adopted at 0.257.0

`ToolPalette` renders a row only (vertical dividers, folds open downward). Ask: `orientation="vertical"` (column, horizontal dividers, folds open `right-start`) and `placement` on `SplitToolButton`. Plan 31 § 2 — the tools strip.

## What this repo does on the return
bump; `ToolStrip` passes `orientation="vertical"` and drops its interim `flex-col` override.

**Remainder here:** none yet — on the return: bump + the prop.

## ✅ RETURNED — 2026-10-13 · kol-component@0.256.0

New `ToolPalette orientation="vertical"`: flex-col, overflow-y-auto, horizontal hairline dividers across the strip, every fold opens `right-start`. New `SplitToolButton placement` (default bottom-start) carries it. Verified on the showcase (`/components/tool-palette`, vertical variant): strip 32 × 282, dividers 32 wide, the Shape fold's panel opens at x 512 beside the strip's right edge 507.5, covering no tool.

**Remainder here:** bump kol-component ^0.256.0; `ToolStrip` passes orientation="vertical"

## Adopted — 2026-10-13

kol-component 0.257.0 pinned (registry had moved past 0.256.0). Walked on `vite preview` (plan 32 walk, `_tmp/2026-10-13-plan-32-walk/`): the strip a 32-wide column, folds open beside it; ToolStrip passes orientation="vertical", the flex-col override gone

**Remainder here:** none.
