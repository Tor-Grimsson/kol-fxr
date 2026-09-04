import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AppLayout from './AppLayout'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
/* The router bridge and the device gate come from the PACKAGE, not a local
   copy — `mode.js` holds `let navigator` as module state, so registering the
   router on our copy left the package's null and every in-package hop fell
   back to `window.location.assign`: a full reload dressed as a working
   navigation. Same single-copy rule as railExtras. */
import {
  isMobileDevice, wantsDesktop, setWantsDesktop, VIEW_PATHS, setNavigator,
} from '@kolkrabbi/design-editor'

/* The chromes are LAZY routes (2026-08-27): each carries its own engines, so
   none of them rides the shell tier's bundle, and a hop between two chromes
   is an SPA transition — the previous chrome unmounts, the next one mounts. */
/* The editor is the PACKAGE now (@kolkrabbi/design-editor, built and gated in
   kol-ds-ui) — this app is its consumer, not its publisher. Its stylesheet
   rides the lazy chunk so the shell tier never carries it. `mediaProxyBase`
   is the same-origin path vercel.json rewrites to the CDN; without it the
   filter and export paths taint the canvas. */
const Editor = lazy(async () => {
  const [{ DesignEditor }] = await Promise.all([
    import('@kolkrabbi/design-editor'),
    import('@kolkrabbi/design-editor/style.css'),
  ])
  return { default: () => <DesignEditor mediaProxyBase="/media/" /> }
})
/* Labs and mobile are alternate CHROME over the same engine, not consumers of
   it — they read the editor's stores directly — so they ship inside the package
   too (0.4.0). Two copies of `compose/state` meant two React contexts and the
   package's provider could never satisfy a local hook. */
const LabsView = lazy(async () => {
  const [m] = await Promise.all([
    import('@kolkrabbi/design-editor'),
    import('@kolkrabbi/design-editor/style.css'),
  ])
  return { default: m.LabsView }
})
const MobileView = lazy(async () => {
  const [m] = await Promise.all([
    import('@kolkrabbi/design-editor'),
    import('@kolkrabbi/design-editor/style.css'),
  ])
  return { default: m.MobileView }
})
const OutputView = lazy(async () => {
  const [m] = await Promise.all([
    import('@kolkrabbi/design-editor'),
    import('@kolkrabbi/design-editor/style.css'),
  ])
  return { default: m.OutputView }
})

/* Hands the router's navigate to mode.js so its goMode/goChooser and
   device.js's goDesktop/goMobile hop in-app instead of reloading. */
function RouterBridge() {
  const navigate = useNavigate()
  useEffect(() => { setNavigator(navigate); return () => setNavigator(null) }, [navigate])
  return null
}

/**
 * Standalone editor host — a real router since 2026-08-15.
 *
 * WHY IT CHANGED. The shell tier landed the day before as two more branches in
 * a `?view=` if-ladder, which is not the system kol-mirror and kol-monitor
 * run: there, a router feeds `AppShell` and `/` IS home. Here `/` fell through
 * to the remembered chrome, so home was a place you could only reach by typing
 * a query string. The earlier "no router" ruling was made partly because
 * `AppShell` wants `currentPath`/`onNavigate` — which is exactly the three
 * lines a router supplies.
 *
 * TWO TIERS, ONE ROUTER:
 *
 *   under AppLayout    /  ·  /library  ·  /settings  ·  /editor · /labs · /randomiser
 *   top level          /output
 *
 * The chromes sat outside the layout until 2026-08-27; the user ruled the rail
 * stays visible in every mode (hidden by `\`, see `AppLayout.jsx`). `/output`
 * stays outside: a chromeless recording surface with nothing over it at all.
 *
 * THE RANDOMISER IS A CHROME, NOT A DEVICE FALLBACK. It is the touch-first
 * surface, but a pointer user is entitled to open it deliberately, so it has
 * its own route that does NOT touch the desktop opt-in. Escaping that opt-in
 * on a tablet is `goMobile()`'s job, and it now writes the flag itself rather
 * than relying on a routing side effect (`mobile/device.js`).
 *
 * The device gate applies at `/` ONLY: a touch-primary device that has not
 * opted into desktop gets the randomiser instead of home. Ask for any other
 * path and you get it — reaching for `/settings` on a phone is explicit.
 */

/* Legacy `?view=` links still resolve — `?view=output` in particular is opened
   in a second tab as a screen-recording surface and is documented as such, so
   breaking it would break a workflow, not just a bookmark. One redirect, and
   `VIEW_PATHS` is the same map `withView()` navigates by, so the two spellings
   of a destination cannot drift. */
function LegacyViewRedirect({ children }) {
  const { search, pathname } = useLocation()
  const view = new URLSearchParams(search).get('view')
  if (!view) return children
  const path = VIEW_PATHS[view]
  if (!path || path === pathname) return children
  /* `?view=mobile` used to clear the desktop opt-in as a side effect of
     routing. Honoured here so old links keep meaning what they meant. */
  if (view === 'mobile') setWantsDesktop(false)
  return <Navigate to={path} replace />
}

function HomeRoute() {
  if (isMobileDevice() && !wantsDesktop()) return <Navigate to="/randomiser" replace />
  return <HomePage />
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterBridge />
      <LegacyViewRedirect>
        <Suspense fallback={null}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* the chromes ride under the rail too (user, 2026-08-27 — "show the
                sidebar in each mode"); `\` hides it, see AppLayout */}
            <Route path="/editor" element={<Editor />} />
            <Route path="/labs" element={<LabsView />} />
            <Route path="/randomiser" element={<MobileView />} />
          </Route>
          <Route path="/output" element={<OutputView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </LegacyViewRedirect>
    </BrowserRouter>
  )
}
