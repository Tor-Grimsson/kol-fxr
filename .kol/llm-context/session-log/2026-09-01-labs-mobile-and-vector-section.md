# Session: Labs on mobile, and the VECTOR section

**Date:** 2026-09-01
**Agent:** Grim (Opus 5)
**Summary:** Two kol-apps prototypes (kol-modulator, kol-svg-distress) ported onto the loop contract as a new VECTOR labs method, after the labs catalog was extracted out of `LabsNav` so a phone could offer the same tree.

## Changes Made

### Files Modified
- `src/editor/labs/catalog.js` — **NEW.** The labs catalog as data: `GROUP_ICONS` / `SECTION_ICONS` / `MODE_ICONS` and `buildLabsCatalog(ctx)`, which returns the section→group→category-leaf stream with every pick semantic (effects, rack, generative, kinetic, misc) attached. Extracted verbatim from `LabsNav`.
- `src/editor/labs/LabsNav.jsx` — 380 → 100 lines. Keeps only the carried-source ref and the fold into `railExtras`; re-exports the icon maps for existing importers.
- `src/loops/modulator/{rings.js,presets.js}` — **NEW.** `DialRotation` ported: warped concentric ring pairs, breath `|sin(TAU·u·breaths/2)|`, integer waves per ring, drift in whole turns per loop. 12 params, 6 presets (Pulse ×3 · Weave ×3).
- `src/loops/distress/{engine.js,presets.js}` — **NEW.** `useSvgDistortion`'s bake path ported: parse + arc-length sampling cached per (source, frequency), the 8 mode-offset recipes verbatim per frame, smoothing window, centripetal catmull-rom → `Path2D`. 8 presets in Erosion · Wobble · Print.
- `src/loops/registry.js` — both groups wired (`GROUPS`, `LOOPS`, `PRESETS_BY_GROUP`, `PRESETS`).
- `src/loops/taxonomy.js` — `LEGACY_GROUP_LABELS` entries so the editor inspector resolves them read-only (they are labs-only, out of `GENERATIVE_TREE`/`PICKER_TREE`).
- `src/editor/library/MediaPicker.jsx` — `accept: 'svg'` (SVG is `image/*`, so `'image'` alone could not narrow to vector).
- `src/editor/labs/LabsSourcePicker.jsx` — `svgMode` when the layer is a distress loop: pick/upload land on the flat `svgSrc` param (markup on upload, URL from the library), file input narrows to `.svg`, Camera pane hidden.
- `src/editor/labs/LabsParams.jsx` — `SourceStrip` on the distress generative surface.
- `src/editor/mobile/LabsBrowseScreen.jsx` — **NEW.** The catalog as `EffectScreen`'s two-level sheet; leaves run the catalog's own dispatch.
- `src/editor/mobile/MobileView.jsx` — phone entry card gains a Labs door (in-chrome; tablets keep the routed one, Editor stays tablet-only); `labs` screen state; `active` falls back to the lone surviving layer after `setOnly`'s swap.
- `src/editor/mobile/{CategoryScreen,MobileView}.jsx` — icon imports repointed to `catalog`.
- `docs/documentation/01-hierarchy/INDEX.md` — VECTOR added as the fourth METHOD + its two types.
- `.kol/llm-plan/02-labs-mobile-and-vector.md` — **NEW**, the plan this session executed.

### Features Added/Removed
- **VECTOR — a fourth METHOD in labs.** Distressor + Modulator between Generative and Composition, both rail levels, shipped glyphs only (`pen-nib` · `scribble` · `dashed-circle`).
- **Labs on a phone.** The entry card is a real chrome chooser on every touch device now; picks browse the same catalog the desktop rail renders, so mobile inherited VECTOR for free.

## Current State

### Working — measured in a browser
| | |
|---|---|
| rail parity | 30 rows identical to the pre-extraction baseline; picks dispatch |
| modulator | `?preset=mod-pulse` seeds + animates (frame diff 304); 10 sliders, 10 bind dots |
| distressor | default art animates (diff 344); `frame(0) === frame(1)`; vault `biskup.svg` picked from the library renders distressed (diff 1465) |
| vector section | VECTOR → DISTRESSOR/MODULATOR between GENERATIVE and COMPOSITION; section press opens + expands |
| mobile (390×844, touch-emulated) | entry = Generate · Labs; sheet lists EFFECTS(6)/GENERATIVE(10)/VECTOR(2)/COMPOSITION(3); Modulator→Pulse animates on the phone stage; Halftone→Dither seeds photo+filter and opens the source picker |
| console | 0 errors across every check · `pnpm build` green |

### Known Issues
- **`getTotalLength()` throws `InvalidStateError` on detached `circle`/`rect`/`ellipse`/`line`** — only `<path>` computes detached. The source app's try/catch silently dropped every non-path shape; the engine attaches the parsed SVG off-screen for the sampling pass, so it distresses shapes the original could not. Do not "simplify" that host div away.
- Distress SVG re-sourcing is not reachable on mobile (default art only) — deliberate v1 gap.
- Modulation is filtered out of the mobile sheet: its entry points are the params rail's bind dots, which mobile does not render.
- Distress geometry sampling is Chromium-verified only; Firefox's detached/attached SVG geometry behaviour is unchecked.
- `RefinePage` (1,349 ln per-node refinement) deliberately not ported — editor-tier, later.

## Next Steps
1. **Real-device pass** — the mobile labs chrome was verified under touch emulation, not on hardware.
2. Decide whether the distressor should reach SVG sourcing on mobile, or stay generative-only there.
3. Mint real VECTOR glyphs at kol-icons if the section settles (currently borrowing `pen-nib` / `scribble` / `dashed-circle`).
4. Still outstanding from before: `OneGrabGestureBothRails` shipped (shell 0.30.0) but the both-edges check was never run; `SunkenWellEatenByPageWash` is upstream's.
