import { createContext, useContext } from 'react'
import { TabChips, CloseButton } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { startPaneDrag, toggleCollapsed, useWorkspace } from '../../state/workspace'

/* the pane's workspace id, handed down by the shell's rail (plan 30 § 9) — a pane outside a rail has none */
export const PaneContext = createContext(null)

/**
 * PaneHeader — one shape for every pane's header (plan 30 § 8, Affinity's Studio, the user's
 * references): a grip at the left that drags the pane (§ 9), the tabs as chips — the DS `TabChips`,
 * ui.kolkrabbi.io's `Preview | Code` — then whatever the pane rides on the row (`trailing`, the
 * Layers `+`), and the `⌄` that collapses the pane to this row. The underline `TabsRow` is retired
 * from the panes; the footer strip stays a `SegmentedToggle` (memory).
 */
export default function PaneHeader({ tabs, value, onChange, onClose, trailing }) {
  const pane = useContext(PaneContext)
  const { ws } = useWorkspace()
  const collapsed = !!(pane && ws.collapsed[pane])
  return (
    <div className="kol-pane-header flex items-center gap-1 h-10 pl-1 pr-2 border-b border-oq-08 shrink-0">
      {pane && (
        <span role="button" tabIndex={-1} aria-label="Move pane" title="Drag to move"
          onPointerDown={(e) => startPaneDrag(pane, e)}
          className="self-stretch flex items-center px-0.5 cursor-grab touch-none">
          <span className="block w-1 h-4 rounded-full bg-oq-24" />
        </span>
      )}
      {onClose && <CloseButton onClick={onClose} size="xs" />}
      <TabChips tabs={tabs} value={value} onChange={onChange} size="sm" className="flex-1 min-w-0 overflow-x-auto" />
      {trailing}
      {pane && (
        <button type="button" onClick={() => toggleCollapsed(pane)} aria-label={collapsed ? 'Expand pane' : 'Collapse pane'} aria-expanded={!collapsed}
          className="inline-flex items-center justify-center size-5 rounded text-meta hover:text-emphasis">
          <Icon name="chevron-down" size={12} style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms' }} />
        </button>
      )}
    </div>
  )
}
