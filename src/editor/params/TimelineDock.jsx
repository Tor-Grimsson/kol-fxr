import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dropdown, Input, Tooltip, useGrabEdge } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { labelForLayer } from '../compose/labels'
import { keysFor } from '../morph/buildMorph'
import { setMorph } from '../morph/morphStore'
import { EASINGS, EASING_OPTIONS } from './easing'
import { isBinding } from './resolve'
import { useTransport } from './transport'

/**
 * TimelineDock — the keyframe timeline under the canvas (the motion pack's `canvas.footer`).
 *
 *   [grab — drag to resize the dock]
 *   [time / length s] [scrub ruler ................................ playhead]
 *   [morph name     ] [header lane: ◆ step names — a name pressed edits that step] [▸ folds its param lanes]
 *   [track label    ] [lane: ◆ diamonds at t · click adds · drag moves · alt-click deletes]
 *   [selected key's lane, opened tall: the value graph — keys at (t, v), segments, handles]
 *   [selected key: value · easing · delete]
 *
 * THIS FILE IS THE DOCK AGAIN (plan 14 § 1, 2026-10-08). It was lifted into kol-component as
 * `organisms/TimelineDock` on 2026-09-27 (editor DS sync 3c) and this file became a wrapper; every
 * change was then a DS round trip, which the user ruled out for editor work (plan 06). The 0.244.0
 * source came back here whole — the editor's couplings (`collectTracks` over the layer tree, the
 * transport clock, the write through `updateLayer`) folded in, the DS atoms it draws with still
 * the package's. Renders nothing while there are no tracks. Drags commit on pointer-up — one write
 * per gesture, one undo entry.
 *
 * What came with it (plan 14):
 *   § 6  the counter reads TIME against the transport's length (`3.28 / 4.00 s`), not the 0–1 loop
 *        fraction the user read as a timer; the key tooltips and the key editor in seconds too.
 *   § 7  a morph is ONE layer (it saves, bakes, exports as one) — its lane is a header carrying the
 *        step names on its keys; in Blend every differing param is its own track, folded under the
 *        header (a chevron), never named per step. A name pressed asks the Morph rail to edit it.
 *   § 8  the dock resizes by its top edge (the DS grab gesture, `useGrabEdge` — the pill travels
 *        the edge, `axis: 'x'`), the lanes scrolling inside; and a selected key opens its segment's
 *        CURVE — `easing.js` is cubic-bezier already, a named preset is a tuple, so two handles on
 *        an SVG write `[x1, y1, x2, y2]` and the menu reads `Custom`.
 */

/* Sample a track's value at t (linear across the segment — good enough for the "add key without a
 * jump" affordance). */
export function sampleTrack(keys, t) {
  if (keys.length === 0) return 0
  if (t <= keys[0].t) return keys[0].v
  const last = keys[keys.length - 1]
  if (t >= last.t) return last.v
  let i = 0
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++
  const a = keys[i], b = keys[i + 1]
  if (typeof a.v !== 'number' || typeof b.v !== 'number') return a.v
  const span = b.t - a.t || 1
  return a.v + (b.v - a.v) * ((t - a.t) / span)
}

/* Walk the layer tree, collecting every keyframe-track binding. A morph layer (`morph.steps`)
 * contributes a HEADER first — its `morphT` track in Shape / Crossfade, a synthetic one (read-only,
 * the step positions the cycle gives) in Blend — and its other tracks `under` it. */
function collectTracks(layers, out = []) {
  for (const l of layers) {
    const steps = Array.isArray(l.morph?.steps) ? l.morph.steps : null
    if (steps?.length) {
      const name = l.morph.name || 'Morph'
      const names = (keys) => keys.map((k) => steps[((Math.round(k.v) % steps.length) + steps.length) % steps.length]?.label ?? '')
      const mt = isBinding(l.morphT) && l.morphT.bind === 'track' ? l.morphT : null
      const keys = mt ? mt.keys : keysFor(steps.map((_, i) => i), l.morph.cycle ?? 'loop', l.morph.curve ?? 'in-out')
      out.push({ id: `${l.id}:morph`, layerId: l.id, key: 'morphT', label: name, keys, header: true, readOnly: !mt, names: names(keys), steps: steps.length })
    }
    for (const k in l) {
      if (k === 'morphT' && steps?.length) continue
      const v = l[k]
      if (isBinding(v) && v.bind === 'track') out.push({ id: `${l.id}:${k}`, layerId: l.id, key: k, label: `${labelForLayer(l)} · ${k}`, keys: v.keys, under: steps?.length ? `${l.id}:morph` : null })
    }
    if (Array.isArray(l.children)) collectTracks(l.children, out)
  }
  return out
}

/* SYNC LOOP (the user, 2026-10-09: "a button to sync the loops in and out points so it's a seamless
 * transition"): the out point takes the in point's value — a key at t 0 if there was none, every key
 * at or past the end replaced by one at t 1 holding the start value — so the wrap does not jump. */
export function syncLoopKeys(keys) {
  if (!keys.length) return keys
  const v0 = sampleTrack(keys, 0)
  const body = keys.filter((k) => k.t > 0 && k.t < 1)
  const first = keys.find((k) => k.t <= 0) ?? { ...keys[0], t: 0, v: v0 }
  /* the end key carries no easing — the segment INTO it is the previous key's */
  return [{ ...first, t: 0, v: v0 }, ...body, { t: 1, v: v0 }]
}

const secs = (frac, len) => `${(frac * len).toFixed(2)}`

/* Click/drag to seek. */
function ScrubRuler({ t, len, onSeek, onSyncLoop }) {
  const ref = useRef(null)
  const fracFromEvent = (e) => {
    const r = ref.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  }
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    onSeek?.(fracFromEvent(e))
  }
  const onPointerMove = (e) => {
    if (e.buttons & 1) onSeek?.(fracFromEvent(e))
  }
  return (
    <div className="flex items-center gap-3">
      <Tooltip label="Time / loop length" asChild>
        <span className="kol-mono-12 text-meta tabular-nums shrink-0 text-right whitespace-nowrap" style={{ width: 120 }}>{secs(t, len)} / {len.toFixed(2)} s</span>
      </Tooltip>
      <div
        ref={ref}
        className="relative flex-1 h-4 cursor-ew-resize rounded"
        style={{ background: 'var(--kol-fg-04)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        <Playhead t={t} />
      </div>
      {onSyncLoop && (
        <Tooltip label="Sync loop — the end takes the start's values, so the loop is seamless" asChild>
          <Button tone="ghost" quiet size="xs" iconOnly="repeat" aria-label="Sync loop" className="shrink-0" onClick={onSyncLoop} />
        </Tooltip>
      )}
    </div>
  )
}

function Playhead({ t }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0 bottom-0"
      style={{ left: `${t * 100}%`, width: 1.5, background: 'var(--kol-accent-primary)' }}
    />
  )
}

function TrackRow({ track, t, len, selected, setSelected, writeKeys, folded, onFold }) {
  const laneRef = useRef(null)
  /* Local drag state — committed once on pointer-up. */
  const drag = useRef(null)
  const [, force] = useState(0)
  const header = !!track.header
  const readOnly = !!track.readOnly

  const fracFromEvent = (e) => {
    const r = laneRef.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  }

  const isSel = (i) => selected && selected.trackId === track.id && selected.index === i

  const onLanePointerDown = (e) => {
    if (e.target.dataset.diamond !== undefined || e.target.dataset.name !== undefined || readOnly) return
    /* Add a key at the click position, valued at the track's current value there (no visual
     * jump), then select it. */
    const clickT = fracFromEvent(e)
    const v = sampleTrack(track.keys, clickT)
    const next = [...track.keys, { t: clickT, v, easing: 'linear' }].sort((a, b) => a.t - b.t)
    writeKeys(track, next)
    setSelected({ trackId: track.id, index: next.findIndex((k) => k.t === clickT) })
  }

  const onDiamondPointerDown = (i) => (e) => {
    e.stopPropagation()
    if (readOnly) return
    if (e.altKey) {
      /* alt-click deletes (min 1 key stays — an empty track is a broken binding) */
      if (track.keys.length > 1) {
        writeKeys(track, track.keys.filter((_, j) => j !== i))
        setSelected(null)
      }
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { index: i, t: track.keys[i].t }
    setSelected({ trackId: track.id, index: i })
  }
  const onDiamondPointerMove = (i) => (e) => {
    if (!drag.current || drag.current.index !== i) return
    drag.current.t = fracFromEvent(e)
    force((n) => n + 1)
  }
  const onDiamondPointerUp = (i) => () => {
    if (!drag.current || drag.current.index !== i) return
    const moved = { ...track.keys[i], t: drag.current.t }
    drag.current = null
    if (moved.t === track.keys[i].t) return   /* a click: it stays selected, the key editor opens */
    const next = track.keys.map((k, j) => (j === i ? moved : k)).sort((a, b) => a.t - b.t)
    writeKeys(track, next)
    setSelected({ trackId: track.id, index: next.indexOf(moved) })
  }
  /* a step name pressed on the header: the Morph rail edits that step (plan 14 § 7) */
  const editStep = (i) => (e) => { e.stopPropagation(); setMorph({ editRequest: ((Math.round(track.keys[i].v) % track.steps) + track.steps) % track.steps }) }

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-end gap-1 shrink-0" style={{ width: 120 }}>
        <Tooltip label={track.label} asChild>
          <span className={`${header ? 'kol-mono-12 text-emphasis' : 'kol-helper-10 text-meta'} truncate text-right`}>{track.label}</span>
        </Tooltip>
        {header && onFold && (
          <Button tone="ghost" quiet size="xs" iconOnly="chevron-down" aria-label={folded ? 'Show the morph’s tracks' : 'Hide the morph’s tracks'} aria-expanded={!folded} onClick={onFold} className={`shrink-0 ${folded ? '-rotate-90' : ''}`} />
        )}
      </span>
      <div
        ref={laneRef}
        className={`relative flex-1 h-5 rounded ${readOnly ? '' : 'cursor-copy'}`}
        style={{ background: header ? 'var(--kol-fg-08)' : 'var(--kol-fg-04)' }}
        onPointerDown={onLanePointerDown}
      >
        <Playhead t={t} />
        {track.keys.map((k, i) => {
          const kt = drag.current?.index === i ? drag.current.t : k.t
          const name = header ? track.names?.[i] : null
          const tip = header ? `${name} · ${secs(kt, len)} s` : `${secs(kt, len)} s · v=${typeof k.v === 'number' ? Math.round(k.v * 100) / 100 : k.v} (alt-click deletes)`
          return (
            <Tooltip key={i} label={tip} asChild>
            <span
              data-diamond=""
              onPointerDown={onDiamondPointerDown(i)}
              onPointerMove={onDiamondPointerMove(i)}
              onPointerUp={onDiamondPointerUp(i)}
              className={`absolute top-1/2 ${readOnly ? '' : 'cursor-grab'}`}
              style={{
                left: `${kt * 100}%`,
                width: 9, height: 9,
                transform: 'translate(-50%, -50%) rotate(45deg)',
                background: isSel(i) ? 'var(--kol-accent-primary)' : 'var(--kol-fg-emphasis)',
                borderRadius: 1.5,
              }}
            />
            </Tooltip>
          )
        })}
        {/* the step names, after each diamond; the last one (the closing key) sits before its diamond */}
        {header && track.keys.map((k, i) => {
          const kt = drag.current?.index === i ? drag.current.t : k.t
          const last = i === track.keys.length - 1 && kt > 0.5
          return (
            <button
              key={`n${i}`} type="button" data-name="" onPointerDown={(e) => e.stopPropagation()} onClick={editStep(i)}
              aria-label={`Edit step ${track.names?.[i]}`}
              className="absolute top-0 bottom-0 kol-helper-10 text-meta hover:text-emphasis truncate"
              style={{ left: last ? undefined : `calc(${kt * 100}% + 8px)`, right: last ? `calc(${(1 - kt) * 100}% + 8px)` : undefined, maxWidth: `${100 / track.keys.length}%`, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {track.names?.[i]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── the curve (plan 14 § 8) ── */
const bezOf = (easing) => (Array.isArray(easing) ? easing : EASINGS[easing] ?? null)
/* THE VALUE GRAPH (the user, 2026-10-09: "bezier handles … should connect with keymarks on timeline
 * using the height, ref adobe, davinci"). The lane of the selected key opens tall: each key at
 * (time, value), each segment drawn as its real cubic-bezier, the handles hanging off the keys they
 * belong to — out of key i, into key i+1. A handle writes the segment's `[x1, y1, x2, y2]` (x held to
 * the segment, y free, so it can overshoot); a key drags in time and value. One write per gesture. */
const GH = 132, GPAD = 14
function GraphLane({ track, writeKeys, selected, setSelected }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  const [live, setLive] = useState(null)   /* the keys mid-gesture, committed on pointer-up */
  const drag = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const keys = live ?? track.keys
  const vals = keys.map((k) => k.v)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (drag.current?.range) [lo, hi] = drag.current.range   /* the scale holds still while dragging */
  if (hi - lo < 1e-9) { lo -= 1; hi += 1 }
  const X = (t) => t * w
  const Y = (v) => GPAD + (1 - (v - lo) / (hi - lo)) * (GH - 2 * GPAD)
  const fromPx = (e) => {
    const r = ref.current.getBoundingClientRect()
    return { t: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), v: lo + (1 - (e.clientY - r.top - GPAD) / (GH - 2 * GPAD)) * (hi - lo) }
  }
  const segs = keys.slice(0, -1).map((a, i) => {
    const b = keys[i + 1]
    const bez = a.easing === 'hold' ? null : bezOf(a.easing ?? 'linear') ?? EASINGS.linear
    return { i, a, b, bez }
  })
  const start = (kind, i) => (e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { kind, i, range: [lo, hi], moved: false }
    if (kind === 'key') setSelected({ trackId: track.id, index: i })
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    d.moved = true
    const p = fromPx(e)
    const next = keys.map((k) => ({ ...k }))
    if (d.kind === 'key') {
      const prevT = next[d.i - 1]?.t ?? 0, nextT = next[d.i + 1]?.t ?? 1
      next[d.i].t = Math.min(nextT, Math.max(prevT, p.t))
      next[d.i].v = p.v
    } else {
      /* out-handle of segment i = control point 1, in-handle = control point 2, in the segment's unit box */
      const a = next[d.i], b = next[d.i + 1]
      const dt = b.t - a.t || 1e-6, dv = Math.abs(b.v - a.v) > 1e-9 ? b.v - a.v : (hi - lo)
      const ux = Math.min(1, Math.max(0, (p.t - a.t) / dt)), uy = (p.v - a.v) / dv
      const bez = [...(bezOf(a.easing ?? 'linear') ?? EASINGS.linear)]
      if (d.kind === 'out') { bez[0] = ux; bez[1] = uy } else { bez[2] = ux; bez[3] = uy }
      a.easing = bez.map((n) => Math.round(n * 1000) / 1000)
    }
    setLive(next)
  }
  const end = () => {
    const d = drag.current
    drag.current = null
    if (d?.moved && live) {
      const moved = live[d.i]
      writeKeys(track, live)
      if (d.kind === 'key') setSelected({ trackId: track.id, index: [...live].sort((p, q) => p.t - q.t).indexOf(moved) })
    }
    setLive(null)
  }
  const sel = selected?.trackId === track.id ? selected.index : -1
  const handle = (cx, cy, x0, y0, kind, i) => (
    <g key={`${kind}${i}`}>
      <line x1={x0} y1={y0} x2={cx} y2={cy} stroke="var(--kol-accent-primary)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={4} fill="var(--kol-surface-primary)" stroke="var(--kol-accent-primary)" strokeWidth={1.5} style={{ cursor: 'grab' }}
        onPointerDown={start(kind, i)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
    </g>
  )
  return (
    <div className="flex items-stretch gap-3">
      <span className="shrink-0 flex flex-col justify-between items-end kol-helper-10 text-meta tabular-nums py-2" style={{ width: 120 }}>
        <span>{Math.round(hi * 100) / 100}</span><span>{Math.round(lo * 100) / 100}</span>
      </span>
      <div ref={ref} className="relative flex-1 rounded" style={{ height: GH, background: 'var(--kol-fg-04)', touchAction: 'none' }}>
        {w > 0 && (
          <svg width={w} height={GH} className="absolute inset-0 overflow-visible">
            {segs.map(({ i, a, b, bez }) => (bez
              ? <path key={`s${i}`} d={`M ${X(a.t)} ${Y(a.v)} C ${X(a.t + bez[0] * (b.t - a.t))} ${Y(a.v + bez[1] * (b.v - a.v))}, ${X(a.t + bez[2] * (b.t - a.t))} ${Y(a.v + bez[3] * (b.v - a.v))}, ${X(b.t)} ${Y(b.v)}`} fill="none" stroke="var(--kol-fg-emphasis)" strokeWidth={1.5} />
              : <path key={`s${i}`} d={`M ${X(a.t)} ${Y(a.v)} H ${X(b.t)} V ${Y(b.v)}`} fill="none" stroke="var(--kol-fg-emphasis)" strokeWidth={1.5} strokeDasharray="3 3" />))}
            {/* handles on the segments either side of the selected key, After Effects' rule */}
            {segs.filter(({ i, bez }) => bez && (i === sel || i + 1 === sel)).map(({ i, a, b, bez }) => {
              const dv = Math.abs(b.v - a.v) > 1e-9 ? b.v - a.v : (hi - lo)
              return [
                i === sel ? handle(X(a.t + bez[0] * (b.t - a.t)), Y(a.v + bez[1] * dv), X(a.t), Y(a.v), 'out', i) : null,
                i + 1 === sel ? handle(X(a.t + bez[2] * (b.t - a.t)), Y(a.v + bez[3] * dv), X(b.t), Y(b.v), 'in', i) : null,
              ]
            })}
            {keys.map((k, i) => (
              <rect key={`k${i}`} x={X(k.t) - 4.5} y={Y(k.v) - 4.5} width={9} height={9} rx={1.5}
                transform={`rotate(45 ${X(k.t)} ${Y(k.v)})`}
                fill={i === sel ? 'var(--kol-accent-primary)' : 'var(--kol-fg-emphasis)'} style={{ cursor: 'grab' }}
                onPointerDown={start('key', i)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
const CURVE_OPTIONS = [...EASING_OPTIONS, { value: 'custom', label: 'Custom' }]

function SelectedKeyEditor({ tracks, selected, setSelected, writeKeys, len }) {
  if (!selected) return null
  const track = tracks.find((tr) => tr.id === selected.trackId)
  const key = track?.keys[selected.index]
  if (!key || track.readOnly) return null

  const patchKey = (patch) => {
    writeKeys(track, track.keys.map((k, i) => (i === selected.index ? { ...k, ...patch } : k)))
  }
  const isNum = typeof key.v === 'number'
  const easingName = Array.isArray(key.easing) ? 'custom' : (key.easing ?? 'linear')

  return (
    <div className="flex items-start gap-3 pt-1">
      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
        <span className="kol-helper-10 text-meta shrink-0">key @ {secs(key.t, len)} s</span>
        {!track.header && (
          <Input
            variant="ghost" size="sm" chars={7}
            type={isNum ? 'number' : 'text'}
            value={String(key.v)}
            onChange={(e) => patchKey({ v: isNum ? Number(e.target.value) || 0 : e.target.value })}
          />
        )}
        <Dropdown
          variant="subtle" size="sm"
          options={CURVE_OPTIONS}
          value={easingName}
          onChange={(v) => patchKey({ easing: v === 'custom' ? [...(bezOf(key.easing) ?? EASINGS['in-out'])] : v })}
        />
        <Button
          tone="ghost" quiet size="sm"
          onClick={() => {
            if (track.keys.length > 1) writeKeys(track, track.keys.filter((_, i) => i !== selected.index))
            setSelected(null)
          }}
        >
          Delete key
        </Button>
        <Button tone="ghost" quiet size="sm" className="ml-auto" onClick={() => setSelected(null)}>
          Close
        </Button>
      </div>
    </div>
  )
}

/* the dock's height — the lanes scroll inside it; remembered per browser */
const DOCK_KEY = 'kol-fxr:dock-h'
const DOCK_MIN = 56, DOCK_MAX = 480
const readDockH = () => { try { const n = Number(localStorage.getItem(DOCK_KEY)); return n >= DOCK_MIN ? n : null } catch { return null } }

function DockGrab({ onDrag, onEnd, onReset }) {
  const ref = useRef(null)
  const start = useRef(null)
  const [dragging, setDragging] = useState(false)
  useGrabEdge(ref, { axis: 'x' })
  return (
    <div
      ref={ref}
      className={`kol-timeline-grab ${dragging ? 'is-dragging' : ''}`.trim()}
      role="separator" aria-orientation="horizontal" aria-label="Resize the timeline"
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); start.current = e.clientY; setDragging(true) }}
      onPointerMove={(e) => { if (start.current == null) return; onDrag(start.current - e.clientY); }}
      onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); start.current = null; setDragging(false); onEnd?.() }}
      onPointerCancel={() => { start.current = null; setDragging(false); onEnd?.() }}
      /* double-click: back to the default height (the user, 2026-10-09) */
      onDoubleClick={onReset}
    />
  )
}

export default function TimelineDock() {
  const { layers, updateLayer, beginTransaction, commitTransaction } = useComposeState()
  const { t, seek, loopSeconds } = useTransport()
  const tracks = useMemo(() => collectTracks(layers), [layers])
  const [selected, setSelected] = useState(null)   /* { trackId, index } */
  const [folded, setFolded] = useState(() => new Set())
  const [dockH, setDockH] = useState(readDockH)   /* null = as tall as its lanes */
  const base = useRef(null)
  useEffect(() => { try { if (dockH) localStorage.setItem(DOCK_KEY, String(dockH)); else localStorage.removeItem(DOCK_KEY) } catch { /* private mode */ } }, [dockH])

  if (tracks.length === 0) return null

  const writeKeys = (track, nextKeys) => {
    const sorted = [...nextKeys].sort((a, b) => a.t - b.t)
    updateLayer(track.layerId, { [track.key]: { bind: 'track', keys: sorted } })
  }
  /* every editable lane at once, one undo entry */
  const syncLoop = () => {
    beginTransaction()
    /* not a morph's header: its keys are step indices and its cycle already wraps (Loop ends on N ≡ 0) */
    for (const tr of tracks) if (!tr.readOnly && !tr.header && tr.keys.length > 1) writeKeys(tr, syncLoopKeys(tr.keys))
    commitTransaction()
  }
  const toggleFold = (id) => setFolded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const shown = tracks.filter((tr) => !(tr.under && folded.has(tr.under)))

  return (
    <div className="kol-timeline-dock relative border-t border-oq-08 px-4 py-2 flex flex-col gap-1 select-none" style={{ background: 'var(--kol-surface-primary)', height: dockH ?? undefined, maxHeight: dockH ? undefined : DOCK_MAX }}>
      <DockGrab
        onDrag={(dy) => { if (base.current == null) base.current = dockH ?? 0; setDockH(Math.min(DOCK_MAX, Math.max(DOCK_MIN, (base.current || 120) + dy))) }}
        onEnd={() => { base.current = null }}
        onReset={() => setDockH(null)}
      />
      <ScrubRuler t={t} len={loopSeconds} onSeek={seek} onSyncLoop={syncLoop} />
      <div className="flex flex-col gap-1 min-h-0 overflow-y-auto">
        {shown.map((track) => (
          <Fragment key={track.id}>
            <TrackRow track={track} t={t} len={loopSeconds} selected={selected} setSelected={setSelected} writeKeys={writeKeys}
              folded={folded.has(track.id)} onFold={track.header && tracks.some((x) => x.under === track.id) ? () => toggleFold(track.id) : null} />
            {/* the selected key's lane opens as a value graph (numbers only; a morph header is step indices) */}
            {selected?.trackId === track.id && !track.header && !track.readOnly && track.keys.every((k) => typeof k.v === 'number') && (
              <GraphLane track={track} writeKeys={writeKeys} selected={selected} setSelected={setSelected} />
            )}
          </Fragment>
        ))}
      </div>
      <SelectedKeyEditor tracks={tracks} selected={selected} setSelected={setSelected} writeKeys={writeKeys} len={loopSeconds} />
    </div>
  )
}
