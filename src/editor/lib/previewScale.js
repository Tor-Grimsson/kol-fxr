/**
 * previewScale — the live canvases' backing ratio (Settings › Preview resolution).
 *
 * Full = the device pixel ratio, capped at 2 (what every layer canvas always used). Half = half of
 * that: a quarter of the pixels for every CPU stage, readback and upload, the browser scaling the
 * canvas up to its box — for recording the pixel-y effects, which don't need the extra pixels.
 *
 * EXPORTS STAY FULL: effected and engine layers export by snapshotting their LIVE canvas
 * (build.js), so `atFullRes(fn)` lifts the ratio to full, waits for the layers to repaint, runs the
 * export and drops back. GL engines (three.js renderers) keep their own pixel ratio.
 */
import { useSyncExternalStore } from 'react'
import { getAppSettings, useAppSettings } from './appSettings'

let exporting = 0
const subs = new Set()
const emit = () => subs.forEach((fn) => fn())
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn) }

export function previewDpr() {
  const d = Math.min(2, window.devicePixelRatio || 1)
  return exporting > 0 || getAppSettings().previewRes !== 'half' ? d : d / 2
}

/* the ratio, re-rendering the caller when the setting flips or an export starts / ends */
export function usePreviewDpr() {
  useAppSettings()
  useSyncExternalStore(subscribe, () => exporting)
  return previewDpr()
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()))

export async function atFullRes(fn) {
  const lift = exporting === 0 && getAppSettings().previewRes === 'half'
  exporting++
  /* two frames — the re-render commit, then the passive effects that repaint the canvases */
  if (lift) { emit(); await frame(); await frame() }
  try { return await fn() } finally { exporting--; if (lift) emit() }
}

/* the bare factor (1 or 0.5) — for GL engines that render at ratio 1 rather than the device's */
export function previewScale() {
  return exporting > 0 || getAppSettings().previewRes !== 'half' ? 1 : 0.5
}
