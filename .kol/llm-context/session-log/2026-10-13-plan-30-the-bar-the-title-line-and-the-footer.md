# Session: Plan 30 — the bar, the title line and the footer

**Date:** 2026-10-13
**Agent:** kol-fxr (local, MBP)
**Summary:** The user walked plans 28–29 live, with Affinity, macOS and Firefox references. Plan 30 covers the logo, the name (FXR), the menu look, the title line, the footer gate, the canvas handle, pane headers with a saveable workspace, the colour pane and the Swatches tab. It was built and walked. Three DS tickets came back and were adopted (kol-component 0.255.0).

## Changes Made

### Files Modified
- `src/editor/shell/MenuTop.jsx`:
  - The logo is now a button that goes Home.
  - The `FXR` app menu is unchanged.
  - The bar is `h-8` and its triggers are `size="sm"`.
  - Window › Left rail › Transport / Output / File pin the timeline and then open the tab.
  - New Window › Workspace ▸ submenu: Save… · saved workspaces · Reset.
- `src/editor/styles/kol-editor.css`:
  - `.kol-editor-menu` gives the menu panels the reference look: `surface-tertiary`, an `oq-08` hairline, the DS popover shadow, rows in the sans at 13px, full ink, 26px tall.
  - The zoom-chip hide rule now keys off `.kol-editor-doctitle`.
  - New `.kol-pane*` rules: collapsed panes and the drop line.
  - Chips in pane headers sit 6px in.
- `src/AppLayout.jsx` · `index.html` · `public/manifest.webmanifest` · `src/editor/mobile/MobileView.jsx` — Effexor FXR → **FXR** (user ruling).
- `src/editor/shell/StatusBar.jsx` → `src/editor/shell/DocTitle.jsx` — a centred, read-only `Untitled* @ 100%` line in `canvas.header` order 1, with no button.
- `src/editor/Compose.jsx` — registers DocTitle; body panes get ids (`color` · `layers` · `selection`).
- `src/editor/shell/panels/EditorFooter.jsx` — in the editor the footer renders nothing until `useTimelineUp()`; the batch modal and the bake overlay are hoisted out of the strip.
- `src/editor/compose/CanvasArea.jsx` — `FRAME_EDGE` 16; a press on the frame's ratio label (with 8px slop) selects the canvas.
- `src/editor/state/workspace.js` (new) — the workspace record (`kol.editor.workspace`) and saved sets (`kol.editor.workspaces`), `movePane`, `toggleCollapsed`, and the grip drag (`startPaneDrag`).
- `src/editor/shell/panels/PaneHeader.jsx` (new) — grip · DS `TabChips` · trailing slot · `⌄` collapse; replaces `TabsRow` in the Layers, Color and Selection panes.
- `src/editor/EditorShell.jsx` — `RailBody` renders panes in the workspace's order, wrapped in `.kol-pane`, with the drop line.
- `src/editor/compose/LayerStack.jsx` · `shell/panels/LayersAssetsPanel.jsx` — Add layer `+` moved to the Layers footer bar (Affinity), because the header had no room at the rail's width.
- `src/editor/color/ColourPanel.jsx` · `ColorModal.jsx`:
  - Opacity is a `Stepper` in the header row.
  - The view picker is a full-width row.
  - The pane sizes to its content, and the SB square is 160 tall.
- `src/editor/color/SwatchesPanel.jsx`:
  - Recent: this session's last 8 picks.
  - Add swatch → a Custom palette (`kol.editor.swatches`).
  - None · Black · Grey · White chips.
  - Square grid.
  - Search.
- `src/editor/shell/panels/ToolPalette.jsx` — `disabled` on each Rotate / Boolean row.
- `package.json` — kol-component 0.252.0 → 0.255.0.
- `.kol/llm-context/audit/2026-10-10-editor-spec.md` — R1.1 · R1.2 · R2.1 · R3.1 · R6.1 amended; `2026-10-10-I-gaps.md` zoom-readout row amended.
- `.kol/llm-plan/30-the-bar-the-title-line-and-the-footer.md` — BUILT.

### Lobby
- Filed to kol-ds-ui, closed and adopted the same day: `SplitToolButtonFoldAlwaysOpens` and `SelectionOverlayLabelUpright` (0.253.0), `SelectionOverlayLabelClearsRotateHandle` (0.255.0).

## Current State

### Working
- The `vite preview` walk passes all 38 checks, dark and light, with 0 console errors. Evidence is in `_tmp/2026-10-13-plan-30-walk/`, along with the playbook `playbook/2026-10-13-plan-30-the-bar-the-title-line-and-the-footer.md`.
- The Rotate fold opens with nothing selected, its rows greyed, in a 191px panel. A rotated layer's size label stays upright and clears the rotate handle at 180°.

### Known Issues
- `.kol-editor-menu` is local CSS; the look is owed to the DS as a `MenuItem` tone once the user settles it.
- Rail widths are not part of a saved workspace (`useDragResize` keeps them itself).
- Clicking a fold's trigger re-runs the last-picked turn (existing DS behaviour) — easy to double-rotate.

## Next Steps
- None from this arc. When the user approves the menu look, file it as a `MenuItem` tone.
