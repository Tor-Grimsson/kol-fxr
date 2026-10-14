# CanvasRulerGraduated

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/CanvasRulerGraduated.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13 — kol-component 0.256.0, adopted at 0.257.0

`CanvasRuler` is an `fg-08` band with one tick rank at `niceStep` (every 200 at 100%), mono labels, no unit, no pointer line. Ask: transparent bar, three ranks (major · /2 · /10), sans labels, `px` in the corner, a pointer line on each ruler. Plan 31 § 3.

## What this repo does on the return
bump only.

**Remainder here:** none yet — on the return: bump.

## ✅ RETURNED — 2026-10-13 · kol-component@0.256.0

`CanvasRuler` graduated: transparent bar with the oq-16 inner hairline; three ranks counted by index (major at niceStep, medium /2, minor /10) at 18 · 9 · 4 px, fg-48 / fg-24; sans 10 labels beside the major tick, the vertical's rotated -90°; `px` in the corner square; a 1px fg-64 pointer line on each ruler from the container's own pointermove, written to the lines directly (no re-render). Guide drag and the niceStep / ticksFor exports unchanged. Verified on the showcase (`/components/canvas`): labels 0 · 250 · 500 … at the fit zoom, tick lengths 4 4 4 4 9 4 4 4 4 18, no band rect, pointer line visible and tracking, corner reads px.

**Remainder here:** bump kol-component@0.256.0

## Adopted — 2026-10-13

kol-component 0.257.0 pinned (registry had moved past 0.256.0). Walked on `vite preview` (plan 32 walk, `_tmp/2026-10-13-plan-32-walk/`): three tick ranks, px in the corner, no band

**Remainder here:** none.
