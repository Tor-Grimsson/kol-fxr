# Plan — The randomiser's live screen: one row, the shot, what a roll touches, how it moves

**Status:** BUILT 2026-10-08 (cloud session), walked at 390 touch (`walk-randomiser.mjs`, 7 checks): the row is one line of icons (roll · download · hide UI · fill), the pinch writes the transform per move, the roll-scopes dialog persists (`rollScopes`), the time shape closes on every curve and `pingpong` mirrors. Unwalked by eye: how `steps` / `bounce` / `drift` FEEL on a real loop — the user's call on a device.
**Origin:** user, 2026-10-08, the randomiser on a phone (`Download` · `ASCII ⌃` · `Randomize all` on two lines):
- *"buttons one line"*
- *"hide UI option and fill screen option (pinch?) because I use screen record on mobile. I actually think there is a pinch, but its stepped, I want variable responsive pinch"*
- *"a modal dialog to toggle what randomise all does, like you can opt in to those values, because often I'd just want not to change color or geometry, but others could randomise"*
- *"randomise the way it loops, I dont love the loop always breathing in and out. I would like more variation to the way it animates"*
- *"make your own decisions"*

## 1. The collapsed row is one line

- **Now:** `PanelPills` wraps (`flex-wrap-reverse`); the pill + two text buttons break onto two rows at 390.
- **Do:** one row, no wrap: the pill (the preset name, truncating) and the actions as ICON buttons with tooltips — `bolt` Randomize all · `download` · `eye-off` Hide UI · `maximize` Fill. Hide UI and Fill come up from the Output tab onto the row (§ 2): the row is what is left when the sheet is down, and the shot is taken from there.

## 2. The shot: Hide UI, Fill, a continuous pinch

- **Hide UI** (exists, Output tab) and **Fill** (exists as the aspect strip's `Fill`) are on the row; Fill toggles back to the composition's aspect.
- **Pinch:** `MobileView` scales the stage through React state on every pointer move — a state write and a re-render per frame, which is the "stepped" feel. **Do:** the gesture writes `transform` to the wrapper directly (a ref) while the fingers are down and commits the scale once on release; the ceiling goes 3 → 4.

## 3. What Randomize all touches — a setting, a dialog

- **Now:** `allScopeParams` rolls every visible param except the motion sections and Camera. Fixed.
- **Do:** an app setting, `rollScopes` (`appSettings`), one switch per scope id (`Geometry` · `Spacing` · `Field` · `Mark` · `Color` · `Motion Frame` · `Motion Form` … — whatever `deriveScopes` finds on the layer) plus `rollEffects`. Default = today (look on, motion off). `allScopeParams` reads it, so every Randomize all — the phone's row and tab, labs' rail, the editor's inspector — obeys. The dialog (`RollScopesDialog`, `FullscreenOverlay` + `SettingsRow` + `ToggleSwitch` rows) opens from a `nav-settings` button beside Randomize all; it lists the scopes of the layer on stage, so a scanline shows scanline's.
- A scope switched off is still rollable by its own strip cell — the dialog only shapes *all*.

## 4. How it moves — the time shape

- **Now:** the loop clock is `u` 0→1, linear, and most generators phase a sine on it: every loop breathes in and out the same way. The camera's `vpPulse` breathes on top.
- **Do:** a TIME SHAPE on the loop, three params in the Animation tab's Form section (so the Motion Form scope rolls them, and § 3 can opt them into *all*):
  - `vpTime` — the curve `u` runs through before the draw: `linear` (as is) · `ease` (slows into each end) · `pingpong` (out and back — a loop that never wrapped seamlessly now does) · `steps` (4 held frames a cycle) · `bounce` · `drift` (a slow smooth wander on top of linear)
  - `vpSpeed` — whole loops per cycle (1–4, integers keep the seam)
  - `vpPhase` — where in the loop the cycle starts (0–1)
  - Applied in ONE place, `drawLoopFrame` (every 2d draw goes through it, live and export), and on the GL engines' `u`. Identity defaults, so nothing moves that did not.
  - Folded onto every 2d def at the registry (the vp camera's fold covers only shape + pattern-rules); the Penrose sims stay bare — a warped clock on an accumulating sim is not a loop.

## Verification

`vite preview` at 390 touch (`walk-randomiser.mjs`): the row is one line and every icon acts; a pinch moves the stage per pointer event; the dialog's switches change what Randomize all writes; `vpTime: pingpong` draws u(0.25) == u(0.75).
