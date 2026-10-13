import { useSyncExternalStore } from 'react'

/**
 * THE WORKSPACE (plan 30 § 9; Affinity's Studio) — which rail each pane sits in, in what order, and
 * which are collapsed to their header. The compose registry's `{ slot, order, id }` is the DEFAULT;
 * a pane's grip drags it (reorder in a rail, or across), its `⌄` collapses it, and Window ›
 * Workspace saves / restores / resets the arrangement. Panes without an `id` (Labs' registry) take
 * no part and render as their slot says.
 *
 *   record = { left: [paneId…], right: [paneId…], collapsed: { [paneId]: true } }
 *
 * The record persists at `kol.editor.workspace`; saved sets at `kol.editor.workspaces` (name → record).
 * ponytail: rail widths are not in the record — `useDragResize` keeps its own per-rail state.
 */
const KEY = 'kol.editor.workspace'
const SAVED_KEY = 'kol.editor.workspaces'

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota / private mode */ } }

let defaults = null           /* { left, right } from the registry */
let record = read(KEY, null)  /* the user's arrangement, or null = the defaults */
let saved = read(SAVED_KEY, {})
let over = null               /* the live drop target while a grip drags: { side, index } */
const subs = new Set()
const emit = () => subs.forEach((f) => f())

/* a record against the registry: unknown ids drop, ids the registry added since land on their default rail */
function normalise(r) {
  if (!defaults) return { left: [], right: [], collapsed: {} }
  const known = new Set([...defaults.left, ...defaults.right])
  const left = (r?.left ?? defaults.left).filter((id) => known.has(id))
  const right = (r?.right ?? defaults.right).filter((id) => known.has(id) && !left.includes(id))
  const placed = new Set([...left, ...right])
  for (const id of defaults.left) if (!placed.has(id)) left.push(id)
  for (const id of defaults.right) if (!placed.has(id)) right.push(id)
  return { left, right, collapsed: { ...(r?.collapsed ?? {}) } }
}

let snapshot = { ws: normalise(record), over, saved }
const commit = () => { snapshot = { ws: normalise(record), over, saved }; emit() }

/* called by the shell with the registry's panes; the first call (or a changed set) seeds the defaults */
export function seedWorkspace(panels) {
  const ids = (slot) => panels.filter((p) => p.slot === slot && p.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((p) => p.id)
  const next = { left: ids('left.body'), right: ids('right.body') }
  if (!next.left.length && !next.right.length) return  /* a registry with no workspace panes (Labs) */
  if (defaults && JSON.stringify(defaults) === JSON.stringify(next)) return
  defaults = next
  snapshot = { ws: normalise(record), over, saved }
}

const setRecord = (r) => { record = r; write(KEY, r); commit() }

export function movePane(id, side, index) {
  const ws = normalise(record)
  const from = ws.left.includes(id) ? 'left' : 'right'
  const fromIdx = ws[from].indexOf(id)
  ws[from] = ws[from].filter((x) => x !== id)
  /* dropping later in the same rail: the removal shifted every slot after it up by one */
  const at = from === side && index > fromIdx ? index - 1 : index
  ws[side] = [...ws[side].slice(0, at), id, ...ws[side].slice(at)]
  setRecord(ws)
}

export function toggleCollapsed(id) {
  const ws = normalise(record)
  ws.collapsed[id] = !ws.collapsed[id]
  if (!ws.collapsed[id]) delete ws.collapsed[id]
  setRecord(ws)
}

export function saveWorkspace(name) {
  saved = { ...saved, [name]: normalise(record) }
  write(SAVED_KEY, saved)
  commit()
}
export function applyWorkspace(name) { if (saved[name]) setRecord(normalise(saved[name])) }
export function resetWorkspace() { record = null; try { localStorage.removeItem(KEY) } catch { /* ignore */ } commit() }
/* the saved name whose arrangement is the current one, if any (Window › Workspace's ✓) */
export const currentWorkspaceName = (s = snapshot) => Object.keys(s.saved).find((n) => JSON.stringify(normalise(s.saved[n])) === JSON.stringify(s.ws)) ?? null

export const useWorkspace = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => snapshot)

/* THE GRIP'S DRAG — the drop line sits where the pointer is: above or below the pane under it (by its
 * midline), or at the end of a rail's empty space. Released over a target, the pane moves there. */
export function startPaneDrag(id, e) {
  if (e.button !== 0) return
  e.preventDefault()
  const target = (x, y) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const pane = el.closest?.('[data-pane-id]')
      if (pane) {
        const side = pane.closest('[data-rail-side]')?.dataset.railSide
        const ids = snapshot.ws[side] ?? []
        const r = pane.getBoundingClientRect()
        const i = ids.indexOf(pane.dataset.paneId)
        return side && i >= 0 ? { side, index: y < r.top + r.height / 2 ? i : i + 1 } : null
      }
      const rail = el.closest?.('[data-rail-side]')
      if (rail) return { side: rail.dataset.railSide, index: (snapshot.ws[rail.dataset.railSide] ?? []).length }
    }
    return null
  }
  const move = (ev) => {
    const t = target(ev.clientX, ev.clientY)
    if (JSON.stringify(t) !== JSON.stringify(over)) { over = t; commit() }
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    document.documentElement.style.removeProperty('cursor')
    const t = over
    over = null
    if (t) movePane(id, t.side, t.index)
    else commit()
  }
  document.documentElement.style.cursor = 'grabbing'
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
