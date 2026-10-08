import { useEffect, useState } from 'react'
import KolLogo, { KOL_LOGO_VARIANTS, KOL_LOGO_NATURAL_DIMS } from '../../brand/logos/KolLogo'
import { AssetGrid, MediaTile, ViewToggle, Tooltip } from '@kolkrabbi/kol-component'
import { listMedia, mediaSrc, isImageType, bucketOptions, DEFAULT_BUCKET } from '../library/mediaLibrary'
import { useComposeState } from './state'
import { CANVAS_W, CANVAS_H } from './state'

/**
 * AssetsBody — left rail Assets tab content. Click a tile to insert a
 * shape{kind:'logo'} layer at the variant's natural aspect ratio.
 *
 * View toggle (list / grid) sits in the section header. List is the default
 * since this panel will grow more categories beyond Logos.
 */
const VIEW_OPTIONS = [
  { value: 'list', label: 'List view', icon: 'view-list' },
  { value: 'grid', label: 'Grid view', icon: 'grid' },
]

/* BUCKET THUMBNAILS (editor-chrome-review #12, 2026-09-30 — the user: *"in assets maybe show few
 * bucket thumbnails? to drag in as images"*; built by the agent while he slept, the source chosen
 * for review). The first store the host's media client lists, its first twelve images, as a grid
 * under Logos. A click inserts a photo layer at the canvas's full bounds, the same as the Photo
 * layer's own picker; the store is the host's (`<DesignEditor mediaClient>`), so nothing here
 * names a bucket. */
const THUMBS = 12
function ImageThumbs() {
  const { addLayer } = useComposeState()
  const [state, setState] = useState({ status: 'loading', items: [], bucket: null })
  useEffect(() => {
    const ac = new AbortController()
    const bucket = bucketOptions()[0]?.value ?? DEFAULT_BUCKET
    listMedia('', { bucket, signal: ac.signal })
      .then((objs) => setState({ status: 'ready', bucket, items: objs.filter((o) => isImageType(o.contentType)).slice(0, THUMBS) }))
      .catch((e) => { if (e.name !== 'AbortError') setState({ status: 'error', items: [], bucket }) })
    return () => ac.abort()
  }, [])
  if (state.status === 'error' || (state.status === 'ready' && !state.items.length)) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="kol-helper-10 uppercase tracking-widest text-meta">Images</p>
      {state.status === 'loading' ? (
        <p className="kol-helper-12 text-meta">Loading…</p>
      ) : (
        /* media's own grid item (`MediaTile`, a preview and a name) on the DS grid — the same
         * tile the media library's grid view draws, not a button grid built here */
        <AssetGrid cols={3} gap="gap-2">
          {state.items.map((o) => (
            <MediaTile
              key={o.key}
              name={o.key.split('/').pop()}
              preview={<img src={mediaSrc(o.key, state.bucket)} alt="" loading="lazy" className="h-full w-full object-cover" />}
              onClick={() => addLayer('photo', { src: mediaSrc(o.key, state.bucket), fit: 'cover' })}
            />
          ))}
        </AssetGrid>
      )}
    </div>
  )
}

export default function AssetsBody() {
  const { addLayer } = useComposeState()
  const [view, setView] = useState('list')

  const insertLogo = (variant) => {
    const dims = KOL_LOGO_NATURAL_DIMS[variant] ?? { w: 320, h: 320 }
    const x = (CANVAS_W - dims.w) / 2
    const y = (CANVAS_H - dims.h) / 2
    addLayer('shape', { variant, x, y, w: dims.w, h: dims.h })
  }

  return (
    <div className="px-4 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="kol-helper-10 uppercase tracking-widest text-meta">Logos</p>
        <ViewToggle
          variant="icon"
          viewMode={view}
          onViewChange={setView}
          options={VIEW_OPTIONS}
        />
      </div>
      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-2">
          {KOL_LOGO_VARIANTS.map((variant) => (
            <Tooltip key={variant} label={variant}><button aria-label={variant}
              type="button"
              onClick={() => insertLogo(variant)}
              className="bg-oq-04 hover:bg-oq-08 rounded p-3 flex flex-col items-center gap-2 cursor-pointer"
            >
              <span className="block w-full h-12 text-emphasis">
                <KolLogo variant={variant} className="block w-full h-full" />
              </span>
              <span className="kol-helper-10 text-meta normal-case tracking-normal truncate w-full text-center">
                {variant}
              </span>
            </button></Tooltip>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col">
          {KOL_LOGO_VARIANTS.map((variant) => (
            <li key={variant}>
              <Tooltip label={variant}><button aria-label={variant}
                type="button"
                onClick={() => insertLogo(variant)}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-oq-04 cursor-pointer text-left"
              >
                <span className="block w-8 h-6 shrink-0 text-emphasis">
                  <KolLogo variant={variant} className="block w-full h-full" />
                </span>
                <span className="kol-helper-12 text-emphasis normal-case tracking-normal truncate flex-1">
                  {variant}
                </span>
              </button></Tooltip>
            </li>
          ))}
        </ul>
      )}
      <ImageThumbs />
    </div>
  )
}
