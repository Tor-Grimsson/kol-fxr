---
title: The Effects panel
type: guide
status: active
updated: 2026-07-08
description: The EffectsPanel UI that drives the chain — chain rows, the add/replace picker flow, category sync, the Preset dropdown, per-stage seeded randomize, and the sweep-stack controls; plus the effectCategories taxonomy.
tags:
  - project/kol-fxr
  - domain/effects
  - editor/effects
aliases:
  - effects-panel
sources:
  - src/editor/compose/inspectors/EffectsPanel.jsx
  - src/editor/compose/inspectors/effectCategories.js
  - src/editor/compose/filterChain.js
related:
  - "[[01-filter-chain|filter chain]]"
  - "[[05-sweeps|sweeps]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
---

# The Effects panel

`EffectsPanel.jsx` is the Effects tab of the right rail — the chain editor. A layer stacks up to `MAX_FILTERS` ordered stages ([[01-filter-chain|filter chain]]); the panel is one row per stage plus the picker flow to add/replace them, and the selected row's params render below.

## Anatomy

- **Chain list** — one `StageRow` per stage: enable toggle (eye) · name · move up/down · remove. Clicking a row selects it (its params render below). Move arrows are disabled where a move would cross the terminal engine stage.
- **Add effect** button — clears the selection into *add mode* (disabled at `MAX_FILTERS`).
- **Type / Category / Preset** picker rows.
- **Effect / Motion** tab strip (only with a stage selected).
- **Effect tab** — the stage's non-anim params via `AutoControls`, ending in the seeded **Randomize** row.
- **Motion tab** — the stage's `tab:'anim'` params, plus the stacked **sweep** rig for sweep-capable filters ([[05-sweeps|sweeps]]).

## The picker flow

The "Add effect" flow keeps the labs Type/Category taxonomy:

- **No stage selected (add mode)** — picking an effect in a category **adds** a stage (`addFilter`); selection then follows the new stage via a new-key effect.
- **A stage selected** — the picker **shows/replaces** it: picking a different effect calls `replaceFilter`; picking **None** removes the stage (the old single-filter semantics, per stage).

**Category is a browse control** — switching it never writes the layer. It syncs *to* the selected stage's bucket (so reopening lands on its bucket), but browsing to another category afterwards doesn't snap back. External chain writes (the top-bar Effects menu adds a stage without remounting the panel) are followed via a `keysRef` diff: a new stage key selects that stage and snaps the category; removals clamp the selection.

## Categories (`effectCategories.js`)

A presentation-layer mapping over the registry, which stays category-free. Canvas/GL categories are hardcoded `filterIds`; pixi categories are keyed on the def's own `group` (so new pixi filters slot in without editing the list).

| Category | Members |
|---|---|
| Halftone | `fx-ascii` · `fx-halftone-dither` · `fx-bitmap` |
| Scanline | `scanline` |
| CRT | `gl-disco` · `gl-slitscan` · `gl-scan` · `gl-trails` · `fx-kaleido` · `fx-mirror` |
| Refraction | `gl-lens` · `gl-distort` · `fx-chromatic` · `glass` |
| FX rack | `fx-hsl` · `fx-hsv` · `fx-brightness` · … · `fx-pixelsort` |
| Pattern | `dither` |
| Color Adjustments … Utility | the seven pixi `group` buckets |
| Other | any registered filter no category claims (never vanishes from the picker) |

`categoryOf(filterId)` resolves a filter's bucket; ids listed with no registered filter simply don't render.

## The Preset dropdown

Hierarchy level 4 (METHOD > TYPE > CATEGORY > PRESET — [[../01-hierarchy/INDEX|hierarchy]]). A filter's designated preset param surfaces as a **Preset** dropdown above the tab strip and leaves the normal params list. `presetParamOf(filterId)` maps the filter to that param key:

| filter | preset param |
|---|---|
| `fx-halftone-dither` | `mode` |
| `fx-ascii` | `algorithm` |
| `fx-bitmap` | `palette` |
| `glass` | `pattern` |
| `scanline` | `look` |
| `dither` | `palette` |
| `gl-lens` | `type` |

`presetPatchFor(def, value)` applies the preset key plus any per-value recipe the def carries (`presetPatches` — glass ships the labs full look-configs). Filters without an entry have no preset level (purely parametric).

## Per-stage randomize

The Effect tab ends with a seeded Randomize (labs dice). An editable seed field + a Randomize button that mints a fresh `randomSeed`; committing a typed seed re-rolls deterministically. It runs `randomizeSchema(def.params, mulberry32(seed))` and `mergeRoll`s into the stage's params (bindings preserved, `noRandom` params untouched) as one discrete undo step.

## Stage param plumbing

Params are **nested** per stage but rendered through the existing layer-shaped renderer: the stage's params spread over the layer (`{ ...layer, ...stage.params }`) so binding sources still see host props like `x/y`, and a param key shadows any same-named layer prop. Writes rebuild the `filters` array through `useLayerEdit`'s coalesced history, so slider drags collapse to one undo entry.

## Host gating

The panel refuses non-effectable layers. Photo and 2D loop layers get the full catalog including GL engines (their live pixels feed the engine source); other effectable vector types (shape/text/pattern/path) are canvas/pixi only; **engine loops can't host effects** ("Engine loops can't host effects yet."). GL engine options drop out of the picker once an engine stage exists or the host can't feed one (the one-engine rule).
