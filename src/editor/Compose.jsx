import EditorShell from './EditorShell'
import CanvasArea from './compose/CanvasArea'
import ColorModal from './color/ColorModal'
import LayersAssetsPanel from './shell/panels/LayersAssetsPanel'
import SelectionPalettePanel from './shell/panels/SelectionPalettePanel'
import ToolPalette from './shell/panels/ToolPalette'
import EditorFooter from './shell/panels/EditorFooter'
import { pack } from './packs'

/**
 * Compose body — the editor surface. Lived at `src/pages/Compose.jsx` in
 * kol-fxr and was the ONE app-side import the engine reached for; it is the
 * editor's default composition, not a page, so it moved in with the package
 * (2026-09-03). The page-title hook did not come: an embed never owns the
 * host's document.title. File / Canvas / Templates menus live in
 * the topbar (rendered by EditorShell). ToolPalette sits above the canvas in
 * the canvas-column header. Left rail: Layers/Assets tab group + the
 * Transport/Output/File footer (pinned). Right rail: Palette/Inspector tab
 * group that auto-flips to Inspector on layer-select. ColorModal here is the
 * per-layer color panel (Stroke/Colour/Swatches); the palette generator is
 * the separate PaletteModal mounted by Editor.
 */
/* The timeline dock is the motion pack's slot (editor/packs.js), present only when it is
 * registered. Built at first render, not at import — packs register as their modules load. */
const composeRegistry = () => ({
  canvas: CanvasArea,
  panels: [
    { slot: 'canvas.header', order: 0,  Component: ToolPalette },
    { slot: 'left.body',     order: -1, Component: ColorModal },
    { slot: 'left.body',     order: 0,  Component: LayersAssetsPanel },
    { slot: 'left.footer',   order: 0,  Component: EditorFooter },
    { slot: 'right.body',    order: 0,  Component: SelectionPalettePanel },
    ...(pack('motion') ? [{ slot: 'canvas.footer', order: 0, Component: pack('motion').TimelineDock }] : []),
  ],
})
let registry = null

export default function Compose() {
  return <EditorShell registry={(registry ??= composeRegistry())} />
}
