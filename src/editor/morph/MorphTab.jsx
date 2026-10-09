import { useEffect, useRef, useState } from 'react'
import { Button, LabeledControlSection, SegmentedToggle, StepList, useModal } from '@kolkrabbi/kol-component'
import { loopById } from '../../loops/registry'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { useLayerEdit } from '../compose/useLayerEdit'
import { LoopFields } from '../compose/inspectors/LoopFields'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { useLabsLayer } from '../labs/useLabsLayer'
import { transport, useTransportPlaying } from '../params/transport'
import { useControlSize, stripClamp } from '../params/controlSize'
import AutoControls from '../params/AutoControls'
import { buildMorph, CURVES, CYCLES } from './buildMorph'
import { hasOutline, canCrossfade, morphKeys } from './shape'
import { useMorph, setMorph, addStep, updateStep, removeStep, reorderStep, pickParams, stepLabel } from './morphStore'
import { stepFromLayer } from './StepPicker'

/**
 * MorphTab — the Morph rail (plan 10): labs' right rail while the MORPH row is the surface in use,
 * and read-only in the randomiser's sheet.
 *
 * Steps as numbered slots, the last one always an empty slot with a `+` — the add IS the slot.
 * Under them the morph's settings on the rail's own rows: Mode (Shape · Blend · Crossfade) · Curve ·
 * Cycle (· Resolution in Shape). The LENGTH is the transport's (plan 14 § 4) — the rail had its own
 * field writing the same clock. Two steps or more and the stage plays the morph.
 *
 *   Shape      point to point between the outlines the steps draw (`shape.js`) — any 2d generators
 *   Blend      plan 05's parameter tween (`buildMorph`): one generator, a track per differing param
 *   Crossfade  step fades into step (plan 14 § 2) — any 2d generators, no pairing
 *
 * A mode the steps cannot take is greyed with the reason (Blend: not one generator; Shape and
 * Crossfade: a GL engine among the steps). The layer carries `morph` in every mode — steps with
 * their labels, cycle and curve — so the timeline dock can name the lane (plan 14 § 7); the
 * renderer reads `morph.mode` to pick a draw, and Blend's is the generator's own.
 *
 * THE EDITING RULE (plan 09, kept): click a step and its settings go on the stage, static, the
 * transport pauses, and the step's own Generate · Style · Animation fields open under the slot
 * list, writing to that step. Play (the transport's), or leaving the rail, rebuilds the morph.
 */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* the morph's settings as a schema, so the rail's own renderer draws them — the labs rows, one
   label column, full-width dropdowns, a slider for Resolution (points per outline pair, 0 = auto) */
const SETTINGS = [
  { key: 'curve', label: 'Curve', type: 'select', options: CURVES },
  { key: 'cycle', label: 'Cycle', type: 'select', options: CYCLES },
  { key: 'resolution', label: 'Resolution', type: 'range', min: 0, max: 1024, step: 1, default: 0, format: (v) => (v ? v : 'Auto'), when: (m) => m.mode === 'shape' },
]

export default function MorphTab({ layer, readOnly = false, editTabs = null }) {
  const cs = useControlSize()
  const morph = useMorph()
  const { steps, curve, cycle, mode, resolution, editing, fileId, editRequest } = morph
  const { updateLayer, setCurrentPresetId, setCurrentPresetName, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const { buildSavedSpec } = useComposeFile()
  const { addItem, updateItem } = useGeneratorLibrary()
  const modal = useModal()
  const playing = useTransportPlaying()
  const edit = useLayerEdit(layer?.id ?? null, { history: 'coalesce' })
  const [editTab, setEditTab] = useState('generate')

  /* which modes these steps can take */
  const first = steps[0]
  const oneGenerator = steps.every((s) => s.loopId === first?.loopId)
  const engines = steps.filter((s) => !hasOutline(loopById(s.loopId)) || !canCrossfade(loopById(s.loopId)))
  const allDraw = engines.length === 0
  const blocked = {
    blend: oneGenerator ? null : 'Blend tweens one generator — these steps are different generators',
    shape: allDraw ? null : `No outline to morph: ${engines.map((s) => stepLabel(s, steps.indexOf(s))).join(', ')} (GL)`,
    crossfade: allDraw ? null : `Cannot fade: ${engines.map((s) => stepLabel(s, steps.indexOf(s))).join(', ')} (GL)`,
  }
  const modeOptions = [
    /* a blocked mode is a DISABLED cell (kol-component 0.245.0, `SegmentedToggleOptionDisabled`) — the
       tooltip still gives the reason, ←/→ skip it, the cell refuses the press */
    { value: 'shape', label: 'Shape', disabled: !!blocked.shape, tooltip: blocked.shape ?? undefined },
    { value: 'blend', label: 'Blend', disabled: !!blocked.blend, tooltip: blocked.blend ?? undefined },
    { value: 'crossfade', label: 'Crossfade', disabled: !!blocked.crossfade, tooltip: blocked.crossfade ?? undefined },
  ]
  /* a mode the steps cannot take falls to the first one they can */
  useEffect(() => {
    if (readOnly || steps.length < 2 || !blocked[mode]) return
    const next = ['shape', 'crossfade', 'blend'].find((m) => !blocked[m])
    if (next) setMorph({ mode: next })
  }, [mode, oneGenerator, allDraw, steps.length, readOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  /* arriving from a labs preset: the generator on the stage IS step 1 — the preview showed it and
     the slot sat empty (the user, 2026-10-09) */
  useEffect(() => {
    if (!readOnly && steps.length === 0 && layer?.type === 'loop' && layer.loopId && !layer.morph) addStep(stepFromLayer(layer))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* rebuild the stage from the steps — the one write the morph makes */
  const rebuild = () => {
    if (steps.length < 2) return
    const identity = { loopGroup: first.loopGroup, presetId: first.presetId, presetLabel: first.presetLabel, loopId: first.loopId }
    const carried = { mode, steps: steps.map((s, i) => ({ loopId: s.loopId, params: s.params, label: stepLabel(s, i) })), cycle, curve, resolution, name: morph.fileName }
    const patch = mode === 'blend'
      ? { ...identity, ...buildMorph({ snapshots: steps.map((s) => s.params), schema: loopById(first.loopId)?.params ?? [], curve, cycle }).patch, morph: carried, morphT: null }
      : { ...identity, ...first.params, morph: carried, morphT: { bind: 'track', keys: morphKeys(steps.length, cycle, curve) } }
    if (layer) updateLayer(layer.id, patch)
    else setOnly('loop', patch)
  }
  const rebuildRef = useRef(rebuild); rebuildRef.current = rebuild

  /* steps or settings changed while not editing → the stage plays the new morph; a fresh mount
     (the MORPH row pressed again) rebuilds too, since the stage may have been swapped meanwhile */
  const sig = JSON.stringify([mode, steps.map((s) => [s.loopId, s.params]), curve, cycle, resolution])
  const lastSig = useRef(null)
  useEffect(() => {
    if (readOnly || editing != null || steps.length < 2 || sig === lastSig.current || blocked[mode]) return
    lastSig.current = sig
    rebuildRef.current()
    if (!transport.isPlaying()) transport.play()
  }, [sig, editing, steps.length, readOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  /* the editing rule, half one: the fields write to the step on the stage */
  useEffect(() => {
    if (readOnly || editing == null || !layer) return
    const next = pickParams(layer, loopById(layer.loopId)?.params ?? [])
    if (!same(next, steps[editing]?.params)) updateStep(editing, next)
  }, [layer]) // eslint-disable-line react-hooks/exhaustive-deps
  /* half two: Play ends the edit and the morph runs again */
  useEffect(() => {
    if (readOnly || !playing || editing == null) return
    setMorph({ editing: null })
    lastSig.current = null
  }, [playing, editing, readOnly])
  /* leaving the rail (unmount) ends an edit the same way */
  useEffect(() => () => { if (!readOnly && morph.editing != null) { setMorph({ editing: null }); rebuildRef.current() } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const editStep = (i) => {
    const s = steps[i]
    if (!s) return
    transport.pause()
    setMorph({ editing: i })
    setOnly('loop', { loopGroup: s.loopGroup, presetId: s.presetId, presetLabel: s.presetLabel, loopId: s.loopId, ...s.params, morph: null, morphT: null })
  }
  /* a step name pressed on the timeline lane (plan 14 § 7) */
  useEffect(() => {
    if (readOnly || editRequest == null) return
    setMorph({ editRequest: null })
    editStep(editRequest)
  }, [editRequest]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (steps.length < 2) return
    let name = morph.fileName
    if (!fileId) { name = await modal.prompt('Name this morph:', ''); if (name === null) return }
    if (editing != null) { setMorph({ editing: null }); rebuildRef.current() }
    const spec = { ...(await buildSavedSpec(name || null)), mode: 'morph', morph: { mode, loopId: morph.loopId, steps, curve, cycle, resolution, seconds: transport.getLoopSeconds() } }
    if (fileId) { updateItem('preset', fileId, spec); return }
    const id = addItem('preset', spec)
    if (id) { setMorph({ fileId: id, fileName: name || null }); setCurrentPresetId(id); setCurrentPresetName(name || null) }
  }

  /* settings write to the store; a binding (an expression typed into the field) is not a setting */
  const setSetting = (k, v) => { if (!readOnly && (v === null || typeof v !== 'object')) setMorph({ [k]: v }) }

  return (
    <div className="flex flex-col gap-5">
      {/* the mode is the rail's strip, where labs puts Generate · Style · Animation */}
      <SegmentedToggle value={mode} onChange={(v) => !readOnly && setMorph({ mode: v })} options={modeOptions} size={cs} className={stripClamp(cs)} />

      <LabeledControlSection divided>
        {/* the DS list (kol-component 0.245.0, `StepList` — filed from here 2026-10-09); the local copy
            is in _tmp/2026-10-09-morph-steplist/. `grab` is a pointer sort, so it works under a finger. */}
        <StepList
          items={steps.map((s, i) => ({ id: i, label: stepLabel(s, i) }))}
          activeIndex={editing}
          reorder="grab"
          readOnly={readOnly}
          size={cs}
          onSelect={editStep}
          onRemove={removeStep}
          onMove={reorderStep}
          onAdd={() => setMorph({ active: true, picker: 'preset' })}
          addLabel="Add a step"
        />
        {steps.length < 2 && !readOnly && <p className="kol-mono-12 text-meta">Two steps or more and the stage plays the morph.</p>}
        {steps.length >= 2 && blocked[mode] && <p className="kol-mono-12 text-meta">{blocked[mode]}</p>}
      </LabeledControlSection>

      {editing != null && !readOnly && layer && editTabs && (
        <LabeledControlSection label={`Step ${editing + 1}`} divided>
          <SegmentedToggle value={editTab} onChange={setEditTab} options={editTabs} size={cs} className={stripClamp(cs)} />
          <LoopFields layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer} palette={palette} tab={editTab} tabStrip={null} inline picker={false} />
          <p className="kol-mono-12 text-emphasis">Editing step {editing + 1} — press Play to run the morph.</p>
        </LabeledControlSection>
      )}

      <AutoControls schema={SETTINGS} layer={morph} setProp={setSetting} inline />

      {!readOnly && (
        <LabeledControlSection divided>
          <Button tone="primary" size={cs} className="w-full" disabled={steps.length < 2} onClick={save}>{fileId ? 'Save' : 'Save…'}</Button>
        </LabeledControlSection>
      )}
    </div>
  )
}
