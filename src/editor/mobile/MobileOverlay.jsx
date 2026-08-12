import { useState } from 'react'
import { Button, SegmentedToggle } from '@kolkrabbi/kol-component'
import EditorIcon from '../icons/EditorIcon'
import TransportBar from '../params/TransportBar'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { transport } from '../params/transport'
import { groupById, loopById, presetsInGroup, presetLayerPatch, isToolPreset } from '../../loops/registry'
import CategoryScreen from './CategoryScreen'
import { deriveScopes, allScopeParams, computeRoll, useRollSeed } from '../params/rolls'
import { mulberry32 } from '../lib/rng'

/**
 * MobileOverlay — one SEE-THROUGH floating modal (35% surface veil, no
 * borders anywhere), content split into SegmentedToggle tabs so only one
 * concern shows at a time:
 *
 *   Generate  — preset ⚄ / generator switch, then the inspector's roll block
 *   Transport — the established `TransportBar`, verbatim (▶ ❚❚ · Loop/N s · ■ ◀◀)
 *   Output    — download / hide UI / start over
 *
 * Header = title, tap collapses. Collapsed = the open pill + a bare
 * "Randomize all" beside it (roll without opening). "Hide UI" blanks
 * everything for screen-recording; tap anywhere brings it back.
 *
 * Rolls skip the desktop's motion/look dropdown-to-Custom bookkeeping — the
 * mobile doc is ephemeral and those dropdowns never render on it.
 */

const PANEL_STYLE = {
  background: 'var(--kol-surface-primary)',
}

const TABS_LOOP  = [
  { value: 'generate',  label: 'Generate' },
  { value: 'transport', label: 'Transport' },
  { value: 'output',    label: 'Output' },
]
const TABS_MEDIA = TABS_LOOP.filter((t) => t.value !== 'generate')

/* All export-spec aspects (shell/aspects ids, portrait → landscape) + Fill
 * (display-side cover; the composition keeps its aspect). Two rows of 4 —
 * eight cells in one track don't fit a phone width. */
const ASPECT_ROW_1 = [
  { value: '9:16', label: '9:16' },
  { value: '3:5',  label: '3:5' },
  { value: '4:5',  label: '4:5' },
  { value: '1:1',  label: '1:1' },
]
const ASPECT_ROW_2 = [
  { value: '5:4',  label: '5:4' },
  { value: '5:3',  label: '5:3' },
  { value: '16:9', label: '16:9' },
  { value: 'fill', label: 'Fill' },
]

export default function MobileOverlay({ layer, onSwitchCategory, onInsert, onRestart, aspectValue, onAspect }) {
  const { updateLayer } = useComposeState()
  const { onExportPng } = useComposeFile()
  const [uiHidden, setUiHidden] = useState(false)
  const [open, setOpen] = useState(true)
  const [showCats, setShowCats] = useState(false)
  const [tab, setTab] = useState('generate')
  const seed = useRollSeed(layer)

  if (!layer) return null

  /* Screen-record mode: everything gone, one invisible tap-catcher back. */
  if (uiHidden) {
    return <button aria-label="Show controls" className="fixed inset-0 z-20" onClick={() => setUiHidden(false)} />
  }

  const isLoop = layer.type === 'loop'
  const title = isLoop
    ? `${groupById(layer.loopGroup).label} · ${layer.presetLabel}`
    : 'Media'

  const schema = isLoop ? (loopById(layer.loopId)?.params ?? []) : []
  const scopes = isLoop ? deriveScopes(schema, layer) : []

  const rollAll = () =>
    updateLayer(layer.id, computeRoll(layer, allScopeParams(schema, layer), seed.take()))
  const rollScope = (scope) =>
    updateLayer(layer.id, computeRoll(layer, scope.params, seed.take(), { stripNoRandom: !!scope.motion }))
  /* Seeded like every other roll (the _rollSeed flow), and the patch is the
   * registry's canonical one — not a hand-rolled subset. */
  const shufflePreset = () => {
    const pool = presetsInGroup(layer.loopGroup).filter((p) => p.id !== layer.presetId && !isToolPreset(p))
    if (!pool.length) return
    const s = seed.take()
    const p = pool[Math.floor(mulberry32(s >>> 0)() * pool.length)]
    updateLayer(layer.id, { ...presetLayerPatch(p, layer.loopGroup), _rollSeed: s })
  }

  /* Collapsed: Randomize all left, the open pill right. */
  if (!open) {
    return (
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {isLoop && (
          <Button variant="primary" size="lg" onClick={rollAll}>Randomize all</Button>
        )}
        {/* Pill shows the preset name only — the group·preset long form
            stays on the expanded header (user ruling 2026-08-12). */}
        <Button variant="primary" size="lg" onClick={() => setOpen(true)}>
          <span className="flex items-center gap-2">
            {isLoop ? layer.presetLabel : 'Media'}
            <EditorIcon name="chevron-down" size={16} className="rotate-180" />
          </span>
        </Button>
      </div>
    )
  }

  const tabs = isLoop ? TABS_LOOP : TABS_MEDIA
  const activeTab = tabs.some((t) => t.value === tab) ? tab : tabs[0].value

  return (
    <>
      {/* Generator switch sheet — the ONE list (CategoryScreen), identical
          to the entry flow's: pick hops the live layer's category, Insert
          restarts into the media picker, Back restarts to the beginning. */}
      {showCats && (
        <CategoryScreen
          onPick={(entry) => { onSwitchCategory(entry); setShowCats(false) }}
          onInsert={() => { setShowCats(false); onInsert() }}
          onBack={() => { setShowCats(false); onRestart() }}
          onDismiss={() => setShowCats(false)}
        />
      )}

      {/* The one modal — full-bleed, square, solid surface (user 2026-08-12) */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)]"
        style={PANEL_STYLE}
      >
        {/* Header — title tap collapses; Start over always reachable (it was
            buried in the Output tab — "can't go back", user 2026-08-12). */}
        <div className="flex w-full items-center px-3">
          <button
            className="kol-helper-12 text-meta flex flex-1 items-center gap-2 py-2.5"
            onClick={() => setOpen(false)}
          >
            <span>{title}</span>
            {/* Real icon, opaque ink (the icons law — the header's text-meta
                alpha stays on the TEXT only). */}
            <EditorIcon name="chevron-down" size={16} className="text-oq-48" />
          </button>
          <button className="kol-helper-12 text-meta py-2.5" onClick={onRestart}>Start over</button>
        </div>

        <div className="px-3 pb-3">
          <SegmentedToggle value={activeTab} onChange={setTab} options={tabs} size="lg" />

          {activeTab === 'generate' && isLoop && (
            <div className="flex flex-col gap-2 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Button iconComponent={EditorIcon} variant="primary" size="lg" iconRight="refresh" onClick={shufflePreset}>Preset</Button>
                <Button variant="primary" size="lg" onClick={() => setShowCats(true)}>Generator</Button>
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={rollAll}>
                Randomize all
              </Button>
              {scopes.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {scopes.map((s) => (
                    <Button key={s.id} variant="primary" size="lg" onClick={() => rollScope(s)}>
                      {s.label}
                    </Button>
                  ))}
                  {/* Re-trigger — restart the sim clock (rewind: t=0 + a new
                      reset epoch, keeps playing). Accumulative sims (penrose
                      growth, trails, diffusion) re-run from seed; pure loops
                      just restart their phase. Fills the odd grid cell. */}
                  <Button variant="primary" size="lg" onClick={() => transport.rewind()}>
                    Re-trigger
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <div className="pt-3">
              <TransportBar size="lg" />
            </div>
          )}

          {activeTab === 'output' && (
            <div className="flex flex-col gap-2 pt-3">
              <SegmentedToggle value={aspectValue} onChange={onAspect} options={ASPECT_ROW_1} size="lg" ariaLabel="Aspect" />
              <SegmentedToggle value={aspectValue} onChange={onAspect} options={ASPECT_ROW_2} size="lg" ariaLabel="Aspect (landscape) and fill" />
              <div className="grid grid-cols-3 gap-2">
                <Button variant="primary" size="lg" onClick={() => onExportPng(2)}>Download</Button>
                <Button variant="primary" size="lg" onClick={() => setUiHidden(true)}>Hide UI</Button>
                <Button variant="primary" size="lg" onClick={onRestart}>Start over</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
