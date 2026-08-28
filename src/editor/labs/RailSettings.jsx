import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@kolkrabbi/kol-icons'
import { ThemeToggle } from '@kolkrabbi/kol-framework'

/**
 * RailSettingsPanel — the Settings DISCLOSURE's panel.
 *
 * User, 2026-08-27: "put the settings where the logo is, and logo back on
 * top" · "sidebar setting should open close on click and click again" · "put
 * the theme toggle in the settings and out of the sidebar" · "we make it work
 * here then ship it".
 *
 * The TRIGGER is not here: it is a `bottomItems` ACTION LEAF on the rail
 * (LabsNav.jsx) — `{ label, icon, onSelect: toggle, active: open }` — so the
 * gear is the same pinned row, on the same pixel, as the shell rail's
 * Settings route row (measured 858 on both). This panel PORTALS to <body> and
 * sits directly above that row, inside the rail's width, so it works
 * collapsed (icon column) and expanded (rows) alike without touching
 * SideNav's own DOM. Click again closes; Escape closes; navigating closes.
 *
 * Built here first, deliberately: neither SideNav nor kol-shell's NavRail has
 * a disclosure seam, so the shell rail on `/` · `/library` · `/settings`
 * keeps Settings as a route row for now — same gear, same place, a click
 * opens the page. Both rails behaving identically is the ship-it item.
 */
function useSidenavCollapsed() {
  const read = () => document.documentElement.getAttribute('data-sidenav') === 'collapsed'
  const [collapsed, setCollapsed] = useState(read)
  useEffect(() => {
    const mo = new MutationObserver(() => setCollapsed(read()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-sidenav'] })
    return () => mo.disconnect()
  }, [])
  return collapsed
}

export default function RailSettingsPanel({ open, onClose, onNavigate, settings }) {
  const collapsed = useSidenavCollapsed()
  const [box, setBox] = useState(null)

  /* anchor: the rail's Settings row (the trigger) — the panel's bottom edge
   * meets its top edge, its width is the rail's */
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rail = document.querySelector('.kol-sidenav')
      const row = [...(rail?.querySelectorAll('.kol-sidenav-hop') ?? [])]
        .find((b) => b.textContent.trim() === settings.label)
      if (!rail || !row) return
      const rr = rail.getBoundingClientRect(), tr = row.getBoundingClientRect()
      setBox({ left: rr.left, width: rr.width, bottom: window.innerHeight - tr.top })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, collapsed, settings.label])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !box) return null
  return createPortal(
    <div
      className="fixed flex flex-col gap-[2px] py-2 bg-surface-primary border-t border-r border-fg-08"
      style={{ left: box.left, width: box.width, bottom: box.bottom, zIndex: 'var(--kol-z-tooltip)' }}
    >
      {/* the theme toggle — the same two variants SideNav's own slot used */}
      <div className="kol-sidenav-theme-slot flex">
        <ThemeToggle variant={collapsed ? 'icon' : 'hop-bare'} size="md" />
      </div>
      <button
        type="button"
        className="kol-sidenav-hop kol-helper-12 text-strong hover:text-emphasis bg-transparent border-0 cursor-pointer text-left"
        onClick={(e) => { onClose(); onNavigate?.(e, settings.path) }}
        title={settings.label}
        aria-label={settings.label}
      >
        <span className="kol-sidenav-hop-icon inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
          <Icon name="arrow-right" size={16} />
        </span>
        <span className="kol-sidenav-hop-label flex-1 min-w-0 truncate">{settings.label}</span>
      </button>
    </div>,
    document.body,
  )
}
