---
title: The Type Family
type: index
status: active
updated: 2026-07-08
description: The three type surfaces — the flat Text layer, the Kinetic-type engine, and Para Type (misc) — how each authors, renders, and exports type.
aliases:
  - type-family
tags:
  - project/kol-fxr
  - domain/typography
  - editor/type-family
related:
  - "[[01-text-layer|Text layer]]"
  - "[[02-kinetic-type|Kinetic type]]"
  - "[[03-para-type|Para Type]]"
  - "[[../01-hierarchy/INDEX|hierarchy]]"
---

# The Type Family

The editor sets type through **three separate surfaces**, each a distinct layer type with its own engine, authoring panel, and export path. They never share a render vehicle — a text layer is not a kinetic composition is not a procedural specimen. This section documents each one.

The one thing they have in common: all three ultimately produce **real vector geometry** on export (glyph outlines or engine paths), not rasterised text. Where a surface can't vectorise (the Mono cut, a live canvas snapshot), the fallback is called out per-surface.

## The three surfaces

| Surface | Layer type | Engine / builder | Authoring panel | Doc |
|---|---|---|---|---|
| **Text layer** | `text` | fontLoader + opentype outlines (`modes/type/`) | `TextPanel.jsx` (right-rail Text tab) | [[01-text-layer\|Text layer]] |
| **Kinetic type** | `kinetic` | `KineticType` SVG engine (`src/kinetic/`) | `KineticPanel.jsx` + on-canvas overlay | [[02-kinetic-type\|Kinetic type]] |
| **Para Type** | `misc` | procedural glyph engines (`loops/paratype/`) | `ParatypeTools.jsx` + Parameters | [[03-para-type\|Para Type]] |

## How they differ

| Axis | Text layer | Kinetic type | Para Type |
|---|---|---|---|
| **What it is** | One flat block of Right Grotesk, static | A composition of N animated type elements on paths/grids/radials | A procedural type specimen from anatomy params |
| **State shape** | Flat props on the layer (`width`, `weight`, `size`…) | Opaque `layer.comp` = `{ bg, instances[] }` | Flat loop params on a misc layer (rides the loop vehicle) |
| **Animation** | None (static; metrics can be bound) | Per-element motion stack, seamless over `u∈[0,1]` | None (static; `u` unused) |
| **Frame fill** | Placed box (600×120 default) | Full-frame (labs Type Lab) | Full-frame (like the loops) |
| **Vector export** | Real glyph outlines; foreignObject fallback (Mono) | Live SVG subtree serialised, fonts inlined base64 | Flatten-to-vector → editable shape layers |

## Where they sit in the hierarchy

Two of the three sit **outside** the Generative tree deliberately (see [[../01-hierarchy/INDEX|hierarchy]]):

- **Kinetic type** is its own layer type and its own METHOD-adjacent picker (Type · Kinetic), not a Generative loop.
- **Para Type** is the first entry on the **misc layer** (`MISC_TREE`) — the placeholder home for rule-driven generators that are neither Generative types nor Effects.
- **Text** is a first-class layer type, not a generator at all.

## Provenance

Most of this family was ported from `kol-labs-single` and hardened over two sessions:

- **2026-07-03** (`text-tools-waves`): the misc layer + Para Type re-home, the kinetic morph mode, real text vector export, and the kinetic layer's graduation from preset-player to per-element type tool.
- **2026-07-08** (`labs-parity-waves-A-E`, Wave C): the kinetic **tier-2** authoring layer — VF axis sliders, OpenType feature menu, motion stack, custom-path point editor, grouping, the on-canvas element overlay, morph custom curve — plus the Para Type specimen grid, flatten-to-vector, and XY explore pad.
</content>
</invoke>
