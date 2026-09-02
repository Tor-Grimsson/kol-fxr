import { useEffect, useRef } from 'react'
import { setRailExtras, RAIL_EXTRA_PREFIX } from '../../railExtras'
import { useComposeState } from '../compose/state'
import { useLabsLayer } from './useLabsLayer'
import { buildLabsCatalog, SECTION_ICONS } from './catalog'
import { transport } from '../params/transport'
import { isMobileDevice, wantsDesktop } from '../mobile/device'

/**
 * LabsNav — labs mode's left rail (plan.md Phase 11.3): the persistent,
 * always-visible, method-grouped category nav from labs.kolkrabbi.io.
 *
 * The WHAT — sections, groups, category leaves, pick semantics — is the
 * labs CATALOG (`./catalog`, extracted 2026-09-01 so the mobile chrome can
 * consume the same tree). This file owns the HOW of the desktop rail only:
 * the remember-the-source policy and the fold into `railExtras`, which the
 * shell's `NavRail` renders.
 *
 * Every pick goes through `setOnly` — labs' one-layer invariant (swap, not
 * stack). Interfaces is deliberately absent: an app-sized composer, accepted
 * out-of-scope in AGENT-CONTEXT's deferred pool.
 */

export default function LabsNav() {
  const { addFilter, patchFilter } = useComposeState()
  const { layer, setOnly } = useLabsLayer()

  /* THE SOURCE OUTLIVES THE LAYER. Picking a generative preset replaces the
   * photo layer outright (setOnly keeps ONE layer), so hopping Effects →
   * Generative → Effects used to drop the media and land you back on the
   * From library | Upload empty state (user, 2026-08-27). Remember the last
   * real source here — a ref, so it survives the swap the layer does not —
   * and re-seed the next photo layer with it.
   *
   * Webcam is deliberately NOT remembered: its stream is stopped when the
   * layer goes, and silently re-opening the camera on a nav click is not a
   * restore, it is a surprise. Re-pick Camera to turn it back on. */
  const lastSourceRef = useRef(null)
  useEffect(() => {
    if (layer?.type === 'photo' && layer.src) {
      lastSourceRef.current = { src: layer.src, srcType: layer.srcType, fit: layer.fit }
    }
  }, [layer?.type, layer?.src, layer?.srcType, layer?.fit])

  /* The source a new photo layer should carry: the live one if we're already
   * on a photo, else whatever we last had. */
  const carriedSource = () => (
    layer?.type === 'photo'
      ? { src: layer.src, srcType: layer.srcType, fit: layer.fit }
      : (lastSourceRef.current ?? {})
  )

  const navTree = buildLabsCatalog({ layer, setOnly, addFilter, patchFilter, carriedSource })

  /* ── PUBLISH, DON'T RENDER ──
   * This component draws nothing now. It hands the rows to the SHELL rail
   * (`railExtras`), which renders them with kol-shell's `NavRail` — the same
   * component, grab animation and active styling every other route gets.
   *
   * The shape `NavRail` reads is `{ icon, path, label, sub: [{ path, label }] }`
   * and its only callback is `onNavigate(path)`, so each row's path is a
   * sentinel and the dispatch table below is what actually runs on a click. */
  useEffect(() => {
    const dispatch = new Map()
    const items = []

    /* FOLD THE FLAT LIST INTO ITS SECTIONS. The catalog is a stream — a `sec:`
       marker, then the groups belonging to it, then the next marker. The rail
       wants that nesting made real: the section becomes the L1 row and the
       groups that followed it become its L2. */
    navTree.forEach((entry) => {
      if (entry.id.startsWith('sec:')) {
        const key = entry.id.slice(4)
        items.push({
          icon: SECTION_ICONS[key] ?? 'square',
          path: `${RAIL_EXTRA_PREFIX}${entry.id}`,
          label: entry.label,
          sub: [],
        })
        return
      }
      const path = `${RAIL_EXTRA_PREFIX}${entry.id}`
      const pages = entry.pages ?? []
      /* pressing a group runs its first leaf — the group IS its first category
         when you have not picked one; the rest are the right rail's chips */
      const own = entry.onSelect ?? pages[0]?.onSelect
      if (own) dispatch.set(path, own)
      const section = items[items.length - 1]
      const row = { icon: entry.icon, path, label: entry.label }
      /* a group before any section marker would be an L1 row; none exist today,
         but falling back to that beats dropping it silently */
      if (section?.sub) section.sub.push(row)
      else items.push(row)
    })

    /* Returns whether the path was a PICK (a group or leaf) — a section row has
       no entry, and AppLayout uses the difference to close the touch drawer on
       a pick but leave it open when a section is just being expanded.

       ON TOUCH A PICK STARTS THE CLOCK. Desktop keeps its contract — a pick
       lands a still and Space runs it — but a phone has no Space and its ▶ sits
       in the params drawer, closed; a pick that lands a frozen frame reads as
       broken there (the randomiser has always played on pick). */
    const touch = isMobileDevice() && !wantsDesktop()
    setRailExtras({ items, dispatch: (p) => { const fn = dispatch.get(p); if (!fn) return false; fn(); if (touch) transport.play(); return true } })
    return () => setRailExtras(null)
  })

  return null
}
