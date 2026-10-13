import { useEffect, useState } from 'react'

/**
 * The saved mark (plan 29 § 1) — the document as it was at the last save or open, so the status
 * bar can draw Affinity's `*` while anything differs from it: the layers and the canvas (aspect,
 * size, fill, backdrop). Every part is immutable state or a primitive, so identity is the test.
 */
const PARTS = ['layers', 'aspect', 'canvasW', 'canvasH', 'canvasFill', 'canvasFillOpacity', 'infiniteFill']

let saved = null
const subs = new Set()

export const docOf = (state) => Object.fromEntries(PARTS.map((k) => [k, state[k]]))
export const isDirty = (doc, mark) => (mark ? PARTS.some((k) => doc[k] !== mark[k]) : doc.layers.length > 0)

export function markSaved(doc) {
  saved = doc
  subs.forEach((f) => f(saved))
}

export function useSavedMark() {
  const [v, setV] = useState(saved)
  useEffect(() => {
    subs.add(setV)
    return () => subs.delete(setV)
  }, [])
  return v
}
