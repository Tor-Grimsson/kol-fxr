import { useEffect, useRef, useState } from 'react'
import { Button, Input, Dropdown, FullscreenOverlay, MediaViewer } from '@kolkrabbi/kol-component'
import EditorIcon from '../icons/EditorIcon'
import { listMedia, mediaUrl, mediaSrc, isImageType, isVideoType, formatSize, BUCKET_OPTIONS, DEFAULT_BUCKET } from './mediaLibrary'

/* SVG is an image/* type, so 'image' still matches it — 'svg' narrows to
 * vector-only for consumers that need real paths (the distress engine). */
const isSvgType = (t) => /svg/i.test(t || '')

/**
 * MediaPicker — modal browser over the kol-media CDN bucket (the labs
 * LibraryPage model). Folder drill-down + breadcrumb over the flat key list,
 * a lightbox preview (image / video, ←/→ step, Esc close, name + size), a
 * click-to-copy public URL, and the "Use" pick.
 *
 * Pick contract (unchanged — called from EditorFooter + LayerInspector):
 * onPick(url, { contentType }); the caller rewrites the URL through
 * `proxied()` before storing it on a layer. `accept`: 'image' | 'video' |
 * 'svg' | 'all' filters which files are pickable/shown.
 *
 * The whole bucket is listed once on open (listMedia('')) and the folder tree
 * is derived client-side from key path segments — `prefix` is the current
 * folder, the text input is a secondary name filter WITHIN it.
 */

/* Split a scoped object list into immediate sub-folders (first path segment
 * below `prefix`) + files that live directly in `prefix`. displayKey is the
 * name relative to the current folder. */
function partition(objects, prefix) {
  const folderSet = new Set()
  const files = []
  for (const o of objects) {
    const rel = prefix ? o.key.slice(prefix.length) : o.key
    const slash = rel.indexOf('/')
    if (slash !== -1) folderSet.add(rel.slice(0, slash + 1))
    else files.push({ ...o, displayKey: rel })
  }
  return { folders: [...folderSet].sort(), files }
}

/* Inline directional chevron — the editor icon registry has no left/right
 * chevron, and a rotated one reads oddly at button sizes. */
function Chevron({ dir = 'left', size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: dir === 'right' ? 'scaleX(-1)' : undefined }}>
      <path d="M14.5 6L8.5 12L14.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* Lightbox preview over `files` at `index` — the DS `MediaViewer` (ruled
 * 2026-08-27, EditorOverlaysOnFullscreenOverlay): a paged media view is
 * MediaViewer on FullscreenOverlay, not a third archetype. It owns the
 * scrim, Escape, backdrop close, the close button, scroll lock, the focus
 * trap, ←/→ paging and the modal z tier — all of which this file used to
 * hand-roll at `z-[1100]` behind an `rgba(0,0,0,0.88)` + blur(6px) scrim of
 * its own, above the DS's whole stacking ladder. The per-item row (name,
 * size, position, Use, Copy URL) rides MediaViewer's `actions` slot. */
function MediaLightbox({ files, index, onClose, onIndexChange, onUse, accept, bucket }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => { setCopied(false) }, [index])

  /* `mediaSrc`, not `mediaUrl`: it proxies R2 and leaves the two B2 hosts
     direct. Copy URL stays the real public URL — that is what you would paste. */
  const media = files.map((f) => ({
    url: mediaSrc(f.key, bucket),
    alt: f.displayKey,
    kind: isVideoType(f.contentType) ? 'video' : 'image',
  }))

  const copyUrl = async (f) => {
    try { await navigator.clipboard.writeText(mediaUrl(f.key, bucket)) } catch { /* blocked */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <MediaViewer
      open
      media={media}
      index={index}
      onIndexChange={onIndexChange}
      onClose={onClose}
      actions={(_item, i) => {
        const f = files[i]
        if (!f) return null
        const pickable =
          accept === 'video' ? isVideoType(f.contentType)
          : accept === 'image' ? isImageType(f.contentType)
          : accept === 'svg' ? isSvgType(f.contentType)
          : isImageType(f.contentType) || isVideoType(f.contentType)
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <span className="kol-mono-12 text-emphasis">{f.displayKey}</span>
              <span className="kol-mono-12 text-meta">{formatSize(f.size)}</span>
              <span className="kol-mono-10 text-meta">{i + 1} / {files.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {pickable && (
                <Button variant="primary" size="sm" onClick={() => onUse(f)}>Use</Button>
              )}
              <Button variant="primary" size="sm" onClick={() => copyUrl(f)}>
                {copied ? 'Copied' : 'Copy URL'}
              </Button>
            </div>
          </div>
        )
      }}
    />
  )
}

export default function MediaPicker({ open, onClose, onPick, accept = 'all' }) {
  /* THREE STORES, not one (2026-08-28). The hand-rolled mediaLibrary knew only
   * R2's ~430 files; the other ~7,500 across the two B2 buckets had no way in.
   * Switching store re-lists — the drill-down below is client-side over one
   * listing, so the bucket is part of that fetch, not a filter on it. */
  const [bucket, setBucket] = useState(DEFAULT_BUCKET)
  const [prefix, setPrefix] = useState('')       /* current folder (ends '/'), '' = root */
  const [filter, setFilter] = useState('')        /* secondary name filter within the folder */
  const [allObjects, setAllObjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  /* List the whole bucket once per open (and again on a store switch);
   * drill-down is client-side. */
  useEffect(() => {
    if (!open) return undefined
    const ac = new AbortController()
    let cancelled = false
    setLoading(true)
    setError(null)
    setPrefix('')
    setFilter('')
    setLightboxIndex(null)
    setAllObjects([])
    listMedia('', { bucket, signal: ac.signal })
      .then((objs) => { if (!cancelled) setAllObjects(objs) })
      .catch((e) => { if (!cancelled && e.name !== 'AbortError') setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; ac.abort() }
  }, [open, bucket])

  /* Esc closes the picker — but only when the lightbox isn't up (it owns Esc
   * to step back one level first). */
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape' && lightboxIndex === null) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, lightboxIndex])

  if (!open) return null

  const wanted = (o) =>
    accept === 'video' ? isVideoType(o.contentType)
    : accept === 'image' ? isImageType(o.contentType)
    : accept === 'svg' ? isSvgType(o.contentType)
    : isImageType(o.contentType) || isVideoType(o.contentType)

  const scoped = prefix ? allObjects.filter((o) => o.key.startsWith(prefix)) : allObjects
  const { folders, files } = partition(scoped, prefix)
  const q = filter.trim().toLowerCase()
  const visibleFolders = q ? folders.filter((f) => f.toLowerCase().includes(q)) : folders
  const visibleFiles = (q ? files.filter((o) => o.displayKey.toLowerCase().includes(q)) : files).filter(wanted)
  const crumbs = prefix ? prefix.replace(/\/$/, '').split('/') : []

  /* The URL is built on the SELECTED bucket's own host — callers wrap it in
   * `proxied()`, which is a no-op for the two B2 hosts (they send CORS `*`)
   * and rewrites only R2. */
  const pick = (o) => { onPick?.(mediaUrl(o.key, bucket), { contentType: o.contentType }); onClose?.() }

  return (
    <>
      <FullscreenOverlay open onClose={onClose}>
        <div
          className="bg-surface-primary border border-fg-08 rounded shadow-xl flex flex-col"
          style={{ width: 720, maxWidth: '100%', maxHeight: 'calc(100vh - 48px)' }}
        >
          <div className="flex items-center gap-3 px-5 h-12 border-b border-fg-08 shrink-0">
            <span className="kol-helper-12 text-emphasis whitespace-nowrap">Media library</span>
            <Dropdown
              variant="grey"
              options={BUCKET_OPTIONS}
              value={bucket}
              onChange={setBucket}
              aria-label="Store"
            />
            <Input
              variant="filled"
              size="sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name"
              className="flex-1"
            />
            <Button iconComponent={EditorIcon}
              variant="primary" size="sm" quiet
              iconOnly="close" iconSize={14}
              aria-label="Close"
              onClick={onClose}
            />
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-5 h-9 border-b border-fg-08 shrink-0 kol-mono-12 text-meta overflow-x-auto">
            <button type="button" className="hover:text-emphasis transition-colors whitespace-nowrap" onClick={() => setPrefix('')}>root</button>
            {crumbs.map((seg, i) => {
              const to = crumbs.slice(0, i + 1).join('/') + '/'
              return (
                <span key={to} className="flex items-center gap-1 whitespace-nowrap">
                  <span>/</span>
                  <button type="button" className="hover:text-emphasis transition-colors" onClick={() => setPrefix(to)}>{seg}</button>
                </span>
              )
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
            {error ? (
              <p className="kol-helper-12 text-ui-error">Couldn’t load: {error}</p>
            ) : loading ? (
              <p className="kol-helper-12 text-meta">Loading…</p>
            ) : (
              <>
                {visibleFolders.length > 0 && (
                  <ul className="flex flex-col mb-4 list-none m-0 p-0">
                    {visibleFolders.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 py-2 px-1 border-b border-fg-08 cursor-pointer hover:bg-fg-04 transition-colors rounded"
                        onClick={() => { setPrefix(prefix + f); setFilter('') }}
                      >
                        <span className="kol-mono-12 text-emphasis flex-1">{f}</span>
                        <Chevron dir="right" size={14} />
                      </li>
                    ))}
                  </ul>
                )}

                {visibleFiles.length === 0 ? (
                  <p className="kol-helper-12 text-meta">Nothing here{filter ? ` for “${filter}”` : ''}.</p>
                ) : (
                  <ul className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] list-none m-0 p-0">
                    {visibleFiles.map((o, idx) => (
                      <li
                        key={o.key}
                        className="cursor-pointer"
                        title={o.key}
                        /* CLICK LOADS. It used to open the lightbox and make
                           you press Use in there — two steps and a full-screen
                           detour to pick a thumbnail you could already see
                           (user, 2026-08-27). The lightbox is still reachable
                           for a proper look: it is the ⤢ on hover. */
                        onClick={() => pick(o)}
                      >
                        <div className="group relative aspect-square bg-fg-04 rounded overflow-hidden border border-fg-08 hover:border-fg-24 transition-colors">
                          {isVideoType(o.contentType) ? (
                            <video src={mediaSrc(o.key, bucket)} muted preload="metadata" className="w-full h-full object-cover" />
                          ) : (
                            <img src={mediaSrc(o.key, bucket)} alt="" loading="lazy" className="w-full h-full object-cover" />
                          )}
                          {/* Preview — the old click target, demoted to an
                              opt-in so the tile itself can just load. */}
                          <button
                            type="button"
                            aria-label={`Preview ${o.displayKey}`}
                            title="Preview"
                            className="absolute top-1 right-1 w-7 h-7 inline-flex items-center justify-center rounded bg-oq-08 text-oq-64 hover:text-emphasis opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx) }}
                          >
                            <EditorIcon name="maximize" size={12} />
                          </button>
                        </div>
                        <p className="kol-helper-10 text-meta truncate mt-1">{o.displayKey}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </FullscreenOverlay>

      {lightboxIndex !== null && visibleFiles[lightboxIndex] && (
        <MediaLightbox
          files={visibleFiles}
          index={lightboxIndex}
          accept={accept}
          bucket={bucket}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          onUse={pick}
        />
      )}
    </>
  )
}
