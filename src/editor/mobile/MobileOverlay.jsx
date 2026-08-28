import { useState } from 'react'
import { Button, SegmentedToggle } from '@kolkrabbi/kol-component'
import EditorIcon from '../icons/EditorIcon'
import TransportBar from '../params/TransportBar'
import { useComposeState } from '../compose/state'
import { useComposeFile } from '../compose/useComposeFile'
import { transport, useTransport } from '../params/transport'
import { groupById, loopById } from '../../loops/registry'
import CategoryScreen, { SPREAD } from './CategoryScreen'
import EffectScreen from './EffectScreen'
import { deriveScopes, allScopeParams, computeRoll, computePresetRoll, computeFilterRoll, useRollSeed } from '../params/rolls'
import { resolvedChain } from '../compose/filterChain'
import { effectHost } from '../compose/inspectors/effectCategories'

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
  { value: 'effects',   label: 'Effects' },
  { value: 'transport', label: 'Transport' },
  { value: 'output',    label: 'Output' },
]
/* Media (a photo layer — a video is one too, srcType:'video') has no
 * generator to shuffle, but it IS effectable, which is why Effects exists
 * here at all: until 2026-08-27 an inserted image or video landed on a sheet
 * with nothing but Transport and Output. */
const TABS_MEDIA = TABS_LOOP.filter((t) => t.value !== 'generate')

/* Loop-length quick chips (own component so the per-tick useTransport
 * re-render stays scoped here, not the whole overlay). */
const LOOP_CHIP_OPTS = [2, 4, 8, 16].map((s) => ({ value: String(s), label: `${s}s` }))
function LoopChips() {
  const { loopSeconds, setLoopSeconds } = useTransport()
  return (
    <SegmentedToggle
      value={String(loopSeconds)}
      onChange={(v) => setLoopSeconds(Number(v))}
      options={LOOP_CHIP_OPTS}
      size="lg"
      ariaLabel="Loop length"
    />
  )
}

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
  const { updateLayer, addFilter, removeFilter } = useComposeState()
  const { onExportPng } = useComposeFile()
  const [uiHidden, setUiHidden] = useState(false)
  const [open, setOpen] = useState(true)
  const [showCats, setShowCats] = useState(false)
  const [showFx, setShowFx] = useState(false)
  const [tab, setTab] = useState('generate')
  const seed = useRollSeed(layer)

  if (!layer) return null

  /* Screen-record mode: everything gone, one invisible tap-catcher back. */
  if (uiHidden) {
    return <button aria-label="Show controls" className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] z-20" onClick={() => setUiHidden(false)} />
  }

  const isLoop = layer.type === 'loop'
  const title = isLoop
    ? `${groupById(layer.loopGroup).label} · ${layer.presetLabel}`
    : 'Media'

  const schema = isLoop ? (loopById(layer.loopId)?.params ?? []) : []
  const scopes = isLoop ? deriveScopes(schema, layer) : []

  const rollAll = () =>
    updateLayer(layer.id, computeRoll(layer, allScopeParams(schema, layer), seed.take(), { withFilters: true }))
  const rollScope = (scope) =>
    updateLayer(layer.id, computeRoll(layer, scope.params, seed.take(), { stripNoRandom: !!scope.motion }))
  const shufflePreset = () => {
    const patch = computePresetRoll(layer, seed.take())
    if (patch) updateLayer(layer.id, patch)
  }

  /* ── Effects ──
   * Pick + roll, never sliders: AutoControls renders its controls at `sm`,
   * and mobile is all-`lg`. That matches the Generate tab, which is roll
   * buttons and no param editor either — touch rolls, the desk tweaks. */
  const chain = resolvedChain(layer)
  const { effectable } = effectHost(layer)
  const rollFilters = () => {
    const filters = computeFilterRoll(layer, seed.take())
    if (filters) updateLayer(layer.id, { filters })
  }

  /* Collapsed: Randomize all left, the open pill right. */
  if (!open) {
    return (
      <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {/* Media has no generator schema, but an effect chain is still
            rollable — computeRoll's filter half carries it (2026-08-27).
            Before that this button was loop-only, so an image or video
            collapsed to Download and the pill, nothing to press. */}
        {(isLoop || chain.length > 0) && (
          <Button variant="primary" size="lg" onClick={rollAll}>Randomize all</Button>
        )}
        {/* Capture without re-expanding the sheet (2026-08-12). */}
        <Button variant="primary" size="lg" onClick={() => onExportPng(2)}>Download</Button>
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

  const tabs = (isLoop ? TABS_LOOP : TABS_MEDIA).filter((t) => t.value !== 'effects' || effectable)
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

      {/* Add-effect sheet — the same card as the generator list, catalog and
          host rule shared with the desktop panel (effectCategories.js). */}
      {showFx && (
        <EffectScreen
          layer={layer}
          chain={chain}
          onPick={(id) => { addFilter(layer.id, id); setShowFx(false) }}
          onBack={() => setShowFx(false)}
        />
      )}

      {/* The one modal — full-bleed, square, solid surface (user 2026-08-12) */}
      <div
        className="fixed right-0 left-[var(--fxr-rail,0px)] bottom-0 z-10 pb-[env(safe-area-inset-bottom)]"
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
          {/* THE STRIP MUST NEVER OVERFLOW. `.kol-seg-cell` is `flex: 1` but a
              flex item's default `min-width: auto` pins it to its own nowrap
              text, so cells push past the shell instead of sharing it — four
              lg labels measure 451px in a 316px track and Output falls off the
              end (the shipped three already measured 343). `min-w-0` lets them
              shrink; the tighter padding means they don't have to at any real
              phone width. Descendant selectors into DS internals are the
              sanctioned escape — a consumer cannot reach `.kol-seg-cell`
              otherwise, and the size ladder stays `lg`. */}
          <SegmentedToggle
            value={activeTab}
            onChange={setTab}
            options={tabs}
            size="lg"
            className="[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-2 [&_.kol-seg-cell]:overflow-hidden"
          />

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

          {activeTab === 'effects' && (
            <div className="flex flex-col gap-2 pt-3">
              {/* THE CHAIN, IN RENDER ORDER. The array is already tier-sorted
                  by addFilter (canvas → pixi GPU → the single terminal GL
                  engine) and the renderer applies stages in tier order
                  regardless of array position, so what you read top-to-bottom
                  here is what the pixels go through. A row IS its remove
                  button; reorder within a tier stays desk work. */}
              {chain.map((stage, i) => (
                <Button
                  key={stage.key}
                  variant="grey"
                  size="lg"
                  className={SPREAD}
                  iconLeft="trash"
                  iconRight="trash"
                  onClick={() => removeFilter(layer.id, i)}
                >
                  {`${i + 1}. ${stage.def?.label ?? stage.id}`}
                </Button>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="lg" onClick={() => setShowFx(true)}>Add effect</Button>
                <Button variant="primary" size="lg" disabled={!chain.length} onClick={rollFilters}>Randomize</Button>
              </div>
            </div>
          )}

          {activeTab === 'transport' && (
            <div className="flex flex-col gap-2 pt-3">
              <TransportBar size="lg" />
              {/* Loop-length quick chips — typing in the bar's field is desk
                  work; touch picks. Fills the tab's dead width (2026-08-12). */}
              <LoopChips />
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
