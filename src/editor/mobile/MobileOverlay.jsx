import { useEffect, useState } from 'react'
import { Button, SegmentedToggle, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { pack } from '../packs'
import { useComposeFile } from '../compose/useComposeFile'
import { transport, useTransport } from '../params/transport'
import { groupById, loopById } from '../../loops/registry'
import CategoryScreen, { SPREAD } from './CategoryScreen'
import EffectScreen from './EffectScreen'
import { deriveScopes, allScopeParams, computeRoll, computePresetRoll, computeFilterRoll, useRollSeed } from '../params/rolls'
import { resolvedChain } from '../compose/filterChain'
import { effectHost } from '../compose/inspectors/effectCategories'
import { PanelHeader, PanelPills, SheetGrab, SHEET_H, SHEET_MIN } from '../components/PanelHeader'
import RollScopesDialog from '../params/RollScopesDialog'
import MorphTab from '../morph/MorphTab'
import { useMorph } from '../morph/morphStore'
import { openFiles } from '../library/filesDialogStore'

/**
 * MobileOverlay — the generator's control panel, content split into
 * SegmentedToggle tabs so only one concern shows at a time:
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
 *
 * THE FRAME IS THE DEVICE'S, AND IT IS LABS' TOO (2026-10-05): on a phone a
 * full-bleed sheet along the bottom at `lg`, the touch rung; at a desk
 * (`rail`) the right rail — labs' width, labs' insets, labs' `sm` rung —
 * where it was the same sheet stretched 1552px wide with 382px tab cells.
 * Header and collapsed pill are `PanelHeader` / `PanelPills`, shared with
 * labs.
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

/* Scoped rolls as stateless ACTION STRIPS (user, 2026-09-01): the 2-col lg
 * button grid cost a 40px row per two scopes; the same scopes as
 * SegmentedToggle strips in `value={null}` action mode (SourceStrip's
 * pattern) fit four per row at the same 40px touch height. md buttons were
 * rejected for the height fix: the ladder is 26/32/40 and a 32px target is
 * too small for touch. Cells carry a `run` beside the DS's value/label.
 * Same overflow clamp as the tab strip below (a flex cell's default
 * min-width:auto pins it to its nowrap text — the strip-must-never-overflow
 * law), tighter padding since four labels share a phone width. */
/* …and NO HOVER ON TOUCH. `.kol-seg-cell:hover` (kol-theme) is unguarded, and
 * iOS keeps :hover on the last element tapped until the next touch — so the
 * scope you pressed stayed lit at oq-64 and read as a SELECTED tab on a strip
 * that has no selection (user, 2026-09-01: "wrong selected states"). Rest ink
 * wins where hover cannot exist. The token, not `.text-oq-48` — that class is
 * kol-theme CSS, not a utility, so a variant on it generates nothing. */
const STRIP_CLAMP = '[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1 [&_.kol-seg-cell]:overflow-hidden [@media(hover:none)]:[&_.kol-seg-cell:hover]:text-[var(--kol-oq-48)]'

/* Width-aware row packing — a blind 4-per-row mangled the long labels
 * ("Motion Frame" → "otion Fram" on a 390 screen). Cells share a strip
 * equally, so a row fits only while (cells × widest label) stays inside the
 * panel; labels are the schema's and stay verbatim (the copy law), so the
 * ROWS bend instead. ponytail: 9.6px/char is lg mono-16's real advance —
 * an estimate, not a measurement; swap for a canvas measure if a font
 * change ever drifts it. */
const CH = { lg: 9.6, sm: 7.2 }
const CELL_PAD = 10
/* the rail's inner width at its narrowest (`--kol-sidenav-w` 264 less the 16px insets) */
const RAIL_BUDGET = 232
function packRows(cells, size) {
  /* px-3 panel inset both sides; 480 caps the budget on tablets so rows
   * don't stretch to six thin cells. In the rail the budget is the rail's. */
  const budget = size === 'sm' ? RAIL_BUDGET : Math.min(window.innerWidth, 480) - 24
  const rows = []
  let row = []
  let maxW = 0
  for (const c of cells) {
    const w = c.label.length * CH[size] + CELL_PAD
    const m = Math.max(maxW, w)
    if (row.length && (row.length + 1) * m > budget) {
      rows.push(row); row = [c]; maxW = w
    } else {
      row.push(c); maxW = m
    }
  }
  if (row.length) rows.push(row)
  return rows
}

function ScopeStrips({ cells, size }) {
  return packRows(cells, size).map((row, i) => (
    <SegmentedToggle
      key={i}
      value={null}
      onChange={(v) => row.find((c) => c.value === v)?.run()}
      options={row}
      size={size}
      ariaLabel="Randomize scope"
      className={STRIP_CLAMP}
    />
  ))
}

/* Loop-length quick chips (own component so the per-tick useTransport
 * re-render stays scoped here, not the whole overlay). */
const LOOP_CHIP_OPTS = [2, 4, 8, 16].map((s) => ({ value: String(s), label: `${s}s` }))
function LoopChips({ size }) {
  const { loopSeconds, setLoopSeconds } = useTransport()
  return (
    <SegmentedToggle
      value={String(loopSeconds)}
      onChange={(v) => setLoopSeconds(Number(v))}
      options={LOOP_CHIP_OPTS}
      size={size}
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

export default function MobileOverlay({ layer, onSwitchCategory, onInsert, onRestart, aspectValue, onAspect, openEffects = false, rail = false, onRail, onSheet }) {
  /* a morph file opened here plays; its steps show read-only (plan 09 — building is labs' job).
     First hook in the body: the overlay returns early below, and a hook after a conditional return
     changes the hook count between renders (React #310). */
  const morph = useMorph()
  const { updateLayer, addFilter, removeFilter } = useComposeState()
  const { onExportPng } = useComposeFile()
  const [uiHidden, setUiHidden] = useState(false)
  const [open, setOpen] = useState(true)
  const [showCats, setShowCats] = useState(false)
  const [showFx, setShowFx] = useState(false)
  const [tab, setTab] = useState('generate')
  /* ONE HEIGHT FOR EVERY TAB (2026-10-05, decided on the recommendation for review). The sheet was
     as tall as its tab — 332 · 140 · 188 · 236 at 390 — so the strip jumped under the thumb on
     every switch, and on Generate it covered the bottom third of a stage that never refitted.
     Now it is labs' sheet: half the display (tall on the grabber), the stage refitting above it
     (`onSheet`), the controls scrolling inside when they outgrow it. */
  const [tall, setTall] = useState(false)
  const [scopesOpen, setScopesOpen] = useState(false)
  const { aspect } = useComposeState()
  /* …or the height the grab was dragged to (plan 15 § 1); null = the detent */
  const [sheetPx, setSheetPx] = useState(null)
  const seed = useRollSeed(layer)
  /* the Effects tool opens its sheet as soon as its media has landed */
  useEffect(() => { if (openEffects) { setOpen(true); setShowFx(true) } }, [openEffects])
  /* the rung of the frame: the rail is the desk's `sm`, the sheet is touch's `lg` */
  const cs = rail ? 'sm' : 'lg'
  /* the stage makes room for the rail only while the rail is on screen */
  const railShown = rail && !!layer && open && !uiHidden
  useEffect(() => { onRail?.(railShown); return () => onRail?.(false) }, [railShown]) // eslint-disable-line react-hooks/exhaustive-deps
  /* …and the sheet's height, so the stage can stand above it */
  const sheetShown = !rail && !!layer && open && !uiHidden
  const sheetH = sheetShown ? (sheetPx ? `${sheetPx}px` : tall ? SHEET_H.tall : SHEET_H.half) : null
  useEffect(() => { onSheet?.(sheetH); return () => onSheet?.(null) }, [sheetH]) // eslint-disable-line react-hooks/exhaustive-deps

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

  /* Collapsed: the disclosure pill FIRST and the row LEFT-ANCHORED (user,
   * 2026-09-01: it sat far right of a centred cluster while the expanded
   * header's label+chevron sat left — the same control jumping sides on
   * every open/close). px-3 matches the expanded header's inset, so the
   * label+chevron holds one x in both states. */
  if (!open) {
    return (
      /* Pill shows the preset name only — the group·preset long form stays on
         the expanded header (user ruling 2026-08-12). */
      <PanelPills label={isLoop ? layer.presetLabel : 'Media'} onOpen={() => setOpen(true)} size={cs}>
        {/* THE ROW IS ICONS (plan 18 § 1) — the pill, then roll · download · hide UI · fill, so it
            holds one line at 390. Media has no generator schema, but an effect chain is still
            rollable — computeRoll's filter half carries it (2026-08-27). Hide UI and Fill came up
            from the Output tab (§ 2): the shot is taken from here, with the sheet down. */}
        {(isLoop || chain.length > 0) && (
          <Tooltip label="Randomize all"><Button tone="primary" size={cs} iconOnly="bolt" aria-label="Randomize all" onClick={rollAll} className="shrink-0" /></Tooltip>
        )}
        <Tooltip label="Download"><Button tone="primary" size={cs} iconOnly="download" aria-label="Download" onClick={() => onExportPng(2)} className="shrink-0" /></Tooltip>
        <Tooltip label="Hide UI"><Button tone="primary" size={cs} iconOnly="eye-off" aria-label="Hide UI" onClick={() => setUiHidden(true)} className="shrink-0" /></Tooltip>
        <Tooltip label={aspectValue === 'fill' ? 'Back to the frame' : 'Fill the screen'}>
          <Button tone="primary" size={cs} iconOnly="maximize" aria-label={aspectValue === 'fill' ? 'Back to the frame' : 'Fill the screen'} aria-pressed={aspectValue === 'fill'} onClick={() => onAspect(aspectValue === 'fill' ? aspect : 'fill')} className="shrink-0" />
        </Tooltip>
      </PanelPills>
    )
  }

  const tabs = [...(isLoop ? TABS_LOOP : TABS_MEDIA), ...(isLoop && morph.steps.length >= 2 ? [{ value: 'morph', label: 'Morph' }] : [])].filter((t) => (t.value !== 'effects' || effectable) && (t.value !== 'transport' || pack('motion')))
  const activeTab = tabs.some((t) => t.value === tab) ? tab : tabs[0].value

  return (
    <>
      <RollScopesDialog open={scopesOpen} onClose={() => setScopesOpen(false)} schema={schema} layer={layer} size={cs} />
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

      {/* The one modal — full-bleed, square, solid surface (user 2026-08-12) —
          along the bottom on a phone; at a desk the right rail, labs' own
          (`--kol-sidenav-w` wide, top to bottom, a hairline on its inner edge). */}
      <div
        className={rail
          ? 'fixed top-0 right-0 bottom-0 z-10 flex w-[var(--kol-sidenav-w,320px)] flex-col overflow-y-auto border-l border-oq-08'
          : 'fixed right-0 left-[var(--fxr-rail,0px)] bottom-0 z-10 flex flex-col pb-[env(safe-area-inset-bottom)]'}
        /* the TOP edge is set, not the height, so it always meets the stage's bottom edge (the same
           `dvh` sum in MobileView) whatever the layout viewport's own height is doing */
        style={rail ? PANEL_STYLE : { ...PANEL_STYLE, top: `calc(100dvh - ${sheetH ?? SHEET_H.half})` }}
      >
        {!rail && (
          <SheetGrab
            tall={tall}
            onToggle={() => { setSheetPx(null); setTall((v) => !v) }}
            onResize={(px) => setSheetPx(Math.max(SHEET_MIN, Math.min(window.innerHeight * 0.92, px)))}
            onResizeEnd={(px) => { if (px < SHEET_MIN) { setSheetPx(null); setOpen(false) } }}
          />
        )}
        {/* Header — title tap collapses; Start over always reachable (it was
            buried in the Output tab — "can't go back", user 2026-08-12). In the
            rail it holds labs' insets, so both rails' first rows start on one y. */}
        <PanelHeader
          title={title}
          onCollapse={() => setOpen(false)}
          className={rail ? 'px-4 pt-2.5 pb-1.5' : 'px-3'}
          action={<Button tone="ghost" quiet size="sm" onClick={onRestart}>Start over</Button>}
        />

        <div className={rail ? 'px-4 pb-5' : 'min-h-0 flex-1 overflow-y-auto px-3 pb-3'}>
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
            size={cs}
            className={rail ? STRIP_CLAMP : '[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-2 [&_.kol-seg-cell]:overflow-hidden'}
          />

          {activeTab === 'morph' && isLoop && <MorphTab layer={layer} readOnly />}
          {activeTab === 'generate' && isLoop && (
            <div className="flex flex-col gap-2 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <Button tone="primary" size={cs} iconRight="refresh" onClick={shufflePreset}>Preset</Button>
                <Button tone="primary" size={cs} onClick={() => setShowCats(true)}>Generator</Button>
              </div>
              <div className="flex gap-2">
                <Button tone="primary" size={cs} className="flex-1 min-w-0" onClick={rollAll}>
                  Randomize all
                </Button>
                {/* what it touches — the setting's dialog (plan 18 § 3) */}
                <Tooltip label="What Randomize all rolls"><Button tone="primary" size={cs} iconOnly="nav-settings" aria-label="What Randomize all rolls" onClick={() => setScopesOpen(true)} className="shrink-0" /></Tooltip>
              </div>
              {scopes.length > 0 && (
                <ScopeStrips size={cs} cells={[
                  ...scopes.map((s) => ({ value: s.id, label: s.label, run: () => rollScope(s) })),
                  /* Re-trigger — restart the sim clock (rewind: t=0 + a new
                      reset epoch, keeps playing). Accumulative sims (penrose
                      growth, trails, diffusion) re-run from seed; pure loops
                      just restart their phase. Rides the strip as a cell. */
                  { value: '__retrigger', label: 'Re-trigger', run: () => transport.rewind() },
                ]} />
              )}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="flex flex-col gap-2 pt-3">
              {/* THE SAME SHAPE AS GENERATE (user, 2026-09-01: "reference how it's
                  done in Generate"): the actions on top — add, then the roll —
                  and the scoped strips UNDER the thing they scope. They sat
                  below the chain, so the strips read as tabs with nothing
                  behind them and the Randomize they belong to was last. */}
              <div className="grid grid-cols-2 gap-2">
                <Button tone="primary" size={cs} onClick={() => setShowFx(true)}>Add effect</Button>
                <Button tone="primary" size={cs} disabled={!chain.length} onClick={rollFilters}>Randomize</Button>
              </div>
              {/* THE CHAIN, IN RENDER ORDER. The array is already tier-sorted
                  by addFilter (canvas → pixi GPU → the single terminal GL
                  engine) and the renderer applies stages in tier order
                  regardless of array position, so what you read top-to-bottom
                  here is what the pixels go through. A row IS its remove
                  button; reorder within a tier stays desk work. */}
              {chain.map((stage, i) => {
                /* Per-stage scoped rolls — StageRolls' derivation (labs has
                   had these since the effect tab shipped; mobile's media
                   sheet was the one surface without them, user 2026-09-01).
                   The stage VIEW and the bare-stage write are LabsParams'
                   `paramsView` / `patchStageParams` verbatim, generalised to
                   index i. Strips sit under their own chain row so a
                   two-stage chain keeps each Colour with its effect. */
                const view = { ...layer, ...stage.params, id: layer.id }
                const stageScopes = stage.def ? deriveScopes(stage.def.params, view) : []
                const rollStage = (sc) => {
                  const patch = computeRoll(view, sc.params, seed.take(), { stripNoRandom: !!sc.motion })
                  const bare = chain.map(({ def: _def, ...s }) => s)
                  updateLayer(layer.id, { filters: bare.map((s, j) => (j === i ? { ...s, params: { ...s.params, ...patch } } : s)) })
                }
                return (
                  <div key={stage.key} className="flex flex-col gap-2">
                    <Button
                      tone="grey"
                      size={cs}
                      className={SPREAD}
                      iconLeft="trash"
                      iconRight="trash"
                      onClick={() => removeFilter(layer.id, i)}
                    >
                      {`${i + 1}. ${stage.def?.label ?? stage.id}`}
                    </Button>
                    {stageScopes.length > 0 && (
                      <ScopeStrips size={cs} cells={stageScopes.map((sc) => ({ value: sc.id, label: sc.label, run: () => rollStage(sc) }))} />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'transport' && pack('motion') && (
            <div className="flex flex-col gap-2 pt-3">
              {(() => { const TransportBar = pack('motion').TransportBar; return <TransportBar size={cs} /> })()}
              {/* Loop-length quick chips — typing in the bar's field is desk
                  work; touch picks. Fills the tab's dead width (2026-08-12). */}
              <LoopChips size={cs} />
            </div>
          )}

          {activeTab === 'output' && (
            <div className="flex flex-col gap-2 pt-3">
              <SegmentedToggle value={aspectValue} onChange={onAspect} options={ASPECT_ROW_1} size={cs} ariaLabel="Aspect" />
              <SegmentedToggle value={aspectValue} onChange={onAspect} options={ASPECT_ROW_2} size={cs} ariaLabel="Aspect (landscape) and fill" />
              <div className="grid grid-cols-2 gap-2">
                {/* a roll as a file — a labs file, so it is a morph step under From my files (⌘S at a desk) */}
                <Button tone="primary" size={cs} onClick={() => openFiles({ focusName: true })}>Save…</Button>
                <Button tone="primary" size={cs} onClick={() => onExportPng(2)}>Download</Button>
                <Button tone="primary" size={cs} onClick={() => setUiHidden(true)}>Hide UI</Button>
                <Button tone="primary" size={cs} onClick={onRestart}>Start over</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
