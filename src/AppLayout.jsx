import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppHub, useNavHidden } from '@kolkrabbi/kol-shell'
import { Button, Dropdown, ModalProvider, useModal } from '@kolkrabbi/kol-component'
import { ThemeToggle } from '@kolkrabbi/kol-framework'
import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'
/* The rail-extras store moved into the package with labs (0.4.0): labs WRITES
   it and this layout READS it, so two module copies meant subscribing to a
   store nothing ever touched. One copy, one store. The settings sections, the
   keymap, the mode table and the library reader are the package's for the same
   reason — the editor's own drawer renders the same rows, so the page and the
   drawer cannot drift. */
import {
  useRailExtras, RAIL_EXTRA_PREFIX,
  useSettingsSections, shortcutsBySection, comboLabel,
  MODES, setMode, withView, loadLibrary,
  isMobileDevice, wantsDesktop,
  getLibraryApi, useLibrarySession, signInLibrary, signOutLibrary, UnauthorizedError,
} from './index.jsx'

/**
 * AppLayout — the shell tier's layout root: kol-shell's `AppHub` (Shell + Hub
 * in one call, the app anatomy of 2026-09-26) wrapping the router's `<Outlet/>`.
 * kol-shell is router-agnostic by design, so the consumer supplies
 * `currentPath` / `onNavigate` and that is the whole wiring.
 *
 * ON THE HUB SINCE 2026-10-07 (user ruling). `AppHub` passes `items` straight
 * through to `AppShell`, so labs' category rows still ride under Labs exactly
 * as before — which is why it is `AppHub` and not `AppStudio` (the Studio
 * builds the rail from its own slots and has no seam for rows under one item).
 * Settings is the Hub's `HubSettings` — the page kol-shell rebuilt FROM this
 * repo's own, so every feature it had is a prop here: the sections as data,
 * the gear's drawer over the same sections, the chrome picker, the OPTIONS /
 * SHORTCUTS pair. Home is the Hub's `HubHome` — RECENT = the three chromes,
 * SAVED = the library's presets read through `loadLibrary()` (design-editor
 * 0.22.0, `library-reader-for-a-hub-home`) on every render, so the shell tier
 * mounts no library provider: one above `AppHub` would go stale beside the
 * editor's own in the same tab. A saved card has no cover BY NATURE, so it is
 * `media: false` (kol-component 0.210.0: no cover, no slot) rather than the
 * dashed MISSING plate an absent asset gets.
 *
 * EVERYTHING SITS UNDER THE RAIL (user ruling 2026-08-27). `\` hides it
 * (H is the editor's layer-visibility key) and the rail comes back on every
 * route change; `touch="drawer"` takes the rail OFF-CANVAS under 768px — a
 * hamburger top-right brings it in over a scrim, and labs' catalog rows ride
 * it exactly as they do the desktop rail. The Hub's default is the phone BAR;
 * the drawer stays because the 2026-10-05 phone work was built and measured
 * against it. `railSections="enter"` is the user's 2026-10-06 ruling for labs'
 * rail: a section row enters its children under a Back row instead of folding.
 *
 * THE KEYS, split by route — read in kol-shell 0.62.0 and design-editor 0.21.0:
 *
 *   ⌥1…⌥6   LOCAL, not AppShell's `navKeys`. `navKeys` walks mark → items →
 *           bottom rows now, but indexes `items` exactly as passed — and labs
 *           INSERTS its category rows under Labs, so on `/labs` ⌥5 would land
 *           on Effects instead of Randomiser. The digit must stay stable per
 *           destination regardless of what a chrome contributes.
 *           ⌥1 Home · ⌥2 Library · ⌥3 Editor · ⌥4 Labs · ⌥5 Randomiser · ⌥6 Settings.
 *   ,       On a shell page (`/` · `/library` · `/settings`) the shell's own
 *           `settingsKey` toggles `/settings` and remembers the return path.
 *           On a chrome route the shell's key is OFF and `ChromeSettingsKey`
 *           dispatches `kol:open-settings`, which the chrome's drawer answers
 *           (`EditorShell` binds no key of its own and expects the host to
 *           fire the event). AppShell's handler never dispatches it, so the
 *           split is what keeps `,` in the editor from ALSO navigating away.
 *   S       The chrome binds it in its own keymap; the Hub's sheet key is off
 *           there, or two sheets open. On a shell page the Hub's sheet shows
 *           the full map.
 *   \       The shell's, everywhere.
 *
 * Matched on `e.code` (`Digit1`…, `Comma`), because Option rewrites `e.key` on
 * macOS (⌥, is `≤`; Opt+digit is `¡ ™ £ ¢`). Option rather than Command: ⌘1-9
 * is the browser's own tab switch. Never while typing in a field.
 *
 * `pageWash` is the Hub's default (`--kol-fg-02`, user 2026-08-27): the shell
 * paints surface-primary as the back of the back and the wash is a TRANSPARENT
 * fg step on top of it, never a surface swap. This repo's `index.css` is
 * imports-only by rule, so there is nowhere local to bind one.
 */

export const NAV_ITEMS = [
  { icon: 'nav-library', path: '/library', label: 'Library' },
  { icon: 'desktop', path: '/editor', label: 'Editor' },
  { icon: 'globe', path: '/labs', label: 'Labs' },
  { icon: 'refresh', path: '/randomiser', label: 'Randomiser' },
]

const SETTINGS_PATH = '/settings'
/* THE SIGN-IN ROW — a sentinel, not a route (user, 2026-10-08: "why wouldn't it be in the rail?
   like a user icon"). It sits in the rail's pinned foot above Settings, only when the host named
   a library API; the session it opens lives in the editor's `libraryApi` module, so it outlives a
   chrome switch. Never a page: there is nothing to show, only a password to ask for. */
const SIGN_IN_PATH = '#sign-in'

/* The ⌥-digit order: the rail READ TOP TO BOTTOM, logomark first. Derived from
   NAV_ITEMS so adding a destination cannot silently renumber the rest — the
   only hardcoded entries are Home (the mark, not a row) and the pinned
   Settings rung, which the Hub adds for us. */
const KEY_ORDER = ['/', ...NAV_ITEMS.map((n) => n.path), SETTINGS_PATH]

/* The chrome routes — where the PACKAGE owns `,` and `S`. */
const CHROME_PATHS = new Set(['/editor', '/labs', '/randomiser'])

const APP = {
  name: 'Effexor FXR',
  subtitle: 'Pick a chrome. All three run the same engine.',
  logomark: logomarkUrl,
  about: (
    <>A DOM/SVG design compositor — frames, layers, vector tools — with generative, kinetic-type and effects layers on the same engine, served through three chromes: the Editor, Labs, and the Randomiser. Ships as a standalone app and as the embeddable <code>@kolkrabbi/design-editor</code> library.</>
  ),
  links: [
    { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-fxr' },
    { label: 'Kolkrabbi', url: 'https://fxr.kolkrabbi.io' },
    { label: 'Vercel', url: 'https://vercel.com/tor-grimssons-projects/kol-fxr' },
  ],
}

/* The masthead picker's contents — three chromes where kol-r2b2's row 1 has
   buckets. The frame around it is `HubSettings`'. `w-48`, not `w-40`: the
   touch rung types it at 16px and "Open a chro…" truncated (the 2026-10-03
   rehearsal). */
const CHROME_PICKS = [
  { value: '', label: 'Open a chrome' },
  { value: 'editor', label: 'Editor' },
  { value: 'labs', label: 'Labs' },
  { value: 'randomiser', label: 'Randomiser' },
]

/* HOME'S TWO SETS. RECENT = the chromes, the starting points; `name`/`title` are
   what the page's search reads, the card media a photo of the chrome
   (`public/previews/chromes/<id>.png`). SAVED = the library's presets — no load
   path outside the editor (LibraryPage's ruling), so their cards are static and
   the library page is where they are managed. */
const CHROMES = MODES.map((m) => ({ name: m.id, title: m.label, detail: m.blurb }))

const fmtDate = (ms) =>
  new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const savedCards = () => (loadLibrary().preset ?? []).map((p) => ({
  name: p.id,
  title: p.name || 'Untitled preset',
  detail: `${p.layers?.length ?? 0} layers · ${p.aspect ?? '1:1'} · ${fmtDate(p.savedAt)}`,
}))

/* ponytail: placeholder steps — monitor's five-step tour has no fxr copy yet.
   The last step's `actions` is a FUNCTION so HubHome can hand it `close`. */
const WALKTHROUGH = (enter) => [
  { title: '1. Pick a chrome', text: ['Placeholder.'] },
  { title: 'Get Started', actions: (close) => <Button tone="grey" size="md" onClick={() => { close(); enter('editor') }}>Open Editor</Button> },
]

/* The shortcuts the Hub's sheet and the Settings page both read — ONE array,
   which is what kol-shell's own docstring asks for so the pair cannot drift.
   `null` view = the full map: the right answer for a settings page reached
   from the rail rather than from an editor. */
const SHORTCUTS = shortcutsBySection(null)

const typing = (t) => t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)

/* The sign-in gesture, under the shell's own ModalProvider so the KOL prompt serves it on every
   route — the chromes carry their own provider inside. Registers itself on a ref the rail's
   onNavigate calls. */
function RailSignIn({ handlerRef }) {
  const modal = useModal()
  const session = useLibrarySession()
  handlerRef.current = async () => {
    if (session) {
      signOutLibrary()
      await modal.alert('Signed out. Saves stay on this device only.')
      return
    }
    const pw = await modal.prompt('Password for the library sync:', '')
    if (!pw) return
    try {
      const n = await signInLibrary(pw)
      await modal.alert(`Signed in. ${n} saved ${n === 1 ? 'item' : 'items'} in the cloud library; saves now sync.`)
    } catch (e) {
      await modal.alert(e instanceof UnauthorizedError ? 'Wrong password. Still local only.' : `Sign in failed: ${e?.message || e}`)
    }
  }
  return null
}

/* Publishes `--fxr-rail` — the rail's width, or 0 when hidden or absent — so a
   chrome's FIXED layers (the randomiser's overlays) keep clear of it; AppShell
   only offsets in-flow content. */
function RailFrame({ children }) {
  const nav = useNavHidden()
  return (
    <div className="contents" style={{ '--fxr-rail': !nav || nav.navHidden ? '0px' : 'var(--kol-shell-rail-width)' }}>
      {children}
    </div>
  )
}

/* `,` ON A CHROME ROUTE — fire the event the chrome's drawer listens for, and
   nothing else (see the docblock). Mounted as the Hub's children, so it exists
   exactly where it is needed. */
function ChromeSettingsKey() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Comma' || e.metaKey || e.ctrlKey || typing(e.target)) return
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('kol:open-settings', { cancelable: true }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return null
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const onChrome = CHROME_PATHS.has(location.pathname)

  /* A route can hand the rail its own rows (labs' categories) — one rail, not
     a second component per chrome. Their paths are sentinels, so they dispatch
     instead of routing. */
  const extras = useRailExtras()
  const sections = useSettingsSections()
  const session = useLibrarySession()
  const signInRef = useRef(null)
  /* the pinned foot: Sign in (when there is an API to sign in to) above Settings. AppHub pins
     Settings itself, but a `shell.bottomItems` replaces its list, so Settings is named here too;
     the shell's `settingsPath` toggle still applies to it. */
  const bottomItems = [
    /* the icon IS the state: a person while local, a cloud while synced (the label only shows with the rail open) */
    ...(getLibraryApi() ? [{ icon: session ? 'cloud' : 'user', path: SIGN_IN_PATH, label: session ? 'Synced · sign out' : 'Sign in' }] : []),
    { icon: 'nav-settings', path: SETTINGS_PATH, label: 'Settings' },
  ]

  /* Every hop is an SPA transition since 2026-08-27 — the chromes are lazy
     routes that mount and unmount like any page. */
  const onNavigate = (path) => {
    if (path === SIGN_IN_PATH) { signInRef.current?.(); return }
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

  /* Remember the pick, then leave for the chrome. */
  const enter = (id) => { setMode(id); navigate(withView(id)) }

  /* ⌥1…⌥6 — the rail top to bottom, HOME included. See the docblock for why
     this is local rather than AppShell's `navKeys`. */
  const navRef = useRef(onNavigate)
  navRef.current = onNavigate
  useEffect(() => {
    const onKey = (e) => {
      if (typing(e.target)) return
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

  /* THE DEVICE GATE APPLIES AT `/` ONLY: a touch-primary device that has not
     opted into desktop gets the randomiser instead of home. Ask for any other
     path and you get it — reaching for `/settings` on a phone is explicit.
     Here rather than in a route element because the Hub renders Home itself. */
  if (location.pathname === '/' && isMobileDevice() && !wantsDesktop()) return <Navigate to="/randomiser" replace />

  return (
    <ModalProvider>
    <RailSignIn handlerRef={signInRef} />
    <AppHub
      app={APP}
      /* Labs' category rows sit DIRECTLY UNDER Labs, not after the whole nav —
         they belong to that destination, and appending them put them below
         Randomiser. `KEY_ORDER` is derived from NAV_ITEMS, not from this, so
         ⌥-digit is unaffected by where they land. */
      items={extras.items.length
        ? NAV_ITEMS.flatMap((n) => (n.path === '/labs' ? [n, ...extras.items] : [n]))
        : NAV_ITEMS}
      currentPath={location.pathname}
      onNavigate={onNavigate}
      settingsPath={SETTINGS_PATH}
      home={{
        items: (view) => (view === 'recent' ? CHROMES : savedCards()),
        filtersTitle: 'All Chromes',
        toCard: (c, { view: v }) => ({
          key: c.name,
          title: c.title,
          detail: c.detail,
          media: v === 'recent' ? <img src={`/previews/chromes/${c.name}.png`} alt={c.title} /> : false,
          onClick: v === 'recent' ? () => enter(c.name) : undefined,
        }),
        /* ponytail: New File is a placeholder — the editor has no "new document"
           door outside its own File menu yet; wire it when one exists. */
        actions: <Button tone="grey" size="md" onClick={() => {}}>New File</Button>,
      }}
      walkthrough={WALKTHROUGH(enter)}
      settings={{
        sections,
        /* the gear opens the SAME sections as a drawer — one definition, two
           frames, so they cannot drift (the editor's own drawer renders them too) */
        drawer: true,
        picker: (
          <Dropdown
            className="w-48"
            tone="sunken"
            options={CHROME_PICKS}
            value=""
            onChange={(v) => v && navigate(`/${v}`)}
            aria-label="Open a chrome"
          />
        ),
        splitShortcuts: true,
        tone: 'sunken',
      }}
      shortcuts={SHORTCUTS}
      comboLabel={comboLabel}
      themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
      shortcutsKey={onChrome ? null : 's'}
      shell={{
        touch: 'drawer',
        railSections: 'enter',
        navKeys: false,
        settingsKey: onChrome ? undefined : ',',
        bottomItems,
      }}
    >
      {onChrome && <ChromeSettingsKey />}
      <RailFrame>
        <Outlet />
      </RailFrame>
    </AppHub>
    </ModalProvider>
  )
}
