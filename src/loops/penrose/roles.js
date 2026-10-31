import { useSyncExternalStore } from 'react'

/* WHICH COLOURS A SIM ACTUALLY DRAWS (plan 49 4.3, user 2026-10-31: "adding color here does nothing. and why do you add
 * color here?"). Every Penrose sim gets five role colours, but most draw two or three — the rest were controls that did
 * nothing. The colour paths (common.js pc · roleRGB · rampRGB, tint.js's mapper) report the role they hand out; the host
 * points the recorder at the running sim's set while it draws. LAYERS lists only what landed here. */
let current = null
const used = new Map() // loop id → Set(role)
const listeners = new Set()
let version = 0

export const roleUse = (role) => {
  if (!current || current.has(role)) return
  current.add(role)
  version++
  listeners.forEach((l) => l())
}
/** the host: record into `loopId`'s set while this sim draws; `null` stops */
export const recordRoles = (loopId) => {
  if (loopId == null) { current = null; return }
  if (!used.has(loopId)) used.set(loopId, new Set())
  current = used.get(loopId)
}
export const rolesOf = (loopId) => used.get(loopId) ?? null
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
/** re-renders when any sim reports a new role */
export const useRolesVersion = () => useSyncExternalStore(subscribe, () => version, () => version)
