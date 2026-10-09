import { useComposeState } from './state'
import { rowLabelForLayer } from './labels'
import { useControlSize } from '../params/controlSize'

/* What changed between two snapshots, in one line — the stack stores states, not verbs, so the
 * row names the difference: a layer added, deleted, moved or edited, else a selection. */
function describe(a, b) {
  const before = new Map(a.layers.map((l) => [l.id, l]))
  const after = new Map(b.layers.map((l) => [l.id, l]))
  const added = b.layers.find((l) => !before.has(l.id))
  if (added) return `Add ${rowLabelForLayer(added)}`
  const removed = a.layers.find((l) => !after.has(l.id))
  if (removed) return `Delete ${rowLabelForLayer(removed)}`
  const changed = b.layers.find((l) => before.get(l.id) !== l)
  if (changed) {
    const was = before.get(changed.id)
    const keys = Object.keys({ ...was, ...changed }).filter((k) => was[k] !== changed[k])
    const moved = keys.every((k) => k === 'x' || k === 'y')
    return `${moved ? 'Move' : 'Edit'} ${rowLabelForLayer(changed)}`
  }
  if (a.layers.map((l) => l.id).join() !== b.layers.map((l) => l.id).join()) return 'Reorder layers'
  return 'Select'
}

/**
 * HistoryPanel — the undo stack as rows (G6 — Affinity / Photoshop's History). Oldest at the top,
 * the current state lit, undone steps dimmed below it; a click steps back or forward to that row
 * through the same undo / redo every shortcut uses, so the stacks stay one truth.
 */
export default function HistoryPanel() {
  const cs = useControlSize()
  const { historyPast: past, historyFuture: future, layers, selectedIds, undo, redo } = useComposeState()
  const now = { layers, selectedIds }
  /* states in order: past…, now, future… — row i is the step that produced state i */
  const states = [...past, now, ...future]
  const current = past.length
  const goTo = (i) => {
    for (let k = current; k > i; k--) undo()
    for (let k = current; k < i; k++) redo()
  }
  if (states.length === 1) return <p className="kol-mono-12 text-meta px-4 py-3">No history yet.</p>
  return (
    <ul className="flex flex-col py-1">
      {states.map((st, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => goTo(i)}
            className={`w-full text-left px-4 kol-mono-12 truncate ${cs === 'sm' ? 'h-[var(--kol-ctl-sm)]' : 'h-[var(--kol-ctl-md)]'} ${i === current ? 'bg-oq-08 text-emphasis' : i > current ? 'text-meta opacity-60 hover:bg-oq-04' : 'text-auto hover:bg-oq-04'}`}
          >
            {i === 0 ? 'Open' : describe(states[i - 1], st)}
          </button>
        </li>
      ))}
    </ul>
  )
}
