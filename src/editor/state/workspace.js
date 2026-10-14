import { useSyncExternalStore } from 'react'

/**
 * THE WORKSPACE (plan 30 § 9 → plan 31 § 4; Affinity's Studio) — THE TAB IS THE UNIT. The registry
 * declares panes (`{ id, side, order }`) and tabs (`{ tab, label, Component, Footer?, pane, order,
 * when? }`); a pane is only the group a set of tabs currently sits in. A tab's chip drags it into
 * another pane's header (it joins) or between panes / to a rail's end (a new pane of one); a pane's
 * grip drags the whole group; a double-click on a header collapses the pane to its row; its bottom
 * edge drags its height. Window › Workspace saves / restores / resets the arrangement.
 *
 *   record = { left:  [{ id, tabs: [tabId…], active }…],
 *              right: [{ id, tabs: [tabId…], active }…],
 *              collapsed: { [paneId]: true },
 *              heights:   { [paneId]: px } }
 *
 * The record persists at `kol.editor.workspace`; saved sets at `kol.editor.workspaces` (name → record).
 * A pane emptied by its last tab leaving is gone, with its height and collapse. A tab the record does
 * not know lands in its default pane (or a new pane on its default side). Labs declares no tabs and
 * renders by slot.
 * ponytail: rail widths are not in the record — `useDragResize` keeps its own per-rail state.
 */
const KEY = 'kol.editor.workspace'
const SAVED_KEY = 'kol.editor.workspaces'
const SIDES = ['left', 'right']
const SLOP = 4

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback } catch { return fallback } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* quota / private mode */ } }

let tabsById = new Map()      /* tab id → its registry entry */
let panesById = new Map()     /* pane id → its registry entry (the default side) */
let defaults = null           /* { left, right } built from the registry */
let seeded = null
let record = read(KEY, null)  /* the user's arrangement, or null = the defaults */
let saved = read(SAVED_KEY, {})
let over = null               /* the live drop target while something drags: { side, index } | { side, pane } */
let drag = null               /* the tab being dragged, for the ghost chip: { tab, label, x, y } */
const subs = new Set()
const emit = () => subs.forEach((f) => f())

const newId = () => `pane-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
const clonePane = (p) => ({ id: p?.id, tabs: [...(p?.tabs ?? [])], active: p?.active })

/* a record against the registry: unknown tabs drop, every registered tab is placed exactly once,
   empty panes go, and collapse / height entries survive only for panes that still exist */
function normalise(r) {
  if (!defaults) return { left: [], right: [], collapsed: {}, heights: {} }
  const placed = new Set()
  const take = (list) => (list ?? []).map(clonePane).map((p) => {
    p.tabs = p.tabs.filter((t) => tabsById.has(t) && !placed.has(t) && (placed.add(t), true))
    return p
  })
  const ws = { left: take(r?.left ?? defaults.left), right: take(r?.right ?? defaults.right), collapsed: {}, heights: {} }
  for (const [id, def] of tabsById) {
    if (placed.has(id)) continue
    const home = [...ws.left, ...ws.right].find((p) => p.id === def.pane)
    if (home) home.tabs.push(id)
    else ws[panesById.get(def.pane)?.side ?? 'left'].push({ id: def.pane, tabs: [id], active: id })
    placed.add(id)
  }
  for (const s of SIDES) {
    ws[s] = ws[s].filter((p) => p.id && p.tabs.length)
    for (const p of ws[s]) if (!p.tabs.includes(p.active)) p.active = p.tabs[0]
  }
  const ids = new Set([...ws.left, ...ws.right].map((p) => p.id))
  for (const id of Object.keys(r?.collapsed ?? {})) if (ids.has(id)) ws.collapsed[id] = true
  for (const [id, h] of Object.entries(r?.heights ?? {})) if (ids.has(id) && h > 0) ws.heights[id] = h
  return ws
}
/* the arrangement without the active tabs — what a saved workspace is compared on */
const shape = (ws) => JSON.stringify({ l: ws.left.map((p) => p.tabs), r: ws.right.map((p) => p.tabs), c: ws.collapsed, h: ws.heights })

let snapshot = { ws: normalise(record), over, drag, saved }
const commit = () => { snapshot = { ws: normalise(record), over, drag, saved }; emit() }

/* called by the shell with the registry's panes + tabs; the first call (or a changed set) seeds the defaults */
export function seedWorkspace(panes, tabs) {
  if (!tabs.length) return  /* a registry with no workspace tabs (Labs) */
  const sig = tabs.map((t) => `${t.pane}:${t.tab}`).join('|')
  if (sig === seeded) return
  seeded = sig
  tabsById = new Map(tabs.map((t) => [t.tab, t]))
  panesById = new Map(panes.map((p) => [p.id, p]))
  const byPane = (id) => tabs.filter((t) => t.pane === id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((t) => t.tab)
  const side = (s) => panes.filter((p) => p.side === s).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => ({ id: p.id, tabs: byPane(p.id), active: p.active ?? byPane(p.id)[0] })).filter((p) => p.tabs.length)
  defaults = { left: side('left'), right: side('right') }
  snapshot = { ws: normalise(record), over, drag, saved }
}

export const tabDef = (id) => tabsById.get(id)

const setRecord = (r) => { record = r; write(KEY, r); commit() }
const findPane = (ws, id) => [...ws.left, ...ws.right].find((p) => p.id === id)
const paneOf = (ws, tab) => [...ws.left, ...ws.right].find((p) => p.tabs.includes(tab))
const sideOf = (ws, pane) => (ws.left.includes(pane) ? 'left' : 'right')

/* a tab into another pane (`{ pane }`, appended + active) or into a new pane of its own at a rail
   position (`{ index }`); the pane it leaves goes if that was its last tab */
export function moveTab(tab, side, target) {
  const ws = normalise(record)
  const src = paneOf(ws, tab)
  if (!src) return
  const srcSide = sideOf(ws, src)
  const srcIdx = ws[srcSide].indexOf(src)
  const empties = src.tabs.length === 1
  if (target.pane === src.id) return
  if (target.pane == null && empties && side === srcSide && (target.index === srcIdx || target.index === srcIdx + 1)) return
  /* the rail position is remembered as "before this surviving pane", so the source pane leaving
     does not shift it */
  const before = target.pane == null ? ws[side].slice(target.index).find((p) => !(empties && p === src))?.id ?? null : null
  src.tabs = src.tabs.filter((t) => t !== tab)
  if (src.active === tab) src.active = src.tabs[0]
  for (const s of SIDES) ws[s] = ws[s].filter((p) => p.tabs.length)
  if (target.pane != null) {
    const dst = findPane(ws, target.pane)
    if (!dst) return
    dst.tabs.push(tab)
    dst.active = tab
    delete ws.collapsed[dst.id]
  } else {
    const at = before ? ws[side].findIndex((p) => p.id === before) : ws[side].length
    ws[side].splice(at < 0 ? ws[side].length : at, 0, { id: newId(), tabs: [tab], active: tab })
  }
  setRecord(ws)
}

export function movePane(id, side, index) {
  const ws = normalise(record)
  const from = ws.left.some((p) => p.id === id) ? 'left' : 'right'
  const fromIdx = ws[from].findIndex((p) => p.id === id)
  if (fromIdx < 0) return
  const [pane] = ws[from].splice(fromIdx, 1)
  /* dropping later in the same rail: the removal shifted every slot after it up by one */
  const at = from === side && index > fromIdx ? index - 1 : index
  ws[side].splice(at, 0, pane)
  setRecord(ws)
}

export function setActive(paneId, tab) {
  const ws = normalise(record)
  const pane = findPane(ws, paneId)
  if (!pane || !pane.tabs.includes(tab) || pane.active === tab) return
  pane.active = tab
  setRecord(ws)
}

/* a tab by name, wherever it sits: its pane shows it, uncollapsed. Unknown names (the footer's
   Transport · Output · File) are not the workspace's and are left alone. */
export function openTab(tab) {
  if (!tabsById.has(tab)) return
  const ws = normalise(record)
  const pane = paneOf(ws, tab)
  if (!pane || (pane.active === tab && !ws.collapsed[pane.id])) return
  pane.active = tab
  delete ws.collapsed[pane.id]
  setRecord(ws)
}

export function toggleCollapsed(id) {
  const ws = normalise(record)
  ws.collapsed[id] = !ws.collapsed[id]
  if (!ws.collapsed[id]) delete ws.collapsed[id]
  setRecord(ws)
}

export function setPaneHeight(id, px) {
  const ws = normalise(record)
  if (px == null) delete ws.heights[id]
  else ws.heights[id] = Math.round(px)
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
export const currentWorkspaceName = (s = snapshot) => Object.keys(s.saved).find((n) => shape(normalise(s.saved[n])) === shape(s.ws)) ?? null

export const useWorkspace = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => snapshot)

/* THE DROP TARGET under the pointer. A tab may land IN a pane (its header); anything may land BETWEEN
   panes (above or below the pane under it, by its midline) or at the end of a rail's empty space. */
function target(x, y, forTab) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (forTab) {
      const header = el.closest?.('.kol-pane-header')
      const pane = header?.closest('[data-pane-id]')
      const side = pane?.closest('[data-rail-side]')?.dataset.railSide
      if (pane && side) return { side, pane: pane.dataset.paneId }
    }
    const pane = el.closest?.('[data-pane-id]')
    if (pane) {
      const side = pane.closest('[data-rail-side]')?.dataset.railSide
      const panes = snapshot.ws[side] ?? []
      const r = pane.getBoundingClientRect()
      const i = panes.findIndex((p) => p.id === pane.dataset.paneId)
      return side && i >= 0 ? { side, index: y < r.top + r.height / 2 ? i : i + 1 } : null
    }
    const rail = el.closest?.('[data-rail-side]')
    if (rail) return { side: rail.dataset.railSide, index: (snapshot.ws[rail.dataset.railSide] ?? []).length }
  }
  return null
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* the click a drag ends on would switch the tab — eat the one that follows this pointer-up */
function swallowClick() {
  const eat = (e) => { e.stopPropagation(); e.preventDefault() }
  window.addEventListener('click', eat, true)
  setTimeout(() => window.removeEventListener('click', eat, true), 0)
}

/* THE GRIP'S DRAG — the whole pane; released over a target, the pane moves there. */
export function startPaneDrag(id, e) {
  if (e.button !== 0) return
  e.preventDefault()
  const move = (ev) => {
    const t = target(ev.clientX, ev.clientY, false)
    if (!same(t, over)) { over = t; commit() }
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

/* THE CHIP'S DRAG (plan 31 § 5) — under the slop it is the chip's click (the tab switches); past it
   the tab lifts, a ghost chip follows the pointer, and the drop is into a header or between panes. */
export function startTabDrag(tab, e) {
  if (e.button !== 0 || !tabsById.has(tab)) return
  const x0 = e.clientX, y0 = e.clientY
  const label = tabsById.get(tab).label ?? tab
  let lifted = false
  const move = (ev) => {
    if (!lifted) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < SLOP) return
      lifted = true
      document.documentElement.style.cursor = 'grabbing'
    }
    drag = { tab, label, x: ev.clientX, y: ev.clientY }
    over = target(ev.clientX, ev.clientY, true)
    commit()
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    const t = over
    over = null
    drag = null
    if (!lifted) return
    document.documentElement.style.removeProperty('cursor')
    swallowClick()
    if (t?.pane != null) moveTab(tab, t.side, { pane: t.pane })
    else if (t) moveTab(tab, t.side, { index: t.index })
    else commit()
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}
