import { useRef, useState } from 'react'
import EditorIcon from '../icons/EditorIcon'
import MediaPicker from '../library/MediaPicker'
import { proxied, isVideoType } from '../library/mediaLibrary'
import { useLayerEdit } from '../compose/useLayerEdit'
import { saveClip } from '../lib/clipStore'

/**
 * LabsSourcePicker — the two-pane empty state an effect shows while its
 * layer has no pixels yet (plan.md Phase 11.3), matching labs:
 *
 *   ┌───────────────┬───────────────┐
 *   │  FROM LIBRARY │    UPLOAD     │
 *   └───────────────┴───────────────┘
 *
 * Both panes, always — they are not alternatives, they are the two ways in.
 * Library = the kol-media CDN through the same-origin `/media` proxy (a
 * cross-origin load would taint the canvas and break every filter and
 * export); Upload = a local file, video blobs persisted to the clipStore
 * side-channel keyed by layer id so a draft restore can re-mint the URL.
 */
export default function LabsSourcePicker({ layer }) {
  const { patch } = useLayerEdit(layer.id)
  const fileRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  const onUpload = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''   /* allow re-picking the same file */
    if (!file) return
    if (file.type.startsWith('video/')) {
      saveClip(layer.id, file)
      patch({ src: URL.createObjectURL(file), srcType: 'video' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => patch({ src: reader.result, srcType: 'image' })
    reader.readAsDataURL(file)
  }

  const onLibraryPick = (url, { contentType } = {}) => {
    patch({ src: proxied(url), srcType: isVideoType(contentType) ? 'video' : 'image' })
  }

  const pane = 'flex-1 flex flex-col items-center justify-center gap-3 cursor-pointer text-meta hover:text-emphasis'

  return (
    <div className="w-full h-full flex items-stretch p-6 gap-px">
      <button type="button" className={pane} onClick={() => setPickerOpen(true)}>
        <EditorIcon name="image" size={28} />
        <span className="kol-mono-12">From library</span>
      </button>
      <div className="w-px" style={{ background: 'var(--kol-fg-08)' }} />
      <button type="button" className={pane} onClick={() => fileRef.current?.click()}>
        <EditorIcon name="upload" size={28} />
        <span className="kol-mono-12">Upload</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={onUpload}
      />
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onLibraryPick} />
    </div>
  )
}
