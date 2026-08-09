import { useEffect, useState } from 'react'
import { SegmentedToggle, Divider, Dropdown } from '@kolkrabbi/kol-component'
import EditorButton from '../components/EditorButton'
import EditorIcon from '../icons/EditorIcon'
import { useComposeState } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import AutoControls from '../params/AutoControls'
import BindDot from '../params/BindDot'
import { paramTab } from '../params/schema'
import { PHOTO_SCHEMA } from '../params/schemas/photo'
import { mulberry32, randomSeed, randomizeSchema, mergeRoll } from '../lib/rng'
import { FILTERS } from '../../filters'
import { resolvedChain, MAX_FILTERS } from '../compose/filterChain'
import { effectCategories, categoryOf, presetParamOf } from '../compose/inspectors/effectCategories'
import { SweepStack } from '../compose/inspectors/EffectsPanel'
import { LoopFields } from '../compose/inspectors/ParametersPanel'
import KineticPanel from '../compose/inspectors/KineticPanel'
import { KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { randomiseComp } from '../../kinetic/knobs'
import { MISC_TREE } from '../../loops/taxonomy'
import { loopById, presetsInGroup, presetsInSub, presetLayerPatch } from '../../loops/registry'
import { computeRoll, allScopeParams } from '../params/rolls'
import { useAppSettings, getAppSettings, setAppSetting } from '../lib/appSettings'
import { useLabsLayer } from './useLabsLayer'

/* R = reset (re-pick the selection at its defaults) · Shift+R = reroll —
 * labs' keys, bound by whichever surface is mounted (one layer, one surface).
 * Same typing guard as the Space transport key. */
function useLabsKeys(onReset, onReroll) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'r' && e.key !== 'R') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return
      e.preventDefault()
      if (e.shiftKey) onReroll?.()
      else onReset?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}

/**
 * LabsParams — labs' right-rail surface (the reskin arc), replacing the
 * editor's Parameters · Effects tab pair in labs mode. The labs rail model
 * at 1:1 (reference /radar/ascii, /pattern/interlace/herringbone):
 *
 *   chips row      the active leaf's SIBLINGS (Dither ASCII Bitmap) — the
 *                  same catalog data the nav renders, one hop up
 *   Effect·Motion  two tabs, labs naming — Effect is the whole parametric
 *                  surface (sectioned via schema `section` metadata),
 *                  Motion is anim params + the sweeps rig / modulation
 *   Randomize      full-width, INSIDE the section flow (after the section
 *                  holding the filter's preset param — labs' position)
 *
 * Nothing here is a new panel: it composes the shared pieces (AutoControls,
 * SweepStack, LoopFields, KineticPanel) over the same registries — labs
 * presentation, editor logic (the handoff's skin-not-fork rule).
 */
const LABS_TABS = [
  { value: 'effect', label: 'Effect' },
  { value: 'anim',   label: 'Motion' },
]
const ANIM_HINT = 'Animate any parameter via its bind dot.'

/* The active leaf's siblings — text chips, active one lit (labs' rail top). */
function ChipsRow({ options, active, onPick }) {
  if (!options?.length) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onPick(o.value)}
          className={[
            'kol-mono-12 uppercase tracking-[0.06em] cursor-pointer',
            o.value === active ? 'text-emphasis' : 'text-meta hover:text-emphasis',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* Shared frame: chips over the Effect · Motion strip over the tab body. */
function Surface({ chips, active, onPick, tab, setTab, children }) {
  return (
    <div className="flex flex-col gap-4">
      <ChipsRow options={chips} active={active} onPick={onPick} />
      <SegmentedToggle value={tab} onChange={setTab} options={LABS_TABS} size="sm" />
      {children}
    </div>
  )
}

/* ── Effects: a photo layer + its filter chain (labs' effect pages). ──
 * Chips = the active filter's category siblings (effectCategories — the
 * repo's own effect-group taxonomy). Same nested-param plumbing as
 * EffectsPanel: stage params spread over a layer-shaped bag, writes rebuild
 * `filters` through coalesced history. Labs is one-effect, so stage 0. */
function EffectSurface({ layer, tab, setTab, showMod }) {
  const { addFilter, replaceFilter, removeFilter, toggleFilter, updateLayer, palette } = useComposeState()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const chain = resolvedChain(layer)
  const stage = chain[0] ?? null

  const cat = effectCategories(FILTERS).find((c) => c.id === categoryOf(stage?.id))
  const chips = (cat?.filters ?? []).map((f) => ({ value: f.id, label: f.label }))
  const onChip = (id) => {
    if (!stage) { addFilter(layer.id, id); return }
    if (id !== stage.id) replaceFilter(layer.id, 0, id)
  }

  const bareFilters = chain.map(({ def: _def, ...s }) => s)
  const paramsView = stage ? { ...layer, ...stage.params, id: layer.id } : layer
  /* One write path per chain index — stage 0 is the page's effect, the rest
   * are its Post-Processing stack. */
  const setStagePropAt = (idx) => (k, v) => {
    const filters = bareFilters.map((s, i) => (i === idx ? { ...s, params: { ...s.params, [k]: v } } : s))
    edit.patch({ filters })
  }
  const setStageProp = setStagePropAt(0)
  const renderAnimate = showMod ? (p) => <BindDot layer={paramsView} param={p} setProp={setStageProp} /> : undefined

  const roll = () => {
    if (!stage) return
    const rolled = randomizeSchema(stage.def.params, mulberry32(randomSeed()))
    const filters = bareFilters.map((s, i) => (i === 0 ? { ...s, params: mergeRoll(s.params, rolled) } : s))
    updateLayer(layer.id, { filters })   /* discrete — one undo per roll */
  }
  useLabsKeys(
    () => { if (stage) updateLayer(layer.id, { filters: bareFilters.map((s, i) => (i === 0 ? { ...s, params: {} } : s)) }) },
    roll,
  )

  /* Bare photo (uploaded, no effect picked yet): fit params, nothing else. */
  if (!stage) {
    return (
      <Surface chips={chips} active={null} onPick={onChip} tab={tab} setTab={setTab}>
        <AutoControls schema={PHOTO_SCHEMA} layer={layer} setProp={edit.setProp} palette={palette} renderAnimate={(p) => <BindDot layer={layer} param={p} setProp={edit.setProp} />} tab={tab === 'anim' ? 'anim' : 'style'} emptyHint="Pick an effect from the nav." />
      </Surface>
    )
  }

  /* Randomize closes the PICKING CLUSTER — the preset param plus the selects
   * that follow it (labs: Mode + Shape → Randomize; Algorithm + Charset →
   * Randomize). The cluster renders as ONE section (sections stripped — its
   * dropdowns carry their own labels) so no hairline lands inside it; labs
   * divides around the cluster, never within. No preset param → the whole
   * schema is the cluster and Randomize follows it. */
  const params = stage.def.params.filter((p) => paramTab(p) !== 'anim')
  const pKey = presetParamOf(stage.def.id)
  const pIdx = pKey ? params.findIndex((x) => x.key === pKey) : -1
  let cut = params.length
  if (pIdx >= 0) {
    let i = pIdx
    while (i + 1 < params.length && params[i + 1].type === 'select') i++
    cut = i + 1
  }
  const head = pIdx > 0 ? params.slice(0, pIdx) : []
  const cluster = pIdx >= 0
    ? params.slice(pIdx, cut).map((p) => ({ ...p, section: undefined }))
    : params

  const auto = { layer: paramsView, setProp: setStageProp, palette, renderAnimate, inline: true }
  return (
    <Surface chips={chips} active={stage.id} onPick={onChip} tab={tab} setTab={setTab}>
      {tab === 'effect' && (
        <>
          {head.length > 0 && <AutoControls schema={head} {...auto} />}
          {/* Randomize lives INSIDE the picking cluster's block (labs: tight
              under Shape) — the wrapper is itself a section, so the hairline
              lands before it and the internal gap stays the tight one. */}
          <div className="kol-params-section flex flex-col gap-4">
            <AutoControls schema={cluster} {...auto} />
            <EditorButton variant="primary" size="sm" className="w-full" iconLeft="refresh" onClick={roll}>
              Randomize
            </EditorButton>
          </div>
          <Divider />
          {cut < params.length && (
            <>
              <AutoControls schema={params.slice(cut)} {...auto} />
              <Divider />
            </>
          )}
          <PostProcessing
            chain={chain} layer={layer} hostView={paramsView}
            addFilter={addFilter} removeFilter={removeFilter} toggleFilter={toggleFilter}
            setStagePropAt={setStagePropAt} palette={palette} showMod={showMod}
          />
        </>
      )}
      {tab === 'anim' && (
        <>
          <AutoControls schema={stage.def.params} {...auto} tab="anim" emptyHint={stage.def.sweeps ? undefined : ANIM_HINT} />
          {stage.def.sweeps && (
            <SweepStack
              sweeps={Array.isArray(stage.params.sweeps) ? stage.params.sweeps : []}
              onChange={(sweeps) => setStageProp('sweeps', sweeps)}
              inline
            />
          )}
        </>
      )}
    </Surface>
  )
}

/* ── Post-Processing (labs "Add FX…"): the chain's stages past the page's
 * own effect — add from the full catalog, toggle/remove per stage, each
 * stage's params editable in place. Engine stages stay single-and-last
 * (the chain contract), so the picker drops engines once one exists. ── */
function PostProcessing({ chain, layer, hostView, addFilter, removeFilter, toggleFilter, setStagePropAt, palette, showMod }) {
  const hasEngine = chain.some((s) => s.def?.kind === 'engine')
  const options = [
    { value: '', label: 'Add FX…' },
    ...FILTERS.filter((f) => f.kind !== 'engine' || !hasEngine).map((f) => ({ value: f.id, label: f.label ?? f.id })),
  ]
  const post = chain.slice(1)
  return (
    <div className="kol-params-section flex flex-col gap-4">
      <span className="kol-helper-10 text-meta">Post-Processing</span>
      {post.map((s, i) => {
        const idx = i + 1
        const enabled = s.enabled !== false
        const view = { ...hostView, ...s.params, id: layer.id }
        const setProp = setStagePropAt(idx)
        return (
          <div key={s.key ?? idx} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={enabled ? 'Disable effect' : 'Enable effect'}
                onClick={() => toggleFilter(layer.id, idx)}
                className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-body hover:text-emphasis cursor-pointer"
                style={{ border: 'none', background: 'transparent' }}
              >
                <EditorIcon name={enabled ? 'eye-on' : 'eye-off'} size={12} />
              </button>
              <span className={`kol-helper-12 flex-1 truncate ${enabled ? 'text-emphasis' : 'text-meta'}`}>
                {s.def?.label ?? s.id}
              </span>
              <button
                type="button"
                aria-label="Remove effect"
                onClick={() => removeFilter(layer.id, idx)}
                className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-body hover:text-emphasis cursor-pointer"
                style={{ border: 'none', background: 'transparent' }}
              >
                <EditorIcon name="close" size={11} />
              </button>
            </div>
            {enabled && s.def && (
              <AutoControls
                schema={s.def.params.filter((p) => paramTab(p) !== 'anim')}
                layer={view} setProp={setProp} palette={palette} inline
                renderAnimate={showMod ? (p) => <BindDot layer={view} param={p} setProp={setProp} /> : undefined}
              />
            )}
          </div>
        )
      })}
      <Dropdown
        variant="subtle" size="sm" className="w-full"
        options={options}
        value=""
        disabled={chain.length >= MAX_FILTERS}
        onChange={(id) => { if (id) addFilter(layer.id, id) }}
      />
    </div>
  )
}

/* ── Generative (loop + misc): chips = the group's presets (the nav's own
 * leaves), body = the shared LoopFields — labs-effect folds Generate+Style
 * into the Effect tab; the chips row replaces the Category/Preset stack. ── */
function GenerativeSurface({ layer, tab, setTab, showMod, tree }) {
  const { updateLayer, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  /* Chips = the active CATEGORY's presets (hierarchy law: nav picks the
   * category, the rail's chips are its preset selector — Para Type's Glyphs
   * category makes this the letter selector). Sub-less legacy groups fall
   * back to the whole group, capped so a 55-preset flood can't wall the rail. */
  const current = presetsInGroup(layer.loopGroup).find((p) => p.id === layer.presetId)
  const presets = current?.sub
    ? presetsInSub(layer.loopGroup, current.sub)
    : presetsInGroup(layer.loopGroup)
  const chips = current?.sub || presets.length <= 12
    ? presets.map((p) => ({ value: p.id, label: p.label }))
    : null
  const onChip = (id) => {
    const p = presets.find((x) => x.id === id)
    if (p && id !== layer.presetId) setOnly(layer.type, presetLayerPatch(p, layer.loopGroup))
  }

  useLabsKeys(
    () => { if (current) setOnly(layer.type, presetLayerPatch(current, layer.loopGroup)) },
    () => {
      const schema = loopById(layer.loopId)?.params ?? []
      updateLayer(layer.id, computeRoll(layer, allScopeParams(schema, layer), randomSeed()))
    },
  )

  return (
    <Surface chips={chips} active={layer.presetId} onPick={onChip} tab={tab} setTab={setTab}>
      <LoopFields
        layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer}
        palette={palette} renderAnimate={showMod ? (p) => <BindDot layer={layer} param={p} setProp={edit.setProp} /> : undefined}
        tab={tab === 'effect' ? 'labs-effect' : 'anim'} tabStrip={null} picker={false} tree={tree} inline
      />
    </Surface>
  )
}

/* ── Kinetic: chips = the preset's sub-group siblings (KINETIC_PRESETS),
 * body = the shared KineticPanel (Elements editing intact, picker off). ── */
function KineticSurface({ layer, tab, setTab, showMod }) {
  const { updateLayer, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  const current = KINETIC_PRESETS.find((p) => p.id === layer.presetId)
  const sibs = current ? KINETIC_PRESETS.filter((p) => p.sub === current.sub) : []
  const chips = sibs.map((p) => ({ value: p.id, label: p.label }))
  const onChip = (id) => {
    const p = sibs.find((x) => x.id === id)
    if (p && id !== layer.presetId) setOnly('kinetic', { presetId: p.id, presetLabel: p.label, comp: presetComp(p) })
  }

  useLabsKeys(
    () => { if (current) setOnly('kinetic', { presetId: current.id, presetLabel: current.label, comp: presetComp(current) }) },
    () => {
      const seed = randomSeed()
      const rng = mulberry32(seed >>> 0)
      let next = layer.comp ?? { instances: [] }
      ;(next.instances ?? []).forEach((_, i) => { next = randomiseComp(next, i, rng) })
      updateLayer(layer.id, { comp: next, _rollSeed: seed })
    },
  )

  return (
    <Surface chips={chips} active={layer.presetId} onPick={onChip} tab={tab} setTab={setTab}>
      <KineticPanel
        layer={layer} setProp={edit.setProp} updateLayer={updateLayer} palette={palette}
        /* noop, not undefined — MorphBlendKnob calls it unconditionally */
        renderAnimate={showMod ? (p) => <BindDot layer={layer} param={p} setProp={edit.setProp} /> : () => null}
        tab={tab === 'effect' ? 'labs-effect' : 'anim'} tabStrip={null} picker={false}
      />
    </Surface>
  )
}

export default function LabsParams() {
  const { layer } = useLabsLayer()
  const [tab, setTab] = useState('effect')
  /* Modulation dots hide by default (labs has none) — M or Settings →
   * Modulation dots brings them back. */
  const showMod = !!useAppSettings().labsModDots

  /* A nav pick lands on the Effect tab — both events the nav dispatches. */
  useEffect(() => {
    const toEffect = () => setTab('effect')
    window.addEventListener('kol:open-params', toEffect)
    window.addEventListener('kol:open-effects', toEffect)
    const onKey = (e) => {
      if (e.key !== 'm' && e.key !== 'M') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return
      setAppSetting('labsModDots', !getAppSettings().labsModDots)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('kol:open-params', toEffect)
      window.removeEventListener('kol:open-effects', toEffect)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const shared = { tab, setTab, showMod }
  if (!layer) return <p className="kol-mono-12 text-meta">Pick an effect or generator from the nav.</p>
  if (layer.type === 'photo') return <EffectSurface key={layer.id} layer={layer} {...shared} />
  if (layer.type === 'loop') return <GenerativeSurface key={layer.id} layer={layer} {...shared} />
  if (layer.type === 'misc') return <GenerativeSurface key={layer.id} layer={layer} {...shared} tree={MISC_TREE} />
  if (layer.type === 'kinetic') return <KineticSurface key={layer.id} layer={layer} {...shared} />
  return <p className="kol-mono-12 text-meta">This layer has no labs surface.</p>
}
