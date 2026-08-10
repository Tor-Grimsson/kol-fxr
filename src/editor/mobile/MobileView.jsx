import { useEffect, useRef, useState } from 'react'
import { EditorProviders } from '../Editor'
import EditorButton from '../components/EditorButton'
import { OutputStage } from '../OutputView'
import { useComposeState, CANVAS_W } from '../compose/state'
import { PRESET_SIZES } from '../shell/aspects'
import { transport } from '../params/transport'
import { applyThemeMode, getThemeMode } from '../theme'
import { GENERATIVE_TREE } from '../../loops/taxonomy'
import { firstPresetPatch } from '../../loops/registry'
import LabsSourcePicker from '../labs/LabsSourcePicker'
import { isTabletSized, goDesktop } from './device'
import MobileOverlay from './MobileOverlay'

/**
 * MobileView — the generative chrome touch devices get instead of the editor
 * (App gates on primary-pointer coarse; `./device`). Not a shrunk editor: a
 * randomize-only playground over the same engine. Flow: entry (Insert media /
 * Generate, tablets get a "Use desktop editor" opt-in) → category (the
 * GENERATIVE_TREE types as buttons) → live (full-display 4:5 stage +
 * `MobileOverlay`'s scoped-randomize / download / hide-UI controls).
 *
 * The session is EPHEMERAL by construction: EditorProviders seed the default
 * doc (aspect already 4:5), nothing autosaves (the draft flow lives in the
 * desktop Compose shell, never mounted here), so the desktop draft can't be
 * clobbered. Reload = fresh start.
 */

function EntryScreen({ onInsert, onGenerate }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full max-w-sm">
        <EditorButton variant="primary" size="lg" className="w-full" onClick={onInsert}>Insert image or video</EditorButton>
      </div>
      <div className="w-full max-w-sm">
        <EditorButton variant="primary" size="lg" className="w-full" onClick={onGenerate}>Generate</EditorButton>
      </div>
      {isTabletSized() && (
        <div className="mt-8">
          <EditorButton variant="outline" size="lg" onClick={goDesktop}>
            Use desktop editor
          </EditorButton>
        </div>
      )}
    </div>
  )
}

function CategoryScreen({ onPick, onBack }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center overflow-y-auto bg-black/60 p-6 backdrop-blur-sm">
      <div className="my-auto flex w-full flex-col items-center gap-2 py-6">
        <div className="kol-helper-12 text-meta mb-2">Pick a generator</div>
        {GENERATIVE_TREE.map((entry) => (
          <div key={entry.label} className="w-full max-w-sm">
            <EditorButton variant="primary" size="lg" className="w-full" onClick={() => onPick(entry)}>
              {entry.label}
            </EditorButton>
          </div>
        ))}
        <div className="mt-4">
          {/* outline, not ghost — scrim buttons need an affordance edge. */}
          <EditorButton variant="outline" size="lg" onClick={onBack}>Back</EditorButton>
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
        <EntryScreen onInsert={startInsert} onGenerate={() => setScreen('category')} />
      )}
      {screen === 'category' && (
        <CategoryScreen onPick={startGenerative} onBack={() => setScreen('entry')} />
      )}
      {screen === 'live' && (
        <MobileOverlay
          layer={active}
          onSwitchCategory={switchCategory}
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
            <EditorButton variant="outline" size="lg" onClick={restart}>Back</EditorButton>
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
