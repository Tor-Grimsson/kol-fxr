---
title: Aspect & @Nx sizing
type: reference
status: active
updated: 2026-07-08
description: The two orthogonal sizing axes — the 7 fixed aspect ratios (short side 1080) plus custom, and the Figma-style @1/2/3x resolution scale, mirroring the shared export-specs convention.
tags:
  - project/kol-fxr
  - domain/export
  - editor/export
aliases:
  - sizing
  - aspect
  - "@Nx"
covers:
  - the 7 aspect presets + custom
  - the @1/2/3x scale multiplier
  - the export-specs convention
sources:
  - src/editor/shell/aspects.js
  - src/editor/shell/panels/EditorFooter.jsx
related:
  - "[[INDEX|export]]"
  - "[[01-pipeline|pipeline]]"
---

# Aspect & @Nx sizing

Two orthogonal axes decide output pixels: **which frame** (aspect preset → real W×H) × **how dense** (`@Nx` scale multiplier).

## Aspect presets

`src/editor/shell/aspects.js` holds 7 fixed ratios plus `custom`. The short side is pinned to **1080** across every preset (the working/export baseline); the long side follows the ratio. Picking a preset sets the canvas's real W×H, which drives both export resolution and the frame ratio. **4:5 is the default frame.** `custom` has no `PRESET_SIZES` entry — its dimensions come from the user's W/H fields and it is not a batch target.

| Preset | W × H (px) | Orientation |
|---|---|---|
| `1:1` | 1080 × 1080 | square |
| `4:5` | 1080 × 1350 | portrait (default) |
| `3:5` | 1080 × 1800 | portrait |
| `9:16` | 1080 × 1920 | portrait |
| `5:4` | 1350 × 1080 | landscape |
| `5:3` | 1800 × 1080 | landscape |
| `16:9` | 1920 × 1080 | landscape |
| `custom` | user W/H | any |

`3:5`, `5:3`, and live real-time Record were added in the 2026-07-08 parity Wave D; `4:5` is the default.

## The @Nx scale

Figma-style resolution multiplier `k ∈ {1, 2, 3}` (`EditorFooter` scale dropdown, label `@Nx · <width>`). It is a pure resolution bump layered on top of the frame's real W×H — final PNG pixels are `canvasW·k × canvasH·k`. **SVG is vector, so scale does not apply.** Only `1/2/3` are honored; any other value falls back to `@1x` (guards the topbar-menu `onClick` case where the event object is the argument).

This mirrors the shared **`export-specs`** convention (the `@Nx` model + social aspect table, kept in lockstep with `bin/img-canvas.sh`, short side 1080, `-s` to scale) — that is the canonical sizing spec this editor implements.

> `@Nx` interacts with raster snapshots inside the SVG: 2D loops and video frames must bake at `k×` so they stay crisp when the whole SVG scales. That threading (`rasterScale`) is a parity concern — see [[06-parity|render / export parity]].
</content>
