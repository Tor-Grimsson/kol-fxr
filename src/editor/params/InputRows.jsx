import { Button, LabeledControlSection, MultiSelect } from '@kolkrabbi/kol-component'
import { isBinding, resolveValue } from './resolve'
import { visibleParams } from './schema'
import { getSource } from './sources'
import { transport } from './transport'
import { useControlSize } from './controlSize'

/**
 * InputRows — INPUTS (plan 48, user 2026-10-31: *"'add a field' a special button that you assign from dropdown mouse, mic,
 * modulation … and a selected shortlist 1-3 most interesting connections … modulation M can be a bit hidden"*, then *"we
 * could set both source and effect with multiselect dropdown"*). A door onto the bind system, not a second one: each
 * row is one KOL `MultiSelect` — Source · Drives — over an ordinary `{ bind: 'mod' }` value, so the M dot and the
 * Modulation editor open it as before. The rows are read back from the layer's bindings; nothing is stored here.
 *
 *   Add input   binds the next of the def's `inputs` shortlist (else its first three numeric params) to Mouse X
 *   Source      Off unbinds (the param gets back the value it had before) · any other source rewires the same param
 *   Drives      moves the binding to another param
 */
const SOURCES = [
  { value: 'off', label: 'Off' },
  { value: 'mouseX', label: 'Mouse X' },
  { value: 'mouseY', label: 'Mouse Y' },
  { value: 'audio-level', label: 'Mic' },
  { value: 'audio-bass', label: 'Beat' },
  { value: 'lfo-sine', label: 'LFO' },
]
const IS_INPUT = new Set(SOURCES.map((s) => s.value))

export default function InputRows({ schema, layer, setProp, inputs = null }) {
  const cs = useControlSize()
  const params = visibleParams(schema ?? [], layer).filter((p) =>
    p.type === 'range' && p.animatable !== false && p.min != null && p.max != null && !/seed/i.test(p.key))
  if (!params.length) return null
  const byKey = new Map(params.map((p) => [p.key, p]))
  const shortlist = (inputs ?? []).filter((k) => byKey.has(k))
  const order = [...shortlist, ...params.map((p) => p.key).filter((k) => !shortlist.includes(k))]
  const best = shortlist.length ? shortlist : order.slice(0, 3)

  const bound = (k) => { const v = layer[k]; return isBinding(v) && v.bind === 'mod' && IS_INPUT.has(v.source) }
  const rows = order.filter(bound)
  const now = (k) => { const p = byKey.get(k); return Number(resolveValue(layer[k], transport.getCtx(), layer) ?? p.default ?? p.min) }

  /* `base` is the value the param had when the input took it — Off gives it back, instead of whatever the input
     read at that instant (a silent mic left Weight at its floor) */
  const bind = (k, source, base = isBinding(layer[k]) ? layer[k].transform?.base ?? now(k) : now(k)) => {
    const p = byKey.get(k)
    getSource(source)?.ensure?.().catch(() => {}) /* mic permission — this is a user gesture */
    setProp(k, { bind: 'mod', source, transform: { range: [p.min, p.max], base, ...(source.startsWith('lfo') ? { rate: 1 } : {}) } })
  }
  const unbind = (k) => setProp(k, isBinding(layer[k]) ? layer[k].transform?.base ?? now(k) : now(k))
  const next = best.find((k) => !bound(k)) ?? order.find((k) => !bound(k))

  return (
    <LabeledControlSection label="Inputs" divided>
      {rows.map((k) => (
        <MultiSelect
          key={k}
          size={cs}
          className="w-full [&>button]:w-full"
          groups={[
            { id: 'source', label: 'Source', options: SOURCES },
            { id: 'drives', label: 'Drives', options: order.map((x) => ({ value: x, label: byKey.get(x).label + (best.includes(x) ? ' ★' : '') })) },
          ]}
          value={{ source: layer[k].source, drives: k }}
          label={`${SOURCES.find((s) => s.value === layer[k].source)?.label} → ${byKey.get(k).label}`}
          onChange={(group, v) => {
            if (group === 'source') { if (v === 'off') unbind(k); else bind(k, v); return }
            if (v === k || bound(v)) return
            const source = layer[k].source
            unbind(k)
            bind(v, source)
          }}
        />
      ))}
      {next && <Button size={cs} iconLeft="plus" className="w-full" onClick={() => bind(next, 'mouseX')}>Add input</Button>}
    </LabeledControlSection>
  )
}
