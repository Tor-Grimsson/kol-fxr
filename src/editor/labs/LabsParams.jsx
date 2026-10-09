import { useEffect, useState } from 'react'
import { Button, SegmentedToggle, ToggleSwitch, Divider, Dropdown, LabeledControlSection, Tag, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import AutoControls from '../params/AutoControls'
import BindDot from '../params/BindDot'
import { paramTab } from '../params/schema'
import { PHOTO_SCHEMA } from '../params/schemas/photo'
import { mulberry32, randomSeed, randomizeSchema, mergeRoll } from '../lib/rng'
import { FILTERS } from '../../filters'
import { resolvedChain, MAX_FILTERS } from '../compose/filterChain'
import { effectCategories, categoryOf, presetParamOf, FX_RACK_GROUPS, rackGroupFilters, postProcessingFilters } from '../compose/inspectors/effectCategories'
import { SweepStack, StageRolls } from '../compose/inspectors/EffectsPanel'
import { LoopFields } from '../compose/inspectors/LoopFields'
import KineticPanel from '../compose/inspectors/KineticPanel'
import { KINETIC_TREE, KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { randomiseComp } from '../../kinetic/knobs'
import { GENERATIVE_TREE, MISC_TREE } from '../../loops/taxonomy'
import { groupById, loopById, presetsInGroup, presetsInSub, presetLayerPatch } from '../../loops/registry'
import { computeRoll, allScopeParams } from '../params/rolls'
import { useBindDots, toggleDots } from '../params/dotVisibility'
import { useLabsLayer } from './useLabsLayer'
import MorphTab from '../morph/MorphTab'
import { useMorph } from '../morph/morphStore'
import Hint from '../components/Hint'
import { useControlSize, stripClamp } from '../params/controlSize'
import { isTyping } from '../state/keymap'
import { useLabsKeys } from './useLabsKeys'

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
/* Generative pages keep labs' three-tab strip — Effect·Motion is the
 * EFFECT-page shape only (the labs page survey, 2026-08-09). */
const GEN_TABS = [
  { value: 'generate', label: 'Generate' },
  { value: 'style',    label: 'Style' },
  { value: 'anim',     label: 'Animation' },
]
/* the touch rail's 264 gives three cells ~77px each — "Generate" and
   "Animation" at mono-14 do not fit, so the strip reads short there (user,
   2026-09-01: "shorten gen style ani") */
const GEN_TABS_TOUCH = [
  { value: 'generate', label: 'Gen' },
  { value: 'style',    label: 'Style' },
  { value: 'anim',     label: 'Anim' },
]

/* The trio row — labs' RailVariantNav: BARE kol-helper-12 text links,
 * authored case (never uppercased), justify-between, active = emphasis.
 * `pills` is the para-type variant (labs ChipsRow): bordered pill chips. */
function ChipsRow({ options, active, onPick, spread = false, pills = false }) {
  const cs = useControlSize()
  if (!options?.length) return null
  if (pills) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {options.map((o) => (
          <Tag key={o.value} size="xs" hash={false} active={o.value === active} onClick={() => onPick(o.value)}>
            {o.label}
          </Tag>
        ))}
      </div>
    )
  }
  /* ONE STRIP STYLE (2026-10-06; the user: "too many labels … unorganised structure"): the
     siblings were bare text spread across the row, a third look beside the Effect · Motion strip
     and the source strip (gone — the File tab has every source action). They are the DS strip now,
     the selected sibling lit; `spread` is the strip's own equal cells. */
  return (
    <SegmentedToggle
      value={active ?? null}
      onChange={onPick}
      options={options}
      size={cs}
      ariaLabel="Siblings"
      className={stripClamp(cs)}
    />
  )
}

/* Shared frame — labs' rail header zone: a RailHeader line (title, trio
 * links, or pills) over the page's tab strip over the body. Body gap = 20px
 * (labs' rail gap-5); the tab strip is the caller's (Effect·Motion on
 * effect pages, Generate·Style·Animation on generative ones). */
function Surface({ chips, active, onPick, spread, pills, title, tabStrip, preStrip, fx = false, children }) {
  /* on touch the rail is a sheet whose header already reads the title (LabsView) */
  const titled = useControlSize() === 'sm'
  return (
    <div className={`flex flex-col gap-5${fx ? ' kol-labs-fx' : ''}`}>
      {/* The surface title wears the SAME eyebrow as the sections under it
          (user ruling 2026-08-27) — it was `kol-helper-12 text-emphasis`,
          sentence case, the one label in the rail on its own type role. */}
      {title && titled && <p className="kol-eyebrow text-fg-96">{title}</p>}
      {chips && <ChipsRow options={chips} active={active} onPick={onPick} spread={spread} pills={pills} />}
      {preStrip}
      {tabStrip}
      {children}
    </div>
  )
}

/* ── Effects: a photo layer + its filter chain (labs' effect pages). ──
 * Chips = the active filter's category siblings (effectCategories — the
 * repo's own effect-group taxonomy). Same nested-param plumbing as
 * EffectsPanel: stage params spread over a layer-shaped bag, writes rebuild
 * `filters` through coalesced history. Labs is one-effect, so stage 0. */
function EffectSurface({ layer, showMod }) {
  const cs = useControlSize()
  const [tab, setTab] = useState('effect')
  /* The nav's effect pick flips back to the Effect tab. */
  useEffect(() => {
    const toEffect = () => setTab('effect')
    window.addEventListener('kol:open-effects', toEffect)
    return () => window.removeEventListener('kol:open-effects', toEffect)
  }, [])
  const { addFilter, replaceFilter, removeFilter, toggleFilter, updateLayer, palette } = useComposeState()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const chain = resolvedChain(layer)
  const stage = chain[0] ?? null

  /* Chips only for the halftone TRIO (labs' one chipped effect family —
   * Dither · ASCII · Bitmap are modes of one page there). Every other
   * effect page carries a title; its siblings already live in the sidebar. */
  const cat = effectCategories(FILTERS).find((c) => c.id === categoryOf(stage?.id))
  const isTrio = cat?.id === 'halftone'
  const chips = isTrio ? (cat?.filters ?? []).map((f) => ({ value: f.id, label: f.label })) : null
  const title = !isTrio && stage ? stage.def.label : null
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

  /* Patch stage 0's params in one write — StageRolls hands back a whole
   * param patch, not a key/value pair like setStageProp. */
  const patchStageParams = (patch) => {
    const filters = bareFilters.map((s, i) => (i === 0 ? { ...s, params: { ...s.params, ...patch } } : s))
    updateLayer(layer.id, { filters })   /* discrete — one undo per roll */
  }
  /* R rolls the EFFECT half only — motion is the Motion tab's own button now
   * (it used to roll stage.def.params wholesale, motion included). */
  const roll = () => {
    if (!stage) return
    patchStageParams(computeRoll(paramsView, allScopeParams(stage.def.params, paramsView), randomSeed()))
  }
  useLabsKeys(
    () => { if (stage) updateLayer(layer.id, { filters: bareFilters.map((s, i) => (i === 0 ? { ...s, params: {} } : s)) }) },
    roll,
  )

  /* ── FX RACK mode (labs /radar/effects/<group>): the layer IS a stack.
   * Title "Effects", the whole chain as cards, the category's adder. ── */
  const rackGroup = layer.fxGroup ? FX_RACK_GROUPS.find((g) => g.id === layer.fxGroup) : null
  if (rackGroup) {
    const stackProps = { chain, layer, hostView: paramsView, toggleFilter, removeFilter, setStagePropAt, palette, showMod }
    const rackOptions = [
      { value: '', label: 'Add effect…' },
      ...rackGroupFilters(rackGroup, FILTERS).map((f) => ({
        value: f.id,
        label: `${f.label ?? f.id}${f.kind === 'pixi' ? ' · GPU' : ''}`,
      })),
    ]
    return (
      <Surface title="Effects" fx tabStrip={<SegmentedToggle value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
        {tab === 'effect' && (
          <>
            <LabeledControlSection label="Effect stack" divided>
              {chain.length === 0 && <Hint className="kol-mono-10 text-meta">No effects yet — add one below.</Hint>}
              <StackCards {...stackProps} from={0} />
            </LabeledControlSection>
            <Divider />
            <LabeledControlSection label={rackGroup.label} divided>
              <Dropdown
                variant="subtle" size={cs} className="w-full"
                options={rackOptions}
                value=""
                disabled={chain.length >= MAX_FILTERS}
                onChange={(id) => { if (id) addFilter(layer.id, id) }}
              />
            </LabeledControlSection>
          </>
        )}
        {tab === 'anim' && stage?.def?.sweeps && (
          <SweepStack
            sweeps={Array.isArray(stage.params.sweeps) ? stage.params.sweeps : []}
            onChange={(sweeps) => setStageProp('sweeps', sweeps)}
            inline
          />
        )}
      </Surface>
    )
  }

  /* Bare photo (uploaded, no effect picked yet): fit params, nothing else. */
  if (!stage) {
    return (
      <Surface chips={chips} active={null} onPick={onChip} spread={isTrio} fx tabStrip={<SegmentedToggle value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
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
    <Surface chips={chips} active={stage.id} onPick={onChip} spread={isTrio} title={title} fx
      tabStrip={<SegmentedToggle value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
      {tab === 'effect' && (
        <>
          {head.length > 0 && <AutoControls schema={head} {...auto} />}
          {/* Randomize lives INSIDE the picking cluster's block — the wrapper
              is itself a section, so the hairline lands before it and the
              internal gap stays the tight one. */}
          <LabeledControlSection divided>
            <AutoControls schema={cluster} {...auto} />
            <StageRolls inline def={stage.def} view={paramsView} tab="effect" onPatch={patchStageParams} />
          </LabeledControlSection>
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
          <AutoControls schema={stage.def.params} {...auto} tab="anim" />
          <StageRolls inline def={stage.def} view={paramsView} tab="anim" onPatch={patchStageParams} />
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

/* labs' FX cards: p-2 rounded bg-oq-04, ToggleSwitch header (the fx name IS
 * the enable label), ghost cross pushed right, params inline while enabled.
 * `from` slices the chain — 0 for the rack (the stack IS the page), 1 for a
 * page's Post-Processing block. */
function StackCards({ chain, from = 0, layer, hostView, toggleFilter, removeFilter, setStagePropAt, palette, showMod }) {
  const cs = useControlSize()
  return chain.slice(from).map((s, i) => {
    const idx = i + from
    const enabled = s.enabled !== false
    const view = { ...hostView, ...s.params, id: layer.id }
    const setProp = setStagePropAt(idx)
    return (
      <div key={s.key ?? idx} className="flex flex-col gap-2 p-2 rounded bg-oq-04">
        <div className="flex items-center gap-2">
          <ToggleSwitch
            size={cs} checked={enabled}
            onChange={() => toggleFilter(layer.id, idx)}
            label={s.def?.label ?? s.id}
          />
          <Tooltip asChild label="Delete effect">
          <Button tone="ghost" quiet size="xs" iconOnly="x" aria-label="Delete effect" className="ml-auto shrink-0" onClick={() => removeFilter(layer.id, idx)} />
          </Tooltip>
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
  })
}

/* ── Post-Processing (labs "Add FX..."): the stages past the page's own
 * effect. The adder draws from labs' CANVAS_FX_DEFS equivalent — the rack's
 * Post-Processing category — never the whole catalog. ── */
function PostProcessing({ chain, layer, hostView, addFilter, removeFilter, toggleFilter, setStagePropAt, palette, showMod }) {
  const cs = useControlSize()
  const options = [
    { value: '', label: 'Add FX…' },
    ...postProcessingFilters(FILTERS).map((f) => ({ value: f.id, label: f.label ?? f.id })),
  ]
  return (
    <LabeledControlSection label="Post-Processing" divided>
      <StackCards
        chain={chain} from={1} layer={layer} hostView={hostView}
        toggleFilter={toggleFilter} removeFilter={removeFilter}
        setStagePropAt={setStagePropAt} palette={palette} showMod={showMod}
      />
      <Dropdown
        variant="subtle" size={cs} className="w-full"
        options={options}
        value=""
        disabled={chain.length >= MAX_FILTERS}
        onChange={(id) => { if (id) addFilter(layer.id, id) }}
      />
    </LabeledControlSection>
  )
}

/* ── Generative (loop + misc): labs' page shape — TITLE (the type label),
 * the three-tab Generate·Style·Animation strip, and the Category/Preset
 * dropdown pair (LoopPicker = labs' Section "Preset"). No chips — the one
 * exception is Para Type's glyph set, labs' own pill ChipsRow. ── */
function GenerativeSurface({ layer, showMod, tree }) {
  const cs = useControlSize()
  const [tab, setTab] = useState('generate')
  const { updateLayer, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  const current = presetsInGroup(layer.loopGroup).find((p) => p.id === layer.presetId)
  /* METHOD / GROUP — `Loops / Simple` (plan 14 § 4; the user: "why does it just say SIMPLE"); the
     tree's type over the registry's group, one word when they agree (Scanline / Scanline) */
  const group = groupById(layer.loopGroup)
  const type = (tree ?? GENERATIVE_TREE).find((t) => t.groups.includes(layer.loopGroup))
  const groupName = type?.labels?.[layer.loopGroup] ?? group?.label ?? ''
  const groupLabel = type && type.label !== groupName ? `${type.label} / ${groupName}` : groupName

  /* Para Type's letter selector — single-glyph presets as labs pills. */
  const isGlyphs = layer.loopGroup === 'paratype' && current?.sub === 'Glyphs'
  const pillsList = isGlyphs ? presetsInSub('paratype', 'Glyphs') : null
  const chips = pillsList ? pillsList.map((p) => ({ value: p.id, label: p.label })) : null
  const onChip = (id) => {
    const p = pillsList?.find((x) => x.id === id)
    if (p && id !== layer.presetId) setOnly(layer.type, presetLayerPatch(p, layer.loopGroup))
  }

  /* R and the rail's Reset button are one action: back to the preset you are on */
  const reset = () => { if (current) setOnly(layer.type, presetLayerPatch(current, layer.loopGroup)) }
  useLabsKeys(
    reset,
    () => {
      const schema = loopById(layer.loopId)?.params ?? []
      updateLayer(layer.id, computeRoll(layer, allScopeParams(schema, layer), randomSeed(), { withFilters: true }))
    },
  )

  return (
    <Surface
      title={groupLabel} chips={chips} active={layer.presetId} onPick={onChip} pills
      tabStrip={<SegmentedToggle value={tab} onChange={setTab} options={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} size={cs} className={stripClamp(cs)} />}
    >
      <LoopFields
        layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer}
        palette={palette} renderAnimate={showMod ? (p) => <BindDot layer={layer} param={p} setProp={edit.setProp} /> : undefined}
        tab={tab} tabStrip={null} tree={tree} inline onReset={reset}
      />
    </Surface>
  )
}

/* ── Kinetic: labs' composition shape — title, three tabs, the TreePicker
 * stack restored (labs picks kinetic scenes via nav + pickers, no chips). ── */
function KineticSurface({ layer, showMod }) {
  const cs = useControlSize()
  const [tab, setTab] = useState('generate')
  const { updateLayer, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  const current = KINETIC_PRESETS.find((p) => p.id === layer.presetId)
  const title = KINETIC_TREE.find((e) => e.subs.includes(current?.sub))?.label ?? 'Kinetic'

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
    <Surface title={title} tabStrip={<SegmentedToggle value={tab} onChange={setTab} options={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} size={cs} className={stripClamp(cs)} />}>
      <KineticPanel
        layer={layer} setProp={edit.setProp} updateLayer={updateLayer} palette={palette}
        /* noop, not undefined — MorphBlendKnob calls it unconditionally */
        renderAnimate={showMod ? (p) => <BindDot layer={layer} param={p} setProp={edit.setProp} /> : () => null}
        tab={tab} tabStrip={null}
      />
    </Surface>
  )
}

export default function LabsParams() {
  const { layer } = useLabsLayer()
  const morph = useMorph()
  const cs = useControlSize()
  /* Modulation dots hide by default (the 2026-08-12 ruling: chrome noise at rest) — M or Settings →
   * Modulation dots brings them back. ONE switch for every chrome since 2026-10-09 (audit C4/F3):
   * `dotVisibility`, the editor's store, not a second key in appSettings. */
  const showMod = useBindDots()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'm' && e.key !== 'M') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e)) return
      toggleDots()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* THE MORPH RAIL (plan 10): its own surface while the MORPH row is in use — no generator heading,
     no generator strip; a step being edited opens its generator's tabs under the slots */
  if (morph.active) return <Surface title="Morph"><MorphTab layer={layer} editTabs={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} /></Surface>
  if (!layer) return <Hint>Pick an effect or generator from the nav.</Hint>
  if (layer.type === 'photo') return <EffectSurface key={layer.id} layer={layer} showMod={showMod} />
  if (layer.type === 'loop') return <GenerativeSurface key={layer.id} layer={layer} showMod={showMod} />
  if (layer.type === 'misc') return <GenerativeSurface key={layer.id} layer={layer} showMod={showMod} tree={MISC_TREE} />
  if (layer.type === 'kinetic') return <KineticSurface key={layer.id} layer={layer} showMod={showMod} />
  return <Hint>This layer has no labs surface.</Hint>
}
