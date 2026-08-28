/**
 * Editor modes — which chrome the standalone app boots into (plan.md Phase
 * 11.5). Three, all over the same engine and the same provider stack:
 *
 *   editor     — the compositor (layers, frames, tools)
 *   labs       — standardized output, full capability, no compositor UI
 *   randomiser — the randomize-only playground (editor/mobile)
 *
 * The chooser writes the pick here; `?view=` always overrides it, so a link
 * can force a chrome without disturbing what the user chose. Standalone app
 * only — the embedded <DesignEditor /> is always the editor (src/index.jsx).
 */

export const MODES = [
  { id: 'editor', view: 'desktop', label: 'Editor', blurb: 'The full compositor — layers, frames, tools.' },
  { id: 'labs', view: 'labs', label: 'Labs', blurb: 'One generator or source on a standardized output. Effects, generative, modulation — no compositor.' },
  /* view: 'randomiser', NOT 'mobile' (2026-08-15). Picking a MODE and escaping
     a DEVICE opt-in are two different jobs, and one URL was doing both:
     `?view=mobile` also clears the tablet's persisted desktop choice, which is
     right for "get me out of desktop on this tablet" and wrong for "open the
     randomiser on my laptop". `goMobile()` in mobile/device.js still owns
     `?view=mobile` for the device job; mode entries use their own ids. */
  { id: 'randomiser', view: 'randomiser', label: 'Randomiser', blurb: 'Roll the dice: pick a category and randomize.' },
]

export const modeById = (id) => MODES.find((m) => m.id === id) ?? null

/* ── The route map ───────────────────────────────────────────────────
 *
 * 2026-08-15: the app got a real router (`App.jsx`), so a view is a PATH, not
 * a `?view=` query string. `withView` keeps its name and its contract — hand
 * it a view name, get the URL that opens it — so every existing call site
 * (device.js, the menus, the home cards) kept working unedited. Only what it
 * RETURNS changed.
 *
 * `desktop` and `mobile` are the older spellings of the editor and randomiser
 * chromes; both still resolve, because `goDesktop`/`goMobile` speak them and
 * old links exist. The legacy `?view=` form still redirects — see App.jsx. */
export const VIEW_PATHS = {
  home:       '/',
  settings:   '/settings',
  library:    '/library',
  editor:     '/editor',
  desktop:    '/editor',
  labs:       '/labs',
  randomiser: '/randomiser',
  mobile:     '/randomiser',
  output:     '/output',
}

/* Navigate by URL, never flag-and-reload: a forced view would survive the
 * reload and loop. The way OUT of a view has to set the URL. (This is the
 * lesson `mobile/device.js` already paid for — it imports `withView` here.)
 *
 * Full page assignment, not a router `navigate()`, and deliberately: this is
 * called from plain modules (device.js) that have no hook context, and a
 * chrome swap tears down the whole provider stack anyway. The rail's own
 * shell-tier hops DO use `navigate()` — see AppLayout. */
export const withView = (view) => VIEW_PATHS[view] ?? '/'

const MODE_KEY = 'kol-editor:mode'

export const getMode = () => {
  try { return localStorage.getItem(MODE_KEY) } catch { return null }
}
export const setMode = (id) => {
  try { id ? localStorage.setItem(MODE_KEY, id) : localStorage.removeItem(MODE_KEY) } catch { /* storage blocked */ }
}

/* Router bridge (2026-08-27): App.jsx registers the router's `navigate` so a
   chrome hop is an SPA transition, not a reload; with no router (the embedded
   lib) it stays a full load. */
let navigator = null
export const setNavigator = (fn) => { navigator = fn }
export const navigateTo = (path) => { if (navigator) navigator(path); else window.location.assign(path) }

/* Pick a mode: remember it, then go. */
export const goMode = (id) => {
  const mode = modeById(id)
  if (!mode) return
  setMode(id)
  navigateTo(withView(mode.view))
}

export const goEditor = () => goMode('editor')
export const goLabs = () => goMode('labs')
export const goRandomiser = () => goMode('randomiser')

/* Back to Home — forget the pick, so the next bare visit lands here too. */
export const goChooser = () => {
  setMode(null)
  navigateTo(withView('home'))
}

/* WHICH CHROME IS ON SCREEN, as a mode id — 'editor' | 'labs' | 'randomiser'
 * (2026-08-15, for the view-aware keymap).
 *
 * Reads the PATHNAME, which is the single source App.jsx routes on. Read
 * fresh rather than held in context: every caller runs inside a chrome that
 * (re)mounts on its own route, so a value read at call time is current.
 *
 * The shell-tier paths ('/', '/settings', '/library') and '/output' return
 * null — no chrome, so no chrome keymap. */
const PATH_TO_MODE = {
  '/editor': 'editor',
  '/labs': 'labs',
  '/randomiser': 'randomiser',
}

export const currentView = () => {
  if (typeof window === 'undefined') return null
  return PATH_TO_MODE[window.location.pathname] ?? null
}
