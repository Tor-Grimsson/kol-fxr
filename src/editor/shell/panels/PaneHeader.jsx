import { createContext, useContext } from 'react'
import { TabChips, CloseButton } from '@kolkrabbi/kol-component'
import { startPaneDrag, startTabDrag, toggleCollapsed, useWorkspace } from '../../state/workspace'

/* the pane's workspace id, handed down by the shell's rail (plan 30 § 9) — a pane outside a rail has none */
export const PaneContext = createContext(null)

/**
 * PaneHeader — one shape for every pane's header (plan 30 § 8, Affinity's Studio, the user's
 * references): a grip at the left that drags the pane (§ 9), the tabs as chips — the DS `TabChips`,
 * ui.kolkrabbi.io's `Preview | Code` — then whatever the pane rides on the row (`trailing`).
 *
 * Plan 31 § 5: a chip's press past the slop drags THAT TAB (into another header, or out as a pane of
 * its own); a double-click on the row — not on a chip — collapses the pane to this row. The `⌄` that
 * did that is gone: at the end of a tab row it read as "more tabs", and nothing opened.
 */
export default function PaneHeader({ tabs, value, onChange, onClose, trailing }) {
  const pane = useContext(PaneContext)
  const { ws, over } = useWorkspace()
  const collapsed = !!(pane && ws.collapsed[pane])
  /* the chip under the pointer, by its place in the row — TabChips draws plain buttons */
  const onChipDown = (e) => {
    const chip = e.target.closest?.('[role="tab"]')
    if (!chip || !pane) return
    const i = [...chip.parentElement.children].indexOf(chip)
    if (tabs[i]) startTabDrag(tabs[i].id, e)
  }
  const onDoubleClick = (e) => {
    if (!pane || e.target.closest?.('[role="tab"], button')) return
    toggleCollapsed(pane)
  }
  return (
    <div className="kol-pane-header flex items-center gap-1 h-10 pl-1 pr-2 border-b border-oq-08 shrink-0"
      data-collapsed={collapsed ? 'true' : undefined} data-drop={pane && over?.pane === pane ? 'true' : undefined}
      onDoubleClick={onDoubleClick} title={pane ? 'Double-click to collapse' : undefined}>
      {pane && (
        <span role="button" tabIndex={-1} aria-label="Move pane" title="Drag to move"
          onPointerDown={(e) => startPaneDrag(pane, e)}
          className="self-stretch flex items-center px-0.5 cursor-grab touch-none">
          <span className="block w-1 h-4 rounded-full bg-oq-24" />
        </span>
      )}
      {onClose && <CloseButton onClick={onClose} size="xs" />}
      <div className="flex-1 min-w-0 touch-none" onPointerDown={onChipDown}>
        <TabChips tabs={tabs} value={value} onChange={onChange} size="sm" className="overflow-x-auto" />
      </div>
      {trailing}
    </div>
  )
}
