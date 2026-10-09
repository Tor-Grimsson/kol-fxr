import { useSyncExternalStore } from 'react'

/**
 * morphStore — the morph being built (plan 09). Module state, one per tab, in the idiom of
 * `railExtras` and `filesDialogStore`: the Morph tab (labs), the step picker (an overlay) and the
 * URL intents all read and write it without threading props through the rail.
 *
 * A step is `{ loopId, loopGroup, presetId, presetLabel, params, source }` — `params` is a COPY of
 * the generator's settings (schema keys only), `source` says where it came from for the label
 * (`{ kind: 'preset' | 'file' | 'stage', id, label }`). Copies, not pointers: a pointer breaks the
 * day its file is renamed or deleted.
 */
const INITIAL = {
  active: false,      /* the Morph rail is the surface in use (the MORPH row, New File → Morph, a morph file opened) */
  mode: 'shape',      /* 'shape' = point to point between outlines (plan 10) · 'blend' = the param tween (plan 05) · 'crossfade' = step fades into step (plan 14) */
  resolution: 0,      /* Shape: points per outline pair, 0 = auto (plan 14 § 3) */
  editRequest: null,  /* a step index the timeline dock asked to edit (plan 14 § 7); MorphTab consumes it */
  loopId: null,       /* fixed by the first step — one generator per morph (phase 1) */
  steps: [],
  curve: 'in-out',
  cycle: 'loop',
  syncLoop: false,    /* the end takes the start's values, every track on the layer — a seamless wrap (resolve.js) */
  seconds: 4,
  editing: null,      /* index of the step on the stage, static, while its sliders are being moved */
  fileId: null,       /* the saved morph file this came from, so Save overwrites */
  fileName: null,
  picker: null,       /* 'preset' | 'file' | null — the step picker overlay */
}
let state = { ...INITIAL }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }

export const getMorph = () => state
export const useMorph = () => useSyncExternalStore(subscribe, getMorph, getMorph)
export function setMorph(patch) { state = { ...state, ...patch }; emit() }
export function resetMorph(patch = {}) { state = { ...INITIAL, ...patch }; emit() }

export function addStep(step) {
  state = { ...state, active: true, loopId: state.loopId ?? step.loopId, steps: [...state.steps, step] }
  emit()
}
export function updateStep(i, params) {
  const s = state.steps[i]
  if (!s) return
  const steps = state.steps.slice(); steps[i] = { ...s, params: { ...params } }
  state = { ...state, steps }; emit()
}
export function removeStep(i) {
  const steps = state.steps.filter((_, k) => k !== i)
  state = { ...state, steps, loopId: steps.length ? state.loopId : null, editing: state.editing === i ? null : state.editing }
  emit()
}
/* the step at `from` placed at `to` (drag reorder, plan 14 § 4) */
export function reorderStep(from, to) {
  const n = state.steps.length
  if (from === to || from < 0 || from >= n || to < 0 || to >= n) return
  const steps = state.steps.slice()
  const [s] = steps.splice(from, 1); steps.splice(to, 0, s)
  const e = state.editing
  const editing = e == null ? e : e === from ? to : (from < e && e <= to) ? e - 1 : (to <= e && e < from) ? e + 1 : e
  state = { ...state, steps, editing }
  emit()
}

/* the schema keys only — the step is the generator's settings, nothing of the layer's envelope */
export function pickParams(obj, schema) {
  const out = {}
  for (const p of schema) out[p.key] = obj?.[p.key] === undefined ? p.default : obj[p.key]
  return out
}
export const stepLabel = (step, i) => step.source?.label || `Step ${i + 1}`
