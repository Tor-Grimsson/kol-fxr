# FunctionPlot — receipt

**Filed:** 2026-10-31 → kol-ds-ui `lobby/inbox/FunctionPlot.md`
**State:** 🟢 `closed` — adopted 2026-10-31 at kol-component 0.330.0, walked
**Asked:** a plot of y = f(u) over one loop with a cursor at the current u (plan 51 4.4).
**Remainder here:** when it returns, swap fxr's local piece for it and retire the local one to `_tmp/`.

## 🟠 RETURNED — 2026-10-31 · built, awaiting publish

`FunctionPlot`, a new atom (kol-component, unreleased): SVG, one sample per pixel of its width; `fn(u)` or `samples`, `min` / `max` (auto from the samples), `cursor` (line + dot; the curve solid behind it, faint ahead), `height` (64), `labels` (max / min at the left). Ground oq-04, zero line oq-24 when 0 is in range, labels oq-48, curve the accent — light and dark by CSS.

Not on npm yet — kol-component needs a minor publish; synced: 2026-10-31 from kol-ds-ui `lobby/INDEX.md`.

**Remainder here:** bump kol-component when published; ModulationEditor's ExprPlot draws through `FunctionPlot` (pass `fn={(u) => c.fn(u * secs)}`, `min={Math.min(lo, 0)}` / `max={Math.max(hi, 1)}` to keep the 0–1 rails' range, `cursor` the loop phase on each frame).


## ✅ RETURNED — 2026-10-31

🟢 `closed` in **kol-ds-ui**: `FunctionPlot` (atom) exported in @kolkrabbi/kol-component@0.330.0.

**Remainder here:** bump kol-component to ≥0.330.0; ModulationEditor's ExprPlot draws through `FunctionPlot` (pass `fn={(u) => c.fn(u * secs)}`, `min={Math.min(lo, 0)}` / `max={Math.max(hi, 1)}` to keep the 0–1 rails' range, `cursor` the loop phase on each frame).

**Adopted:** ModulationEditor's expression plot draws through it; the canvas plot in `_tmp/2026-10-31-exprplot/`.
