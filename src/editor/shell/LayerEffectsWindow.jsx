import { useEffect, useState } from 'react'
import { Button, CloseButton, FullscreenOverlay, Stepper, ToggleCheckbox, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { findLayerDeep } from '../compose/helpers'
import { useLayerEdit } from '../compose/useLayerEdit'
import AutoControls from '../params/AutoControls'
import { LAYER_EFFECTS, layerEffectsOf, makeEffect } from '../compose/layerEffects'

/**
 * LAYER EFFECTS — the window the Layers bar's FX button opens (plan 32 § 2; Affinity's, the user's
 * references 2026-10-13, element by element): the ten effects listed always, each with its on/off;
 * `+ ×` on the five that stack; the selected row's controls on the right (the same `AutoControls`
 * the Effects tab draws a stage with); ▲▼ reorder the selected instance among its own kind; Scale
 * with Object; Fill Opacity; Close. Every edit is live and undoable — there is no OK / Cancel.
 *
 * Opened by `kol:open-layer-effects` (the FX button, Layer › Layer Effects…) for the selected layer.
 */
export default function LayerEffectsWindow() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setOpen(true)
    window.addEventListener('kol:open-layer-effects', on)
    return () => window.removeEventListener('kol:open-layer-effects', on)
  }, [])
  const { selectedId, layers, palette } = useComposeState()
  const layer = open && selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  if (!layer) return null
  return <Window key={layer.id} layer={layer} palette={palette} onClose={() => setOpen(false)} />
}

function Window({ layer, palette, onClose }) {
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const effects = layerEffectsOf(layer)
  const [sel, setSel] = useState(LAYER_EFFECTS[0].id)  /* an instance key, or a type id for a row with none */
  const write = (next) => edit.patch({ effects: next })

  /* the rows: every type, in Affinity's order; a type with instances shows each, one with none shows
     one empty row that an edit or its circle brings to life */
  const rows = LAYER_EFFECTS.flatMap((def) => {
    const inst = effects.filter((e) => e.id === def.id)
    return inst.length ? inst.map((e) => ({ def, e })) : [{ def, e: null }]
  })
  const row = rows.find((r) => (r.e ? r.e.key === sel : r.def.id === sel)) ?? rows[0]

  const ensure = (r, enabled) => {
    if (r.e) return r.e
    const e = makeEffect(r.def.id, enabled)
    write([...effects, e])
    setSel(e.key)
    return e
  }
  const toggle = (r) => {
    if (!r.e) { ensure(r, true); return }
    write(effects.map((e) => (e.key === r.e.key ? { ...e, enabled: e.enabled === false } : e)))
  }
  const add = (r) => {
    const e = makeEffect(r.def.id, true)
    const at = r.e ? effects.indexOf(r.e) + 1 : effects.length
    write([...effects.slice(0, at), e, ...effects.slice(at)])
    setSel(e.key)
  }
  const remove = (r) => {
    if (!r.e) return
    write(effects.filter((e) => e.key !== r.e.key))
    setSel(r.def.id)
  }
  /* ▲▼ — the selected instance against the neighbouring one of its own kind (the stack composes in a
     fixed order by kind, so only same-kind order means anything) */
  const move = (dir) => {
    if (!row.e) return
    const same = effects.filter((e) => e.id === row.e.id)
    const i = same.indexOf(row.e), j = i + dir
    if (j < 0 || j >= same.length) return
    const a = effects.indexOf(same[i]), b = effects.indexOf(same[j])
    const next = [...effects]; [next[a], next[b]] = [next[b], next[a]]
    write(next)
  }
  const setParam = (k, v) => {
    const e = row.e ?? ensure(row, true)
    const base = row.e ? effects : [...effects, e]
    write(base.map((x) => (x.key === e.key ? { ...x, enabled: true, params: { ...x.params, [k]: v } } : x)))
  }
  const params = { ...Object.fromEntries(row.def.params.map((p) => [p.key, p.default])), ...(row.e?.params ?? {}) }
  const sameKind = row.e ? effects.filter((e) => e.id === row.e.id) : []
  const fill = Math.round((layer.effectsFillOpacity ?? 1) * 100)

  /* `scrim`: the canvas stays visible under the window, so every edit is seen live (Affinity's) */
  return (
    <FullscreenOverlay open onClose={onClose} closeButton={false} scrim>
      {/* keep-selection: the overlay portals to <body>, outside the shell, and the canvas's click-away
          would otherwise deselect the very layer this window edits */}
      <div aria-label="Layer Effects" data-editor-keep-selection className="kol-design-editor kol-popover w-[820px] max-w-full flex flex-col">
        <div className="relative flex h-10 items-center justify-center border-b border-oq-08 px-4">
          <span className="font-sans text-[13px] text-emphasis">Layer Effects</span>
          <CloseButton onClick={onClose} size="sm" className="!absolute right-3" />
        </div>

        <div className="grid grid-cols-[280px_1fr] h-[540px] max-h-[70vh]">
          {/* the list */}
          <div className="flex flex-col border-r border-oq-08 bg-surface-tertiary min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto p-1 flex flex-col gap-px" role="listbox" aria-label="Effects">
              {rows.map((r) => {
                const id = r.e ? r.e.key : r.def.id
                const on = !!r.e && r.e.enabled !== false
                const active = row === r
                return (
                  <div key={id} role="option" aria-selected={active} onClick={() => setSel(id)}
                    /* the selected row is the DS row-browser's selection (`oq-08`) — Affinity's blue is its accent;
                       ours has none, and the ink carries the difference */
                    className={`flex items-center gap-2 h-9 px-2 rounded-sm cursor-pointer font-sans text-[13px] ${active ? 'bg-oq-16 text-emphasis' : 'bg-surface-primary text-body hover:text-emphasis'}`}>
                    <span onClick={(ev) => ev.stopPropagation()} aria-label={`${r.def.label} on`} className="inline-flex">
                      <ToggleCheckbox checked={on} onChange={() => toggle(r)} />
                    </span>
                    <span className="flex-1 truncate">{r.def.label}</span>
                    {r.def.stack && (
                      <span className="flex items-center" onClick={(ev) => ev.stopPropagation()}>
                        <Tooltip label={`Add ${r.def.label}`}><Button tone="ghost" quiet size="xs" iconOnly="plus" aria-label={`Add ${r.def.label}`} onClick={() => add(r)} /></Tooltip>
                        <Tooltip label={`Remove ${r.def.label}`}><Button tone="ghost" quiet size="xs" iconOnly="x" aria-label={`Remove ${r.def.label}`} disabled={!r.e} onClick={() => remove(r)} /></Tooltip>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-1 p-2 border-t border-oq-08">
              <Tooltip label="Move up"><Button tone="ghost" quiet size="sm" iconOnly="chevron-up" aria-label="Move up" disabled={!row.e || sameKind.indexOf(row.e) <= 0} onClick={() => move(-1)} /></Tooltip>
              <Tooltip label="Move down"><Button tone="ghost" quiet size="sm" iconOnly="chevron-down" aria-label="Move down" disabled={!row.e || sameKind.indexOf(row.e) >= sameKind.length - 1} onClick={() => move(1)} /></Tooltip>
            </div>
          </div>

          {/* the selected effect's controls */}
          <div className="min-h-0 overflow-y-auto p-5">
            <AutoControls schema={row.def.params} layer={params} setProp={setParam} palette={palette} />
          </div>
        </div>

        <div className="flex items-center gap-4 h-14 px-4 border-t border-oq-08">
          <ToggleCheckbox label="Scale with Object" checked={!!layer.effectsRefW} className="font-sans text-[13px]"
            onChange={(v) => edit.patch({ effectsRefW: v ? (layer.w ?? null) : null })} />
          <span className="flex-1" />
          <span className="font-sans text-[13px] text-emphasis">Fill Opacity</span>
          <Stepper size="sm" min={0} max={100} value={fill} onChange={(v) => edit.patch({ effectsFillOpacity: Math.max(0, Math.min(100, v)) / 100 })} className="w-[72px]" aria-label="Fill opacity" />
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </FullscreenOverlay>
  )
}

