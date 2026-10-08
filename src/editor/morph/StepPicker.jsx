import { useMemo, useState } from 'react'
import { ShellSearchOverlay } from '@kolkrabbi/kol-component'
import { PRESETS, isToolPreset, groupOfPreset, groupById, loopById, presetParams } from '../../loops/registry'
import { loadLibrary } from '../library/LibraryProvider'
import { loopSnapshot } from './buildMorph'
import { useMorph, setMorph, addStep, pickParams } from './morphStore'
import { useLabsLayer } from '../labs/useLabsLayer'

/**
 * StepPicker — the Morph rail's picker on `ShellSearchOverlay`, the DS search modal (plan 13; the
 * user: *"USE THE ASSETS AVAILABLE … we dont need 3 views and a filter system, we just need to make
 * the picker WORK"*). A field, rows grouped by generator, ↑ ↓ Enter, Escape — all the overlay's.
 *
 * Rows, in order: *Current stage* (the generator on the stage as dialled, while it can be a step),
 * *My files* (saved labs files — randomiser rolls save as labs), then every catalog preset under its
 * generator. In Blend mode after a first step only that generator is listed (one schema to tween).
 * Ids are prefixed (`stage` · `file:` · `preset:`) — a file id and a preset id can collide.
 *
 * The overlay closes itself after a pick (`onSelect`, then `onClose`), so `onSelect` only adds the
 * step and `onClose` alone clears `morph.picker`. The first step also puts its generator on the stage.
 * The browse-panel version it replaces is in `_tmp/2026-10-08-step-picker-browse/`.
 */
function stepFromPreset(p) {
  const group = groupOfPreset(p.id)
  const schema = loopById(p.loop)?.params ?? []
  return { loopId: p.loop, loopGroup: group, presetId: p.id, presetLabel: p.label, params: pickParams(presetParams(p), schema), source: { kind: 'preset', id: p.id, label: p.label } }
}
function stepFromFile(item, loopId) {
  const l = loopId ? loopSnapshot(item, loopId) : (item.layers ?? []).find((x) => x?.type === 'loop')
  if (!l) return null
  const schema = loopById(l.loopId)?.params ?? []
  return { loopId: l.loopId, loopGroup: l.loopGroup, presetId: l.presetId, presetLabel: l.presetLabel, params: pickParams(l, schema), source: { kind: 'file', id: item.id, label: item.name || 'Untitled' } }
}
function stepFromLayer(layer) {
  const schema = loopById(layer.loopId)?.params ?? []
  return { loopId: layer.loopId, loopGroup: layer.loopGroup, presetId: layer.presetId, presetLabel: layer.presetLabel, params: pickParams(layer, schema), source: { kind: 'stage', label: layer.presetLabel || 'Stage' } }
}

export default function StepPicker() {
  const morph = useMorph()
  const { layer, setOnly } = useLabsLayer()
  const open = !!morph.picker
  const only = morph.mode === 'blend' ? morph.loopId : null
  const [query, setQuery] = useState('')
  /* the stage is a plain generator with fewer than two steps, or the step being edited */
  const stageOk = layer?.type === 'loop' && (morph.steps.length < 2 || morph.editing != null)

  /* every row, and the step each one makes */
  const { rows, make } = useMemo(() => {
    const rows = [], make = new Map()
    if (!open) return { rows, make }
    if (stageOk && (!only || layer.loopId === only)) {
      rows.push({ id: 'stage', label: layer.presetLabel || 'Current stage', group: 'Current stage', hint: groupById(layer.loopGroup)?.label })
      make.set('stage', () => stepFromLayer(layer))
    }
    for (const it of loadLibrary().preset ?? []) {
      if (it.mode === 'morph' || !(only ? loopSnapshot(it, only) : (it.layers ?? []).some((x) => x?.type === 'loop'))) continue
      const id = `file:${it.id}`
      rows.push({ id, label: it.name || 'Untitled', group: 'My files' })
      make.set(id, () => stepFromFile(it, only))
    }
    for (const p of PRESETS) {
      if (isToolPreset(p) || (only && p.loop !== only)) continue
      const id = `preset:${p.id}`
      rows.push({ id, label: p.label, group: groupById(groupOfPreset(p.id))?.label ?? p.loop, hint: p.sub })
      make.set(id, () => stepFromPreset(p))
    }
    return { rows, make }
  }, [open, only, stageOk, layer])

  if (!open) return null
  const needle = query.trim().toLowerCase()
  const results = needle ? rows.filter((r) => [r.label, r.group, r.hint].some((s) => s && s.toLowerCase().includes(needle))) : []

  const onSelect = (row) => {
    const step = make.get(row.id)?.()
    if (!step) return
    if (morph.steps.length === 0) setOnly('loop', { loopGroup: step.loopGroup, presetId: step.presetId, presetLabel: step.presetLabel, loopId: step.loopId, ...step.params })
    addStep(step)
  }
  const onClose = () => { setMorph({ picker: null }); setQuery('') }

  return (
    <ShellSearchOverlay
      open
      onClose={onClose}
      suggestions={rows}
      results={results}
      query={query}
      onQueryChange={setQuery}
      onSelect={onSelect}
      placeholder="Search presets and files"
      selectLabel="Add step"
    />
  )
}
