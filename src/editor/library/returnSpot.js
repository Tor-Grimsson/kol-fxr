import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * returnSpot — Back lands where you left (plan 40 § 2.2, user 2026-10-24: *"going Back doesnt go to the patch you were
 * looking at"*). Home and the Library record their view and scroll when a card opens; a Back (a POP) to the page
 * restores both. A rail press is a PUSH and opens the page fresh.
 *
 * ponytail: the shell owns the page's scroller, so it is found as the tallest overflow-y box outside the rail; a KOL
 * seam (a scroll-restoring CatalogPage) replaces this if one ships.
 */
const KEY = (page) => `fxr.return.${page}`

const scroller = () => [...document.querySelectorAll('div')]
  .filter((d) => !d.closest('.kol-shell-rail-list') && /(auto|scroll)/.test(getComputedStyle(d).overflowY) && d.scrollHeight > d.clientHeight)
  .sort((a, b) => b.scrollHeight - a.scrollHeight)[0] ?? null

export function saveSpot(page, extra = {}) {
  try { sessionStorage.setItem(KEY(page), JSON.stringify({ ...readSpot(page), ...extra, scroll: scroller()?.scrollTop ?? 0 })) } catch { /* storage blocked */ }
}
export function readSpot(page) {
  try { return JSON.parse(sessionStorage.getItem(KEY(page)) || 'null') ?? {} } catch { return {} }
}
export function writeSpot(page, extra) {
  try { sessionStorage.setItem(KEY(page), JSON.stringify({ ...readSpot(page), ...extra })) } catch { /* storage blocked */ }
}

/** On a Back to the page (`active` — it is the one showing), scroll its scroller to where it was — retried over a few
 *  frames while the cards mount. */
export function useRestoreScroll(page, active = true) {
  const pop = useNavigationType() === 'POP'
  const { key } = useLocation()
  useEffect(() => {
    if (!pop || !active) return undefined
    const top = readSpot(page).scroll
    if (!top) return undefined
    let frames = 0, raf = 0
    const tick = () => {
      const el = scroller()
      if (el) el.scrollTop = top
      if ((!el || Math.abs(el.scrollTop - top) > 1) && ++frames < 60) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [page, pop, active, key])
}
