import { useState } from 'react'
import { Button, FullscreenOverlay, MediaLibrary } from '@kolkrabbi/kol-component'
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
  if (!open) return null

  const ok = !!file && (typeof accept === 'function' ? accept(file) : accept.includes(kindOf(file)))
  const use = () => {
    onSelect?.(client.mediaUrl(file.fullKey ?? file.key, bucket), { contentType: file.contentType, kind: kindOf(file) })
    onClose?.()
  }
  return (
    <FullscreenOverlay open scrim onClose={onClose}>
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
