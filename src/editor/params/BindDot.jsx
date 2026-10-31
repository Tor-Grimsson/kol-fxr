import { ParamBindDot } from '@kolkrabbi/kol-component'
import { useControlSize } from './controlSize'
import { getSources, getSource } from './sources'
import { isGamepadSource } from './gamepad'
import { isBinding, resolveValue } from './resolve'
import { transport } from './transport'
import { useBindDots } from './dotVisibility'

/**
 * BindDot — the per-field modulate affordance. A tiny dot beside an animatable
 * control; its popover is a PURE SOURCE PICKER:
 *
 *   Constant   — unbind; the prop freezes at its current resolved value
 *   Keyframes  — a flat 2-key track at the current value (timeline edits it)
 *   <source>   — bind to a live modulation source (Time / Mouse / Pointer /
 *                LFO / Expression / Audio / MIDI / Joystick)
 *
 * The transform editor (range / invert / smooth / curve / expression + plot /
 * learn) lives in Parameters → Animation tab (ModulationEditor) — NOT in this
 * popover. Keeping the popover to just the picker is why it can no longer grow
 * tall enough to overflow the viewport.
 */
export default function BindDot({ layer, param, setProp }) {
  const cs = useControlSize()
  const dotsOn = useBindDots()

  const value = layer[param.key]
  const bound = isBinding(value)
  const mode = bound ? (value.bind === 'track' ? 'track' : value.source) : 'none'

  /* Global gate (user ruling 2026-08-12): dots are hidden chrome until the
   * modulate mode is toggled (keymap `M`, set-and-forget) — except a BOUND
   * param's dot, which stays visible so an animated value is never mute. */
  if (!dotsOn && !bound) return null

  /* Current concrete value — the base a new binding starts from, and the
   * constant an unbind freezes to. */
  const current = () => {
    const v = resolveValue(value, transport.getCtx(), layer)
    if (v !== undefined && v !== null) return v
    return param.default ?? 0
  }
  const defaultRange = () =>
    param.min != null && param.max != null ? [param.min, param.max] : [0, 1]

  const pick = (m) => {
    if (m === 'none') {
      setProp(param.key, current())
    } else if (m === 'track') {
      const v = current()
      setProp(param.key, { bind: 'track', keys: [{ t: 0, v, easing: 'linear' }, { t: 1, v, easing: 'linear' }] })
    } else {
      const src = getSource(m)
      src?.ensure?.().catch(() => {})   /* mic/MIDI permission — user gesture */
      setProp(param.key, { bind: 'mod', source: m, transform: { range: defaultRange() } })
    }
  }

  /* Collapse the ~20 individual gamepad axis/button sources into ONE
   * "Joystick" entry (binds the first pad source; re-point via Learn in the
   * Animation tab) — that list alone was what made the picker overflow. */
  const srcs = param.type === 'color' ? [] : getSources().filter((s) => !s.hidden)
  const firstPad = srcs.find((s) => isGamepadSource(s.id))
  const entries = [
    { value: 'none',  label: 'Constant' },
    { value: 'track', label: 'Keyframes' },
    ...srcs.filter((s) => !isGamepadSource(s.id)).map((s) => ({ value: s.id, label: s.label })),
    ...(firstPad ? [{ value: firstPad.id, label: 'Joystick' }] : []),
  ]

  /* the dot and its menu are KOL's ParamBindDot (kol-component 0.330, plan 51 4.4) — fxr keeps the source list and
     the binding logic; a capped, scrolling menu is the Menu's own */
  const label = entries.find((e) => e.value === mode)?.label ?? mode
  return (
    <ParamBindDot
      size={cs} bound={bound} mode={label} label={param.label ?? param.key}
      tooltip={bound ? `Modulated (${mode}) — shape it in the Animation tab` : 'Modulate'}
      minWidth={220}
      items={entries.map((e) => ({ label: e.label, onClick: () => pick(e.value), checked: mode === e.value }))}
    />
  )
}
