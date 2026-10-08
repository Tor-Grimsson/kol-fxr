import { useEffect, useRef } from 'react'
import { useComposeState } from '../compose/state'
import { loadLibrary } from './LibraryProvider'

/**
 * OpenFromUrl — `?open=<id>` opens that saved preset (plan 08: a file card on Home). Once, on mount:
 * the item comes from the stored library (cloud files are merged there at sign-in), loads through
 * `loadPreset` — which adopts its id and name, so a plain Save overwrites it — and the param leaves
 * the URL so a reload is a reload, not a second open. Mounted inside EditorProviders.
 */
export default function OpenFromUrl() {
  const { loadPreset } = useComposeState()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    const url = new URL(window.location.href)
    const id = url.searchParams.get('open')
    if (!id) return
    const item = (loadLibrary().preset ?? []).find((it) => it.id === id)
    /* after the chrome's own boot: the editor and labs seed the default aspect in a mount effect
       that runs after this one, and it was overwriting the opened file's aspect */
    if (item) setTimeout(() => loadPreset(item), 0)
    else if (typeof console !== 'undefined') console.warn(`open: no saved preset ${id}`)
    url.searchParams.delete('open')
    window.history.replaceState(window.history.state, '', url.pathname + (url.search || '') + url.hash)
  }, [loadPreset])
  return null
}
