# Playbook — Plan 32, effects under Layer, the Layer Effects window, the Layers bar

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** build `.kol/llm-plan/32-effects-under-layer-and-install-as-an-app.md` end to end, walk § 4 on `vite preview`, plan BUILT; adopt kol-component ≥0.256.0 for plan 31.

**Standing rules (non-negotiable):**
- A reference screenshot is the instruction (memory `match-the-reference-first`) — Affinity's Layer Effects window, its Live Filters menu, its Layers bar.
- Copy verbatim; Tailwind first; retire to `_tmp/`, never `rm`.
- A green build is not verification — walk `vite preview`, light + dark.
- Labs untouched.

---
## Entries

[21:59 GMT · 2026-10-13] · setup · playbook created
  what → initialised the live playbook   why → /kol-goal + /playbook on plan 32
  note → registry has kol-component 0.257.0 — plan 31's trio adopts first

[22:20 GMT · 2026-10-13] · plan 31 T3 · package.json · ToolStrip · MenuTop
  what → kol-component 0.257.0 pinned; ToolStrip `orientation="vertical"` (flex-col override gone); MenuTop `offset` live   why → MenuItemOffset · ToolPaletteVertical · CanvasRulerGraduated returned as 0.256.0
  verify → File panel top 31 / bar bottom 32 (one hairline); strip 32 × 245 column; ruler three ranks + px corner; receipts closed, remainders none

[22:20 GMT · 2026-10-13] · § 1 · LiveFilterRows.jsx (new) · effectCategories.js · MenuTop · packs/effects.js
  what → Layer › Live Filters ▸ None │ Blur · Sharpen · Distort · Noise · Lighting · Colors │ Halftone … Post-processing; Layer Effects… row; Tools = Generative · Pattern · Type · Insert image   why → an effect is applied to a layer (Affinity)
  note → useEffectTarget + LiveFilterRows shared by the Layer menu and the bar — MenuTop's copy of the target rule removed

[22:20 GMT · 2026-10-13] · § 2 · compose/layerEffects.js (new) · shell/LayerEffectsWindow.jsx (new) · LayerRenderer · build.js
  what → ten effects as SVG filter primitives on `layer.effects` (+ effectsRefW, fillOpacity); window on FullscreenOverlay (scrim, keep-selection), ten rows, ToggleCheckbox on/off, + × on the five stackables, AutoControls right column, ▲▼ within a kind, Scale with Object, Fill Opacity, Close   why → Affinity's Layer Effects, element by element
  note → NOT in layer.filters: one SVG filter works on DOM, SVG and canvas layers and exports verbatim; the 8-stage pixel chain stays the live filters'
  note → the overlay portals outside the shell → canvas click-away deselected the layer and the window vanished → `data-editor-keep-selection` on the panel

[22:20 GMT · 2026-10-13] · § 2b · LayerStack.jsx · state.jsx
  what → bar = + · Group │ FX · Mask · Adjustment ▾ · Live Filter ▾ │ Duplicate · Delete; eye/lock off the bar; `+` › Empty layer = an empty group named Layer   why → Affinity's Layers bar
  verify → Mask on one rect adds "Mask (mask)" and ⌘Z removes it; Empty layer adds "Layer"

[22:20 GMT · 2026-10-13] · § 4 · vite preview walk · _tmp/2026-10-13-plan-32-walk/
  verify → dark + light, 0 console errors; all ten effects render on one rectangle (gradient, bevel, 3D, glows, inner shadow, blur); export.svg carries 1 le- filter, feImage, feSpecularLighting
  note → plan 32 BUILT; preview PID 90066 stopped; .playwright-mcp download dir moved to _tmp

[23:53 GMT · 2026-10-13] · plans 33 + 34 · goal started (8 points)
  note → the DS viewport ALREADY binds ⌘0 (reset) / ⌘= / ⌘- (×1.2) — plan 33 said "no zoom keys"; they stay the DS's, listed passive in keymap.js, run from the menu via kol:command
  what → CanvasViewCommands filed to kol-ds-ui (kol:zoom-fit { to }, ZOOM_MAX in real terms, optional kol:zoom-to)   why → fit from outside / fit a rect / 800% real are out of reach today

[23:53 GMT · 2026-10-13] · plan 33 §§ 1–2 · keymap.js · CanvasArea.jsx · zoomStore.js · MenuTop.jsx
  what → ZoomProbe publishes REAL zoom (DS zoom × frame offsetWidth / virtual width); title reads it   why → DS 1 = fitted, Affinity 100% = actual px
  what → zoom-100/200/400/800 (Mod+1–4) = kol:zoom-at target ÷ current at the viewport centre; zoom-width (Mod+Alt+0) / zoom-selection (Mod+Shift+0) / fit → kol:zoom-fit (inert until the bump)
  what → matchCombo: Shift+digit matched on e.code (⇧0 is ")")
  what → View › Zoom ▸ In · Out · To Fit · To Width · To Selection │ 100 · 200 · 400 · 800%, ✓ on the showing step

[23:54 GMT · 2026-10-13] · fix · layerEffects.js · LayerEffectsWindow.jsx
  what → effects' Fill Opacity renamed layer.fillOpacity → layer.effectsFillOpacity   why → layer.fillOpacity is the fill PAINT's alpha (paint.js) — the plan 32 name squared it and switched the filter on for any translucent fill
  note → CanvasViewCommands RETURNED as kol-component 0.258.0 (receipt) — bump not yet done; usage limit hit here. Next: bump 0.258.0, walk To Fit/Width/Selection + 800%, then plan 34 (T4–T7), walk (T8)

[00:20 GMT · 2026-10-14] · plans 33 + 34 · resumed and built
  what → kol-component 0.258.0 pinned; zoomToReal → kol:zoom-to; View › Zoom live   verify → fitted 64%, ⌘1–4 = 100/200/400/800, ⌘0 back, To Width frame 916 = viewport 916
  what → PaintPopover (color/PaintPopover.jsx) at the swatch; paintFill.js — Solid · Gradient · Pattern · Image · Video; PaintFillWrap in LayerRenderer; paintFillSvg in build.js   verify → all five render on a rectangle, video plays clipped, export.svg carries a pf- pattern
  what → Transform + Appearance on one [1fr 1fr auto] grid; lock + origin dots in the trailing column; align strips 3 + 3   verify → X / W / SX left 1297 right 1416 · Y / H / SY 1424–1542
  what → spec R1.2 (real %, View › Zoom), R6.6 (popover at the swatch, paint types), R5.5a (the trailing column)
  note → pattern paint first rendered nothing (shapeId null) → DEFAULT_SHAPE_ID + a Shape select; plans 33 + 34 BUILT; preview PID 35480 stopped

[01:49 GMT · 2026-10-14] · plan 35 § 1 + § 3 (phone) · MobileView.jsx
  what → stage view { s, x, y } = translate + scale, origin 0 0; pinch keeps the point under the fingers' midpoint; two fingers move the stage   verify → pinch around (100,200) → translate(-250,-500) scale(3.5); two-finger +60/+80 → translate(-190,-420)
  what → one tap = transport.toggle(); only penrose keeps its tap   verify → Play → Pause → Play on two taps; a drag does not toggle
  note → the old rewind-tap skipped every loop with a camera map, and vpZoom gives nearly all of them one — a tap did nothing almost everywhere; a tap is a non-moving press, so orbit/nudge lose nothing
  what → ViewportTouchGestures filed to kol-ds-ui (two-finger pinch + pan, one-finger tap → onSpaceTap) — Labs and the tablet editor wait on it

[02:10 GMT · 2026-10-14] · plan 35 § 2–3 · package.json · labs/LabsView.jsx
  what → kol-component 0.259.0 pinned (ViewportTouchGestures — the tablet editor's viewport)
  note → Labs renders its own letterbox (LabsStage), not PanZoomViewport → the DS fix never reaches it; built the same gestures there: pinch about the midpoint, two-finger move, one tap = transport.toggle, penrose keeps its tap
  note → the zoomed frame shrank back to the cell width past 100% (flex item) → flex: none
  verify → frame point under the fingers 0.500,0.468 → 0.499,0.469; move +40/+40; Play → Pause → Play; 0 errors · plan 35 BUILT
  note → first registry check read 0.258.0 from a stale cache while 0.259.0 was live — check with --prefer-online
