import { useRef, useState } from 'react'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import EditorIcon from '../icons/EditorIcon'
import MediaPicker from '../library/MediaPicker'
import { proxied, isVideoType } from '../library/mediaLibrary'
import { useLayerEdit } from '../compose/useLayerEdit'
import { saveClip } from '../lib/clipStore'
import { ensureWebcam } from '../lib/webcam'
import { useControlSize, stripClamp } from '../params/controlSize'

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
/**
 * The three ways pixels get into an effect layer, as one hook so the
 * full-pane empty state and the rail's SOURCE strip drive the SAME writes.
 * Returns the handlers plus the two nodes that must be mounted for them to
 * work (the hidden file input and the media picker modal).
 */
function useSourceInput(layer) {
  const { patch } = useLayerEdit(layer.id)
  const fileRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  /* The distressor eats VECTOR sources, not pixels: its layer is a loop, the
   * pick lands on the flat `svgSrc` param (markup when uploaded, URL when
   * picked from the library — the engine fetches), and the camera pane is
   * meaningless so it hides. Everything else below is the pixel path. */
  const svgMode = layer.type === 'loop' && layer.loopGroup === 'distress'

  const onUpload = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''   /* allow re-picking the same file */
    if (!file) return
    if (svgMode) {
      const reader = new FileReader()
      reader.onload = () => patch({ svgSrc: reader.result })
      reader.readAsText(file)
      return
    }
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
    if (svgMode) { patch({ svgSrc: proxied(url) }); return }
    patch({ src: proxied(url), srcType: isVideoType(contentType) ? 'video' : 'image' })
  }

  /* Live camera — request on this user gesture (permission UX + primes the
   * webcam registry), only then flag the layer; a denial changes nothing.
   * Front camera preferred (webcam.js facingMode). */
  const onCamera = () => {
    ensureWebcam(layer.id)
      .then(() => patch({ src: null, srcType: 'webcam' }))
      .catch(() => { /* camera denied / unavailable */ })
  }

  const nodes = (
    <>
      <input ref={fileRef} type="file" accept={svgMode ? '.svg,image/svg+xml' : 'image/*,video/*'} className="hidden" onChange={onUpload} />
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onLibraryPick} accept={svgMode ? 'svg' : 'all'} />
    </>
  )
  return {
    nodes,
    svgMode,
    openLibrary: () => setPickerOpen(true),
    openUpload: () => fileRef.current?.click(),
    openCamera: onCamera,
  }
}

/* SOURCE — the input strip, the effect rail's counterpart to the generative
 * rail's Generate/Style/Animation strip. An effect is an effect OF something,
 * and until now the only way to that something was the full-pane empty state,
 * which disappears the moment a source lands: picking an image meant you
 * could never switch to the camera without clearing the layer.
 *
 * Stateless SegmentedToggle (`value={null}` — the DS's action-strip mode):
 * these are three one-shot ACTIONS, not a selected state. Library and Upload
 * both yield image OR video depending on the file, so there is no honest way
 * to map a live `srcType` back onto one cell. */
export function SourceStrip({ layer }) {
  const cs = useControlSize()
  const src = useSourceInput(layer)
  return (
    <>
      <SegmentedToggle
        value={null}
        onChange={(v) => ({ library: src.openLibrary, upload: src.openUpload, camera: src.openCamera }[v]?.())}
        options={src.svgMode ? SVG_SOURCE_OPTIONS : SOURCE_OPTIONS}
        size={cs}
        ariaLabel="Source"
        className={stripClamp(cs)}
      />
      {src.nodes}
    </>
  )
}

const SOURCE_OPTIONS = [
  { value: 'library', label: 'Library' },
  { value: 'upload', label: 'Upload' },
  { value: 'camera', label: 'Camera' },
]

/* no Camera pane — a webcam yields pixels, the distressor needs paths */
const SVG_SOURCE_OPTIONS = SOURCE_OPTIONS.slice(0, 2)

export default function LabsSourcePicker({ layer }) {
  const src = useSourceInput(layer)

  /* oq-48, not fg-meta: these panes carry a 28px EditorIcon, and alpha ink
   * multiplies where strokes overlap (the opaque-icons law). oq-48 reads
   * identical on the resting surface but stays opaque. Hover lifts the GROUND
   * as well as the ink — a full-height pane is a big target and ink alone
   * barely reads at this size. */
  const pane = 'flex-1 flex flex-col items-center justify-center gap-3 cursor-pointer text-oq-48 hover:text-emphasis hover:bg-oq-02 transition-colors'

  return (
    <div className="w-full h-full flex items-stretch p-6 gap-px">
      <button type="button" className={pane} onClick={src.openLibrary}>
        <EditorIcon name="image" size={28} />
        <span className="kol-mono-12">From library</span>
      </button>
      <div className="w-px" style={{ background: 'var(--kol-fg-08)' }} />
      <button type="button" className={pane} onClick={src.openUpload}>
        <EditorIcon name="upload" size={28} />
        <span className="kol-mono-12">Upload</span>
      </button>
      <div className="w-px" style={{ background: 'var(--kol-fg-08)' }} />
      <button type="button" className={pane} onClick={src.openCamera}>
        <EditorIcon name="camera" size={28} />
        <span className="kol-mono-12">Camera</span>
      </button>
      {src.nodes}
    </div>
  )
}
