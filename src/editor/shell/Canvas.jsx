import { Canvas as DsCanvas, CanvasZoomContext, CANVAS_VIRTUAL_W, CANVAS_DEFAULTS as DS_CANVAS_DEFAULTS, CanvasFrame, useFps } from '@kolkrabbi/kol-component'
import { ASPECTS } from './aspects'
import { transport } from '../params/transport'
import { pack } from '../packs'

/**
 * Canvas — the editor's stage on kol-component's `Canvas` (lifted from this file; editor DS sync
 * phase 3c, 2026-09-27 — this file was an 815-line second copy of the frame, the pan / zoom
 * viewport, the rulers and the guides, publishing two zoom contexts to bridge the difference).
 *
 * What is the editor's: its aspect table, the grid behind the frame (the `backdrop` slot), and
 * Space-tap = play / pause (the `onSpaceTap` seam) — with the motion pack only (editor review #1). Everything else is KOL's, and the zoom context
 * is KOL's one context — re-exported here so the overlays' imports keep resolving.
 */
export { CanvasZoomContext, CANVAS_VIRTUAL_W, CanvasFrame, useFps }

/* The type mode's per-frame defaults (data values, not frame chrome). */
export const CANVAS_DEFAULTS = { ...DS_CANVAS_DEFAULTS, bgColor: '#0E0E11' }

/* Oversized so practical panning never reveals an edge */
const GRID = <div className="kol-grid-bg absolute" style={{ left: '-200%', top: '-200%', width: '500%', height: '500%' }} />

export default function Canvas({ showGrid = true, showRulers = true, ...props }) {
  return (
    <DsCanvas
      aspects={ASPECTS}
      backdrop={showGrid ? GRID : undefined}
      rulers={showRulers}
      onSpaceTap={pack('motion') ? () => transport.toggle() : undefined}
      {...props}
    />
  )
}
