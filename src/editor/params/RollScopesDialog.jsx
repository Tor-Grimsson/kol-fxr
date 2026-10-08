import { Button, FullscreenOverlay, LabeledControlSection, SettingsRow, ToggleSwitch } from '@kolkrabbi/kol-component'
import { useAppSettings, setAppSetting } from '../lib/appSettings'
import { deriveScopes, rollScopeOn, setRollScope, rollEffectsOn } from './rolls'

/**
 * RollScopesDialog — what Randomize all touches (plan 18 § 3). One switch per scope the layer on
 * stage has (its schema's sections, Color standing in for the color params) and one for the effect
 * chain; an app setting, so every Randomize all — the phone's row and tab, labs' rail, the editor's
 * inspector — obeys. A scope switched off here is still rollable by its own strip cell.
 *
 * @param {boolean} open
 * @param {Function} onClose
 * @param {Object[]} schema   the layer's generator schema
 * @param {Object} layer
 * @param {'sm'|'md'|'lg'} [size]
 */
export default function RollScopesDialog({ open, onClose, schema, layer, size = 'md' }) {
  useAppSettings()   /* re-render on a switch */
  if (!open) return null
  const scopes = deriveScopes(schema ?? [], layer)
  return (
    <FullscreenOverlay open scrim onClose={onClose}>
      <div className="kol-roll-scopes flex flex-col gap-4 p-5 rounded bg-surface-primary border border-oq-08" style={{ width: 'min(420px, calc(100vw - 32px))' }}>
        <p className="kol-eyebrow text-fg-96">Randomize all rolls</p>
        <LabeledControlSection divided>
          {scopes.map((s) => (
            <SettingsRow key={s.id} label={s.label}>
              <ToggleSwitch checked={rollScopeOn(s.id)} onChange={(v) => setRollScope(s.id, v)} aria-label={s.label} />
            </SettingsRow>
          ))}
          <SettingsRow label="Effects">
            <ToggleSwitch checked={rollEffectsOn()} onChange={(v) => setAppSetting('rollEffects', !!v)} aria-label="Effects" />
          </SettingsRow>
        </LabeledControlSection>
        <p className="kol-mono-12 text-meta">A scope switched off still rolls from its own button.</p>
        <Button tone="primary" size={size} className="w-full" onClick={onClose}>Done</Button>
      </div>
    </FullscreenOverlay>
  )
}
