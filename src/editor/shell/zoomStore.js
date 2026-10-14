import { useSyncExternalStore } from 'react'

/* The canvas zoom, published from inside the DS viewport (CanvasArea's ZoomProbe reads its
 * CanvasZoomContext) so the title line, which sits outside it, can show it — in REAL terms since
 * plan 33: screen px per frame px, 1 = 100% (Affinity's), not the DS's fitted-relative zoom. */
let zoom = 1
const subs = new Set()
export const setZoom = (z) => { if (z !== zoom) { zoom = z; subs.forEach((f) => f()) } }
export const getZoom = () => zoom
export const useZoom = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => zoom)
