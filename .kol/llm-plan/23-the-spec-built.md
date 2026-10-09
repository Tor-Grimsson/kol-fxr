# Plan — The spec, ruled and built (draft)

**Status:** DRAFT 2026-10-10 (cloud) — waits on the user's rulings over `.kol/llm-context/audit/2026-10-10-editor-spec.md`. Build order is by spec rule, not by finding, so one change closes a class.
**Origin:** plan 22 § 5.

## 0. Prerequisites
- The seven rulings at the end of the spec answered (status bar · rail width token · Layers first · visible empty states · sub-heads as sections · `Randomiser` · the fold list).
- The grade (`H`) run once with `.kol/llm-context/audit/2026-10-10-harness/` so every failing row is on record before it is fixed; the gap matrix (`I`) written from maps 05–07.

## 1. One rung, one row, one heading (R4, R5, R6.3) — closes items 13 · 14 · 17 · 18
- `size={cs}` everywhere a rail component writes a literal or nothing (map 10 § 2 lists the ~40 sites); `tone="sunken"` on every strip; `ViewToggle` out of the rails.
- `SettingsRow labelWidth={RAIL_LABEL_W}` as the row in the left rail and the Parameters tab; the Inspector's panes become `LabeledControlSection divided`.
- `Slider displayWidth={3}` for Opacity; `chars` on every number field; `w-24` / `w-[110px]` go.

## 2. The right rail's header and the layer verbs (R2.2–R2.4, R3.3) — closes item 20
- `⋯` and trash leave `SelectionPalettePanel`; the Layers footer gains delete · duplicate · group · lock · hide (KOL `LayerStack` footer slot — plan 17).
- Booleans: toolbar fold + Tools menu only; `Unite · Subtract · Intersect · Exclude` from `labels.js` in all three places.

## 3. Words (R7) — closes item 16, the spelling half of 14
- `Color` ×3, `Randomize` ×2, `Animation` for the tab, `Delete` for the verb, `Convert to path` for the bake, `…` on dialog verbs.

## 4. The frame (R1, R9) — closes items 8 · 9 · 10 · 11
- Name field → status bar (NEW); zoom and crop chips fold into it.
- Toolbar folds per R9.3; `shape-torus` for Orbit; shortcut chips from `keymap.js`.
- Rails on `--kol-sidenav-w`, `useDragResize` on both.

## 5. Appearance and paint (R6.6, item 7, item 15)
- Fill · Stroke as clickable swatches opening the Color pane; `Colour…` retires.
- `paintStroke` starts `null`; a new shape is fill-only until a weight is set.

## 6. Pointers (R8) — closes items 4 · 5
- `cursors.js` with four inline `data:` SVG cursors (pen · rotate · orbit · eyedrop); pen close badge inside the 10px radius; pen inherits the paint pair.

## 7. Canvas and selection — closes items 1 · 2 · 3 · 6
- Frame-edge hit band selects the canvas; `view: 'preview'` hides edge, label, rulers, guides (`W`); `A` on a shape converts then node-edits (per ruling); `Convert to path` in Tools, the context menu and `⇧⌘O`.
- Line tool draws on drag; multi-select shows shared properties; locked layers refuse Inspector writes and menu Delete.

## 8. Shape parameters and the first vector effect — items 21 · 22
- Per-kind `SHAPE_SCHEMA` (radius for every closed kind, ellipse arc, star inner radius); `radius` survives convert/bool.
- Distress as a node-model effect on the Parameters tab (offset + smooth → nodes); then Blend / Smooth / Offset / Zigzag (item 23).

## 9. The effect stack — items 24 · 25 · 26 (rulings)
- Slots instead of "Add effect"; one row + panel per effect; Pattern leaves the Effects menu.

## N. Verification
- Re-run the grade: every pane × state passes every rule or names its ruling.
- Walk on the built bundle, 0 console errors, at 1600 and 1280.
