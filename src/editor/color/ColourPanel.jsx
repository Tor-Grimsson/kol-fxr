import { useEffect, useRef, useState } from 'react'
import { colord } from 'colord'
import { Slider } from '@kolkrabbi/kol-component'
import { Button, SettingsRow, Stepper, Tooltip } from '@kolkrabbi/kol-component'
import { Dropdown } from '@kolkrabbi/kol-component'
import { SwatchStack, EyedropPick } from '@kolkrabbi/kol-component'
import { HueStrip, SBSquare, WheelTriangle } from '@kolkrabbi/kol-component'
import { useColorTarget } from './useColorTarget'
import { useComposeState, resolveColor } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import { findLayerDeep } from '../compose/helpers'
import { pickFromCanvas } from './canvasEyedropper'
import { useControlSize, RAIL_LABEL_W } from '../params/controlSize'

/* ONE VIEW PICKER (plan 29 § 12): Affinity's `RGB ▾` top-right beside the swatches — the user's
 * reference. The old Hue · Wheel · Sliders strip and the HSL/RGB strip under Sliders fold into it. */
const MODE_OPTIONS = [
  { value: 'hue',   label: 'Hue'   },
  { value: 'wheel', label: 'Wheel' },
  { value: 'hsl',   label: 'HSL'   },
  { value: 'rgb',   label: 'RGB'   },
]

/**
 * ColourPanel — Hue / Wheel / Sliders modes, all live-bound to the active
 * color target (canvas fill or selected layer's color).
 *
 * View picker (a dropdown top-right, beside the swatches) switches the body. Each mode reads/writes the same
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
    /* AFFINITY'S ORDER (plan 30 § 14, the user's Swatches reference): the swatch pair, the pipette and
       Opacity on one row; the view picker a full-width row under it, as the Swatches tab's palette
       picker is; then the body, which takes its own height — the pane sizes to its content */
    <div className="p-4 flex flex-col gap-3">
      <TopRow target={target} />
      <Dropdown size={cs} variant="subtle" className="w-full" ariaLabel="Color view" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      <div className="flex flex-col">
        {mode === 'hue'   && <HueMode     target={target} />}
        {mode === 'wheel' && <WheelMode   target={target} />}
        {(mode === 'hsl' || mode === 'rgb') && <SlidersMode target={target} model={mode} />}
      </div>
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
      <OpacityField />
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
    <div className="flex flex-col gap-3 w-full">
      <HueStrip hue={hsv.h} onChange={onHue} />
      {/* a real 2D square, not a strip (plan 30 § 14: "why can't I drag vertically") */}
      <div className="h-40 rounded-[2px] overflow-hidden">
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

function SlidersMode({ target, model }) {
  const c = colord(target.hex)
  const setHex = (next) => target.onChange(next.toUpperCase())

  if (model === 'rgb') {
    const { r, g, b } = c.toRgb()
    return (
      <div className="flex flex-col gap-3">
        <SliderRow label="R" hint={`${r}`} max={255} value={r} onChange={(v) => setHex(colord({ r: v, g, b }).toHex())} />
        <SliderRow label="G" hint={`${g}`} max={255} value={g} onChange={(v) => setHex(colord({ r, g: v, b }).toHex())} />
        <SliderRow label="B" hint={`${b}`} max={255} value={b} onChange={(v) => setHex(colord({ r, g, b: v }).toHex())} />
      </div>
    )
  }

  const { h, s, l } = c.toHsl()
  return (
    <div className="flex flex-col gap-3">
      <SliderRow label="H" hint={`${Math.round(h)}°`} max={360} value={Math.round(h)} onChange={(v) => setHex(colord({ h: v, s, l }).toHex())} />
      <SliderRow label="S" hint={`${Math.round(s)}%`} max={100} value={Math.round(s)} onChange={(v) => setHex(colord({ h, s: v, l }).toHex())} />
      <SliderRow label="L" hint={`${Math.round(l)}%`} max={100} value={Math.round(l)} onChange={(v) => setHex(colord({ h, s, l: v }).toHex())} />
    </div>
  )
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

function OpacityField() {
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

  /* AFFINITY'S `Opacity: 100 %` (plan 30 § 14): the header row's right end, a stepper, not a slider
     row at the pane's foot. Typed values clamp to 0–100. */
  const cs = useControlSize()
  const set = (e) => { const v = Math.round(Number(e.target.value)); if (Number.isFinite(v)) onChange(Math.max(0, Math.min(100, v))) }
  return (
    <label className="ml-auto flex items-center gap-2">
      <span className="kol-helper-10 text-meta">Opacity</span>
      <Stepper size={cs} min={0} max={100} value={value} onChange={set} className="w-[64px]" aria-label="Opacity" />
    </label>
  )
}

/* HueStrip / SBSquare / WheelTriangle and their internal Handle / SvgHandle
 * helpers live in `./SpectrumControls.jsx` — see that file's header.
 * Off-limits for atom-refactor sweeps. */
