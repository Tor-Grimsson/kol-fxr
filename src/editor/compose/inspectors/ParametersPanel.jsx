import { useEffect, useState } from 'react'
import { Button, Dropdown, Tooltip } from '@kolkrabbi/kol-component'
import { LabeledControl } from '@kolkrabbi/kol-component'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { useComposeState } from '../state'
import { findLayerDeep } from '../helpers'
import { useLayerEdit } from '../useLayerEdit'
import { useGeneratorLibrary } from '../../library/LibraryProvider'
import AutoControls from '../../params/AutoControls'
import BindDot from '../../params/BindDot'
import { ModulationList } from '../../params/ModulationEditor'
import { SHAPE_SCHEMA } from '../../params/schemas/shape'
import { PATTERN_SCHEMA } from '../../params/schemas/pattern'
import { TEXT_SCHEMA } from '../../params/schemas/text'
import { PHOTO_SCHEMA } from '../../params/schemas/photo'
import { TEXT_TAB_KEYS, VariableBlock } from './TextPanel'
import { layerFamily, isOutlineFamily } from '../../modes/type/families'
import Hint from '../../components/Hint'
import { pack } from '../../packs'

/**
 * ParametersPanel — the Parameters tab of the right rail (Phase 6-A).
 *
 * The Inspector stays high-level (position / transform / opacity / blend /
 * paint); everything schema-driven or type-deep lives HERE: shape kind
 * params, photo fit, loop controls. Text typography and the pattern surface
 * moved to their selection-driven Text / Pattern tabs (TextPanel /
 * PatternPanel) — one home per control; this tab keeps their non-styling
 * remainder (content, saved-spec pickers, mode/flatten actions, tab:'anim'
 * params). Inspector pointer rows flip to this tab (`kol:open-params`).
 * Effects (filter picker + params) live in the dedicated Effects tab
 * (EffectsPanel).
 *
 * Labs information architecture (kol-labs-single scanlines): a segmented
 * Generate · Style · Animation strip splits each type's surface — Generate
 * holds pickers + randomize/actions, Style the look params (grouped under
 * section headers via schema `section` metadata), Animation the motion
 * params (`tab:'anim'`). Loop Category/Preset stay above the strip, always
 * reachable. Renders the same rail skeleton as InspectorRail (header row +
 * .kol-compose-inspector-body) so tab-switching doesn't shift the column.
 *
 * Same write path as the inspector: useLayerEdit coalesced history +
 * BindDot per animatable field.
 */
const SUBTAB_OPTIONS = [
  { value: 'generate', label: 'Generate' },
  { value: 'style',    label: 'Style' },
  { value: 'anim',     label: 'Animation' },
]

/* Text params minus the keys the Inspector's TextSurface owns (one home per
 * control) — leaves any future non-styling params. */
const TEXT_PARAMS_SCHEMA = TEXT_SCHEMA.filter((p) => !TEXT_TAB_KEYS.has(p.key))

export default function ParametersPanel() {
  const { selectedId, layers } = useComposeState()
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null

  return (
    <div className="kol-compose-rail kol-compose-rail--inspector">
      {/* Header (title + delete) is shared in SelectionPalettePanel. */}
      <div className="kol-compose-inspector-body">
        {layer
          ? <LayerParameters key={layer.id} layer={layer} />
          : <Hint className="kol-helper-12 text-meta">Select a layer to edit its parameters.</Hint>}
      </div>
    </div>
  )
}

function LayerParameters({ layer }) {
  const { updateLayer, convertShapeToPath, palette } = useComposeState()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const setProp = edit.setProp
  const [tab, setTab] = useState('style')
  /* Deep-link a subtab (context menu's "Morph" lands on Style). */
  useEffect(() => {
    const onSubtab = (e) => { if (e.detail?.tab) setTab(e.detail.tab) }
    window.addEventListener('kol:params-subtab', onSubtab)
    return () => window.removeEventListener('kol:params-subtab', onSubtab)
  }, [])
  const renderAnimate = (p) => <BindDot layer={layer} param={p} setProp={setProp} />
  const shared = { layer, setProp, patch: edit.patch, updateLayer, palette, renderAnimate, tab }
  const tabStrip = <SegmentedToggle variant="filled" value={tab} onChange={setTab} options={SUBTAB_OPTIONS} />

  let body = null
  /* Loop places the strip itself — Category/Preset stay above it. */
  let stripInBody = false
  if (layer.type === 'shape') {
    body = (
      <>
        {tab === 'generate' && ['rect', 'ellipse', 'triangle', 'polygon', 'star', 'line'].includes(layer.kind) && (
          <Tooltip label="Convert the shape to an editable bezier path (one-way)"><Button aria-label="Convert the shape to an editable bezier path (one-way)"
            tone="primary" size="sm" className="w-full"
            onClick={() => convertShapeToPath(layer.id)}
          >
            Convert to path
          </Button></Tooltip>
        )}
        {tab === 'style' && <AutoControls schema={SHAPE_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="style" />}
        {tab === 'anim' && (
          <>
            <ModulationList layer={layer} schema={SHAPE_SCHEMA} setProp={setProp} />
            <AutoControls schema={SHAPE_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="anim" />
          </>
        )}
      </>
    )
  } else if (layer.type === 'text') {
    body = <TextFields {...shared} />
  } else if (layer.type === 'pattern') {
    body = <PatternFields {...shared} />
  } else if (layer.type === 'photo') {
    /* Fit only — the filter picker + params live in the Effects tab. */
    body = (
      <>
        {tab === 'style' && <AutoControls schema={PHOTO_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="style" />}
        {tab === 'anim' && (
          <>
            <ModulationList layer={layer} schema={PHOTO_SCHEMA} setProp={setProp} />
            <AutoControls schema={PHOTO_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="anim" />
          </>
        )}
      </>
    )
  } else if (layer.type === 'loop') {
    /* loop/misc are the generators pack's, kinetic the motion pack's (editor/packs.js) — a layer
     * whose pack is absent has no parameters here */
    const LoopFields = pack('generators')?.LoopFields
    if (!LoopFields) return <Hint className="kol-helper-12 text-meta">This layer has no parameters.</Hint>
    body = <LoopFields {...shared} tabStrip={tabStrip} />
    stripInBody = true
  } else if (layer.type === 'misc') {
    const g = pack('generators')
    if (!g) return <Hint className="kol-helper-12 text-meta">This layer has no parameters.</Hint>
    body = <g.LoopFields {...shared} tabStrip={tabStrip} tree={g.MISC_TREE} />
    stripInBody = true
  } else if (layer.type === 'kinetic') {
    /* Kinetic places the strip itself — picker + Elements stay above it. */
    const KineticPanel = pack('motion')?.KineticPanel
    if (!KineticPanel) return <Hint className="kol-helper-12 text-meta">This layer has no parameters.</Hint>
    body = <KineticPanel {...shared} tabStrip={tabStrip} />
    stripInBody = true
  } else if (layer.type === 'path') {
    body = null
  } else {
    return <Hint className="kol-helper-12 text-meta">This layer has no parameters.</Hint>
  }

  return (
    <div className="flex flex-col gap-4">
      {!stripInBody && tabStrip}
      {body}
    </div>
  )
}


/**
 * PatternFields — the pattern layer's NON-styling remainder. The pattern
 * surface itself (schema params, rules editor, colors, save) lives in the
 * Pattern tab (PatternPanel) — one home per control.
 *
 * "Apply saved pattern" picker reads from `library.pattern` (Pattern Lab's
 * save slot) and copies params into the layer.
 */
function PatternFields({ layer, setProp, updateLayer, palette, renderAnimate, tab }) {
  const { library }        = useGeneratorLibrary()
  const { flattenPattern } = useComposeState()
  const patterns = library.pattern ?? []
  const patternOptions = [
    { value: '', label: '— pick spec' },
    ...patterns.map((p, i) => ({ value: p.id, label: `Pattern ${i + 1}` })),
  ]

  const onPickSpec = (id) => {
    if (!id) return
    const spec = patterns.find((p) => p.id === id)
    if (!spec) return
    /* Copy spec params into the layer. Color + bg stay as-is so the user's
     * palette refs aren't trampled by Pattern Lab's literal hex values. */
    updateLayer(layer.id, {
      shapeId:   spec.shapeId   ?? layer.shapeId,
      customSvg: spec.customSvg ?? layer.customSvg,
      cols:      spec.cols      ?? layer.cols,
      rows:      spec.rows      ?? layer.rows,
      gap:       spec.gap       ?? layer.gap,
      padding:   spec.padding   ?? layer.padding,
      stretch:   spec.stretch   ?? layer.stretch,
      overflow:  spec.overflow  ?? layer.overflow,
      rules:     spec.rules     ?? layer.rules,
      scale:     spec.scale     ?? layer.scale,
    })
  }

  const onFlatten = () => flattenPattern(layer.id)

  return (
    <>
      {tab === 'generate' && (
        <>
          {patterns.length > 0 && (
            <LabeledControl label="Apply saved pattern">
              <Dropdown
                variant="subtle" size="sm" className="w-full"
                options={patternOptions}
                value=""
                onChange={onPickSpec}
              />
            </LabeledControl>
          )}

          <div className="pt-2 border-t border-oq-08">
            <Tooltip label="Flatten the pattern to static SVG shapes (one-way)"><Button aria-label="Flatten the pattern to static SVG shapes (one-way)" tone="primary" size="sm" className="w-full" onClick={onFlatten}
             >
              Flatten
            </Button></Tooltip>
          </div>
        </>
      )}

      {tab === 'style' && (
        <Hint className="kol-helper-12 text-meta">Pattern styling lives in the Pattern tab.</Hint>
      )}

      {tab === 'anim' && (
        <>
          <ModulationList layer={layer} schema={PATTERN_SCHEMA} setProp={setProp} />
          <AutoControls schema={PATTERN_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="anim" />
        </>
      )}
    </>
  )
}

/**
 * TextFields — the text layer's NON-styling remainder. Content + typography
 * live in the Inspector's TextSurface (the 2026-08-12 inspector ruling) —
 * one home per control; this keeps the saved-spec picker, Flatten and anim.
 *
 * Optional "Saved as" picker reads from the shared library's `type` slot
 * (saves from Type Lab). Picking a spec copies its typography fields into
 * the layer (no live link — layer stays self-contained).
 */
function TextFields({ layer, setProp, updateLayer, palette, renderAnimate, tab }) {
  const { library } = useGeneratorLibrary()
  const { flattenText } = useComposeState()
  const specs = library.type ?? []

  const onFlatten = () => flattenText(layer.id)
  const specOptions = [
    { value: '', label: '— free-form' },
    ...specs.map((t, i) => ({ value: t.id, label: t.text?.slice(0, 24) || `Spec ${i + 1}` })),
  ]

  const onPickSpec = (id) => {
    if (!id) return
    const spec = specs.find((t) => t.id === id)
    if (!spec) return
    /* Copy spec values into the layer fields. Self-contained — no specId tag. */
    updateLayer(layer.id, {
      text:       spec.text       ?? layer.text,
      width:      spec.width      ?? layer.width,
      weight:     spec.weight     ?? layer.weight,
      italic:     spec.italic     ?? layer.italic,
      size:       spec.size       ?? layer.size,
      tracking:   spec.tracking   ?? layer.tracking,
      lineHeight: spec.lineHeight ?? layer.lineHeight,
      case:       spec.case       ?? layer.case,
      textAlign:  spec.textAlign  ?? layer.textAlign,
    })
  }

  return (
    <>
      {tab === 'generate' && (
        <>
          {specs.length > 0 && (
            <LabeledControl label="Apply saved spec">
              <Dropdown
                variant="subtle" size="sm" className="w-full"
                options={specOptions}
                value=""
                onChange={onPickSpec}
              />
            </LabeledControl>
          )}

          <Tooltip label={isOutlineFamily(layerFamily(layer))
              ? 'Flatten the text to glyph-outline shapes (one-way)'
              : 'Flatten needs an outline font — switch the Family to Right Grotesk'}><Button aria-label={isOutlineFamily(layerFamily(layer))
              ? 'Flatten the text to glyph-outline shapes (one-way)'
              : 'Flatten needs an outline font — switch the Family to Right Grotesk'} tone="primary" size="sm" className="w-full" onClick={onFlatten}
            disabled={!isOutlineFamily(layerFamily(layer))}
           >
            Flatten
          </Button></Tooltip>
        </>
      )}

      {tab === 'style' && (
        <>
          {/* Morph — the text layer's option surface (user ruling 2026-08-12:
              options live in Parameters, the Inspector shows what's set). */}
          <VariableBlock layer={layer} setProp={setProp} />
          <AutoControls schema={TEXT_PARAMS_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="style" />
        </>
      )}

      {tab === 'anim' && (
        <>
          <ModulationList layer={layer} schema={TEXT_SCHEMA} setProp={setProp} />
          <AutoControls schema={TEXT_SCHEMA} layer={layer} setProp={setProp} palette={palette} renderAnimate={renderAnimate} tab="anim" />
        </>
      )}
    </>
  )
}
