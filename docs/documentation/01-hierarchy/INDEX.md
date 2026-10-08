---
title: The App Hierarchy
type: reference
status: active
updated: 2026-09-01
description: The four-level content hierarchy — METHOD > TYPE > CATEGORY > PRESET — that organises every generative family, effect, and modulation source in the editor, plus where the data lives and how each level renders.
aliases:
  - hierarchy
tags:
  - project/kol-fxr
  - editor/architecture
  - domain/taxonomy
covers:
  - the four levels and what belongs to each
  - full TYPE lists per method (Generative, Effect)
  - the taxonomy.js data model (GENERATIVE_TREE / MISC_TREE / PICKER_TREE / LEGACY_GROUP_LABELS)
  - how each level renders (LoopPicker, Generative menu, Effects menu)
  - parked sections (Para Type / misc layer, Effects > Pattern generators)
sources:
  - src/loops/taxonomy.js
  - src/editor/compose/inspectors/effectCategories.js
  - src/editor/compose/inspectors/LoopPicker.jsx
  - src/editor/compose/inspectors/EffectsPanel.jsx
  - src/editor/shell/MenuTop.jsx
related:
---

# The App Hierarchy

Every piece of content in the editor sits at a fixed depth in one hierarchy:

```
METHOD  >  TYPE  >  CATEGORY  >  PRESET
```

The point: several hundred presets never feel like several hundred of anything — every step of the way is one short list. This is the structural backbone of the application; UI surfaces, menus, and pickers all express it, and new imports must slot into it.

## Level 1 — METHOD

Four fundamentally different ways of working. They never appear together in the app — a user is always inside exactly one:

| Method | What it is | Where it lives |
|---|---|---|
| **GENERATIVE** | Makes imagery from parameters. | The `loop` layer (Generative menu, loop picker). |
| **EFFECT** | Transforms a source (photo, layer render). | `filterId` stages on a layer (Effects menu / panel). |
| **VECTOR** | Makes or eats PATHS — parametric ring instruments, SVG distressing. | `loop` layers in the labs VECTOR section (groups `distress` / `modulator`; not in the editor picker). |
| **MODULATION** | Drives any param from a live signal. | BindDot sources (time, audio, MIDI, LFO, pointer, gamepad, expression). |

METHOD is never a picker — it's implied by what you're doing.

## Level 2 — TYPE

The children of a method (labs called these pages; the level is named **Type**).

**Generative types (10, labs sidebar order):** Scanline · Pattern · Loops · Math · Penrose · Drift · Gradients · Soft Forms · Soft Forms 3D · 3D Scene
Data: `GENERATIVE_TREE` in `src/loops/taxonomy.js`. Two types span several flat registry groups and get a second dropdown: **Loops** → Simple / Field / Pattern Loops (`shape` / `field` / `patternloop`); **3D Scene** → Primitive / Ribbon / Forms / Environment / Abstract (`scene` / `ribbon` / `forms` / `environment` / `abstract`, `scene` relabelled to "Primitive").

**Vector types (2, added 2026-09-01 — the kol-apps ports):** Distressor (`distress` — SVG path distress, source via the labs source picker's SVG mode) · Modulator (`modulator` — warped concentric ring instrument). Labs-only: both live in the labs catalog's VECTOR section (`src/editor/labs/catalog.js`), stay out of `GENERATIVE_TREE`/`PICKER_TREE`, and resolve read-only in the editor inspector via `LEGACY_GROUP_LABELS`.

**Effect types:** the labs nav model — **Halftone · Scanline · CRT · Refraction · FX rack · Pattern** (`CATEGORIES` in `src/editor/compose/inspectors/effectCategories.js`), plus the Pixi GPU tier's own group buckets that appear when Pixi filters are in the layer's catalog — **Color Adjustments · Blur & Sharpen · Distortion · Artistic · Lighting · Stylize · Utility** (`PIXI_GROUPS`, keyed on each def's `group`). Any registered filter no category claims falls into an **Other** bucket, so a new filter can never vanish from the picker. Empty types drop out.

## Level 3 — CATEGORY

The children of a type:

- Generative **Scanline** → Spaced · Glyph · Lattice · Vortex · Rings · Spiral (the presets' `sub` buckets — `presetsInGroup(group)` grouped by `p.sub`).
- Effects **Halftone** → the individual filters `fx-ascii` · `fx-halftone-dither` · `fx-bitmap`. For a hardcoded effect type, the category level IS the individual filter (`effectCategories()` returns `{ id, label, filters: FilterDef[] }`).
- Effects **Pattern** → Moiré · Mesh Gradient · Reaction · Halftone (generator families, plus the `dither` filter — see *Outside the Generative tree*).

## Level 4 — PRESET

The leaf list a user actually picks from. Always plain names, no prefixes:

- Generative Scanline > Spaced → Drift · Fine · Coarse · Waves · Columns.
- Effects Halftone > Dither → the filter's designated **preset param**, surfaced as **Preset** in the Effects panel. The param each filter uses is mapped by `presetParamOf()` in `effectCategories.js`:

  | Filter | Preset param |
  |---|---|
  | `fx-halftone-dither` | `mode` |
  | `fx-ascii` | `algorithm` |
  | `fx-bitmap` | `palette` |
  | `glass` | `pattern` |
  | `scanline` | `look` |
  | `dither` | `palette` |
  | `gl-lens` | `type` |

  Filters with no entry have no preset level — they're purely parametric. A preset pick applies `presetPatchFor(def, value)`: the preset key plus any per-value recipe the def carries in `presetPatches`.

A preset is a curated starting point, not a patch — picking one resets the family's params to the preset's full set (labs semantic). In the loop picker, picking at any level (type / group / category) lands on that target's **first** preset and resets params (`applyPreset` in `LoopPicker.jsx`).

## Where the data lives — `src/loops/taxonomy.js`

The hierarchy is pure data layered over the flat loop registry `GROUPS`; the registry stayed flat as families were imported one by one, and this file restores the levels without touching it.

| Export | Role |
|---|---|
| `GENERATIVE_TREE` | The GENERATIVE method's 10 TYPES, in labs sidebar order → `{ label, groups: [registryGroupIds], labels? }`. Multi-group types (Loops, 3D Scene) mirror labs' own internal sub-pages; `labels` overrides a group's display name (`scene` → "Primitive"). |
| `MISC_TREE` | The `misc` layer's tree — the oddball rule-driven generators that are neither Generative types nor Effects. One entry today: **Para Type** (`paratype`, labs Type Lab). Interfaces (labs Composition screens/elements) joins later. |
| `PICKER_TREE` | The loop layer's picker tree — currently `= GENERATIVE_TREE` (the Generative types only). Groups living elsewhere are not pickable here. |
| `LEGACY_GROUP_LABELS` | Read-only identity for loop layers whose group is outside the picker tree: `optic` → "Pattern · Effects", `paratype` → "Para Type · Misc". Keeps legacy layers displaying truthfully instead of appearing as pickable generative types. |

Effect TYPE/CATEGORY data is separate — `CATEGORIES`, `PIXI_GROUPS`, and the `PRESET_PARAM` map in `src/editor/compose/inspectors/effectCategories.js` — a presentation-layer mapping over the filter registry, which stays category-free.

## Where each level surfaces (and how it renders)

| Surface | Source | Levels shown |
|---|---|---|
| **Generative menu** (top bar) | `MenuTop.jsx` | TYPE nest (`GENERATIVE_TREE.map`) → group nest where a type spans registry groups → CATEGORY sub-bucket headers → PRESET items. Picking inserts a `loop` layer via `addGenerative` (`addLayer('loop', …)` with the preset's full param set). |
| **Effects menu** (top bar) | `MenuTop.jsx` | TYPE nests via `effectCategories(fxOptions)` (filtering out `other` and `pattern`) → CATEGORY items that `addFilter` to the selected layer. **Pattern** renders as its own nest holding its filters plus the four generator categories. Preset picking is not here — it lives in the Effects panel. |
| **Loop picker** (Inspector + Parameters) | `LoopPicker.jsx` | **Type** → [group] → **Category** → **Preset** dropdowns. `tree` defaults to `PICKER_TREE`; the misc layer passes `MISC_TREE`. A layer whose group is outside the tree shows a read-only `LEGACY_GROUP_LABELS` identity. Shared by both panels so they can't drift. |
| **Effects panel** | `EffectsPanel.jsx` | **Type** → **Category** → **Preset** dropdowns, then params. |

## Outside the Generative tree (deliberate, labs-true)

- **Para Type** — labs' own Type Lab section, not a Generative type. Lives on the **misc layer** (`MISC_TREE`): the placeholder home for rule-driven generators that are neither Generative types nor Effects (labs Interfaces joins it later). Categories: Glyphs · Styles, over Classic/Skeleton engines.
- **Effects > Pattern generators** — the four labs `/optic/*` pages, listed in `MenuTop`'s `FX_PATTERN_CATEGORIES`. Taxonomically EFFECT > Pattern; mechanically they generate (nothing to filter), so picking one inserts a `loop` layer via `addGenerative`. Their registry group stays `optic`; Mesh Gradient's presets live in the GL `gradients` group under sub `Mesh` (`presetsInSub(group, sub)`).
- Neither appears in the loop picker's Type dropdown (`PICKER_TREE` = the Generative types only); legacy loop layers carrying these groups display a read-only identity (`LEGACY_GROUP_LABELS`).

## Rules for new content

1. Every imported family declares its place in this hierarchy **before** it lands — no flat additions to a picker.
2. Level names are fixed vocabulary: Method, Type, Category, Preset. UI labels use exactly these words.
3. Preset lists are plain names — the levels above them carry the context, never the preset label.
