import { useEffect, useRef, useState } from 'react'
import { pack } from '../packs'

/**
 * FileCover — a file's cover, drawn ON DEMAND from the engine itself (plan home-library-detail-one-card § 3, user
 * 2026-10-24: *"it does not need to make thumbnails for all those"* · *"quantise and reuse"*). The frame is drawn the
 * first time a card scrolls into view and cached by WHAT IS DRAWN, not by file — the LABS file, its RANDOMISER twin and
 * the morph that steps through it share one frame, and the detail page reuses it.
 *
 *   key                          drawn by
 *   loop:<presetId>              a shipped loops-preset file (LABS · RANDOMISER · a MORPH's first step)
 *   kinetic:<presetId>           a shipped kinetic file
 *   file:<id>:<updatedAt>        anything else — an editor file, a user's save (its own layers, so its own edits)
 *
 * A file whose only layer is a 2D loop is drawn straight onto a canvas by the export's own `drawLoopFrame`, paused at U
 * — milliseconds, no mount. Everything else (GL engines, kinetic type, a composition) goes through `CoverHost`, one
 * live offscreen frame at a time. One size: SIZE px square. A key whose cards all left the viewport before its turn
 * is skipped; a frame that cannot be drawn caches as null and the card keeps its bare box.
 *
 * CACHED IN MEMORY AND IN INDEXEDDB — never localStorage, whose quota is the user's library's (a near-full one is what
 * emptied the Library and stopped Home's covers saving, 2026-10-24). A reload reads the frame back instead of drawing it.
 */
const SIZE = 240        /* = useComposeFile's THUMB_PX, so both draw paths quantise to the same frame */
const U = 0.35          /* the loop position a 2D cover is paused at */
const VERSION = 'v1'    /* bump to redraw every stored frame after an engine change */
const frames = new Map()     /* key → data URL (or null: could not be drawn) */
const waiting = new Map()    /* key → Set of setters */
export const liveQueue = []
let kickHost = null
export const setHostKick = (fn) => { kickHost = fn }

/* ── the IndexedDB shelf ─────────────────────────────────────────────── */
let dbp = null
const db = () => (dbp ??= new Promise((res, rej) => {
  const r = indexedDB.open('kol-fxr-covers', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('frames')
  r.onsuccess = () => res(r.result)
  r.onerror = () => rej(r.error)
}))
const shelfGet = (key) => db().then((d) => new Promise((res) => {
  const q = d.transaction('frames').objectStore('frames').get(`${VERSION}:${key}`)
  q.onsuccess = () => res(q.result ?? null)
  q.onerror = () => res(null)
})).catch(() => null)
const shelfPut = (key, url) => db().then((d) => { d.transaction('frames', 'readwrite').objectStore('frames').put(url, `${VERSION}:${key}`) }).catch(() => {})

const is2d = (l) => l?.type === 'loop' && pack('generators')?.loopById(l.loopId)?.kind !== 'engine'

function coverKeyOf(file) {
  const layers = file.layers ?? []
  const only = layers.length === 1 ? layers[0] : null
  if (file.shipped && file.mode !== 'editor' && only?.type === 'loop') return { key: `loop:${only.presetId}`, layer: is2d(only) ? only : null }
  if (file.shipped && file.mode !== 'editor' && only?.type === 'kinetic') return { key: `kinetic:${only.presetId}`, layer: null }
  return { key: `file:${file.id}:${file.updatedAt ?? file.savedAt ?? 0}`, layer: is2d(only) ? only : null }
}

function drawLoop(layer) {
  const gen = pack('generators')
  const loop = gen?.loopById(layer.loopId)
  if (!loop) return null
  const w = layer.w || 1080, h = layer.h || 1080
  const c = document.createElement('canvas')
  c.width = SIZE; c.height = SIZE
  const g = c.getContext('2d')
  g.scale(SIZE / w, SIZE / h)
  try { gen.drawLoopFrame(g, loop, U, w, h, gen.loopDrawParams(loop, layer)) } catch { return null }
  return c.toDataURL('image/webp', 0.8)
}

export function deliver(key, url) {
  frames.set(key, url)
  if (url) shelfPut(key, url)
  waiting.get(key)?.forEach((set) => set(url))
  waiting.delete(key)
}
export const wanted = (key) => !frames.has(key) && (waiting.get(key)?.size ?? 0) > 0
const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 50))

/* AN UPLOADED COVER (the rail's Upload image) on a shipped file — per file, kept on the shelf, never in the quota;
   it wins over the drawn frame. A user's own save keeps its upload as its `thumb`, as before. */
const uploadKey = (id) => `upload:${id}`
export function setUploadedCover(id, url) {
  frames.set(uploadKey(id), url)
  shelfPut(uploadKey(id), url)
  window.dispatchEvent(new CustomEvent('kol:cover', { detail: id }))
}

function request(file, set) {
  if (file.shipped) {
    const up = uploadKey(file.id)
    if (frames.get(up)) { set(frames.get(up)); return () => {} }
    let release = null, gone = false
    shelfGet(up).then((stored) => {
      if (gone) return
      if (stored) { frames.set(up, stored); set(stored) } else release = drawn(file, set)
    })
    return () => { gone = true; release?.() }
  }
  return drawn(file, set)
}

function drawn(file, set) {
  const { key, layer } = coverKeyOf(file)
  if (frames.has(key)) { set(frames.get(key)); return () => {} }
  const first = !waiting.has(key)
  if (first) waiting.set(key, new Set())
  waiting.get(key).add(set)
  if (first) {
    shelfGet(key).then((stored) => {
      if (stored) { deliver(key, stored); return }
      if (!wanted(key)) return
      if (layer) idle(() => { if (wanted(key)) deliver(key, drawLoop(layer)) })
      else { liveQueue.push({ key, file }); kickHost?.() }
    })
  }
  return () => {
    const s = waiting.get(key)
    if (!s) return
    s.delete(set)
    if (!s.size) waiting.delete(key)
  }
}

/** A card's (or the detail page's) cover — requested when it first enters the viewport. */
export default function FileCover({ file }) {
  const ref = useRef(null)
  const fileRef = useRef(file)
  fileRef.current = file
  const [src, setSrc] = useState(null)
  const stamp = file.updatedAt ?? file.savedAt ?? 0
  /* an upload replaces the drawn frame at once */
  useEffect(() => {
    const on = (e) => { if (e.detail === file.id) setSrc(frames.get(uploadKey(file.id))) }
    window.addEventListener('kol:cover', on)
    return () => window.removeEventListener('kol:cover', on)
  }, [file.id])
  useEffect(() => {
    let release = () => {}
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      release = request(fileRef.current, setSrc)
    }, { rootMargin: '200px' })
    io.observe(ref.current)
    return () => { io.disconnect(); release() }
  }, [file.id, stamp])
  return (
    <div ref={ref} className="size-full">
      {src && <img src={src} alt="" className="size-full object-cover" draggable={false} />}
    </div>
  )
}
