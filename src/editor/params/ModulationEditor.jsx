import { useEffect, useState } from 'react'
import { Button, FunctionPlot, Input, MenuDropdownItem, Slider, LabeledControl } from '@kolkrabbi/kol-component'
import { getSource } from './sources'
import { learnCC } from './midi'
import { learnGamepad, isGamepadSource } from './gamepad'
import { isBinding } from './resolve'
import { compileExpr } from './expr'
import { transport } from './transport'
import { useControlSize } from './controlSize'
import { SegmentedToggle } from '@kolkrabbi/kol-component'

/**
 * ModulationEditor — the transform editor for ONE bound param (range / invert /
 * smooth / curve, plus source-specific rate·phase, expression field + plot, or
 * MIDI/gamepad learn). Lifted OUT of the BindDot popover (which overflowed the
 * viewport) into the Parameters → Animation tab, where it has room. The dot is
 * now a pure source picker; this is where you shape the signal.
 *
 * Self-contained: reads the binding off `layer[param.key]`, writes through
 * `setProp` (undo-safe). Renders nothing unless the param is bound to a source.
 */

/* Click-to-fill examples for the expression source — best of labs'
 * oscilloscope reference list, limited to strings that stay in 0..1. */
const EXPR_EXAMPLES = [
  { code: 'wave(t*2)',    desc: 'Fast sine' },
  { code: 'saw(t)*0.8',   desc: 'Ramp to 80' },
  { code: 'tri(t*0.5)',   desc: 'Slow bounce' },
  { code: 'pulse(t, 0.3)', desc: 'PWM 30%' },
  { code: 'ease(t*2, 4)', desc: 'Fast + punchy' },
  { code: 'bell(t)',      desc: 'Bell curve' },
  { code: 'step(t, 4)',   desc: '4 steps' },
  { code: 'rand()',       desc: 'Noise' },
]

/* ── ExprPlot — oscilloscope-lite. Plots the expression over ONE LOOP with
 * grid rails at the curve's min/mid/max, dashed 0/1 clamp rails, a playhead at
 * the transport's loop phase, and the current-value dot. Redraws per rAF so
 * audio/rand expressions animate live; colours follow the editor theme. */
const PLOT_W = 196
const PLOT_H = 64
function ExprPlot({ expr }) {
  /* the plot is KOL's FunctionPlot (kol-component 0.330, plan 51 4.4); fxr feeds it the expression over one loop, the
     0–1 rails kept in range, and the loop phase as the cursor — re-read each frame so audio / rand expressions move */
  const [u, setU] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => { setU(transport.getCtx().t ?? 0); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const c = compileExpr(expr)
  const secs = transport.getLoopSeconds()
  const N = PLOT_W
  const samples = Array.from({ length: N + 1 }, (_, i) => (c.ok ? c.fn((i / N) * secs) : 0))
  const lo = Math.min(0, ...samples), hi = Math.max(1, ...samples)
  return <FunctionPlot samples={samples} min={lo} max={hi} cursor={u} height={PLOT_H} ariaLabel="Expression plot over one loop" />
}

export function ModulationEditor({ layer, param, setProp }) {
  const cs = useControlSize()
  const value = layer[param.key]
  const [exprDraft, setExprDraft] = useState(null)
  const [learning, setLearning] = useState(false)
  const [padLearning, setPadLearning] = useState(false)

  if (!isBinding(value) || value.bind !== 'mod') return null

  const source = value.source
  const tr = value.transform ?? {}
  const isLfo = source.startsWith('lfo-')
  const isMidi = source === 'midi'
  const isGamepad = isGamepadSource(source)
  const isExpr = source === 'expr'
  const exprStr = tr.expr ?? 'wave(t)'

  const patchTransform = (patch) => setProp(param.key, { ...value, transform: { ...tr, ...patch } })
  const commitExpr = (str) => {
    setExprDraft(null)
    const s = String(str).trim()
    if (s && s !== exprStr) patchTransform({ expr: s })
  }
  const onLearn = async () => {
    setLearning(true)
    const cc = await learnCC()
    setLearning(false)
    if (cc != null) patchTransform({ cc })
  }
  const onPadLearn = async () => {
    setPadLearning(true)
    const id = await learnGamepad()
    setPadLearning(false)
    if (id) setProp(param.key, { ...value, source: id })
  }

  const defaultRange = () => (param.min != null && param.max != null ? [param.min, param.max] : [0, 1])
  const range = tr.range ?? defaultRange()
  const num = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback }

  return (
    <div className="flex flex-col gap-3">
      <LabeledControl label="Range">
        {/* the two fields SHARE the row (plan 26 § 16): at `chars={5}` each, the HTML `size` attribute
            padded both past the rail — the second read "20,6", cut off at the edge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <Input
              variant="filled" size={cs} type="number" width="100%"
              value={range[0]}
              onChange={(e) => patchTransform({ range: [num(e.target.value, range[0]), range[1]] })}
            />
          </div>
          <span className="kol-helper-10 text-meta shrink-0">to</span>
          <div className="flex-1 min-w-0">
            <Input
              variant="filled" size={cs} type="number" width="100%"
              value={range[1]}
              onChange={(e) => patchTransform({ range: [range[0], num(e.target.value, range[1])] })}
            />
          </div>
        </div>
      </LabeledControl>
      <div className="grid grid-cols-2 gap-2">
        <LabeledControl label="Invert">
          <SegmentedToggle size={cs} className="w-full"
            options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
            value={tr?.invert ? 'on' : 'off'}
            onChange={(v) => patchTransform({ invert: v === 'on' })}
          />
        </LabeledControl>
        <LabeledControl label="Smooth">
          <Slider min={0} max={0.95} step={0.05} value={tr?.smooth ?? 0} onChange={(v) => patchTransform({ smooth: v })} />
        </LabeledControl>
      </div>
      <LabeledControl label="Curve">
        <Slider min={0.25} max={4} step={0.05} value={tr?.curve ?? 1} onChange={(v) => patchTransform({ curve: v })} />
      </LabeledControl>
      {isLfo && (
        <div className="grid grid-cols-2 gap-2">
          <LabeledControl label="Rate">
            <Slider min={0.25} max={16} step={0.25} value={tr?.rate ?? 1} onChange={(v) => patchTransform({ rate: v })} />
          </LabeledControl>
          <LabeledControl label="Phase">
            <Slider min={0} max={1} step={0.01} value={tr?.phase ?? 0} onChange={(v) => patchTransform({ phase: v })} />
          </LabeledControl>
        </div>
      )}
      {isExpr && (
        <>
          <LabeledControl label="Expression">
            <Input
              variant="ghost" size={cs}
              value={exprDraft ?? exprStr}
              onChange={(e) => setExprDraft(e.target.value)}
              onBlur={(e) => commitExpr(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            />
          </LabeledControl>
          <ExprPlot expr={exprStr} />
          <div className="flex flex-col">
            {EXPR_EXAMPLES.map((ex) => (
              <MenuDropdownItem key={ex.code} onClick={() => patchTransform({ expr: ex.code })} rowClass="kol-mono-10 h-6" shortcut={<span className="kol-helper-10 text-meta">{ex.desc}</span>}>
                {ex.code}
              </MenuDropdownItem>
            ))}
          </div>
        </>
      )}
      {isMidi && (
        <LabeledControl label={tr?.cc != null ? `MIDI · CC ${tr.cc}` : 'MIDI · no CC yet'}>
          <Button tone="outline" size={cs} onClick={onLearn}>
            {learning ? 'Move a knob…' : 'Learn'}
          </Button>
        </LabeledControl>
      )}
      {isGamepad && (
        <LabeledControl label={getSource(source)?.label ?? 'Gamepad'}>
          <Button tone="outline" size={cs} onClick={onPadLearn}>
            {padLearning ? 'Move a control…' : 'Learn'}
          </Button>
        </LabeledControl>
      )}
    </div>
  )
}

/**
 * ModulationList — every param on the layer that's bound to a source, each with
 * its ModulationEditor. This is the Animation tab's modulation surface: pick a
 * source at the dot, shape it here. Keyframe bindings (bind:'track') are edited
 * in the timeline, not listed here.
 */
export function ModulationList({ layer, schema, setProp }) {
  const bound = (schema ?? []).filter((p) => {
    const v = layer[p.key]
    return isBinding(v) && v.bind === 'mod'
  })
  if (bound.length === 0) return null
  return (
    <div className="flex flex-col gap-4">
      <span className="kol-eyebrow text-fg-80">Modulation</span>
      {bound.map((p) => {
        const src = getSource(layer[p.key].source)
        return (
          <div key={p.key} className="flex flex-col gap-2 pt-3 border-t border-oq-08">
            <div className="flex items-center justify-between">
              <span className="kol-helper-12 text-emphasis">{p.label ?? p.key}</span>
              <span className="kol-helper-10 text-meta">{src?.label ?? layer[p.key].source}</span>
            </div>
            <ModulationEditor layer={layer} param={p} setProp={setProp} />
          </div>
        )
      })}
    </div>
  )
}
