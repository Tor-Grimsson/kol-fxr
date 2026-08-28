# Playbook — the kol-shell home + settings tier

Started 2026-08-15 15:28. Source: user proposal, scoped against two read-only
sweeps (kol-shell's surface, kol-fxr's chrome).
Append-only. One line per idea. Verdicts are source-verified unless marked LIVE-CHECK.

---

## 15:28 — The proposal, stated precisely

- **kol-shell wraps HOME and SETTINGS — the surfaces BEFORE you enter a chrome. The editor, labs and randomiser stay exactly as they are, behind it.**
- This is NOT "put the editor on kol-shell". That was scoped earlier today and rejected: kol-shell is a fixed 48px icon rail with no grid, no third column and no resize primitive, so wrapping the editor would add a FOURTH column beside the 256px LabsNav — two navs, and a downgrade on the one axis an editor cares about.
- The user's counter was the correct read: the pre-entry tier is multi-PAGE app chrome, which is exactly what kol-shell is.

## 15:28 — kol-shell's actual surface (source-verified)

- Exports: `AppShell` · `NavRail` · `PageShell`/`PageBleed` · `PageHeader` · `TabStrip` · `GridCard` · `SettingsScaffold`(+`SettingsSection`,`LabelRow`) · `WalkthroughPanel` · `ShortcutsOverlay` · `Logomark` · `NavHiddenContext`/`useNavHidden`.
- `AppShell` is NOT a grid: `position: fixed` rail + `marginLeft: var(--kol-shell-rail-width)` on a plain div. The "second column" is a margin.
- `NavRail` items are flat `{ icon, path, label }` — deliberately NOT kol-framework SideNav's two-level tree. Active = exact match for `/`, else `currentPath.startsWith(path)`.
- **`useNavHidden` is the documented seam for this exact split** — its source says "pages with a full sidebar of their own (monitor's rack, mirror's studio) set this to replace the global rail with their own nav header row." Our three chromes are that case.
- `SettingsScaffold({ tabs, defaultTab, renderContent })` renders `PageShell mode="fixed"` + tab-driven `PageHeader` + `TabStrip` + a scrolling body. `LabelRow` is a 160px label column.
- `ShortcutsOverlay({ shortcuts, onClose })` — display-only. `shortcuts` is `[{ label, keys }]`, `keys` is a display STRING, never bound. Only listener is Esc-to-close.
- **kol-shell has ZERO `localStorage`.** It renders a settings page; it does not store settings. `NavHiddenContext` is ephemeral `useState`.
- `--kol-shell-rail-width: 48px` on `:root`, read by both the rail and the content offset — overridable, but global, no per-instance seam.
- **`NavRail` hardcodes kol-framework's `ThemeToggle`** (NavRail.jsx:2).

## 15:28 — Peer deps: kol-shell 0.3.0 is installable TODAY

- Requires component >=0.38.0 · framework >=0.20.0 · icons >=0.16.0 · theme >=0.41.0.
- We are on 0.46.0 / 0.22.0 / 0.17.0 / 0.43.1. **All four satisfied.** No blocker.

## 15:28 — What kol-fxr has today

- `App.jsx` is a `?view=` switch. **No router. `react-router` is not installed** — verified against package.json, all three dep blocks.
- **Router-free is NOT written in ARCHITECTURE.** Grep returns nothing. It is a de-facto state, not a law — which means adopting one is a real decision, not a violation.
- `mode.js` already models this tier: `MODES = [{id, view, label, blurb}]` for editor/labs/randomiser, `getMode`/`setMode` on `kol-editor:mode`, `withView()` for URL navigation, and the explicit rule "navigate by URL, never flag-and-reload".
- `ModeChooser.jsx` is the first-visit picker — standalone app only; the embedded `<DesignEditor />` never sees it.
- **Settings is TWO topbar dropdowns, already drifted:** `shell/MenuTop.jsx:390` (default aspect, loop theme, autoplay, clip-to-frame) and `labs/LabsMenuTop.jsx:40` (default aspect, theme, loop length, mod dots). Both write the same `appSettings` store. There is NO settings page.
- **Shortcuts is TWO overlays:** `shell/ShortcutsOverlay.jsx` (99 lines, keymap-driven, opened by the `kol:show-shortcuts` window event) and `labs/LabsShortcuts.jsx` (147 lines, hand-maintained `EXAMPLES`/`FUNCTIONS`/`KEYS` arrays, binds its own `S`). Near-identical scaffolding, own scrim, own Esc.
- `lib/appSettings.js` is a versioned localStorage store with pub/sub — `VERSION = 1`, key `kol-editor-settings`, mismatched blob dropped wholesale.
- `state/keymap.js` already emits kol-shell's exact shape via `shortcutsBySection()` + `comboLabel()`.
- `editor/theme.js` is kol-fxr's OWN theme store. `LabsNav.jsx:33-35` explicitly refuses framework's `ThemeToggle` because it "runs its own theme store, which would fight the editor's theme.js".

## 15:28 — The wins, ranked by how certain they are

- **CERTAIN — one ShortcutsOverlay.** `keymap.js` already produces `[{label, keys}]`. Two local overlays collapse to one import. The only regression: kol-shell's is a flat 2-col grid with no sections, ours is sectioned — either accept flat, or grow sections in the DS.
- **CERTAIN — a real Settings page.** Two drifted dropdowns become one `SettingsScaffold` with tabs. `appSettings` keeps owning the values; kol-shell only renders.
- **LIKELY — Home absorbs ModeChooser.** `MODES` is already `{id, label, blurb}` — a `GridCard` per mode is a near-direct map.
- **POSSIBLE — `WalkthroughPanel` for first run.** Takes `[{title, text[], illustration?, actions?}]`. Nothing exists here today; this is new surface, not a dedup.
- **NOT A WIN — the rail itself.** A 48px icon rail for three destinations, when `ModeChooser` already does the job. Adopt `AppShell` only if Home/Settings become several pages.

## 15:28 — The four real decisions (none of these are mine)

1. **ROUTING.** `AppShell` wants `currentPath` + `onNavigate`. Options: (a) map `?view=` to a synthetic path, no router, smallest diff; (b) install react-router for the shell tier only; (c) skip `AppShell`, use `PageShell`/`SettingsScaffold`/`ShortcutsOverlay` standalone and keep the `?view=` switch. **(c) is the lazy one and probably right** — it takes every certain win and buys no routing debt.
2. **THEMETOGGLE COLLISION — RESOLVED, it is a boolean not a slot.** `NavRail.jsx:40` defaults `themeToggle = true` and renders framework's `ThemeToggle` at `:69`; `AppShell` passes it through (`:29`/`:44`). So `themeToggle={false}` switches it OFF — but there is NO seam to pass OURS in. If we adopt the rail we render it toggle-less and put our own control in `bottomItems`, or we file a DS ticket for a node-accepting `themeToggle`. Not a blocker, but not free either.
3. **SETTINGS SURFACE SHAPE.** Today settings are menu dropdowns inside a fixed-height editor. A page is a different interaction. Adopting `SettingsScaffold` means REDESIGNING the settings surface, not swapping a component.
4. **DOES HOME EXIST AT ALL?** `ModeChooser` is a first-visit-only card. A persistent Home is new product surface, not a refactor.

## 15:28 — Risks written down before anything is built

- **kol-shell 0.3.0 ships UNEXERCISED.** kol-ds-ui's own context says so twice — no showcase surface, no adopting app for the exhibit work. We would be its first real consumer. Expect to find its bugs.
- `ContentFilters` was REMOVED from kol-shell in 0.3.0 (BREAKING) — it lives in kol-component. Do not reach for the kol-shell one; it does not exist.
- `<DesignEditor />` (the lib entry) must NOT gain any of this — it is always the editor, never the chooser. `index.jsx` is a separate entry and stays untouched.
- The embeddable build's `index.lib.css` deliberately excludes `kol-framework.css`. Any kol-shell CSS reaching the lib build is a host-page leak.
- **NOTHING FROM TODAY HAS BEEN RENDERED.** The right rail's drag, the `I` gate and the section hairline are all unverified in a browser. Building on top of unverified work compounds it.

## 15:28 — Loose end I introduced earlier today

- I added `?view=randomiser` to `App.jsx`, but `mode.js` maps the randomiser id to `view: 'mobile'`. Two URLs now reach one chrome. Harmless, but it is exactly the kind of double-naming this arc should collapse — reconcile to ONE.

## 15:28 — Proposed order

- T1 ShortcutsOverlay dedup (certain, self-contained, kills 246 lines of duplicate).
- T2 Settings page on `SettingsScaffold` (needs the surface-shape ruling first).
- T3 Home / ModeChooser on `GridCard` (needs the "does Home exist" ruling).
- T4 `AppShell` + rail — LAST, and only if T2/T3 produce more than two pages.
- Build green after every step. No publish. Nothing rendered claims to work.

## 15:33 — T1 done, and a latent bug found on the way

- **kol-shell 0.3.0 installed** — devDependencies ONLY, deliberately not peerDependencies: the shell tier is standalone-app chrome, and a `<DesignEditor />` consumer must not be forced to install it.
- **THIS REPO HAD NO `@source` MANIFEST AT ALL.** Zero `@source` lines anywhere; `kol-sources.css` was never imported. KOL packages ship raw JSX and Tailwind does not scan node_modules, so every utility used INSIDE a DS component has been going ungenerated for as long as this repo has consumed the DS.
- It looked fine by accident: the common utilities (`flex`, `gap-2`) appear in this app's own markup too, and most DS chrome is real CSS in kol-theme rather than utilities. Anything relying on a utility this app never types renders unstyled.
- `kol-sources.css` is **opt-in — it is NOT imported by `kol-theme.css`**. Fixed: `@import "@kolkrabbi/kol-theme/kol-sources.css"` added to `index.css`. Build green.
- kol-shell's `ShortcutsOverlay` is exactly the case that would have broken: its panel is all utilities (`bg-fg-inverse-08`, `text-fg-64`, `bg-surface-primary`, `border-fg-16`).
- ⚠️ `index.lib.css` still has no manifest — same latent bug in the embeddable build. NOT fixed here: adding it pulls every kol package's source into the lib's Tailwind scan, which needs its own think.

## 15:33 — T2 VERDICT: kol-shell's ShortcutsOverlay is NOT adoptable. Do not force it.

- **The premise was wrong.** `LabsShortcuts.jsx` is not a duplicate overlay — it is the "Animate any value" expression quick-doc: `EXAMPLES` (expression syntax) and `FUNCTIONS` (what `params/expr.js`'s PRELUDE actually ships). That content has no equivalent anywhere and must not be deleted.
- Only its 10-row `KEYS` array overlaps the keymap. **That copy HAS drifted** — it claims `R → reset` and `Shift+R → reroll`; `keymap.js` says `R → Rectangle tool` (:48) and `Shift+R → Show / hide rulers` (:78). It also predates `I` (toggle-hints) and does not list it.
- **Root cause, and it is the interesting part: `keymap.js` IS NOT VIEW-AWARE.** `LabsParams.jsx:26-40` binds R/Shift+R in its OWN window listener that the keymap knows nothing about. So in labs, `R` really is reset — the card is right and the keymap is right, about different views, and nothing declares the difference.
- **Therefore kol-shell's `ShortcutsOverlay` cannot represent this app at all**: it takes ONE flat `[{label, keys}]` array with no sections and no notion of context. Our editor overlay is at least sectioned. Adopting it would be trading a better component for a worse one to hit a dedup target — the exact move ponytail exists to stop.
- **The real work this exposed, and it is bigger than the ticket:** make `keymap.js` view-aware (`section` already exists; a `views: ['editor'|'labs'|'randomiser']` field is the shape), then ONE overlay can render the right set per view. That kills the drift at its cause instead of unifying two chrome shells over an incoherent source of truth.
- Not built. This is a design change to the keymap contract and it is the user's call.

## 15:33 — State

- T1 landed. kol-shell installed and its Tailwind sources now reach this consumer; build green.
- T2 resolved as **rejected with cause** — no code change, verdict recorded.
- T3 (settings surface) · T4 (does Home exist) — genuinely need the user's rulings, unchanged.
- T5 recommendation stands and is now stronger: if we are not taking `ShortcutsOverlay`, `AppShell` has even less to offer, and option (c) — `PageShell`/`SettingsScaffold` standalone, no router — is the shape.

## 15:58 — T3/T4/T5 built, and RENDERED

- User ruled the open questions non-issues and told me to decide. Decisions taken: **no router** (skip AppShell/NavRail, page scaffolds standalone against the existing `?view=` switch) · **Home replaces ModeChooser** · **Settings is ONE page** merging both dropdowns.
- **`HomeView.jsx`** — `PageShell` + `PageHeader` + three `GridCard`s from `MODES`. The `blurb` field every mode has always carried finally renders; ModeChooser never showed it. Settings gets a `variant="list"` row — it is a peer surface, not a mode, so not a fourth A4 card.
- **`SettingsView.jsx`** — `SettingsScaffold` with General · Playback · Shortcuts. The store does not move: `lib/appSettings.js` still owns every value; kol-shell ships no persistence at all, so the page is pure presentation over what already existed. App theme is the exception — `editor/theme.js` owns it, and that is the same reason `LabsNav` refuses framework's `ThemeToggle`.
- Shortcuts tab renders read-only from `keymap.js` — one array feeding the page, which is what kol-shell's own docstring asks for. Labelled the EDITOR's keymap, not universal, because of the view-awareness gap.
- `ModeChooser.jsx` → `_tmp/2026-08-15-modechooser-retired/` with a WHY. Not deleted.
- **Two bugs caught by reading the source instead of assuming:** `shortcutsBySection()` returns an ARRAY of `{section, items}`, not an object — my `Object.entries()` would have thrown; and `ToggleSwitch`'s `onChange` receives the NEXT value, so re-deriving `!checked` was redundant.

## 15:58 — LIVE-CHECK: both surfaces opened in a browser

- Dev server on :5199, driven with Playwright, killed after (PID noted and confirmed the port is clear).
- **`?view=home`** — heading, subtitle, all three cards WITH blurbs, Settings row. **0 console errors.**
- **`?view=settings`** — tabs render; General shows real current values (App theme System · Default aspect 4:5 · Loop theme KOL · Clip to frame ON · Mod dots off). **0 console errors.**
- **Shortcuts tab clicked** — sectioned output (Edit · Selection · Layer …) with real labels `⌘Z` `⌘⇧Z` `⌫` `Esc`. The array-shape fix is confirmed working, not just compiling.
- ⚠️ **Pre-existing, not mine:** `JetBrainsMono-Variable.woff2` fails to decode — "OTS parsing error: invalid sfntVersion". Fires on every page load. The mono font is falling back. Worth its own look.

## 16:00 — T6 done: the double URL collapsed

- `MODES` randomiser entry now carries `view: 'randomiser'`, not `view: 'mobile'`. Mode entries use their own ids; device actions use device words.
- `goMobile()` in `mobile/device.js` keeps `?view=mobile` — that is the DEVICE job (it clears the tablet's persisted desktop opt-in). Picking a mode and escaping a device preference were two jobs sharing one URL.
- LIVE-CHECK: `?view=randomiser` renders the randomiser entry card (kolkrabbi-fxr / Select chrome / Generate · Editor · Labs). 0 console errors. Server killed, port clear.

## 16:00 — Arc state

- Landed: T1 install + the missing `@source` manifest · T3 Home · T4 Settings · T5 wiring · T6 URL reconcile · T7 rendered.
- T2 stands REJECTED with cause — kol-shell's ShortcutsOverlay is a worse fit than what is here.
- Open and NOT built, needs the user: **make `keymap.js` view-aware** (a `views:` field beside `section:`). That is the actual root of the shortcuts duplication, and until it exists the Settings shortcuts tab is honestly labelled "the editor keymap" rather than pretending to be universal.
- Open: `index.lib.css` still has no `@source` manifest — same latent bug as the app entry had, deliberately untouched because it pulls every kol package's source into the embeddable build's scan.
- Open, pre-existing: `JetBrainsMono-Variable.woff2` fails to decode on every page load ("OTS parsing error: invalid sfntVersion"). The mono font is silently falling back.

## 17:20 — The three open items, cleared

**T1 — kol-website deps.** Three were stale in BOTH apps: component 0.43.0 →
0.46.0 · framework 0.20.1 → 0.22.0 · theme 0.42.2 → 0.43.1. Theme is pinned
EXACT (no caret) in both — form kept, only the number changed. Everything else
was already current. `pnpm build` green, 3/3 tasks, apps/web + apps/brand.
(Fonts there were already correct — fixed by the 2026-08-14 FontFolderNaming
wave; all 100 declared font files resolve. kol-fxr was the repo left behind.)

**T2 — `keymap.js` is view-aware.** `views:` field beside `section:`; omit it
and the shortcut is universal, so nothing pre-existing had to be re-declared.
Edit/Selection/Layer/Color/Tools scoped to `['editor']`, orbit to
`['editor','labs']`, and a new Labs section declares what `useLabsKeys` actually
binds (`R` reset · `Shift+R` reroll). `shortcutsBySection(view)` and
`matchAny(event, list, view)` filter; `mode.js` gained `currentView()`, read
fresh because this app navigates by full page assignment.

**The premise was wrong again, and finding out mattered.** The claim was "the
shortcuts sheet lies in labs". It does not — in labs `S` opens `LabsShortcuts`,
a completely different panel, and the editor's sheet never appears there. The
real duplicate was that panel's hardcoded 10-row `KEYS` array. It now derives
from `shortcutsBySection('labs')`, so the drift cannot return.

LIVE-CHECK in labs: the strip reads `C orbit tool (3D camera) · G · S · M ·
I · Space · F · R reset to defaults · ⇧R reroll · Esc close`. No Rectangle-tool
leak, and `I` appears for the first time. Caught in the same pass: my first cut
`.toLowerCase()`d the labels and turned "3D" into "3d" — against the
casing-is-authored law. Removed.

**T3 — `index.lib.css` gained the `@source` manifest.** Same exposure the app
entry had: the lib renders the whole editor from DS components, so utilities
inside them were going ungenerated. Measured rather than guessed —
230.99 kB → 243.72 kB raw, 29.44 → 31.94 kB gzip. Against a control rendering
unstyled in someone else's page, and a JS bundle already north of 2 MB, that is
noise. `kol-framework.css` stays excluded (verified by reading the actual
`@import` lines, not the comments): a manifest tells Tailwind where to LOOK and
emits no rules, so it cannot leak host-page chrome.

## 17:20 — State

- kol-fxr: app build green, lib build green, port 5199 closed.
- kol-website: both apps green on current KOL versions.
- Open and NOT done: `goal-loop.sh` per-session goal files. The patch is
  written but `config-gate` blocks hook edits — needs `config-grant 15`.
  Two sessions in one repo still cannot both hold a goal.
