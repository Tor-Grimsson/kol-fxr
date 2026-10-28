/**
 * transport — the motion clock + live-input store (param-graph RFC Phase 2).
 *
 * A module-level singleton (one editor instance) exposing normalized time
 * `t∈[0,1]` (matching the loops' `u`) that wraps at `loopSeconds`, plus a
 * live pointer position for modulation. Bound layers subscribe via
 * `useTransportCtx(true)` and re-render each tick; static layers pass
 * `false` and never subscribe, so the un-animated editor pays nothing.
 *
 * An external store (not React context) so 60fps ticks re-render ONLY the
 * handful of bound-layer renderers, never the whole tree.
 */
import { useSyncExternalStore } from 'react'
import { createTransport } from '@kolkrabbi/kol-hardware/signal'
import { anyLiveSourceActive } from './sources'

/* THE CLOCK IS THE DS'S (TransportFromHardware, kol-hardware 0.8.0, 2026-10-28): one `createTransport()` — mirror's and this
 * file's clock merged. `phase()` is `t` (0..1 in the loop, the loops' `u`), `epoch` bumps on stop and rewind only (never
 * pause), `setLoopSeconds` moves the window's out point. What stays here: the pointer and stage inputs, `pointerInterest`,
 * live sources and the per-frame notify for bound layers. The hand-rolled clock is in `_tmp/2026-10-28-transport-from-hardware/`. */
const clock = createTransport({ loopIn: 0, loopOut: 4, looping: true })

let mouse       = { x: 0.5, y: 0.5 }
let stage       = null   /* pointer in virtual-canvas px (CanvasArea feeds it) */
let version     = 0

const subs   = new Set()
let raf      = null
/* Pointer-binding interest — toggled by the compose layer-state watcher
 * whenever any layer carries a mouse/stage-driven binding. Mousemove /
 * stage-pointer notifies are gated on it, so an editor with zero pointer
 * bindings pays nothing for cursor movement (position state still updates,
 * so getCtx is fresh the moment a binding appears). */
let pointerInterest = false

function notify() { version++; subs.forEach((cb) => cb()) }
/* every change of the clock's state (play, pause, stop, rewind, seek, loop length) is a tick for the subscribers */
clock.subscribe(notify)

function tick() {
  if (clock.playing) notify()
  else if (subs.size > 0 && anyLiveSourceActive()) {
    /* Live sources (audio, gamepad) change outside play/mouse events —
     * bound layers must re-sample per frame even while paused. */
    notify()
  }
  /* Keep the loop alive only while it has work (playing or subscribers). */
  if (clock.playing || subs.size > 0) raf = requestAnimationFrame(tick)
  else raf = null
}
function ensureRaf() { if (raf == null) raf = requestAnimationFrame(tick) }

/* Live pointer → normalized 0..1 over the window. Notifies so mouse-bound
 * params update even when the transport is paused (modulation is live).
 * Pointer events, not mousemove: one API covers mouse, touch, and pen —
 * touch devices never fire mousemove, so the mouse source was dead on the
 * randomizer. pointerdown makes a bare tap/click set the position too
 * (touch has no hover). */
if (typeof window !== 'undefined') {
  const trackPointer = (e) => {
    mouse = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    if (pointerInterest && subs.size > 0) notify()
  }
  window.addEventListener('pointermove', trackPointer)
  window.addEventListener('pointerdown', trackPointer)
}

export const transport = {
  play()  { clock.play(); ensureRaf() },
  pause() { clock.pause() },
  toggle() { clock.playing ? transport.pause() : transport.play() },
  seek(frac) { clock.seekPhase(frac) },
  /* Stop = pause + rewind + new epoch; rewind keeps the play state. Both are
   * the ONLY epoch writers (pause-coherence) — the clock's stop and home. */
  stop()   { clock.stop() },
  rewind() { clock.home() },
  /* the head keeps its place IN the loop when the length changes (the clock alone keeps seconds, so a shorter loop jumped it) */
  setLoopSeconds(s) { const u = clock.phase(); clock.setLoopSeconds(s); clock.seekPhase(u) },
  isPlaying() { return clock.playing },
  getLoopSeconds() { return clock.loopSeconds },
  getT() { return clock.phase() },
  getEpoch() { return clock.epoch },
  getCtx() { return { t: clock.phase(), mouse, stage, epoch: clock.epoch } },
  /* the DS clock itself — for kol-hardware's faces (`Scrubber`, `TimeStrip`), which read it directly */
  clock,
  /* Stage pointer in virtual px — feeds the layer-local pointer sources and
   * sim pointer forces. `down` carries the button/touch-contact state so
   * sims can distinguish hover-repel from grab-drag (2026-08-09); existing
   * callers that omit it read as up. Notifies like mousemove so
   * paused-but-bound layers track it. */
  setStagePointer(x, y, down = false) {
    stage = x == null ? null : { x, y, down: !!down }
    if (pointerInterest && subs.size > 0) notify()
  },
  /* See `pointerInterest` above — compose state scans layers for pointer
   * bindings and flips this so unbound editors skip pointer notifies. */
  setPointerInterest(on) { pointerInterest = !!on },
}

function subscribe(cb)   { subs.add(cb); ensureRaf(); return () => subs.delete(cb) }
function subscribeNever() { return () => {} }
function getVersion()    { return version }

/* Per-frame ctx for the resolver. enabled=false → stable no-op subscription
 * (never re-renders) so static layers are free. */
export function useTransportCtx(enabled) {
  useSyncExternalStore(enabled ? subscribe : subscribeNever, getVersion, getVersion)
  return transport.getCtx()
}

/* Transport UI hook — play state + loop duration, re-renders on any tick. */
export function useTransport() {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return {
    playing: clock.playing,
    loopSeconds: clock.loopSeconds,
    t: clock.phase(),
    play:  transport.play,
    pause: transport.pause,
    toggle: transport.toggle,
    seek: transport.seek,
    stop: transport.stop,
    rewind: transport.rewind,
    setLoopSeconds: transport.setLoopSeconds,
  }
}

/* Snapshot hooks — re-render ONLY when the snapshot value changes (not per
 * tick), so a plain <video> layer can follow play/pause/reset without paying
 * the 60fps subscription the bound-layer renderers do. */
const getPlaying = () => clock.playing
const getEpoch   = () => clock.epoch
export function useTransportPlaying() {
  return useSyncExternalStore(subscribe, getPlaying, getPlaying)
}
export function useTransportEpoch() {
  return useSyncExternalStore(subscribe, getEpoch, getEpoch)
}
