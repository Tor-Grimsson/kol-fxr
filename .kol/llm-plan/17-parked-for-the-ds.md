# Plan — Parked for the DS (fetch locally)

**Status:** FOLDED into plan 19 § 7 (2026-10-08, local) — one list, not two. New DS gaps from a cloud session still land here; a local session folds them forward.
**Origin:** user, 2026-10-08: *"what should go to DS should just go to the parked plan, I'll fetch it there locally later"*

## Open

1. **`LayerStack` has no `onContextMenu`** (the user's 23, audit E5, 2026-10-09). The layer rows take no right-click; the canvas menu carries every layer verb (duplicate · hide · lock · flatten · release · crop · delete) and the rows should open the same list. Ask: `onContextMenu(event, layerId)` on the row (the `MediaTile` / `ContentRow` precedent), nothing else.
2. **`MediaLibrary variant="browse"` — the columns view has no empty state** (audit A11, 2026-10-09). With 0 files the rows/grid views say *No files … yet.* (`MediaLibrary.jsx:685`); the columns view shows three ruled blank columns and only the *0 files · 0 B* count line. The empty line belongs in every view. (kol-fxr's Files dialog opens in columns.)
3. **Browse grid view ignores `thumbnailFor`** (2026-10-09). Columns and rows draw the consumer's thumbnail (`ColumnBrowser` · `FileRow`); the grid's `renderThumb` (`MediaLibraryPages.jsx` ~2856) only knows images and posters, so a store with thumbnails but no `mediaUrl` (kol-fxr's Files: each saved frame carries a webp) shows the kind glyph in grid. Ask: `thumbnailFor?.(o)` first in `renderThumb`.

4. **`LayerStack` footer-actions slot** (spec R2.3, 2026-10-10). Delete · duplicate · group · lock · hide belong under the layers (Figma/Affinity); today the footer holds only the ≥2-selected Group button (`organisms/LayerStack.jsx:423-436`). Ask: `footerActions` render slot.
5. **`Canvas` `showZoomChip` / `showEdge` / `showLabel`** (spec R1.2, item 2). `CanvasFrame` draws the edge and ratio label unconditionally (`organisms/Canvas.jsx:85-99,131-152`) and `PanZoomViewport` always mounts the zoom chip (`:636-646`); a status bar and a preview mode need them off.
6. **`EyedropPick` without the native gate** (spec R6.9, item 12). The button renders only when `'EyeDropper' in window` (`molecules/SwatchControls.jsx:110,139-145`); kol-fxr samples its own canvas and never calls the API, so Firefox users never see the pipette. Ask: `requireNative={false}` or always render when `onPick` is given.
7. **Cuts: `orbit`, `node-select`, `hand`** (spec R9.2). None exist in kol-icons 0.34.0; `shape-torus` (signal) stands in for Orbit meanwhile.
8. **`SelectionOverlay` size label** (walk finding). 10px mono on `rgba(0,0,0,.6)` counter-scaled by zoom (`utilities/SelectionOverlay.jsx:155-165`) renders as a grey block with no readable text at 100% in Chromium.
9. ~~**`SplitToolButton`: last-pick trigger + mixed tool/action items**~~ — not a gap: the installed fold does both (plan 23 built the ten-cell toolbar on it, 2026-10-09).
10. **`InspectorSection pane` title in the eyebrow voice** (spec R4.1, plan 23). The pane title is mono-14 `kol-inspector-pane-title`; kol-fxr wraps it (`src/editor/components/Pane.jsx`) to pass an eyebrow label node. Ask: the pane title IS the eyebrow — then `Pane.jsx` retires.
11. **Preview mode reaches into `CanvasFrame`** (item 2, plan 23). Until #5 lands, `kol-editor.css` hides the frame's border div and label span by descendant selector under `[data-view-mode="preview"]` — fragile against any change to the frame's children.
12. **`useDragResize` grab label says "Resize navigation"** on the editor's two rails (plan 23 R1.4). Ask: an `ariaLabel` option.
13. **Cuts: `link` · `skew` · `history`** (plan 24). The per-corner toggle wears `maximize` (lock already means two things), the skew fields wear letters; a `hand` cut too (the Hand tool wears `direction-cross`).
14. **`SelectionOverlay` ignores skew** (plan 24 § 3). A skewed layer's wireframe stays a rectangle; the overlay needs the layer's skew in its transform.
15. **`PanZoomViewport` has no pan seam** (plan 24 §§ Hand, Navigator). Both pan by dispatching wheel deltas at the stage; a `kol:pan-by` event (the `kol:zoom-at` idiom) would retire that.

## Filed
1. ~~**Step list → kol-component** (plan 14 § 4)~~ — filed 2026-10-09 as kol-ds-ui `StepList`; receipt `lobby/outbox/StepList.md`.
2. ~~**`SegmentedToggle` per-option `disabled`** (plan 14 § 2)~~ — filed 2026-10-09 as kol-ds-ui `SegmentedToggleOptionDisabled`; receipt `lobby/outbox/SegmentedToggleOptionDisabled.md`.
3. ~~**Sunken `SegmentedToggle` keeps an invisible border**~~ — filed 2026-10-09 as kol-ds-ui `SegmentedSunkenNoBorder`; receipt `lobby/outbox/SegmentedSunkenNoBorder.md`.
