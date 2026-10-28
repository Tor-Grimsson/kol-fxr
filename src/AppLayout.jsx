import { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { AppStudio, useNavHidden } from '@kolkrabbi/kol-shell'
import { ModalProvider, useModal } from '@kolkrabbi/kol-component'

import NewFileDialog, { openNewFile } from './components/NewFileDialog'
import { CHROMES, chromeOf, bytesOf, downloadFile } from './components/FileCard'
import { pickMedia } from './editor/library/mediaPick'
import { proxied, isVideoType, getMediaClient } from './editor/library/mediaLibrary'
/* The rail-extras store moved into the package with labs (0.4.0): labs WRITES
   it and this layout READS it, so two module copies meant subscribing to a
   store nothing ever touched. One copy, one store. The settings sections, the
   keymap, the mode table and the library reader are the package's for the same
   reason — the editor's own drawer renders the same rows, so the page and the
   drawer cannot drift. */
import {
  useRailExtras, RAIL_EXTRA_PREFIX,
  shortcutsBySection, comboLabel,
  setMode, withView, loadLibrary,
  getLibraryApi, useLibrarySession, useAccount, signInLibrary, signOutLibrary, UnauthorizedError,
  renameStored, duplicateStored, removeStored, setThumbStored, copyStored, readLibraryRaw, subscribeLibrary,
} from './index.jsx'
import { listShipped, readShippedRaw, subscribeShipped, renameShipped, removeShipped } from './editor/library/shipped'
import { setUploadedCover } from './editor/library/FileCover'
import { saveSpot, readSpot, writeSpot, useRestoreScroll } from './editor/library/returnSpot'
import { useHubSettings } from './settings/AppSettings'
import { useAccountPrefs } from './editor/library/accountPrefs'
/* lazy — it pulls the output stack, which the shell tier otherwise never carries */
const CoverHost = lazy(() => import('./editor/library/CoverHost'))
import FileCover from './editor/library/FileCover'
import HomeStage from './components/HomeStage'
import DevCards from './pages/DevCards'
import FxChangelog from './pages/FxChangelog.jsx'

/**
 * AppLayout — the shell tier's layout root: kol-shell's `AppStudio` (the Shell
 * and the Hub in one call) wrapping the router's `<Outlet/>` in each page.
 * kol-shell is router-agnostic by design, so the consumer supplies
 * `currentPath` / `onNavigate` and that is the whole wiring.
 *
 * ON THE STUDIO SINCE 2026-10-24 (the Studio adoption, run from kol-ds-ui). The
 * rail is the preset's: Library (the Hub's slot, `/library` through the Outlet) ·
 * the four chromes as `pages` · Media · Sign in · Settings pinned by the Hub. Labs
 * carries its categories as `sub` at Home and on /labs alike — the catalog's shape
 * from `useLabsRows`, the live rows once labs publishes them — so Labs enters and
 * its sections fold inside (user 2026-10-06, plan 37). Home is the Hub's `HubHome`
 * over `files` read through `loadLibrary()` on every render (no provider at the
 * shell tier: one above the Studio would go stale beside the editor's own), every
 * verb through `renameStored` · `duplicateStored` · `removeStored`, a file's cover
 * its own `thumb` (plan 39 § 3.1). The settings rail takes `useHubSettings`' typed
 * rows; the chromes' own drawer keeps rendering `AppSettingsSections`.
 *
 * EVERYTHING SITS UNDER THE RAIL (user ruling 2026-08-27). `\` hides it
 * (H is the editor's layer-visibility key) and the rail comes back on every
 * route change. On a phone the rail is the preset's pill — the Studio's one
 * phone shape; the chromes own the phone's bottom edge (`bar: false`).
 *
 * THE KEYS, split by route — read in kol-shell 0.62.0 and design-editor 0.21.0:
 *
 *   ⌥1…⌥7   LOCAL, not AppShell's `navKeys`. `navKeys` walks mark → items →
 *           bottom rows now, but indexes `items` exactly as passed — and labs
 *           INSERTS its category rows under Labs, so on `/labs` ⌥5 would land
 *           on Effects instead of Randomiser. The digit must stay stable per
 *           destination regardless of what a chrome contributes.
 *           ⌥1 Home · ⌥2 Library · ⌥3 Editor · ⌥4 Labs · ⌥5 Morph · ⌥6 Randomiser · ⌥7 Settings.
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

/* The chromes are the Studio's pages (studio adoption, 2026-10-24) — Library is the Hub's slot above them. */
const CHROME_ROWS = [
  { icon: 'desktop', path: '/editor', label: 'Editor', bar: false },
  { icon: 'globe', path: '/labs', label: 'Labs', bar: false },
  { icon: 'refresh', path: '/randomiser', label: 'Randomiser', bar: false },
  /* MORPH is a destination (plan 10, user 2026-10-08: "how the fuck is MORPH NOT IN THE SIDERAIL") — the labs
     chrome with the Morph rail open, not a row labs contributes only while you are on it */
  { icon: 'swap', path: '/morph', label: 'Morph', bar: false },
]
export const NAV_ITEMS = [{ icon: 'nav-library', path: '/library', label: 'Library' }, ...CHROME_ROWS]

const SETTINGS_PATH = '/settings'

/* The ⌥-digit order: the rail READ TOP TO BOTTOM, logomark first. Derived from
   NAV_ITEMS so adding a destination cannot silently renumber the rest — the
   only hardcoded entries are Home (the mark, not a row) and the pinned
   Settings rung, which the Hub adds for us. */
const KEY_ORDER = ['/', ...NAV_ITEMS.map((n) => n.path), SETTINGS_PATH]

/* The chrome routes — where the PACKAGE owns `,` and `S`. */
const CHROME_PATHS = new Set(['/editor', '/labs', '/morph', '/randomiser'])

const APP = {
  name: 'FXR',
  /* no subtitle on Home (user 2026-10-28: "this is poinless" — FXR is enough), plan 44 § 2.1 */
  logomark: '/favicon/favicon.svg',
  about: 'A DOM/SVG design compositor — frames, layers, vector tools — with generative, kinetic-type and effects layers on the same engine, served through three chromes: the Editor, Labs, and the Randomiser.',
  links: [
    { label: 'GitHub', url: 'https://github.com/Tor-Grimsson/kol-fxr' },
    { label: 'Kolkrabbi', url: 'https://fxr.kolkrabbi.io' },
    { label: 'Vercel', url: 'https://vercel.com/tor-grimssons-projects/kol-fxr' },
  ],
}

/* HOME IS THE USER'S (plan 39, user 2026-10-23: *"HOME IS THE START THE USER HOME... Library is saved
   presets"*) and a DATA CONTRACT (HubHomeContract): the files are the library's presets, read through
   `loadLibrary()` on every render; the Hub does RECENT (the 12 newest) and SAVED (all). Files only — New
   File is the action button (user 2026-10-23). Signed in or not — sign-in only syncs the local library.
   THE CHROME IS A MARK ON THE CARD (user 2026-10-24): the chrome a file was made with, in the cover's corner. */
const stampOf = (p) => p.updatedAt ?? p.savedAt ?? 0
/* Home's view labels (HubHome's defaults) → their values, for the Back-lands-on-the-card listener */
const HOME_VIEWS = { RECENT: 'recent', SAVED: 'saved' }

/* Home's six picks from the shipped Library — two editor, two labs, one randomiser, one morph */
const HOME_PICKS = [
  'ship:editor:type-statement', 'ship:editor:optic-half-drekker',
  'ship:labs:mesh-spectrum', 'ship:labs:flow-obstacles',
  'ship:randomiser:circle-warm',
  'ship:morph:gradient-field--gradient-sunset',
]

const fileOf = (p) => ({
  id: p.id,
  name: p.name || 'Untitled preset',
  mark: CHROMES[chromeOf(p)] ?? CHROMES.editor,
  details: [{ label: 'Layers', value: p.layers?.length ?? 0 }, { label: 'Aspect', value: p.aspect ?? '1:1' }],
  updatedAt: stampOf(p),
  bytes: bytesOf(p),
  /* its saved frame, or one drawn on demand from its own layers (FileCover — memory + IndexedDB, never the quota) */
  cover: p.thumb ?? <FileCover file={p} />,
})

/* The tour's copy is the chromes' own one-liners (the New File doors, the Home cards) — one
   source, nothing invented here (audit A3 replaced the "Placeholder." steps, 2026-10-09).
   The last step's `actions` is DATA — the Hub draws the Button and closes the walkthrough first. */
const WALKTHROUGH = (enter) => [
  { title: '1. Pick a chrome', text: ['All three run the same engine.', 'Editor — the full compositor: layers, generators, effects, export.', 'Labs — one generator or source on a standardized output.', 'Randomiser — roll the dice: pick a category and randomize.'] },
  { title: '2. Save, and find it again', text: ['Save… in any chrome keeps the file on this device; signed in, it syncs to the cloud library.', 'Home lists your recent files; Library lists everything saved.'] },
  { title: 'Get Started', actions: [{ label: 'Open Editor', onClick: () => enter('editor') }] },
]

/* The shortcuts the Hub's sheet and the Settings page both read — ONE array,
   which is what kol-shell's own docstring asks for so the pair cannot drift.
   `null` view = the full map: the right answer for a settings page reached
   from the rail rather than from an editor. */
const SHORTCUTS = shortcutsBySection(null)

const typing = (t) => t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)

/* The sign-in gesture, under the shell's own ModalProvider so the KOL alert serves it on every route — the chromes carry
   their own provider inside. ACCOUNTS (plan 43, HubAccountRow, kol-shell 0.85.0): signed out, the Hub's row asks Email and
   Password itself and hands `{ email, password }` here; signed in, the row is you and opens /account, where sign-out lives. */
function RailSignIn({ handlerRef }) {
  const modal = useModal()
  handlerRef.current = async (creds) => {
    if (creds == null) { signOutLibrary(); return }
    try {
      const n = await signInLibrary(creds)
      await modal.alert(`Signed in. ${n} saved ${n === 1 ? 'item' : 'items'} in the cloud library; saves now sync.`)
    } catch (e) {
      await modal.alert(e instanceof UnauthorizedError ? 'Wrong email or password. Still local only.' : `Sign in failed: ${e?.message || e}`)
    }
  }
  return null
}

/* LABS ALWAYS CARRIES ITS CATEGORIES (user 2026-10-24) — the five sections and their groups read off the labs
 * catalog with no layer and no handlers (the shape, not the picks), so Labs enters at Home as on /labs. Lazily:
 * the catalog pulls the engines, which the shell tier never carries. A press before labs is mounted opens /labs
 * and runs the pick once LabsNav has published its dispatch (`pendingPick`). */
const noop = () => {}
function useLabsRows() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    let on = true
    import('./editor/labs/catalog.js').then(({ buildLabsCatalog, SECTION_ICONS }) => {
      if (!on) return
      const items = []
      buildLabsCatalog({ layer: null, setOnly: noop, addFilter: noop, patchFilter: noop, carriedSource: () => ({}) }).forEach((entry) => {
        if (entry.id.startsWith('sec:')) { items.push({ icon: SECTION_ICONS[entry.id.slice(4)] ?? 'square', path: `${RAIL_EXTRA_PREFIX}${entry.id}`, label: entry.label, sub: [] }); return }
        const row = { icon: entry.icon, path: `${RAIL_EXTRA_PREFIX}${entry.id}`, label: entry.label }
        const section = items[items.length - 1]
        if (section?.sub) section.sub.push(row); else items.push(row)
      })
      setRows(items)
    })
    return () => { on = false }
  }, [])
  return rows
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
  const labsRows = useLabsRows()
  const hubSettings = useHubSettings()
  const session = useLibrarySession()
  const account = useAccount()
  useAccountPrefs()
  const signInRef = useRef(null)
  /* the Hub's Media row (signed in — the r2b2 stores, read-only; plan 15 § 4): a pick lands in the
     chrome under it — or, from a shell page, in the editor it opens */
  const onMediaPick = (url, meta = {}) => {
    pickMedia({ url: proxied(url), srcType: isVideoType(meta.contentType) ? 'video' : 'image' })
    if (!onChrome) navigate('/editor')
  }

  /* Remember the pick, then leave for the chrome. */
  const enter = (id) => { setMode(id); navigate(withView(id)) }

  /* a labs pick pressed before labs is mounted — run when LabsNav publishes its dispatch */
  const pendingPick = useRef(null)
  useEffect(() => {
    const p = pendingPick.current
    if (p && extras.dispatch) { pendingPick.current = null; extras.dispatch(p) }
  }, [extras])

  /* Every hop is an SPA transition since 2026-08-27 — the chromes are lazy
     routes that mount and unmount like any page. */
  const onNavigate = (path) => {
    if (path?.startsWith(RAIL_EXTRA_PREFIX)) {
      if (!extras.dispatch) { pendingPick.current = path; enter('labs'); return }
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

  /* a file card opens its file in its chrome — UrlIntents reads `open` there */
  const openFile = (p) => navigate(`/${chromeOf(p)}?open=${encodeURIComponent(p.id)}`)
  /* Home re-reads on every library write — its own verbs, a save in a chrome, the sync's merge, another tab.
     The snapshot is the stored string (stable between writes); the parse runs only when it changes. */
  const raw = useSyncExternalStore(subscribeLibrary, readLibraryRaw, () => null)
  /* Home is the user's saves plus six PICKS from the Library (plan 40 § 2.1, user 2026-10-24: *"just select a few from
     library"*) — a couple per chrome, so a fresh browser opens on real work, not an empty grid */
  const shippedRaw = useSyncExternalStore(subscribeShipped, readShippedRaw, () => null)
  const saved = useMemo(() => {
    const picks = listShipped().filter((f) => HOME_PICKS.includes(f.id))
    return [...picks, ...(loadLibrary().preset ?? []).filter((p) => !p.shipped)]
  }, [raw, shippedRaw])
  /* ponytail: tags and notes are this session's until the library carries them (it has no write for either) */
  const [extra, setExtra] = useState({})
  const files = saved.map((p) => ({ ...fileOf(p), ...extra[p.id] }))
  const edit = (id, patch) => setExtra((x) => ({ ...x, [id]: { ...x[id], ...patch } }))
  const presetOf = (id) => saved.find((p) => p.id === id)
  /* BACK LANDS ON THE CARD (plan 40 § 2.2): Home's view and scroll are recorded when a card opens and restored on a Back.
     ponytail: HubHome keeps its view to itself (no onViewChange), so a press on a view label is read here; a KOL
     `onViewChange` on Home replaces the listener. */
  const onHome = location.pathname === '/'
  const popped = useNavigationType() === 'POP'
  useRestoreScroll('home', onHome)
  useEffect(() => {
    if (!onHome) return undefined
    const onClick = (e) => { const v = HOME_VIEWS[e.target?.textContent?.trim()]; if (v) writeSpot('home', { view: v }) }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [onHome])
  const home = {
    files,
    defaultView: popped ? readSpot('home').view : undefined,
    onOpen: (f) => { saveSpot('home'); openFile(presetOf(f.id)) },
    onDownload: (f) => downloadFile(presetOf(f.id)),
    onRename: (f, name) => { presetOf(f.id)?.shipped ? renameShipped(f.id, name) : renameStored('preset', f.id, name) },
    onDuplicate: (f) => { const p = presetOf(f.id); p?.shipped ? copyStored('preset', p, `${f.name} copy`) : duplicateStored('preset', f.id) },
    onRemove: (f) => { presetOf(f.id)?.shipped ? removeShipped(f.id) : removeStored('preset', f.id) },
    onTags: (f, tags) => edit(f.id, { tags }),
    onNote: (f, note) => edit(f.id, { note }),
    onCover: (f, src) => (presetOf(f.id)?.shipped ? setUploadedCover(f.id, src) : setThumbStored('preset', f.id, src)),
    action: { label: 'New File', onClick: openNewFile },
    /* SIGNED OUT (plan 44 W3, frames A2 · B2, HubHomeSignedOut kol-shell 0.86.0; user 2026-10-28: "we shouldnt see any
       files until you've LOGGED-IN") — no files, the growing line full-bleed behind, the chromes as the pill (the desk's
       dock, the phone's nav). Only where accounts exist: a build without the API has nothing to sign in to. */
    signedOut: getLibraryApi() ? !session : false,
    stage: <HomeStage />,
    chromes: [
      { icon: CHROMES.randomiser.icon, label: 'Generate', onPress: () => navigate('/randomiser?start=category') },
      { icon: 'filter', label: 'Effects', onPress: () => navigate('/randomiser?start=effects') },
      { icon: CHROMES.labs.icon, label: 'Labs', onPress: () => navigate('/labs') },
      { icon: CHROMES.morph.icon, label: 'Morph', onPress: () => navigate('/morph') },
      { icon: CHROMES.editor.icon, label: 'Editor', onPress: () => navigate('/editor') },
    ],
    /* THE CHROME CHOOSER ON A PHONE (user, 2026-10-26: the old mobile card, between the heading and the
       files; 2026-10-28: "I want taht instead of this 2x2") — HubHome's stacked doors under the eyebrow, the old
       EntryScreen's buttons with no card (HubHomePhoneChooser, kol-shell 0.85.0); the Hub draws them only on touch / narrow */
    touch: {
      label: 'Select chrome',
      doors: [
        { icon: CHROMES.randomiser.icon, label: 'Generate', onPress: () => navigate('/randomiser?start=category') },
        { icon: 'filter', label: 'Effects', onPress: () => navigate('/randomiser?start=effects') },
        { icon: CHROMES.labs.icon, label: 'Labs', onPress: () => navigate('/labs') },
        { icon: CHROMES.morph.icon, label: 'Morph', onPress: () => navigate('/morph') },
      ],
    },
  }
  /* the one card Home's handlers draw — Library takes it too (step 4) */
  const fileCard = (f) => ({ key: f.id, title: f.name, date: f.updatedAt, size: f.bytes, media: f.cover, tags: f.tags, details: f.details, mark: f.mark, onTags: (tags) => home.onTags(f, tags), note: f.note, onNote: (note) => home.onNote(f, note), verbs: { rename: (name) => home.onRename(f, name), duplicate: () => home.onDuplicate(f), remove: () => home.onRemove(f) }, download: () => home.onDownload(f), onClick: () => home.onOpen(f) })

  /* ⌥1…⌥7 — the rail top to bottom, HOME included. See the docblock for why
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

  return (
    <ModalProvider>
    <RailSignIn handlerRef={signInRef} />
    <NewFileDialog />
    {/* the live renderer for the covers only a mounted engine can draw (FileCover), one at a time, off the page */}
    <Suspense fallback={null}><CoverHost /></Suspense>
    {onChrome && <ChromeSettingsKey />}
    <AppStudio
      app={APP}
      currentPath={location.pathname}
      onNavigate={onNavigate}
      shortcuts={SHORTCUTS}
      shortcutsKey={onChrome ? null : 's'}
      home={home}
      walkthrough={WALKTHROUGH(enter)}
      library={{ children: <RailFrame><Outlet /></RailFrame> }}
      /* the chromes render through each page's Outlet. LABS IS A LEVEL (plan 37 § 7.2, user 2026-10-22) and always
         carries its categories (user 2026-10-24): the live rows (with their picks) on /labs, the catalog's shape
         everywhere else — a page row with `sub` enters by the preset's rule. */
      pages={CHROME_ROWS.map((c) => ({ ...c, children: <RailFrame><Outlet /></RailFrame>, ...(c.path === '/labs' ? { sub: extras.items.length ? extras.items : labsRows } : {}) }))}
      /* THE DEV PAGE (`/dev`, the `</>` rail row, dev server only) — the user's, and it stays even
         empty (user, 2026-10-23). Never retire it. */
      dev={{ tabs: [{ value: 'cards', label: 'Cards', content: <DevCards /> }, { value: 'fx', label: 'FX changelog', content: <FxChangelog /> }] }}
      settings={{ ...hubSettings, comboLabel }}
      /* the Hub draws the foot rows and owns the picker and the password / sign-out dialogs */
      media={session ? { client: getMediaClient(), accept: ['image', 'video'], onSelect: onMediaPick } : undefined}
      signIn={getLibraryApi() ? { signedIn: !!session, user: account ? { name: account.name || account.email, avatar: account.avatar ?? undefined } : undefined, onProfile: () => navigate('/account'), onPress: (creds) => signInRef.current?.(creds) } : undefined}
      shell={{ railToggleKey: '\\', navKeys: false, settingsKey: onChrome ? undefined : ',' }}
    />
    </ModalProvider>
  )
}
