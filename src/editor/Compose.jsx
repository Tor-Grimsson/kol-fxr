import EditorShell from './EditorShell'
import CanvasArea from './compose/CanvasArea'
import { composePanes, composeTabs, useTabContext, WorkspaceEffects } from './shell/panels/tabs'
import ToolStrip from './shell/panels/ToolStrip'
import ActionBar from './shell/panels/ActionBar'
import EditorFooter from './shell/panels/EditorFooter'
import LayerEffectsWindow from './shell/LayerEffectsWindow'
import DocTitle from './shell/DocTitle'
import { pack } from './packs'

/**
 * Compose body — the editor surface. Lived at `src/pages/Compose.jsx` in
 * kol-fxr and was the ONE app-side import the engine reached for; it is the
 * editor's default composition, not a page, so it moved in with the package
 * (2026-09-03). The page-title hook did not come: an embed never owns the
 * host's document.title. File / Canvas / Templates menus live in
 * the topbar (rendered by EditorShell). The head is Affinity's (plan 31 § 2): the ACTIONS in a
 * full-width band under the menus (`ActionBar`), the TOOLS one icon wide at the far left
 * (`ToolStrip`), the canvas header holding only the document title. The rails are the WORKSPACE
 * (plan 31 § 4): `panes` + `tabs` are the defaults, the record decides where each tab sits; the
 * Transport/Output/File footer stays pinned on the left. The palette generator is the Color Modes
 * window mounted by Editor.
 */
/* The timeline dock is the motion pack's slot (editor/packs.js), present only when it is
 * registered. Built at first render, not at import — packs register as their modules load. */
const composeRegistry = () => ({
  canvas: CanvasArea,
  resizableRails: true,
  toolbar: ActionBar,
  useTabContext,
  panes: composePanes,
  tabs: composeTabs(),
  panels: [
    { slot: 'tools',         order: 0,  Component: ToolStrip },
    /* the document's name + zoom, centred above the ruler (spec R1.2, plan 30 § 5) */
    { slot: 'canvas.header', order: 1,  Component: DocTitle },
    { slot: 'left.footer',   order: 0,  Component: EditorFooter },
    ...(pack('motion') ? [{ slot: 'canvas.footer', order: 0, Component: pack('motion').TimelineDock }] : []),
  ],
})
let registry = null

export default function Compose() {
  return (
    <>
      <WorkspaceEffects />
      <LayerEffectsWindow />
      <EditorShell registry={(registry ??= composeRegistry())} />
    </>
  )
}
