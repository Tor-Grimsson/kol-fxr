# FloatTimeline — the float style's timeline panel, in design-editor

**Staged:** 2026-11-04 · from kol-ds-ui (plan `.kol/llm-context/plan-2026-11-04-float-everything.md` § W12; the float gap map in Figma, kol-float--style `XY6adCImPaxDuHDO6OdUw9`, board W2.12 node `47:8853`, inventory rows 162–167)
**User:** *"I want a plan that just rams through everything"* — the whole float style is being built in the DS; the timeline is the one piece whose home is the editor, and the editor is developed in kol-fxr (ARCHITECTURE §3, 2026-10-08), so it is yours, not built here.

## Context

The float exploration (proxy--components, now mirrored into kol-float--style `_source`) draws the editor's timeline as a float panel. Nothing in KOL has it. The DS has shipped the float foundations it sits on — kol-theme 0.211.0: `--kol-float-menu-r` 20 (a sheet/panel), `--kol-float-list-r` 8, `--kol-float-window-r` 28, `--kol-float-focus` (2px ring), `--kol-fg-16` selection, `--kol-font-family-float` = Inter with the `kol-float-*` type roles (`kol-float-timecode` 12 mono · `kol-float-ruler` 10 mono · `kol-float-label` 11 · `kol-float-panel` 13/500). Build on those tokens, not on local values.

The exploration pieces (page `_source`, id `2:7`, in kol-float--style — screenshot them with `get_screenshot`, measure with `get_design_context`):

| # | element | what | node |
|---|---|---|---|
| 162 | Timeline panel | the float panel: toolbar · ruler · tracks · playhead, 1472 × 222, sheet radius | `9:8597` |
| 163 | Timeline toolbar | `Scene 01 · 5 layers · +` left, `Keyframes · ⟲ · ⎯ · 100% · ⤢` right | `9:8598` |
| 164 | Time ruler | `LAYERS ⌘L` gutter, `00s … 12s` seconds in `kol-float-ruler` | `9:8610` |
| 165 | Layer track | a 25 row: label gutter (icon · name · eye · lock) + lane | `9:8629` |
| 166 | Track lane | keyframe diamonds on a property lane · a clip bar with its name · an audio waveform | `9:8635` · `9:8648` · `9:8675` |
| 167 | Playhead | the current-time marker `04:12` down the tracks | `9:8789` |

The same panel on glass (Cool / Chromatic studies, `9:7434` · `9:7790`) is the skin only — ignore the effects, build the solid one on `surface="solid"` the way AppFloatNav takes `surface`.

## Ask

A `Timeline` in design-editor (kol-fxr's `src/`, mirrored back to `packages/design-editor` here afterwards as usual): the panel above as one component with `toolbar` · `ruler` · `tracks` (a `LayerTrack` per layer, its `lane` taking keyframes, a clip or a waveform) · `playhead`, driven by the editor's `createTransport()` clock (kol-hardware 0.8.0+, the TransportFromHardware receipt). Float look from the DS tokens; Inter for labels, mono for time.

## Acceptance

- The editor's timeline renders as the W2.12 pieces: 222 tall, sheet radius 20, toolbar 24, ruler 15, tracks 25 each, playhead a 1px line with the `04:12` cap; Inter 11/13 labels, mono 10 ruler and 12 timecode.
- A Playwright shot of it beside `get_screenshot` of `9:8597` matches in shape, sizes and type.
- When it ships, the DS flips inventory rows 162–167 on the gap map to `have` (that is the remainder here) and refreshes `packages/design-editor` from your source.

## Remainder in kol-ds-ui once it ships

Refresh the design-editor mirror from fxr; flip rows 162–167 on the gap map; draw the component in the Figma library.

**Return to:** kol-ds-ui `lobby/outbox/FloatTimeline.md`.

## ⚫ WITHDRAWN — 2026-11-04

Withdrawn by the filer the same day. The user's ruling: *"YOU DONT CHOOSE WHAT TO BUILD … that includes timeline and everything … if you need to update what that means, then you grab the latest version from FXR … nothing in the plan is negotiable."* The DS builds the float timeline itself, in `packages/design-editor`, after refreshing that mirror from fxr's current source. Nothing is owed by kol-fxr.
