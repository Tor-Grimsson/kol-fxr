import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, useNavHidden, useSettingsToggle } from '@kolkrabbi/kol-shell'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
/* The rail-extras store moved into the package with labs (0.4.0): labs WRITES
   it and this layout READS it, so two module copies meant subscribing to a
   store nothing ever touched. One copy, one store. */
import { useRailExtras, RAIL_EXTRA_PREFIX } from '@kolkrabbi/design-editor'

/**
 * AppLayout — the shell tier's layout root: kol-shell's fixed 48px `AppShell`
 * rail wrapping the router's `<Outlet/>`. The same shape kol-monitor and
 * kol-mirror run; kol-shell is router-agnostic by design, so the consumer
 * supplies `currentPath` / `onNavigate` and that is the whole wiring.
 *
 * EVERYTHING SITS UNDER THE RAIL (user ruling 2026-08-27). `railToggleKey`
 * hides it (`\` — H is the editor's layer-visibility key) and the rail comes
 * back on every route change; `touch="drawer"` (kol-shell 0.31.0) takes the
 * rail OFF-CANVAS under 768px — a hamburger top-right brings it in over a
 * scrim, and labs' catalog rows ride it exactly as they do the desktop rail.
 * It was `bare` until 2026-09-01: no shell at all on a coarse pointer, which
 * left a phone's `/labs` with nowhere to render its nav (user: "labs needs
 * both sidebars, just via hamburger menu"). The logomark ships from kol-brand.
 *
 * ⌥-DIGIT IS LOCAL, NOT AppShell's `navKeys` (user, 2026-08-28: "alt 1 should
 * short to home, library 3 4 5"). AppShell maps ⌥n to `items[n-1]`, which skips
 * HOME entirely — `/` is the logomark, not a rail item — so ⌥1 landed on
 * Library and Home had no key at all. Two further reasons the prop cannot do
 * this: labs INSERTS its category rows into `items` under Labs (see railExtras),
 * so ⌥5-9 would jump to Effects/Generative rows on that one route; and the digit
 * must stay stable per destination regardless of what a chrome contributes.
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

/* `,` and ⌥, — SETTINGS, FROM ANYWHERE (user, 2026-08-28: "open whatever
   settings is available at any time"). A chrome answers it with its drawer
   (EditorShell listens and calls preventDefault on the event); a shell page has
   no drawer, so the SHELL's toggle takes it — which is why this sits inside
   `AppShell` rather than beside it: `useSettingsToggle` reads the shell's own
   context and is a no-op outside it.

   The toggle itself is kol-shell's since 0.25.0 (`SettingsToggleGesture`) and
   reachable since 0.26.0 (`SettingsToggleGestureConsumerSeam`, filed from here)
   — so the return path is the shell's bookkeeping now, not a `lastPage` ref
   here. `settingsKey` is deliberately NOT passed: this handler is the gesture,
   because only the app knows whether a drawer or the page should answer.

   Matched on `e.code`: Option rewrites `e.key` on macOS (⌥, is `≤`), and the
   physical key is the same one either way. */
function SettingsKey() {
  const toggleSettings = useSettingsToggle()
  const ref = useRef(toggleSettings)
  ref.current = toggleSettings
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Comma' || e.metaKey || e.ctrlKey) return
      const t = e.target
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return
      e.preventDefault()
      const handled = !window.dispatchEvent(new CustomEvent('kol:open-settings', { cancelable: true }))
      if (!handled) ref.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return null
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  /* A route can hand the rail its own rows (labs' categories) — one rail, not
     a second component per chrome. Their paths are sentinels, so they dispatch
     instead of routing. */
  const extras = useRailExtras()

  /* Every hop is an SPA transition since 2026-08-27 — the chromes are lazy
     routes that mount and unmount like any page. */
  const onNavigate = (path) => {
    if (path?.startsWith(RAIL_EXTRA_PREFIX)) {
      /* A labs pick swaps the layer without a route change, and the touch
         drawer only closes itself on `currentPath` — so it stayed open over
         the thing just picked. The scrim is the DS's own close control; press
         it. ponytail: DOM poke — replace with a shell seam if kol-shell ships
         one (a drawer that closes on any onNavigate, or a setDrawerOpen). */
      if (extras.dispatch?.(path)) document.querySelector('.kol-shell-drawer-scrim')?.click()
      return
    }
    navigate(path)
  }

  /* ⌥1…⌥6 — the rail top to bottom, HOME included. See the docblock for why
     this is local rather than AppShell's `navKeys`. */
  const navRef = useRef(onNavigate)
  navRef.current = onNavigate
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return

      const m = /^Digit([1-9])$/.exec(e.code)
      if (!m || !e.altKey || e.metaKey || e.ctrlKey) return
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
      /* Labs' category rows sit DIRECTLY UNDER Labs, not after the whole nav —
         they belong to that destination, and appending them put them below
         Randomiser. `KEY_ORDER` is derived from NAV_ITEMS, not from this, so
         ⌥-digit is unaffected by where they land. */
      items={extras.items.length
        ? NAV_ITEMS.flatMap((n) => (n.path === '/labs' ? [n, ...extras.items] : [n]))
        : NAV_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      logomark={{ svgUrl: logomarkUrl, title: 'Effexor FXR' }}
      currentPath={location.pathname}
      onNavigate={onNavigate}
      railToggleKey={'\\'}
      /* The pinned Settings rung TOGGLES — click opens /settings, click again
         returns to the page it was opened from. The shell owns that return path
         since kol-shell 0.25.0; the local `lastPage` ref it replaced is gone.
         No `settingsKey` — `SettingsKey` below is the gesture (see its note). */
      settingsPath="/settings"
      touch="drawer"
      pageWash="var(--kol-fg-02)"
    >
      <SettingsKey />
      <RailFrame>
        <Outlet />
      </RailFrame>
    </AppShell>
  )
}
