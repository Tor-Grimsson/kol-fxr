import { Dropdown, LabeledControlSection, SettingsRow } from '@kolkrabbi/kol-component'
import { isBinding, resolveValue } from './resolve'
import { visibleParams, paramTab } from './schema'
import { transport } from './transport'
import { useControlSize, RAIL_LABEL_W } from './controlSize'

/**
 * QuickMotion — every slider gets one-press motion (plan 26 § 10).
 *
 * The review's count: 57 of 68 effects carry no motion params at all (pixelsort, kaleido, twist,
 * glitch, displacement…), and the generators' Animation tabs list only what each def authored — yet
 * every param already binds (LFO sine · triangle · square, rate in whole cycles per loop, `sources.js`),
 * nested stage params included. The gap was presentation: the bind dots hide by default (M). This is
 * the Motion tab's own row per numeric param — a pick writes an ordinary `mod` binding, so the full
 * Modulation editor (the dot) opens it like any other, and a pick of Off freezes the value back.
 *
 *   Breathe  LFO sine, 1 cycle per loop        Sweep  LFO triangle, 1 cycle
 *   Jitter   LFO square, 8 cycles per loop
 * Depth: ±20% of the param's span around its current value. Whole cycles ⇒ seamless.
 */
const PRESETS = [
  { value: 'breathe', label: 'Breathe', source: 'lfo-sine', rate: 1 },
  { value: 'sweep', label: 'Sweep', source: 'lfo-triangle', rate: 1 },
  { value: 'jitter', label: 'Jitter', source: 'lfo-square', rate: 8 },
]
const DEPTH = 0.2

function modeOf(v) {
  if (!isBinding(v)) return 'off'
  if (v.bind !== 'mod') return 'custom'
  const hit = PRESETS.find((m) => m.source === v.source && (v.transform?.rate ?? 1) === m.rate)
  return hit ? hit.value : 'custom'
}

export default function QuickMotion({ schema, layer, setProp, label = 'Modulate' }) {
  const cs = useControlSize()
  const params = visibleParams(schema ?? [], layer).filter((p) =>
    /* a seed picks a different picture, it does not move one — never offered */
    p.type === 'range' && p.animatable !== false && paramTab(p) !== 'anim' && p.min != null && p.max != null && !/seed/i.test(p.key))
  if (!params.length) return null

  const pick = (p, mode) => {
    const v = layer[p.key]
    if (mode === 'off') {
      /* our bindings straddle the value they started from — the midpoint IS it */
      const r = v?.transform?.range
      setProp(p.key, Array.isArray(r) ? (r[0] + r[1]) / 2 : resolveValue(v, transport.getCtx(), layer) ?? p.default ?? p.min)
      return
    }
    const m = PRESETS.find((x) => x.value === mode)
    if (!m) return
    const cur = Number(resolveValue(v, transport.getCtx(), layer) ?? p.default ?? p.min)
    const span = (p.max - p.min) * DEPTH
    const lo = Math.max(p.min, cur - span), hi = Math.min(p.max, cur + span)
    setProp(p.key, { bind: 'mod', source: m.source, transform: { range: [lo, hi], rate: m.rate } })
  }

  return (
    <LabeledControlSection label={label} divided>
      {params.map((p) => {
        const mode = modeOf(layer[p.key])
        const options = [
          { value: 'off', label: 'Off' },
          ...PRESETS.map(({ value, label: l }) => ({ value, label: l })),
          ...(mode === 'custom' ? [{ value: 'custom', label: 'Custom' }] : []),
        ]
        return (
          <SettingsRow key={p.key} label={p.label} align="fill" labelWidth={RAIL_LABEL_W}>
            <Dropdown size={cs} variant="subtle" className="w-full" options={options} value={mode} onChange={(m) => m !== 'custom' && pick(p, m)} />
          </SettingsRow>
        )
      })}
    </LabeledControlSection>
  )
}
