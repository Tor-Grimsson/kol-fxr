import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, useNavHidden } from '@kolkrabbi/kol-shell'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
import { useRailExtras, RAIL_EXTRA_PREFIX } from './railExtras'

/**
 * AppLayout — the shell tier's layout root: kol-shell's fixed 48px `AppShell`
 * rail wrapping the router's `<Outlet/>`. The same shape kol-monitor and
 * kol-mirror run; kol-shell is router-agnostic by design, so the consumer
 * supplies `currentPath` / `onNavigate` and that is the whole wiring.
 *
 * EVERYTHING SITS UNDER THE RAIL (user ruling 2026-08-27). `railToggleKey`
 * hides it (`\` — H is the editor's layer-visibility key) and the rail comes
 * back on every route change; `touch="bare"` renders the routes with no shell
 * on a coarse-pointer device unless localStorage `kol-desktop` is '1' — the
 * key `mobile/device.js` writes. Both are AppShell's since kol-shell 0.8.0
 * (ShellHomeSystem); the logomark ships from kol-brand.
 *
 * ⌥-DIGIT IS LOCAL, NOT AppShell's `navKeys` (user, 2026-08-28: "alt 1 should
 * short to home, library 3 4 5"). AppShell maps ⌥n to `items[n-1]`, which skips
 * HOME entirely — `/` is the logomark, not a rail item — so ⌥1 landed on
 * Library and Home had no key at all. Two further reasons the prop cannot do
 * this: labs APPENDS its category rows to `items` (see railExtras), so ⌥5-9
 * would jump to Effects/Generative rows on that one route; and the digit must
 * stay stable per destination regardless of what a chrome contributes.
 *
 * So: ⌥1 Home · ⌥2 Library · ⌥3 Editor · ⌥4 Labs · ⌥5 Randomiser · ⌥6 Settings
 * — the rail read top to bottom, logomark included. kol-mirror runs the same
 * shape for the same reason (its ⌥1 is HOME too).
 *
 * Matched on `e.code` (`Digit1`…), because Opt+digit yields `¡ ™ £ ¢` as
 * `e.key` on macOS. Option rather than Command: ⌘1-9 is the browser's own tab
 * switch. Never while typing in a field.
 *
 * `pageWash` (kol-shell 0.11.0, ShellPageWash — filed from kol-monitor) is the
 * estate's page background rule: AppShell always paints surface-primary as the
 * back of the back, and the wash is a TRANSPARENT fg step on top of it, never a
 * surface swap. `--kol-fg-02` is the rung (user, 2026-08-27). It arrives as a prop rather than a bound token precisely
 * because this repo's `index.css` is imports-only by rule, so there is nowhere
 * local to bind one. Any route root that is not a `PageShell` reads
 * `var(--kol-shell-page-wash, var(--kol-surface-primary))` itself.
 */

export const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'desktop', path: '/editor', label: 'Editor' },
  { icon: 'globe', path: '/labs', label: 'Labs' },
  { icon: 'refresh', path: '/randomiser', label: 'Randomiser' },
]

export const BOTTOM_ITEMS = [
  { icon: 'nav-settings', path: '/settings', label: 'Settings' },
]

/* The ⌥-digit order: the rail READ TOP TO BOTTOM, logomark first. Derived from
   the two arrays above so adding a destination cannot silently renumber the
   rest — the only hardcoded entry is Home, which is the mark, not a row. */
const KEY_ORDER = ['/', ...NAV_ITEMS.map((n) => n.path), ...BOTTOM_ITEMS.map((n) => n.path)]

/* Publishes `--fxr-rail` — the rail's width, or 0 when hidden or absent — so a
   chrome's FIXED layers (the randomiser's overlays) keep clear of it; AppShell
   only offsets in-flow content. No provider (bare mode) = no rail = 0. */
function RailFrame({ children }) {
  const nav = useNavHidden()
  return (
    <div className="contents" style={{ '--fxr-rail': !nav || nav.navHidden ? '0px' : 'var(--kol-shell-rail-width)' }}>
      {children}
    </div>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  /* The pinned Settings rung is a TOGGLE (kol-mirror's Shell, ported
     2026-08-28): click opens /settings, click again returns to the page it
     was opened from. */
  const lastPage = useRef('/')
  useEffect(() => { if (location.pathname !== '/settings') lastPage.current = location.pathname }, [location.pathname])

  /* A route can hand the rail its own rows (labs' categories) — one rail, not
     a second component per chrome. Their paths are sentinels, so they dispatch
     instead of routing. */
  const extras = useRailExtras()

  /* Every hop is an SPA transition since 2026-08-27 — the chromes are lazy
     routes that mount and unmount like any page. */
  const onNavigate = (path) => {
    if (path?.startsWith(RAIL_EXTRA_PREFIX)) { extras.dispatch?.(path); return }
    navigate(path === '/settings' && location.pathname === '/settings' ? lastPage.current : path)
  }

  /* ⌥1…⌥6 — the rail top to bottom, HOME included. See the docblock for why
     this is local rather than AppShell's `navKeys`. */
  const navRef = useRef(onNavigate)
  navRef.current = onNavigate
  useEffect(() => {
    const onKey = (e) => {
      const m = /^Digit([1-9])$/.exec(e.code)
      if (!m || !e.altKey || e.metaKey || e.ctrlKey) return
      const t = e.target
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return
      const path = KEY_ORDER[Number(m[1]) - 1]
      if (!path) return
      e.preventDefault()
      navRef.current(path)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppShell
      items={extras.items.length ? [...NAV_ITEMS, ...extras.items] : NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      logomark={{ svgUrl: logomarkUrl, title: 'Effexor FXR' }}
      currentPath={location.pathname}
      onNavigate={onNavigate}
      railToggleKey={'\\'}
      touch="bare"
      pageWash="var(--kol-fg-02)"
    >
      <RailFrame>
        <Outlet />
      </RailFrame>
    </AppShell>
  )
}
