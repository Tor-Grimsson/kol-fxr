import '../styles/kol-labs.css'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { EditorProviders } from '../Editor'
import EditorShell from '../EditorShell'
import { useFps } from '../shell/Canvas'
import { OutputCanvas } from '../OutputView'
import { useComposeState } from '../compose/state'
import { useTool } from '../state/tools'
import { useGlobalShortcuts } from '../state/useGlobalShortcuts'
import EditorFooter from '../shell/panels/EditorFooter'
import TimelineDock from '../params/TimelineDock'
import { useDragResize } from '@kolkrabbi/kol-framework'
import LabsNav from './LabsNav'
import LabsParams from './LabsParams'
import LabsShortcuts from './LabsShortcuts'
import LabsSourcePicker from './LabsSourcePicker'
import { transport } from '../params/transport'
import { getAppSettings } from '../lib/appSettings'
import { groupOfPreset, presetById, presetLayerPatch } from '../../loops/registry'
import { useLabsLayer } from './useLabsLayer'
import { isMobileDevice, wantsDesktop } from '../mobile/device'
import { ControlSizeContext } from '../params/controlSize'

/**
 * LabsView — the labs chrome (plan.md Phase 11), mounted at `?view=labs`.
 *
 * Not a reduced editor: the SAME capability (effects · generative ·
 * modulation) on a standardized output, with the compositor UI dropped —
 * no layer stack, no frames, no canvas placement, no tool palette. One
 * thing on screen, its params, its effect chain, its modulation, transport.
 * Labs' shape (labs.kolkrabbi.io), this editor's engine.
 *
 * It is a second REGISTRY over the shared `EditorShell`, not a second app:
 *
 *   (no topbar — retired 2026-08-27; see NoTopbar below)
 *   ├─ nav ─┬──── OutputCanvas ────┬─ rail ─┤  nav  = LabsNav (categories)
 *   │ cats  │                      │ params │  rail = Parameters · Effects
 *   ├───────┴──── TimelineDock ────┴────────┤
 *   └ EditorFooter (transport/output/file)  ┘
 *
 * The load-bearing trick: the document holds exactly ONE layer and it stays
 * selected, so every selection-driven inspector works verbatim (they all
 * resolve their subject from `selectedId`). See `./useLabsLayer`.
 */

/* The canvas cell. `OutputCanvas` (not `OutputStage`) — the stage's
 * viewport-fixed black backdrop is for full-screen recording surfaces and
 * would cover the rails here; the cell carries the editor's own themed
 * backdrop token instead, so it flips with light/dark.
 *
 * An effect picked before any media has a photo layer with no `src` and
 * nothing to show, so the cell hands over to the two-pane source picker —
 * labs' own empty state (e.g. /radar/ascii). */
/* Fit-with-margin — the reference's resting frame size; zoom 1 = this. */
const LABS_FIT = 0.85
const ZOOM_MIN = 0.3
const ZOOM_MAX = 2.5
/* Bare digits jump to sizes; 0 is the default (fit). */
const ZOOM_KEYS = { 0: 1, 1: 0.5, 2: 1, 3: 1.5, 4: 2 }
const chipCls = 'px-2 py-1 rounded border border-fg-08 bg-surface-secondary kol-mono-12 text-emphasis tabular-nums'

function LabsStage() {
  const { layer } = useLabsLayer()
  const needsSource = layer?.type === 'photo' && !layer.src && layer.srcType !== 'webcam'

  /* Labs' frame doesn't fill the cell — it floats at a zoom the user drives.
   * Zoom is relative to the fit (1 = 100% = the reference margin): wheel
   * steps it, digits jump (ZOOM_KEYS), double-click and the % chip reset.
   * Corner chips = the editor's canvas-corner pattern (Canvas.jsx), fps
   * chip toggled by F, measured only while shown. */
  const [zoom, setZoom] = useState(1)
  const [showFps, setShowFps] = useState(false)
  const fps = useFps(showFps)
  const cellRef = useRef(null)
  const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
  const step = (dir) => setZoom((z) => clampZoom(z * (dir > 0 ? 1.25 : 0.8)))

  /* Orbit owns the wheel while armed — the camera rig zooms over the frame
   * (its own listener) and stage-zooming from the margin mid-orbit would
   * read as the camera jumping. Chips and digit keys keep working. */
  const { tool } = useTool()
  const orbitArmed = tool === 'orbit'
  const orbitRef = useRef(orbitArmed)
  orbitRef.current = orbitArmed

  useEffect(() => {
    const el = cellRef.current
    if (!el) return
    const onWheel = (e) => {
      if (orbitRef.current) return
      e.preventDefault()
      setZoom((z) => clampZoom(z * (e.deltaY > 0 ? 0.94 : 1.06)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return
      if (e.key === 'f' || e.key === 'F') { setShowFps((v) => !v); return }
      if (ZOOM_KEYS[e.key] !== undefined) setZoom(ZOOM_KEYS[e.key])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      ref={cellRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: 'var(--kol-surface-secondary)' }}
      onDoubleClick={() => setZoom(1)}
    >
      {needsSource ? (
        <LabsSourcePicker layer={layer} />
      ) : (
        <div style={{ width: `${zoom * LABS_FIT * 100}%`, height: `${zoom * LABS_FIT * 100}%` }}>
          <OutputCanvas />
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-[3] flex items-center gap-2">
        <button type="button" className={chipCls} title="Zoom out" onClick={() => step(-1)}>−</button>
        <button type="button" className={chipCls} title="Reset zoom (0)" onClick={() => setZoom(1)}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className={chipCls} title="Zoom in" onClick={() => step(1)}>+</button>
        {showFps && (
          <span className={chipCls} title="Framerate — press F to hide">{fps} fps</span>
        )}
      </div>
    </div>
  )
}

/* Right rail — the labs surface (LabsParams: chips · Effect|Motion · sectioned
 * params), not the editor's Parameters·Effects tab pair. Same inspector-body
 * wrappers as the editor panels so the rail CSS (padding/gap) carries over. */
function LabsRail() {
  /* The right rail resizes now (kol-framework 0.21.0). `useDragResize` used to
   * be sidenav-shaped by construction — it wrote --kol-sidenav-w on :root and
   * read rightward drag as wider — so pointing this rail at it would have
   * dragged BOTH rails off one variable, backwards. It now takes a token
   * prefix and a side: 'kol-rail' keeps the two rails on separate variables,
   * and side:'right' inverts the pointer AND the arrow keys, because this
   * handle faces the canvas. The tokens (--kol-rail-w plus its snap/step/
   * collapsed siblings) ship on :root from kol-theme 0.43.0, which is why
   * kol-labs.css no longer declares the width. */
  const railRef = useRef(null)
  const { grabProps } = useDragResize(railRef, { token: 'kol-rail', side: 'right' })

  /* THE TWO RAILS MOVE TOGETHER (user, 2026-08-30: "right left nav sync").
   * On /labs both rails are on screen at once, so one open and one shut reads
   * as a bug rather than two independent controls. The shell rail's live width
   * is `--kol-shell-rail-width` on :root, and this rail's state is
   * `data-rail` on the same element — so watching the root covers both.
   *
   * BOTH DIRECTIONS. Left → right is a variable read. Right → left cannot just
   * write `--kol-shell-rail-width`: `NavRail` keeps `railOpen` in its own state
   * and gates the L2 rows on it, so writing the width would widen an empty
   * rail. Instead the left rail is toggled through its OWN gesture — a
   * pointerdown/up on its grab strip with no travel is the click-toggle the
   * component already implements, so its state updates the way it does when
   * the user does it by hand. */
  useEffect(() => {
    const root = document.documentElement
    const CLOSED = 48
    let busy = false

    const leftCollapsed = () => {
      const w = parseFloat(getComputedStyle(root).getPropertyValue('--kol-shell-rail-width'))
      return Number.isFinite(w) ? w <= CLOSED + 1 : null
    }
    const rightCollapsed = () => root.getAttribute('data-rail') === 'collapsed'

    /* the shell rail's grab strip — the left one, whichever is nearest x 0 */
    const leftGrab = () =>
      [...document.querySelectorAll('.kol-rail-grab')]
        .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)[0]

    const clickLeft = () => {
      const el = leftGrab()
      if (!el) return
      const r = el.getBoundingClientRect()
      const opts = { bubbles: true, cancelable: true, pointerId: 1, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }
      el.dispatchEvent(new PointerEvent('pointerdown', opts))
      el.dispatchEvent(new PointerEvent('pointerup', opts))
    }

    const sync = () => {
      if (busy) return
      const left = leftCollapsed()
      if (left === null || left === rightCollapsed()) return
      busy = true
      if (left) root.setAttribute('data-rail', 'collapsed')
      else root.removeAttribute('data-rail')
      busy = false
    }

    const syncBack = () => {
      if (busy) return
      const left = leftCollapsed()
      if (left === null || left === rightCollapsed()) return
      busy = true
      clickLeft()
      busy = false
    }

    sync()
    const fromLeft = new MutationObserver(sync)
    fromLeft.observe(root, { attributes: true, attributeFilter: ['style'] })
    const fromRight = new MutationObserver(syncBack)
    fromRight.observe(root, { attributes: true, attributeFilter: ['data-rail'] })
    return () => { fromLeft.disconnect(); fromRight.disconnect() }
  }, [])
  return (
    <div ref={railRef} className="kol-compose-rail kol-compose-rail--inspector">
      {/* Same DS grab chrome as the left rail, mirrored to the INNER edge —
          the one facing the canvas is the one you reach for.
          `grabProps` SPREADS FIRST and its className is MERGED, not applied
          over ours: since kol-framework 0.36.0 it carries `kol-rail-grab` (the
          pill `useGrabEdge` draws), and spreading it last silently replaced the
          positioning classes — the strip dropped to the screen edge at 40px
          tall instead of running the rail's inner edge. */}
      {/* EXACTLY THE LEFT RAIL'S MARKUP — `NavRail` renders `<div ref={grabRef}
          className="kol-rail-grab" />` and nothing else. The class already
          carries position/top/bottom/width; the utilities that used to be here
          (`absolute top-0 left-0 bottom-0`) fought its own `right: -3.5px` and
          put the strip in the wrong place. The only difference is which edge,
          and that is one mirror rule in kol-labs.css — not markup. */}
      <div {...grabProps} />
      {/* inspector-body IS the rail's scroller (kol-editor.css §4) */}
      <div className="kol-compose-inspector-body">
        <LabsParams />
      </div>
    </div>
  )
}

/* ── TOUCH: THE PARAMS RAIL IS A DRAWER (user, 2026-09-01: "labs needs both
 * sidebars, just via hamburger menu to open close, otherwise labs doesn't work
 * on mobile, it has parametric controls") ──
 *
 * The LEFT sidebar is the shell's: `AppShell touch="drawer"` (kol-shell 0.31.0,
 * adopted here the same day) takes the rail off-canvas under 768px with its own
 * hamburger fixed top-right, and labs' catalog rows ride it as L1/L2 exactly as
 * on desktop — nothing labs-side to draw. The RIGHT one is this: on a coarse
 * pointer the params column would take 264 of a 390px screen, so a top bar
 * carries its toggle (left — the shell's trigger owns the right corner) and
 * kol-labs.css slides the rail in under the bar, over the stage. Nothing is
 * re-skinned; the rail is moved off the grid, that is all. */
const TouchRails = createContext(null)

function LabsTouchBar() {
  const { paramsOpen, toggleParams } = useContext(TouchRails)
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-fg-08 bg-surface-primary px-2">
      <Button variant="nav" size="lg" iconOnly="panel-right" aria-label="Parameters" pressed={paramsOpen} onClick={toggleParams} />
    </div>
  )
}

/* The desktop rail minus its grab: no `useDragResize`, so nothing stamps a
 * stored desktop `data-rail` / `--kol-rail-w` on :root, and the footer's
 * collapsed fold never fires. Open/closed is the wrapper's `data-params`. */
function LabsTouchRail() {
  return (
    <div className="kol-compose-rail kol-compose-rail--inspector">
      <div className="kol-compose-inspector-body">
        <LabsParams />
      </div>
    </div>
  )
}

/* NO TOPBAR (user, 2026-08-27: "skip the top bar … so we can maintain the
 * Kolkrabbi logo and have a much more normal explanation"). Everything it
 * carried has a home: the "Labs" wordmark is the lit row in the rail; Mode
 * is the Editor / Labs / Randomiser rows; the UI theme is SideNav's own slot;
 * the Settings dropdown was the /settings page's Defaults section (it lacked
 * only Loop length, added there). LabsMenuTop retired to _tmp/. */
const NoTopbar = () => null

const LABS_REGISTRY = {
  topbar: NoTopbar,
  canvas: LabsStage,
  panels: [
    /* LabsNav is NOT a panel any more — it renders nothing and publishes its
       rows to the shell rail; it is mounted in LabsBody instead. */
    { slot: 'canvas.footer', order: 0, Component: TimelineDock },
    { slot: 'right.body', order: 0, Component: LabsRail },
    /* Transport/Output/File sits under the PARAMS rail in labs — right, not
     * left (the reference's bottom-right block). */
    { slot: 'right.footer', order: 0, Component: EditorFooter },
  ],
}

const LABS_REGISTRY_TOUCH = {
  ...LABS_REGISTRY,
  topbar: LabsTouchBar,
  panels: LABS_REGISTRY.panels.map((p) => (p.Component === LabsRail ? { ...p, Component: LabsTouchRail } : p)),
}

function LabsBody() {
  const { setAspect, selectedId, select } = useComposeState()
  const { layer, setOnly } = useLabsLayer()
  const bootedRef = useRef(false)

  /* Coarse pointer without the desktop opt-in (the `kol-desktop` key
   * `mobile/device.js` writes): read once — a device does not change
   * mid-mount. */
  const touch = isMobileDevice() && !wantsDesktop()
  const [paramsOpen, setParamsOpen] = useState(false)

  /* ONE RAIL, NOT TWO (user ruling 2026-08-27) — and since 2026-08-28 it is
   * literally ONE COMPONENT: labs no longer hides the shell rail and mounts
   * kol-framework's `SideNav` in its own grid cell. It publishes its
   * categories to that rail instead (`railExtras`, see LabsNav), so every
   * route runs kol-shell's `NavRail` with the same grab-open animation and
   * the same active styling. The hide/re-assert dance below went with it. */

  /* Undo / redo / grid — the mode-agnostic keymap the editor mounts too. */
  useGlobalShortcuts()

  /* Boot once: theme, then the global default aspect — the same
   * reconciliation EditorBody does (the provider seeds aspect '4:5' but
   * canvas 1080×1080, so a full-frame layer would otherwise be built square
   * inside a 4:5 frame).
   *
   * Deliberately NOT autoplaying and NOT picking anything: labs opens on an
   * empty stage and the nav is the entry point. Auto-seeding a generator
   * meant every visit silently started on whatever sat first in the tree. */
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    /* UI theme: the topbar ThemeToggle's framework store applies it on
     * mount — labs no longer boots the editor's theme store. */
    const s = getAppSettings()
    if (s.defaultAspect && s.defaultAspect !== 'custom') setAspect(s.defaultAspect)
    if (s.defaultLoopSeconds) transport.setLoopSeconds(s.defaultLoopSeconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* The one thing that DOES open something: an explicit deep link
   * (`?view=labs&preset=<id>`) — someone asked for that preset by name, so it
   * wins over both the empty stage and a restored draft. */
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    const deepLink = new URLSearchParams(window.location.search).get('preset')
    const group = deepLink ? groupOfPreset(deepLink) : null
    if (group) setOnly('loop', presetLayerPatch(presetById(deepLink), group))
  }, [setOnly])

  /* Space = play/pause. The editor gets this from PanZoomViewport (see
   * Canvas.jsx), which only mounts on the pan/zoom canvas — labs renders the
   * plain letterbox, so it binds its own. Same typing guard: a space typed
   * into a field is a space, not a transport toggle.
   *
   * C = Orbit, the same tool mode the editor's keymap arms: the camera rigs
   * (useCameraKeysDrag + the engines' OrbitControls) already live in
   * LayerRenderer and key off `tool === 'orbit'` — labs just needed a way
   * in, so the rail's "Press C (Orbit tool)" hint is true here too. */
  const { tool, setTool } = useTool()
  const toolRef = useRef(tool)
  toolRef.current = tool
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        transport.toggle()
        return
      }
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setTool(toolRef.current === 'orbit' ? 'select' : 'orbit')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setTool])

  /* Keep the URL shareable without a router (App gates on `?view=`, and
   * ARCHITECTURE keeps this app router-free). replaceState, not push — the
   * back button should leave labs, not walk a preset history. */
  useEffect(() => {
    if (!layer?.presetId) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('preset') === layer.presetId) return
    params.set('view', 'labs')
    params.set('preset', layer.presetId)
    if (layer.loopGroup) params.set('cat', layer.loopGroup)
    else params.delete('cat')
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
  }, [layer?.presetId, layer?.loopGroup])

  /* The single layer stays selected — every inspector in the rail resolves
   * its subject from `selectedId`, so a stray deselect (click-away) blanks
   * the whole rail. */
  useEffect(() => {
    if (layer && selectedId !== layer.id) select(layer.id)
  }, [layer, selectedId, select])

  /* `.kol-editor-labs` scopes kol-labs.css to this chrome; `contents` keeps the
   * wrapper out of layout so the shell's grid is untouched. */
  return (
    <div className="kol-editor-labs contents" data-touch={touch || undefined} data-params={paramsOpen ? 'open' : undefined}>
      {/* draws nothing — hands labs' categories to the shell rail */}
      <LabsNav />
      {touch ? (
        <TouchRails.Provider value={{ paramsOpen, toggleParams: () => setParamsOpen((v) => !v) }}>
          {/* ONE SIZE GROUP IN THE DRAWER — 'md', the rung where the DS's
              ladders agree (see controlSize.js). */}
          <ControlSizeContext.Provider value="md">
            <EditorShell registry={LABS_REGISTRY_TOUCH} />
          </ControlSizeContext.Provider>
        </TouchRails.Provider>
      ) : (
        <EditorShell registry={LABS_REGISTRY} />
      )}
      {/* S = the "Animate any value" card (labs' shortcuts overlay). */}
      <LabsShortcuts />
    </div>
  )
}

/* Own draft slot — never the editor's `kol.editor.draft` (opening labs must
 * not offer to restore, or later overwrite, a composition). Phase 11.6. */
export const LABS_DRAFT_KEY = 'kol.editor.labs-draft'

export default function LabsView() {
  return (
    <EditorProviders draftKey={LABS_DRAFT_KEY}>
      <LabsBody />
    </EditorProviders>
  )
}
