import { useCallback, useEffect, useRef } from 'react'
import { EditorProviders } from './Editor'
import Canvas, { CANVAS_VIRTUAL_W } from './shell/Canvas'
import LayerRenderer from './compose/LayerRenderer'
import { resolveColor, useComposeState } from './compose/state'
import { transport } from './params/transport'
import { useTheme } from '@kolkrabbi/kol-framework'
import { OUTPUT_SNAPSHOT_KEY } from './compose/useComposeFile'
import { findFile } from './library/shipped'

/**
 * OutputView — the composition rendered full-screen with ZERO editor chrome,
 * opened in its own browser tab (App gates on `?view=output`). Purpose: a
 * clean surface to screen-record with OS/tab capture, sidestepping the in-app
 * SVG-round-trip Record path and its fps sag. It seeds from a one-shot
 * localStorage snapshot the "Open output" button writes (see
 * `useComposeFile.openOutputWindow`) — a static document is all a loop
 * recording needs, the loop plays live via the transport.
 */

/* Frame fill with opacity — mirrors CanvasArea's bgColor derivation.
 * color-mix so themed `var(--kol-*)` fills take alpha too.
 * ponytail: tiny pure copy, not worth a shared util just for this. */
function fillWithAlpha(fill, alpha) {
  if (!fill || typeof fill !== 'string') return fill
  return `color-mix(in srgb, ${fill} ${Math.round(alpha * 100)}%, transparent)`
}

/* The composition itself — the same `Canvas` letterbox CanvasArea uses, with
 * `guideColor="transparent"` collapsing the dashed border + aspect label to
 * nothing, and no pan/zoom/rulers. Fills whatever box it is given and paints
 * NO backdrop, so the caller owns that. Labs mode (`./labs/LabsView`) mounts
 * this one directly inside the EditorShell canvas cell — a viewport-fixed
 * wrapper there would cover the rails. */
/* `overlay(toVirtual)` — mode chrome drawn in the stage's virtual px over the layers (labs' Edit on canvas, plan 40
   § 4.2); `toVirtual(clientX, clientY)` → `{ vx, vy }`, CanvasArea's convention */
export function OutputCanvas({ fit = 'contain', overlay }) {
  const stageRef = useRef(null)
  const toVirtual = useCallback((clientX, clientY) => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r?.width) return { vx: 0, vy: 0 }
    const k = CANVAS_VIRTUAL_W / r.width
    return { vx: (clientX - r.left) * k, vy: (clientY - r.top) * k }
  }, [])
  const { aspect, canvasW, canvasH, layers, palette, canvasFill, canvasFillOpacity } = useComposeState()
  const fillHex = resolveColor(canvasFill, palette)
  const bgColor = fillHex
    ? (canvasFillOpacity < 1 ? fillWithAlpha(fillHex, canvasFillOpacity) : fillHex)
    : null
  return (
    <Canvas
      aspect={aspect}
      customRatio={canvasW / canvasH}
      bgColor={bgColor ?? undefined}
      guideColor="transparent"
      gutter={0}
      fit={fit}
    >
      {/* Stage pointer → transport (virtual px, CanvasArea's convention) —
          feeds the layer-local pointer sources and sim pointer forces, with
          the contact state (hover-repel vs grab-drag). Pointer events so
          touch counts; capture on down keeps a drag reporting outside the
          box. CanvasArea owns the editor's copy; this covers output/labs/
          randomizer, which never mount it. */}
      <div
        ref={stageRef}
        className="relative w-full h-full"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          if (!r.width) return
          const k = CANVAS_VIRTUAL_W / r.width
          transport.setStagePointer((e.clientX - r.left) * k, (e.clientY - r.top) * k, e.buttons > 0)
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          const r = e.currentTarget.getBoundingClientRect()
          if (!r.width) return
          const k = CANVAS_VIRTUAL_W / r.width
          transport.setStagePointer((e.clientX - r.left) * k, (e.clientY - r.top) * k, true)
        }}
        onPointerUp={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          if (!r.width) return
          const k = CANVAS_VIRTUAL_W / r.width
          transport.setStagePointer((e.clientX - r.left) * k, (e.clientY - r.top) * k, false)
        }}
        onPointerLeave={(e) => { if (e.buttons === 0) transport.setStagePointer(null) }}
      >
        {layers.map((layer) => (
          <LayerRenderer key={layer.id} layer={layer} palette={palette} />
        ))}
        {overlay?.(toVirtual)}
      </div>
    </Canvas>
  )
}

/* The full-screen recording surface — OutputCanvas on an absolute-black
 * viewport backdrop. Used by the output tab (`?view=output`) and the mobile
 * chrome (`./mobile/MobileView`); both ARE the whole screen. */
export function OutputStage({ fit = 'contain' }) {
  return (
    <div className="fixed inset-0" style={{ background: '#000' }}>
      <OutputCanvas fit={fit} />
    </div>
  )
}

/* Runs inside the provider stack: apply the stored theme, hydrate the doc from
 * the snapshot, start playback, render the stage. Once, on mount. */
function OutputBody() {
  const { loadPreset } = useComposeState()
  /* re-stamps a saved theme choice on mount (kol-framework's store) */
  useTheme()
  useEffect(() => {
    try {
      /* `?open=<id>` renders that saved file — the cover generator's surface (scripts/generate-file-thumbs.mjs);
         otherwise the one-shot snapshot the Open output button wrote */
      const open = new URLSearchParams(window.location.search).get('open')
      const file = open && findFile(open)
      const raw = file ? null : localStorage.getItem(OUTPUT_SNAPSHOT_KEY)
      const env = file ? { spec: file } : raw ? JSON.parse(raw) : null
      if (env?.spec) loadPreset(env.spec)
    } catch { /* no/invalid snapshot — render whatever the stack seeds */ }
    transport.play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <OutputStage />
}

export default function OutputView() {
  return (
    /* persistDraft off — the output tab renders a snapshot; prompting restore
     * or autosaving that snapshot over the editor's live draft is never right. */
    <EditorProviders persistDraft={false}>
      <OutputBody />
    </EditorProviders>
  )
}
