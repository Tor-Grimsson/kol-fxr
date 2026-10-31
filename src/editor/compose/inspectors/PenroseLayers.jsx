import { LabeledControlSection, Slider, StepList } from '@kolkrabbi/kol-component'
import { useControlSize } from '../../params/controlSize'
import { rolesOf, useRolesVersion } from '../../../loops/penrose/roles'

/**
 * LAYERS (plan 49 4.3, user 2026-10-31: "we really need to be able to drill into layers? … in Style after the sliders a
 * section called LAYERS, and just a number + show/hide and a opacity slider" · "adding color here does nothing … why do
 * you add color here?"). A Penrose sim draws in up to four roles over its background — foreground, accent, dim, warm —
 * and most draw only some. This lists the ones the running sim has actually drawn (penrose/roles.js), each a numbered
 * layer: its colour, show/hide, and the role's opacity (the 0–5 booster the Color section used to list for all four).
 * Hide is opacity 0; show gives back the value it had.
 */
const ROLES = [
  { role: 'fg', label: 'Foreground' },
  { role: 'accent', label: 'Accent' },
  { role: 'dim', label: 'Dim' },
  { role: 'warm', label: 'Warm' },
]
const DEFAULT_OPACITY = { fg: 1, accent: 1, dim: 5, warm: 1 }

export default function PenroseLayers({ layer, setProp, patch }) {
  const cs = useControlSize()
  useRolesVersion()
  const used = rolesOf(layer.loopId)
  const rows = ROLES.filter((r) => used?.has(r.role))
  if (!rows.length) return null
  const prev = layer._layerPrev ?? {}
  return (
    <LabeledControlSection label="Layers" divided>
      {/* KOL StepList with row slots (kol-component 0.330, the ItemList ticket — plan 51 4.3) */}
      <StepList
        size={cs}
        items={rows.map(({ role, label }) => {
          const key = `${role}Opacity`
          const v = Number(layer[key] ?? DEFAULT_OPACITY[role])
          return {
            id: role, label, swatch: layer[role] ?? null, shown: v > 0,
            control: <Slider min={0} max={5} step={0.1} value={v} onChange={(n) => setProp(key, n)} formatValue={(n) => n.toFixed(1)} displayWidth={3} readoutPreset="rail" className="w-full min-w-0" aria-label={`${label} opacity`} />,
          }
        })}
        onToggleShown={(i) => {
          const { role } = rows[i]
          const key = `${role}Opacity`
          const v = Number(layer[key] ?? DEFAULT_OPACITY[role])
          if (v > 0) patch({ [key]: 0, _layerPrev: { ...prev, [role]: v } })
          else patch({ [key]: prev[role] || DEFAULT_OPACITY[role] })
        }}
      />
    </LabeledControlSection>
  )
}
