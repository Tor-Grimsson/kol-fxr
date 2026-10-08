---
title: Schema & Controls
type: reference
status: active
updated: 2026-07-08
description: The param descriptor grammar (types + section/tab/when/animatable/noRandom/role metadata), how AutoControls auto-renders it, and the shared control idioms (NumberField draft/commit, ColorField, TreePicker).
aliases:
  - schema-and-controls
  - param-schema
tags:
  - project/kol-fxr
  - editor/params
  - domain/ui
covers:
  - the descriptor grammar and every metadata key
  - AutoControls rendering (sections, tabs, bound read-only state)
  - the shared control idioms (NumberField, ColorField, TreePicker)
sources:
  - src/editor/params/schema.js
  - src/editor/params/AutoControls.jsx
  - src/editor/params/schemas/shape.js
  - src/editor/compose/inspectors/NumberField.jsx
  - src/editor/compose/inspectors/ColorField.jsx
  - src/editor/compose/inspectors/TreePicker.jsx
related:
  - "[[INDEX|parameters & binding]]"
  - "[[02-binding-and-sources|binding & sources]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
---

# Schema & Controls

Every layer type declares its tunable knobs as an array of **descriptors**. `AutoControls` renders those descriptors into live controls — one code path for every layer type, and for every imported generator/effect. The grammar is adopted from kol-labs `src/loops/contract.js`, so a loop module's `params:[…]` array drops in with no translation. Helpers live in `src/editor/params/schema.js`.

## The descriptor grammar

```
{ key, label, type, default,
  min?, max?, step?, options?, format?, when?, animatable?, tab?, section? }
```

| Key | Meaning |
|---|---|
| `key` | Prop name on the layer object. |
| `label` | Control label. |
| `type` | `'range'` · `'color'` · `'select'` · `'segmented'` · `'toggle'` · `'text'`. |
| `default` | Seed value (`schemaDefaults` builds the initial prop object). |
| `min` / `max` / `step` | Range bounds; `step` defaults to `1`. |
| `options` | `[{ value, label }]` — for `select` / `segmented`. |
| `format` | `(v) => string` hint text rendered under a range. |
| `when` | `(layer) => bool` conditional visibility (e.g. star-only params). Hidden params drop live. |
| `animatable` | Override; defaults **true** for `range`/`color`, false otherwise. Drives whether the field gets a bind dot. |
| `tab` | `'generate'` · `'style'` · `'anim'` — Parameters-panel sub-tab. Absent = `'style'`. The labs `tab:'color'` is honored as style with a `Color` section header. |
| `section` | Sentence-case group header (`'Geometry'`, `'Motion'`). Consecutive same-section params share one header; absent = unsectioned run. |

Two more keys, read outside `AutoControls`:

| Key | Read by | Meaning |
|---|---|---|
| `noRandom` | `rolls.jsx` / `randomizeSchema` | Exclude from scoped seeded randomize (structural counts like `Bars`, `Rings` that read as jank when rolled). "Randomize section" can override it. |
| `role` | `src/loops/theme.js` `themeParams` | On `type:'color'` params: `'bg' | 'fg' | 'accent' | 'dim' | 'warm'` — the theme slot that param recolors to on a theme switch. Non-roled colors survive a switch untouched. |

### Grammar helpers (`schema.js`)

| Helper | Returns |
|---|---|
| `schemaDefaults(schema)` | The default-value object (mirrors `loopDefaults()`). |
| `visibleParams(schema, layer)` | Params whose `when` passes for the current layer state. |
| `isAnimatable(p)` | `p.animatable ?? (type is range/color)` — whether a bind dot appears. |
| `paramTab(p)` | Resolved sub-tab; `'color'` collapses to `'style'`. |
| `paramSection(p)` | Section header, or `'Color'` for `tab:'color'`, or `null`. |

### Example

`src/editor/params/schemas/shape.js` — note `when` gating per `kind`, `animatable:false` on integer/enum morphs, and shared `section:'Geometry'`:

```js
export const SHAPE_SCHEMA = [
  { key: 'kind',    label: 'Kind',   type: 'select', default: 'logo', options: KIND_OPTIONS },
  { key: 'variant', label: 'Variant',type: 'select', default: 'logomark', options: LOGO_VARIANTS, when: isKind('logo') },
  { key: 'sides',   label: 'Sides',  type: 'range', min: 3, max: 12, step: 1, default: 5,
    when: isKind('polygon'), animatable: false, section: 'Geometry' },
]
```

Only type-specific knobs live in a schema. Universal props (position, transform, fill/stroke, opacity) are shared controls the inspector renders directly. Schemas ship per type under `src/editor/params/schemas/` (`shape.js`, `text.js`, `pattern.js`, `photo.js`); loop/effect schemas come from their registered modules.

## AutoControls

`AutoControls({ schema, layer, setProp, palette, renderAnimate, tab, emptyHint })` (`AutoControls.jsx`):

- **Filters** `visibleParams` by `when`, then by `tab` when a tab is passed; renders `emptyHint` (or null) when nothing survives.
- **Groups** consecutive same-`section` params under one small header.
- **Writes** go through `setProp` (the caller's `useLayerEdit` path — history + coalescing intact).
- **`renderAnimate(p, bound)`** (optional) is called for each animatable param and rendered beside its control. This is the seam the timeline uses to add bind dots without `AutoControls` knowing about the transport — `ParametersPanel` passes `(p) => <BindDot layer={layer} param={p} setProp={setProp} />`.
- **Range params** render `RangeField` (not the DS `Slider`): the value box takes **direct input** — a number sets a constant, an expression binds the `expr` source. When bound, the track goes read-only and its thumb **tracks the live resolved value** each transport tick (it subscribes to the transport only while bound), so the graph drives it without the slider fighting the binding (`isBinding(layer[p.key])`).

Control mapping per type: `range` → `RangeField` (slider + direct number/expression input) · `color` → `ColorField` · `select` → `Dropdown` · `segmented`/`toggle` → `ViewToggle` · `text` → `Textarea`. A `toggle` stores a bare boolean, presented as an off/on segmented control (optional `labels:` override the cell text).

## Shared control idioms

Three reusable controls that the schema controls and the hand-wired inspectors both consume. All three share one **draft/commit** discipline: typing edits a local draft; the value commits on blur / Enter — so intermediate keystrokes never reshape the target and never flood undo with per-character entries.

| Idiom | File | Contract |
|---|---|---|
| **NumberField** | `src/editor/compose/inspectors/NumberField.jsx` | The one draft/commit number input (dimensions, position/rotation, stroke weight). `onCommit` receives the raw draft string; parsing/clamping stays at the call site. After commit the draft resnaps to the prop, so invalid input falls back to the last good value. Controlled draft on purpose (the DS `Input` always sets `value`). |
| **ColorField** | `src/editor/compose/inspectors/ColorField.jsx` | Swatch button + inline hex input + palette-ref popover. Understands literal hex, `palette:*` refs, `var(--kol-*)` themed tokens (shown as "Theme", no hex), and `None` (transparent). Hex commits on blur/Enter; 3-digit shorthand expands. Extracted from `LayerInspector` so `AutoControls` consumes it without an import cycle. |
| **TreePicker** | `src/editor/compose/inspectors/TreePicker.jsx` | The generic TYPE > CATEGORY > PRESET dropdown stack over a flat preset catalog (see [[../01-hierarchy/INDEX\|hierarchy]]). Type/category hops land on the target's first preset (a preset is a curated starting point, not a patch). `PickerRow` / `PickerDropdown` are the shared styling primitives; `LoopPicker` reuses them but keeps its own registry-group logic. |
</content>
