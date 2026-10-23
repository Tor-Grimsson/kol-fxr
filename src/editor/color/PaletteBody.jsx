import { useMemo, useState } from 'react'
import { Button, ColorSwatch, Dropdown } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { ROLES, RELATIONS, rollPalette, resolvePalette, allPalettes } from './palette'
import { mulberry32, randomSeed } from '../lib/rng'
import { useControlSize } from '../params/controlSize'
import { useColorTarget } from './useColorTarget'
import { useComposeState } from '../compose/state'
import { findLayerDeep } from '../compose/helpers'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { loopById } from '../../loops/registry'

/**
 * PaletteBody — the body of the Color Modes window (`ColorModesWindow`, plan 39 § 4.1; it was the colour
 * pane's Palette tab in plan 37). One palette on the W5 engine (`palette.js`, kol-component's
 * harmonies under a seeded roll, generated in OKLCH): pick a relationship, roll, lock the roles you
 * keep, load any saved palette (themes · swatches · library), save it to the library, apply it to the
 * selected generator or to the document palette. A role swatch pressed paints the active color
 * target, the same as Swatches.
 */
const ROLE_LABELS = { bg: 'Background', fg: 'Ink', accent: 'Accent', dim: 'Dim', warm: 'Warm' }
/* the document palette's slots (Primary · Secondary · Light · Dark · Accent · BG) each take the role
   that means the same thing; Light has no role and keeps its colour */
const DOC_SLOT_ROLE = { 0: 'fg', 1: 'warm', 3: 'dim', 4: 'accent', 5: 'bg' }

export function PaletteBody() {
  const cs = useControlSize()
  const target = useColorTarget()
  const { layers, selectedId, updateLayer, setColorAt } = useComposeState()
  const { library, addItem } = useGeneratorLibrary()
  const [relation, setRelation] = useState('analogous')
  const [palette, setPalette] = useState(() => rollPalette(mulberry32(randomSeed()), 'analogous'))
  const [locks, setLocks] = useState(() => new Set())
  const saved = useMemo(() => allPalettes(library), [library])

  const roll = () => {
    const next = rollPalette(mulberry32(randomSeed()), relation)
    const roles = Object.fromEntries(ROLES.map((r) => [r, locks.has(r) ? palette.roles[r] : next.roles[r]]))
    setPalette({ ...next, roles, colors: ROLES.map((r) => roles[r]) })
  }
  const load = (id) => {
    const p = saved.find((x) => x.id === id)
    if (p) { setPalette(p); setLocks(new Set()) }
  }
  const toggleLock = (r) => setLocks((s) => { const n = new Set(s); n.has(r) ? n.delete(r) : n.add(r); return n })

  /* the selected generator takes the palette: roles by role, the rest in turn */
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const schema = layer?.type === 'loop' ? loopById(layer.loopId)?.params : null
  const apply = () => {
    if (!layer || !schema) return
    const next = resolvePalette(layer, schema, palette, { rotate: true })
    const patch = Object.fromEntries(schema.filter((p) => p.type === 'color').map((p) => [p.key, next[p.key]]))
    updateLayer(layer.id, patch)
  }
  const applyDocument = () => Object.entries(DOC_SLOT_ROLE).forEach(([i, r]) => setColorAt(Number(i), palette.roles[r]))

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Dropdown className="flex-1 min-w-0" size={cs} tone="sunken" aria-label="Relationship"
          options={RELATIONS.map((r) => ({ value: r.id, label: r.label }))} value={relation} onChange={setRelation} />
        <Button tone="grey" size={cs} onClick={roll}>Roll</Button>
      </div>

      <div className="flex flex-col gap-1">
        {ROLES.map((r) => (
          <div key={r} className="flex items-center gap-2">
            <ColorSwatch hex={palette.roles[r]} size="control-sm" title={palette.roles[r]} onClick={() => target.onChange(palette.roles[r].toUpperCase())} />
            <span className="kol-helper-10 uppercase text-meta flex-1">{ROLE_LABELS[r]}</span>
            <span className="kol-mono-10 text-meta">{palette.roles[r].toUpperCase()}</span>
            <Button tone="ghost" quiet size="sm" iconOnly={locks.has(r) ? 'lock' : 'unlock'} aria-label={`${locks.has(r) ? 'Unlock' : 'Lock'} ${ROLE_LABELS[r]}`} pressed={locks.has(r)} onClick={() => toggleLock(r)} />
          </div>
        ))}
      </div>
      {palette.contrastOk === false && (
        <span className="kol-helper-10 text-meta inline-flex items-center gap-1"><Icon name="info" size={12} />Ink on background is under 4.5:1</span>
      )}

      <Dropdown size={cs} tone="sunken" aria-label="Load palette" value=""
        options={[{ value: '', label: 'Load palette…' }, ...saved.map((p) => ({ value: p.id, label: p.name }))]} onChange={(v) => v && load(v)} />

      <Button tone="grey" size={cs} onClick={() => addItem('palette', { name: palette.name === 'Rolled' ? `${RELATIONS.find((x) => x.id === palette.relation)?.label ?? 'Palette'}` : palette.name, colors: palette.colors })}>Save</Button>
      <div className="flex gap-2">
        <Button tone="grey" size={cs} className="flex-1" disabled={!schema} onClick={apply}>Apply to layer</Button>
        <Button tone="grey" size={cs} className="flex-1" onClick={applyDocument}>Apply to document</Button>
      </div>
    </div>
  )
}
