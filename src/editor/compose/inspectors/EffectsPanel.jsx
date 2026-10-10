import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, LabeledControl, SegmentedToggle, SettingsRow, ToggleSwitch, Slider, Input, Tooltip, XYPad } from '@kolkrabbi/kol-component'
import { PickerRow, PickerDropdown } from './TreePicker'
import { useComposeState } from '../state'
import { findLayerDeep } from '../helpers'
import { useLayerEdit } from '../useLayerEdit'
import AutoControls from '../../params/AutoControls'
import BindDot from '../../params/BindDot'
import { paramTab } from '../../params/schema'
import { deriveScopes, tidyScopes, SEED_MIN_PARAMS, allScopeParams, computeRoll, useRollSeed, SeedField } from '../../params/rolls'
import { FILTERS } from '../../../filters'
import {
  SWEEP_PRESETS, SWEEP_SHAPE_OPTIONS, SWEEP_TARGET_OPTIONS, SWEEP_TRAVEL_OPTIONS, ANGLED_SHAPES, makeSweep,
} from '../../../filters/sweeps'
import { MAX_FILTERS, resolvedChain } from '../filterChain'
import { categoryOf, presetParamOf, presetPatchFor, effectHost, flatCategories } from './effectCategories'
import Hint from '../../components/Hint'
import { useControlSize, RAIL_LABEL_W } from '../../params/controlSize'

/**
 * EffectsPanel — the Effects tab of the right rail, now hosting the labs
 * post-FX CHAIN (useCanvasFx): a layer stacks up to MAX_FILTERS ordered
 * stages (`layer.filters`), each with its own enable / params / Amount; one
 * row per stage (enable · name · reorder · remove), the selected row's
 * params rendering below through the existing param renderer.
 *
 * "Add effect" keeps the Type/Category picker flow (labs taxonomy,
 * effectCategories.js): with no stage selected the pickers ADD a stage;
 * with a stage selected they show/replace it ('None' removes — the old
 * single-filter semantics, per stage). Category stays a browse control and
 * syncs to the selected stage's bucket.
 *
 * Engine (GL) stages: at most one, always LAST (canvas adds insert before
 * it). Photo layers and 2d loop layers can host one (the loop's live canvas
 * feeds the engine); engine loops still can't host effects.
 *
 * Motion tab = the stage's `tab:'anim'` params plus, for sweep-capable
 * filters, the labs STACKED sweep rig with its one-click presets. Effect
 * Both tabs end with `StageRolls` — Generate's scoped Randomize block
 * (all + per-scope, ⌥-click resets, one seeded SeedField).
 */
const FX_TABS = [
  { value: 'effect', label: 'Effect' },
  { value: 'anim',   label: 'Animation' },
]

export default function EffectsPanel() {
  const { selectedId, layers } = useComposeState()
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null

  return (
    <div className="kol-compose-rail kol-compose-rail--inspector">
      {/* Header (title + delete) is shared in SelectionPalettePanel. */}
      <div className="kol-compose-inspector-body">
        {layer
          ? <LayerEffects key={layer.id} layer={layer} />
          : <Hint always>Select a layer to edit its effect.</Hint>}
      </div>
    </div>
  )
}

function LayerEffects({ layer }) {
  const cs = useControlSize()
  const {
    palette,
    addFilter, removeFilter, toggleFilter, moveFilter, replaceFilter,
  } = useComposeState()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  const chain = resolvedChain(layer)
  const hasEngine = chain.some((s) => s.def?.kind === 'engine')

  /* Catalog per host — the shared rule (effectCategories.js), read by the
   * mobile Effects sheet too. */
  const { effectable, engineHost, engineLoop } = effectHost(layer)

  /* Panel-local selection: the slot whose parameters are open. NOT layer state. */
  const [selIdx, setSelIdx] = useState(chain.length ? 0 : null)
  const stage = selIdx != null ? chain[selIdx] ?? null : null
  const [tab, setTab] = useState('effect')

  /* Follow external chain writes (the top-bar Effects menu adds a stage without remounting this
   * panel): a NEW stage opens; removals clamp the selection. */
  const keysRef = useRef(chain.map((s) => s.key))
  useEffect(() => {
    const prev = keysRef.current
    const keys = chain.map((s) => s.key)
    keysRef.current = keys
    const addedKey = keys.find((k) => !prev.includes(k))
    if (addedKey != null) { setSelIdx(keys.indexOf(addedKey)); return }
    if (selIdx != null && selIdx >= keys.length) setSelIdx(keys.length ? keys.length - 1 : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain.length])

  if (!effectable) {
    return (
      <p className="kol-mono-12 text-meta">
        {engineLoop
          ? "Engine loops can't host effects yet."
          : "This layer can't host an effect."}
      </p>
    )
  }

  /* ONE DROPDOWN PER EFFECT, its categories as headings (the user's 25 — it was Type, then
   * Category, then the effect). Engine (GL) effects: one stage max, last in the chain, and only
   * where the host can feed one — a slot may swap to an engine only if it is that stage. */
  const optionsFor = (i) => {
    const engineOk = engineHost && (i == null
      ? !hasEngine
      : chain[i]?.def?.kind === 'engine' || (!hasEngine && i === chain.length - 1))
    const available = FILTERS.filter((f) => f.kind !== 'engine' || engineOk)
    return flatCategories(available).flatMap((c) => c.filters.length
      ? [{ heading: c.label }, ...c.filters.map((f) => ({ value: f.id, label: f.label }))]
      : [])
  }

  /* ── stage param plumbing — the existing renderer over NESTED params ──
   * AutoControls/BindDot read values off a layer-shaped bag: the stage's
   * params spread over the layer (host props like x/y stay visible to
   * binding sources; a param key shadows any same-named layer prop). Writes
   * rebuild the filters array and go through useLayerEdit's coalesced
   * history — slider drags collapse to one undo entry, same as before. */
  const bareFilters = chain.map(({ def: _def, ...s }) => s)
  const paramsView = stage ? { ...layer, ...stage.params, id: layer.id } : null
  const setStageParams = (patch) => {
    if (selIdx == null) return
    const filters = bareFilters.map((s, i) => (i === selIdx ? { ...s, params: { ...s.params, ...patch } } : s))
    edit.patch({ filters })
  }
  const setStageProp = (k, v) => {
    if (k === 'cameraDrag') { edit.setProp(k, v); return }   /* host-level, stays flat */
    setStageParams({ [k]: v })
  }
  const setSweeps = (sweeps) => setStageProp('sweeps', sweeps)

  const renderAnimate = (p) => <BindDot layer={paramsView} param={p} setProp={setStageProp} />
  /* Hierarchy level 4 — the filter's preset param (mode/look/pattern…)
   * surfaces as "Preset" under its slot and leaves the params list. */
  const presetKey = stage?.def ? presetParamOf(stage.def.id) : null
  const presetParam = presetKey ? stage.def.params.find((p) => p.key === presetKey) : null
  const effectParams = stage?.def
    ? stage.def.params.filter((p) => paramTab(p) !== 'anim' && p !== presetParam)
    : []

  return (
    <div className="flex flex-col gap-4">
      {/* ── THE STACK — one slot per effect, top to bottom (the user's 24: Affinity's FX list) ── */}
      {chain.map((s, i) => (
        <div key={s.key} className="flex flex-col gap-3">
          <StageRow
            stage={s}
            selected={i === selIdx}
            options={optionsFor(i)}
            onSelect={() => setSelIdx(i)}
            onPick={(id) => { if (id && id !== s.id) replaceFilter(layer.id, i, id); setSelIdx(i) }}
            onToggle={() => toggleFilter(layer.id, i)}
            onRemove={() => removeFilter(layer.id, i)}
            onUp={() => moveFilter(layer.id, i, i - 1)}
            onDown={() => moveFilter(layer.id, i, i + 1)}
            canUp={i > 0 && s.def?.kind !== 'engine'}
            canDown={i < chain.length - 1 && s.def?.kind !== 'engine' && chain[i + 1]?.def?.kind !== 'engine'}
          />
          {/* the open slot's own panel: preset, camera drag, Effect · Animation, its parameters */}
          {i === selIdx && stage?.def && (
            <div className="flex flex-col gap-3">
              {presetParam && (
                <PickerRow
                  label="Preset"
                  options={presetParam.options}
                  value={stage.params[presetParam.key] ?? presetParam.default}
                  onChange={(v) => setStageParams(presetPatchFor(stage.def, v))}
                  inline
                />
              )}
              {layer.imgW != null && (
                <span className="kol-helper-12 text-meta">Filters don't apply to cropped photos.</span>
              )}
              {stage.def.orbit && (
                <SettingsRow label="Camera drag" align="fill" labelWidth={RAIL_LABEL_W}>
                  <SegmentedToggle tone="sunken" size={cs} className="w-full"
                    options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                    value={layer.cameraDrag ? 'on' : 'off'}
                    onChange={(v) => setStageProp('cameraDrag', v === 'on')}
                  />
                </SettingsRow>
              )}
              <SegmentedToggle tone="sunken" size={cs} className="w-full" value={tab} onChange={setTab} options={FX_TABS} />
              {tab === 'effect' && (
                <>
                  <AutoControls schema={effectParams} layer={paramsView} setProp={setStageProp} palette={palette} renderAnimate={renderAnimate} />
                  <StageRolls def={stage.def} view={paramsView} tab="effect" onPatch={setStageParams} />
                </>
              )}
              {tab === 'anim' && (
                <>
                  <AutoControls schema={stage.def.params} layer={paramsView} setProp={setStageProp} palette={palette} renderAnimate={renderAnimate} tab="anim" />
                  <StageRolls def={stage.def} view={paramsView} tab="anim" onPatch={setStageParams} />
                  {stage.def.sweeps && (
                    <SweepStack sweeps={Array.isArray(stage.params.sweeps) ? stage.params.sweeps : []} onChange={setSweeps} />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* ── the empty slot at the foot of the stack: pick an effect and it stacks ── */}
      {chain.length < MAX_FILTERS ? (
        <Dropdown
          variant="subtle" size={cs} className="w-full"
         
          options={[{ value: '', label: 'Add effect…' }, ...optionsFor(null)]}
          value=""
          onChange={(id) => { if (id) addFilter(layer.id, id) }}
        />
      ) : (
        <span className="kol-helper-12 text-meta">{`Chain is full (${MAX_FILTERS} effects)`}</span>
      )}
    </div>
  )
}

/**
 * StageRolls — the effect stage's Randomize block, the SAME shape Generate
 * runs (ParametersPanel): "Randomize all" over the tab's params, then one
 * button per SCOPE (the schema's sections, plus the type-based Colour
 * scope), ⌥-click to reset a scope to the filter's defaults, all seeded
 * through one editable SeedField.
 *
 * Before this the Effect tab had a single Randomize that rolled
 * `stage.def.params` WHOLESALE — motion params included, which an Effect-tab
 * press has no business touching — and the Motion tab had no randomize at
 * all. Splitting by scope fixes both: `tab` picks which half of the schema
 * this block owns, motion sections here and everything else there.
 *
 * It rolls through the shared `rolls.jsx` helpers against the stage's
 * layer-shaped `view` bag, so per-param `noRandom`, bound-param survival and
 * the range clamp all behave exactly as they do for a generator — one
 * implementation, not a second dialect.
 */
export function StageRolls({ def, view, tab, onPatch, inline = false }) {
  const cs = useControlSize()
  const seed = useRollSeed(view)
  const motion = tab === 'anim'
  /* Split by TAB, not by section name — the same rule AutoControls renders
   * by. Section names are the filter author's (`Path`, `Transform`, `Flow`
   * are all motion in the gl engines), so keying the split off a fixed
   * MOTION_SECTIONS list would have put a param's slider on one tab and its
   * roll button on the other. */
  const params = def.params.filter((p) => (paramTab(p) === 'anim') === motion)
  const allParams = motion ? params.filter((p) => !p.noRandom) : allScopeParams(params, view)
  const scopes = tidyScopes(deriveScopes(params, view), allParams)

  const roll = (params, scope) => {
    if (!params.length) return
    onPatch(computeRoll(view, params, seed.take(), { stripNoRandom: !!scope?.motion }))
  }
  const reset = (params) => {
    const patch = {}
    for (const p of params) if (p.default !== undefined) patch[p.key] = p.default
    if (Object.keys(patch).length) onPatch(patch)
  }

  if (!allParams.length && !scopes.length) return null

  return (
    <div className="flex flex-col gap-2">
      {allParams.length >= SEED_MIN_PARAMS && <SeedField seed={seed} inline={inline} />}
      {allParams.length > 0 && (
        <div className="flex gap-2">
          <Button tone="primary" size={cs} className="flex-1 min-w-0"
            onClick={(e) => (e.altKey ? reset(allParams) : roll(allParams))}>
            {motion ? 'Randomize motion' : 'Randomize all'}
          </Button>
          {/* reset, visible — it was only ⌥ on the button beside it */}
          <Tooltip label="Reset to defaults" shortcut="R"><Button tone="primary" size={cs} iconOnly="rotate-left" aria-label="Reset to defaults" onClick={() => reset(allParams)} className="shrink-0" /></Tooltip>
        </div>
      )}
      {scopes.length > 0 && (
        /* Odd counts keep the lone half-width cell — Generate's grid does. */
        <div className="grid grid-cols-2 gap-2">
          {scopes.map((sc) => (
            <Button key={sc.id} tone="primary" size={cs}
              onClick={(e) => (e.altKey ? reset(sc.params) : roll(sc.params, sc))}>
              {sc.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

/* One chain row: enable toggle · name · up/down · remove. Click selects. */
function StageRow({ stage, selected, options, onSelect, onPick, onToggle, onRemove, onUp, onDown, canUp, canDown }) {
  const cs = useControlSize()
  const enabled = stage.enabled !== false
  const iconBtn = (label, onClick, disabled, icon, className = '') => (
    <Tooltip label={label}><Button
      tone="ghost" quiet size={cs} iconOnly={icon}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`shrink-0 ${className}`}
    /></Tooltip>
  )
  /* a slot: eye · the effect's own dropdown (pick to swap it) · reorder · delete. Its row lights
     while its panel is open below it. */
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-1 rounded ${selected ? 'bg-oq-08' : ''}`}
    >
      {iconBtn(enabled ? 'Disable effect' : 'Enable effect', onToggle, false, enabled ? 'eye-on' : 'eye-off')}
      <div className={`flex-1 min-w-0 ${enabled ? '' : 'opacity-60'}`}>
        <Dropdown variant="subtle" size={cs} className="w-full" options={options} value={stage.id} onChange={onPick} />
      </div>
      {iconBtn('Move up', onUp, !canUp, 'chevron-down', 'rotate-180')}
      {iconBtn('Move down', onDown, !canDown, 'chevron-down')}
      {iconBtn('Delete effect', onRemove, false, 'x')}
    </div>
  )
}

/* Stacked sweep rig (labs SweepControls over the sweeps array): one-click
 * presets append a tuned sweep, plus add/remove/edit custom. Speed is whole
 * wavefront cycles per loop (integer — the editor's loop-safe time model).
 * Exported: labs' Motion tab (LabsParams) renders the same rig; `inline`
 * is its skin — enable becomes the DS ToggleSwitch and the sliders go
 * label-left with a value readout (the labs sweep card). */
export function SweepStack({ sweeps, onChange, inline = false }) {
  const cs = useControlSize()
  const shapeLabel = (v) => SWEEP_SHAPE_OPTIONS.find((s) => s.value === v)?.label ?? v
  const add = (preset) => onChange([...sweeps, preset ? makeSweep(preset.shape, preset) : makeSweep()])
  const removeAt = (i) => onChange(sweeps.filter((_, j) => j !== i))
  const setField = (i, k, v) => onChange(sweeps.map((sw, j) => (j === i ? { ...sw, [k]: v } : sw)))

  /* The DS Slider is already the row (track + editable readout); inline
   * swaps its sentence-case label for the labs uppercase pair. */
  const Row = ({ label, ...slider }) => inline ? (
    <div className="flex items-center gap-3">
      <span className="kol-helper-10 tracking-widest text-meta whitespace-nowrap">{label}</span>
      <div className="flex-1 min-w-0"><Slider {...slider} /></div>
    </div>
  ) : (
    <LabeledControl label={label}><Slider {...slider} /></LabeledControl>
  )

  return (
    <div className="flex flex-col gap-3">
      <span className="kol-eyebrow text-fg-80">Motion</span>
      <PickerDropdown
        options={[{ value: '', label: 'Add motion…' }, ...SWEEP_PRESETS.map((p) => ({ value: p.name, label: p.name }))]}
        value=""
        onChange={(name) => {
          const p = SWEEP_PRESETS.find((x) => x.name === name)
          if (p) add(p)
        }}
      />
      {sweeps.map((sw, i) => {
        const enabled = sw.enabled !== false
        const isReveal = sw.target === 'reveal'
        const angled = ANGLED_SHAPES.has(sw.shape ?? 'linear')
        return (
          <div key={i} className="flex flex-col gap-2 p-2 rounded bg-oq-04">
            <div className="flex items-center gap-2">
              {inline ? (
                <>
                  <span className={`kol-helper-10 tracking-widest ${enabled ? 'text-emphasis' : 'text-meta'}`}>
                    {shapeLabel(sw.shape ?? 'linear')}
                  </span>
                  <ToggleSwitch size={cs} checked={enabled} onChange={(v) => setField(i, 'enabled', v)} />
                  <div className="flex-1" />
                </>
              ) : (
                <>
                  <Tooltip label={enabled ? 'Disable sweep' : 'Enable sweep'}><Button
                    tone="ghost" quiet size={cs} iconOnly={enabled ? 'eye-on' : 'eye-off'}
                    aria-label={enabled ? 'Disable sweep' : 'Enable sweep'}
                    onClick={() => setField(i, 'enabled', !enabled)}
                    className="shrink-0"
                  /></Tooltip>
                  <span className={`kol-helper-12 flex-1 truncate ${enabled ? 'text-emphasis' : 'text-meta'}`}>
                    {shapeLabel(sw.shape ?? 'linear')}
                  </span>
                </>
              )}
              <Tooltip label="Delete sweep"><Button tone="ghost" quiet size={cs} iconOnly="x" aria-label="Delete sweep" className="shrink-0" onClick={() => removeAt(i)} /></Tooltip>
            </div>
            {enabled && (
              <>
                <PickerDropdown options={SWEEP_SHAPE_OPTIONS} value={sw.shape ?? 'linear'} onChange={(v) => setField(i, 'shape', v)} />
                <PickerDropdown options={SWEEP_TARGET_OPTIONS} value={sw.target ?? 'brightness'} onChange={(v) => setField(i, 'target', v)} />
                {!isReveal && (
                  <Row label="Amount" min={-1} max={1} step={0.05} value={sw.amount ?? 0.6} onChange={(v) => setField(i, 'amount', v)} />
                )}
                <Row label="Speed · cycles" min={-4} max={4} step={1} value={sw.speed ?? 1} onChange={(v) => setField(i, 'speed', v)} />
                <Row label="Width" min={0.05} max={1} step={0.01} value={sw.width ?? 0.35} onChange={(v) => setField(i, 'width', v)} />
                {angled && (
                  <Row label="Angle" min={0} max={360} step={1} value={sw.angle ?? 0} onChange={(v) => setField(i, 'angle', v)} />
                )}
                {/* TRAVEL + ORIGIN (plan 26 § 5) — ping-pong runs out and back on whole cycles; the
                    origin is a pad over the frame (top-left = 0,0), not two blind sliders */}
                <PickerDropdown options={SWEEP_TRAVEL_OPTIONS} value={sw.travel ?? 'forward'} onChange={(v) => setField(i, 'travel', v)} />
                {(sw.shape ?? 'linear') !== 'noise' && (
                  <XYPad
                    xValue={sw.cx ?? 0.5} yValue={sw.cy ?? 0.5} xMin={0} xMax={1} yMin={1} yMax={0}
                    xLabel="Origin X" yLabel="Origin Y"
                    onChange={(x, y) => onChange(sweeps.map((s, j) => (j === i ? { ...s, cx: Math.round(x * 100) / 100, cy: Math.round(y * 100) / 100 } : s)))}
                  />
                )}
              </>
            )}
          </div>
        )
      })}
      <Button tone="primary" size={cs} className="w-full" iconLeft="plus" iconSize={12} onClick={() => add()}>
        Add custom sweep
      </Button>
    </div>
  )
}
