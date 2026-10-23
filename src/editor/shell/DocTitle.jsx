import { useEffect, useRef } from 'react'
import { useZoom } from './zoomStore'
import { useComposeState } from '../compose/state'
import { markSaved, docOf, isDirty, useSavedMark } from '../compose/savedMark'

/**
 * DocTitle — the thin centred line between the toolbar and the ruler (spec R1.2, plan 30 § 5):
 * Affinity's `<Untitled> @ 130%*`. READ-ONLY and no control: renaming is File › Save as…, the
 * zoom resets with ⌘0 / View. A `*` follows the name while the document differs from its last
 * save or open. It was the status bar under the canvas until plan 30 (the user: "this is where
 * untitled would go! middle above ruler"); the DS zoom chip stays hidden while it is mounted.
 */
export default function DocTitle() {
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
  return (
    /* no top hairline (plan 37 § 8.9 — "looks double on top"): the toolbar band above already draws its
       bottom one on the same line */
    <div className="kol-editor-doctitle flex items-center justify-center h-5 px-3 kol-helper-10 text-meta">
      <span className="truncate">{`${currentPresetName || 'Untitled'}${dirty ? '*' : ''} @ ${Math.round(zoom * 100)}%`}</span>
    </div>
  )
}
