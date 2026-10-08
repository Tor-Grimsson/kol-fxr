# Plan — Morph gets its own rail, the DS picker, and a real morph

**Status:** DONE 2026-10-08. STEPS 1–4 BUILT AND WALKED 2026-10-08 on the built bundle + the local Worker (`_tmp/2026-10-08-plan10/walk.mjs`, 19 checks, desk 1600 + phone 390, 0 console errors): the MORPH row, the Morph rail, the picker on a scrim with search, star → spiral point to point, Blend tweening one generator, save, reopen, the randomiser playing it. Fixes the walk forced: the right rail stays while the Morph rail is in use on an empty stage (`data-empty`); outlines pair in draw order with the busier side folded into runs and a fill meeting a stroke crossfades (a dashed spiral had paired one dash with the star); a morph file opens playing in every chrome (the randomiser sat on step 1). Re-walked green on kol-component 0.242.0 · kol-theme 0.168.0. Step 5 BUILT AND WALKED 2026-10-08: `FilesDialog` is on the DS browse surface (kol-component 0.244.0, which shipped all five items of `browse-views-label-by-display-name`); `_tmp/2026-10-08-plan10/files-walk.mjs` 36 checks green at 1600 and 390 touch — names in every view, the seven verbs, no URL verbs, one Escape per level, a phone tap selects, 0 console errors. The 2026-09-04 dialog is in `_tmp/2026-10-08-filesdialog-before-browse/FilesDialog.2026-09-04.jsx`. PLAN 10 DONE.
**Origin:** user, 2026-10-08, walking the built plan 09 — eight screenshots. Verbatim: *"I even checked the rail, which I specifically asked to put morph, but you didn't??"* · *"you should open morph and see something like slot empty states, with a '+' to add … then settings could be in the right rail, like we have been doing"* · *"its not really morphing as much as its just a fader between 2 layers, which is cool as an option, but not like this"* · *"why does it say SIMPLE? why does it list generate style and animation? we are in MORPH right?"* · *"we dont use these kind of modals, we have established an overlay … look at for example the search modal, simple overlay, search input, navigatable"* · *"this 'helper' does not have line spacing, ITS NOT FOR PARAGRAPHS"*.

## 0. What is wrong with what shipped

- **Morph is not in the rail.** The labs rail reads Effects · Generative · Vector · Composition · Modulation · Randomiser. Morph is a fourth tab on the *generator's* params rail, under the generator's heading (`SIMPLE` is `stage.def.label`, `LabsParams.jsx:175`) beside the generator's own tabs.
- **The pickers are opaque and flat.** New File (`src/components/NewFileDialog.jsx`) and Add a step (`src/editor/morph/StepPicker.jsx`) are `FullscreenOverlay` without `scrim` — an opaque surface in the page's place, the thing ruled out on labs 2026-10-07 (*"its not overlay, its complete full screen"*). The step picker is every preset in one flat list: no search, no grouping (its `eyebrow` never renders in the default row). Reference for the shape, not for consumption: the DS media picker (`apps/media/picker`) — a scrim, a search field on top, rows under it. `FilesDialog.jsx` is opaque too.
- **Wrong mono.** `MorphTab.jsx:101,143,144` set wrapping sentences on `kol-helper-*` (line-height 1 — single-line chrome only). Wrapping text is `kol-mono-*`. The tab also hand-rolls its rows instead of the rail's `SettingsRow` / `LabeledControlSection`.
- **It is not a morph.** `buildMorph` tweens one generator's *parameters* as keyframe tracks. `points` on the star is an integer: 5 → 7 is a cut, the new star pops in. Nothing moves point to point.

## 1. Where Morph lives

A **MORPH row in the labs rail**, after Modulation, published through `railExtras` like the other labs sections (one rail, 2026-08-28). Pressing it puts labs in morph mode: the stage plays the morph, the right rail is the Morph rail. Home opens a morph file to the same place (`/labs?open=`), New File's Morph door too (`/labs?new=morph`). No new chrome, no new ⌥ digit — `KEY_ORDER` is untouched.

## 2. The Morph rail

`Surface title="Morph"` — no generator heading, no Generate · Style · Animation strip. Top to bottom:

- **Steps.** Numbered slots. A filled slot: name · ↑ ↓ ×. The last slot is always an **empty slot with a `+`** — the add is the slot, not a button row. Click a filled step to edit it (plan 09's rule, kept: its settings go on the stage, the transport pauses, Play rebuilds).
- **Settings.** `SettingsRow`s in a `LabeledControlSection`, the rail's own vocabulary: **Mode** `Shape | Blend` (`SegmentedToggle`) · **Curve** · **Cycle** · **Length** (s).
- **Save…**
- Strings that can wrap are `kol-mono-*`; labels stay `kol-helper-*`. No new CSS.

## 3. The pickers

Two different things, ruled apart (the DS session, 2026-10-08: *"consume, don't copy … where fxr's browser differs, fxr files the missing seam"*; the user: a reference, not a 1:1 match):

- **`FilesDialog` consumes the DS browse surface.** It is a file browser and already calls itself MediaLibrary's twin; the DS surface takes the seams it needs (`onPickFile`, the views, `fileActions.items`, `thumbnailFor`, `folderMeta`, `settings`). fxr wraps its stored library as the client it expects and keeps the five verbs on `fileActions.items`. Whatever does not fit goes to kol-ds-ui as a seam ticket, not a local fork. Its own step: the dialog is ~300 lines here today.
- **The step picker stays local and small.** It lists catalog presets grouped by generator (not files), so it is not that surface. `StepPicker.jsx` keeps its overlay and rows; adds `scrim`, a `SearchInput` filtering by label, a heading per generator in place of the eyebrow that never rendered, and *From the stage* while the stage holds a plain generator. Blend mode after a first step: that generator's rows; Shape mode: all of them.
- **New File** — `scrim`. Nothing else.

## 4. The engine — Shape mode

Point to point, generic over every canvas generator, **no generator edited**. `src/editor/morph/shape/`:

1. **Record the outline.** Run each step's `draw(ctx, u, w, h, p)` against a recording context — a Proxy over a real 2D context that captures `moveTo` `lineTo` `closePath` `arc` `arcTo` `ellipse` `rect` `bezierCurveTo` `quadraticCurveTo` per `beginPath`, flattening curves to segments, and closes a subpath record on `fill` / `stroke` with that call's colour. Output: subpaths as point arrays + fill/stroke. The real paint is discarded.
2. **Pair and resample.** Sort subpaths by area, pair by index. Resample each pair by arc length to N = max(64, longest count) points, clockwise; rotate the second's start index to minimise summed distance (a star's tip meets a tip). Unequal counts: the extra collapses to its partner's centroid.
3. **Interpolate and draw.** Per frame, lerp the point arrays with the curve; colours through `mixHex` (exists). Multi-step: segment i → i+1 by the cycle, as `buildMorph` already defines loop · ping-pong · once.
4. **Time.** Each step draws at the morph's own `u`, so a step's own animation keeps moving. Two recorder draws per frame; canvas shape generators are cheap.

Shape is the default. A step that records no subpath (image data, gradients, `def.kind === 'engine'` GL) reads *No outline — use Blend* in its slot.

**Blend mode** is today's `buildMorph`, kept as the option: one generator, the param tween, the timeline's param lanes. Plan 05 § 3's crossfade across generators is Blend's phase 2, not this plan.

Check: `shape.check.mjs` — resampling keeps closure and N, start rotation finds the tip, 5-point star → 7-point star at t = 0.5 has N finite points.

## 5. The timeline

Stays as built — the user likes it. Shape mode: one lane, a marker per step at its `t_i`. Blend mode: the param lanes as today.

## 6. Steps

1. The rail row, morph mode, the two routes (§ 1). The Morph tab leaves the generator rail.
2. The Morph rail (§ 2).
3. The step picker (§ 3): `scrim`, search, generator headings, *From the stage*; `scrim` on New File.
4. Shape mode (§ 4) + the mode switch in `morphStore`; check file.
5. `FilesDialog` onto the DS browse surface (§ 3), seams filed as needed — its own step, after the morph walks.
6. Walk on the built bundle at 1600 and 390: rail row → empty slot → `+` → the picker over a scrim, a query narrows it → two steps of *different* generators morph point to point → Blend still tweens one generator → save, reopen from Home, the randomiser plays it. 0 console errors.

## Not this plan

- OKLCH colour lerp (plan 05, open).
- Drag reorder (↑ ↓ stay).
- Blend across generators (plan 05 § 3).
