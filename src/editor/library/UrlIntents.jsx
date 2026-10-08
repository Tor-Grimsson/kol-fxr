import { useEffect, useRef } from 'react'
import { useComposeState } from '../compose/state'
import { loadLibrary } from './LibraryProvider'
import { resetMorph } from '../morph/morphStore'
import { transport } from '../params/transport'

/**
 * UrlIntents — what a chrome does with `?open=<id>` and `?new=…` on mount (plans 08 + 09). Once;
 * the params leave the URL after, so a reload is a reload.
 *
 *   ?open=<id>   opens that saved file through `loadPreset` — after the chrome's own boot (the
 *                default-aspect seed runs in a mount effect after this one and was overwriting the
 *                file's aspect) — adopting its id and name so a plain Save overwrites it. A morph
 *                file also loads its steps into the morph store, so labs opens on the Morph tab.
 *   ?new=1       an empty frame: layers cleared, no current file.
 *   ?new=morph   the same, and the Morph tab's first-step picker opens.
 *
 * The draft-restore prompt stands down for both (compose/state), and labs' `?preset` seed yields.
 */
export function urlIntent() {
  const q = new URLSearchParams(window.location.search)
  return { open: q.get('open'), fresh: q.get('new') }
}

export default function UrlIntents() {
  const { loadPreset, clearLayers } = useComposeState()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    const url = new URL(window.location.href)
    const { open, fresh } = urlIntent()
    if (!open && !fresh) return
    if (open) {
      const item = (loadLibrary().preset ?? []).find((it) => it.id === open)
      if (item) {
        if (item.mode === 'morph' && item.morph) resetMorph({ active: true, ...item.morph, fileId: item.id, fileName: item.name ?? null })
        else resetMorph()
        /* a morph file is motion: it opens playing, in every chrome (the randomiser landed on step 1, still) */
        setTimeout(() => { loadPreset(item); if (item.mode === 'morph') transport.play() }, 0)
      } else if (typeof console !== 'undefined') console.warn(`open: no saved file ${open}`)
    } else if (fresh) {
      clearLayers()
      resetMorph(fresh === 'morph' ? { active: true, picker: 'preset' } : {})
    }
    /* strip the params on the next tick — this is a child effect and runs BEFORE the provider's
       restore check and labs' seed, which read the URL themselves */
    setTimeout(() => {
      url.searchParams.delete('open'); url.searchParams.delete('new')
      window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash)
    }, 0)
  }, [loadPreset, clearLayers])
  return null
}
