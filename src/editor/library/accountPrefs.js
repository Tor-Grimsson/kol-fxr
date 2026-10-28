/**
 * accountPrefs — the preferences that follow the account (plan 43 § 3.2, user ruling 2026-10-28: "Look + workflow").
 *
 *   theme     the UI theme (kol-framework's `kol-theme`)
 *   mode      the remembered chrome (`kol-editor:mode`)
 *   settings  the app defaults (`appSettings`: aspect, loop palette, autoplay, clip to frame, roll scopes, loop length…)
 *
 * Stays on the device: `previewRes` (a machine's GPU budget), Simple mode (`kol-desktop`), grid, view size — none of
 * them are written here. Shortcuts are not customisable in fxr, so there is nothing of theirs to carry.
 *
 * localStorage stays the instant boot cache; the account's copy lands on sign-in (and on a restored session's `/api/me`)
 * and wins; every later change is written through, a beat later, as one PATCH.
 */
import { useEffect } from 'react'
import { applyTheme, THEME_STORAGE_KEY } from '@kolkrabbi/kol-framework'
import { getAppSettings, setSettingsStore } from '../lib/appSettings'
import { getMode, setMode, setModeListener } from '../mode'
import { useAccount, updateAccount } from './libraryApi'

const DEVICE = ['previewRes']
const portable = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !DEVICE.includes(k)))
const readTheme = () => { try { return localStorage.getItem(THEME_STORAGE_KEY) || 'system' } catch { return 'system' } }

/* one PATCH per burst of changes */
let pending = {}
let timer = null
function queue(patch) {
  pending = { ...pending, ...patch }
  clearTimeout(timer)
  timer = setTimeout(() => { const prefs = pending; pending = {}; updateAccount({ prefs }).catch(() => { /* offline — the device keeps it */ }) }, 600)
}

export function useAccountPrefs() {
  const account = useAccount()
  const id = account?.id
  const prefs = account?.prefs
  useEffect(() => {
    if (!id) return undefined
    const p = prefs ?? {}
    /* a new account starts from this device's choices */
    if (!p.theme && !p.mode && !p.settings) queue({ theme: readTheme(), ...(getMode() ? { mode: getMode() } : {}), settings: portable(getAppSettings()) })
    /* the account's copy wins on arrival */
    if (p.theme && p.theme !== readTheme()) applyTheme(p.theme)
    if (p.mode && p.mode !== getMode()) setMode(p.mode)
    setSettingsStore({
      /* the device's own keys survive the account's copy */
      load: async () => (p.settings ? { ...p.settings, ...Object.fromEntries(DEVICE.map((k) => [k, getAppSettings()[k]])) } : null),
      save: (s) => queue({ settings: portable(s) }),
    })
    /* the theme has no event of its own; its writer stamps <html data-theme> */
    let theme = readTheme()
    const mo = new MutationObserver(() => { const t = readTheme(); if (t !== theme) { theme = t; queue({ theme: t }) } })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    setModeListener((m) => queue({ mode: m }))
    return () => { mo.disconnect(); setModeListener(null); setSettingsStore(null) }
    /* re-applied when the prefs change — a profile edited on another device arrives through /api/me */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, JSON.stringify(prefs ?? null)])
}
