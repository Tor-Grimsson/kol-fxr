# Playbook — Workspace sidebar geometry

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** One collapsible sidebar geometry for the three workspace apps — kol-fxr (labs), kol-monitor, kol-mirror. Prove it here in `LabsNav`, then file it to kol-ds-ui as the reference implementation rather than a clean-sheet request.

**Standing rules (non-negotiable):**
- Prove it in fxr FIRST; the DS ticket carries a working reference, not a wish (user, 2026-08-27: "you can work it out here first tho").
- Same geometry for all three — a fourth hand-tuned sidebar is the opposite of the ask.
- THE COLLAPSE RULE: a row that survives collapse HAS AN ICON. A row without one is not a row, it is a label — it vanishes instead of narrowing.
- Labs' leaves DISPATCH, they do not route. `LabsView.jsx:283` records why: `?preset=` syncs with `replace`, never push, so the back button leaves labs rather than walking a preset history. Do not route the picks to make a component fit.
- No local DS shims. A gap goes to the kol-ds-ui lobby.

## Entry format

```
[HH:MM] · <area> · <file:line>
  what → <one line>          why → <one line>
  verify → build <✓/✗> · <check> <✓/✗>
  note → <decision / exception>
```

Status legend: `✓` done+verified · `~` in progress · `⤺` reverted · `▣` quarantined · `★` rescued.

---

[22:14] · survey · three repos
  what → three sidebars, none shared: LabsNav 576 · MirrorSidebar 543 · LabsNav's peers ModuloSidebar 250 (~1,370 lines, one job)
  why → user: "I see these 3 as very similar things" / "I would rather all use the same geometry layout"
  note → ONLY fxr's collapses (useDragResize + `:root[data-sidenav]` + `kol-sidenav-*` + Tooltip). Monitor's and mirror's cannot collapse at all, so "same geometry" cannot come from copying either.

[22:14] · survey · LabsNav.jsx
  what → fxr wears SideNav's whole class vocabulary (`kol-sidenav-hop/-icon/-label/-caret/-list/-group/-tree/-grab`) but does NOT import SideNav
  why → the tell: the geometry is wanted, the component will not take the content
  note → SideNav's leaves are `NavLink to=` — route-only, no action seam. That is the DS ask, not a labs defect.

[22:14] · geometry · LabsNav.jsx (SECTION_ICONS, NavSection, sectionOpen)
  what → the five sections get glyphs (filter · layers · type · frequency · mode-toggle-01); NavSection renders the shared hop row when collapsed, the eyebrow when open; `sectionOpen` no longer forces every group open while collapsed
  why → collapsed used to drop the four text-only sections entirely and render ~20 group glyphs with no grouping — two different UIs, not one narrowing. Collapsed is now the five sections, the brand rail's shape.
  verify → build ✓ · collapsed render ✗ (not yet measured with a real gesture)
  note → the grab edge is `onPointerDown`/`onKeyDown`, NOT `onClick` — an earlier `.click()` test reported "collapse broken" and was wrong. Measure with a pointer gesture or the keyboard.

[22:14] · lobby · draft parked
  what → `WorkspaceSidebarGeometry` draft moved OUT of `kol-ds-ui/lobby/inbox/` into `_tmp/2026-08-27-workspace-sidebar/`
  why → it had no ledger row; a file in an inbox the ledger does not know about is the invisible state the lobby law exists to prevent. Files when the geometry is proven here.

[22:17] · verify · LabsNav collapsed/expanded round-trip
  what → real gesture works: focus the `.kol-sidenav-grab` separator + Enter → `data-sidenav="collapsed"`, rail 256 → 56px
  why → the grab edge is `onPointerDown`/`onKeyDown`; `.click()` is a no-op, which is what made an earlier check report "collapse broken"
  verify → build ✓ · collapsed = 5 section glyphs + 5 nav destinations, 0 leaves, 0 eyebrows ✓ · expanded = 11 rows / 5 eyebrows / 256px, unchanged ✓ · tooltip names every collapsed row ("Effects") ✓ · console clean ✓
  note → `mode-toggle-01` reads a little like the Labs globe at 16px; structurally different (5 shapes vs 2) and semantically right for Mode, so kept.

[22:17] · geometry · PROVEN
  what → the collapse rule holds in fxr: every surviving row has a glyph, collapsed is section-level, expanded is untouched
  note → ready to file. The reference is `LabsNav.jsx` — SECTION_ICONS + NavSection's two states + `sectionOpen` no longer forcing groups open while collapsed.

[22:26] · DS · returned same day
  what → `WorkspaceSidebarGeometry` closed as **kol-framework 0.30.0**: action leaves `{label,onSelect,active}` at any depth · router-agnostic via `currentPath` + `onNavigate` · the collapse rule as `.kol-sidenav-section`
  note → my own doing: I had moved the unfiled draft OUT of their inbox (no ledger row = invisible), they had already read it, and my re-file then duplicated their `done/` copy. Duplicate pulled back to `_tmp/`; theirs stands.

[22:26] · adopt · LabsNav.jsx 576 → 379
  what → the whole hand-rolled tree replaced by a navTree fed to `SideNav`; sections are bare labels, icon categories are their SIBLINGS (nesting them would take the subtree down with the label on collapse); app destinations are route rows at the head
  why → LabsView hides AppShell's rail while labs is mounted, so the destinations have to live in this rail
  verify → build ✓ · 5 section labels + 28 icon rows ✓ · disclosure Halftone → Dither/ASCII/Bitmap, pick lands in the right rail ✓ · **history.length unchanged and URL unmoved on a pick** ✓ (the replace-not-push contract) · collapse 229 ⇄ 32px, stamp set/cleared, 28 icons survive, 0 labels/lists collapsed ✓ · console clean ✓
  note → ▣ retired to `_tmp/2026-08-27-workspace-sidebar/`: NavIcons · NavSectionGroup · NavSection · NavGroup · NavLeaf · LeafGroupLabel · local useDragResize/open-key/open-section · `.kol-labs-eyebrow` collapse rule

[22:26] · trap · useDragResize
  what → removing the local rail left a LIVE `useDragResize(asideRef)` call with no import
  why → worth naming: the bundler builds green on that — it is a runtime ReferenceError, not a build error. Told the DS, for the next repo adopting.

──────────── MILESTONE: workspace sidebar geometry ──────────── [22:26]
  changed: LabsNav.jsx · kol-labs.css · package.json · pnpm-workspace.yaml · lobby (receipt + ledger)
  quarantined: 7 (6 components + 1 CSS rule) · build ✓ · remainder none
  note: kol-monitor's ModuloSidebar and kol-mirror's MirrorSidebar swap in their own tickets — fxr is the reference.

[22:33] · adopt · AppShell navKeys · src/AppLayout.jsx:75
  what → kol-shell 0.12.0 `navKeys` — Option+1…9 → `items[n-1].path` via onNavigate; user ruling across monitor · mirror · fxr
  verify → dispatched `code: 'Digit1'` + altKey from /labs → landed on /library ✓ · build ✓
  note → Option not Command (⌘1–9 is the browser's tab switch); matched on `e.code` because Opt+digit yields `¡ ™ £ ¢` as `e.key` on macOS. Our order: ⌥1 Library · ⌥2 Editor · ⌥3 Labs · ⌥4 Randomiser — Settings is in `bottomItems`, not `items`, so it has no digit. Earns its keep most in LABS, where the shell rail is hidden and this is the only way out without opening the sidebar.

[22:33] · fix · the 32px collapsed rail · src/editor/styles/kol-labs.css
  what → `.kol-editor-labs .kol-editor-rail-body > .kol-sidenav { flex: 1; width: 100% }`
  why → NOT the token and NOT the track, both measured correct at 56px. SideNav mounts inside `.kol-editor-rail-body`, a flex container, so the aside sized to its own content: grid track 56 › .kol-editor-left 56 › .kol-editor-rail-body 55 › .kol-sidenav **32**. A stretch problem, not a width one.
  verify → 55/56 collapsed · 255/256 expanded ✓ · build ✓
  note → the DS's first read blamed `--kol-rail-w-collapsed` at kol-labs.css:50; that line is the RIGHT rail's `data-rail` track. Correction accepted and it is in 02-shells.md now, citing the 32-in-56 measurement, so monitor and mirror get it from the doc before their swaps.

[22:33] · deps · latest across the board
  what → shell 0.12.0 · component 0.118.3 · theme 0.79.0 · framework 0.30.0 · icons 0.24.0 · brand 0.1.3
  note → component 0.118.2's ContentFilters fill fix is a NO-OP here: fxr has no `PageShell mode="fixed"` page at all (grepped), so there was no fill chain to break. Took the bump anyway; told monitor not to wait on a confirmation.

[22:50] · BUG · LabsNav.jsx — "can't leave labs from the sidebar"
  what → `navigate is not defined` on every destination row click
  why → `useNavigate()` / `useLocation()` were called INSIDE the local `NavIcons` component. Retiring it took the hook calls with it; the navTree's `onNavigate` still referenced `navigate`. Build green throughout — the exact runtime-not-build trap logged at 22:26, and I walked into it one entry later.
  fix → both hooks in the `LabsNav` body ✓ · Library click → /library, shell rail returns ✓
  note → lesson: after retiring a component, grep for every identifier its body DECLARED, not just the ones it imported. `useDragResize` was caught because it was an import; `navigate`/`location` were locals and were not.

[22:58] · labs · the rail's order + no topbar + opens collapsed
  what → navTree head: Home (`kolkrabbi` raven) · Library · Editor · Labs · Randomiser; Settings LAST (above the theme slot); MODE section gone (its three rows are the destinations). `LabsMenuTop` retired to `_tmp/2026-08-27-labs-topbar/` — Mode → the rows, theme → SideNav's slot, Settings dropdown → the /settings page (added the one row it lacked: Loop length). Labs opens COLLAPSED via a render-phase `localStorage['kol-sidenav']='collapsed'` seed (only when unset).
  verify → build ✓ · fresh load: stamp collapsed, 55px, no `.kol-editor-topbar`, order Home…Settings, theme slot ✓ · expand: 255px, 4 sections, Home first / Settings last ✓ · console clean ✓

[22:58] · MEASURED · the transition is not seamless, and it cannot be from here
  what → shell rail (kol-shell NavRail): 48 wide · 20px glyph at x 13.5 · 40 pitch · first glyph y 76 · bottom theme→Settings. Labs collapsed (kol-framework SideNav): 56 · 16px at 19.5 · 38 · y 26 · bottom Settings→theme→"K". Every icon moves on the route into labs; the canvas shifts 8px.
  why → two DS components, never measured against each other. Matching them from fxr = reaching into `.kol-sidenav-hop` / NavRail's button box — the shim the no-shims ruling forbids.
  note → user ruling, verbatim: "maintain the position of the icons, to the pixel" · "I think it's best in brand" · "same component both states super nice". Filed `RailSideNavPixelParity` → kol-ds-ui with the table: AppShell's rail IS a collapsed SideNav, NavRail retires into it, `bottomItems`, one width token.

[23:10] · DS · RailSideNavPixelParity returned same hour
  what → framework 0.31.0 (SideNav: bottomItems · footer · themeToggle · iconComponent · expandOnSelect · defaultCollapsed) · theme 0.80.0 (`--kol-shell-rail-width` live, `.kol-shell-rail` retired) · shell 0.13.0 (AppShell's rail IS a collapsed SideNav via a NavRail adapter; logomark → footer)
  note → the ruling landed as asked: one component, both states.

[23:10] · adopt · LabsNav.jsx mounted prop-for-prop as NavRail
  what → bottomItems (Settings out of the tree) · footer = the logomark button → / · expandOnSelect=false · defaultCollapsed (replaces `seedCollapsedOnce`, dropped) · hairline · same isActive. Home row GONE (it shifted every destination 38px). `.kol-editor-left { border-right: 0 }` in labs scope — it doubled SideNav's hairline and ate the 55-vs-56 pixel.
  verify → build ✓ · stamp cleared, both routes booted from the DS default · /library and /labs IDENTICAL: rail 56 · Library 26 · Editor 64 · Labs 102 · Randomiser 140 at x 19.5 · footer 844 with logomark ✓ · destination press: stamp + storage stay collapsed, lands on /library on the same pixels ✓ · category press while collapsed: rail opens + discloses (not gated by expandOnSelect — correct) ✓ · console clean ✓
  note → ONE DS FINDING: theme slot + bottomItems live INSIDE `.kol-sidenav-scroll`. Short tree (/library): theme 760, Settings 802, above the footer. Labs' 26-row collapsed tree: theme 934, Settings 976 — below a 900 viewport, below the footer. "Pinned" only while the tree is shorter than the rail. Reported to the DS; not shimmable here.

──────────── MILESTONE: one rail, both states ──────────── [23:10]
  changed: LabsNav.jsx · LabsView.jsx · kol-labs.css · SettingsPage.jsx · package.json · pnpm-workspace.yaml · lobby (2 receipts, ledger)
  quarantined: LabsMenuTop.jsx + earlier rail pieces · build ✓ · remainder none
  open (DS): pin theme + bottomItems outside the scroll region

[23:14] · DS · framework 0.31.1 — the pinning fix
  what → theme slot + bottomItems are the block AFTER `.kol-sidenav-scroll`, above the footer; only the tree scrolls
  verify → bumped · /library (5 rows) and /labs (25 rows) IDENTICAL: Library 26 · Randomiser 140 · theme 760 · Settings 802 · footer 844 ✓ · theme + Settings measured outside the scroll region ✓ · build ✓ · console clean ✓
  note → the tree-head rule (the head must be the shell's items, nothing above them — 38px off otherwise) is in 11-shell-system.md now, citing labs. Every KOL package at latest.

──────────── MILESTONE: pixel parity, closed ──────────── [23:14]
  the transition /library ⇄ /labs moves nothing. One rail, both states, every row on the same pixel.
  open: nothing on this arc.

[23:19] · DS FYI · framework 0.32.0 — SideNavWidthLadder (kol-website's ruling)
  what → `--kol-sidenav-w` is 264px, 320px from 1536 (was one 16rem); collapsed untouched
  verify → bumped · at 1440: token 264px, rail 264, labs grid `--_nav-track` 264 — flows through, no fxr change ✓ · collapsed still 56 · 26 · 140 · 760 · 802 · 844 ✓ · build ✓
  note → a stored drag width (`kol-sidenav-w`) still wins on load; cleared it to measure the ladder itself.

[23:21] · CORRECTION · the logomark
  what → user: "why did you move the logo from top to bottom?" / "I've never seen that before so you are the first"
  why → shell 0.13.0 moved the logomark into the footer because SideNav has no header slot. Not in the ruling ("one component, both states"). I read "logomark moved to the footer" in the DS's return as plumbing, not as a visible design change the user had not asked for, and matched labs to it. Consumer's miss as much as the DS's.
  fix → filed `RailLogomarkAtTop` → kol-ds-ui: SideNav `header` slot inside the rail geometry, NavRail puts the raven there, footer back to the wordmark. On return: labs passes the same header, drops its footer logomark, re-measure.
  note → lesson: a DS return can carry decisions beyond the ruling. Read the return for what CHANGED visibly, not only for what the remainder says to do.

[23:32] · user rulings, in one pass · "just make local changes … we make it work here then ship it"
  what → (1) logo back on TOP · (2) Settings where the logo was · (3) Settings opens/closes on click and click again · (4) theme toggle INTO settings, OUT of the sidebar · (5) "what's going on with the yellow accent?"
  note → (5) answered, not changed: `.kol-sidenav-hop.is-active .kol-sidenav-hop-icon { color: var(--kol-accent-primary) }` (kol-theme atoms:752) — the DS's active-row icon colour, not fxr's. A theme rule; shimming it locally is the shim the no-shims ruling forbids. Goes on the ship list if he wants neutral.

[23:32] · DS · RailLogomarkAtTop returned same hour — framework 0.33.0 `SideNav header`, shell 0.13.1 NavRail puts the logomark there, `footer={false}`
  what → bumped both; labs passes the SAME header node NavRail does (copied); footer off
  verify → header y 0 on both routes, first glyph 62 on both (moved down by the header's height, identically, as predicted) ✓

[23:32] · local · Settings disclosure — src/editor/labs/RailSettings.jsx + LabsNav.jsx
  what → trigger = a `bottomItems` ACTION leaf (`onSelect: toggle, active: open`) so the gear is the same pinned row as the shell rail's Settings (858 on both); panel = a portal to <body> sitting on the row's top edge, the rail's width: theme toggle (icon collapsed / hop-bare expanded) + the Settings page row. Click again closes; Escape closes; navigating closes. `themeToggle={false}` on BOTH rails (AppShell + labs) — the toggle lives in the disclosure and on the /settings page.
  verify → /labs: header 0 · Library 62 · Randomiser 176 · Settings 858 = /library exactly ✓ · open on click, theme inside, panel meets the row top (765), gear lit, stamp unchanged ✓ · closed on second click ✓ · Escape ✓ · console clean · build ✓
  note → shell rail on / · /library · /settings keeps Settings as a ROUTE row (NavRail has no footer/disclosure seam) — same gear, same pixel, a click opens the page. Both rails behaving identically = the ship-it ticket, this file the reference.

[23:32] · BUG (mine) · a JS comment rendered as 1824px of TEXT in the rail
  why → I opened the `<>` fragment ABOVE the block comment that sat between `return (` and `<SideNav`; inside a fragment a `/* */` is a text child. Screenshot showed the comment prose in the rail; every y was +1824.
  fix → `{/* … */}` ✓
