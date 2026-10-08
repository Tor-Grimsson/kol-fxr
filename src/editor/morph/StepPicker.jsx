import { useMemo, useState } from 'react'
import { Button, ContentRow, EmptyState, FullscreenOverlay, SearchInput, SegmentedToggle } from '@kolkrabbi/kol-component'
import { PRESETS, isToolPreset, groupOfPreset, groupById, loopById, presetParams } from '../../loops/registry'
import { loadLibrary } from '../library/LibraryProvider'
import { loopSnapshot } from './buildMorph'
import { useMorph, setMorph, addStep, pickParams } from './morphStore'
import { useLabsLayer } from '../labs/useLabsLayer'

/**
 * StepPicker — the Morph rail's picker (plans 09 + 10): a modal over the page (the overlay's
 * `scrim`, the labs ruling of 2026-10-07), a search field, *From presets* grouped by generator and
 * *From my files*, plus *From the stage* while the stage holds a plain generator. A pick adds a
 * step; the first pick also puts that generator on the stage. In Blend mode the first step fixes
 * the generator (one schema to tween); Shape mode spans generators. Mounted once in labs.
 */
const DOORS = [
  { value: 'preset', label: 'From presets' },
  { value: 'file', label: 'From my files' },
]

/* the step a catalog preset makes */
function stepFromPreset(p) {
  const group = groupOfPreset(p.id)
  const schema = loopById(p.loop)?.params ?? []
  return { loopId: p.loop, loopGroup: group, presetId: p.id, presetLabel: p.label, params: pickParams(presetParams(p), schema), source: { kind: 'preset', id: p.id, label: p.label } }
}
/* the step a saved labs file makes — its one generator layer */
function stepFromFile(item, loopId) {
  const l = loopId ? loopSnapshot(item, loopId) : (item.layers ?? []).find((x) => x?.type === 'loop')
  if (!l) return null
  const schema = loopById(l.loopId)?.params ?? []
  return { loopId: l.loopId, loopGroup: l.loopGroup, presetId: l.presetId, presetLabel: l.presetLabel, params: pickParams(l, schema), source: { kind: 'file', id: item.id, label: item.name || 'Untitled' } }
}
/* the step the stage makes — the plain generator on it, as dialled */
function stepFromLayer(layer) {
  const schema = loopById(layer.loopId)?.params ?? []
  return { loopId: layer.loopId, loopGroup: layer.loopGroup, presetId: layer.presetId, presetLabel: layer.presetLabel, params: pickParams(layer, schema), source: { kind: 'stage', label: layer.presetLabel || 'Stage' } }
}

export default function StepPicker() {
  const morph = useMorph()
  const { layer, setOnly } = useLabsLayer()
  const open = !!morph.picker
  const door = morph.picker === 'file' ? 'file' : 'preset'
  const only = morph.mode === 'blend' ? morph.loopId : null
  const [q, setQ] = useState('')

  const presets = useMemo(() => PRESETS.filter((p) => !isToolPreset(p) && (!only || p.loop === only)), [only])
  const files = useMemo(() => (open ? (loadLibrary().preset ?? []).filter((it) => it.mode !== 'morph' && (only ? loopSnapshot(it, only) : (it.layers ?? []).some((x) => x?.type === 'loop'))) : []), [open, only])

  if (!open) return null
  const needle = q.trim().toLowerCase()
  const hit = (s) => !needle || String(s).toLowerCase().includes(needle)
  /* presets in catalog order, one heading per generator */
  const groups = []
  for (const p of presets) {
    const label = groupById(groupOfPreset(p.id))?.label ?? p.loop
    if (!hit(p.label) && !hit(label)) continue
    let g = groups[groups.length - 1]
    if (!g || g.label !== label) { g = { label, rows: [] }; groups.push(g) }
    g.rows.push(p)
  }
  const shownFiles = files.filter((it) => hit(it.name || 'Untitled'))
  /* the stage is a plain generator with fewer than two steps, or the step being edited */
  const stageOk = layer?.type === 'loop' && (morph.steps.length < 2 || morph.editing != null)

  const close = () => { setMorph({ picker: null }); setQ('') }
  const pick = (step) => {
    if (!step) return
    /* the first step puts the generator on the stage; later ones only join the list */
    if (morph.steps.length === 0) setOnly('loop', { loopGroup: step.loopGroup, presetId: step.presetId, presetLabel: step.presetLabel, loopId: step.loopId, ...step.params })
    addStep(step)
    close()
  }
  const nothing = needle && (door === 'preset' ? groups.length === 0 : shownFiles.length === 0)

  return (
    <FullscreenOverlay open={open} scrim onClose={close}>
      <div className="kol-step-picker flex flex-col gap-4" style={{ minWidth: 'min(640px, 90vw)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="kol-eyebrow text-meta">Morph · add a step</span>
          <span className="ms-auto flex items-center gap-2">
            {stageOk && <Button tone="grey" size="sm" onClick={() => pick(stepFromLayer(layer))}>From the stage</Button>}
            <SegmentedToggle value={door} onChange={(v) => setMorph({ picker: v })} options={DOORS} size="sm" />
          </span>
        </div>
        <SearchInput size="sm" value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ('')} placeholder="Search" autoFocus />
        {door === 'file' && files.length === 0 ? (
          <EmptyState eyebrow="Morph" title={only ? 'No saved files of this generator' : 'No saved labs files yet'} body="Save a labs file first, or add a step from the presets." />
        ) : (
          <ul className="flex flex-col" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {door === 'preset'
              ? groups.map((g) => (
                <li key={g.label} className="flex flex-col">
                  <p className="kol-eyebrow text-meta pt-3 pb-1">{g.label}</p>
                  <ul className="flex flex-col">
                    {g.rows.map((p) => (
                      <li key={p.id}><ContentRow variant="default" media={false} title={p.label} onClick={() => pick(stepFromPreset(p))} /></li>
                    ))}
                  </ul>
                </li>
              ))
              : shownFiles.map((it) => (
                <li key={it.id}><ContentRow variant="default" media={false} title={it.name || 'Untitled'} onClick={() => pick(stepFromFile(it, only))} /></li>
              ))}
            {nothing && <li><p className="kol-mono-12 text-meta pt-3">Nothing matches “{q}”.</p></li>}
          </ul>
        )}
      </div>
    </FullscreenOverlay>
  )
}
