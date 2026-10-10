import { Icon } from '@kolkrabbi/kol-icons'
import { useState } from 'react'
import { MenuItem, MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest, Tooltip } from '@kolkrabbi/kol-component'
import { IconFrame, Input, useModal } from '@kolkrabbi/kol-component'
import { ASPECTS } from './aspects'
import { useComposeState } from '../compose/state'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { STARTERS } from '../library/starters'
import { useComposeFile } from '../compose/useComposeFile'
import { openFiles } from '../library/filesDialogStore'
import { MODES, goMode } from '../mode'
import { findLayerDeep } from '../compose/helpers'
import { isBooleanable } from '../compose/boolean-ops'
import { BOOL_OP_LABELS } from '../compose/labels'
import { comboLabel, shortcutById } from '../state/keymap'
import { bareChain } from '../compose/filterChain'
import { pack } from '../packs'
import { blendLayers, canBlend } from '../compose/blend'
import { canMask } from '../compose/masks'

/* The seam (editor/packs.js) — the Generative menu is the generators pack's, the Effects menu the
 * effects pack's; each shows only when its pack is registered. */
const gen = () => pack('generators')
const fx = () => pack('effects')
const loopById = (id) => gen()?.loopById(id) ?? null
const filterById = (id) => fx()?.filterById(id) ?? null
const groupById = (id) => gen().groupById(id)
const presetsInGroup = (group) => gen()?.presetsInGroup(group) ?? []
const presetsInSub = (group, sub) => gen()?.presetsInSub(group, sub) ?? []
const presetParams = (preset) => gen().presetParams(preset)
const effectCategories = (filters) => fx()?.effectCategories(filters) ?? []

/**
 * MenuTop — top bar above the editor grid.
 *
 *   [ Frame title ]   [ Tools ▼ ]  [ File ▼ ]  [ Canvas ▼ ]  [ Templates ▼ ]  [ ⚙ ]
 *
 * The top-level entries (Tools / File / Canvas / Templates) are MenuItems;
 * each opens a dropdown panel of MenuDropdownItems.
 *
 * THE SETTINGS DROPDOWN IS GONE (2026-08-28). It was the THIRD live copy of
 * `appSettings` — default aspect, loop theme, autoplay, clip to frame, plus a
 * theme nest — after the `/settings` page had already replaced its labs twin.
 * The gear at the end of the row opens `DisplaySettingsDrawer` instead: the
 * same sections the page renders, over the canvas you are looking at. Only
 * Show grid was ever local to this menu, and it rides the drawer's host slot.
 */
const ASPECT_OPTIONS = ASPECTS.map((a) => ({ value: a.id, label: a.label }))

const SLOT_META = {
  palette: { label: 'Palettes' },
  pattern: { label: 'Patterns' },
  type:    { label: 'Types'    },
  preset:  { label: 'Presets'  },
}

const SLOT_KEYS = ['palette', 'pattern', 'type', 'preset']

export default function MenuTop() {
  const {
    aspect, setAspect,
    view, setView,
    layers, selectedId, selectedIds, updateLayer, addLayer, addFilter,
    flattenSelected, releaseBoolean, booleanSelected, convertShapeToPath, groupLayers, palette,
    beginTransaction, commitTransaction,
    canUndo, canRedo, undo, redo,
    clearLayers,
    currentPresetId, currentPresetName, setCurrentPresetName,
    loadPreset, loadPalette, insertFromLibrary,
    snapEnabled, toggleSnap,
    showGrid, toggleGrid,
  } = useComposeState()
  const { library } = useGeneratorLibrary()
  const modal = useModal()

  const openColorModal = () => window.dispatchEvent(new CustomEvent('kol:open-color-modal'))

  /* Save / save-as / export shared with the rail EditorFooter. */
  const { onSave, onExportSvg, onExportPng } = useComposeFile()

  /* Frame title — click-to-edit inline. Enter/blur commit, Escape cancels
   * (unmount doesn't re-fire the React blur handler). */
  /* THE TITLE IS ALWAYS AN INPUT (editor-chrome-review finding 9, the user:
   * *"illegal input, not ds I dont think"*). His diagnosis was wrong — it WAS
   * the DS `Input` — and the finding was right: it rendered as a plain `<span>`
   * at rest and only swapped to the Input on click, so there was no affordance
   * until you had already guessed it was editable. A field you cannot see is
   * not a field.
   *
   * One control now, with `onCommit` doing the whole job: commit on blur or
   * Enter, restore on Escape, and the draft RE-SNAPS to `value` afterwards, so
   * a rejected rename falls back to the last good name instead of lingering.
   * That retires the two-state span/input dance and its two pieces of state. */
  const commitTitle = (next) => setCurrentPresetName(next.trim() || null)

  /* Effects menu (Phase 7 + chain) — ADD a filter stage to the selected
   * layer's chain and jump to the Effects tab. Engine (GL) filters need a
   * pixel source: photo layers AND 2d loop layers get the full catalog
   * (the loop's live canvas feeds the engine), other positioned layers the
   * canvas set; engine (GL) loops take the canvas + pixi tiers (their GL frame is the chain's source,
   * plan 26 § 15) but never a GL engine stage — there is no GL→GL path.
   * One engine stage max — engine options drop out while one is present. */
  const fxLayer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const fxEngineLoop = fxLayer?.type === 'loop' && loopById(fxLayer.loopId)?.kind === 'engine'
  const fxTarget = fxLayer && ['shape', 'text', 'pattern', 'path', 'loop', 'misc', 'photo'].includes(fxLayer.type) ? fxLayer : null
  const fxChain = fxTarget ? bareChain(fxTarget) : []
  const fxHasEngine = fxChain.some((s) => filterById(s.id)?.kind === 'engine')
  const fxEngineHost = fxTarget && !fxEngineLoop && (fxTarget.type === 'photo' || fxTarget.type === 'loop' || fxTarget.type === 'misc')
  const fxOptions = fxTarget
    ? (fx()?.FILTERS ?? []).filter((f) => f.kind !== 'engine' || (fxEngineHost && !fxHasEngine))
    : []
  const fxInChain = (id) => fxChain.some((s) => s.id === id)
  const applyEffect = (f) => {
    if (!fxTarget) return
    addFilter(fxTarget.id, f.id)
    window.dispatchEvent(new CustomEvent('kol:open-effects'))
  }
  const clearEffect = () => {
    if (fxTarget) updateLayer(fxTarget.id, { filters: [] })
  }

  /* Generative menu — the app hierarchy (METHOD > TYPE > CATEGORY > PRESET,
   * docs/documentation/01-hierarchy.md) over the loop registry. Picking a
   * preset inserts a loop layer carrying it (same update shape as the
   * inspector's applyPreset). */
  const addGenerative = (preset, groupId) => {
    addLayer('loop', {
      loopGroup:   groupId,
      presetId:    preset.id,
      presetLabel: preset.label,
      loopId:      preset.loop,
      ...presetParams(preset),
    })
  }
  /* Presets of one registry group, in file order with sub-bucket headers. */
  const generativeItems = (groupId) => {
    const out = []
    let lastSub = null
    for (const p of presetsInGroup(groupId)) {
      if (p.sub && p.sub !== lastSub) {
        lastSub = p.sub
        out.push(
          <div key={`sub-${p.sub}`} className="kol-helper-10 text-subtle px-3 pt-2 pb-1">
            {p.sub}
          </div>,
        )
      }
      out.push(
        <MenuDropdownItem key={p.id} onClick={() => addGenerative(p, groupId)}>
          {p.label}
        </MenuDropdownItem>,
      )
    }
    return out
  }
  /* Vector menu — Flatten shape (Figma ⌘E semantics): one selected bool
   * group bakes to its path; ≥2 eligible vector layers destructive-unite. */
  const vectorSel = (selectedIds ?? []).filter((id) => id !== 'canvas')
    .map((id) => findLayerDeep(layers, id)).filter(Boolean)
  const canFlatten =
    (vectorSel.length === 1 && vectorSel[0].type === 'bool') ||
    (vectorSel.length >= 2 && vectorSel.every(isBooleanable))
  /* Release = un-boolean (top-level bools, ungroup scope). */
  const canRelease = layers.some((l) => l.id === selectedId && l.type === 'bool')
  /* Convert to path (the user's 6): a bool bakes (flatten), a primitive becomes a path */
  const convertible = vectorSel.length === 1 && vectorSel[0].type === 'shape' && !vectorSel[0].locked
    && ['rect', 'ellipse', 'triangle', 'polygon', 'star', 'line'].includes(vectorSel[0].kind)
  const onConvert = () => (convertible ? convertShapeToPath(vectorSel[0].id) : flattenSelected())
  /* Blend… (the user's 23): exactly two outlined layers; asks for the step count */
  const blendable = vectorSel.length === 2 && canBlend(vectorSel[0], vectorSel[1])
  const onBlend = async () => {
    const raw = await modal.prompt('Blend steps', '5')
    const steps = Math.max(1, Math.min(50, Math.round(Number(raw)) || 0))
    if (raw == null || !steps) return
    const ids = blendLayers(vectorSel[0], vectorSel[1], steps, palette).map((patch) => addLayer('path', patch))
    if (ids.length) groupLayers(ids)
  }
  /* masks (G8): the one selected top-level layer clips the layer directly below it */
  const maskSel = vectorSel.length === 1 ? vectorSel[0] : null
  const maskIdx = maskSel ? layers.findIndex((l) => l.id === maskSel.id) : -1
  const canUseAsMask = !!maskSel && !maskSel.isMask && maskIdx > 0 && canMask(maskSel)
  const onUseAsMask = () => {
    beginTransaction()
    updateLayer(maskSel.id, { isMask: true })
    updateLayer(layers[maskIdx - 1].id, { maskedBy: maskSel.id })
    commitTransaction()
  }
  const onReleaseMask = () => {
    beginTransaction()
    updateLayer(maskSel.id, { isMask: false })
    layers.filter((l) => l.maskedBy === maskSel.id).forEach((l) => updateLayer(l.id, { maskedBy: null }))
    commitTransaction()
  }
  /* booleans are toolbar + menu verbs (spec R2.4) — the same gate as the toolbar fold */
  const canBool = vectorSel.filter(isBooleanable).length >= 2

  /* EFFECTS > Pattern — the four labs /optic/* generator pages. They insert
   * loop layers (nothing to filter), so they render without an fx target. */
  const FX_PATTERN_CATEGORIES = [
    { label: 'Moiré',         group: 'optic',     sub: 'Moiré' },
    { label: 'Mesh Gradient', group: 'gradients', sub: 'Mesh' },
    { label: 'Reaction',      group: 'optic',     sub: 'Reaction' },
    { label: 'Halftone',      group: 'optic',     sub: 'Halftone' },
  ]

  const confirmReplaceIfUnsaved = async () => {
    if (layers.length === 0) return true
    /* A loaded preset only skips the confirm while it's untouched — canUndo
     * doubles as the dirty signal (edits since load push history), so a
     * MODIFIED saved canvas still confirms before being replaced. */
    if (currentPresetId && !canUndo) return true
    return modal.confirm('Discard the current canvas? Unsaved changes will be lost.')
  }

  /* New — a fresh default document. Clears the persisted draft and reloads so
   * EVERY piece of state (aspect, palette, title, canvas fills, history)
   * returns to its default in one shot; an in-place reset would risk leaving
   * one behind. Confirm first — this discards the current canvas. */
  const onNew = async () => {
    if (!(await confirmReplaceIfUnsaved())) return
    try { localStorage.removeItem('kol.editor.draft') } catch { /* ignore */ }
    window.location.reload()
  }

  /* Open a library item in place: palettes load into the live palette and
   * surface the color modal; pattern / type items insert a layer carrying
   * the saved settings (insertFromLibrary owns the spec→layer mapping);
   * presets replace the canvas. */
  const onOpenItem = async (slot, item) => {
    if (slot === 'preset' && !(await confirmReplaceIfUnsaved())) return
    switch (slot) {
      case 'palette': loadPalette(item); openColorModal();      break
      case 'pattern': insertFromLibrary('pattern', item);       break
      case 'type':    insertFromLibrary('type', item);          break
      case 'preset':  loadPreset(item);                         break
      default:
    }
  }

  const onOpenStarter = async (s) => {
    if (!(await confirmReplaceIfUnsaved())) return
    loadPreset(s.preset)
  }

  return (
    <div className="kol-editor-topbar flex items-center gap-3 px-4 h-12 border-b border-oq-08">
      {/* The mode door — first-class beside the title (it kept getting lost
          inside Settings). Label = the CURRENT chrome; picking another mode
          navigates via goMode. */}
      <MenuItem label="Editor" panelClassName="z-[var(--kol-z-tooltip)]">
        <div className="py-1 w-[200px]">
          {MODES.map((m) => (
            <MenuDropdownItem
              key={m.id}
              onClick={() => goMode(m.id)}
              shortcut={m.id === 'editor' ? <Icon name="check" size={11} /> : undefined}
            >
              {m.label}
            </MenuDropdownItem>
          ))}
        </div>
      </MenuItem>
      <div className="flex items-center gap-1 ml-auto">
        {/* MenuItem panels opt out of .kol-popover chrome (panel={false}) and
            so get NO z-index — the canvas rulers (z-index 4, positioned) would
            paint over them. Tracks the .kol-popover TOKEN, which moved 1000 →
            --kol-z-tooltip when the DS pulled its own strays onto the ladder
            (EditorOverlaysOnFullscreenOverlay, ruled 2026-08-27). */}
        {gen() && <MenuItem label="Generative" panelClassName="z-[var(--kol-z-tooltip)]" panelStyle={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="py-1 w-[260px]">
            {gen().GENERATIVE_TREE.map((parent) => (
              <MenuDropdownNest key={parent.label} label={parent.label}>
                {parent.groups.length === 1
                  ? generativeItems(parent.groups[0])
                  : parent.groups.map((gid) => (
                      <MenuDropdownNest key={gid} label={parent.labels?.[gid] ?? groupById(gid).label}>
                        {generativeItems(gid)}
                      </MenuDropdownNest>
                    ))}
              </MenuDropdownNest>
            ))}
            {/* Pattern — the four labs /optic/* generator pages; they insert loop layers, so they are
                generative, not effects (moved from Effects › Pattern, the user's 26) */}
            <MenuDropdownNest label="Pattern">
              {FX_PATTERN_CATEGORIES.map((c) => (
                <MenuDropdownNest key={c.label} label={c.label}>
                  {presetsInSub(c.group, c.sub).map((p) => (
                    <MenuDropdownItem key={p.id} onClick={() => addGenerative(p, c.group)}>
                      {p.label}
                    </MenuDropdownItem>
                  ))}
                </MenuDropdownNest>
              ))}
            </MenuDropdownNest>
          </div>
        </MenuItem>}

        {fx() && <MenuItem label="Effects" panelClassName="z-[var(--kol-z-tooltip)]" panelStyle={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="py-1 w-[260px]">
            {/* TYPE nests (Halftone · Scanline · CRT · Refraction · FX rack ·
                Dither); categories inside apply a filter to the selected
                layer. Preset picking lives in the Effects panel. PATTERN LEFT THIS MENU (the
                user's 26): its generators insert layers, so they are the Generative menu's. */}
            {!fxTarget ? (
              <div className="kol-mono-10 text-subtle px-3 py-1">Select a layer to apply an effect</div>
            ) : (
              <>
                <MenuDropdownItem onClick={clearEffect} disabled={fxChain.length === 0}>
                  None
                </MenuDropdownItem>
                <MenuDropdownDivider />
                {effectCategories(fxOptions).filter((c) => c.id !== 'other').map((c) => (
                  <MenuDropdownNest key={c.id} label={c.label}>
                    {c.filters.map((f) => (
                      <MenuDropdownItem
                        key={f.id}
                        onClick={() => applyEffect(f)}
                        shortcut={fxInChain(f.id) ? <Icon name="check" size={11} /> : undefined}
                      >
                        {f.label}
                      </MenuDropdownItem>
                    ))}
                  </MenuDropdownNest>
                ))}
              </>
            )}
          </div>
        </MenuItem>}

        <MenuItem label="Tools" panelClassName="z-[var(--kol-z-tooltip)]">
          <div className="py-1 w-[220px]">
            <MenuDropdownItem onClick={openColorModal}>
              Color
            </MenuDropdownItem>
            <MenuDropdownDivider />
            {Object.entries(BOOL_OP_LABELS).map(([op, label]) => (
              <MenuDropdownItem key={op} onClick={() => booleanSelected(op)} disabled={!canBool}>
                {label}
              </MenuDropdownItem>
            ))}
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={onConvert} disabled={!canFlatten && !convertible} shortcut={comboLabel(shortcutById('convert-path').combo)}>
              Convert to path
            </MenuDropdownItem>
            <MenuDropdownItem onClick={() => releaseBoolean()} disabled={!canRelease}>
              Release boolean
            </MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={onBlend} disabled={!blendable}>
              Blend…
            </MenuDropdownItem>
            <MenuDropdownDivider />
            {maskSel?.isMask ? (
              <MenuDropdownItem onClick={onReleaseMask}>Release mask</MenuDropdownItem>
            ) : (
              <MenuDropdownItem onClick={onUseAsMask} disabled={!canUseAsMask}>Use as mask</MenuDropdownItem>
            )}
          </div>
        </MenuItem>

        <MenuItem label="File" panelClassName="z-[var(--kol-z-tooltip)]">
          <div className="py-1 w-[220px]">
            <MenuDropdownItem onClick={onNew}>
              New
            </MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={onSave}>
              {currentPresetId ? 'Save' : 'Save…'}
            </MenuDropdownItem>
            {/* SAVE AS OPENS THE DIALOG, not a prompt: a prompt asks for a
                name with no sight of the names already taken, which is how
                three files end up called `test`. */}
            <MenuDropdownItem onClick={() => openFiles({ focusName: true })}>
              Save as…
            </MenuDropdownItem>
            {/* the one place that lists what you have saved, and the only one
                that can rename, duplicate or delete it */}
            <MenuDropdownItem onClick={() => openFiles()}>
              Files…
            </MenuDropdownItem>
            <MenuDropdownItem onClick={clearLayers} disabled={layers.length === 0}>
              Clear
            </MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem
              onClick={toggleSnap}
              shortcut={snapEnabled ? <Icon name="check" size={11} /> : undefined}
            >
              Snap to objects, guides and canvas
            </MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={onExportSvg}>
              Export SVG
            </MenuDropdownItem>
            <MenuDropdownItem onClick={onExportPng}>
              Export PNG
            </MenuDropdownItem>
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={undo} disabled={!canUndo} shortcut="⌘Z">Undo</MenuDropdownItem>
            <MenuDropdownItem onClick={redo} disabled={!canRedo} shortcut="⇧⌘Z">Redo</MenuDropdownItem>
          </div>
        </MenuItem>

        <MenuItem label="Canvas" panelClassName="z-[var(--kol-z-tooltip)]">
          <div className="py-1 w-[220px]">
            <MenuDropdownNest label="Aspect">
              {ASPECT_OPTIONS.map((opt) => (
                <MenuDropdownItem
                  key={opt.value}
                  onClick={() => setAspect(opt.value)}
                  shortcut={aspect === opt.value ? <Icon name="check" size={11} /> : undefined}
                >
                  {opt.label}
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            <MenuDropdownNest label="View">
              <MenuDropdownItem
                onClick={() => setView('single')}
                shortcut={view === 'single' ? <Icon name="check" size={11} /> : undefined}
              >
                Single
              </MenuDropdownItem>
              <MenuDropdownItem
                onClick={() => setView('social')}
                shortcut={view === 'social' ? <Icon name="check" size={11} /> : undefined}
              >
                Social
              </MenuDropdownItem>
            </MenuDropdownNest>
          </div>
        </MenuItem>

        <MenuItem label="Templates" align="end" panelClassName="z-[var(--kol-z-tooltip)]" panelStyle={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="py-1 w-[220px]">
            <MenuDropdownNest label={`Starters · ${STARTERS.length}`}>
              {STARTERS.map((s) => (
                <MenuDropdownItem
                  key={s.id}
                  onClick={() => onOpenStarter(s)}
                >
                  {s.name}
                </MenuDropdownItem>
              ))}
            </MenuDropdownNest>
            {SLOT_KEYS.map((slot) => {
              const items = library[slot] ?? []
              return (
                <MenuDropdownNest
                  key={slot}
                  label={`${SLOT_META[slot].label} · ${items.length}`}
                >
                  {items.length === 0 ? (
                    <div className="kol-helper-10 text-subtle px-3 py-1">empty</div>
                  ) : (
                    items.map((item, i) => {
                      const fallback = `${SLOT_META[slot].label.slice(0, -1)} ${i + 1}`
                      const label = item.name
                        ?? (slot === 'type'   && item.text ? item.text.slice(0, 24) : null)
                        ?? (slot === 'preset' && item.aspect ? `${item.aspect}${Array.isArray(item.layers) ? ` · ${item.layers.length}L` : ''}` : null)
                        ?? fallback
                      const swatch = slot === 'palette' && Array.isArray(item.colors) && (
                        <div className="flex gap-px">
                          {item.colors.slice(0, 6).map((c, j) => (
                            <span key={j} className="inline-block" style={{ background: c ?? 'transparent', width: 8, height: 14 }} />
                          ))}
                        </div>
                      )
                      return (
                        <MenuDropdownItem
                          key={item.id}
                          onClick={() => onOpenItem(slot, item)}
                          prefix={swatch || undefined}
                        >
                          {label}
                        </MenuDropdownItem>
                      )
                    })
                  )}
                </MenuDropdownNest>
              )
            })}
          </div>
        </MenuItem>
        {/* The gear opens the app settings WHERE YOU ARE (the DS SettingsPanel
            drawer) rather than sending you to `/settings` and back. Same
            sections, same store — `settings/AppSettings.jsx` defines them once. */}
        {/* `settings-01`, the COG — kol-r2b2's trigger verbatim (the DS ships it
            at MediaLibraryPages.jsx:286). NOT `nav-settings`: that is the
            sliders glyph the rail's Settings row wears, and two identical icons
            meaning different things on one screen is how this got lost. */}
        <Tooltip label="Display settings"><IconFrame
          name="settings-01"
          variant="primary"
          size="md" /* the menu bar's rung — it stood 26 beside 32px triggers (spec R1.1) */
          onClick={() => window.dispatchEvent(new CustomEvent('kol:open-settings'))}
          aria-label="Display settings"
        /></Tooltip>
      </div>
    </div>
  )
}
