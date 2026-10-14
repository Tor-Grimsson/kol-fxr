# Plan — Touch: pinch-zoom, two-finger move, tap to play

**Status:** BUILT 2026-10-14 — § 1 phone stage (`MobileView.jsx`): `translate + scale` about the fingers' midpoint, two-finger move. § 2 `ViewportTouchGestures` returned as kol-component 0.259.0 and pinned (the tablet editor's viewport). **Found on the build:** Labs does not run that viewport — it renders its own letterbox (`LabsStage`) — so Labs got the same pinch / move / tap locally. § 3 one tap = `transport.toggle()` on both; only penrose keeps its tap (the old rewind-tap skipped every loop with a camera map, which `vpZoom` gives nearly all of them, so it did nothing almost everywhere). Walked at 390 wide with touch events, 0 console errors (`_tmp/2026-10-14-plan-35-walk/`). Not walked on a real phone.
**Origin:** user, 2026-10-14: *"in mobile I still cant pinch zoom move with 2 fingers. and I think one tap should start stop transport play/pause"*.

## 0. What is already settled

| Today | Where this plan stands |
|---|---|
| Phone generative view (`editor/mobile/MobileView.jsx`): a two-finger pinch SCALES the stage (0.5–4, plan 18 § 2) — no two-finger move; the scale is about the wrapper's centre, not the fingers | **Extends** (§ 1): pinch about the fingers' midpoint + two-finger pan. |
| Labs on touch (`labs/LabsView.jsx`, drawers) and the editor on a tablet run the DS `PanZoomViewport` — wheel / ⌘-keys / `kol:zoom-at` only, **no touch gesture at all** | **DS ask** (§ 2): the viewport takes two-finger pinch + pan. |
| A one-finger tap on the phone stage **rewinds** a 2d loop (`transport.rewind()`; penrose, engine and camera loops keep their own touch) | **Replaced** (§ 3): a tap toggles play / pause. |

## 1. Phone stage: pinch about the fingers, two fingers move · `MobileView.jsx`

The wrapper's transform becomes `translate(x, y) scale(s)` with `transform-origin: 0 0`. Two fingers down: record the midpoint and distance. On move, scale = start × distance ratio (0.5–4), and the pan keeps the point under the starting midpoint under the current midpoint — so pinching zooms where the fingers are and moving two fingers moves the stage. Live values go straight onto the transform (no re-render), written to state on release, as today. A two-finger double-tap, or Start over, resets to 1 at 0,0.

## 2. Touch on the DS viewport · DS ask `ViewportTouchGestures`

`PanZoomViewport` handles `pointerType === 'touch'`: two pointers → pinch zoom at their midpoint + pan by the midpoint's travel (the same `zoomAt` it uses for the wheel, clamps real); one pointer stays the consumer's (tools, the sim pointer). `touch-action: none` on the container. Filed to kol-ds-ui; Labs and the tablet editor get it at the bump with no local code.

## 3. One tap plays / pauses · `MobileView.jsx` (and the DS `onSpaceTap` seam on Labs)

A tap (under 350 ms, under 12 px, one finger) on the stage calls `transport.toggle()` — the same verb as Space on a desk (`onSpaceTap`). It applies to every loop the tap has no richer meaning on; penrose presses, camera orbits and engine pointer-nudges keep theirs, as the rewind rule did. Rewind moves to the transport sheet's own button (already there). Labs on touch: the stage's tap does the same (the floating ▶ stays).

## 4. Verification

Touch emulation in Playwright (two touch points via CDP) and on the user's phone: pinch out over a corner → that corner grows under the fingers; two fingers drag → the stage moves; release → it stays; one tap → pauses, tap again → plays; a penrose loop's press still presses. Labs on touch after the bump: the same pinch / move.
