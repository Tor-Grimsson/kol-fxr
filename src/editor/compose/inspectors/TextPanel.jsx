import { useEffect, useState } from 'react'
import { Button, Dropdown, InspectorSection, LabeledControl, MenuDropdownItem, PopoverPanel, SegmentedToggle, Slider, usePopover, ViewToggle, glyphSize, Tooltip } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'

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

  /* The Typography PANE (inspector rebuild 2026-09-27 — user: "why are type settings next to the
   * type selector? should that not be in some type of pane header?"): the type-settings trigger
   * (case, italic …) rides the pane's header; the rows carry no labels — tooltips name them. */
  const settingsTrigger = (
    <Tooltip label="Type settings">
      <span ref={settings.refs.setReference} {...settings.getReferenceProps()} className="inline-flex">
        <Button tone="ghost" size="sm" iconOnly="slider-01" aria-label="Type settings" pressed={settingsOpen} />
      </span>
    </Tooltip>
  )
  return (
    <InspectorSection pane label="Typography" actions={settingsTrigger}>
      {/* NO Content textarea and NO Family/Style/Size labels — Figma has
        * neither (user ruling 2026-08-12). Text edits happen on canvas
        * (double-click) or via the header's Edit object. */}
      <Dropdown
        variant="subtle" size="sm" className="w-full"
        options={FAMILY_OPTIONS}
        value={family}
        onChange={onFamily}
      />

      {/* Style + Size row (Figma's "Narrow … | 12 ⌄"): size = ONE field, its preset chevron inside
        * (the inspector rebuild — it was an input and a detached trigger). The bind dot rides gated. */}
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
      {/* the Tooltip's trigger fills its grid cell — the default inline-flex span hugged the field,
        * so the two sat at their content widths and out of line with the rows above */}
      <div className="grid grid-cols-2 gap-2">
        <Tooltip label="Line height" triggerClassName="flex min-w-0">
          <div className="flex flex-1 items-center gap-1 min-w-0">
            <MetricInput param={metric('lineHeight', 'Line height')} layer={layer} setProp={setProp} step={0.01} icon="line-height" />
            <BindDot layer={layer} param={metric('lineHeight', 'Line height')} setProp={setProp} />
          </div>
        </Tooltip>
        <Tooltip label="Letter spacing" triggerClassName="flex min-w-0">
          <div className="flex flex-1 items-center gap-1 min-w-0">
            <MetricInput param={metric('tracking', 'Tracking')} layer={layer} setProp={setProp} suffix="em" step={0.005} icon="letter-spacing" />
            <BindDot layer={layer} param={metric('tracking', 'Tracking')} setProp={setProp} />
          </div>
        </Tooltip>
      </div>

      {/* Text alignment (editor review #10, 2026-09-27): no label and TEXT-align glyphs — the object
        * alignment row above uses the align-object glyphs, and two rows both called "Alignment" with
        * the same icons read as one control twice. Affinity's paragraph row. */}
      <div className="flex items-center gap-2">
        <SegmentedToggle
          variant="filled" size="sm"
          ariaLabel="Text alignment"
          value={layer.textAlign ?? 'center'}
          options={[
            { value: 'left',   ariaLabel: 'Align text left',   label: <Icon name="text-align-left" size={glyphSize('sm', true)} /> },
            { value: 'center', ariaLabel: 'Center text',       label: <Icon name="text-align-center" size={glyphSize('sm', true)} /> },
            { value: 'right',  ariaLabel: 'Align text right',  label: <Icon name="text-align-right" size={glyphSize('sm', true)} /> },
          ]}
          onChange={(v) => setProp('textAlign', v)}
        />
        <SegmentedToggle
          variant="filled" size="sm"
          ariaLabel="Vertical alignment"
          value={layer.verticalAlign ?? 'middle'}
          options={[
            { value: 'top',    ariaLabel: 'Align top',    label: <Icon name="text-valign-top" size={glyphSize('sm', true)} /> },
            { value: 'middle', ariaLabel: 'Align middle', label: <Icon name="text-valign-middle" size={glyphSize('sm', true)} /> },
            { value: 'bottom', ariaLabel: 'Align bottom', label: <Icon name="text-valign-bottom" size={glyphSize('sm', true)} /> },
          ]}
          onChange={(v) => setProp('verticalAlign', v)}
        />
      </div>

      <PopoverPanel popover={settings} panel={false} focus={false} className="z-50 bg-surface-secondary border border-oq-08 rounded shadow-lg p-3 flex flex-col gap-3" style={{ minWidth: 240 }}>
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
    </InspectorSection>
  )
}

/* MetricInput — a metric as a prefixed INPUT (Figma model; the sliders are
 * gone). Draft/commit via NumberField; clamps to the schema range; shows the
 * read-only "animated" state when the prop is bound (the dot drives it).
 * `icon` = a DS glyph prefix; the input hugs the value so units sit tight. */
function MetricInput({ param: p, layer, setProp, suffix, step, round = false, icon, slotRight }) {
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
      /* the glyph stands alone in the field's affordance slot — the SOLO rung for sm (16), off the
       * ladder (editor review #9: at a hand-picked 14 the line-height / tracking art read ~12) */
      affordance={icon ? <Icon name={icon} size={glyphSize('sm', true)} className="text-oq-64" /> : undefined}
      slotRight={slotRight}
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
  const chevron = (
    <Tooltip asChild label="Size presets">
      <button
        type="button"
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        aria-label="Size presets"
        className={`inline-flex items-center justify-center shrink-0 text-emphasis ${open ? '' : 'kol-btn-quiet'}`}
      >
        <Icon name="chevron-down" size={glyphSize('sm')} />
      </button>
    </Tooltip>
  )
  return (
    <div className="flex items-center gap-1 min-w-0">
      <MetricInput param={p} layer={layer} setProp={setProp} round slotRight={chevron} />
      <PopoverPanel popover={popover} panel={false} focus={false} className="z-50 bg-surface-secondary border border-oq-08 rounded shadow-lg py-1" style={{ width: 72, maxHeight: '40vh', overflowY: 'auto' }}>
        {SIZE_PRESETS.map((s) => (
          <MenuDropdownItem key={s} onClick={() => { setProp('size', s); setOpen(false) }} rowClass="kol-helper-12 px-3 h-7" shortcut={Math.round(layer.size) === s ? '✓' : undefined}>
            {s}
          </MenuDropdownItem>
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
