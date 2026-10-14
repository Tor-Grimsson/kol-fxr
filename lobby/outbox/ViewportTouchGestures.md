# ViewportTouchGestures

**Filed:** 2026-10-14 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/ViewportTouchGestures.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-14 — kol-component 0.259.0

`PanZoomViewport` has no touch gesture: a finger can't zoom or move the stage, and `onSpaceTap` (play / pause) can't be pressed by touch. Ask: two-finger pinch at the midpoint + pan, one-finger tap → `onSpaceTap`, `touch-action: none`. Plan 35 § 2–3.

## What this repo does on the return
bump only; walk Labs on touch.

**Remainder here:** none yet — on the return: bump + walk.

## ✅ RETURNED — 2026-10-14 · kol-component@0.259.0

PanZoomViewport takes touch: two fingers pinch-zoom at their midpoint and the midpoint's travel pans in the same gesture, inside the real clamps; the transform layer is `pointer-events: none` while they are down. One finger stays yours; a tap (up < 350 ms, < 12 px, no second finger) fires `onSpaceTap`. The container carries `touch-action: none`. Mouse, trackpad and keys unchanged. Verified on the showcase canvas with CDP touch points: pinch out → 4.0×, the point under the fingers held; two-finger drag pans; one tap → onSpaceTap ×1; a one-finger drag and a 500 ms hold → 0.

**Remainder here:** bump kol-component ^0.259.0; walk Labs on touch.

## Adopted — 2026-10-14

kol-component 0.259.0 pinned (the tablet editor runs this viewport). Labs does NOT — it renders its own letterbox (`LabsStage`), so the same gestures were built there locally: two-finger pinch about the midpoint (the frame point under the fingers held, 0.500,0.468 → 0.499,0.469), two-finger move (+40/+40 → +40/+40), one tap Play → Pause → Play. Walked on `vite preview` at 390 wide, touch events, 0 console errors (`_tmp/2026-10-14-plan-35-walk/`).

**Remainder here:** none.
