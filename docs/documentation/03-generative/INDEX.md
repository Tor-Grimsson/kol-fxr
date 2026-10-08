---
title: Generative — the loop / generator system
type: index
status: active
updated: 2026-07-08
description: How a loop layer imports a generative loop, flattens its preset params onto itself, and drives them through scoped randomize, motion/look presets, and the 2D/GL engine lifecycle.
tags:
  - project/kol-fxr
  - domain/generative
  - editor/loops
aliases:
  - generative
  - loops
related:
  - "[[01-hierarchy/INDEX|the app hierarchy]]"
  - "[[01-loop-layer|the loop layer]]"
  - "[[02-scoped-randomize|scoped randomize]]"
  - "[[03-motion-and-look-presets|motion and look presets]]"
  - "[[04-engines-and-schema|engines and schema params]]"
---

# Generative — the loop / generator system

GENERATIVE is one of the three methods in [[01-hierarchy/INDEX|the app hierarchy]]: it *makes* imagery from parameters, and it lives on the **loop layer**. Every generative family — from a 2D scanline to a three.js knot — is an imported *loop* def that a loop layer hosts. This section documents how those defs are structured, how a preset lands on a layer, and every curation surface built on top of them.

## The pipeline, end to end

```
loop def (src/loops/**)      →  registry            →  LoopPicker         →  loop layer
  id/label/group/params          loopById / presets     Type>Cat>Preset      flat params
  draw(2d) | engine(gl)          presetParams()         picks a preset       layer[key]
                                                                                  │
        ┌─────────────────────────────────────────────────────────────────────┘
        ▼
  ParametersPanel  ──►  scoped randomize (rolls.jsx + rng.js)
                   ──►  motion Frame/Form + Look presets (motionPresets.js / lookPresets.js)
                   ──►  schema-driven controls (AutoControls, `when` gating, camera rail)
                                                                                  │
        ┌─────────────────────────────────────────────────────────────────────┘
        ▼
  render  ──►  2D: draw(ctx, u, w, h, params)   |   GL: gl/host.js engine (lazy three.js)
```

The load-bearing idea: **a preset's params are spread FLAT onto the layer** (`presetParams` → `updateLayer`), so every downstream system — bind dots, the timeline, randomize, motion presets — operates on plain `layer[key]` values, never a nested preset object.

## Sub-documents

| # | Doc | What it covers |
|---|---|---|
| 01 | [[01-loop-layer\|the loop layer]] | What a loop layer is, the loop families, the def contract, the registry, the taxonomy, and how `LoopPicker` applies a preset. |
| 02 | [[02-scoped-randomize\|scoped randomize]] | The flagship seeded/binding-safe/category-preserving randomize architecture — `rng.js` + `rolls.jsx`, scope buttons, the editable seed, Randomize all. |
| 03 | [[03-motion-and-look-presets\|motion and look presets]] | Motion Frame/Form preset tables per loop family, Soft Forms Look recipes, and the `Custom` sentinel that fires when you hand-edit a covered param. |
| 04 | [[04-engines-and-schema\|engines and schema params]] | 2D draw fns vs GL engines, the lazy `gl/host.js` lifecycle (dispose / `forceContextLoss`), per-layer duration (`phase.js`), the schema-exposed engine params, and the field-loop camera rail. |

## Source map

| Area | Files |
|---|---|
| Contract + registry + taxonomy | `src/loops/contract.js` · `src/loops/registry.js` · `src/loops/taxonomy.js` |
| GL catalog + engine host | `src/loops/gl/catalog.js` · `src/loops/gl/host.js` · `src/loops/gl/phase.js` |
| Randomize | `src/editor/lib/rng.js` · `src/editor/params/rolls.jsx` |
| Presets (motion / look) | `src/editor/params/motionPresets.js` · `src/editor/params/lookPresets.js` |
| Panel + picker | `src/editor/compose/inspectors/ParametersPanel.jsx` · `src/editor/compose/inspectors/LoopPicker.jsx` |
| Schema grammar | `src/editor/params/schema.js` |
</content>
</invoke>
