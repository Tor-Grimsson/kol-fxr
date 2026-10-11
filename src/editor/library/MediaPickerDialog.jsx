import { useEffect, useRef, useState } from 'react'
import { Button, CloseButton, FullscreenOverlay, MediaLibrary } from '@kolkrabbi/kol-component'
import { SETTINGS_BASE } from '@kolkrabbi/kol-component/organisms/MediaLibraryPages'
import { getMediaClient } from './mediaLibrary'

/* ponytail: hand-measured header + count line + footer, as picker A; tune if the chrome changes */
const CHROME = 280
const kindOf = (o) => (o?.contentType ?? '').split('/')[0]

/**
 * MediaPickerDialog — the editor's one media picker, on picker A's shape (kol-ds-ui
 * `apps/media/picker`, the user 2026-10-09): `FullscreenOverlay scrim` around
 * `MediaLibrary variant="browse"` (columns · rows · grid over the buckets), the selection reported
 * by `onPickFile`, Cancel · Use in a footer. It replaces `MediaLibrary variant="modal"` at every
 * door — the modal's own grid | list listing was the other picker.
 *
 * Read-only: no verbs, no drop, no trash — a picker picks. Its settings are held here so the
 * library page's stored settings are never touched.
 *
 * @param {boolean}  open      mounted and visible
 * @param {string[]|Function} accept  kinds Use takes (`['image', 'video']`), or `(o) => bool`
 * @param {Function} onClose   dismissal — scrim, Esc, Cancel, after Use
 * @param {Function} onSelect  `(url, { contentType, kind })` — the modal's signature, unchanged
 */
export default function MediaPickerDialog({ open, accept = ['image', 'video'], onClose, onSelect }) {
  const client = getMediaClient()
  const [settings, setSettings] = useState(() => ({ ...SETTINGS_BASE, columnHeight: `calc(var(--kol-media-picker-h) - ${CHROME}px)` }))
  const [bucket, setBucket] = useState(undefined)
  const [file, setFile] = useState(null)
  const ok = !!file && (typeof accept === 'function' ? accept(file) : accept.includes(kindOf(file)))
  const use = () => {
    onSelect?.(client.mediaUrl(file.fullKey ?? file.key, bucket), { contentType: file.contentType, kind: kindOf(file) })
    onClose?.()
  }
  /* ENTER IS USE (the user, 2026-10-10: "enter does not select 'use'") — on a usable pick, unless a
     text field has the key (the library's search) */
  const useRef_ = useRef(use); useRef_.current = ok ? use : null
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t?.closest?.('input, textarea, [contenteditable="true"]')) return
      if (!useRef_.current) return
      e.preventDefault(); e.stopPropagation()
      useRef_.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])
  if (!open) return null
  return (
    /* the close rides the header row, after the gear (kol-component 0.251.0, MediaPickerCloseOnTheHeaderRow) —
       the overlay's own X floated above it and lined up with nothing */
    <FullscreenOverlay open scrim onClose={onClose} closeButton={false}>
      <div className="kol-media-picker gap-4">
        <MediaLibrary
          variant="browse"
          client={client}
          title="Media"
          bucket={bucket}
          onBucketChange={setBucket}
          settings={settings}
          onSettingsChange={setSettings}
          onPickFile={setFile}
          headerTrailing={<CloseButton onClick={onClose} />}
        />
        <div className="mt-auto flex items-center justify-end gap-4">
          <span className="kol-mono-12 text-fg-48 truncate mr-auto">{file ? file.key : 'Select a file'}</span>
          <Button tone="grey" size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" disabled={!ok} onClick={use}>Use</Button>
        </div>
      </div>
    </FullscreenOverlay>
  )
}
