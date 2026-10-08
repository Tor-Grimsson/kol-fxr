---
title: Kinetic Type
type: reference
status: active
updated: 2026-07-08
description: The KineticType SVG engine — TYPE compositions of animated per-glyph elements, the tier-2 authoring layer (VF axes, features, motion stack, grouping, on-canvas overlay, morph), and live-vector export.
aliases:
  - kinetic-type
tags:
  - project/kol-fxr
  - domain/typography
  - editor/kinetic
covers:
  - the KineticType SVG engine and its externally-driven render model
  - the composition shape (bg + instances) and the Type / Kinetic picker
  - per-element editing (Elements list, knobs, grouping)
  - tier-2 — VF axis sliders, OpenType features, motion stack, custom-path editor, on-canvas overlay, morph mode
  - live-vector export via the serialised SVG subtree
sources:
  - src/kinetic/KineticType.js
  - src/kinetic/knobs.js
  - src/kinetic/morph.js
  - src/kinetic/features.js
  - src/kinetic/fonts.js
  - src/kinetic/presets.js
  - src/kinetic/paths.js
  - src/editor/compose/inspectors/KineticPanel.jsx
  - src/editor/compose/KineticElementOverlay.jsx
  - src/editor/compose/build.js
related:
  - "[[INDEX|Type family]]"
  - "[[01-text-layer|Text layer]]"
  - "[[03-para-type|Para Type]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
---

# Kinetic Type

A `kinetic` layer is a **composition of N animated type elements**. The composition rides opaquely on `layer.comp` = `{ bg, instances[] }` (like a loop's `forms`) — no flat param spread, no bind dots on its internals except the one bridge prop (`morphBlend`). Picking a preset resets `comp` wholesale.

It began as a preset-player and, over two sessions, graduated into a per-element type tool with a full authoring layer (the **tier-2** work, `labs-parity-waves-A-E`, Wave C).

## The engine

`src/kinetic/KineticType.js` — an SVG type-composition engine ported from `kol-labs-single` (Phase 10). A composition is a FRAME (`{ bg }`) holding N INSTANCES, each an independent element with its own text · font · colour · arrangement · variable axes · OpenType features · internal animation.

**Why SVG, glyph-per-`<text>`:** Canvas 2D can't set per-glyph variable-font axes, so each glyph is its own `<text>`. The engine measures advances with the browser (`getStartPositionOfChar` / `getComputedTextLength` — these reflect real VF/feature widths), places each glyph onto a curve via `getPointAtLength` + a tangent (or a grid cell / spoke / ring), and animates as a **pure function of `u∈[0,1]`** so every loop is seamless.

**Externally driven (the loops treatment):** no internal rAF / transport / duration — the host calls `renderAt(u)` per transport tick (`KineticLayer` subscribes via `useTransportCtx`). DOM is reconciled only when the instance set/order changes (`_syncInstances`), not every frame.

### API surface

| Method | Purpose |
|---|---|
| `setComposition(comp)` · `resize(w,h)` · `renderAt(u)` · `dispose()` | lifecycle + per-tick render |
| `getInstanceRect(id)` | live glyph bbox in layer-local px (used by the overlay selection frame) |
| `hitTest(clientX, clientY)` | topmost instance under a screen point (click-to-select) |

The engine registers itself on its host element as `host.__kolKineticEngine` so editor chrome can hit-test/measure **without threading refs through `LayerRenderer`**.

### Arrangements

Glyphs land via one of two families (`src/kinetic/paths.js` + the engine's placed modes):

- **Path arrangements** (`buildPath` → an SVG `<path>` the engine walks): `line`, `arc`, `sine`, `zigzag`, `spiral`, `circle`, `ellipse`, `custom` (Catmull-Rom through normalized control points).
- **Placed arrangements** (positioned directly, no path): `array` (rows×cols grid), `radial` (sunburst spokes), `rings` (concentric vortex).

`align` (start/center/end), `flow` (Flow lets type bleed past an open path's ends; Contain clamps it inside), and `multiply` (repeat the word N times in one run) all modify placement. **Stagger** desyncs repeated units — spokes, rings, grid cells, multiplied copies each evaluate their motion at `wrap01(u + stagger·k/K)`, and radial/rings units additionally take extra integer turns (a rate difference, so it reads as movement rather than a static twist). Everything stays a pure fn of `u` with integer cycles, so it's still seamless.

### Fonts

`src/kinetic/fonts.js` — three TG variable fonts (fvar ranges read off the ttfs), the faces the shipped presets use:

| Key | Family | Axes |
|---|---|---|
| `rot` | TG Rot | `wdth` 64–172, `wght` 100–900 |
| `malromur` | TG Malromur | `wght` 300–900 |
| `gullhamrar` | TG Gullhamrar | `wght` 300–900 |

`loadFonts()` registers each via `FontFace` with its variable weight/stretch ranges. The file also owns the **export font cache**: `warmFontCss()` pre-fetches each face as base64 `@font-face` CSS at layer mount, so `build.js` can embed fonts synchronously into the exported SVG.

## The picker + composition

`KineticPicker` (in `KineticPanel.jsx`) is the shared `TreePicker` stack — TYPE > CATEGORY > PRESET (see [[../01-hierarchy/INDEX|hierarchy]]) — over `KINETIC_TREE` / `KINETIC_PRESETS` (`src/kinetic/presets.js`):

- **Type** = *Type* (the 10 acre-studio "type on a path, rotating" compositions — radial sunbursts, ring vortices, single-path loops) · *Kinetic* (the Labs Scenes/Elements catalog).
- **Category** = the type's `sub` buckets; **Preset** = plain names. Picking resets the whole `comp` (loop-preset semantics — a curated start, not a patch).

An instance's defaults live in `INSTANCE_DEFAULTS` (`presets.js`); `mergeInstance(partial, i)` merges a partial over them and is also the "fresh element" factory for the Elements editor. `normalizeVf` restricts a `vf` object to the font's real axes.

## Per-element editing

`src/editor/compose/inspectors/KineticPanel.jsx` renders three pieces: the **Picker**, the **Elements** list, and the **Knobs**. The instances are user-facing "**Elements**"; the selected index is local UI state, and every Style/Animation knob targets it.

**ElementList** — select / add / duplicate / remove / reorder rows (the last element can't be removed). Structural edits go through `updateLayer` (discrete history); param tweaks through `setProp('comp', …)` (coalesced).

**Knobs** — `KINETIC_KNOBS` (`src/kinetic/knobs.js`) are **pure comp transforms**, each parameterized by the instance index `i` (`get`/`set`/`when`/`options` all take it). They're rendered by KineticPanel directly rather than via AutoControls, because `comp` is the layer's single source of truth — flat mirrors would desync on every preset switch. `randomiseComp` rolls the tractable knobs (seeded, `noRandom`/`when` honored), per element or across all elements.

## Tier-2 — the authoring layer

Built this session (Wave C). Everything client-feasible without a new heavyweight dependency.

### VF axis sliders

`vfAxisKnob(tag)` (in `knobs.js`) — one slider per fvar axis (`wdth`, `wght`) writing the instance's **static** VF coords (`inst.vf[tag]`). The slider **range is a function of the selected instance's font** (`knobRange` resolves `min`/`max` from the font registry — `rot` is `wght` 100–900, `malromur`/`gullhamrar` 300–900), and writes clamp per-font (`setVfAxis`). Section: *Style · Axes*.

### OpenType feature menu

`src/kinetic/features.js` — `OPENTYPE_FEATURES`: liga · dlig · smcp · case · onum · tnum · frac · swsh · ss01 · ss02. `featureString(ot)` renders them as a `font-feature-settings` string on the per-glyph `<text>` **and** the measure node (so advances reflect the active features). `OpenTypeMenu` (KineticPanel) is a multi-select stay-open popover, injected between the Axes and Arrangement sections.

### Motion stack

The engine composes the primary `motion` plus a `motions[]` array per element (`_anim`): displacements add, scale/opacity multiply, VF axes merge. `MotionStack` (KineticPanel) is a layer selector (1 = the primary `motion`, 2.. = the extras) with add/remove; `MOTION_KEYS` retarget the single-motion knobs to the selected layer via a swap-in view (`motionView`). Motion modes: `none` · `march` · `orbit` · `vfwave` · `glyphwave` · `cascade` · `sweep` · `sweepWeight` · `sweepShift`.

### Custom-path point editor

`CustomPathPoints` (KineticPanel) — the `custom` arrangement's normalized control points in a **frame-proportioned box** (aspect = the layer's w:h), with draggable handles + add/remove. The preview curve is the same Catmull-Rom build the engine walks (`buildPath('custom')`); `DEFAULT_POINTS` seeds a gentle S. Shows only when the selected element's arrangement is `custom`.

### Grouping

Tick rows → **Group** / **Ungroup** (a shared `gN` group id per press). Grouped elements move / scale / align / set-weight / italic / fill **as one**: `GROUP_KEYS` (`align`, `italic`, `fill`, `fontSize`, `vfWght`, `offsetX`, `offsetY`) fan out across members in `writeKnob` — `fontSize` scales proportionally, `offset` moves by delta, the rest copy.

### On-canvas element overlay

`src/editor/compose/KineticElementOverlay.jsx` — element-edit chrome, a **DOM-seam** design (zero `LayerRenderer` change). Entered from KineticPanel's "Edit on canvas" (`kol:kinetic-edit`); `CanvasArea` owns the mode state like crop / node-edit.

| Interaction | Effect |
|---|---|
| click | hit-test select (engine `hitTest` — topmost glyph bbox); empty frame deselects |
| drag element | move it (writes normalized `offset`; grouped elements move as one) |
| corner handles | proportional font-size scale (grouped elements scale by one factor) |
| Escape / Enter | exit element-edit mode |

The engine is reached through its host (`__kolKineticEngine`) — no refs threaded through the renderer. The selection frame is **rAF-driven straight to the DOM** (the glyph bbox animates every transport tick — a React re-render would fight the loop). Element selection syncs both ways with the panel via `kol:kinetic-element`.

### Morph mode + custom curve

`src/kinetic/morph.js` — the "morph monster": real glyph-outline interpolation via opentype.js. When `instance.morph.on` (and the arrangement isn't radial/rings, which are `<text>`-only), glyphs render as `<path>` outlines instead of `<text>`:

- **Cut A** = the instance's own font + vf. **Cut B** = `vf2` (same VF, other axis coords — topology is identical, so the lerp is flawless) **or** `face2` (a different face — topology usually differs, so it pops to the closer outline at blend 0.5).
- Outlines parse async (`ensureGlyphFont`); the instance renders in text mode until they resolve, then swaps — so `renderAt` stays synchronous.
- `buildMorphGlyphs` is pure/DOM-free — it returns `d` strings + advances, which the engine places exactly like the `<text>` glyphs. Because opentype's static advance ignores variation, it spaces glyphs from the **varied ink bbox** (`advanceFromInk`) so a narrow→wide morph never overlaps its neighbour.

Modes (`MORPH_MODE_OPTIONS`): `morph` (path lerp) · `fade` (A↔B opacity) · `random` (per-letter random coords). Curves (`CURVE_OPTIONS`): flat · linear · reverse · ease · expo-in · expo-out · log · sine · **custom** (a cubic bézier whose control points `cp1`/`cp2` are authored via the rail's XY sliders — `cpKnob` — instead of labs' on-canvas bézier drag). Gates follow labs' MorphPanel exactly (`canMorph` / `morphOn` / `cutB` / `customCurve`).

### morphBlend — the one flat bindable prop

The kinetic layer's single flat prop is `layer.morphBlend` (Animation tab, gated on any element having morph on). `MorphBlendKnob` takes a **BindDot** and animates like any schema range param — `KineticLayer` resolves it into every morph-on instance's `morph.blend` before `setComposition` (the stored comp is untouched). Once set, it **overrides** the per-element Style-tab blend.

## Live-vector export

`kineticLayerSvg` (`build.js`) — **serialise the live engine's SVG subtree** and embed it as a nested `<svg>` at the layer's bounds. It finds the host (`[data-kinetic-host][data-layer-id]`), clones its `<svg>`, sets the layer x/y, and prepends a `<style>` with the used fonts inlined as base64 `@font-face` CSS (`kineticFontCss`, warmed at mount via `warmFontCss`). Crisp at any @Nx; the PNG path rasterises the same SVG through the SVG-in-`<img>` pipeline where data-URI fonts resolve fine. If the font cache isn't warm yet the exported glyphs fall back to system faces — the live canvas is unaffected.
</content>
