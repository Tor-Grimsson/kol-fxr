import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, Input, LabeledControlSection, SegmentedToggle, SettingsRow, useModal } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { loopById } from '../../loops/registry'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { useLayerEdit } from '../compose/useLayerEdit'
import { LoopFields } from '../compose/inspectors/LoopFields'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { useLabsLayer } from '../labs/useLabsLayer'
import { transport, useTransportPlaying } from '../params/transport'
import { useControlSize, RAIL_LABEL_W } from '../params/controlSize'
import { buildMorph, CURVES, CYCLES } from './buildMorph'
import { hasOutline, morphKeys } from './shape'
import { useMorph, setMorph, updateStep, removeStep, moveStep, pickParams, stepLabel } from './morphStore'

/**
 * MorphTab — the Morph rail (plan 10): labs' right rail while the MORPH row is the surface in use,
 * and read-only in the randomiser's sheet.
 *
 * Steps as numbered slots, the last one always an empty slot with a `+` — the add IS the slot.
 * Under them the morph's settings on the rail's own rows: Mode (Shape · Blend) · Curve · Cycle ·
 * Length. Two steps or more and the stage plays the morph.
 *
 *   Shape  point to point between the outlines the steps draw (`shape.js`) — any generators;
 *          the layer carries `morph.steps` and a `morphT` track the dock shows as the lane.
 *   Blend  plan 05's parameter tween (`buildMorph`): one generator, a track per differing param.
 *
 * THE EDITING RULE (plan 09, kept): click a step and its settings go on the stage, static, the
 * transport pauses, and the step's own Generate · Style · Animation fields open under the slot
 * list, writing to that step. Play (the transport's), or leaving the rail, rebuilds the morph.
 */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const MODES = [
  { value: 'shape', label: 'Shape' },
  { value: 'blend', label: 'Blend' },
]

export default function MorphTab({ layer, readOnly = false, editTabs = null }) {
  const cs = useControlSize()
  const morph = useMorph()
  const { steps, curve, cycle, seconds, mode, editing, fileId } = morph
  const { updateLayer, setCurrentPresetId, setCurrentPresetName, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const { buildSpec } = useComposeFile()
  const { addItem, updateItem } = useGeneratorLibrary()
  const modal = useModal()
  const playing = useTransportPlaying()
  const edit = useLayerEdit(layer?.id ?? null, { history: 'coalesce' })
  const [editTab, setEditTab] = useState('generate')

  /* rebuild the stage from the steps — the one write the morph makes */
  const rebuild = () => {
    if (steps.length < 2) return
    const first = steps[0]
    const identity = { loopGroup: first.loopGroup, presetId: first.presetId, presetLabel: first.presetLabel, loopId: first.loopId }
    const patch = mode === 'shape'
      ? { ...identity, ...first.params, morph: { mode: 'shape', steps: steps.map((s) => ({ loopId: s.loopId, params: s.params })) }, morphT: { bind: 'track', keys: morphKeys(steps.length, cycle, curve) } }
      : { ...identity, ...buildMorph({ snapshots: steps.map((s) => s.params), schema: loopById(first.loopId)?.params ?? [], curve, cycle }).patch, morph: null, morphT: null }
    if (layer) updateLayer(layer.id, patch)
    else setOnly('loop', patch)
    transport.setLoopSeconds(seconds)
  }
  const rebuildRef = useRef(rebuild); rebuildRef.current = rebuild

  /* steps or settings changed while not editing → the stage plays the new morph; a fresh mount
     (the MORPH row pressed again) rebuilds too, since the stage may have been swapped meanwhile */
  const sig = JSON.stringify([mode, steps.map((s) => [s.loopId, s.params]), curve, cycle, seconds])
  const lastSig = useRef(null)
  useEffect(() => {
    if (readOnly || editing != null || steps.length < 2 || sig === lastSig.current) return
    lastSig.current = sig
    rebuildRef.current()
    if (!transport.isPlaying()) transport.play()
  }, [sig, editing, steps.length, readOnly])

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
    transport.pause()
    setMorph({ editing: i })
    setOnly('loop', { loopGroup: s.loopGroup, presetId: s.presetId, presetLabel: s.presetLabel, loopId: s.loopId, ...s.params, morph: null, morphT: null })
  }
  const save = async () => {
    if (steps.length < 2) return
    let name = morph.fileName
    if (!fileId) { name = await modal.prompt('Name this morph:', ''); if (name === null) return }
    if (editing != null) { setMorph({ editing: null }); rebuildRef.current() }
    const spec = { ...buildSpec(name || null), mode: 'morph', morph: { mode, loopId: morph.loopId, steps, curve, cycle, seconds } }
    if (fileId) { updateItem('preset', fileId, spec); return }
    const id = addItem('preset', spec)
    if (id) { setMorph({ fileId: id, fileName: name || null }); setCurrentPresetId(id); setCurrentPresetName(name || null) }
  }

  const noOutline = mode === 'shape' ? steps.filter((s) => !hasOutline(loopById(s.loopId))) : []
  const ctl = cs === 'sm' ? 'sm' : 'md'

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-1">
        {steps.map((s, i) => (
          <li key={i} className={`flex items-center gap-2 rounded px-2 py-1 ${editing === i ? 'bg-fg-08' : ''}`}>
            <button type="button" className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer" onClick={() => !readOnly && editStep(i)} aria-label={`Edit step ${i + 1}`}>
              <span className="kol-helper-10 text-meta tabular-nums w-4 shrink-0">{i + 1}</span>
              <span className="kol-mono-12 text-emphasis truncate">{stepLabel(s, i)}</span>
            </button>
            {!readOnly && (
              <span className="flex items-center gap-0.5 shrink-0">
                <Button tone="ghost" quiet size="sm" iconOnly="arrow-up" aria-label="Move up" disabled={i === 0} onClick={() => moveStep(i, -1)} />
                <Button tone="ghost" quiet size="sm" iconOnly="arrow-down" aria-label="Move down" disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)} />
                <Button tone="ghost" quiet size="sm" iconOnly="x" aria-label="Remove step" onClick={() => removeStep(i)} />
              </span>
            )}
          </li>
        ))}
        {!readOnly && (
          <li>
            {/* THE EMPTY SLOT — the next step's row, dashed, with the plus; pressing it opens the picker */}
            <button
              type="button"
              aria-label="Add a step"
              onClick={() => setMorph({ active: true, picker: 'preset' })}
              className="flex items-center gap-2 w-full rounded px-2 py-1 border border-dashed border-oq-16 text-meta hover:text-body hover:border-oq-24 cursor-pointer"
            >
              <span className="kol-helper-10 tabular-nums w-4 shrink-0">{steps.length + 1}</span>
              <Icon name="plus" size={12} />
              <span className="kol-mono-12">Add a step</span>
            </button>
          </li>
        )}
      </ul>
      {steps.length < 2 && !readOnly && <p className="kol-mono-12 text-meta">Two steps or more and the stage plays the morph.</p>}

      {editing != null && !readOnly && layer && editTabs && (
        <LabeledControlSection label={`Step ${editing + 1}`} divided>
          <SegmentedToggle value={editTab} onChange={setEditTab} options={editTabs} size={cs} />
          <LoopFields layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer} palette={palette} tab={editTab} tabStrip={null} inline picker={false} />
          <p className="kol-mono-12 text-emphasis">Editing step {editing + 1} — press Play to run the morph.</p>
        </LabeledControlSection>
      )}

      <LabeledControlSection divided>
        <SettingsRow label="Mode" labelWidth={RAIL_LABEL_W}>
          <SegmentedToggle value={mode} onChange={(v) => !readOnly && setMorph({ mode: v })} options={MODES} size={cs} />
        </SettingsRow>
        <SettingsRow label="Curve" labelWidth={RAIL_LABEL_W}>
          <Dropdown size={ctl} options={CURVES} value={curve} onChange={(v) => setMorph({ curve: v })} aria-label="Curve" disabled={readOnly} />
        </SettingsRow>
        <SettingsRow label="Cycle" labelWidth={RAIL_LABEL_W}>
          <Dropdown size={ctl} options={CYCLES} value={cycle} onChange={(v) => setMorph({ cycle: v })} aria-label="Cycle" disabled={readOnly} />
        </SettingsRow>
        <SettingsRow label="Length" labelWidth={RAIL_LABEL_W}>
          <span className="inline-flex items-center gap-2">
            <Input size={ctl} chars={4} value={String(seconds)} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n > 0) setMorph({ seconds: n }) }} aria-label="Length in seconds" disabled={readOnly} />
            <span className="kol-helper-10 text-meta">s</span>
          </span>
        </SettingsRow>
      </LabeledControlSection>
      {noOutline.length > 0 && (
        <p className="kol-mono-12 text-meta">No outline to morph: {noOutline.map((s) => stepLabel(s, steps.indexOf(s))).join(', ')} — use Blend.</p>
      )}

      {!readOnly && (
        <Button tone="primary" size={cs} className="w-full" disabled={steps.length < 2} onClick={save}>{fileId ? 'Save' : 'Save…'}</Button>
      )}
    </div>
  )
}
