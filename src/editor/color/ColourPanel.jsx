import { useEffect, useRef, useState } from 'react'
import { colord } from 'colord'
import { Slider } from '@kolkrabbi/kol-component'
import { Button, SettingsRow, Tooltip } from '@kolkrabbi/kol-component'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { SwatchStack, EyedropPick } from '@kolkrabbi/kol-component'
import { HueStrip, SBSquare, WheelTriangle } from '@kolkrabbi/kol-component'
import { useColorTarget } from './useColorTarget'
import { useComposeState, resolveColor } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import { findLayerDeep } from '../compose/helpers'
import { pickFromCanvas } from './canvasEyedropper'
import { useControlSize, RAIL_LABEL_W } from '../params/controlSize'

const MODE_OPTIONS = [
  { value: 'hue',     label: 'Hue'     },
  { value: 'wheel',   label: 'Wheel'   },
  { value: 'sliders', label: 'Sliders' },
]

/**
 * ColourPanel — Hue / Wheel / Sliders modes, all live-bound to the active
 * color target (canvas fill or selected layer's color).
 *
 * Mode picker (top-right) switches the body. Each mode reads/writes the same
 * underlying color via `useColorTarget` and the local opacity state drives
 * the layer's `opacity` (or canvas fill opacity).
 */
export function ColourBody() {
  /* Coalesce: hue strip / SB square / wheel triangle / RGB+HSL sliders all
   * fire onChange per pointermove. Without coalescing, undo would replay
   * tick-by-tick. With coalesce, all writes inside one drag collapse to a
   * single undo entry.
   *
   * useColorTarget always returns working setters now (Photoshop model —
   * app-level paint state always exists). No "no target" fallback needed. */
  const target = useColorTarget({ history: 'coalesce' })
  const [mode, setMode] = useState('hue')
  const cs = useControlSize()

  return (
    <div className="p-4 flex flex-col gap-3 h-full min-h-0">
      {/* the mode is a strip inside the pane, full width (spec R3.2) — it was a 110px dropdown */}
      <SegmentedToggle tone="sunken" size={cs} className="w-full" ariaLabel="Color mode" value={mode} onChange={setMode} options={MODE_OPTIONS} />
      <TopRow target={target} />
      <div className="flex-1 min-h-0 flex flex-col">
        {mode === 'hue'     && <HueMode     target={target} />}
        {mode === 'wheel'   && <WheelMode   target={target} />}
        {mode === 'sliders' && <SlidersMode target={target} />}
      </div>
      <OpacityRow />
    </div>
  )
}

export default function ColourPanel() {
  return (
    <div
      className="bg-surface-primary border border-oq-08 rounded overflow-hidden"
      style={{ width: 320 }}
    >
      <ColourBody />
    </div>
  )
}

/* ────────── Top row: front swatch + eyedrop pick + mode select ────────── */

const NATIVE_EYEDROP = typeof window !== 'undefined' && 'EyeDropper' in window

function TopRow({ target }) {
  const cs = useControlSize()
  /* Read activePaint from the target (already clamped to a supported paint)
   * so SwatchStack's "front" indicator always matches what the picker
   * actually writes. */
  const { activePaint, fillHex, strokeHex, swap } = target
  /* Compose state for the eyedropper: it rasterizes the current canvas
   * (layers + palette + aspect + canvas fill) and samples one pixel. */
  const { layers, palette, aspect, customRatio, canvasFill } = useComposeState()

  const onClear = () => target.onChange(null)
  const onPickEyedrop = async () => {
    try {
      /* A themed `var(...)` fill can't be a 2D-context fillStyle — skip it so
       * the eyedropper samples the layers over transparent instead of black. */
      const canvasFillHex = (typeof canvasFill === 'string' && canvasFill.startsWith('var('))
        ? null
        : (resolveColor(canvasFill, palette) ?? null)
      const hex = await pickFromCanvas({ layers, palette, aspect, customRatio, canvasFillHex })
      if (hex) target.onChange(hex)
    } catch (err) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Eyedropper failed:', err)
      }
    }
  }
  /* `I` (keymap `eyedrop`, 2026-10-09 — the user's 17): the same pick the pipette button makes.
     A ref so the listener always calls the latest closure (layers · palette · focused paint). */
  const pickRef = useRef(onPickEyedrop); pickRef.current = onPickEyedrop
  useEffect(() => {
    const on = () => pickRef.current()
    window.addEventListener('kol:eyedrop', on)
    return () => window.removeEventListener('kol:eyedrop', on)
  }, [])
  const fillColor   = fillHex   ?? '#FFFFFF'
  const strokeColor = strokeHex ?? '#000000'
  const sampleColor = activePaint === 'stroke' ? strokeColor : fillColor

  return (
    <div className="flex items-center gap-3">
      <SwatchStack
        fillColor={fillColor}
        strokeColor={strokeColor}
        activePaint={activePaint}
        onSwap={swap}
        onClear={onClear}
      />
      <EyedropPick sampleColor={sampleColor} onPick={onPickEyedrop} />
      {/* THE PIPETTE IN EVERY BROWSER (spec R6.9, the user's 12): the DS button renders only where
          `window.EyeDropper` exists (Chromium) — but this pick samples our own canvas and never
          calls that API, so where the DS hides it (Firefox, Safari) the same pick gets a plain DS
          icon button. Retires when EyedropPick drops its gate (plan 17 #6). */}
      {!NATIVE_EYEDROP && (
        <Tooltip label="Eyedropper" shortcut="I">
          <Button tone="ghost" quiet size={cs} iconOnly="eyedrop" aria-label="Eyedropper" onClick={onPickEyedrop} />
        </Tooltip>
      )}
    </div>
  )
}

/* SwatchStack + EyedropPick + their internal FramedSwatch / NoneMarker
 * helpers live in `./SwatchControls.jsx` — see that file's header comment.
 * Off-limits for atom-refactor sweeps. */

/* ────────── Mode bodies ────────── */

function HueMode({ target }) {
  const hsv = colord(target.hex).toHsv()
  const setHex = (next) => target.onChange(next.toUpperCase())

  const onHue = (v) => setHex(colord({ h: v, s: hsv.s, v: hsv.v }).toHex())
  const onSV  = (s, v) => setHex(colord({ h: hsv.h, s, v }).toHex())

  return (
    <div className="flex flex-col gap-3 w-full h-full min-h-0">
      <HueStrip hue={hsv.h} onChange={onHue} />
      <div className="flex-1 min-h-0 rounded-[2px] overflow-hidden">
        <SBSquare hue={hsv.h} sat={hsv.s} val={hsv.v} onChange={onSV} />
      </div>
    </div>
  )
}

/* Classic HSB wheel + inscribed triangle picker — matches the macOS-port
 * Ref design (`ColourPanelRef`). Outer ring carries the hue conic gradient;
 * inner triangle (apex up) carries the saturation/value gradients. Handle on
 * the ring drags hue; handle in the triangle drags sat+val. */
function WheelMode({ target }) {
  const hsv = colord(target.hex).toHsv()
  const setHex = (next) => target.onChange(next.toUpperCase())
  return (
    <WheelTriangle
      hue={hsv.h} sat={hsv.s} val={hsv.v}
      onChangeHue={(h)   => setHex(colord({ h,        s: hsv.s, v: hsv.v }).toHex())}
      onChangeSV={(s, v) => setHex(colord({ h: hsv.h, s,        v        }).toHex())}
    />
  )
}

function SlidersMode({ target }) {
  const [model, setModel] = useState('hsl')
  const c = colord(target.hex)
  const setHex = (next) => target.onChange(next.toUpperCase())

  if (model === 'rgb') {
    const { r, g, b } = c.toRgb()
    return (
      <div className="flex flex-col gap-3">
        <ModelToggle model={model} setModel={setModel} />
        <SliderRow label="R" hint={`${r}`} max={255} value={r} onChange={(v) => setHex(colord({ r: v, g, b }).toHex())} />
        <SliderRow label="G" hint={`${g}`} max={255} value={g} onChange={(v) => setHex(colord({ r, g: v, b }).toHex())} />
        <SliderRow label="B" hint={`${b}`} max={255} value={b} onChange={(v) => setHex(colord({ r, g, b: v }).toHex())} />
      </div>
    )
  }

  const { h, s, l } = c.toHsl()
  return (
    <div className="flex flex-col gap-3">
      <ModelToggle model={model} setModel={setModel} />
      <SliderRow label="H" hint={`${Math.round(h)}°`} max={360} value={Math.round(h)} onChange={(v) => setHex(colord({ h: v, s, l }).toHex())} />
      <SliderRow label="S" hint={`${Math.round(s)}%`} max={100} value={Math.round(s)} onChange={(v) => setHex(colord({ h, s: v, l }).toHex())} />
      <SliderRow label="L" hint={`${Math.round(l)}%`} max={100} value={Math.round(l)} onChange={(v) => setHex(colord({ h, s, l: v }).toHex())} />
    </div>
  )
}

const MODEL_OPTIONS = [
  { value: 'hsl', label: 'HSL' },
  { value: 'rgb', label: 'RGB' },
]
function ModelToggle({ model, setModel }) {
  const cs = useControlSize()
  return <SegmentedToggle tone="sunken" size={cs} className="w-full" value={model} onChange={setModel} options={MODEL_OPTIONS} />
}

/* the rail's one row (spec R5.1): uppercase label in the 112 column, the slider fills, its
   readout as wide as the channel's longest value (R6.1) */
function SliderRow({ label, hint, max, value, onChange }) {
  return (
    <SettingsRow label={label} hint={hint} align="fill" labelWidth={RAIL_LABEL_W}>
      <Slider min={0} max={max} value={value} onChange={onChange} displayWidth={String(max).length} className="flex-1" />
    </SettingsRow>
  )
}

function OpacityRow() {
  const { selectedId, layers, canvasFillOpacity, setCanvasFillOpacity } = useComposeState()

  const isCanvas = selectedId === 'canvas'
  const layer    = !isCanvas && selectedId ? findLayerDeep(layers, selectedId) : null

  /* Coalesce like LayerInspector's opacity slider — a drag fires per tick,
   * and each raw updateLayer would push its own undo entry. */
  const edit = useLayerEdit(layer && !layer.locked ? layer.id : null, { history: 'coalesce' }) /* one lock rule */

  /* Local fallback so dragging always moves the slider, even with no target. */
  const [localOpacity, setLocalOpacity] = useState(100)

  const value = isCanvas
    ? Math.round((canvasFillOpacity ?? 1) * 100)
    : layer
      ? Math.round((layer.opacity ?? 1) * 100)
      : localOpacity

  const onChange = isCanvas
    ? (v) => setCanvasFillOpacity(v / 100)
    : layer
      ? (v) => edit.setProp('opacity', v / 100)
      : setLocalOpacity

  /* "100" is three digits — the readout was a 6-char box (spec R6.1, the user's 14) */
  return (
    <SettingsRow label="Opacity" align="fill" labelWidth={RAIL_LABEL_W}>
      <Slider min={0} max={100} value={value} onChange={onChange} displayWidth={3} className="flex-1" />
    </SettingsRow>
  )
}

/* HueStrip / SBSquare / WheelTriangle and their internal Handle / SvgHandle
 * helpers live in `./SpectrumControls.jsx` — see that file's header.
 * Off-limits for atom-refactor sweeps. */
