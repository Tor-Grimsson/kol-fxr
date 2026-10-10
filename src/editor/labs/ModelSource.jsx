import { useRef, useState } from 'react'
import { Button, LabeledControlSection } from '@kolkrabbi/kol-component'
import { proxied } from '../library/mediaLibrary'
import { useControlSize } from '../params/controlSize'
import MediaPickerDialog from '../library/MediaPickerDialog'

/**
 * ModelSource — the 3D scene's Model file (plan 26 § 15; the user: "accept .obj uploads such that f.e.
 * a human form or statue could be rotated on a loop"). Models live in the app's R2 bucket (uploaded
 * with `bucket-r2 up <file> meshes/<name>`, the ruled write path), so a pick stores the bucket URL and
 * the saved file references it — it survives reload, sync and other devices. A local file still loads
 * (a data URL, for trying one before it goes in the bucket); it rides in the file, so keep it small.
 */
const MESH_RE = /\.(obj|glb|gltf|stl)$/i
const isMesh = (o) => MESH_RE.test(o.key ?? o.name ?? '')
const typeOf = (name) => (name.match(MESH_RE)?.[1] ?? 'obj').toLowerCase()
const nameOf = (src) => (src?.startsWith('data:') ? 'Local file' : decodeURIComponent(String(src ?? '').split('/').pop() || '—'))

export default function ModelSource({ layer, setProp }) {
  const cs = useControlSize()
  const [open, setOpen] = useState(false)
  const fileRef = useRef(null)
  const set = (src, type) => { setProp('meshSrc', src); setProp('meshType', type) }
  const onUpload = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const r = new FileReader()
    r.onload = () => set(r.result, typeOf(file.name))
    r.readAsDataURL(file)
  }
  return (
    <LabeledControlSection label="Model" divided>
      <span className="kol-mono-12 text-meta truncate">{nameOf(layer.meshSrc)}</span>
      <div className="grid grid-cols-2 gap-2">
        <Button tone="primary" size={cs} onClick={() => setOpen(true)}>From library</Button>
        <Button tone="primary" size={cs} onClick={() => fileRef.current?.click()}>Upload</Button>
      </div>
      <input ref={fileRef} type="file" accept=".obj,.glb,.gltf,.stl" className="hidden" onChange={onUpload} />
      <MediaPickerDialog open={open} accept={isMesh} onClose={() => setOpen(false)} onSelect={(url) => { setOpen(false); set(proxied(url), typeOf(url)) }} />
    </LabeledControlSection>
  )
}
