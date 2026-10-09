import { useSyncExternalStore } from 'react'

/* The canvas zoom, published from inside the DS viewport (CanvasArea's ZoomProbe reads its
 * CanvasZoomContext) so the status bar, which sits outside it, can show it. */
let zoom = 1
const subs = new Set()
export const setZoom = (z) => { if (z !== zoom) { zoom = z; subs.forEach((f) => f()) } }
export const useZoom = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => zoom)
