// The loop catalog — the single source of truth for the library (+ the future
// effect source-picker). Keep this module LIGHT: it imports loop DEFINITIONS
// (cheap draw fns + schema), so consumers can import it for the source list
// without dragging any heavy 3d/WebGL engine.
//
// Imported from kol-labs-single (plan.md Phase 3). Cut one is shape + field;
// the pattern group (opentype dep) is excluded per the plan — its imports and
// route-centric SUBGROUPS metadata were dropped with it (the editor picks
// loops via inspector dropdowns, not routes).

import { loopDefaults } from './contract.js'
import { SHAPE_LOOPS, SHAPE_PRESETS } from './shape/presets.js'
import { FIELD_LOOPS, FIELD_PRESETS } from './field/presets.js'
import { PATTERN_LOOPS, PATTERN_PRESETS } from './pattern/presets.js'
/* Pattern Loops = the labs /loops-page pattern gallery — presets ONLY, driving
 * the same 'pattern-rules' engine the Pattern category registers above. */
import { PATTERNLOOP_PRESETS } from './patternloop/presets.js'
/* Penrose = the labs generative-typography prototypes; round2 preset files
 * plug into penrose/presets.js (not here) — this import stays the only one. */
import { PENROSE_LOOPS, PENROSE_PRESETS } from './penrose/presets.js'
import { SCANLINE_LOOPS, SCANLINE_PRESETS } from './scanline/presets.js'
import { OPTIC_LOOPS, OPTIC_PRESETS } from './optic/presets.js'
import { ABSTRACT_LOOPS, ABSTRACT_PRESETS } from './abstract/presets.js'
import { MATH_LOOPS, MATH_PRESETS } from './math/presets.js'
import { MODULATOR_LOOPS, MODULATOR_PRESETS } from './modulator/presets.js'
import { DISTRESS_LOOPS, DISTRESS_PRESETS } from './distress/presets.js'
import { PARATYPE_LOOPS, PARATYPE_PRESETS } from './paratype/presets.js'
/* GL catalog is DATA ONLY (groups/defs/presets/schemas) — the three.js
 * engines behind it load lazily via gl/host.js when a layer renders. */
import { GL_GROUPS, GL_LOOPS, GL_PRESETS_BY_GROUP, MESH_PRESETS } from './gl/catalog.js'

export const GROUPS = [
  { id: 'shape', label: 'Simple' },
  { id: 'pattern', label: 'Pattern' },
  { id: 'patternloop', label: 'Pattern Loops' },
  { id: 'penrose', label: 'Penrose' },
  { id: 'field', label: 'Field' },
  { id: 'scanline', label: 'Scanline' },
  { id: 'optic', label: 'Optic' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'math', label: 'Math' },
  { id: 'paratype', label: 'Para-type' },
  { id: 'modulator', label: 'Modulator' },
  { id: 'distress', label: 'Distressor' },
  ...GL_GROUPS,
]
export const groupById = (id) => GROUPS.find((g) => g.id === id) || GROUPS[0]

const LOOPS = [
  ...SHAPE_LOOPS, ...FIELD_LOOPS, ...PATTERN_LOOPS, ...PENROSE_LOOPS,
  ...SCANLINE_LOOPS, ...OPTIC_LOOPS, ...ABSTRACT_LOOPS,
  ...MATH_LOOPS, ...PARATYPE_LOOPS, ...MODULATOR_LOOPS, ...DISTRESS_LOOPS, ...GL_LOOPS,
]
const PRESETS_BY_GROUP = {
  shape: SHAPE_PRESETS,
  pattern: PATTERN_PRESETS,
  patternloop: PATTERNLOOP_PRESETS,
  penrose: PENROSE_PRESETS,
  field: FIELD_PRESETS,
  scanline: SCANLINE_PRESETS,
  /* optic = labs' EFFECTS > Pattern generator pages; the mesh-gradient GL
   * family is its fourth page (Moiré · Mesh Gradient · Reaction · Halftone). */
  optic: [...OPTIC_PRESETS, ...MESH_PRESETS],
  abstract: ABSTRACT_PRESETS,
  math: MATH_PRESETS,
  paratype: PARATYPE_PRESETS,
  modulator: MODULATOR_PRESETS,
  distress: DISTRESS_PRESETS,
  ...GL_PRESETS_BY_GROUP,
}
export const PRESETS = [
  ...SHAPE_PRESETS, ...PATTERN_PRESETS, ...PATTERNLOOP_PRESETS, ...PENROSE_PRESETS,
  ...FIELD_PRESETS,
  ...SCANLINE_PRESETS, ...OPTIC_PRESETS, ...MESH_PRESETS, ...ABSTRACT_PRESETS,
  ...MATH_PRESETS, ...PARATYPE_PRESETS, ...MODULATOR_PRESETS, ...DISTRESS_PRESETS,
  ...Object.values(GL_PRESETS_BY_GROUP).flat(),
]

export const loopById = (id) => LOOPS.find((l) => l.id === id) || LOOPS[0]

// Tool loops (loop def `tool: true`) are instruments, not visuals — the
// randomiser's Generate/shuffle flows exclude their presets.
const TOOL_LOOP_IDS = new Set(LOOPS.filter((l) => l.tool).map((l) => l.id))
export const isToolPreset = (p) => TOOL_LOOP_IDS.has(p.loop)
export const presetsInGroup = (group) => PRESETS_BY_GROUP[group] || []
export const presetsInSub = (group, sub) => presetsInGroup(group).filter((p) => p.sub === sub)
export const presetById = (id) => PRESETS.find((p) => p.id === id) || PRESETS[0]

// The registry group owning a preset id — the reverse of PRESETS_BY_GROUP,
// since presets carry no group field of their own. Null when the id is
// unknown, so callers can tell "not found" from "found in group 0" (unlike
// presetById, which falls back to the first preset). Used to resolve a labs
// deep link (`?view=labs&preset=…`) back to a full layer patch.
export const groupOfPreset = (id) => {
  for (const group in PRESETS_BY_GROUP) {
    if (PRESETS_BY_GROUP[group].some((p) => p.id === id)) return group
  }
  return null
}

// Off-schema keys any preset of a loop sets (e.g. iridescent freq/relief/spin,
// sf-lava bulge). Schema keys reset via loopDefaults on every preset apply, but
// call sites MERGE the param patch into the layer — without an explicit
// undefined, a previous preset's off-schema keys would survive the switch and
// render differently than a fresh insert.
const offSchemaKeysByLoop = new Map()
const loopOffSchemaKeys = (loopId) => {
  let keys = offSchemaKeysByLoop.get(loopId)
  if (!keys) {
    const schema = new Set(Object.keys(loopDefaults(loopById(loopId))))
    keys = [...new Set(PRESETS.filter((p) => p.loop === loopId)
      .flatMap((p) => Object.keys(p.params || {})))].filter((k) => !schema.has(k))
    offSchemaKeysByLoop.set(loopId, keys)
  }
  return keys
}

// Core layer fields no loop param may shadow — params live FLAT on the layer
// by design, so these are the one namespace presets are barred from. The
// iridescent presets' `type` pin flattened onto layer.type and turned every
// Gradients layer into "Media" with a blank stage (2026-08-12).
const RESERVED_LAYER_KEYS = ['id', 'type', 'x', 'y', 'w', 'h', 'src']

// A preset's full param object = the loop's defaults overlaid with the preset's
// overrides; off-schema keys the preset doesn't set itself clear to undefined.
export const presetParams = (preset) => {
  const params = {
    ...Object.fromEntries(loopOffSchemaKeys(preset.loop).map((k) => [k, undefined])),
    ...loopDefaults(loopById(preset.loop)),
    ...(preset.params || {}),
  }
  for (const k of RESERVED_LAYER_KEYS) {
    if (k in params) {
      console.warn(`[loops] preset "${preset.id}" param "${k}" shadows a core layer field — dropped`)
      delete params[k]
    }
  }
  return params
}

// The full loop-layer patch a preset pick applies — a preset is a full param
// RESET, not a diff (LoopPicker's applyPreset shape). Shared by every "put
// this preset on a layer" entry point: the mobile chrome and the labs nav.
export const presetLayerPatch = (preset, group) => ({
  loopGroup:   group,
  presetId:    preset.id,
  presetLabel: preset.label,
  loopId:      preset.loop,
  ...presetParams(preset),
})

// The same patch for a taxonomy entry's FIRST group + preset — the "just give
// me this generative type" entry point. Null when the group is empty.
export const firstPresetPatch = (entry) => {
  const group = entry.groups[0]
  const preset = presetsInGroup(group).find((p) => !isToolPreset(p))
  return preset ? presetLayerPatch(preset, group) : null
}

// ── Background toggle (Phase 6-C) ────────────────────────────────────────
// A loop layer can render transparent by suppressing its bg-roled colour
// param: the backdrop fill paints 'rgba(0,0,0,0)' — a no-op on a cleared
// canvas. Only valid where bg is JUST a backdrop fill. Loops that feed the
// bg colour into colour math (hexToRgb/mixHex pixel ramps — the field
// family's colA + optic moiré) or fade a persistent buffer toward it
// (spinner) are listed here and keep the toggle hidden. Engine (GL) loops
// are excluded wholesale — their bg is shader-internal.
const BG_MIX_IDS = new Set([
  'plasma', 'swirl', 'checker-field', 'contour', 'rings-field', 'moire',
  'gradient-field', 'stripes', 'interference',  // field: colA→colB pixel ramps
  'optic-moire',                                // hexToRgb(colA) colour math
  'math-spinner',                               // persistence fade fills bg
  'math-field',                                 // low→high heatmap pixel ramp
  'math-orbits',                                // trail fade fills bg
  /* penrose: free-running sims — trail-fade protos wash translucent bg and
   * the host paints bg under every blit; covers round2 automatically. */
  ...PENROSE_LOOPS.map((l) => l.id),
])
export const loopBgToggleable = (def) =>
  !!def && !BG_MIX_IDS.has(def.id) && (
    /* Scene-type GL engines opt in via `bgToggle` (alpha renderer + clear-
     * alpha swap in the host); fullscreen-quad engines can't (shader paints
     * every pixel). */
    def.kind === 'engine'
      ? !!def.bgToggle
      : (def.params ?? []).some((p) => p.type === 'color' && p.role === 'bg')
  )

/* Camera-drag key map for the Orbit tool. 3D scenes declare an explicit
 * `cameraKeys: { yaw, pitch, dist }`. 2D loops don't — but the ones with a
 * `camAngle`/`camZoom` param (field + pattern loops) get a synthesized 2D map
 * so Orbit works on them too: horizontal drag → camAngle (rotate), wheel →
 * camZoom (zoom). Params live in `.params` (pattern) or `.camera` (field). */
export const resolveCameraKeys = (def) => {
  if (!def) return null
  if (def.cameraKeys) return def.cameraKeys
  const has = (k) =>
    (def.params ?? []).some((p) => p.key === k) ||
    (def.camera ?? []).some((p) => p.key === k)
  const keys = {}
  if (has('camAngle')) keys.yaw = 'camAngle'
  if (has('camZoom')) keys.dist = 'camZoom'
  /* Shape/simple loops have no static camera — only the viewport params. They
   * can't rotate (vpSpin is a rate, not an angle), but vpZoom is a static zoom
   * amount, so at least wheel-zoom works. */
  if (!keys.dist && has('vpZoom')) keys.dist = 'vpZoom'
  return keys.yaw || keys.dist ? keys : null
}

// Params for a draw call honoring `layer.bgOn` — returns `layer` untouched
// unless suppression applies (callers identity-check to know they must
// clear the canvas themselves, since the loop's bg fill no longer does).
export const loopDrawParams = (def, layer) => {
  if (layer.bgOn !== false || !loopBgToggleable(def)) return layer
  const key = def.params.find((p) => p.type === 'color' && p.role === 'bg')?.key
  return key ? { ...layer, [key]: 'rgba(0,0,0,0)' } : layer
}
