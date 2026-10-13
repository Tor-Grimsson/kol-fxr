# Session: Plans 28–29 — the menu bar and the status line, on the spec

**Date:** 2026-10-13
**Agent:** kol-fxr (local, MBP)
**Summary:** The editor's top bar follows Affinity's conventions. The status bar is read-only, the Navigator is a left-rail tab, Color has a view dropdown again and Tools holds creation. The audit spec now matches the build. Four DS asks went out, came back as kol-component 0.252.0 and were adopted. The Morph step picker has categories.

## Changes Made

### Files Modified
- `src/editor/shell/MenuTop.jsx` — rebuilt:
  - The bar is `[logo] Effexor FXR File Edit Layer Text Vector Tools View Window Help`, left-aligned, with no carets and no cog.
  - The logo is a 16px inert mark.
  - The app-name menu holds Home · Chromes ▸ · Settings….
  - Tools holds Generative · Pattern · Type · Effects · Insert image.
  - Layer holds edit verbs only.
  - Submenus are DS `MenuDropdownNest flyout`.
  - Rows dispatch `kol:command`.
  - The editor hides the shell rail (`setNavHidden` on a microtask; `\` brings it back).
- `src/editor/compose/CanvasArea.jsx` — the keymap switch also runs on `kol:command`, so a menu row and its key share every guard. Outside-press treats `.kol-popover-float` as chrome: a press in a portalled menu used to deselect before the row's click landed.
- `src/editor/shell/StatusBar.jsx` + `compose/savedMark.js` (new) — the status bar is read-only, `Untitled @ 100%`. A `*` shows while the layers or the canvas differ from the last save or open. The baseline is taken one frame after mount; save marks it in `buildSavedSpec`.
- `src/editor/shell/NavigatorPanel.jsx` — now a left-rail tab (Layers · Assets · History · Navigator) with a zoom row via `kol:zoom-at`. The canvas fill is the box's background, the snapshot is re-taken at 2 fps, and the frame is held in a 200px stage.
- `src/editor/shell/openTab.js` (new) — the `kol:open-tab` event used by Window › panel rows. It is wired into `LayersAssetsPanel`, `SelectionPalettePanel` and `EditorFooter`.
- `src/editor/params/TimelineDock.jsx` + `params/timelinePinned.js` (new) + `packs/motion.js` — `useTimelineUp()` is the one gate: a track exists, Morph is up, or Window › Timeline is pinned. The motion pack exports it, plus `KINETIC_TREE`/`KINETIC_PRESETS`.
- `src/editor/shell/panels/EditorFooter.jsx` — in the editor, Transport joins Output · File only while the timeline is up; Labs keeps it. It also listens for `kol:open-batch-export`.
- `src/editor/labs/LabsView.jsx` — leaving Labs clears `morph.active`. Before this, the editor showed an empty Morph lane.
- `src/editor/color/ColourPanel.jsx` — one `Dropdown` (Hue · Wheel · HSL · RGB, `ariaLabel="Color view"`) replaces both strips.
- `src/editor/morph/StepPicker.jsx` — the empty query shows Categories (with counts); a click drills in, `← All categories` goes back. The drill rows are `keepOpen`.
- `src/editor/library/FilesDialogHost.jsx` + `state/keymap.js` — the editor gets ⌘S Save and ⇧⌘S Save as….
- `src/editor/shell/panels/ToolPalette.jsx` — listens for `kol:insert-image`.
- `src/editor/compose/AlignmentPanel.jsx` — exports `H_OPTS`/`V_OPTS` for Layer › Align.
- `.kol/llm-context/audit/2026-10-10-editor-spec.md` — R1.1, R1.2, R1.6, R2.1, R2.4 and R3.2 amended. `2026-10-10-I-gaps.md` rows 13 · 20 · 28 · 31 updated.
- `.kol/llm-plan/28-menu-bar.md` is BUILT and carries a superseded-in-part note. `29-the-bar-and-the-status-line.md` is BUILT, and its § 0 table maps every change to a spec rule. Plan 17 #16–19 are filed.
- `package.json` — kol-component 0.252.0.

### Moved to `_tmp/`
- `src/editor/shell/menus/MenuFlyout.jsx` → `_tmp/2026-10-13-menuflyout-retired/` (the DS flyout replaced it).
- Walk evidence: `_tmp/2026-10-13-plan-28-walk/`, `_tmp/2026-10-13-plan-29-walk/`.

### Lobby
- Filed into kol-ds-ui and closed the same day as kol-component 0.252.0, then adopted: `MenuDropdownNestFlyout` · `MenuDropdownItemBlockRow` · `ShellSearchOverlayActionKeepsOpen` · `DropdownAriaLabel`.

## Current State

### Working
- Every menu row was run once on `vite preview`, in light and dark, with 0 console errors. That covers Vector, mask, Eyedropper, Starters, Library, exports, the output window and Settings.
- The status bar `*` appears for a layer, aspect or fill change and clears on Save or ⌘S.

### Known Issues
- Browsers keep ⌘, for themselves, so Settings shows `,`.
- The drafts restore prompt makes every reload open on a dialog. Expected, but walks have to dismiss it.

## Next Steps
- None from this arc.
