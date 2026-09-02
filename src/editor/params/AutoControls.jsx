import { useEffect, useState } from 'react'
import { Input, Dropdown, ViewToggle, ToggleSwitch, SegmentedToggle, LabeledControl, SettingsRow, LabeledControlSection, Textarea } from '@kolkrabbi/kol-component'
import Hint from '../components/Hint'
import { visibleParams, isAnimatable, paramTab, paramSection } from './schema'
import { isBinding, resolveValue } from './resolve'
import { useTransportCtx } from './transport'
import { compileExpr } from './expr'
import { ColorField } from '../compose/inspectors/ColorField'
import { useControlSize, RAIL_LABEL_W, stripClamp } from './controlSize'

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
 * `inline` (labs skin) IS THE DS SETTINGS ROW (`SettingsRow`, the approved
 * SettingsPanel organism — kol-component 0.104.0, `SettingsPanelApproved`).
 * That is the estate standard for a label + control row and kol-r2b2's
 * Display-settings drawer is the reference render: the label uppercased into
 * a fixed column, the control filling the rest, switches at the far right
 * (`align="end"`) and dropdowns across the row (`align="fill"`).
 *
 * Adopting it retires two local habits: the hand-passed `kol-helper-10
 * tracking-widest text-meta` label string, and the per-type `rowInline =
 * false` opt-outs that sent selects and segmenteds label-above while ranges
 * stayed label-left — which is exactly why the rail read ragged. Only `text`
 * still breaks the row: a textarea needs the full width to be usable.
 *
 * `labelWidth` is the one deviation from r2b2's 160 — this rail is a ~300px
 * inspector, not a drawer, so the column is narrower. Same component, same
 * shape, tuned width. The editor default (`inline` false) stays label-above.
 *
 * Sections are the DS `LabeledControlSection` with `divided` — the approved
 * organism's header, a real `kol-eyebrow text-fg-80` standing apart from its
 * row stack. It replaces `Section`/`InspectorSection`, whose label is the
 * `kol-helper-10 tracking-widest text-meta` string the estate stopped writing
 * (user, 2026-08-27) — same "labeled control group" idea, older type role.
 * The hairline still comes from `divided`; nothing here is styled locally.
 */
export default function AutoControls({ schema, layer, setProp, palette, renderAnimate, tab, emptyHint, inline = false }) {
  let params = visibleParams(schema, layer)
  if (tab) params = params.filter((p) => paramTab(p) === tab)
  if (params.length === 0) {
    return emptyHint ? <Hint>{emptyHint}</Hint> : null
  }
  const groups = []
  for (const p of params) {
    const section = paramSection(p)
    const last = groups[groups.length - 1]
    if (last && last.section === section) last.params.push(p)
    else groups.push({ section, params: [p] })
  }
  /* The PICKING CLUSTER break. A schema that authors no `section` collapses
   * into one flat group, so no boundary exists for a rule to land on — which
   * is why the generative rail had no divider anywhere. The repo already has
   * the rule for effect pages (LabsParams: the cluster is the preset param
   * plus the selects that follow it); this is that same rule, applied to the
   * sectionless group so every surface breaks in the same place: the leading
   * run of SELECTS is the picker, everything after it is parameters. */
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    if (g.section) continue
    let lead = 0
    while (lead < g.params.length && g.params[lead].type === 'select') lead++
    if (lead === 0 || lead === g.params.length) continue
    groups.splice(i, 1, { section: undefined, params: g.params.slice(0, lead) },
                        { section: undefined, params: g.params.slice(lead) })
    i++
  }
  return (
    <>
      {/* A section whose first param carries the same word as its label
          ("Geometry" header over a "Geometry" select) prints doubled — the
          param's own label already says it, so the header drops. */}
      {/* `divided` is the DS's between-siblings hairline (kol-component 0.46.0
          / kol-theme 0.43.0). It replaces the `.kol-params-section` hook class
          and the two rules kol-labs.css carried for it — that class existed only
          to reach these sections from CSS, which is exactly what the prop
          ends. Applied HERE, in the shared renderer, so effect AND generative
          pages divide alike: the unscoped behaviour ruled 2026-08-15, not the
          older `.kol-labs-fx`-fenced one.

          `gap-4` is gone deliberately. It fought Section's own `gap-2`, and
          kol-labs.css then out-specified it back to 8px — Section's default IS
          8px, so dropping both lands on the same rendering with nothing
          overriding anything. */}
      {groups.map((g) => (
        <LabeledControlSection
          key={g.params[0].key}
          label={g.section && g.section !== g.params[0].label ? g.section : undefined}
          divided
        >
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
        </LabeledControlSection>
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
  const cs = useControlSize()
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
        /* 5 chars holds "0.025" and a 4-digit value; 6 was a third of a touch
           row (user, 2026-09-01: "unnecessarily wide"). An expression still
           types in — the field scrolls. */
        type="text" variant="filled" size={cs} chars={5}
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

/* the labs rail's label column — `RAIL_LABEL_W`, shared with the picker stack
   and LoopFields' rows so every control in the rail starts on one x */
const INLINE_LABEL_W = RAIL_LABEL_W

function ParamControl({ param: p, layer, setProp, palette, bound, animate, inline }) {
  const cs = useControlSize()
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
    /* ON TOUCH THE SLIDER GETS THE ROW. Any rung above the desktop's 'sm'
     * is the touch rail, where the box plus the 96px label column left a
     * 32px slider (user, 2026-09-01: "no space for the slider") — so the
     * label goes above and the track takes the width. Desktop keeps the
     * inline ruling. */
    if (cs !== 'sm') rowInline = false
    /* Direct input + live modulation readout, both in one field (RangeField):
     * type a number for a constant or an expression to bind it; a bound track
     * shows the resolved value moving. */
    control = <RangeField param={p} layer={layer} setProp={setProp} />
  } else if (p.type === 'select') {
    control = (
      <Dropdown
        variant="subtle" size={cs} className="w-full"
        options={p.options ?? []}
        value={value}
        onChange={(v) => setProp(p.key, p.numeric ? Number(v) : v)}
      />
    )
  } else if (p.type === 'segmented') {
    /* THE LABS SKIN HAS ONE SEGMENTED CONTROL (user, 2026-09-01): the DS
     * SegmentedToggle — one group radius, dividers, the sunken selected cell
     * (kol-labs.css) — for tab strips and option pairs alike. ViewToggle's
     * bare tiles beside it were two answers to one question. The editor
     * keeps ViewToggle with the rest of its inspector. */
    control = inline ? (
      <SegmentedToggle
        size={cs} className={`w-full ${stripClamp(cs) ?? ''}`}
        options={p.options ?? []}
        value={value}
        onChange={(v) => setProp(p.key, v)}
      />
    ) : (
      <ViewToggle
        size={cs}
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
      /* The switch sits at the row's right edge; the label column is
       * LabeledControl's, same as every other inline row. */
      /* No local justify-end wrapper: SettingsRow's align="end" owns it. */
      control = <ToggleSwitch size={cs} checked={!!value} onChange={(v) => setProp(p.key, v)} />
    } else if (inline) {
      /* labelled pair in the labs skin: the same SegmentedToggle as
       * `segmented`, spanning the control column like a dropdown */
      control = (
        <SegmentedToggle
          size={cs} className={`w-full ${stripClamp(cs) ?? ''}`}
          options={[{ value: 'off', label: offLabel }, { value: 'on', label: onLabel }]}
          value={value ? 'on' : 'off'}
          onChange={(v) => setProp(p.key, v === 'on')}
        />
      )
    } else {
      rowInline = false
      control = (
        <ViewToggle
          size={cs}
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
        variant="filled" size={cs} rows={p.rows ?? 2} axis="y"
        value={value ?? ''}
        onChange={(e) => setProp(p.key, e.target.value)}
        placeholder={p.placeholder}
      />
    )
  } else {
    return null
  }

  const hint = p.type === 'range' && p.format && typeof value === 'number' && !bound ? p.format(value) : undefined
  const body = animate
    ? <div className="flex items-center gap-2"><div className="flex-1 min-w-0">{control}</div>{animate}</div>
    : control
  /* A bare switch is the only control that sits at the row's right edge;
   * everything else spans it. r2b2's rule, verbatim. */
  const align = p.type === 'toggle' && !p.labels ? 'end' : 'fill'
  /* The labs skin has ONE label convention — SettingsRow's uppercase helper —
   * so a row that falls back to label-above there (a textarea, a touch range)
   * uppercases too, instead of reading as the odd sentence-case line out. */
  return rowInline
    ? <SettingsRow label={p.label} hint={hint} align={align} labelWidth={INLINE_LABEL_W}>{body}</SettingsRow>
    : <LabeledControl label={inline ? String(p.label).toUpperCase() : p.label} hint={hint} labelWidth={INLINE_LABEL_W}>{body}</LabeledControl>
}
