import { Icon } from '@kolkrabbi/kol-icons'
import { openColorModes } from '../color/ColorModesWindow'
import { useCallback, useEffect } from 'react'
import { MenuItem, MenuDropdownItem, MenuDropdownDivider, MenuDropdownNest, useModal } from '@kolkrabbi/kol-component'
import { useNavHidden } from '@kolkrabbi/kol-shell'
import { ASPECTS } from './aspects'
import { useComposeState } from '../compose/state'
import { useGeneratorLibrary } from '../library/LibraryProvider'
import { STARTERS } from '../library/starters'
import { useComposeFile } from '../compose/useComposeFile'
import { openFiles } from '../library/filesDialogStore'
import { goMode, navigateTo } from '../mode'
import { findLayerDeep } from '../compose/helpers'
import { isBooleanable } from '../compose/boolean-ops'
import { BOOL_OP_LABELS } from '../compose/labels'
import { comboLabel, shortcutById } from '../state/keymap'
import { pack } from '../packs'
import { blendLayers, canBlend } from '../compose/blend'
import { canMask } from '../compose/masks'
import { H_OPTS, V_OPTS } from '../compose/AlignmentPanel'
import { CASES } from '../modes/type/cuts'
import { toggleDots, useBindDots } from '../params/dotVisibility'
import { toggleTimelinePinned, useTimelinePinned } from '../params/timelinePinned'
import { openTab } from './openTab'
import { LiveFilterRows } from './LiveFilterRows'
import { useZoom } from './zoomStore'
import { applyWorkspace, currentWorkspaceName, resetWorkspace, saveWorkspace, useWorkspace } from '../state/workspace'

/* The seam (editor/packs.js) — layer creation and effects come from the generators / effects /
 * motion packs; each part of a menu shows only when its pack is registered. */
const gen = () => pack('generators')
const fx = () => pack('effects')
const motion = () => pack('motion')
const groupById = (id) => gen().groupById(id)
const presetsInGroup = (group) => gen()?.presetsInGroup(group) ?? []
const presetsInSub = (group, sub) => gen()?.presetsInSub(group, sub) ?? []
const presetParams = (preset) => gen().presetParams(preset)

/**
 * MenuTop — the menu bar above the editor grid (plans 28–29, on Affinity's conventions; spec R1.1).
 *
 *   FXR  File  Edit  Layer  Text  Vector  Tools  View  Window  Help
 *
 * THE APP NAME IS THE APP MENU (plan 30 § 1): Home, the chromes, Settings…. The logo that stood
 * before it as the Home door went in plan 37 § 8.1 (the user: "remove the logo") — Home is the menu's first row. The cog retired into it (plan 29 § 5). The editor hides the shell rail while it is
 * mounted — the app menu is its nav — and `\` brings it back. Layer holds edit verbs; creation
 * and effects are Tools (the user's ruling, plan 29 § 7). Submenus open BESIDE their row
 * (the DS `MenuDropdownNest flyout`, kol-component 0.252.0), and a row that does not apply is greyed, never hidden.
 *
 * Keyboard verbs run through `kol:command` (CanvasArea's keymap switch), so a row and its key
 * share every guard; shortcut labels come from the keymap, never typed here. Settings shows `,`,
 * not ⌘, — Chrome and Safari keep ⌘, for their own Settings and never hand it to a page.
 */
const ASPECT_OPTIONS = ASPECTS.map((a) => ({ value: a.id, label: a.label }))

const SLOT_META = {
  palette: { label: 'Palettes' },
  pattern: { label: 'Patterns' },
  type:    { label: 'Types'    },
  preset:  { label: 'Presets'  },
}
const SLOT_KEYS = ['palette', 'pattern', 'type', 'preset']

/* the chromes, in the shell rail's order (AppLayout NAV_ITEMS) — Home is its own row above */
const CHROMES = [
  { label: 'Library',    go: () => navigateTo('/library') },
  { label: 'Editor',     current: true },
  { label: 'Labs',       go: () => goMode('labs') },
  { label: 'Randomiser', go: () => goMode('randomiser') },
  { label: 'Morph',      go: () => navigateTo('/morph') },
]

/* EFFECTS > Pattern — the four labs /optic/* generator pages; they insert loop layers. */
const FX_PATTERN_CATEGORIES = [
  { label: 'Moiré',         group: 'optic',     sub: 'Moiré' },
  { label: 'Mesh Gradient', group: 'gradients', sub: 'Mesh' },
  { label: 'Reaction',      group: 'optic',     sub: 'Reaction' },
  { label: 'Halftone',      group: 'optic',     sub: 'Halftone' },
]

const key = (id) => { const s = shortcutById(id); return s ? comboLabel(s.combo) : undefined }
const cmd = (id) => () => window.dispatchEvent(new CustomEvent('kol:command', { detail: { id } }))
/* the trailing slot: ✓ when on (the menus' convention since day one), then the key */
const trail = (on, k) => (on || k ? <span className="inline-flex items-center gap-2">{on && <Icon name="check" size={11} />}{k}</span> : undefined)
const openColorPane = (tab = 'Colour') => window.dispatchEvent(new CustomEvent('kol:open-color-pane', { detail: { tab } }))
/* `kol-editor-menu` — the reference look (plan 30 § 4: darker panel, sans at full ink, 26px rows,
   hairline + shadow), scoped in kol-editor.css until it lands in the DS as a MenuItem tone */
const PANEL = 'kol-editor-menu z-[var(--kol-z-tooltip)]'
/* LINE TO LINE (plan 31 § 1): the panel's top border on the bar's bottom border — a 26px trigger sits
   2.5px above the bar's 1px hairline in its 32. `offset` is kol-component's (0.256.0,
   `MenuItemOffset` filed from here). */
const MENU_OFFSET = 2.5
const BAR = { size: 'sm', caret: false, panelClassName: PANEL, offset: MENU_OFFSET }
/* an eyebrow inside a menu panel — the voice the preset lists use for their sub-buckets */
const MenuEyebrow = ({ children }) => <div className="kol-helper-10 text-subtle px-3 pt-2 pb-1">{children}</div>
const noTimeline = () => false

export default function MenuTop() {
  const {
    aspect, setAspect,
    view, setView,
    layers, selectedId, selectedIds, select, updateLayer, addLayer,
    flattenSelected, releaseBoolean, booleanSelected, convertShapeToPath, groupLayers, palette,
    alignSelected, flattenText,
    beginTransaction, commitTransaction,
    canUndo, canRedo, undo, redo,
    clearLayers,
    currentPresetId,
    loadPreset, loadPalette, insertFromLibrary,
    snapEnabled, toggleSnap,
    showGrid, toggleGrid,
    showRulers,
  } = useComposeState()
  const { library } = useGeneratorLibrary()
  const modal = useModal()
  const dots = useBindDots()
  const timelinePinned = useTimelinePinned()
  const zoom = useZoom()
  const workspace = useWorkspace()
  const workspaceName = currentWorkspaceName(workspace)
  const onSaveWorkspace = async () => {
    const name = (await modal.prompt('Workspace name', workspaceName ?? ''))?.trim()
    if (name) saveWorkspace(name)
  }
  /* the footer exists only while the timeline is up (plan 29 § 9, plan 30 § 6) */
  const timelineUp = (motion()?.useTimelineUp ?? noTimeline)()

  /* THE EDITOR FOLDS THE SHELL RAIL (plan 28 § 14): the logo menu is its nav. A microtask, because
     the shell resets `navHidden` on every route change in its own effect, which runs after ours in
     the same commit. `\` (the shell's key) and Window › Show / hide rail bring it back. */
  const nav = useNavHidden()
  const setNavHidden = nav?.setNavHidden
  useEffect(() => {
    if (!setNavHidden) return undefined
    queueMicrotask(() => setNavHidden(true))
    return () => setNavHidden(false)
  }, [setNavHidden])
  const toggleRail = useCallback(() => setNavHidden?.((h) => !h), [setNavHidden])

  /* THE BAR IS LIVE ONCE A MENU IS OPEN (plan 37 § 8.1 — the user: "moving between categories
     automatically triggers selected state with hover … this is just how the mac topbar works"). The DS
     MenuItem is uncontrolled, so the slide is two clicks: close the open one, open the one under the
     pointer — each trigger's own toggle. */
  const slideMenus = useCallback((e) => {
    const bar = e.currentTarget
    const over = e.target.closest?.('.kol-menu-btn')
    if (!over || !bar.contains(over) || over.getAttribute('aria-expanded') === 'true') return
    const open = bar.querySelector(':scope > .kol-menu-btn[aria-expanded="true"]')
    if (!open) return
    open.click()
    over.click()
  }, [])

  /* Save / save-as / export shared with the rail EditorFooter. */
  const { onSave, onExportSvg, onExportPng, openOutputWindow } = useComposeFile()

  /* the selection, as every menu reads it */
  const sel = (selectedIds ?? []).filter((id) => id !== 'canvas')
    .map((id) => findLayerDeep(layers, id)).filter(Boolean)
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const editable = !!layer && !layer.locked
  const positioned = sel.some((l) => typeof l.x === 'number' && !l.locked)
  const textLayer = layer?.type === 'text' && !layer.locked ? layer : null

  /* Generative — the app hierarchy (METHOD > TYPE > CATEGORY > PRESET) over the loop registry.
   * Picking a preset inserts a loop layer carrying it. */
  const addGenerative = (preset, groupId) => {
    addLayer('loop', { loopGroup: groupId, presetId: preset.id, presetLabel: preset.label, loopId: preset.loop, ...presetParams(preset) })
  }
  /* Presets of one registry group, in file order with sub-bucket headers. */
  const presetRows = (presets, pick) => {
    const out = []
    let lastSub = null
    for (const p of presets) {
      if (p.sub && p.sub !== lastSub) {
        lastSub = p.sub
        out.push(<MenuEyebrow key={`sub-${p.sub}`}>{p.sub}</MenuEyebrow>)
      }
      out.push(<MenuDropdownItem key={p.id} onClick={() => pick(p)}>{p.label}</MenuDropdownItem>)
    }
    return out
  }
  const generativeItems = (groupId) => presetRows(presetsInGroup(groupId), (p) => addGenerative(p, groupId))

  /* Vector verbs — Flatten (Figma ⌘E): one bool bakes to its path; ≥2 eligible layers unite. */
  const canFlatten =
    (sel.length === 1 && sel[0].type === 'bool') ||
    (sel.length >= 2 && sel.every(isBooleanable))
  const canRelease = layers.some((l) => l.id === selectedId && l.type === 'bool')
  const convertible = sel.length === 1 && sel[0].type === 'shape' && !sel[0].locked
    && ['rect', 'ellipse', 'triangle', 'polygon', 'star', 'line'].includes(sel[0].kind)
  const onConvert = () => (convertible ? convertShapeToPath(sel[0].id) : flattenSelected())
  const blendable = sel.length === 2 && canBlend(sel[0], sel[1])
  const onBlend = async () => {
    const raw = await modal.prompt('Blend steps', '5')
    const steps = Math.max(1, Math.min(50, Math.round(Number(raw)) || 0))
    if (raw == null || !steps) return
    const ids = blendLayers(sel[0], sel[1], steps, palette).map((patch) => addLayer('path', patch))
    if (ids.length) groupLayers(ids)
  }
  const canBool = sel.filter(isBooleanable).length >= 2

  /* masks (G8): the one selected top-level layer clips the layer directly below it */
  const maskSel = sel.length === 1 ? sel[0] : null
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

  const confirmReplaceIfUnsaved = async () => {
    if (layers.length === 0) return true
    /* A loaded preset only skips the confirm while it's untouched — canUndo doubles as the dirty
     * signal, so a MODIFIED saved canvas still confirms before being replaced. */
    if (currentPresetId && !canUndo) return true
    return modal.confirm('Discard the current canvas? Unsaved changes will be lost.')
  }

  /* New — a fresh default document: clear the persisted draft and reload, so EVERY piece of state
   * returns to its default in one shot. Confirm first. */
  const onNew = async () => {
    if (!(await confirmReplaceIfUnsaved())) return
    try { localStorage.removeItem('kol.editor.draft') } catch { /* ignore */ }
    window.location.reload()
  }

  /* Open a library item in place: palettes load into the live palette and surface the color pane;
   * pattern / type items insert a layer; presets replace the canvas. */
  const onOpenItem = async (slot, item) => {
    if (slot === 'preset' && !(await confirmReplaceIfUnsaved())) return
    switch (slot) {
      case 'palette': loadPalette(item); openColorPane();  break
      case 'pattern': insertFromLibrary('pattern', item); break
      case 'type':    insertFromLibrary('type', item);    break
      case 'preset':  loadPreset(item);                   break
      default:
    }
  }
  const onOpenStarter = async (s) => {
    if (!(await confirmReplaceIfUnsaved())) return
    loadPreset(s.preset)
  }

  const kinetic = motion()
  const paratype = gen() ? presetsInGroup('paratype') : []

  /* THE BAR IS THE DARKEST THING ON SCREEN (plan 31 § 1 "MAKE IT DARKER", plan 37 § 8.3 — the user: "like
     mac … its always darker … absolute even darker?"): `surface-absolute-split`, black in dark, below
     the panes' primary and the panels' tertiary. No logo (§ 8.1 — Home is the app menu's first row). */
  return (
    <div className="kol-editor-topbar flex items-center gap-1 px-4 h-8 bg-[var(--kol-surface-absolute-split)] border-b border-oq-08" onPointerOver={slideMenus}>
      {/* THE APP MENU — the name holds Home, the chromes and Settings (plan 29 § 5; `APP.name`) */}
      <MenuItem label="FXR" {...BAR} buttonClassName="font-bold text-emphasis">
        <div className="py-1 w-[200px]">
          <MenuDropdownItem onClick={() => navigateTo('/')}>Home</MenuDropdownItem>
          <MenuDropdownNest flyout label="Chromes">
            {CHROMES.map((d) => (
              <MenuDropdownItem key={d.label} onClick={d.go} shortcut={trail(d.current)}>{d.label}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:open-settings'))} shortcut={key('settings-drawer')}>
            Settings…
          </MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="File" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownItem onClick={onNew}>New</MenuDropdownItem>
          {/* the one place that lists what you have saved, and the only one that can rename,
              duplicate or delete it */}
          <MenuDropdownItem onClick={() => openFiles()} shortcut={key('open-files')}>Files…</MenuDropdownItem>
          <MenuDropdownNest flyout label="Starters" scroll>
            {STARTERS.map((s) => (
              <MenuDropdownItem key={s.id} onClick={() => onOpenStarter(s)}>{s.name}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={onSave} shortcut={key('save')}>{currentPresetId ? 'Save' : 'Save…'}</MenuDropdownItem>
          {/* SAVE AS OPENS THE DIALOG, not a prompt: a prompt asks for a name with no sight of the
              names already taken, which is how three files end up called `test`. */}
          <MenuDropdownItem onClick={() => openFiles({ focusName: true })} shortcut={key('save-as')}>Save as…</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownNest flyout label="Aspect" scroll>
            {ASPECT_OPTIONS.map((opt) => (
              <MenuDropdownItem key={opt.value} onClick={() => setAspect(opt.value)} shortcut={trail(aspect === opt.value)}>
                {opt.label}
              </MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownItem onClick={clearLayers} disabled={layers.length === 0}>Clear</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownNest flyout label="Library">
            {SLOT_KEYS.map((slot) => {
              const items = library[slot] ?? []
              return (
                <MenuDropdownNest flyout key={slot} label={`${SLOT_META[slot].label} · ${items.length}`} disabled={items.length === 0} scroll>
                  {items.map((item, i) => {
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
                      <MenuDropdownItem key={item.id} onClick={() => onOpenItem(slot, item)} prefix={swatch || undefined}>
                        {label}
                      </MenuDropdownItem>
                    )
                  })}
                </MenuDropdownNest>
              )
            })}
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={onExportSvg}>Export SVG</MenuDropdownItem>
          <MenuDropdownItem onClick={onExportPng}>Export PNG</MenuDropdownItem>
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:open-batch-export'))}>Batch export…</MenuDropdownItem>
          <MenuDropdownItem onClick={openOutputWindow}>Open output window</MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="Edit" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownItem onClick={undo} disabled={!canUndo} shortcut={key('undo')}>Undo</MenuDropdownItem>
          <MenuDropdownItem onClick={redo} disabled={!canRedo} shortcut={key('redo')}>Redo</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('duplicate')} disabled={!editable} shortcut={key('duplicate')}>Duplicate selection</MenuDropdownItem>
          <MenuDropdownItem onClick={cmd('delete-back')} disabled={!sel.some((l) => !l.locked)} shortcut={key('delete-back')}>Delete selection</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('select-all')} disabled={layers.length === 0} shortcut={key('select-all')}>Select all layers</MenuDropdownItem>
          <MenuDropdownItem onClick={() => select(null)} disabled={(selectedIds ?? []).length === 0} shortcut={key('deselect')}>Deselect</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('eyedrop')} shortcut={key('eyedrop')}>Eyedropper</MenuDropdownItem>
          <MenuDropdownItem onClick={() => openColorPane()}>Color</MenuDropdownItem>
          <MenuDropdownItem onClick={openColorModes}>Color Modes</MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="Layer" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownItem onClick={cmd('group')} disabled={sel.length < 2} shortcut={key('group')}>Group selection</MenuDropdownItem>
          <MenuDropdownItem onClick={cmd('ungroup')} disabled={layer?.type !== 'group'} shortcut={key('ungroup')}>Ungroup</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownNest flyout label="Align" disabled={!positioned}>
            {H_OPTS.map((o) => (
              <MenuDropdownItem key={`h-${o.value}`} iconLeft={o.label} onClick={() => alignSelected('h', o.value)} disabled={o.value === 'distribute' && sel.length < 3}>{o.ariaLabel}</MenuDropdownItem>
            ))}
            <MenuDropdownDivider />
            {V_OPTS.map((o) => (
              <MenuDropdownItem key={`v-${o.value}`} iconLeft={o.label} onClick={() => alignSelected('v', o.value)} disabled={o.value === 'distribute' && sel.length < 3}>{o.ariaLabel}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownItem onClick={cmd('flip-h')} disabled={!positioned} shortcut={key('flip-h')}>Flip horizontal</MenuDropdownItem>
          <MenuDropdownItem onClick={cmd('flip-v')} disabled={!positioned} shortcut={key('flip-v')}>Flip vertical</MenuDropdownItem>
          <MenuDropdownDivider />
          {/* LIVE FILTERS (plan 32 § 1; Affinity's `New Live Filter Layer ▸`, which an effect is — applied
              to a layer, so it lives in Layer, not Tools): Blur · Sharpen · Distort · Noise · Lighting ·
              Colors, then the labs families. Greyed, not hidden, with nothing selected; ✓ on the chain. */}
          {fx() && <MenuDropdownNest flyout label="Live Filters"><LiveFilterRows /></MenuDropdownNest>}
          {/* the FX button's window (plan 32 § 2) */}
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:open-layer-effects'))} disabled={!editable}>Layer Effects…</MenuDropdownItem>
          <MenuDropdownDivider />
          {maskSel?.isMask ? (
            <MenuDropdownItem onClick={onReleaseMask}>Release mask</MenuDropdownItem>
          ) : (
            <MenuDropdownItem onClick={onUseAsMask} disabled={!canUseAsMask}>Use as mask</MenuDropdownItem>
          )}
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('toggle-lock')} disabled={!layer} shortcut={key('toggle-lock')}>Toggle lock</MenuDropdownItem>
          <MenuDropdownItem onClick={cmd('toggle-visibility')} disabled={!layer} shortcut={key('toggle-visibility')}>Toggle visibility</MenuDropdownItem>
        </div>
      </MenuItem>

      {/* TEXT — operations on the selected text layer (Affinity's Text menu: traits, alignment,
          case). Making text is Layer › New › Type. */}
      <MenuItem label="Text" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownNest flyout label="Alignment" disabled={!textLayer}>
            {[['left', 'text-align-left', 'Align text left'], ['center', 'text-align-center', 'Center text'], ['right', 'text-align-right', 'Align text right']].map(([v, icon, label]) => (
              <MenuDropdownItem key={v} iconLeft={<Icon name={icon} size={16} />} onClick={() => updateLayer(textLayer.id, { textAlign: v })} shortcut={trail((textLayer?.textAlign ?? 'center') === v)}>{label}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownNest flyout label="Vertical alignment" disabled={!textLayer}>
            {[['top', 'text-valign-top', 'Align top'], ['middle', 'text-valign-middle', 'Align middle'], ['bottom', 'text-valign-bottom', 'Align bottom']].map(([v, icon, label]) => (
              <MenuDropdownItem key={v} iconLeft={<Icon name={icon} size={16} />} onClick={() => updateLayer(textLayer.id, { verticalAlign: v })} shortcut={trail((textLayer?.verticalAlign ?? 'middle') === v)}>{label}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownNest flyout label="Case" disabled={!textLayer}>
            {CASES.map((c) => (
              <MenuDropdownItem key={c.id} onClick={() => updateLayer(textLayer.id, { case: c.id })} shortcut={trail((textLayer?.case ?? 'original') === c.id)}>{c.label}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownItem onClick={() => updateLayer(textLayer.id, { italic: !textLayer.italic })} disabled={!textLayer} shortcut={trail(!!textLayer?.italic)}>Italic</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={() => flattenText(textLayer.id)} disabled={!textLayer}>Convert to path</MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="Vector" {...BAR}>
        <div className="py-1 w-[240px]">
          {Object.entries(BOOL_OP_LABELS).map(([op, label]) => (
            <MenuDropdownItem key={op} onClick={() => booleanSelected(op)} disabled={!canBool}>{label}</MenuDropdownItem>
          ))}
          <MenuDropdownItem onClick={() => releaseBoolean()} disabled={!canRelease}>Release boolean</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={onConvert} disabled={!canFlatten && !convertible} shortcut={key('convert-path')}>Convert to path</MenuDropdownItem>
          <MenuDropdownItem onClick={onBlend} disabled={!blendable}>Blend…</MenuDropdownItem>
        </div>
      </MenuItem>

      {/* TOOLS — everything that makes a layer, and effects (plan 29 § 7, the user's ruling: "fold
          effects and generative and type and pattern into tools"). Layer keeps the edit verbs. */}
      <MenuItem label="Tools" {...BAR}>
        <div className="py-1 w-[220px]">
          {gen() && (
            <MenuDropdownNest flyout label="Generative">
              {gen().GENERATIVE_TREE.map((parent) => (
                parent.groups.length === 1 ? (
                  <MenuDropdownNest flyout key={parent.label} label={parent.label} scroll>{generativeItems(parent.groups[0])}</MenuDropdownNest>
                ) : (
                  <MenuDropdownNest flyout key={parent.label} label={parent.label}>
                    {parent.groups.map((gid) => (
                      <MenuDropdownNest flyout key={gid} label={parent.labels?.[gid] ?? groupById(gid).label} scroll>{generativeItems(gid)}</MenuDropdownNest>
                    ))}
                  </MenuDropdownNest>
                )
              ))}
            </MenuDropdownNest>
          )}
          {gen() && (
            <MenuDropdownNest flyout label="Pattern">
              {FX_PATTERN_CATEGORIES.map((c) => (
                <MenuDropdownNest flyout key={c.label} label={c.label} scroll>
                  {presetsInSub(c.group, c.sub).map((p) => (
                    <MenuDropdownItem key={p.id} onClick={() => addGenerative(p, c.group)}>{p.label}</MenuDropdownItem>
                  ))}
                </MenuDropdownNest>
              ))}
            </MenuDropdownNest>
          )}
          <MenuDropdownNest flyout label="Type">
            <MenuDropdownItem onClick={cmd('tool-text')} shortcut={key('tool-text')}>Text tool</MenuDropdownItem>
            {kinetic && (
              <MenuDropdownNest flyout label="Kinetic type">
                {kinetic.KINETIC_TREE.map((parent) => (
                  <div key={parent.label}>
                    <MenuEyebrow>{parent.label}</MenuEyebrow>
                    {parent.subs.map((sub) => (
                      <MenuDropdownNest flyout key={sub} label={sub} scroll>
                        {kinetic.KINETIC_PRESETS.filter((p) => p.sub === sub).map((p) => (
                          <MenuDropdownItem key={p.id} onClick={() => addLayer('kinetic', { presetId: p.id, presetLabel: p.label, comp: kinetic.presetComp(p) })}>
                            {p.label}
                          </MenuDropdownItem>
                        ))}
                      </MenuDropdownNest>
                    ))}
                  </div>
                ))}
              </MenuDropdownNest>
            )}
            {paratype.length > 0 && (
              <MenuDropdownNest flyout label={gen().MISC_TREE[0].label} scroll>
                {presetRows(paratype, (p) => addLayer('misc', gen().presetLayerPatch(p, 'paratype')))}
              </MenuDropdownNest>
            )}
          </MenuDropdownNest>
          {/* the color modes tool (plan 39 § 4.1) — a tool window, like the rest of Tools */}
          <MenuDropdownItem onClick={openColorModes}>Color Modes</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:insert-image'))}>Insert image</MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="View" {...BAR}>
        <div className="py-1 w-[260px]">
          {/* ZOOM (plan 33; Affinity's View › Zoom, the user's reference): the steps are REAL
              percentages — 100% is one frame px per screen px — and ✓ marks the one showing */}
          <MenuDropdownNest flyout label="Zoom">
            <MenuDropdownItem onClick={cmd('zoom-in')} shortcut={key('zoom-in')}>In</MenuDropdownItem>
            <MenuDropdownItem onClick={cmd('zoom-out')} shortcut={key('zoom-out')}>Out</MenuDropdownItem>
            <MenuDropdownItem onClick={cmd('zoom-fit')} shortcut={key('zoom-fit')}>To Fit</MenuDropdownItem>
            <MenuDropdownItem onClick={cmd('zoom-width')} shortcut={key('zoom-width')}>To Width</MenuDropdownItem>
            <MenuDropdownItem onClick={cmd('zoom-selection')} disabled={!sel.length} shortcut={key('zoom-selection')}>To Selection</MenuDropdownItem>
            <MenuDropdownDivider />
            {[[1, 'zoom-100'], [2, 'zoom-200'], [4, 'zoom-400'], [8, 'zoom-800']].map(([z, id]) => (
              <MenuDropdownItem key={id} onClick={cmd(id)} shortcut={trail(Math.abs(zoom - z) < 0.005, key(id))}>{z * 100}%</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('view-preview')} shortcut={key('view-preview')}>Preview mode</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={cmd('toggle-rulers')} shortcut={trail(showRulers, key('toggle-rulers'))}>Show / hide rulers</MenuDropdownItem>
          <MenuDropdownItem onClick={toggleGrid} shortcut={trail(showGrid, key('toggle-grid'))}>Show/hide grid</MenuDropdownItem>
          <MenuDropdownItem onClick={toggleDots} shortcut={trail(dots, key('toggle-dots'))}>Show / hide modulation dots</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={toggleSnap} shortcut={trail(snapEnabled)}>Snap to objects, guides and canvas</MenuDropdownItem>
          <MenuDropdownDivider />
          <MenuDropdownNest flyout label="Layout">
            <MenuDropdownItem onClick={() => setView('single')} shortcut={trail(view === 'single')}>Single</MenuDropdownItem>
            <MenuDropdownItem onClick={() => setView('social')} shortcut={trail(view === 'social')}>Social</MenuDropdownItem>
          </MenuDropdownNest>
        </div>
      </MenuItem>

      {/* WINDOW — each row opens its panel's tab (`kol:open-tab`; the color pane has its own event). */}
      <MenuItem label="Window" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownNest flyout label="Left rail">
            {['Layers', 'Assets', 'History', 'Navigator'].map((t) => <MenuDropdownItem key={t} onClick={() => openTab(t)}>{t}</MenuDropdownItem>)}
            <MenuDropdownDivider />
            {[['Stroke', 'Stroke'], ['Colour', 'Color'], ['Swatches', 'Swatches']].map(([id, label]) => (
              <MenuDropdownItem key={id} onClick={() => openColorPane(id)}>{label}</MenuDropdownItem>
            ))}
            {/* a tool window, not a pane tab (plan 39 § 4.1) */}
            <MenuDropdownItem onClick={openColorModes}>Color Modes</MenuDropdownItem>
            <MenuDropdownDivider />
            {/* the footer comes up with the timeline (plan 30 § 6): with it down, a row pins the
                timeline and opens its tab */}
            {[...(kinetic ? ['Transport'] : []), 'Output', 'File'].map((t) => (
              <MenuDropdownItem key={t} onClick={() => { if (kinetic && !timelineUp) toggleTimelinePinned(); openTab(t) }}>{t}</MenuDropdownItem>
            ))}
          </MenuDropdownNest>
          <MenuDropdownNest flyout label="Right rail">
            {['Inspector', 'Parameters', ...(fx() ? ['Effects'] : [])].map((t) => <MenuDropdownItem key={t} onClick={() => openTab(t)}>{t}</MenuDropdownItem>)}
          </MenuDropdownNest>
          {kinetic && <MenuDropdownItem onClick={toggleTimelinePinned} shortcut={trail(timelinePinned)}>Timeline</MenuDropdownItem>}
          <MenuDropdownDivider />
          {/* THE WORKSPACE (plan 30 § 9, plan 31 § 4; Affinity's Studio presets): the panes' arrangement —
              tabs dragged by their chips, panes by their grips, collapsed by a double-click on the header,
              sized by their bottom edge — saved under a name, restored, or reset to the default */}
          <MenuDropdownNest flyout label="Workspace">
            <MenuDropdownItem onClick={onSaveWorkspace}>Save workspace…</MenuDropdownItem>
            {Object.keys(workspace.saved).length > 0 && <MenuDropdownDivider />}
            {Object.keys(workspace.saved).map((n) => (
              <MenuDropdownItem key={n} onClick={() => applyWorkspace(n)} shortcut={trail(n === workspaceName)}>{n}</MenuDropdownItem>
            ))}
            <MenuDropdownDivider />
            <MenuDropdownItem onClick={resetWorkspace}>Reset workspace</MenuDropdownItem>
          </MenuDropdownNest>
          <MenuDropdownDivider />
          <MenuDropdownItem onClick={toggleRail} disabled={!setNavHidden} shortcut={key('toggle-rail')}>Show / hide rail</MenuDropdownItem>
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:open-settings'))} shortcut={key('settings-drawer')}>Show / hide settings</MenuDropdownItem>
        </div>
      </MenuItem>

      <MenuItem label="Help" {...BAR}>
        <div className="py-1 w-[240px]">
          <MenuDropdownItem onClick={() => window.dispatchEvent(new CustomEvent('kol:show-shortcuts'))} shortcut={key('show-shortcuts')}>Show / hide shortcuts</MenuDropdownItem>
        </div>
      </MenuItem>

    </div>
  )
}
