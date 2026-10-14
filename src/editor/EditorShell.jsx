import { useEffect, useRef, useState } from 'react'
import { Button, LabeledControlSection, SettingsRow, SettingsSwitch, useDragResize } from '@kolkrabbi/kol-component'
import './styles/kol-editor.css'
import { panelsForSlot } from './state/panels'
import { seedWorkspace, useWorkspace } from './state/workspace'
import { PaneContext } from './shell/panels/PaneHeader'
import Pane from './shell/panels/Pane'
import { useComposeState } from './compose/state'
import { DisplaySettingsDrawer } from '../settings/AppSettings'
import MenuTop from './shell/MenuTop'
import ShortcutsOverlay from './shell/ShortcutsOverlay'
import { useLabelColumns } from './params/controlSize'

/**
 * The settings drawer lives HERE, not in MenuTop — every chrome renders
 * EditorShell (Compose, Labs, the Randomiser) but only the editor renders that
 * top bar, so a drawer bound there answered `,` on one route out of three
 * (user, 2026-08-28: "it should just open whatever settings are available at
 * any point"). The editor's gear now dispatches `kol:open-settings` rather
 * than owning the state.
 *
 * `,` is declared in keymap.js as `passive` — the cheat sheet lists it, this
 * binds it — and read back through `matchCombo` so the key is written once.
 */
function SettingsDrawerHost() {
  const [open, setOpen] = useState(false)
  const { showGrid, toggleGrid } = useComposeState()

  /* NO KEY IS BOUND HERE. AppLayout owns `,` for every route and fires
     `kol:open-settings`; `preventDefault()` tells it a chrome took it, so it
     does not also navigate to the /settings page. One listener, one key. */
  useEffect(() => {
    const onOpen = (e) => { e.preventDefault?.(); setOpen((v) => !v) }
    window.addEventListener('kol:open-settings', onOpen)
    return () => window.removeEventListener('kol:open-settings', onOpen)
  }, [])

  return (
    <DisplaySettingsDrawer open={open} onClose={() => setOpen(false)}>
      {/* Show grid is COMPOSE state, not an app default, so it rides the
          drawer's host slot rather than the shared sections. */}
      <LabeledControlSection label="Canvas" divided>
        <SettingsRow label="Show grid">
          <SettingsSwitch label="Show grid" on={showGrid} onChange={toggleGrid} />
        </SettingsRow>
      </LabeledControlSection>
    </DisplaySettingsDrawer>
  )
}

/**
 * EditorShell — topbar + two-rail + canvas host.
 *
 *   ┌──────────────── EditorTopbar ────────────────┐
 *   │ Frame title       File ▼ Canvas ▼ Templates ▼ │
 *   └──────────────────────────────────────────────┘
 *   ┌─ left ─┬───── canvas ─────┬─ right ─┐
 *   │ Layers │                  │ Palette │
 *   │        │                  │ Tool    │
 *   └────────┴──────────────────┴─────────┘
 *
 * Topbar holds the file/canvas/templates menus that used to be the
 * left.header FrameHeaderPanel + AspectInspector frame slot + left.body
 * LibraryTab. Rails now host only context-for-selection panels.
 */

/* A rail's grab edge (spec R1.4): the shell rail's own gesture — drag to resize, click to fold
 * to its closed width, state kept per rail. Its own token per side, so the two rails never drag
 * one variable (`--kol-editor-left-w` / `--kol-editor-right-w`, declared in kol-editor.css). */
function RailGrab({ side, railRef }) {
  const { grabProps } = useDragResize(railRef, { token: `kol-editor-${side}`, side: side === 'left' ? 'left' : 'right' })
  return <div {...grabProps} />
}

/* THE WORKSPACE'S RAIL BODY (plan 30 § 9 → plan 31 § 6): the record's panes, in order, each a `Pane`
 * over whatever tabs sit in it — wrapped so its header's grip and chips know which pane they are,
 * carrying its collapse and its dragged height; the drop line shows where a dragged pane or tab
 * will land between panes (a drop INTO a pane rings its header). Slot panels keep their slot. */
function RailBody({ side, panels, ctx }) {
  const { ws, over } = useWorkspace()
  const loose = panelsForSlot(panels, `${side}.body`)
  const panes = ws[side] ?? []
  const line = (i) => over?.side === side && over.pane == null && over.index === i && <div key={`drop-${i}`} className="kol-pane-drop" aria-hidden />
  return (
    <div className="kol-editor-rail-body" data-rail-side={side}>
      {panes.map((p, i) => [
        line(i),
        <div key={p.id} className="kol-pane" data-pane-id={p.id}
          data-collapsed={ws.collapsed[p.id] ? 'true' : undefined}
          data-sized={ws.heights[p.id] ? 'true' : undefined}
          data-last={i === panes.length - 1 ? 'true' : undefined}
          style={ws.heights[p.id] ? { height: ws.heights[p.id], flex: '0 0 auto' } : undefined}>
          <PaneContext.Provider value={p.id}><Pane pane={p} ctx={ctx} /></PaneContext.Provider>
        </div>,
      ])}
      {line(panes.length)}
      {loose.map(({ Component }, i) => <Component key={`loose-${i}`} />)}
    </div>
  )
}

/* the chip that follows the pointer while a tab drags (plan 31 § 5) */
function TabGhost() {
  const { drag } = useWorkspace()
  if (!drag) return null
  return (
    <div className="fixed z-[var(--kol-z-tooltip)] pointer-events-none" style={{ left: drag.x + 8, top: drag.y - 12 }} aria-hidden>
      <Button variant="tab" size="sm" pressed>{drag.label}</Button>
    </div>
  )
}

function Rail({ side, panels, resizable, workspace, ctx }) {
  const ref = useRef(null)
  const header = panelsForSlot(panels, `${side}.header`)
  const body   = panelsForSlot(panels, `${side}.body`)
  const footer = panelsForSlot(panels, `${side}.footer`)
  return (
    <aside ref={ref} className={`kol-editor-${side}`}>
      {resizable && <RailGrab side={side} railRef={ref} />}
      {header.length > 0 && (
        <div className="kol-editor-rail-header">
          {header.map(({ Component }, i) => <Component key={i} />)}
        </div>
      )}
      {workspace ? <RailBody side={side} panels={panels} ctx={ctx} /> : (
        <div className="kol-editor-rail-body">
          {body.map(({ Component }, i) => <Component key={i} />)}
        </div>
      )}
      {footer.length > 0 && (
        <div className="kol-editor-rail-footer">
          {footer.map(({ Component }, i) => <Component key={i} />)}
        </div>
      )}
    </aside>
  )
}

const NO_CTX = {}
const useNoCtx = () => NO_CTX

export default function EditorShell({ registry }) {
  useLabelColumns()
  seedWorkspace(registry?.panes ?? [], registry?.tabs ?? [])
  const workspace = (registry?.tabs ?? []).length > 0
  /* what the tabs' `when` gates read (the compose registry's hook; labs has none) */
  const ctx = (registry?.useTabContext ?? useNoCtx)()
  const Canvas = registry?.canvas ?? null
  /* The topbar is registry-driven like the rails, defaulting to MenuTop so
   * the compose registry (which declares no topbar) is untouched. Labs mode
   * swaps in its own reduced bar — plan.md Phase 11.4. */
  const Topbar = registry?.topbar ?? MenuTop
  /* THE HEAD (plan 31 § 2; Affinity's): the menu bar, then a full-width band for the ACTIONS
   * (`registry.toolbar`), then the columns — the TOOLS one icon wide at the far left (slot `tools`),
   * the rails, the canvas. Labs declares neither and keeps its chrome. */
  const Toolbar = registry?.toolbar ?? null
  const tools = panelsForSlot(registry?.panels, 'tools')
  const canvasHeader = panelsForSlot(registry?.panels, 'canvas.header')
  const canvasFooter = panelsForSlot(registry?.panels, 'canvas.footer')
  /* `canvas.overlay` floats OVER the canvas (plan 15 § 2 — the phone's play button); the main is
     the containing block, so an overlay rides the canvas region, not the viewport */
  const canvasOverlay = panelsForSlot(registry?.panels, 'canvas.overlay')
  /* `data-editor-keep-selection` is the single marker the document-level
   * click-away handler in CanvasArea checks. Anything inside the shell
   * keeps selection on click; anything outside (sidenav, browser chrome)
   * deselects. New rails / panels don't need to update CanvasArea — being
   * inside the shell is sufficient. */
  return (
    <div className="kol-editor-shell" data-editor-keep-selection>
      <Topbar />
      {Toolbar && (
        <div className="kol-editor-toolbar flex items-center h-10 px-2 bg-surface-tertiary border-b border-oq-08 shrink-0">
          <Toolbar />
        </div>
      )}
      <div className="kol-editor-grid" data-tools={tools.length ? 'true' : undefined}>
        {tools.length > 0 && (
          <aside className="kol-editor-tools flex flex-col items-center min-h-0">
            {tools.map(({ Component }, i) => <Component key={i} />)}
          </aside>
        )}
        <Rail side="left"  panels={registry?.panels} resizable={registry?.resizableRails} workspace={workspace} ctx={ctx} />
        <div className="kol-editor-canvas-column">
          {canvasHeader.length > 0 && (
            <div className="kol-editor-canvas-header">
              {canvasHeader.map(({ Component }, i) => <Component key={i} />)}
            </div>
          )}
          <main className="kol-editor-canvas" style={canvasOverlay.length ? { position: 'relative' } : undefined}>
            {Canvas ? <Canvas /> : null}
            {canvasOverlay.map(({ Component }, i) => <Component key={i} />)}
          </main>
          {canvasFooter.length > 0 && (
            <div className="kol-editor-canvas-footer">
              {canvasFooter.map(({ Component }, i) => <Component key={i} />)}
            </div>
          )}
        </div>
        <Rail side="right" panels={registry?.panels} resizable={registry?.resizableRails} workspace={workspace} ctx={ctx} />
      </div>
      <TabGhost />
      <ShortcutsOverlay />
      <SettingsDrawerHost />
    </div>
  )
}
