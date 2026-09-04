---
_template:
  version: 1
  path: .kol/llm-context/round-trip-inventory.md
  sync: skip
---

# Editor round-trip — what has been processed

**As of 2026-09-03.** The editor itself moved to `kol-ds-ui/packages/design-editor`
(shipping as `@kolkrabbi/design-editor@0.4.2`); this file records how much of it
has actually been through a ticket, and how much has never been looked at.

Source counted from `_tmp/2026-09-03-design-editor-moved-to-ds/` — the shelf copy
of what left this repo.

## The size of the thing

| area | lines | ticketed |
|---|---|---|
| `editor/` (76 `.jsx` files) | 20,997 | 28 files |
| `loops/` — the generative engine | 28,421 | **none** |
| `filters/` — canvas · pixi · gl tiers | 5,194 | **none** |
| `kinetic/` — kinetic type | 1,969 | **none** |
| **total** | **56,581** | ~28 files |

So: **roughly 6,000 of 56,600 lines have been through a ticket.** Everything else
moved across untouched, as-is.

## Processed — the twelve (corrected)

Components the DS had already copied out of this editor. Filed as
`editor-set-is-behind-its-source`; ten were fixed by kol-ds-ui the same day.

| component | fxr source | outcome |
|---|---|---|
| WheelTriangle | `color/SpectrumControls.jsx` | 🟢 ring was 90° off its own handles — fixed |
| SelectionOverlay | `compose/SelectionOverlay.jsx` | 🟢 zoom compensation + rotate handle restored |
| Canvas / PanViewport | `shell/Canvas.jsx` | 🟢 zoom viewport, rulers, guides, `CanvasZoomContext` restored |
| SwatchControls | `color/SwatchControls.jsx` | 🟢 halo ring tokenised |
| PaletteHarmonyWheel | `color/PaletteHarmonyWheel.jsx` | 🟢 per-slot S/L preserved via `slots` |
| ColorInputRow | `compose/SwatchRow.jsx` + `inspectors/ColorField.jsx` | 🟢 `palette:` resolver, Theme, None restored |
| EditorShell | `EditorShell.jsx` | 🟢 resizable rails + footer slots |
| HueStrip · SBSquare · EyedropPick | `color/SpectrumControls.jsx` · `SwatchControls.jsx` | 🟢 parity — the port was AHEAD (pointer events, slider a11y) |
| AlignmentGrid | `compose/AlignmentPanel.jsx` | 🔴 open — momentary press treatment is a design call |
| SplitToolButton | `shell/panels/ToolPalette.jsx` | 🔴 open — DS declined the Dropdown collapse, with reasoning |

**Consumed back into fxr and verified in a browser: five** — the spectrum trio,
the swatch pieces, the harmony wheel, `SwatchRow`→`ColorInputRow`, and
`SelectionOverlay`. They rode into the package when the editor moved.

## Processed — the seventeen (specced)

Filed as `editor-panels-the-held-specs`. Six shipped so far.

| component | lines | state |
|---|---|---|
| NumberField | 34 | 🟢 answered by `Input` |
| XYPad | 73 | 🟢 shipped |
| InspectorRail | 72 | 🟢 shipped |
| PathNodeOverlay · CropOverlay | 474 | 🟢 shipped (the overlay family) |
| LayerStack | 583 | 🟢 shipped |
| TimelineDock | 259 | 🟢 shipped, kol-component 0.199.0 (transport stays app-side) |
| TextPanel + ParatypeTools | 558 | ⏳ next |
| CurveEditor | 194 | ⏳ next |
| KeyframeEditor | 117 | ⏳ next |
| AutoControls · ModulationEditor · rolls · BindDot · controlSize | 991 | ⏳ last — needs a param-schema ruling first |
| ToolPalette | 405 | 🔴 blocked on the fold question |
| transport | 141 | stays app-side by ruling |

## NOT processed — nothing has looked at these

### The engine — 35,584 lines, zero tickets

`loops/` · `filters/` · `kinetic/`. This is the largest untouched mass by an
order of magnitude, and it is **the answer to "what is the overlap with labs and
the generator"**: there is no overlap to resolve, because they are the same code.
The generator IS `loops/`. Labs is a second chrome that renders the same registry.
The editor renders it too, as loop layers. One engine, three front-ends.

### Editor components — ~48 files, never specced

The heavy ones, none of which appear on any ticket:

| component | lines | what it is |
|---|---|---|
| `compose/LayerRenderer.jsx` | 1,967 | the compositor — every layer type's render path |
| `compose/state.jsx` | 1,959 | the store: layers, history, selection, palette |
| `compose/CanvasArea.jsx` | 1,597 | the pointer router — drag, marquee, resize, rotate |
| `compose/inspectors/LayerInspector.jsx` | 693 | the per-type inspector |
| `compose/inspectors/KineticPanel.jsx` | 671 | kinetic type controls |
| `compose/inspectors/ParametersPanel.jsx` | 668 | the loop parameter surface |
| `compose/inspectors/EffectsPanel.jsx` | 492 | the filter chain UI |
| `shell/MenuTop.jsx` | 459 | the menubar |
| `library/LibraryProvider.jsx` | 384 | saved presets + drafts |
| `shell/panels/EditorFooter.jsx` | 368 | transport · output · file strip |
| `library/MediaPicker.jsx` | 301 | the three-store media browser |
| `compose/inspectors/SoftformsLayers.jsx` | 295 | softforms |
| `compose/KineticElementOverlay.jsx` | 262 | per-element kinetic editing chrome |
| `compose/SoftformsHandleOverlay.jsx` | 221 | softforms handles |
| `modes/pattern/*` · `modes/type/*` | ~850 | the pattern and type mode machinery |

Plus the chrome that is app-shaped by nature and probably should never be a DS
component: `labs/*` (1,354), `mobile/*` (799), `BatchExportModal`, `ColorModal`,
`PanelTabs`, `ShortcutsOverlay`.

## So: what is next

1. **The user's ruling on `editor-pin-is-30-versions-back`** — this repo's only
   inbox entry, still 🔵. Every ask on it is answered by events and superseded by
   the move; it needs a state, and states are the user's call.
2. **AlignmentGrid's press treatment** — the one open design question.
3. **The engine has never been examined.** 35,584 lines went across as-is. Whether
   any of it should be DS-tier is a question nobody has asked yet.
4. Adoption of the six shipped components now happens **inside the package**, in
   kol-ds-ui's tree. fxr has no editor source left to adopt them into.
