---
title: Documentation
type: index
status: active
updated: 2026-07-08
description: The kol-fxr subject documentation — the app's systems in numbered sections, from the overview through the generative, effects, binding, camera, type, export, media, and persistence layers.
tags:
  - project/kol-fxr
  - editor/reference
aliases:
  - documentation
related:
  - "[[00-overview/INDEX|overview]]"
---

# Documentation

The subject documentation for **kol-fxr** — what the app *is about*, in numbered sections. Start at [[00-overview/INDEX|the overview]]; each section below is a folder with an `INDEX.md` and (for the larger areas) numbered sub-docs.

| # | Section | What it covers |
|---|---|---|
| 00 | [[00-overview/INDEX\|Overview]] | What the app is, the DOM/SVG compositor, ships-as-library + standalone, the mental model + repo layout. |
| 01 | [[01-hierarchy/INDEX\|Hierarchy]] | The METHOD > TYPE > CATEGORY > PRESET content structure and its data model. |
| 02 | [[02-layers/INDEX\|Layers]] | The 11 layer types, full-frame vs placed defaults, the compositor, booleans/groups, state + history. |
| 03 | [[03-generative/INDEX\|Generative]] | Loop layers + families, the scoped-randomize architecture, motion/look presets, engine lifecycle. |
| 04 | [[04-effects/INDEX\|Effects]] | The filter chain, the three tiers (canvas · pixi GPU · GL engine), sweep stacks, the Effects panel. |
| 05 | [[05-parameters-binding/INDEX\|Parameters & Binding]] | Schema + controls, bind dots + sources, response shaping + expressions, transport + timeline. |
| 06 | [[06-camera-motion/INDEX\|Camera & Motion]] | Viewport motion, the Orbit tool (2D + 3D), per-layer duration, keyframes, transport governance. |
| 07 | [[07-type-family/INDEX\|Type Family]] | Text layer, kinetic type (tier-2), Para Type — the three type surfaces. |
| 08 | [[08-export/INDEX\|Export]] | Aspect/@Nx, PNG/SVG/webm, the batch zip matrix, live record, render/export parity. |
| 09 | [[09-media/INDEX\|Media]] | Photo/video/webcam sources, trim/crop/clip persistence, the CDN media library + `/media` proxy. |
| 10 | [[10-research/INDEX\|Research]] | The render-fork + param-graph decisions and the labs-parity audit (archived, drove the parity waves). |
| 11 | [[11-persistence/INDEX\|Persistence]] | The whole-document draft autosave, the `.json` project file, the saved-preset library, global settings + theme — one map of every storage key. |
| 12 | [[12-mobile/INDEX\|Mobile & Tablet]] | The touch-device generative chrome — the capability gate, the tabbed overlay, the touch-size control system, aspect/Fill, and the tablet + desktop escape hatches. |

Repo machinery (build/deploy/packaging) lives in the sibling [[../operations/INDEX|operations]] section, not here. Agent state (architecture, context, session logs) lives outside the vault in `.kol/llm-context/`.
