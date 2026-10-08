import { useEffect, useMemo, useRef, useState } from 'react'
import { Dropdown, Input, Tooltip, useGrabEdge } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
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
 *   [selected key: value · easing · delete]  [curve: the segment's bezier, two handles]
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

const secs = (frac, len) => `${(frac * len).toFixed(2)}`

/* Click/drag to seek. */
function ScrubRuler({ t, len, onSeek }) {
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
          <button type="button" aria-label={folded ? 'Show the morph’s tracks' : 'Hide the morph’s tracks'} aria-expanded={!folded} onClick={onFold} className="text-meta hover:text-emphasis shrink-0" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <Icon name="chevron-down" size={12} className={folded ? '-rotate-90' : ''} />
          </button>
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
const W = 120, H = 80, PAD = 8
const bezOf = (easing) => (Array.isArray(easing) ? easing : EASINGS[easing] ?? null)
/* the unit square onto the SVG (y up) */
const sx = (x) => PAD + x * (W - 2 * PAD)
const sy = (y) => H - PAD - y * (H - 2 * PAD)
function CurveEditor({ easing, onChange }) {
  const ref = useRef(null)
  const bez = bezOf(easing)
  const drag = useRef(null)
  if (!bez) return <p className="kol-helper-10 text-meta">Hold — no curve.</p>
  const [x1, y1, x2, y2] = bez
  const toUnit = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H
    return [Math.min(1, Math.max(0, (x - PAD) / (W - 2 * PAD))), Math.min(1.5, Math.max(-0.5, (H - PAD - y) / (H - 2 * PAD)))]
  }
  const down = (which) => (e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = which }
  const move = (e) => {
    if (drag.current == null) return
    const [x, y] = toUnit(e)
    const next = drag.current === 1 ? [x, y, x2, y2] : [x1, y1, x, y]
    onChange(next.map((v) => Math.round(v * 100) / 100))
  }
  const up = () => { drag.current = null }
  return (
    <svg ref={ref} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0 rounded" style={{ background: 'var(--kol-fg-04)', touchAction: 'none' }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--kol-fg-16)" strokeWidth={1} />
      <path d={`M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)}, ${sx(x2)} ${sy(y2)}, ${sx(1)} ${sy(1)}`} fill="none" stroke="var(--kol-fg-emphasis)" strokeWidth={1.5} />
      <line x1={sx(0)} y1={sy(0)} x2={sx(x1)} y2={sy(y1)} stroke="var(--kol-accent-primary)" strokeWidth={1} />
      <line x1={sx(1)} y1={sy(1)} x2={sx(x2)} y2={sy(y2)} stroke="var(--kol-accent-primary)" strokeWidth={1} />
      <circle cx={sx(x1)} cy={sy(y1)} r={4} fill="var(--kol-accent-primary)" style={{ cursor: 'grab' }} onPointerDown={down(1)} />
      <circle cx={sx(x2)} cy={sy(y2)} r={4} fill="var(--kol-accent-primary)" style={{ cursor: 'grab' }} onPointerDown={down(2)} />
    </svg>
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
        <button
          type="button"
          className="kol-helper-10 text-meta hover:text-emphasis px-2"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (track.keys.length > 1) writeKeys(track, track.keys.filter((_, i) => i !== selected.index))
            setSelected(null)
          }}
        >
          Delete key
        </button>
        <button
          type="button"
          className="kol-helper-10 text-meta hover:text-emphasis px-2 ml-auto"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setSelected(null)}
        >
          Close
        </button>
      </div>
      {/* the segment from this key to the next; the last key has no segment */}
      {selected.index < track.keys.length - 1 && <CurveEditor easing={key.easing} onChange={(bez) => patchKey({ easing: bez })} />}
    </div>
  )
}

/* the dock's height — the lanes scroll inside it; remembered per browser */
const DOCK_KEY = 'kol-fxr:dock-h'
const DOCK_MIN = 56, DOCK_MAX = 480
const readDockH = () => { try { const n = Number(localStorage.getItem(DOCK_KEY)); return n >= DOCK_MIN ? n : null } catch { return null } }

function DockGrab({ onDrag, onEnd }) {
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
    />
  )
}

export default function TimelineDock() {
  const { layers, updateLayer } = useComposeState()
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
  const toggleFold = (id) => setFolded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const shown = tracks.filter((tr) => !(tr.under && folded.has(tr.under)))

  return (
    <div className="kol-timeline-dock relative border-t border-oq-08 px-4 py-2 flex flex-col gap-1 select-none" style={{ background: 'var(--kol-surface-primary)', height: dockH ?? undefined, maxHeight: dockH ? undefined : DOCK_MAX }}>
      <DockGrab
        onDrag={(dy) => { if (base.current == null) base.current = dockH ?? 0; setDockH(Math.min(DOCK_MAX, Math.max(DOCK_MIN, (base.current || 120) + dy))) }}
        onEnd={() => { base.current = null }}
      />
      <ScrubRuler t={t} len={loopSeconds} onSeek={seek} />
      <div className="flex flex-col gap-1 min-h-0 overflow-y-auto">
        {shown.map((track) => (
          <TrackRow key={track.id} track={track} t={t} len={loopSeconds} selected={selected} setSelected={setSelected} writeKeys={writeKeys}
            folded={folded.has(track.id)} onFold={track.header && tracks.some((x) => x.under === track.id) ? () => toggleFold(track.id) : null} />
        ))}
      </div>
      <SelectedKeyEditor tracks={tracks} selected={selected} setSelected={setSelected} writeKeys={writeKeys} len={loopSeconds} />
    </div>
  )
}
