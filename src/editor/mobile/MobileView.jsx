import { useEffect, useRef, useState } from 'react'
import { EditorProviders } from '../Editor'
import { Button } from '@kolkrabbi/kol-component'
import { OutputStage } from '../OutputView'
import { useComposeState, CANVAS_W } from '../compose/state'
import { PRESET_SIZES } from '../shell/aspects'
import { transport } from '../params/transport'
import { applyThemeMode, getThemeMode } from '../theme'
import { firstPresetPatch } from '../../loops/registry'
import LabsSourcePicker from '../labs/LabsSourcePicker'
import { isTabletSized, goDesktop } from './device'
import { goLabs, modeById } from '../mode'
import { MODE_ICONS } from '../labs/LabsNav'
import CategoryScreen, { SPREAD } from './CategoryScreen'
import MobileOverlay from './MobileOverlay'

/**
 * MobileView — the generative chrome touch devices get instead of the editor
 * (App gates on primary-pointer coarse; `./device`). Not a shrunk editor: a
 * randomize-only playground over the same engine. Flow: entry (chrome
 * chooser; tablets get Editor/Labs doors) → category (the GENERATIVE_TREE
 * types as buttons + Insert media) → live (full-display 4:5 stage +
 * `MobileOverlay`'s scoped-randomize / download / hide-UI controls).
 *
 * The session is EPHEMERAL by construction: EditorProviders seed the default
 * doc (aspect already 4:5), nothing autosaves (the draft flow lives in the
 * desktop Compose shell, never mounted here), so the desktop draft can't be
 * clobbered. Reload = fresh start.
 */

function EntryScreen({ onGenerate }) {
  /* A welcome CARD, not three floating buttons (user ruling 2026-08-12):
   * the chrome chooser — one line, then the doors. Media insert lives on
   * the category screen (it's a randomiser action, not a chrome). */
  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <div
        className="w-full max-w-sm rounded p-8 flex flex-col gap-6"
        style={{ background: 'var(--kol-surface-primary)' }}
      >
        <div className="flex flex-col gap-2">
          <span className="kol-mono-16 text-emphasis">kolkrabbi-fxr</span>
          <p className="kol-mono-12 text-meta m-0">Select chrome</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" size="lg" className={SPREAD} iconLeft={MODE_ICONS.randomiser} iconRight={MODE_ICONS.randomiser} onClick={onGenerate}>Generate</Button>
          {isTabletSized() && (
            <>
              <Button variant="primary" size="lg" className={SPREAD} iconLeft={MODE_ICONS.editor} iconRight={MODE_ICONS.editor} onClick={goDesktop}>
                {modeById('editor').label}
              </Button>
              <Button variant="primary" size="lg" className={SPREAD} iconLeft={MODE_ICONS.labs} iconRight={MODE_ICONS.labs} onClick={goLabs}>
                {modeById('labs').label}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileBody() {
  const { layers, addLayer, removeLayer, updateLayer, canvasW, canvasH, aspect, setAspect } = useComposeState()
  const [screen, setScreen] = useState('entry')   /* entry | category | live */
  const [activeId, setActiveId] = useState(null)
  const [stageFit, setStageFit] = useState('contain')  /* contain = 4:5 letterbox · cover = fill display */

  /* Pinch-to-scale the stage (touch): frame the shot after Hide UI without
   * any controls. Capture-phase so a second finger suspends the sim-pointer
   * forwarding (no accidental grabs mid-pinch); scale clamps 0.5–3 and
   * sticks until Start over. */
  const [stageScale, setStageScale] = useState(1)
  const pinchRef = useRef({ pts: new Map(), startDist: 0, startScale: 1 })
  const pinchDist = () => {
    const [a, b] = [...pinchRef.current.pts.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  const onPinchDown = (e) => {
    pinchRef.current.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pinchRef.current.pts.size === 2) {
      pinchRef.current.startDist = pinchDist()
      pinchRef.current.startScale = stageScale
      transport.setStagePointer(null)
      e.stopPropagation()
    }
  }
  const onPinchMove = (e) => {
    const p = pinchRef.current
    if (!p.pts.has(e.pointerId)) return
    p.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (p.pts.size >= 2 && p.startDist > 0) {
      e.stopPropagation()
      setStageScale(Math.min(3, Math.max(0.5, p.startScale * (pinchDist() / p.startDist))))
    }
  }
  const onPinchEnd = (e) => {
    pinchRef.current.pts.delete(e.pointerId)
    if (pinchRef.current.pts.size < 2) pinchRef.current.startDist = 0
  }

  useEffect(() => {
    applyThemeMode(getThemeMode())
    /* The provider inits aspect '4:5' but canvasW/H 1080×1080 — desktop
     * reconciles that in EditorBody's boot; mobile must do the same or every
     * full-frame layer is built square inside a 4:5 frame. */
    setAspect('4:5')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = layers.find((l) => l.id === activeId) ?? null

  /* Esc closes the source-picker overlay (same as its Back: unwind the
   * empty photo layer). CategoryScreen handles its own Esc. */
  const pickerOpen = screen === 'live' && active?.type === 'photo' && !active.src
  useEffect(() => {
    if (!pickerOpen) return
    const onKey = (e) => { if (e.key === 'Escape') restart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  /* Modal law: playback stops while the source picker is open. */
  useEffect(() => {
    if (!pickerOpen) return
    const wasPlaying = transport.isPlaying()
    transport.pause()
    return () => { if (wasPlaying) transport.play() }
  }, [pickerOpen])

  const startGenerative = (entry) => {
    const patch = firstPresetPatch(entry)
    if (!patch) return
    const id = addLayer('loop', patch)
    setActiveId(id)
    transport.play()
    setScreen('live')
  }

  /* Live category hop — same patch onto the existing loop layer (LoopPicker
   * type-hop semantics; lingering old-group keys are the accepted model). */
  const switchCategory = (entry) => {
    const patch = firstPresetPatch(entry)
    if (patch && activeId) updateLayer(activeId, patch)
  }

  /* Insert media = create the photo layer EMPTY (full-bleed cover — on
   * mobile the media IS the composition) and let labs' two-pane source
   * picker fill it: From library | Upload, same as labs — the picker IS
   * the empty state, so both ways in are always offered. */
  const startInsert = () => {
    const virtualH = Math.round(CANVAS_W * canvasH / canvasW)
    const id = addLayer('photo', { fit: 'cover', x: 0, y: 0, w: CANVAS_W, h: virtualH })
    setActiveId(id)
    transport.play()
    setScreen('live')
  }

  /* Output-tab aspect control: a real aspect id re-frames the composition
   * (setAspect) AND refits the active full-frame layer to the new frame —
   * mobile's invariant is "the layer IS the composition". 'fill' is
   * display-only cover; the aspect keeps whatever it was. */
  const setStageAspect = (id) => {
    if (id === 'fill') { setStageFit('cover'); return }
    setStageFit('contain')
    setAspect(id)
    const sz = PRESET_SIZES[id]
    if (activeId && sz) {
      updateLayer(activeId, { x: 0, y: 0, w: CANVAS_W, h: Math.round(CANVAS_W * sz.h / sz.w) })
    }
  }

  const restart = () => {
    /* removeLayer per layer (not clearLayers) so a video layer's IndexedDB
     * clip is freed here — mobile never runs the desktop's load-time gc. */
    for (const l of [...layers]) removeLayer(l.id)
    setActiveId(null)
    setStageScale(1)
    setScreen('entry')
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* touch-none: touches over the stage arrive as pointer events (the
          mouse modulation source), not browser pan/zoom gestures. Scoped to
          the stage wrapper — the overlay/screens above keep native touch
          (the category list scrolls). The transform also makes this the
          containing block for OutputStage's fixed positioning, so the pinch
          scale applies to the whole stage. */}
      <div
        className="absolute inset-0 touch-none"
        style={{ transform: stageScale === 1 ? undefined : `scale(${stageScale})` }}
        onPointerDownCapture={onPinchDown}
        onPointerMoveCapture={onPinchMove}
        onPointerUpCapture={onPinchEnd}
        onPointerCancelCapture={onPinchEnd}
        onPointerLeave={onPinchEnd}
      >
        <OutputStage fit={stageFit} />
      </div>
      {screen === 'entry' && (
        <EntryScreen onGenerate={() => setScreen('category')} />
      )}
      {screen === 'category' && (
        <CategoryScreen onPick={startGenerative} onInsert={startInsert} onBack={() => setScreen('entry')} />
      )}
      {screen === 'live' && (
        <MobileOverlay
          layer={active}
          onSwitchCategory={switchCategory}
          onInsert={() => { restart(); startInsert() }}
          onRestart={restart}
          aspectValue={stageFit === 'cover' ? 'fill' : aspect}
          onAspect={setStageAspect}
        />
      )}
      {/* Source picker overlay — labs' two-pane (From library | Upload)
          while the inserted photo layer has no pixels yet. Back unwinds
          the empty layer entirely. */}
      {screen === 'live' && active?.type === 'photo' && !active.src && (
        <div className="fixed inset-0 z-10 flex flex-col bg-black/60 backdrop-blur-sm">
          <div className="flex-1 min-h-0">
            <LabsSourcePicker layer={active} />
          </div>
          <div className="flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" size="lg" onClick={restart}>Back</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MobileView() {
  return (
    <EditorProviders persistDraft={false}>
      <MobileBody />
    </EditorProviders>
  )
}
