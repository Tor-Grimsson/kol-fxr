---
title: kol-fxr — Overview
type: index
status: active
updated: 2026-10-08
description: The front door to the kol-fxr vault — what the app is, the stack it runs on, how it ships, its mental model, and a map to every section.
tags:
  - project/kol-fxr
  - domain/architecture
  - editor/compositor
  - editor/packaging
aliases:
  - overview
  - kol-fxr
  - readme
related:
  - "[[01-hierarchy/INDEX|hierarchy]]"
  - "[[02-layers/INDEX|layers]]"
  - "[[03-generative/INDEX|generative]]"
  - "[[04-effects/INDEX|effects]]"
  - "[[05-parameters-binding/INDEX|parameters-binding]]"
  - "[[06-camera-motion/INDEX|camera-motion]]"
  - "[[07-type-family/INDEX|type-family]]"
  - "[[08-export/INDEX|export]]"
  - "[[09-media/INDEX|media]]"
  - "[[10-research/INDEX|research]]"
---

# kol-fxr — Overview

**kol-fxr is the canonical Kolkrabbi vector + generative design editor** — a browser-based compositor where you build a canvas out of stacked layers (shapes, patterns, photos, type, generative loops) and modulate their parameters live. It is the single home that consolidates the scattered `kol-editors/*` prototypes into one codebase, and it ships as a standalone app on Vercel, with a small Cloudflare Worker beside it for the saved-file sync. This page is the map; every subsystem has its own section, linked below.

This vault (`docs/documentation/`) is the human-readable documentation. Agent state and decision records live separately under `.kol/llm-context/` (`ARCHITECTURE.md`, `AGENT-CONTEXT.md`, `history.md`, session logs).

## What it is

| Fact | Detail |
|---|---|
| **Role** | The one canonical Kolkrabbi vector/shape + generative editor. New editor work lands here — not in a new repo (ARCHITECTURE §1). |
| **Render engine** | A **DOM/SVG compositor** — layers are DOM/SVG nodes and canvases, not a single retained-mode canvas engine. **It is NOT Konva** (ARCHITECTURE §4); that engine question is settled. |
| **Consolidation** | Absorbs the ~5 half-finished prototypes under `kol-apparat/kol-editors/` (`kol-cl-edr`, `kol-draw-3d`, `kol-editor`, `kol-radar`). Those are harvest sources, then retired — not parallel codebases (§1). |
| **Neutral core + brand layer** | A general-purpose editor; the Kolkrabbi brand identity (currently the color pool feeding palette mode) is a layer on top, not a fork and not baked into core (§3). |

## Tech stack

| Piece | Choice |
|---|---|
| **Framework** | React 19 |
| **Bundler** | Vite (`vite.config.js` app · `vite.lib.config.js` library) |
| **Styling** | Tailwind 4 (`@tailwindcss/vite`) |
| **Package manager** | pnpm |
| **Design system** | Consumes the published `@kolkrabbi/kol-*` packages (`kol-component`, `kol-framework`, `kol-loader`, `kol-theme`) as a **normal external npm consumer** — no workspace linking, no symlinks (§2). DS updates arrive via version bumps, which also validates the published DS. |
| **Notable deps** | `paper` (vector geometry), `opentype.js` (glyph outlines), `three` + `pixi.js`/`pixi-filters` (GL/GPU effects), `d3-delaunay`/`d3-force`, `simplex-noise`, `colord`. |

## How it ships

The editor is this repo's own source (`src/index.jsx` and below). From 2026-09-03 to 2026-10-08 it lived in kol-ds-ui as `@kolkrabbi/design-editor` and came back here as a dependency; on 2026-10-08 the source returned (plan 06) and nothing is published from either side for this app.

| | **standalone app** | **library sync API** |
|---|---|---|
| **Target** | Vercel — `fxr.kolkrabbi.io` | Cloudflare Worker `kol-fxr-api` — `fxr-api.kolkrabbi.io` |
| **Entry** | `src/main.jsx` → `src/App.jsx` → the router: `AppLayout` (kol-shell's `AppHub`) over Home · Library · Settings and the three chromes; `/output` outside it | `api/src/index.js` over D1 `kol-fxr` |
| **Build** | `pnpm build` (`vite.config.js`) | `pnpm api:deploy` (`api/wrangler.toml`) |
| **Reaches the other** | only when `VITE_FXR_API` names the API and the user signs in from the rail | — |

`vite.lib.config.js`, `build:lib` and `src/index.lib.css` are the embeddable build's and are vestigial for this app.

**`mediaProxyBase` is load-bearing.** The media CDN (`media.kolkrabbi.io`) sends no CORS headers, so a cross-origin media load taints the canvas and breaks photo filters + export. Both modes proxy `/media/*` same-origin — the app via `vite.config.js` (dev) and `vercel.json` (prod), an embedder by standing up its own rewrite and passing its path to `<DesignEditor mediaProxyBase />`.

## Mental model

The whole app is one idea repeated at different scales:

- **Canvas / frame + layers.** A frame (sized, themeable fill, optional infinite backdrop + rulers/guides) holds an ordered, nestable stack of layers. Layer state, boolean/reparent/flatten ops live in `src/editor/compose/state.jsx`.
- **Content hierarchy: METHOD > TYPE > CATEGORY > PRESET.** Every generative family, effect, and modulation source sits at a fixed depth so hundreds of presets never feel like hundreds of anything — each step is one short list. This is the structural backbone; see [[01-hierarchy/INDEX|hierarchy]].
- **Layer types.** `background` · `pattern` · `photo` · `shape` · `text` · `path` · `bool` (non-destructive booleans) · `group` · `loop` (generative) · `kinetic` (type) · `misc` (Para Type). See [[02-layers/INDEX|layers]].
- **Additive systems.** Generative catalogs, effects/filter chains, parameter binding, and export are layered on top of the vector base — never baked into core, so each grows independently. See [[03-generative/INDEX|generative]], [[04-effects/INDEX|effects]], [[05-parameters-binding/INDEX|parameters-binding]], [[08-export/INDEX|export]].

## Repo layout (post-migration)

Converged onto the `.kol/` convention (2026-07-08) — agent machinery hidden, `docs/` a pure documentation vault.

| Path | Holds |
|---|---|
| `.kol/llm-context/` | Agent state: `ARCHITECTURE.md`, `AGENT-CONTEXT.md`, `history.md`, `plan.md`, `session-log/`, `session-bridge/`. |
| `.kol/docs-framework/` | The kol-docs spec every doc in this vault conforms to (conventions, archetypes, tags). |
| `docs/documentation/` | **This vault** — the numbered human-readable sections below. |
| `src/` | Application source (see the key-files table). |
| `api/` | The D1 Worker — `wrangler.toml`, `schema.sql`, `src/index.js`; `.dev.vars` (gitignored) holds the local secret. |
| root | `LLM_RULES.md` (boot pointer), `vite.config.js`, `vite.lib.config.js` (vestigial), `package.json`. |

## The sections

| Section | What it covers |
|---|---|
| **00-overview** | This page — what the app is, stack, ship modes, mental model, the map. |
| [[01-hierarchy/INDEX|hierarchy]] | The METHOD > TYPE > CATEGORY > PRESET content model — the structural backbone. |
| [[02-layers/INDEX|layers]] | The layer types and the layer state / nesting / boolean model. |
| [[03-generative/INDEX|generative]] | Generative families and presets (the `loops/taxonomy.js` catalogs). |
| [[04-effects/INDEX|effects]] | Filter chains (`layer.filters[]`) and the lazy Pixi GPU filter tier. |
| [[05-parameters-binding/INDEX|parameters-binding]] | Parameters and modulation binding — time, mouse, layer, audio, MIDI, LFO, gamepad, expression. |
| [[06-camera-motion/INDEX|camera-motion]] | Camera, keyframes, transport, and motion. |
| [[07-type-family/INDEX|type-family]] | The type family — text, kinetic type, and Para Type (misc). |
| [[08-export/INDEX|export]] | Export — aspect/@Nx sizing, PNG/SVG/webm, batch multi-size zip. |
| [[09-media/INDEX|media]] | Media library, webcam, OS drag-drop, and clip persistence. |
| [[10-research/INDEX|research]] | RFCs and decision history (render-fork, param-graph, engine call). |

## Key source files

Where to start reading, per subsystem (full table in `.kol/llm-context/AGENT-CONTEXT.md`):

| File | Role |
|---|---|
| `src/App.jsx` | Standalone host — gates `?view=output` / `?view=desktop` / `?view=mobile`, touch-primary → `MobileView`, else `<Editor/>`. |
| `src/editor/mobile/` | Mobile generative chrome — `MobileView` (entry/category/live screens over the `OutputStage`), `MobileOverlay` (scoped rolls, download, hide-UI), `device.js` (coarse-pointer gate + tablet desktop opt-in). |
| `src/index.jsx` | The editor's entry — `DesignEditor`, the chromes, and every export the app's pages import (`./index.jsx`, not a package). |
| `src/AppLayout.jsx` | kol-shell's `AppHub`: the rail (labs' rows spliced under Labs, Sign in above Settings), Home (chromes signed out, your files signed in), Settings. |
| `src/editor/library/` | The saved library — `LibraryProvider`, the Files dialog, the D1 sync (`libraryApi`, `mergeRemote`, `libraryOps`), `OpenFromUrl`. |
| `src/editor/morph/` | The Morph tab — a morph file's steps, the two-door picker, the builder (`buildMorph`). |
| `src/components/NewFileDialog.jsx` | New File's four doors — Editor · Labs · Randomiser · Morph. |
| `src/editor/Editor.jsx` | Provider stack (library/tool/compose/palette/pattern/type) + Compose + PaletteModal. |
| `src/loops/taxonomy.js` | `GENERATIVE_TREE` / `MISC_TREE` / `PICKER_TREE` — the TYPE level as data. |
| `src/editor/compose/state.jsx` | Layer state, `LAYER_TYPES`, boolean / reparent / flatten actions. |
| `src/editor/compose/CanvasArea.jsx` | Pointer router — tool gestures + keymap. |
| `src/editor/compose/inspectors/` | Rail surfaces — `LoopPicker`, `KineticPanel`, `TextPanel`, `PatternPanel`, `EffectsPanel`. |
| `src/index.css` | Tailwind import + published DS imports (token/DS wiring). |
