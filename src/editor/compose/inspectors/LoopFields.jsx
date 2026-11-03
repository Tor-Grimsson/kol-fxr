import { useState } from 'react'
import { Button, Divider, Dropdown, Tooltip } from '@kolkrabbi/kol-component'
import { LabeledControl, SettingsRow, LabeledControlSection } from '@kolkrabbi/kol-component'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { ViewToggle } from '@kolkrabbi/kol-component'
import AutoControls from '../../params/AutoControls'
import RollScopesDialog from '../../params/RollScopesDialog'
import { ModulationList } from '../../params/ModulationEditor'
import { deriveScopes, tidyScopes, SEED_MIN_PARAMS, allScopeParams, computeRoll, useRollSeed, SeedField } from '../../params/rolls'
import { motionPresetsFor, axisKeys } from '../../params/motionPresets'
import { lookPresetsFor } from '../../params/lookPresets'
import { paramSection } from '../../params/schema'
import KeyframeEditor from './KeyframeEditor'
import CameraPoseSlots from './CameraPoseSlots'
import RulesEditor from './RulesEditor'
import { OrganicProfileEditor } from './ProfileEditor'
import CurveEditor from './CurveEditor'
import ParatypeTools from './ParatypeTools'
import SoftformsLayers from './SoftformsLayers'
import PenroseLayers from './PenroseLayers'
import { loopById, loopBgToggleable, resolveCameraKeys, presetsInGroup } from '../../../loops/registry'
import { GENERATIVE_TREE } from '../../../loops/taxonomy'
import { randomPresetPatch, nudgeSettings, canRandomLevel } from '../../labs/presetStep'
/* the types Randomize › Type draws from — every generative group */
const RANDOM_GROUPS = GENERATIVE_TREE.flatMap((t) => t.groups)
import { wildExpression, fitBounds } from '../../../loops/math/expression'
import { mulberry32, randomSeed } from '../../lib/rng'
import { useAppSettings, setAppSetting } from '../../lib/appSettings'
import { openColorModes } from '../../color/ColorModesWindow'
import { RELATIONS, rollPalette, resolvePalette } from '../../color/palette'
import { LoopPicker } from './LoopPicker'
import AboutLine from './AboutLine'
import { themeParams } from '../../../loops/theme'
import { THEME_OPTIONS, DEFAULT_THEME } from '../../../loops/lib/themes'
import { useControlSize, RAIL_LABEL_W, stripClamp } from '../../params/controlSize'

/* LoopFields — the loop layer's params surface, out of ParametersPanel (deconstruction T4,
 * 2026-09-27): it is the GENERATORS pack's inspector, so the core rail reaches it through the
 * pack registry instead of importing the loop catalog itself. Moved verbatim. */

/* 'Custom' shows in a motion dropdown only while active, so it never reads
 * as a second pickable 'off' (labs motionOpts). */
const motionOpts = (presets, val) => {
  const opts = presets.map((p) => ({ value: p.id, label: p.label }))
  return (val == null || val === 'custom') ? [{ value: 'custom', label: 'Custom' }, ...opts] : opts
}

/**
 * LoopFields — the loop layer's control surface (plan.md Phase 3): category →
 * preset picker (labs Loops page model, always visible above the sub-tab
 * strip), then Generate (theme/toggles + scoped seeded randomize) · Style ·
 * Animation (motion Frame/Form preset dropdowns + params + camera rail).
 *
 * Exported for labs mode (LabsParams): `picker={false}` drops the
 * Category/Preset stack (labs swaps presets via its chips row), and
 * `tab="labs-effect"` renders Generate + Style as ONE flow — labs' two-tab
 * Effect · Motion model over the same three-tab surface.
 */
/* One row shape per skin (2026-09-01): the labs skin (`inline`) is the DS
 * SettingsRow — uppercase helper label in the rail's column — the same row
 * AutoControls and the picker stack render, so THEME · INVERT · LOOK · FRAME
 * stop being the sentence-case exceptions in an uppercase rail. The editor
 * keeps its label-above LabeledControl. */
function Row({ inline, label, align = 'fill', children }) {
  return inline
    ? <SettingsRow label={label} align={align} labelWidth={RAIL_LABEL_W}>{children}</SettingsRow>
    : <LabeledControl label={label}>{children}</LabeledControl>
}

/* An on/off pair. Labs skin: the rail's one segmented control — the DS
 * SegmentedToggle, spanning the control column like a dropdown
 * (user, 2026-09-01: Invert was parked at the row's edge as if it were a
 * switch). Editor: ViewToggle, with the rest of its inspector. */
const ONOFF = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]
function OnOff({ inline, cs, on, onChange }) {
  return inline
    ? <SegmentedToggle tone="sunken" size={cs} className={`w-full ${stripClamp(cs) ?? ''}`} options={ONOFF} value={on ? 'on' : 'off'} onChange={(v) => onChange(v === 'on')} />
    : <ViewToggle size={cs} options={ONOFF} viewMode={on ? 'on' : 'off'} onViewChange={(v) => onChange(v === 'on')} />
}

export function LoopFields({ layer, setProp, patch, updateLayer, palette, renderAnimate, tab, tabStrip, tree, picker = true, inline = false, showSeed = !inline, onReset }) {
  const cs = useControlSize()
  const loop = loopById(layer.loopId)
  const appSettings = useAppSettings()
  const hasRig = (loop?.params ?? []).some((p) => p.key === 'orbit')
  const setOrbit = (v) => { setParamProp('orbit', v); if (v && !appSettings.grab) setAppSetting('grab', true) }
  const schema = loop?.params ?? []

  /* Theme — recolour roled color params (bg/fg/accent) via the imported
   * loops theme module. Non-roled params and user edits survive. */
  const themeId = layer.themeId ?? DEFAULT_THEME
  const invert = !!layer.themeInvert
  const onTheme  = (id) => updateLayer(layer.id, { themeId: id, ...themeParams(layer, loop?.params, id, invert) })
  const onInvert = (v)  => updateLayer(layer.id, { themeInvert: v, ...themeParams(layer, loop?.params, themeId, v) })
  /* PALETTE (plan 37 § 5.4, Labs' colour section in the settings rail): pick a relationship, roll one
     palette and recolour every colour param from it — roles by role, the rest in turn */
  const relation = layer._paletteRelation ?? 'analogous'
  /* PICKING A RELATION ROLLS (plan 49 4.1, user 2026-10-31: "pallette does nothing here. is palette mapped to
     generators?") — the dropdown only stored the relation and nothing changed until Roll; and a def with no colour
     params (Hyperbolic Droste colours itself) has nothing a palette can reach, so the row is not shown there. */
  const colorParams = (loop?.params ?? []).filter((p) => p.type === 'color')
  /* WHAT ROLL TOUCHES (plan 49 4.2, user: "Pelette here needs toggle to set what you wanna roll") — `_rollKeep` lists
     the colour keys a roll leaves alone */
  const keep = new Set(layer._rollKeep ?? [])
  const rollColors = (rel = relation, extra = {}) => {
    const pal = rollPalette(mulberry32(randomSeed()), rel)
    const next = resolvePalette(layer, loop?.params, pal, { rotate: true })
    updateLayer(layer.id, { ...extra, ...Object.fromEntries(colorParams.filter((p) => !keep.has(p.key)).map((p) => [p.key, next[p.key]])) })
  }
  const toggleKeep = (k) => setProp('_rollKeep', keep.has(k) ? [...keep].filter((x) => x !== k) : [...keep, k])

  /* ── Generate: Look quick-select (labs softforms look recipes) — picking
   * applies the preset patch in one coalesced write; editing any param a
   * look covers flips the dropdown to Custom (motion-preset mechanics). ── */
  const looks = lookPresetsFor(layer.loopId)
  const lookList = looks ? Object.keys(looks).map((name) => ({ id: name, label: name })) : null
  const lookKeys = looks ? new Set(Object.values(looks).flatMap((p) => Object.keys(p))) : null

  /* ── Generate: scoped, seeded rolls (labs LoopsShell Generate model) ──
   * Scope buttons are schema filters (sections + the Colour type-scope);
   * every press = one seeded randomizeSchema roll merged over the layer,
   * one history entry, seed persisted as `_rollSeed`. */
  const seed = useRollSeed(layer)
  const scopes = tidyScopes(deriveScopes(schema, layer), allScopeParams(schema, layer))
  const tables = motionPresetsFor(layer.loopId, layer)
  const [scopesOpen, setScopesOpen] = useState(false)   /* plan 18 § 3 */
  const roll = (params, scope, opts) => {
    const rollPatch = computeRoll(layer, params, seed.take(), { stripNoRandom: !!scope?.motion, ...opts })
    /* A motion roll is by definition hand-off-the-preset — flip the touched
     * axis dropdown(s) to Custom (labs rollMotionFrame/Form). */
    if (tables && scope?.motion) {
      if (scope.id !== 'Form') rollPatch._framePreset = 'custom'
      if (scope.id !== 'Frame') rollPatch._formPreset = 'custom'
    }
    /* Same hand-off rule for the Look dropdown. */
    if (lookKeys && Object.keys(rollPatch).some((k) => lookKeys.has(k))) rollPatch._lookPreset = 'custom'
    updateLayer(layer.id, rollPatch)
  }
  /* ⌥-click on a scope button = RESET that scope (labs' R semantics, scoped):
   * each key back to the preset's pinned value, schema default otherwise. */
  const resetScope = (params) => {
    const base = presetsInGroup(layer.loopGroup).find((p) => p.id === layer.presetId)?.params ?? {}
    const patch = {}
    for (const p of params) {
      const v = base[p.key] !== undefined ? base[p.key] : p.default
      if (v !== undefined) patch[p.key] = v
    }
    updateLayer(layer.id, patch)
  }

  /* ── Animation: Frame/Form quick-select presets (labs ScanlineEditor /
   * PatternControls model). Picking patches only that axis; editing any
   * param an axis covers flips ITS dropdown to Custom. ── */
  const frameKeys = tables ? axisKeys(tables.frame) : null
  const formKeys = tables ? axisKeys(tables.form) : null
  /* One write path for every schema param — flips whichever quick-select
   * dropdowns (motion Frame/Form, Look) cover the edited key to Custom. */
  const setParamProp = (k, v) => {
    const extra = {}
    if (frameKeys?.has(k)) extra._framePreset = 'custom'
    if (formKeys?.has(k)) extra._formPreset = 'custom'
    if (lookKeys?.has(k)) extra._lookPreset = 'custom'
    patch({ [k]: v, ...extra })
  }
  const applyMotionPreset = (axisProp, presets) => (id) => {
    const p = presets.find((x) => x.id === id)
    patch({ [axisProp]: id, ...(p?.params ?? {}) })
  }
  const applyLook = (name) => patch({ _lookPreset: name, ...(looks?.[name] ?? {}) })

  /* Field-loop camera rail — the def's `camera` schema (folded into the
   * layer's defaults by contract.js loopDefaults, read by makeCam at draw)
   * that AutoControls never rendered; labs showed it as the Camera section
   * of the Animation tab (LoopsShell.jsx:378). */
  const cameraSchema = loop?.camera ? loop.camera.map((p) => ({ ...p, section: 'Camera' })) : null

  /* Camera pose slots + reset (labs CameraPanel) — a pose is the layer's
   * camera param values: the def's camera rail plus any schema params
   * sectioned 'Camera' (scene3d fov/orbit, softforms3d θ/φ/dist, ribbon…). */
  const camParams = [...(loop?.camera ?? []), ...schema.filter((p) => paramSection(p) === 'Camera')]
  const isEngine = loop?.kind === 'engine'
  const showCamSlots = camParams.length > 0 || (isEngine && loop?.orbit)

  /* 3D-scene keyframe track (primitiveKeyframes sampler) — reachable once
   * the layer's animMode param is flipped to keyframes. */
  const showKeyframes = loop?.engine === 'scene'
    && (layer.animMode === 'keyframes' || layer.animMode === 'keyframe')

  /* Camera is driven by the Orbit tool (C) — a viewport mode, not a per-layer
   * toggle, so it never fights layer dragging. 3D loops orbit; field/pattern
   * loops rotate + zoom; shape loops zoom. Rendered under the theme rows in
   * both skins (the editor's grid spans it across both columns). */
  const cameraKeys = loop?.orbit ? { yaw: 1, dist: 1 } : resolveCameraKeys(loop)
  const cameraHint = cameraKeys ? (
    <p className={`kol-mono-10 text-meta${inline ? '' : ' col-span-2'}`}>
      {/* SAYS ONLY WHAT C DOES HERE (plan 40 § 7.1, user 2026-10-24: *"press C does not orbit camera, bug?"*) — a 2D
          loop has no camera to orbit; C arms the tool and the wheel zooms (and a field loop's drag rotates) */}
      {loop?.orbit ? 'Press C, then drag to orbit the camera and scroll to zoom.' : cameraKeys.yaw ? 'Press C, then drag to rotate and scroll to zoom.' : 'Press C, then scroll to zoom.'}
    </p>
  ) : null

  return (
    <>
      {/* THE LABS SKIN GROUPS IN SECTIONS, named or not (user, 2026-09-01):
          `LabeledControlSection` sets the row rhythm (8px) and `divided` the
          hairline between groups — the picker stack and the theme rows were
          bare children of the surface's 20px column, three rhythms in one
          rail. The editor keeps its own stacking. */}
      {/* …and in labs' rail the stack heads the GENERATE tab only (2026-10-06; the user: "too many
          labels … too many folded things"): it stood above every tab, three of the six rows a
          phone sheet shows, while Style and Animation have nothing to pick. The editor's own
          inspector (`inline` off) keeps it where it was. */}
      {/* the strip FIRST, the pickers under it (spec R3.2, the user's 19): the picker stack heads
          Generate only, so above the strip it moved the strip on every tab change */}
      {tabStrip}

      {picker && (inline
        ? (tab === 'generate' && <LabeledControlSection divided><LoopPicker layer={layer} tree={tree} inline about={<AboutLine def={loop} />} /></LabeledControlSection>)
        : <LoopPicker layer={layer} tree={tree} about={<AboutLine def={loop} />} />)}

      {(tab === 'generate' || tab === 'labs-effect') && (
        <>
          {/* Soft Forms per-form scene editing (labs Layers tab) — the
              primary control surface, above Look/Theme. */}
          {(layer.loopId === 'softforms' || layer.loopId === 'softforms3d') && <SoftformsLayers layer={layer} />}
          {looks && !inline && (
            <Row inline={inline} label="Look">
              <Dropdown
                variant="subtle" size={cs} className="w-full"
                options={motionOpts(lookList, layer._lookPreset)}
                value={layer._lookPreset ?? 'custom'}
                onChange={applyLook}
              />
            </Row>
          )}
          {/* the labs skin stacks these as full rows in ONE section (a 96px
              label column has no room in half a rail); the editor keeps its
              2-up grid. Look joins the section there — it is a theme-tier pick. */}
          {inline && (
          <LabeledControlSection divided>
            {looks && (
              <Row inline label="Look">
                <Dropdown
                  variant="subtle" size={cs} className="w-full"
                  options={motionOpts(lookList, layer._lookPreset)}
                  value={layer._lookPreset ?? 'custom'}
                  onChange={applyLook}
                />
              </Row>
            )}
            <Row inline label="Theme">
              <Dropdown variant="subtle" size={cs} className="w-full" options={THEME_OPTIONS} value={themeId} onChange={onTheme} />
            </Row>
            <Row inline label="Invert">
              <OnOff inline cs={cs} on={invert} onChange={onInvert} />
            </Row>
            {colorParams.length > 0 && (
              <Row inline label="Palette">
                <div className="flex w-full gap-2">
                  <Dropdown variant="subtle" size={cs} className="flex-1 min-w-0" options={RELATIONS.map((r) => ({ value: r.id, label: r.label }))} value={relation} onChange={(v) => rollColors(v, { _paletteRelation: v })} />
                  <Button tone="primary" size={cs} onClick={() => rollColors()}>Roll</Button>
                  {/* the Color tool, over Labs — it edits this generator live; closing it is the way back (plan 49 4.2) */}
                  <Tooltip label="Edit in Color Modes"><Button tone="primary" size={cs} iconOnly="clr-tri" aria-label="Edit in Color Modes" onClick={openColorModes} /></Tooltip>
                </div>
              </Row>
            )}
            {colorParams.length > 1 && (
              <Row inline label="Rolls">
                <div className="flex w-full flex-wrap gap-1">
                  {colorParams.map((p) => (
                    <Button key={p.key} size={cs} tone={keep.has(p.key) ? 'ghost' : 'primary'} pressed={!keep.has(p.key)} aria-label={`Roll ${p.label}`} onClick={() => toggleKeep(p.key)}>{p.label}</Button>
                  ))}
                </div>
              </Row>
            )}
            {loopBgToggleable(loop) && (
              <Row inline label="Background">
                <OnOff inline cs={cs} on={layer.bgOn !== false} onChange={(v) => setProp('bgOn', v)} />
              </Row>
            )}
            {cameraHint}
          </LabeledControlSection>
          )}
          {!inline && (
          <div className="grid grid-cols-2 gap-2">
            <Row inline={false} label="Theme">
              <Dropdown variant="subtle" size={cs} className="w-full" options={THEME_OPTIONS} value={themeId} onChange={onTheme} />
            </Row>
            <Row inline={false} label="Invert">
              <OnOff inline={false} cs={cs} on={invert} onChange={onInvert} />
            </Row>
            {/* Background on/off — only for loops whose bg is a pure backdrop
                fill (loopBgToggleable); hidden where bg feeds colour math or
                the loop is a GL engine. */}
            {loopBgToggleable(loop) && (
              <Row inline={false} label="Background">
                <OnOff inline={false} cs={cs} on={layer.bgOn !== false} onChange={(v) => setProp('bgOn', v)} />
              </Row>
            )}
            {cameraHint}
          </div>
          )}

          {/* Schema params flagged tab:'generate' (penrose shape/glyph/font/
              weight/seed) — pickers above the randomize block, labs order. */}
          <AutoControls schema={schema} layer={layer} setProp={setParamProp} palette={palette} renderAnimate={renderAnimate} tab="generate" inline={inline} />

          {/* THE RANDOMISE BLOCK STANDS APART in labs (plan 41 § 7.2, user 2026-10-26) */}
          {inline && <Divider />}
          {/* RANDOMISE AT FOUR LEVELS (plan 49 2.2, user 2026-10-31: "randomise: Type/CAtegory/Preset/Settings … randomise
              type is the wides random, category level below that, randomise preset is just like swapping a bit, settings
              is gonna be same but slightly differnet") — they replace Randomize preset / Randomize all. Settings nudges
              what Randomize all rolled (the scope dialog still chooses which); ⌥-Settings resets them. Seeded like
              every roll; nothing starts playing (plan 49 10.1). */}
          <div className="flex gap-2">
            {[['type', 'Type'], ['category', 'Category'], ['preset', 'Preset']].filter(([lvl]) => canRandomLevel(layer, lvl, RANDOM_GROUPS)).map(([lvl, label]) => (
              <Button key={lvl} tone="primary" size={cs} className="flex-1 min-w-0" aria-label={`Randomize ${label.toLowerCase()}`} onClick={() => {
                const s = seed.take()
                const patch = randomPresetPatch(layer, lvl, mulberry32(s >>> 0), RANDOM_GROUPS)
                if (patch) updateLayer(layer.id, { ...patch, _rollSeed: s })
              }}>
                {label}
              </Button>
            ))}
            <Button tone="primary" size={cs} className="flex-1 min-w-0" aria-label="Randomize settings" onClick={(e) => {
              if (e.altKey) return resetScope(allScopeParams(schema, layer))
              const s = seed.take()
              updateLayer(layer.id, { ...nudgeSettings(layer, allScopeParams(schema, layer), mulberry32(s >>> 0)), _rollSeed: s })
            }}>
              Settings
            </Button>
            {/* what Settings touches — the setting's dialog (plan 18 § 3) */}
            <Button tone="primary" size={cs} iconOnly="nav-settings" aria-label="What Settings rolls" onClick={() => setScopesOpen(true)} className="shrink-0" />
            {/* RESET, VISIBLE (the user, 2026-10-09: "we need something for reset") */}
            <Tooltip label="Reset to defaults" shortcut="R"><Button tone="primary" size={cs} iconOnly="refresh" aria-label="Reset to defaults" onClick={onReset ?? (() => resetScope(allScopeParams(schema, layer)))} className="shrink-0" /></Tooltip>
          </div>
          <RollScopesDialog open={scopesOpen} onClose={() => setScopesOpen(false)} schema={schema} layer={layer} size={cs} />
          {scopes.length > 0 && (
            /* Labs: three to a row (plan 41 § 4.6, user 2026-10-26: "3 in a row?"); the editor keeps two. */
            <div className={`grid ${inline ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              {scopes.map((s) => (
                <Button key={s.id} tone="primary" size={cs} onClick={(e) => (e.altKey ? resetScope(s.params) : roll(s.params, s))}>
                  {s.label}
                </Button>
              ))}
              {/* Wild — the oscilloscope's second expression button: the
                  procedural compositor (nested/gated DSL), where the
                  Expression chip draws from the curated pool. Seeded through
                  the same _rollSeed flow; ⌥-click resets like the chip. */}
              {layer.loopId === 'math-expression' && (
                <Button
                  tone="primary"
                  size={cs}
                  onClick={(e) => {
                    if (e.altKey) return resetScope(scopes.find((s) => s.id === 'Expression')?.params ?? [])
                    const s = seed.take()
                    updateLayer(layer.id, { expr: wildExpression(mulberry32(s >>> 0)), _rollSeed: s })
                  }}
                >
                  Wild
                </Button>
              )}
            </div>
          )}
          {/* labs keeps seed off the rail (info overlay only) — the labs
              skin (`inline`) hides it; the editor keeps its field. */}
          {showSeed && allScopeParams(schema, layer).length >= SEED_MIN_PARAMS && <SeedField seed={seed} inline={inline} />}
          {/* Pattern-rules tiles: the rule-stack editor (labs Rules section) —
              seeded rolls share the SeedField above. */}
          {layer.loopId === 'pattern-rules' && (layer.render ?? 'tiles') === 'tiles' && (
            <RulesEditor layer={layer} patch={patch} seed={seed} />
          )}
        </>
      )}

      {(tab === 'style' || tab === 'labs-effect') && (
        <>
          <AutoControls schema={schema} layer={layer} setProp={setParamProp} palette={palette} renderAnimate={renderAnimate} tab="style" inline={inline} />
          {/* LAYERS — what this Penrose sim draws, each with show/hide and opacity (plan 49 4.3) */}
          {loop?.group === 'penrose' && layer.loopId?.startsWith('penrose-') && <PenroseLayers layer={layer} setProp={setParamProp} patch={patch} />}
          {/* Organic field, Edge profile = Custom: the draggable bezier curve
              (self-gates on render/field/waveProfile). */}
          {layer.loopId === 'pattern-rules' && <OrganicProfileEditor layer={layer} patch={patch} />}
          {/* Math curves: kind/epicycle-term authoring (forks stock clips). */}
          {layer.loopId === 'math-curves' && <CurveEditor layer={layer} patch={patch} />}
          {/* Oscilloscope viewport (labs View panel's Fit/Reset): Fit snaps
              min/max to the curve; Reset restores the View section. */}
          {layer.loopId === 'math-expression' && (
            <div className="grid grid-cols-2 gap-2">
              <Button tone="primary" size={cs} onClick={() => updateLayer(layer.id, fitBounds(layer))}>
                Fit
              </Button>
              <Button tone="primary" size={cs} onClick={() => resetScope(scopes.find((s) => s.id === 'View')?.params ?? [])}>
                Reset
              </Button>
            </div>
          )}
        </>
      )}

      {tab === 'anim' && (
        <>
          {/* "Motion" is a section, not a third heading rung (spec R4.4) */}
          {tables && (
            <LabeledControlSection label="Motion" divided>
              <Row inline={inline} label="Frame">
                <Dropdown
                  variant="subtle" size={cs} className="w-full"
                  options={motionOpts(tables.frame, layer._framePreset)}
                  value={layer._framePreset ?? 'custom'}
                  onChange={applyMotionPreset('_framePreset', tables.frame)}
                />
              </Row>
              <Row inline={inline} label="Form">
                <Dropdown
                  variant="subtle" size={cs} className="w-full"
                  options={motionOpts(tables.form, layer._formPreset)}
                  value={layer._formPreset ?? 'custom'}
                  onChange={applyMotionPreset('_formPreset', tables.form)}
                />
              </Row>
            </LabeledControlSection>
          )}
          <ModulationList layer={layer} schema={schema} setProp={setParamProp} />
          {/* ORBIT PER PATCH (plan 51 3.4): every patch with a drag rig shows its own row — Orbit on a 3D generator, Drag on a
              2D one. It reads on only while Grab (the master, C) is on and the patch has not opted out; switching it on
              also switches Grab on, so the row never does nothing (plan 49 10.2). */}
          {hasRig && !loop?.is3D && (
            <LabeledControlSection label="Interaction" divided>
              <Row inline={inline} label="Drag (C)">
                <OnOff inline={inline} cs={cs} on={!!appSettings.grab && layer.orbit !== false} onChange={setOrbit} />
              </Row>
            </LabeledControlSection>
          )}
          {loop?.is3D && (
            <LabeledControlSection label="3D" divided>
              <Row inline={inline} label="Orbit (C)">
                <OnOff inline={inline} cs={cs} on={!!appSettings.grab && layer.orbit !== false} onChange={setOrbit} />
              </Row>
              {/* the 3D zoom sits with Orbit — one 3D section, not two */}
              {loop.zoom3dKey && <AutoControls schema={schema.filter((p) => p.key === loop.zoom3dKey).map(({ section, ...p }) => p)} layer={layer} setProp={setParamProp} palette={palette} renderAnimate={renderAnimate} tab="anim" inline={inline} />}
            </LabeledControlSection>
          )}
          <AutoControls schema={loop?.is3D && loop.zoom3dKey ? schema.filter((p) => p.key !== loop.zoom3dKey) : schema} layer={layer} setProp={setParamProp} palette={palette} renderAnimate={renderAnimate} tab="anim" inline={inline} />
          {showKeyframes && (
            <KeyframeEditor layer={layer} patch={patch} defaultDuration={loop?.duration ?? 8} />
          )}
          {cameraSchema && (
            <AutoControls schema={cameraSchema} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} inline={inline} />
          )}
          {showCamSlots && (
            <CameraPoseSlots layer={layer} patch={patch} camParams={camParams} isEngine={isEngine} showHeader={!cameraSchema} />
          )}
        </>
      )}
      {/* Para-Type misc layer: flatten-to-vector (Generate) + XY explore
          pad (Style) — self-gates on loopId + tab. labs-effect maps to Style
          (the XY pad; flatten is a compositor action labs doesn't need). */}
      <ParatypeTools layer={layer} patch={patch} renderAnimate={renderAnimate} tab={tab === 'labs-effect' ? 'style' : tab} />
    </>
  )
}
