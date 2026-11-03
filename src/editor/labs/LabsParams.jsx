import { useEffect, useState } from 'react'
import { Button, SegmentedToggle, ToggleSwitch, Divider, Dropdown, LabeledControlSection, SettingsRow, Tag, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { useLayerEdit } from '../compose/useLayerEdit'
import AutoControls from '../params/AutoControls'
import BindDot from '../params/BindDot'
import { paramTab } from '../params/schema'
import { PHOTO_SCHEMA } from '../params/schemas/photo'
import { mulberry32, randomSeed, randomizeSchema, mergeRoll } from '../lib/rng'
import { FILTERS } from '../../filters'
import AboutLine from '../compose/inspectors/AboutLine'
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
import { randomEffectId, randomEffectPreset, canEffectLevel, nudgeSettings } from './presetStep'
import { presetPatchFor } from '../compose/inspectors/effectCategories'
import { useBindDots, toggleDots } from '../params/dotVisibility'
import { useLabsLayer } from './useLabsLayer'
import MorphTab from '../morph/MorphTab'
import QuickMotion from '../params/QuickMotion'
import InputRows from '../params/InputRows'
import ModelSource from './ModelSource'
import { useMorph } from '../morph/morphStore'
import Hint from '../components/Hint'
import { useControlSize, stripClamp, RAIL_LABEL_W } from '../params/controlSize'
import { useAppSettings, setAppSetting } from '../lib/appSettings'
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
    <SegmentedToggle tone="sunken"
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
function HistoryButtons() {
  const { undo, redo, canUndo, canRedo } = useComposeState()
  const cs = useControlSize()
  /* NO DISABLED BUTTON IN VIEW (plan 51 3.1, the user: "did you make sure no disabled buttons were in view?"): a button
     that cannot act keeps its slot, so nothing shifts when it appears, but is not drawn */
  const slot = (on, node) => (on ? node : <span aria-hidden="true" className="invisible pointer-events-none">{node}</span>)
  return (
    <>
      {slot(canUndo, <Tooltip label="Undo" shortcut="⌘Z"><Button size={cs} iconOnly="arrow-left" aria-label="Undo" tabIndex={canUndo ? undefined : -1} onClick={undo} /></Tooltip>)}
      {slot(canRedo, <Tooltip label="Redo" shortcut="⇧⌘Z"><Button size={cs} iconOnly="arrow-right" aria-label="Redo" tabIndex={canRedo ? undefined : -1} onClick={redo} /></Tooltip>)}
    </>
  )
}

function Surface({ chips, active, onPick, spread, pills, title, tabStrip, preStrip, fx = false, scope, ghostLabels, children }) {
  /* on touch the rail is a sheet whose header already reads the title (LabsView) */
  const titled = useControlSize() === 'sm'
  return (
    <div className={`flex flex-col gap-5${fx ? ' kol-labs-fx' : ''}`} data-label-scope={scope}>
      {/* The surface title wears the SAME eyebrow as the sections under it
          (user ruling 2026-08-27) — it was `kol-helper-12 text-emphasis`,
          sentence case, the one label in the rail on its own type role. */}
      {/* UNDO / REDO beside the title (plan 49 3.4, user 2026-10-31: "one wrong click and your entire patch is gone") —
          the compose history the editor already keeps; ⌘Z / ⇧⌘Z do the same (LabsView) */}
      {title && titled && (
        <div className="flex items-center gap-1">
          <p className="kol-eyebrow text-fg-96 flex-1 min-w-0">{title}</p>
          <HistoryButtons />
        </div>
      )}
      {chips && <ChipsRow options={chips} active={active} onPick={onPick} spread={spread} pills={pills} />}
      {preStrip}
      {tabStrip}
      {children}
      {/* every tab's labels, measured but unseen (plan 49 9.1) — the label column is the widest of ALL tabs from the first
          frame, so switching tabs never moves it (controlSize measureLabelColumns) */}
      {ghostLabels?.length > 0 && (
        <div aria-hidden="true" className="invisible h-0 overflow-hidden flex flex-col">
          {ghostLabels.map((l, i) => <span key={i} className="kol-helper-10 tracking-widest whitespace-nowrap" style={{ width: RAIL_LABEL_W }}>{String(l).toUpperCase()}</span>)}
        </div>
      )}
    </div>
  )
}

/* ── Effects: a photo layer + its filter chain (labs' effect pages). ──
 * Chips = the active filter's category siblings (effectCategories — the
 * repo's own effect-group taxonomy). Same nested-param plumbing as
 * EffectsPanel: stage params spread over a layer-shaped bag, writes rebuild
 * `filters` through coalesced history. Labs is one-effect, so stage 0. */
function EffectSurface({ layer, showMod }) {
  const appSettings = useAppSettings()
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
  /* THE PAGE'S EFFECT IS THE FIRST STAGE THAT IS NOT PINNED FIRST — fx-media (plan 26 § 4) sits in
     front of it at index 0 when the media moves; every "stage 0" below reads `at` */
  const eff = chain.findIndex((s) => !s.def?.first)
  const at = eff < 0 ? chain.length : eff
  const stage = eff < 0 ? null : chain[eff]

  /* Chips only for the halftone TRIO (labs' one chipped effect family —
   * Dither · ASCII · Bitmap are modes of one page there). Every other
   * effect page carries a title; its siblings already live in the sidebar. */
  const cat = effectCategories(FILTERS).find((c) => c.id === categoryOf(stage?.id))
  const isTrio = cat?.id === 'halftone'
  const chips = isTrio ? (cat?.filters ?? []).map((f) => ({ value: f.id, label: f.label })) : null
  const title = !isTrio && stage ? stage.def.label : null
  const onChip = (id) => {
    if (!stage) { addFilter(layer.id, id); return }
    if (id !== stage.id) replaceFilter(layer.id, at, id)
  }

  const bareFilters = chain.map(({ def: _def, ...s }) => s)
  const paramsView = stage ? { ...layer, ...stage.params, id: layer.id } : layer
  /* One write path per chain index — stage 0 is the page's effect, the rest
   * are its Post-Processing stack. */
  const setStagePropAt = (idx) => (k, v) => {
    const filters = bareFilters.map((s, i) => (i === idx ? { ...s, params: { ...s.params, [k]: v } } : s))
    edit.patch({ filters })
  }
  const setStageProp = setStagePropAt(at)
  const renderAnimate = showMod ? (p) => <BindDot layer={paramsView} param={p} setProp={setStageProp} /> : undefined

  /* Patch stage 0's params in one write — StageRolls hands back a whole
   * param patch, not a key/value pair like setStageProp. */
  const patchStageParams = (patch) => {
    const filters = bareFilters.map((s, i) => (i === at ? { ...s, params: { ...s.params, ...patch } } : s))
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
      <Surface title="Effects" fx tabStrip={<SegmentedToggle tone="sunken" value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
        {tab === 'effect' && (
          <>
            <LabeledControlSection label="Effect stack" divided>
              {chain.length === 0 && <Hint className="kol-mono-10 text-meta">No effects yet — add one below.</Hint>}
              <StackCards {...stackProps} from={0} />
            </LabeledControlSection>
            <Divider />
            {chain.length < MAX_FILTERS && ( /* not drawn when it cannot act (plan 51 3.1) */
              <LabeledControlSection label={rackGroup.label} divided>
                <Dropdown
                  variant="subtle" size={cs} className="w-full"
                  options={rackOptions}
                  value=""
                  onChange={(id) => { if (id) addFilter(layer.id, id) }}
                />
              </LabeledControlSection>
            )}
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
      <Surface chips={chips} active={null} onPick={onChip} spread={isTrio} fx tabStrip={<SegmentedToggle tone="sunken" value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
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
    <Surface chips={chips} active={stage.id} onPick={onChip} spread={isTrio} title={title} fx scope={stage.id} ghostLabels={stage.def.params.map((p) => p.label).filter(Boolean)}
      tabStrip={<SegmentedToggle tone="sunken" value={tab} onChange={setTab} options={LABS_TABS} size={cs} className={stripClamp(cs)} />}>
      {tab === 'effect' && (
        <>
          {head.length > 0 && <AutoControls schema={head} {...auto} />}
          {/* Randomize lives INSIDE the picking cluster's block — the wrapper
              is itself a section, so the hairline lands before it and the
              internal gap stays the tight one. */}
          <LabeledControlSection divided>
            <AutoControls schema={cluster} {...auto} />
            <StageRolls inline def={stage.def} view={paramsView} tab="effect" onPatch={patchStageParams} levels={(
              /* TYPE · CATEGORY · PRESET · SETTINGS, the generator rail's row (plan 51 3.2); a level this effect cannot
                 take is not drawn (3.1) */
              <>
                {[['type', 'Type'], ['category', 'Category'], ['preset', 'Preset']].filter(([lvl]) => canEffectLevel(stage.def, lvl)).map(([lvl, label]) => (
                  <Button key={lvl} tone="primary" size={cs} className="flex-1 min-w-0" aria-label={`Randomize ${label.toLowerCase()}`} onClick={() => {
                    const rand = mulberry32(randomSeed() >>> 0)
                    if (lvl === 'preset') { const v = randomEffectPreset(stage.def, paramsView, rand); if (v != null) patchStageParams(presetPatchFor(stage.def, v)); return }
                    const id = randomEffectId(stage.id, lvl, rand)
                    if (id) replaceFilter(layer.id, at, id)
                  }}>{label}</Button>
                ))}
                <Button tone="primary" size={cs} className="flex-1 min-w-0" aria-label="Randomize settings" onClick={() => {
                  const params = stage.def.params.filter((p) => paramTab(p) !== 'anim')
                  patchStageParams(nudgeSettings(paramsView, allScopeParams(params, paramsView), mulberry32(randomSeed() >>> 0)))
                }}>Settings</Button>
                <AboutLine def={stage.def} isFilter />
              </>
            )} />
          </LabeledControlSection>
          <Divider />
          {cut < params.length && (
            <>
              <AutoControls schema={params.slice(cut)} {...auto} />
              <Divider />
            </>
          )}
          <PostProcessing
            chain={chain} from={at + 1} layer={layer} hostView={paramsView}
            addFilter={addFilter} removeFilter={removeFilter} toggleFilter={toggleFilter}
            setStagePropAt={setStagePropAt} palette={palette} showMod={showMod}
          />
        </>
      )}
      {tab === 'anim' && (
        <>
          {/* INPUTS (plan 48) — an input wired to the effect's best params, first in the tab */}
          <InputRows schema={stage.def.params} layer={paramsView} setProp={setStageProp} inputs={stage.def.inputs} />
          <AutoControls schema={stage.def.params} {...auto} tab="anim" />
          {/* ORBIT PER PATCH on an effect with a camera (Rutt-Etra, plan 51 3.3 · 3.4) — on only while Grab (C) is on; switching
              it on switches Grab on, so it never does nothing */}
          {stage.def.orbit && (
            <LabeledControlSection label="Interaction" divided>
              <SettingsRow label="ORBIT (C)" align="fill" labelWidth={RAIL_LABEL_W}>
                <SegmentedToggle tone="sunken" size={cs} className="w-full" value={appSettings.grab && paramsView.orbit !== false ? 'on' : 'off'}
                  options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                  onChange={(v) => { setStageProp('orbit', v === 'on'); if (v === 'on' && !appSettings.grab) setAppSetting('grab', true) }} />
              </SettingsRow>
            </LabeledControlSection>
          )}
          {/* the roll block is its own section — the Effect tab's hairline, here too (plan 26 § 8) */}
          <LabeledControlSection divided>
            <StageRolls inline def={stage.def} view={paramsView} tab="anim" onPatch={patchStageParams} />
          </LabeledControlSection>
          {stage.def.sweeps && (
            <SweepStack
              sweeps={Array.isArray(stage.params.sweeps) ? stage.params.sweeps : []}
              onChange={(sweeps) => setStageProp('sweeps', sweeps)}
              inline
            />
          )}
          <QuickMotion schema={stage.def.params} layer={paramsView} setProp={setStageProp} />
          <MediaMotion chain={chain} layer={layer} hostView={paramsView} addFilter={addFilter} removeFilter={removeFilter} setStagePropAt={setStagePropAt} palette={palette} showMod={showMod} />
        </>
      )}
    </Surface>
  )
}

/* ── A generator's post-processing (plan 26 § 15: "imported to use with f.e. ascii fx") — any
 * generator, the GL ones included, takes the canvas tier on its own frame: ASCII, Dither, Halftone,
 * Scanline, Blocks… stacked in order on the Style tab. No pixi / GL-engine stages here: a GL loop
 * has no GL→GL path, and the canvas tier is what the page effects are. ── */
const GEN_POST = FILTERS.filter((f) => !f.kind && !f.first)
function GeneratorPost({ layer, edit, palette, showMod }) {
  const { addFilter, removeFilter, toggleFilter } = useComposeState()
  const chain = resolvedChain(layer)
  const bare = chain.map(({ def: _def, ...s }) => s)
  const setStagePropAt = (idx) => (k, v) => edit.patch({ filters: bare.map((s, i) => (i === idx ? { ...s, params: { ...s.params, [k]: v } } : s)) })
  return (
    <PostProcessing
      chain={chain} from={0} filters={GEN_POST} layer={layer} hostView={layer}
      addFilter={addFilter} removeFilter={removeFilter} toggleFilter={toggleFilter}
      setStagePropAt={setStagePropAt} palette={palette} showMod={showMod}
    />
  )
}

/* ── Media motion (plan 26 § 4): the fx-media stage pinned in front of the effect — tile, drift,
 * spin, zoom, tilt. Its own section on the Motion tab: one press adds it, its params follow, one
 * press takes it away. ── */
function MediaMotion({ chain, layer, hostView, addFilter, removeFilter, setStagePropAt, palette, showMod }) {
  const cs = useControlSize()
  const idx = chain.findIndex((s) => s.id === 'fx-media')
  const s = idx < 0 ? null : chain[idx]
  const view = s ? { ...hostView, ...s.params, id: layer.id } : null
  const setProp = s ? setStagePropAt(idx) : null
  return (
    <LabeledControlSection label="Media" divided>
      {s?.def ? (
        <>
          <AutoControls
            schema={s.def.params} layer={view} setProp={setProp} palette={palette} inline
            renderAnimate={showMod ? (p) => <BindDot layer={view} param={p} setProp={setProp} /> : undefined}
          />
          <Button tone="primary" size={cs} className="w-full" iconLeft="x" iconSize={12} onClick={() => removeFilter(layer.id, idx)}>
            Remove media motion
          </Button>
        </>
      ) : (
        chain.length < MAX_FILTERS && ( /* not drawn when it cannot act (plan 51 3.1) */
          <Button tone="primary" size={cs} className="w-full" iconLeft="plus" iconSize={12} onClick={() => addFilter(layer.id, 'fx-media')}>
            Add media motion
          </Button>
        )
      )}
    </LabeledControlSection>
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
function PostProcessing({ chain, from = 1, filters = null, layer, hostView, addFilter, removeFilter, toggleFilter, setStagePropAt, palette, showMod }) {
  const cs = useControlSize()
  const options = [
    { value: '', label: 'Add FX…' },
    ...(filters ?? postProcessingFilters(FILTERS)).map((f) => ({ value: f.id, label: f.label ?? f.id })),
  ]
  return (
    <LabeledControlSection label="Post-Processing" divided>
      <StackCards
        chain={chain} from={from} layer={layer} hostView={hostView}
        toggleFilter={toggleFilter} removeFilter={removeFilter}
        setStagePropAt={setStagePropAt} palette={palette} showMod={showMod}
      />
      {chain.length < MAX_FILTERS && ( /* not drawn when it cannot act (plan 51 3.1) */
        <Dropdown
          variant="subtle" size={cs} className="w-full"
          options={options}
          value=""
          onChange={(id) => { if (id) addFilter(layer.id, id) }}
        />
      )}
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
      title={groupLabel} chips={chips} active={layer.presetId} onPick={onChip} pills scope={layer.loopId}
      ghostLabels={(loopById(layer.loopId)?.params ?? []).filter((p) => p.type !== 'color' && p.label).map((p) => p.label)}
      tabStrip={<SegmentedToggle tone="sunken" value={tab} onChange={setTab} options={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} size={cs} className={stripClamp(cs)} />}
    >
      {/* INPUTS (plan 48) — an input wired to the generator's best params, first in the Animation tab */}
      {tab === 'anim' && <InputRows schema={loopById(layer.loopId)?.params ?? []} layer={layer} setProp={edit.setProp} inputs={loopById(layer.loopId)?.inputs} />}
      <LoopFields
        layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer}
        palette={palette} renderAnimate={showMod ? (p) => <BindDot layer={layer} param={p} setProp={edit.setProp} /> : undefined}
        tab={tab} tabStrip={null} tree={tree} inline onReset={reset}
      />
      {tab === 'generate' && layer.loopId === 'scene3d' && layer.primitive === 'mesh' && <ModelSource layer={layer} setProp={edit.setProp} />}
      {tab === 'style' && <GeneratorPost layer={layer} edit={edit} palette={palette} showMod={showMod} />}
      {tab === 'anim' && <QuickMotion schema={loopById(layer.loopId)?.params ?? []} layer={layer} setProp={edit.setProp} />}
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
    <Surface title={title} tabStrip={<SegmentedToggle tone="sunken" value={tab} onChange={setTab} options={cs === 'sm' ? GEN_TABS : GEN_TABS_TOUCH} size={cs} className={stripClamp(cs)} />}>
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
