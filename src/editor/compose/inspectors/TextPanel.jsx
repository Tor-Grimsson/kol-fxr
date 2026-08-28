import { useEffect, useState } from 'react'
import { Button, Dropdown, LabeledControl, PopoverPanel, SegmentedToggle, Slider, usePopover, ViewToggle } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import EditorIcon from '../../icons/EditorIcon'

import BindDot from '../../params/BindDot'
import { isBinding } from '../../params/resolve'
import { TEXT_SCHEMA } from '../../params/schemas/text'
import { WIDTHS, WEIGHTS, CASES } from '../../modes/type/cuts'
import { CURVE_OPTIONS } from '../../modes/type/curveMath'
import {
  FAMILY_OPTIONS, layerFamily, stylesFor, styleValueFor,
  isOutlineFamily, ensureFamilyLoaded, FAMILY_RG, FAMILY_JB,
} from '../../modes/type/families'
import { useComposeState, resolveColor } from '../state'
import { useLayerEdit } from '../useLayerEdit'
import { NumberField } from './NumberField'
import { useGeneratorLibrary } from '../../library/LibraryProvider'

/**
 * TextSurface — the text layer's full editing surface, rendered INSIDE the
 * Inspector (the 2026-08-12 inspector ruling: the Inspector owns the
 * selected object's major interaction), rebuilt on the Figma typography
 * model (2026-08-12 typography pass):
 *
 *   Content · FAMILY (families.js — RG / JetBrains / Google) · STYLE (the
 *   family's own variants) · Font readout · Alignment (H + V icon rows +
 *   the type-settings ⚙ popover holding Case/Italic) · Metrics (bindable).
 *
 * One home per control: these fields are filtered OUT of the Parameters
 * tab (TEXT_TAB_KEYS below is the split — Parameters keeps Morph, the
 * saved-spec picker, Flatten and the anim view). Fill stays in the
 * Inspector's shared paint surface, not duplicated here.
 *
 * Same write path as ParametersPanel (useLayerEdit coalesced history);
 * Metrics keep their bind dots via the TEXT_SCHEMA param defs so bindings
 * resolve identically everywhere.
 */

/* Keys the Inspector's TextSurface owns — ParametersPanel filters these OUT
 * of the text layer's schema-driven view (one home per control). */
export const TEXT_TAB_KEYS = new Set([
  'text', 'width', 'weight', 'case', 'italic', 'textAlign', 'size', 'tracking', 'lineHeight',
  'axisBlend',
])

/* Curve options for the Variable block — the brand list, with `custom`'s
 * on-canvas hint dropped (compose edits the control points via the rail
 * sliders below, not a canvas overlay). */
const AXIS_CURVE_OPTIONS = CURVE_OPTIONS.map((o) =>
  o.value === 'custom' ? { ...o, label: 'Custom' } : o)

const weightLabel = (w) => WEIGHTS.find((x) => x.id === w)?.label ?? String(w)

const WIDTH_OPTIONS  = WIDTHS.map((w) => ({ value: w.id, label: w.label }))
const WEIGHT_OPTIONS = WEIGHTS.map((w) => ({ value: w.id, label: w.label }))
const CASE_OPTIONS   = CASES.map((c) => ({ value: c.id, label: c.label }))

/* Metric inputs reuse the schema param defs (ranges + binding identity)
 * under the mode-verbatim labels and value formatting. */
const metric = (key, label, format) => ({ ...TEXT_SCHEMA.find((p) => p.key === key), label, format })

/* Family switch — one patch that keeps the (width, weight) storage legal in
 * the target family: RG restores a real cut, JetBrains claims the 'mono'
 * width and its static weights, Google keeps width inert and snaps weight
 * to the family's nearest available stop. */
function familyPatch(layer, familyId) {
  const patch = { family: familyId }
  const styles = stylesFor(familyId)
  if (familyId === FAMILY_RG) {
    if (!layer.width || layer.width === 'mono') patch.width = 'Tight'
    if (!WEIGHTS.some((w) => w.id === layer.weight)) patch.weight = 600
  } else if (familyId === FAMILY_JB) {
    patch.width = 'mono'
    if (![400, 500, 600].includes(layer.weight)) patch.weight = 400
  } else {
    const weights = styles.map((s) => s.patch.weight)
    if (!weights.includes(layer.weight)) {
      patch.weight = weights.reduce((best, w) =>
        Math.abs(w - (layer.weight ?? 400)) < Math.abs(best - (layer.weight ?? 400)) ? w : best, weights[0] ?? 400)
    }
  }
  return patch
}

export function TextSurface({ layer }) {
  const { palette } = useComposeState()
  const { saveType } = useGeneratorLibrary()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const setProp = edit.setProp
  const family = layerFamily(layer)
  const styles = stylesFor(family)

  /* Type-settings popover (the Figma ⚙ pattern) — Case + Italic depth. */
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settings = usePopover({ open: settingsOpen, onOpenChange: setSettingsOpen, placement: 'bottom-end', offset: 4 })

  const onFamily = (id) => {
    ensureFamilyLoaded(id)
    edit.patch(familyPatch(layer, id))
  }
  const onStyle = (v) => {
    const s = styles.find((x) => x.value === v)
    if (s) edit.patch(s.patch)
  }

  /* Save-to-library moved to the header ⋯ menu (FOLLOW FIGMA — no such
   * button in its Typography section); this listener keeps the save logic
   * where the type spec lives. */
  useEffect(() => {
    const onSave = (e) => {
      if (e.detail !== layer.id) return
      /* Save shape matches Type mode's saver (minus the axis fields the
       * layer doesn't carry). Color resolves to literal hex — library type
       * specs are hex-only (Type mode consumes them too). */
      saveType({
        text:       layer.text,
        family,
        width:      layer.width,
        weight:     layer.weight,
        italic:     layer.italic,
        size:       layer.size,
        tracking:   layer.tracking,
        lineHeight: layer.lineHeight,
        case:       layer.case,
        color:      resolveColor(layer.color, palette) ?? layer.color,
        textAlign:  layer.textAlign,
        verticalAlign: layer.verticalAlign,
      })
    }
    window.addEventListener('kol:save-type', onSave)
    return () => window.removeEventListener('kol:save-type', onSave)
  })

  return (
    <div className="flex flex-col gap-3">
      {/* NO Content textarea and NO Family/Style/Size labels — Figma has
        * neither (user ruling 2026-08-12). Text edits happen on canvas
        * (double-click) or via the header's Edit object. */}
      <Dropdown
        variant="subtle" size="sm" className="w-full"
        options={FAMILY_OPTIONS}
        value={family}
        onChange={onFamily}
      />

      {/* Style + Size row (Figma's "Narrow … | 12 ⌄"): size = input with a
        * chevron preset list. The bind dot rides gated (M). */}
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <Dropdown
          variant="subtle" size="sm" className="w-full"
          options={styles.map(({ value, label }) => ({ value, label }))}
          value={styleValueFor(layer)}
          onChange={onStyle}
        />
        <SizeCombo layer={layer} setProp={setProp} />
      </div>

      {/* Line height + Letter spacing (Figma pair; proper glyphs ride the
        * icon ticket — rows/type are the closest shipped drawings). */}
      <div className="grid grid-cols-2 gap-2">
        <LabeledControl label="Line height">
          <div className="flex items-center gap-1 min-w-0">
            <MetricInput param={metric('lineHeight', 'Line height')} layer={layer} setProp={setProp} step={0.01} icon="line-height" />
            <BindDot layer={layer} param={metric('lineHeight', 'Line height')} setProp={setProp} />
          </div>
        </LabeledControl>
        <LabeledControl label="Letter spacing">
          <div className="flex items-center gap-1 min-w-0">
            <MetricInput param={metric('tracking', 'Tracking')} layer={layer} setProp={setProp} suffix="em" step={0.005} icon="letter-spacing" />
            <BindDot layer={layer} param={metric('tracking', 'Tracking')} setProp={setProp} />
          </div>
        </LabeledControl>
      </div>

      {/* Alignment — two 3-way segmented toggles + the DS settings glyph
        * (Figma's row). */}
      <LabeledControl label="Alignment">
        <div className="flex items-center gap-2">
          {/* STATEFUL strips — DS SegmentedToggle variant="filled". */}
          <SegmentedToggle
            variant="tonal" size="sm"
            ariaLabel="Text alignment"
            value={layer.textAlign ?? 'center'}
            options={[
              { value: 'left',   ariaLabel: 'Align left',   label: <EditorIcon name="align-h-start" size={16} /> },
              { value: 'center', ariaLabel: 'Align center', label: <EditorIcon name="align-h-center" size={16} /> },
              { value: 'right',  ariaLabel: 'Align right',  label: <EditorIcon name="align-h-end" size={16} /> },
            ]}
            onChange={(v) => setProp('textAlign', v)}
          />
          <SegmentedToggle
            variant="tonal" size="sm"
            ariaLabel="Vertical alignment"
            value={layer.verticalAlign ?? 'middle'}
            options={[
              { value: 'top',    ariaLabel: 'Align top',    label: <EditorIcon name="align-v-start" size={16} /> },
              { value: 'middle', ariaLabel: 'Align middle', label: <EditorIcon name="align-v-center" size={16} /> },
              { value: 'bottom', ariaLabel: 'Align bottom', label: <EditorIcon name="align-v-end" size={16} /> },
            ]}
            onChange={(v) => setProp('verticalAlign', v)}
          />
          <button
            type="button"
            ref={settings.refs.setReference}
            {...settings.getReferenceProps()}
            aria-label="Type settings"
            data-kol-tip="Type settings"
            className={`ml-auto inline-flex items-center justify-center rounded text-emphasis ${settingsOpen ? '' : 'kol-btn-quiet'}`}
            style={{ width: 26, height: 26, padding: 5 }}
          >
            <Icon name="slider-01" size={14} />
          </button>
        </div>
      </LabeledControl>

      <PopoverPanel popover={settings} panel={false} focus={false} className="z-50 bg-surface-secondary border border-fg-08 rounded shadow-lg p-3 flex flex-col gap-3" style={{ minWidth: 240 }}>
        <LabeledControl label="Case">
          <ViewToggle
            options={CASE_OPTIONS}
            viewMode={layer.case ?? 'original'}
            onViewChange={(v) => setProp('case', v)}
          />
        </LabeledControl>
        <LabeledControl label="Italic">
          <ViewToggle
            variant="single"
            options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
            viewMode={layer.italic ? 'on' : 'off'}
            onViewChange={(v) => setProp('italic', v === 'on')}
          />
        </LabeledControl>
      </PopoverPanel>

    </div>
  )
}

/* MetricInput — a metric as a prefixed INPUT (Figma model; the sliders are
 * gone). Draft/commit via NumberField; clamps to the schema range; shows the
 * read-only "animated" state when the prop is bound (the dot drives it).
 * `icon` = a DS glyph prefix; the input hugs the value so units sit tight. */
function MetricInput({ param: p, layer, setProp, suffix, step, round = false, icon }) {
  const raw = layer[p.key]
  if (isBinding(raw)) {
    return <span className="kol-helper-12 text-meta italic">animated</span>
  }
  const value = typeof raw === 'number' ? raw : p.default
  const display = round ? Math.round(value) : value
  return (
    <NumberField
      variant="property" size="sm" unit={suffix}
      className="w-full min-w-0"
      affordance={icon ? <Icon name={icon} size={14} /> : undefined}
      value={display}
      onCommit={(v) => {
        const n = Number(v)
        if (!Number.isFinite(n)) return
        const snapped = step ? Math.round(n / step) * step : (round ? Math.round(n) : n)
        setProp(p.key, Math.min(p.max, Math.max(p.min, snapped)))
      }}
    />
  )
}

/* SizeCombo — Figma's size control: hugging input + chevron opening a
 * preset ladder. The bind dot rides beside (gated globally). */
const SIZE_PRESETS = [12, 16, 24, 32, 48, 64, 96, 128, 160, 192, 256, 320]

function SizeCombo({ layer, setProp }) {
  const [open, setOpen] = useState(false)
  const popover = usePopover({ open, onOpenChange: setOpen, placement: 'bottom-end', offset: 4, role: 'menu' })
  const p = metric('size', 'Size')
  return (
    <div className="flex items-center gap-1 min-w-0">
      <MetricInput param={p} layer={layer} setProp={setProp} round />
      <button
        type="button"
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        aria-label="Size presets"
        className={`inline-flex items-center justify-center rounded shrink-0 text-emphasis ${open ? '' : 'kol-btn-quiet'}`}
        style={{ width: 20, height: 26, padding: 3 }}
      >
        <Icon name="chevron-down" size={12} />
      </button>
      <PopoverPanel popover={popover} panel={false} focus={false} className="z-50 bg-surface-secondary border border-fg-08 rounded shadow-lg py-1" style={{ width: 72, maxHeight: '40vh', overflowY: 'auto' }}>
        {SIZE_PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setProp('size', s); setOpen(false) }}
            className="w-full kol-helper-12 px-3 h-7 inline-flex items-center justify-between text-body hover:text-emphasis text-left"
          >
            <span className="leading-normal">{s}</span>
            {Math.round(layer.size) === s && <span className="kol-helper-10">✓</span>}
          </button>
        ))}
      </PopoverPanel>
      <BindDot layer={layer} param={p} setProp={setProp} />
    </div>
  )
}

/* VariableBlock — the brand editor's Variable axis block (TypeControls,
 * ported): morph as a BASIC text setting. On/Off, then Mode (morph = glyph
 * outline interpolation Cut A→Cut B · fade = cross-fade · random = per-char
 * cut scatter), Cut B, Curve (+ custom control points via rail sliders —
 * no canvas overlay in compose), and the Blend/Seed row with a bind dot so
 * the morph animates like any bound param.
 *
 * Lives in the text layer's PARAMETERS → Style tab (user ruling 2026-08-12:
 * the Inspector shows what's set; morph is an OPTION, and options live in
 * Parameters — same home as the kinetic layer's morph section). */
export function VariableBlock({ layer, setProp }) {
  const mode = layer.axisMode ?? 'morph'
  const on = !!layer.axisOn
  const blendParam = metric('axisBlend', mode === 'random' ? 'Seed' : 'Blend', (v) => `${Math.round(v * 100)}%`)
  const cpSlider = (label, cpKey, axis) => (
    <div className="flex items-center gap-2">
      <span className="kol-helper-10 text-meta shrink-0" style={{ width: 32 }}>{label}</span>
      <div className="flex-1 min-w-0">
        <Slider
          min={0} max={1} step={0.01}
          value={layer[cpKey]?.[axis] ?? (cpKey === 'curveCp1' ? 0.33 : 0.66)}
          onChange={(v) => setProp(cpKey, { ...(layer[cpKey] ?? { x: cpKey === 'curveCp1' ? 0.33 : 0.66, y: cpKey === 'curveCp1' ? 0.33 : 0.66 }), [axis]: v })}
        />
      </div>
    </div>
  )
  /* Morph needs parseable outlines — only Right Grotesk ships TTFs. Other
   * families render fine but can't feed the glyph engine; say so instead
   * of showing dead controls. */
  if (!isOutlineFamily(layerFamily(layer))) {
    return (
      <div className="flex flex-col gap-2">
        <span className="kol-helper-10 uppercase text-meta">Morph</span>
        <p className="kol-mono-12 text-meta">
          Morph needs an outline font — switch the Family to Right Grotesk.
        </p>
      </div>
    )
  }
  const rgStyles = stylesFor(FAMILY_RG)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="kol-helper-10 uppercase text-meta">Morph</span>
        <ViewToggle
          options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
          viewMode={on ? 'on' : 'off'}
          onViewChange={(v) => setProp('axisOn', v === 'on')}
        />
      </div>
      {on && (
        <>
          <LabeledControl label="Mode">
            <ViewToggle
              options={[
                { value: 'morph',  label: 'Morph' },
                { value: 'fade',   label: 'Fade' },
                { value: 'random', label: 'Random' },
              ]}
              viewMode={mode}
              onViewChange={(v) => setProp('axisMode', v)}
            />
          </LabeledControl>

          {(mode === 'morph' || mode === 'fade') && (
            <LabeledControl label="Style B">
              {/* One Style picker (family model) — writes the width2/weight2
                * pair the engine morphs toward. */}
              <Dropdown
                variant="subtle" size="sm" className="w-full"
                options={rgStyles.map(({ value, label }) => ({ value, label }))}
                value={`${layer.width2 ?? 'Spatial'}/${layer.weight2 ?? 900}`}
                onChange={(v) => {
                  const s = rgStyles.find((x) => x.value === v)
                  if (s) { setProp('width2', s.patch.width); setProp('weight2', s.patch.weight) }
                }}
              />
            </LabeledControl>
          )}

          {mode === 'morph' && (
            <LabeledControl label="Curve">
              <Dropdown
                variant="subtle" size="sm" className="w-full"
                options={AXIS_CURVE_OPTIONS}
                value={layer.axisCurve ?? 'flat'}
                onChange={(v) => setProp('axisCurve', v)}
              />
            </LabeledControl>
          )}

          {mode === 'morph' && (layer.axisCurve ?? 'flat') === 'custom' && (
            <div className="flex flex-col gap-2">
              {cpSlider('P1 X', 'curveCp1', 'x')}
              {cpSlider('P1 Y', 'curveCp1', 'y')}
              {cpSlider('P2 X', 'curveCp2', 'x')}
              {cpSlider('P2 Y', 'curveCp2', 'y')}
            </div>
          )}

          <MetricRow param={blendParam} layer={layer} setProp={setProp} />

          {mode === 'random' && (
            <div className="grid grid-cols-2 gap-3">
              <LabeledControl label="Lock width">
                <Dropdown
                  variant="subtle" size="sm" className="w-full"
                  options={[{ value: '', label: 'Any' }, ...WIDTH_OPTIONS]}
                  value={layer.randomWidthLock ?? ''}
                  onChange={(v) => setProp('randomWidthLock', v)}
                />
              </LabeledControl>
              <LabeledControl label="Lock weight">
                <Dropdown
                  variant="subtle" size="sm" className="w-full"
                  options={[{ value: '', label: 'Any' }, ...WEIGHT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))]}
                  value={layer.randomWeightLock ?? ''}
                  onChange={(v) => setProp('randomWeightLock', v)}
                />
              </LabeledControl>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* One metric slider + its bind dot. A bound (animated/modulated) prop is
 * driven by the graph — show a read-only marker rather than let the slider
 * fight the binding (same policy as AutoControls). */
function MetricRow({ param: p, layer, setProp }) {
  const raw = layer[p.key]
  const bound = isBinding(raw)
  const value = typeof raw === 'number' ? raw : p.default
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        {bound
          ? (
            <div className="flex items-center justify-between">
              <span className="kol-helper-10 uppercase text-meta">{p.label}</span>
              <span className="kol-helper-12 text-meta italic">animated</span>
            </div>
          )
          : (
            <Slider
              label={p.label}
              min={p.min} max={p.max} step={p.step}
              value={value}
              formatValue={p.format}
              onChange={(v) => setProp(p.key, v)}
            />
          )}
      </div>
      <BindDot layer={layer} param={p} setProp={setProp} />
    </div>
  )
}
