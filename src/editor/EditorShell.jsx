import { useEffect, useRef, useState } from 'react'
import { LabeledControlSection, SettingsRow, SettingsSwitch, useDragResize } from '@kolkrabbi/kol-component'
import './styles/kol-editor.css'
import { panelsForSlot } from './state/panels'
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

function Rail({ side, panels, resizable }) {
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
      <div className="kol-editor-rail-body">
        {body.map(({ Component }, i) => <Component key={i} />)}
      </div>
      {footer.length > 0 && (
        <div className="kol-editor-rail-footer">
          {footer.map(({ Component }, i) => <Component key={i} />)}
        </div>
      )}
    </aside>
  )
}

export default function EditorShell({ registry }) {
  useLabelColumns()
  const Canvas = registry?.canvas ?? null
  /* The topbar is registry-driven like the rails, defaulting to MenuTop so
   * the compose registry (which declares no topbar) is untouched. Labs mode
   * swaps in its own reduced bar — plan.md Phase 11.4. */
  const Topbar = registry?.topbar ?? MenuTop
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
      <div className="kol-editor-grid">
        <Rail side="left"  panels={registry?.panels} resizable={registry?.resizableRails} />
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
        <Rail side="right" panels={registry?.panels} resizable={registry?.resizableRails} />
      </div>
      <ShortcutsOverlay />
      <SettingsDrawerHost />
    </div>
  )
}
