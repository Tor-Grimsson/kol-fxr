import { useRef, useState } from 'react'
import { Button, SegmentedToggle } from '@kolkrabbi/kol-component'
import { SPREAD, useSheetChrome } from '../mobile/CategoryScreen'
import { proxied, isVideoType } from '../library/mediaLibrary'
import { useLayerEdit } from '../compose/useLayerEdit'
import { saveClip } from '../lib/clipStore'
import { ensureWebcam } from '../lib/webcam'
import { useControlSize, stripClamp } from '../params/controlSize'
import MediaPickerDialog from '../library/MediaPickerDialog'

/* SVG is `image` by kind in the DS library, so a vector-only door reads the object itself. */
const isSvgObject = (o) => /\.svg$/i.test(o.key) || /svg/i.test(o.contentType || '')

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
      {/* THE DS MODAL LIBRARY (2026-10-07) — the editor's own picker is retired; `accept` is what this
         door can take: vector only for an SVG source (`image` by kind, so a function), else image or video. */}
      <MediaPickerDialog open={pickerOpen} accept={svgMode ? isSvgObject : ['image', 'video']} onClose={() => setPickerOpen(false)} onSelect={onLibraryPick} />
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

/* THE DOORS, AS A COLUMN (2026-10-06; the user: "it seems weird to overlay 3 columns for upload,
 * why not use some sort of modal"). Three full-height panes broke at a half-width window and on a
 * phone; these are the randomiser's card rows, and the callers put the card around them:
 * `LabsSourceCard` on labs' stage, MobileView's own scrim and Back on the randomiser. */
export default function LabsSourcePicker({ layer }) {
  const src = useSourceInput(layer)
  return (
    <div className="flex flex-col gap-2">
      <Button tone="primary" size="lg" className={SPREAD} iconLeft="image" iconRight="image" onClick={src.openLibrary}>From library</Button>
      <Button tone="primary" size="lg" className={SPREAD} iconLeft="upload" iconRight="upload" onClick={src.openUpload}>Upload</Button>
      {!src.svgMode && (
        <Button tone="primary" size="lg" className={SPREAD} iconLeft="camera" iconRight="camera" onClick={src.openCamera}>Camera</Button>
      )}
      {src.nodes}
    </div>
  )
}

/* Labs' card: the effect's name on top, the doors, Back (which drops the empty layer, so the entry
 * card comes back). The same card as the catalog's, one step on. */
export function LabsSourceCard({ layer, title, onBack }) {
  useSheetChrome(onBack)
  return (
    <div className="fixed inset-y-0 right-0 left-[var(--fxr-rail,0px)] kol-overlay-scrim flex flex-col items-center overflow-y-auto p-6" style={{ zIndex: 'var(--kol-z-modal)' }}>
      <div className="my-auto w-full max-w-sm rounded p-8 flex flex-col gap-6" style={{ background: 'var(--kol-surface-primary)' }}>
        <div className="flex flex-col gap-2">
          <span className="kol-eyebrow text-body">{title}</span>
          <span className="kol-mono-12 text-meta">Pick the media it works on.</span>
        </div>
        <LabsSourcePicker layer={layer} />
        <Button tone="grey" size="lg" className={SPREAD} iconLeft="arrow-left" iconRight="arrow-left" onClick={onBack}>Back</Button>
      </div>
    </div>
  )
}
