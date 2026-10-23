/* THE EDITOR'S OWN (plan 37 § 8.6, 2026-10-22): kol-component 0.287.0's `organisms/LayerStack.jsx`, taken
   in — the editor lives here and its organisms are edited here, no DS round trip (plan 06). The theme's
   `.kol-layer-stack-*` chrome still comes from kol-theme. */
import { useRef, useState } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { Button, Input, MenuDropdownItem, MenuDropdownNest, usePopover, PopoverPanel, Tooltip, rowLabelForLayer, findLayerDeep } from '@kolkrabbi/kol-component'

/* DS icon names for the engine's types — every one a shipped v1 glyph. A
 * consumer's own map goes in through `iconFor`. */
const DEFAULT_TYPE_ICONS = {
  background: 'square',
  pattern:    'ptrn-dot',
  photo:      'image',
  shape:      'rectangle',
  text:       'type',
  group:      'layers',
  bool:       'layers',
  loop:       'refresh',
  misc:       'refresh',
  kinetic:    'type',
}
const defaultIconFor = (type) => DEFAULT_TYPE_ICONS[type] ?? 'rectangle'

/* Exported — an inspector's Blend dropdown shares this list. */
export const BLEND_MODES = [
  { value: 'normal',     label: 'Normal' },
  { value: 'multiply',   label: 'Multiply' },
  { value: 'screen',     label: 'Screen' },
  { value: 'overlay',    label: 'Overlay' },
  { value: 'soft-light', label: 'Soft light' },
  { value: 'difference', label: 'Difference' },
]

/* Shift state captured in mousedown via ref; click reads the ref to decide
 * single-select vs toggle-select. Avoids relying on the synthetic event's
 * shiftKey passing through (proved unreliable in the source codebase). */
function useShiftClickHandlers(onSelect, onShiftSelect) {
  const shiftRef = useRef(false)
  const onMouseDown = (e) => { shiftRef.current = !!e.shiftKey }
  const onClick = () => {
    if (shiftRef.current) {
      shiftRef.current = false
      onShiftSelect?.()
    } else {
      onSelect?.()
    }
  }
  return { onMouseDown, onClick }
}

function Chevron({ IconC, collapsed, onToggle, title }) {
  return (
    <Tooltip label={title} asChild>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="kol-layer-stack-collapse"
    >
      <IconC
        name="chevron-down"
        size={10}
        style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
      />
    </button>
    </Tooltip>
  )
}

function LayerRow({
  layer, active, tinted, isContainer, IconC, labelFor, iconFor,
  groupCollapsed, onToggleGroup,
  onSelect, onShiftSelect, onToggleVisibility, onToggleLock, onRename,
  draggedId, dropTargetId, dropPosition,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  parentId = null,
}) {
  const isDragging  = draggedId === layer.id
  const isDropAbove = dropTargetId === layer.id && dropPosition === 'above'
  const isDropBelow = dropTargetId === layer.id && dropPosition === 'below'
  const isDropInto  = dropTargetId === layer.id && dropPosition === 'into'

  const selectHandlers = useShiftClickHandlers(onSelect, onShiftSelect)

  /* Inline rename — double-click the name to edit. Enter/blur commits (the
   * consumer's write, so undo-safety is theirs); Escape cancels. An emptied
   * input clears the name so the row falls back to its type label. */
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft]       = useState('')
  const cancelRef = useRef(false)

  const startRename = () => {
    setDraft(layer.name ?? '')
    setRenaming(true)
  }
  const commitRename = () => {
    if (!cancelRef.current) onRename(draft.trim() || null)
    cancelRef.current = false
    setRenaming(false)
  }

  return (
    <div className="kol-layer-stack-line group">
      {isContainer ? (
        <Chevron IconC={IconC} collapsed={groupCollapsed} onToggle={onToggleGroup} title={groupCollapsed ? 'Expand group' : 'Collapse group'} />
      ) : (
        <span aria-hidden="true" className="kol-layer-stack-collapse" />
      )}
      <div
        draggable={!renaming}
        onDragStart={(e) => onDragStart(e, layer.id)}
        onDragOver={(e) => onDragOver(e, layer.id, parentId)}
        onDragLeave={(e) => onDragLeave(e, layer.id)}
        onDrop={(e) => onDrop(e, layer.id, parentId)}
        onDragEnd={onDragEnd}
        className={
          `kol-layer-stack-row${active ? ' is-active' : ''}` +
          `${tinted && !active ? ' is-tinted' : ''}` +
          `${!layer.visible ? ' is-hidden' : ''}` +
          `${isDragging ? ' is-dragging' : ''}` +
          `${isDropAbove ? ' is-drop-above' : ''}` +
          `${isDropBelow ? ' is-drop-below' : ''}` +
          /* INTO a container (plan 37 § 8.6) — the row itself outlined, the drop's target is the group */
          `${isDropInto ? ' outline outline-1 -outline-offset-1 outline-[var(--kol-fg-48)]' : ''}`
        }
        data-layer-id={layer.id}
      >
        {renaming ? (
          <span className="kol-layer-stack-main">
            <span className="kol-layer-stack-icon" aria-hidden="true">
              <IconC name={iconFor(layer.type)} size={14} />
            </span>
            <Input
              variant="ghost"
              size="sm"
              width="100%"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                else if (e.key === 'Escape') { cancelRef.current = true; e.currentTarget.blur() }
              }}
              autoFocus
              placeholder={labelFor({ ...layer, name: null })}
              inputClassName="kol-helper-12 text-emphasis"
            />
          </span>
        ) : (
          <button
            type="button"
            onMouseDown={selectHandlers.onMouseDown}
            onClick={selectHandlers.onClick}
            onDoubleClick={startRename}
            className="kol-layer-stack-main"
          >
            <span className="kol-layer-stack-icon" aria-hidden="true">
              <IconC name={iconFor(layer.type)} size={14} />
            </span>
            <span className="kol-helper-12 truncate flex-1 text-left">
              {labelFor(layer)}
            </span>
          </button>
        )}
        <Tooltip label={layer.visible ? 'Hide' : 'Show'} asChild>
        <button
          type="button"
          onClick={onToggleVisibility}
          aria-pressed={!layer.visible}
          className={`kol-layer-stack-toggle kol-layer-stack-toggle--eye${active || !layer.visible ? ' is-pinned' : ''}`}
        >
          <IconC name={layer.visible ? 'eye-on' : 'eye-off'} size={12} />
        </button>
        </Tooltip>
        <Tooltip label={layer.locked ? 'Unlock' : 'Lock'} asChild>
        <button
          type="button"
          onClick={onToggleLock}
          aria-pressed={!!layer.locked}
          className={`kol-layer-stack-toggle kol-layer-stack-toggle--lock${active || layer.locked ? ' is-pinned' : ''}${layer.locked ? ' is-on' : ''}`}
        >
          <IconC name={layer.locked ? 'lock' : 'unlock'} size={12} />
        </button>
        </Tooltip>
      </div>
    </div>
  )
}

/* CanvasRow — the container row at the top of the stack (Figma frame model:
 * everything nests one step inside it). Always present, can't be deleted;
 * its chevron collapses the contents. */
function CanvasRow({ IconC, active, collapsed, onToggleCollapse, onSelect }) {
  return (
    <div className="kol-layer-stack-line group">
      <Chevron IconC={IconC} collapsed={collapsed} onToggle={onToggleCollapse} title={collapsed ? 'Expand layers' : 'Collapse layers'} />
      <div className={`kol-layer-stack-row${active ? ' is-active' : ''}`} data-layer-id="canvas">
        <button type="button" onClick={onSelect} className="kol-layer-stack-main">
          <span className="kol-layer-stack-icon" aria-hidden="true">
            <IconC name="maximize" size={14} />
          </span>
          {/* helper-12 like every layer row — mono-12 read heavier than the stack */}
          <span className="kol-helper-12 truncate flex-1 text-left">Canvas</span>
        </button>
      </div>
    </div>
  )
}

/**
 * LayerStack — The layers panel. the layers panel: a z-stacked tree of rows with HTML5 drag to
 * reorder AND reparent in one gesture, hover-revealed eye + lock toggles,
 * inline rename, collapsible containers, and a Canvas root row above it all.
 *
 * Lifted from kol-fxr's editor (`compose/LayerStack.jsx`, 583 lines,
 * `editor-panels-the-held-specs` A1, 2026-09-03) with its ONE coupling
 * dropped: it read and wrote `useComposeState()` directly. Every store call
 * is now a prop, and the drag model — the non-trivial part, the drop target
 * computed against the flattened tree with the cycle guard — is verbatim.
 *
 * ANATOMY, per row: `[chevron] [type icon] [name] … [eye] [lock]`. Chevrons
 * are focus chrome, not resting chrome (Figma model): hidden until the pointer
 * is inside the stack. Eye and lock reveal on row hover and pin visible when
 * the layer is hidden or locked. Double-click the name to rename inline —
 * Enter / blur commits, Escape cancels, an emptied field clears the name so
 * the row falls back to its type label. The panel renders REVERSED, so the
 * top row is the top of the z-order.
 *
 * THE DRAG. One drop path for every row: `onReorder(id, parentId, index)`
 * handles same-container reorder, child → top level, and top level → container
 * alike. `index` is in the target container's order WITHOUT the dragged item.
 * Dropping a container into its own subtree is refused at every depth (the UI
 * shows no indicator, so it never promises a drop the consumer would reject).
 *
 * SEAMS. `labelFor(layer)` and `iconFor(type)` because a consumer's layer
 * taxonomy is not ours — the defaults are the engine's own labels
 * (`hooks/layerTree.js`) and a DS-icon map, and a consumer with its own icon
 * registry passes `iconComponent` (Button's seam, same shape: `{ name, size,
 * className, style }`). `containerTypes` says which types have children.
 *
 * Chrome is `.kol-layer-stack-*` in kol-theme (organisms) — the states,
 * the drop indicators and the hover-reveal are pseudo-elements and descendant
 * rules a utility cannot express.
 *
 * @param {Array<Object>} layers - The tree, bottom-of-z-order first: `{ id, type, name?, visible, locked?, children? }` plus whatever the consumer's `labelFor` reads
 * @param {string[]} selectedIds - Current selection; may include `canvasId`
 * @param {string} [canvasId='canvas'] - The id that means the canvas root row
 * @param {Function} onSelect - `(id) => void` — plain click
 * @param {Function} onToggleSelect - `(id) => void` — shift-click adds / removes
 * @param {Function} onSelectCanvas - `() => void` — the root row
 * @param {Function} onToggleVisible - `(id) => void`
 * @param {Function} onToggleLocked - `(id) => void`
 * @param {Function} onRename - `(id, name|null) => void` — null clears the name
 * @param {Function} onReorder - `(id, parentId|null, index) => void` — see THE DRAG
 * @param {Function} onGroup - `(ids) => void` — the footer's Group action over a multi-selection; omit to hide it
 * @param {Function} [labelFor] - `(layer) => string` (default: the engine's `rowLabelForLayer`)
 * @param {Function} [iconFor] - `(type) => iconName` (default: a DS-icon map over the engine's types)
 * @param {ElementType} [iconComponent] - Icon renderer receiving `{ name, size, className, style }` (default: DS `Icon`)
 * @param {string[]} [containerTypes=['group','bool']] - Types whose rows collapse and whose `children` nest
 * @param {string} [className] - Extra classes on the panel
 */
export default function LayerStack({
  layers = [],
  selectedIds = [],
  canvasId = 'canvas',
  onSelect,
  onToggleSelect,
  onSelectCanvas,
  onToggleVisible,
  onToggleLocked,
  onRename,
  onReorder,
  onGroup,
  labelFor = rowLabelForLayer,
  iconFor = defaultIconFor,
  iconComponent: IconC = Icon,
  containerTypes = ['group', 'bool'],
  className = '',
}) {
  const isContainer = (l) => containerTypes.includes(l.type)

  /* The canvas is selectable but isn't a layer — exclude it from the group
   * action's count and payload. */
  const layerSelectedIds    = selectedIds.filter((id) => id !== canvasId)
  const layerSelectionCount = layerSelectedIds.length

  const [draggedId, setDraggedId]       = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [dropPosition, setDropPosition] = useState(null)
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())
  const [canvasCollapsed, setCanvasCollapsed] = useState(false)

  const toggleGroupCollapse = (id) => setCollapsedGroups((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const onDragStart = (e, id) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  /* True when the drop container sits anywhere inside the dragged layer's own
   * subtree (group into its own descendant) — a cycle the consumer will
   * reject, so the UI must not promise the drop. Every depth, not just direct
   * children. */
  const isIntoOwnSubtree = (targetParentId) => {
    if (!draggedId || targetParentId == null) return false
    const dragged = findLayerDeep(layers, draggedId)
    return dragged != null && findLayerDeep([dragged], targetParentId) != null
  }

  const onDragOver = (e, targetId, targetParentId = null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!draggedId || draggedId === targetId || isIntoOwnSubtree(targetParentId)) {
      setDropTargetId(null)
      setDropPosition(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const t = (e.clientY - rect.top) / rect.height
    /* A CONTAINER TAKES A DROP INTO IT (plan 37 § 8.6 — the user: "there is an empty layer option, but no
       way to drag other items into it? just over and under it?"): its row's middle third is "into",
       the outer thirds stay above / below. Into a container inside the dragged one is refused. */
    const target = findLayerDeep(layers, targetId)
    if (target && isContainer(target) && t > 1 / 3 && t < 2 / 3 && !isIntoOwnSubtree(targetId)) {
      setDropTargetId(targetId)
      setDropPosition('into')
      return
    }
    setDropTargetId(targetId)
    setDropPosition(t < 0.5 ? 'above' : 'below')
  }

  const onDragLeave = (_e, targetId) => {
    setDropTargetId((cur) => (cur === targetId ? null : cur))
  }

  const clearDrag = () => {
    setDraggedId(null)
    setDropTargetId(null)
    setDropPosition(null)
  }

  /* One drop path for every row. Index is in the target container's order
   * WITHOUT the dragged item. The panel renders reversed, so visual 'above'
   * = one past the target. */
  const onDrop = (e, targetId, targetParentId = null) => {
    e.preventDefault()
    /* into a container: on top of its own children (the panel lists top of z-order first) */
    if (dropPosition === 'into' && draggedId && draggedId !== targetId && !isIntoOwnSubtree(targetId)) {
      const kids = (findLayerDeep(layers, targetId)?.children ?? []).filter((l) => l.id !== draggedId)
      onReorder?.(draggedId, targetId, kids.length)
      clearDrag()
      return
    }
    if (!draggedId || draggedId === targetId || isIntoOwnSubtree(targetParentId)) {
      clearDrag()
      return
    }
    const container = targetParentId
      ? (findLayerDeep(layers, targetParentId)?.children ?? [])
      : layers
    const list = container.filter((l) => l.id !== draggedId)
    const targetIndex = list.findIndex((l) => l.id === targetId)
    if (targetIndex < 0) {
      clearDrag()
      return
    }
    const finalIndex = dropPosition === 'above' ? targetIndex + 1 : targetIndex
    onReorder?.(draggedId, targetParentId, finalIndex)
    clearDrag()
  }

  const rowProps = (layer, parentId) => ({
    layer,
    parentId,
    active: selectedIds.includes(layer.id),
    tinted: selectedIds.includes(parentId ?? canvasId),
    isContainer: isContainer(layer),
    IconC, labelFor, iconFor,
    groupCollapsed: collapsedGroups.has(layer.id),
    onToggleGroup: () => toggleGroupCollapse(layer.id),
    onSelect: () => onSelect?.(layer.id),
    onShiftSelect: () => onToggleSelect?.(layer.id),
    onToggleVisibility: () => onToggleVisible?.(layer.id),
    onToggleLock: () => onToggleLocked?.(layer.id),
    onRename: (name) => onRename?.(layer.id, name),
    draggedId, dropTargetId, dropPosition,
    onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd: clearDrag,
  })

  /* Recursive container contents. Each level wraps in a `-nest` ul, so the
   * indent compounds one chevron slot per depth; collapse, selection and drag
   * are id-keyed, so they work identically at every depth. */
  const renderChildren = (parent) => (
    <ul className="flex flex-col kol-layer-stack-nest">
      {[...parent.children].reverse().map((child) => (
        <li key={child.id}>
          <LayerRow {...rowProps(child, parent.id)} />
          {isContainer(child) && !collapsedGroups.has(child.id)
            && Array.isArray(child.children) && child.children.length > 0
            && renderChildren(child)}
        </li>
      ))}
    </ul>
  )

  return (
    <div className={`kol-layer-stack flex flex-col min-h-[240px] ${className}`.trim()} data-layer-stack="true">
      {/* Figma frame model: Canvas is the container, every layer nests one
        * step inside it; container children one more. */}
      <ul className="flex flex-col pb-3 px-2 pt-3">
        <li>
          <CanvasRow
            IconC={IconC}
            active={selectedIds.includes(canvasId)}
            collapsed={canvasCollapsed}
            onToggleCollapse={() => setCanvasCollapsed((v) => !v)}
            onSelect={() => onSelectCanvas?.()}
          />
        </li>
        {!canvasCollapsed && [...layers].reverse().map((layer) => (
          <li key={layer.id} className="kol-layer-stack-nest">
            <LayerRow {...rowProps(layer, null)} />
            {isContainer(layer) && !collapsedGroups.has(layer.id)
              && Array.isArray(layer.children) && layer.children.length > 0
              && renderChildren(layer)}
          </li>
        ))}
      </ul>

      {/* Footer only exists while a multi-selection can be grouped — add
        * lives in the panel's tab row (AddLayerButton), delete is the
        * consumer's keymap. */}
      {onGroup && layerSelectionCount >= 2 && (
        <div className="mt-auto flex items-center gap-2 px-3 h-10 border-t border-fg-08">
          <Tooltip label={`Group ${layerSelectionCount} selected layers`}>
          <Button
            iconComponent={IconC}
            tone="primary"
            size="sm"
            iconLeft="layers"
            onClick={() => onGroup(layerSelectedIds)}
          >
            Group {layerSelectionCount}
          </Button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

/**
 * AddLayerButton — Add a layer from a menu. the `+` that opens a menu of layer types. Lives in the
 * panel's tab row, not the stack footer (the source's placement). One entry
 * may expand inline to a kind picker so adding "a shape" doesn't silently
 * default to the first kind.
 *
 * @param {Array<{id: string, label: string, icon?: string}>} types - The menu rows
 * @param {{typeId: string, kinds: Array<{id: string, label: string, icon?: string, extras?: Object}>}} [nested] - One type that opens a sub-menu of kinds; picking one fires `onAdd(typeId, kind.extras)`
 * @param {Function} onAdd - `(typeId, extras?) => void`
 * @param {Function} [iconFor] - `(typeId) => iconName` for rows without their own `icon`
 * @param {ElementType} [iconComponent] - Icon renderer (default: DS `Icon`)
 * @param {number} [menuWidth=180] - Panel width in px
 */
export function AddLayerButton({
  types = [],
  nested,
  onAdd,
  iconFor = defaultIconFor,
  iconComponent: IconC = Icon,
  menuWidth = 180,
}) {
  const [open, setOpen] = useState(false)
  const popover = usePopover({
    open,
    onOpenChange: setOpen,
    placement: 'bottom-start',
    offset: 4,
    role: 'menu',
  })
  const pick = (id, extras) => { onAdd?.(id, extras); setOpen(false) }

  return (
    <>
      <span ref={popover.refs.setReference} {...popover.getReferenceProps()} className="inline-flex">
        <Tooltip label="Add layer">
        <Button
          iconComponent={IconC}
          tone="primary"
          size="sm"
          quiet
          iconOnly="plus"
          aria-label="Add layer"
        />
        </Tooltip>
      </span>
      <PopoverPanel popover={popover} className="py-1" style={{ width: menuWidth }}>
        {types.map((t) => {
          if (nested && t.id === nested.typeId) {
            return (
              <MenuDropdownNest key={t.id} iconLeft={<IconC name={t.icon ?? iconFor(t.id)} size={12} />} label={t.label}>
                {nested.kinds.map((k) => (
                  <MenuDropdownItem key={k.id} iconLeft={<IconC name={k.icon ?? iconFor(t.id)} size={12} />} onClick={() => pick(t.id, k.extras)}>
                    {k.label}
                  </MenuDropdownItem>
                ))}
              </MenuDropdownNest>
            )
          }
          return (
            <MenuDropdownItem key={t.id} iconLeft={<IconC name={t.icon ?? iconFor(t.id)} size={12} />} onClick={() => pick(t.id)}>
              {t.label}
            </MenuDropdownItem>
          )
        })}
      </PopoverPanel>
    </>
  )
}
