import { useEffect } from 'react'

/**
 * Window › <panel> (plan 28 § 10): one `kol:open-tab` event names a tab, and the pane that owns it
 * switches to it. Each pane says which of its tabs it answers for.
 */
export const openTab = (tab) => window.dispatchEvent(new CustomEvent('kol:open-tab', { detail: { tab } }))

export function useOpenTab(tabs, onOpen) {
  const key = tabs.join('|')
  useEffect(() => {
    const on = (e) => { if (key.split('|').includes(e.detail?.tab)) onOpen(e.detail.tab) }
    window.addEventListener('kol:open-tab', on)
    return () => window.removeEventListener('kol:open-tab', on)
  }, [key, onOpen])
}
