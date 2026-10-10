import { useState } from 'react'
import { Button, Dropdown, Tooltip } from '@kolkrabbi/kol-component'
import { LabeledControl, SettingsRow, LabeledControlSection } from '@kolkrabbi/kol-component'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { ViewToggle } from '@kolkrabbi/kol-component'
import AutoControls from '../../params/AutoControls'
import RollScopesDialog from '../../params/RollScopesDialog'
import { ModulationList } from '../../params/ModulationEditor'
import { deriveScopes, tidyScopes, SEED_MIN_PARAMS, allScopeParams, computeRoll, computePresetRoll, presetRollPool, useRollSeed, SeedField } from '../../params/rolls'
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
import { loopById, loopBgToggleable, resolveCameraKeys, presetsInGroup } from '../../../loops/registry'
import { wildExpression, fitBounds } from '../../../loops/math/expression'
import { mulberry32 } from '../../lib/rng'
import { LoopPicker } from './LoopPicker'
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
  const schema = loop?.params ?? []

  /* Theme — recolour roled color params (bg/fg/accent) via the imported
   * loops theme module. Non-roled params and user edits survive. */
  const themeId = layer.themeId ?? DEFAULT_THEME
  const invert = !!layer.themeInvert
  const onTheme  = (id) => updateLayer(layer.id, { themeId: id, ...themeParams(layer, loop?.params, id, invert) })
  const onInvert = (v)  => updateLayer(layer.id, { themeInvert: v, ...themeParams(layer, loop?.params, themeId, v) })

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
      Press C (Orbit tool) to move the camera — {loop?.orbit ? 'drag to orbit, scroll to zoom' : cameraKeys.yaw ? 'drag to rotate, scroll to zoom' : 'scroll to zoom'}.
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
        ? (tab === 'generate' && <LabeledControlSection divided><LoopPicker layer={layer} tree={tree} inline /></LabeledControlSection>)
        : <LoopPicker layer={layer} tree={tree} />)}

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

          {/* Rolls WHICH PRESET you are on — the axis the rail had no button
              for. Hidden when the group holds nothing else to move to. */}
          {presetRollPool(layer).length > 0 && (
            <Button tone="primary" size={cs} className="w-full" onClick={() => {
              const s = seed.take()
              const patch = computePresetRoll(layer, s)
              if (patch) updateLayer(layer.id, patch)
            }}>
              Randomize preset
            </Button>
          )}
          <div className="flex gap-2">
            <Button tone="primary" size={cs} className="flex-1 min-w-0" onClick={(e) => (e.altKey ? resetScope(allScopeParams(schema, layer)) : roll(allScopeParams(schema, layer), undefined, { withFilters: true }))}>
              Randomize all
            </Button>
            {/* what it touches — the setting's dialog (plan 18 § 3) */}
            <Button tone="primary" size={cs} iconOnly="nav-settings" aria-label="What Randomize all rolls" onClick={() => setScopesOpen(true)} className="shrink-0" />
            {/* RESET, VISIBLE (the user, 2026-10-09: "we need something for reset") — it was only ⌥ on
                Randomize all. The host's reset when it has one (labs: back to the preset, same as R),
                else the schema's defaults. */}
            <Tooltip label="Reset to defaults" shortcut="R"><Button tone="primary" size={cs} iconOnly="rotate-left" aria-label="Reset to defaults" onClick={onReset ?? (() => resetScope(allScopeParams(schema, layer)))} className="shrink-0" /></Tooltip>
          </div>
          <RollScopesDialog open={scopesOpen} onClose={() => setScopesOpen(false)} schema={schema} layer={layer} size={cs} />
          {scopes.length > 0 && (
            /* Odd counts keep the lone half-width cell — labs' own grids do
             * (Pattern's 5, Penrose's 6-plus-reset), verified 2026-08-09. */
            <div className="grid grid-cols-2 gap-2">
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
          <AutoControls schema={schema} layer={layer} setProp={setParamProp} palette={palette} renderAnimate={renderAnimate} tab="anim" inline={inline} />
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
      <ParatypeTools layer={layer} patch={patch} tab={tab === 'labs-effect' ? 'style' : tab} />
    </>
  )
}
