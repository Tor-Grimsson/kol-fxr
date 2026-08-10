import { useEffect, useState } from 'react'
import { Input, Dropdown, ViewToggle, ToggleSwitch, LabeledControl, Textarea } from '@kolkrabbi/kol-component'
import { visibleParams, isAnimatable, paramTab, paramSection } from './schema'
import { isBinding, resolveValue } from './resolve'
import { useTransportCtx } from './transport'
import { compileExpr } from './expr'
import { ColorField } from '../compose/inspectors/ColorField'

/**
 * AutoControls — renders a layer's tunable params from a declared schema
 * (params/schema.js), replacing hand-wired per-type inspector JSX. One code
 * path for every layer type and, later, every imported generator/effect.
 *
 * Writes go through `setProp` (the caller's useLayerEdit path — history +
 * coalescing intact). Conditional params (`when`) hide/show live.
 *
 * `renderAnimate` (optional) is called for each animatable param and rendered
 * beside its control — the seam the timeline uses to add keyframe/modulation
 * bindings without AutoControls knowing about the transport.
 *
 * `tab` (optional) renders only params whose resolved sub-tab matches
 * ('generate' | 'style' | 'anim' — see paramTab); absent renders all.
 * Consecutive same-section params share one small header; `emptyHint`
 * renders when the filter leaves nothing (the Animation tab's hint line).
 *
 * `inline` (labs skin): rows go label-left (LabeledControl's own inline
 * layout), toggles become the DS ToggleSwitch, colors go inline too. The
 * editor default stays label-above. Sections always wrap in a
 * `.kol-params-section` block — same spacing as before (outer gap = inner
 * gap), but a hook labs.css can tighten and divide.
 */
export default function AutoControls({ schema, layer, setProp, palette, renderAnimate, tab, emptyHint, inline = false }) {
  let params = visibleParams(schema, layer)
  if (tab) params = params.filter((p) => paramTab(p) === tab)
  if (params.length === 0) {
    return emptyHint ? <p className="kol-mono-12 text-meta">{emptyHint}</p> : null
  }
  const groups = []
  for (const p of params) {
    const section = paramSection(p)
    const last = groups[groups.length - 1]
    if (last && last.section === section) last.params.push(p)
    else groups.push({ section, params: [p] })
  }
  return (
    <>
      {groups.map((g) => (
        <div key={g.params[0].key} className="kol-params-section flex flex-col gap-4">
          {/* A section whose first param carries the same word as its label
              ("Geometry" header over a "Geometry" select) prints doubled —
              the param's own label already says it, so the header drops. */}
          {g.section && g.section !== g.params[0].label && (
            <span className="kol-helper-10 text-meta">{g.section}</span>
          )}
          {g.params.map((p) => {
            const bound = isBinding(layer[p.key])
            const animate = renderAnimate && isAnimatable(p) ? renderAnimate(p, bound) : null
            return (
              <ParamControl
                key={p.key}
                param={p}
                layer={layer}
                setProp={setProp}
                palette={palette}
                bound={bound}
                animate={animate}
                inline={inline}
              />
            )
          })}
        </div>
      ))}
    </>
  )
}

/* RangeField — the range control with DIRECT INPUT. One editable box does it
 * all (TouchDesigner-style): type a NUMBER → constant; type an EXPRESSION like
 * `sin(t)` → binds it to the expression source (shape it further in the
 * Animation tab). While bound, the track is read-only and its thumb TRACKS the
 * live resolved value every transport tick — so you see the modulation move —
 * and the box shows the expression (editable) or the live value. Subscribes to
 * the transport only when bound, so unbound params pay nothing. */
function RangeField({ param: p, layer, setProp }) {
  const raw = layer[p.key]
  const bound = isBinding(raw)
  const boundExpr = bound && raw.bind === 'mod' && raw.source === 'expr'
  const ctx = useTransportCtx(bound)
  const live = bound ? resolveValue(raw, ctx, layer) : raw
  const numVal = typeof live === 'number' ? live : (p.default ?? 0)

  /* labs' decimals rule: digits after the point in `step` itself
   * (0.025 → 3, 0.05 → 2, ≥1 → 0) — Slider.jsx:129, verified 2026-08-09. */
  const stepDecimals = p.step && p.step < 1 ? (String(p.step).split('.')[1]?.length ?? 2) : 0
  const shown = boundExpr
    ? (raw.transform?.expr ?? 'wave(t)')
    : (p.format ? String(p.format(numVal)) : (stepDecimals ? numVal.toFixed(stepDecimals) : String(Math.round(numVal))))
  const [draft, setDraft] = useState(shown)
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!editing) setDraft(shown) }, [shown, editing])

  const commit = () => {
    setEditing(false)
    const s = draft.trim()
    if (s === '') { setDraft(shown); return }
    const n = Number(s)
    if (Number.isFinite(n)) {                       /* a number → constant */
      /* UNCLAMPED — the slider range is drag ergonomics, never a validity
       * ceiling; typed input outranks the rail (user law 2026-08-09). The
       * thumb pins at the rail end for out-of-range values. */
      setProp(p.key, n)
      return
    }
    const compiled = compileExpr(s)                 /* else → expression binding */
    if (!compiled.ok) { setDraft(shown); return }   /* won't compile → revert */
    const range = (bound && raw.transform?.range) || (p.min != null && p.max != null ? [p.min, p.max] : [0, 1])
    setProp(p.key, { bind: 'mod', source: 'expr', transform: { ...(bound ? raw.transform : {}), expr: s, range } })
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={p.min} max={p.max} step={p.step ?? 1}
        value={numVal}
        disabled={bound}
        onChange={(e) => setProp(p.key, Number(e.target.value))}
        className="slider-black flex-1 w-full cursor-pointer"
        style={bound ? { opacity: 0.7 } : undefined}
      />
      <Input
        type="text" variant="filled" size="sm" chars={6}
        value={draft}
        title="Number sets a constant · an expression like sin(t) binds it"
        onFocus={(e) => { setEditing(true); e.target.select() }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setDraft(shown); setEditing(false); e.currentTarget.blur() }
        }}
        inputClassName="text-center"
      />
    </div>
  )
}

/* labs' inline label column — wide enough for "ORIGINAL COLOR". */
const INLINE_LABEL_W = 96

function ParamControl({ param: p, layer, setProp, palette, bound, animate, inline }) {
  const raw = layer[p.key]
  const value = raw === undefined ? p.default : raw

  /* Color params route straight to ColorField (its own swatch popover). */
  if (p.type === 'color') {
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <ColorField label={p.label} value={value} onChange={(v) => setProp(p.key, v)} palette={palette} inline={inline} />
        </div>
        {animate}
      </div>
    )
  }

  /* Inline rows keep only the row-shaped controls; selects and text stay
   * label-above in both skins (labs' own dropdowns are label-above too). */
  let rowInline = inline
  let control = null
  if (p.type === 'range') {
    /* Direct input + live modulation readout, both in one field (RangeField):
     * type a number for a constant or an expression to bind it; a bound track
     * shows the resolved value moving. */
    control = <RangeField param={p} layer={layer} setProp={setProp} />
    if (inline) {
      /* Labs row: natural-width UPPERCASE label, track takes the rest —
       * a fixed label column starves the track in a 300px rail. */
      return (
        <div className="flex items-center gap-3">
          <span className="kol-helper-10 tracking-widest text-meta whitespace-nowrap">{p.label}</span>
          <div className="flex-1 min-w-0">{control}</div>
          {animate}
        </div>
      )
    }
  } else if (p.type === 'select') {
    rowInline = false
    control = (
      <Dropdown
        variant="subtle" size="sm" className="w-full"
        options={p.options ?? []}
        value={value}
        onChange={(v) => setProp(p.key, p.numeric ? Number(v) : v)}
      />
    )
    if (inline) {
      /* Labs authors select labels sentence-case (section-header treatment),
       * so they skip the uppercase label pair the row controls use. */
      return (
        <div className="flex flex-col gap-2">
          <span className="kol-helper-10 text-meta">{p.label}</span>
          {animate ? <div className="flex items-center gap-2"><div className="flex-1 min-w-0">{control}</div>{animate}</div> : control}
        </div>
      )
    }
  } else if (p.type === 'segmented') {
    rowInline = false
    control = (
      <ViewToggle
        options={p.options ?? []}
        viewMode={value}
        onViewChange={(v) => setProp(p.key, v)}
      />
    )
  } else if (p.type === 'toggle') {
    /* boolean stored as-is. Editor: off/on segmented cells; labs (inline):
     * the DS ToggleSwitch, right-aligned — unless `labels` carries meaning
     * the switch can't (`['Clip', 'Visible']`), which keeps the cells. */
    const [offLabel, onLabel] = p.labels ?? ['Off', 'On']
    if (inline && !p.labels) {
      /* Label + switch span the row freely — a fixed label column would wrap
       * the longer toggle labels ("ORIGINAL COLOR"). */
      return (
        <div className="flex items-center gap-3">
          <span className="kol-helper-10 tracking-widest text-meta whitespace-nowrap">{p.label}</span>
          <div className="flex-1" />
          <ToggleSwitch size="sm" checked={!!value} onChange={(v) => setProp(p.key, v)} />
          {animate}
        </div>
      )
    } else {
      rowInline = false
      control = (
        <ViewToggle
          options={[{ value: 'off', label: offLabel }, { value: 'on', label: onLabel }]}
          viewMode={value ? 'on' : 'off'}
          onViewChange={(v) => setProp(p.key, v === 'on')}
        />
      )
    }
  } else if (p.type === 'text') {
    rowInline = false
    /* filled, NEVER ghost/outline — ghost resolves to outline since the
     * 2026-07-08 chrome law, and text inputs are filled in this app. */
    control = (
      <Textarea
        variant="filled" size="sm" rows={p.rows ?? 2}
        value={value ?? ''}
        onChange={(e) => setProp(p.key, e.target.value)}
        placeholder={p.placeholder}
      />
    )
  } else {
    return null
  }

  const hint = p.type === 'range' && p.format && typeof value === 'number' && !bound ? p.format(value) : undefined
  return (
    <LabeledControl label={p.label} hint={hint} inline={rowInline} labelWidth={INLINE_LABEL_W}>
      {animate ? <div className="flex items-center gap-2"><div className="flex-1 min-w-0">{control}</div>{animate}</div> : control}
    </LabeledControl>
  )
}
