# Handoff — 2026-08-15 17:40

## Goal of the current arc

The shell tier landed in kol-fxr as **another `?view=` route**, not as the app
system kol-mirror and kol-monitor already run. The user's words: *"kol-shell
should have created a system like kol-mirror and kol-monitor have — home
loading, library, settings, etc."* Closing that gap is the arc.

## Last actions taken (causal trail, newest first)

- Read kol-mirror's and kol-monitor's `App.jsx` to establish what "the system"
  actually is, instead of describing kol-fxr's routing in the abstract.
- Answered two user findings: the lobby here is an **outbox stub only**, and
  bare `localhost:5173` never lands on home.
- Wrote the session log for the rail defect sweep + trimmed AGENT-CONTEXT's
  chain to the 5-entry cap.
- Told the kol-ds-ui agent it was clear to enter this repo, with four
  corrections to its edit list (`LabsRail.jsx` doesn't exist; the keybind is
  `I` not `H`; `AutoControls`' Hint site is prop-fed; the divider hairline is
  deliberately unscoped). It then completed the four-ticket adoption.
- Landed the rail defect sweep itself — input, labels, sections/dividers,
  preset roll, rail width, helper prose, focus — and filed four DS tickets.

## Current state / open decision points

**The gap, precisely.** kol-fxr (`src/App.jsx:43-65`): no router, by an
explicit earlier ruling ("AppShell/NavRail want currentPath/onNavigate and a
48px rail for three destinations is chrome for its own sake"). `?view=home`
and `?view=settings` are two more branches in the same if-ladder as `output` /
`desktop` / `labs` / `randomiser`. With **no `?view=`** it falls through to the
remembered mode (`CHROMES[mode.id] ?? Editor`) — so you land in your last
chrome, never home.

kol-mirror (verified): `BrowserRouter` + `Routes`; a `Shell()` component wraps
`AppShell` from `@kolkrabbi/kol-shell`, reads `useLocation()`/`useNavigate()`
and passes `currentPath`/`onNavigate` down — the package is router-agnostic by
design, so the consumer supplies the router. `NAV_ITEMS` (Library, Studio) +
`BOTTOM_ITEMS` (Settings) + `LOGOMARK`. Routes under one
`<Route element={<Shell/>}>`: `/` → HomePage · `/library` · `/studio` ·
`/settings`. kol-monitor is the same shape with more depth (`/rack` with
preset/patch children, `/create`, `/library/:moduleType`).

**So the system is:** router → AppShell wrapping an `<Outlet/>` → `/` IS home →
library and settings are peer rail destinations, not query strings.

1. **The no-router ruling must be revisited or re-affirmed — user's call.**
   It was rejected partly *because* AppShell wants `currentPath`/`onNavigate`,
   which is exactly what mirror satisfies in three lines.
2. **What is kol-fxr's destination list?** The three chromes (editor · labs ·
   randomiser) are arguably the destinations, with home + settings as frame.
3. **Does `/library` exist here?** Both reference apps have one. kol-fxr has a
   saved-preset library and a media library but no library PAGE.

**Open, unrelated to the shell:**

- **The lobby is an outbox stub** — `lobby/` has `outbox/` only; no `inbox/`,
  `done/`, or `INDEX.md`, and this repo isn't in the lobby registry, so
  `lobby-close` silently skips every receipt. Four receipts from 2026-08-15
  sit unledgered.
- Eyebrow sweep deferred by the user: ~15 places hand-type
  `kol-helper-10 text-meta` instead of using the DS `Section`.
- Section eyebrows render sentence-case since the `text-transform` hack was
  deleted — author them uppercase if that's wanted.
- **Nothing from the DS adoption has been rendered in a browser.** Both agents
  said so independently. The right-rail drag and the placeholder gate have
  never been watched working.

## Next intended action

Get the user's ruling on decision 1 before touching `App.jsx`. If it's "follow
mirror", the shape is proven: `BrowserRouter` + `Shell()` wrapping `AppShell` +
a `src/pages/` set, chromes as routes rather than `?view=` branches. The
`?view=` params must keep working as deep links regardless — `?view=output` is
opened in a separate tab as a recording surface and must not break.

## Working memory not yet in AGENT-CONTEXT

- `src/editor/home/` already holds `HomeView.jsx` + `SettingsView.jsx`, so a
  router migration renames/moves rather than writing from scratch.
- kol-shell is currently in **devDependencies only**.
- Mirror deliberately passes **no `iconComponent`** — the rail runs on the DS
  Icon and the DS set. kol-fxr passes `iconComponent={EditorIcon}` widely; a
  real difference to resolve.
- Mirror's `LOGOMARK` is `{ svgUrl, title }` pointing at a public SVG; kol-fxr
  needs an equivalent.
- Mirror drops its dev capture route from prod via
  `import.meta.env.DEV` + lazy — a pattern worth copying for `?view=output`.
