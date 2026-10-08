import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, LabeledControlSection, SegmentedToggle, SettingsRow, useModal } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { loopById } from '../../loops/registry'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { useLayerEdit } from '../compose/useLayerEdit'
import { LoopFields } from '../compose/inspectors/LoopFields'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { useLabsLayer } from '../labs/useLabsLayer'
import { transport, useTransportPlaying } from '../params/transport'
import { useControlSize, stripClamp, RAIL_LABEL_W } from '../params/controlSize'
import { buildMorph, CURVES, CYCLES } from './buildMorph'
import { hasOutline, canCrossfade, morphKeys, RESOLUTION_OPTIONS } from './shape'
import { useMorph, setMorph, updateStep, removeStep, reorderStep, pickParams, stepLabel } from './morphStore'

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

/* ponytail: `SegmentedToggle` has no per-option `disabled` (kol-component 0.244.0) — a greyed cell
 * is a dimmed label with the reason as its tooltip, and `onChange` refuses it. A DS seam for a
 * local session (plan 14 § 4). */
const dim = (text) => <span className="opacity-40">{text}</span>

export default function MorphTab({ layer, readOnly = false, editTabs = null }) {
  const cs = useControlSize()
  const morph = useMorph()
  const { steps, curve, cycle, mode, resolution, editing, fileId, editRequest } = morph
  const { updateLayer, setCurrentPresetId, setCurrentPresetName, palette } = useComposeState()
  const { setOnly } = useLabsLayer()
  const { buildSpec } = useComposeFile()
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
    { value: 'shape', label: blocked.shape ? dim('Shape') : 'Shape', ariaLabel: 'Shape', tooltip: blocked.shape ?? undefined },
    { value: 'blend', label: blocked.blend ? dim('Blend') : 'Blend', ariaLabel: 'Blend', tooltip: blocked.blend ?? undefined },
    { value: 'crossfade', label: blocked.crossfade ? dim('Crossfade') : 'Crossfade', ariaLabel: 'Crossfade', tooltip: blocked.crossfade ?? undefined },
  ]
  /* a mode the steps cannot take falls to the first one they can */
  useEffect(() => {
    if (readOnly || steps.length < 2 || !blocked[mode]) return
    const next = ['shape', 'crossfade', 'blend'].find((m) => !blocked[m])
    if (next) setMorph({ mode: next })
  }, [mode, oneGenerator, allDraw, steps.length, readOnly]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const spec = { ...buildSpec(name || null), mode: 'morph', morph: { mode, loopId: morph.loopId, steps, curve, cycle, resolution, seconds: transport.getLoopSeconds() } }
    if (fileId) { updateItem('preset', fileId, spec); return }
    const id = addItem('preset', spec)
    if (id) { setMorph({ fileId: id, fileName: name || null }); setCurrentPresetId(id); setCurrentPresetName(name || null) }
  }

  const ctl = cs === 'sm' ? 'sm' : 'md'

  return (
    <div className="flex flex-col gap-4">
      <StepList steps={steps} editing={editing} readOnly={readOnly} onEdit={editStep} onAdd={() => setMorph({ active: true, picker: 'preset' })} />
      {steps.length < 2 && !readOnly && <p className="kol-mono-12 text-meta">Two steps or more and the stage plays the morph.</p>}

      {editing != null && !readOnly && layer && editTabs && (
        <LabeledControlSection label={`Step ${editing + 1}`} divided>
          <SegmentedToggle value={editTab} onChange={setEditTab} options={editTabs} size={cs} />
          <LoopFields layer={layer} setProp={edit.setProp} patch={edit.patch} updateLayer={updateLayer} palette={palette} tab={editTab} tabStrip={null} inline picker={false} />
          <p className="kol-mono-12 text-emphasis">Editing step {editing + 1} — press Play to run the morph.</p>
        </LabeledControlSection>
      )}

      <LabeledControlSection label="Mode" divided>
        {/* the three cells on their own row, full width — labelled, Crossfade fell off the rail's edge */}
        <SegmentedToggle value={mode} onChange={(v) => !readOnly && !blocked[v] && setMorph({ mode: v })} options={modeOptions} size={cs} className={stripClamp(cs)} />
        <SettingsRow label="Curve" labelWidth={RAIL_LABEL_W}>
          <Dropdown size={ctl} options={CURVES} value={curve} onChange={(v) => setMorph({ curve: v })} aria-label="Curve" disabled={readOnly} />
        </SettingsRow>
        <SettingsRow label="Cycle" labelWidth={RAIL_LABEL_W}>
          <Dropdown size={ctl} options={CYCLES} value={cycle} onChange={(v) => setMorph({ cycle: v })} aria-label="Cycle" disabled={readOnly} />
        </SettingsRow>
        {mode === 'shape' && (
          <SettingsRow label="Resolution" labelWidth={RAIL_LABEL_W}>
            <Dropdown size={ctl} options={RESOLUTION_OPTIONS} value={resolution || 0} onChange={(v) => setMorph({ resolution: Number(v) || 0 })} aria-label="Resolution" disabled={readOnly} />
          </SettingsRow>
        )}
      </LabeledControlSection>
      {steps.length >= 2 && blocked[mode] && <p className="kol-mono-12 text-meta">{blocked[mode]}</p>}

      {!readOnly && (
        <Button tone="primary" size={cs} className="w-full" disabled={steps.length < 2} onClick={save}>{fileId ? 'Save' : 'Save…'}</Button>
      )}
    </div>
  )
}

/**
 * StepList — the numbered slots. Reorder by the grab handle (`drag-handle`, HTML drag the way the
 * DS `LayerStack` does it), × removes, the empty slot adds. One local component, kept whole so it
 * lifts to kol-component as a list item + group in two variants (arrows · grab) — a local-session
 * ticket (plan 14 § 4).
 */
function StepList({ steps, editing, readOnly, onEdit, onAdd }) {
  const [dragged, setDragged] = useState(null)
  const [over, setOver] = useState(null)   /* { index, pos: 'above' | 'below' } */
  const clear = () => { setDragged(null); setOver(null) }
  const onDragStart = (i) => (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); setDragged(i) }
  const onDragOver = (i) => (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
    if (dragged == null || dragged === i) { setOver(null); return }
    const r = e.currentTarget.getBoundingClientRect()
    setOver({ index: i, pos: e.clientY - r.top < r.height / 2 ? 'above' : 'below' })
  }
  const onDrop = (i) => (e) => {
    e.preventDefault()
    if (dragged == null || dragged === i || !over) { clear(); return }
    let to = over.pos === 'above' ? i : i + 1
    if (dragged < to) to -= 1
    reorderStep(dragged, to)
    clear()
  }
  return (
    <ul className="flex flex-col gap-1">
      {steps.map((s, i) => {
        const mark = over?.index === i ? over.pos : null
        return (
          <li
            key={i}
            draggable={!readOnly}
            onDragStart={onDragStart(i)} onDragOver={onDragOver(i)} onDragLeave={() => setOver((o) => (o?.index === i ? null : o))} onDrop={onDrop(i)} onDragEnd={clear}
            className={`relative flex items-center gap-2 rounded px-2 py-1 ${editing === i ? 'bg-fg-08' : ''} ${dragged === i ? 'opacity-40' : ''}`}
          >
            {mark && <span aria-hidden="true" className={`absolute left-2 right-2 h-px bg-accent-primary ${mark === 'above' ? 'top-0' : 'bottom-0'}`} />}
            {!readOnly && <span className="text-meta cursor-grab shrink-0 touch-none" aria-label="Drag to reorder"><Icon name="drag-handle" size={12} /></span>}
            <button type="button" className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer" onClick={() => !readOnly && onEdit(i)} aria-label={`Edit step ${i + 1}`}>
              <span className="kol-helper-10 text-meta tabular-nums w-4 shrink-0">{i + 1}</span>
              <span className="kol-mono-12 text-emphasis truncate">{stepLabel(s, i)}</span>
            </button>
            {!readOnly && <Button tone="ghost" quiet size="sm" iconOnly="x" aria-label="Remove step" onClick={() => removeStep(i)} />}
          </li>
        )
      })}
      {!readOnly && (
        <li>
          {/* THE EMPTY SLOT — the next step's row, dashed, with the plus; pressing it opens the picker */}
          <button
            type="button"
            aria-label="Add a step"
            onClick={onAdd}
            className="flex items-center gap-2 w-full rounded px-2 py-1 border border-dashed border-oq-16 text-meta hover:text-body hover:border-oq-24 cursor-pointer"
          >
            <span className="kol-helper-10 tabular-nums w-4 shrink-0">{steps.length + 1}</span>
            <Icon name="plus" size={12} />
            <span className="kol-mono-12">Add a step</span>
          </button>
        </li>
      )}
    </ul>
  )
}
