import { useMemo, useState } from 'react'
import { Button, ColorPickerPopover, Dropdown, Stepper } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { ROLES, RELATIONS, generatePalette, assignRoles, contrast, oklchToHex, resolvePalette, allPalettes } from './palette'
import { mulberry32, randomSeed } from '../lib/rng'
import { useControlSize } from '../params/controlSize'
import { useComposeState } from '../compose/state'
import { findLayerDeep } from '../compose/helpers'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { loopById } from '../../loops/registry'

/**
 * PaletteBody — the body of the Color Modes window (`ColorModesWindow`, plan 39 § 4.1; it was the colour
 * pane's Palette tab in plan 37). ONE COLOUR GENERATES THE PALETTE (plan 41 § 6.2, the Adobe Color
 * model): a base colour, a relationship and a count (2–8) make the list (`generatePalette`, OKLCH);
 * Roll re-rolls around the same base. Roles are assigned AFTER, by meaning (`assignRoles`: the darkest
 * is Background, the lightest Ink, the most saturated Accent), so Apply to layer / Apply to document
 * read the same role mapping as before. Per colour (§ 6.3): its swatch opens the picker to edit it,
 * lock keeps it on Roll, delete drops it. Load palette and Save as before; a loaded theme keeps its
 * authored roles until the list is changed.
 *
 * The old five-fixed-slot body is retired to `_tmp/2026-10-27-palettebody-five-slots/`.
 */
const ROLE_LABELS = { bg: 'Background', fg: 'Ink', accent: 'Accent', dim: 'Dim', warm: 'Warm' }
/* the document palette's slots (Primary · Secondary · Light · Dark · Accent · BG) each take the role
   that means the same thing; Light has no role and keeps its colour */
const DOC_SLOT_ROLE = { 0: 'fg', 1: 'warm', 3: 'dim', 4: 'accent', 5: 'bg' }

const hex6 = (h) => h.slice(0, 7).toLowerCase()

export function PaletteBody() {
  const cs = useControlSize()
  const { layers, selectedId, updateLayer, setColorAt } = useComposeState()
  const { library, addItem } = useGeneratorLibrary()
  const [relation, setRelation] = useState('analogous')
  /* the seed changes on Roll only — a base drag or a count step regenerates around the same roll */
  const [seed, setSeed] = useState(randomSeed)
  const [base, setBase] = useState(() => oklchToHex(0.62, 0.14, Math.random() * 360))
  const [items, setItems] = useState(() => generatePalette(mulberry32(seed), { base, relation, count: 5 }).map((hex) => ({ hex, locked: false })))
  /* a loaded palette: its name and authored roles, until the list is changed */
  const [loaded, setLoaded] = useState(null)
  const saved = useMemo(() => allPalettes(library), [library])

  /* regenerate from the inputs; a locked colour keeps its place */
  const regen = ({ b = base, rel = relation, n = items.length, s = seed } = {}) => {
    const next = generatePalette(mulberry32(s), { base: b, relation: rel, count: n })
    setItems((prev) => next.map((hex, i) => (prev[i]?.locked ? prev[i] : { hex, locked: false })))
    setLoaded(null)
  }
  const roll = () => { const s = randomSeed(); setSeed(s); regen({ s }) }
  const changeBase = (h) => { const b = hex6(h); setBase(b); regen({ b }) }
  const changeRelation = (rel) => { setRelation(rel); regen({ rel }) }
  const changeCount = (v) => { const n = Number(v); if (Number.isInteger(n) && n >= 2 && n <= 8) regen({ n }) }
  const edit = (i, h) => { setItems((prev) => prev.map((x, j) => (j === i ? { ...x, hex: hex6(h) } : x))); setLoaded(null) }
  const toggleLock = (i) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, locked: !x.locked } : x)))
  const remove = (i) => { setItems((prev) => prev.filter((_, j) => j !== i)); setLoaded(null) }
  const load = (id) => {
    const p = saved.find((x) => x.id === id)
    if (!p) return
    const colors = p.colors.slice(0, 8)
    setItems((colors.length >= 2 ? colors : [...colors, ...colors]).map((hex) => ({ hex: hex6(hex), locked: false })))
    setLoaded({ name: p.name, roles: p.colors.length <= 8 ? p.roles : null })
  }

  const colors = items.map((x) => x.hex)
  const roles = loaded?.roles ?? assignRoles(colors)
  const relLabel = RELATIONS.find((x) => x.id === relation)?.label ?? 'Palette'
  const palette = { name: loaded?.name ?? relLabel, relation, colors, roles }
  const rolesOf = (hex) => ROLES.filter((r) => roles[r]?.toLowerCase() === hex).map((r) => ROLE_LABELS[r]).join(', ')

  /* the selected generator takes the palette: roles by role, the rest in turn */
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const schema = layer?.type === 'loop' ? loopById(layer.loopId)?.params : null
  const apply = () => {
    if (!layer || !schema) return
    const next = resolvePalette(layer, schema, palette, { rotate: true })
    const patch = Object.fromEntries(schema.filter((p) => p.type === 'color').map((p) => [p.key, next[p.key]]))
    updateLayer(layer.id, patch)
  }
  const applyDocument = () => Object.entries(DOC_SLOT_ROLE).forEach(([i, r]) => setColorAt(Number(i), roles[r]))

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ColorPickerPopover color={base.toUpperCase()} onChange={changeBase} size="sm" label="Base" />
        <span className="kol-helper-10 uppercase text-meta">Base</span>
        <span className="kol-mono-10 text-meta flex-1">{base.toUpperCase()}</span>
        <span className="kol-helper-10 uppercase text-meta">Colors</span>
        <Stepper size={cs} min={2} max={8} value={items.length} onChange={(e) => changeCount(e.target.value)} className="w-16" aria-label="Colors" />
      </div>

      <div className="flex items-center gap-2">
        <Dropdown className="flex-1 min-w-0" size={cs} aria-label="Relationship"
          options={RELATIONS.map((r) => ({ value: r.id, label: r.label }))} value={relation} onChange={changeRelation} />
        <Button tone="grey" size={cs} onClick={roll}>Roll</Button>
      </div>

      <div className="flex flex-col gap-1">
        {items.map((x, i) => (
          <div key={i} className="flex items-center gap-2">
            <ColorPickerPopover color={x.hex.toUpperCase()} onChange={(h) => edit(i, h)} size="sm" label={`Color ${i + 1}`} />
            <span className="kol-helper-10 uppercase text-meta flex-1 truncate">{rolesOf(x.hex)}</span>
            <span className="kol-mono-10 text-meta">{x.hex.toUpperCase()}</span>
            <Button tone="ghost" quiet size="sm" iconOnly={x.locked ? 'lock' : 'unlock'} aria-label={`${x.locked ? 'Unlock' : 'Lock'} color ${i + 1}`} pressed={x.locked} onClick={() => toggleLock(i)} />
            <Button tone="ghost" quiet size="sm" iconOnly="trash" aria-label={`Delete color ${i + 1}`} disabled={items.length <= 2} onClick={() => remove(i)} />
          </div>
        ))}
      </div>
      {contrast(roles.bg, roles.fg) < 4.5 && (
        <span className="kol-helper-10 text-meta inline-flex items-center gap-1"><Icon name="info" size={12} />Ink on background is under 4.5:1</span>
      )}

      <Dropdown size={cs} aria-label="Load palette" value=""
        options={[{ value: '', label: 'Load palette…' }, ...saved.map((p) => ({ value: p.id, label: p.name }))]} onChange={(v) => v && load(v)} />

      <Button tone="grey" size={cs} onClick={() => addItem('palette', { name: palette.name, colors })}>Save</Button>
      <div className="flex gap-2">
        <Button tone="grey" size={cs} className="flex-1" disabled={!schema} onClick={apply}>Apply to layer</Button>
        <Button tone="grey" size={cs} className="flex-1" onClick={applyDocument}>Apply to document</Button>
      </div>
    </div>
  )
}
