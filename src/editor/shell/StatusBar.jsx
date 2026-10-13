import { useEffect, useRef } from 'react'
import { Button } from '@kolkrabbi/kol-component'
import { useZoom } from './zoomStore'
import { useComposeState } from '../compose/state'
import { markSaved, docOf, isDirty, useSavedMark } from '../compose/savedMark'

/**
 * StatusBar — the thin strip under the canvas (spec R1.2): Affinity's `<Untitled> @ 130%`.
 * READ-ONLY (plan 29 § 1): Affinity's bar only displays the name; renaming is File › Save as….
 * A `*` follows while the document differs from its last save or open. Clicking the `%` resets
 * zoom (the DS chip is hidden while this bar is mounted, until the canvas grows a `showZoomChip`
 * seam — plan 17). The Navigator left for a left-rail tab (plan 29 § 2, plan 24 § 7).
 */
export default function StatusBar() {
  const state = useComposeState()
  const { currentPresetId, currentPresetName } = state
  const doc = docOf(state)
  const saved = useSavedMark()
  /* opening a file (or a fresh document) is a clean slate — the document it loaded is the saved
     state. One frame later, so it is taken after the mount's own effects settle (the canvas height
     syncs to the aspect after the first render, and a mark taken before that read as an edit). */
  const docRef = useRef(doc); docRef.current = doc
  useEffect(() => {
    const id = requestAnimationFrame(() => markSaved(docRef.current))
    return () => cancelAnimationFrame(id)
  }, [currentPresetId])
  const dirty = isDirty(doc, saved)
  const zoom = useZoom()
  /* the viewport's own reset (⌘0) — it listens on the window */
  const resetZoom = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', metaKey: true, ctrlKey: true }))
  return (
    <div className="kol-editor-statusbar relative flex items-center gap-1 h-6 px-3 border-t border-oq-08 bg-surface-primary kol-helper-10 text-meta">
      <span className="truncate">{`${currentPresetName || 'Untitled'}${dirty ? '*' : ''}`}</span>
      <span>@</span>
      <Button tone="ghost" quiet size="xs" onClick={resetZoom} title="Reset zoom">{`${Math.round(zoom * 100)}%`}</Button>
    </div>
  )
}
