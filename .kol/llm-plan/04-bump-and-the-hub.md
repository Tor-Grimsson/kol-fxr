# Plan — the October bump, and fxr onto `AppHub`

**Status:** DONE 2026-10-07 except the deploy — steps 1–5, 7 and 8 done and walked, unpublished; **owed by the user: step 6, the deploy** (then the media-client ticket goes 🟢 on a measurement of the live bundle). The DS returned the reader the same evening (design-editor 0.22.0), so Home is on `HubHome` too. Results under *Walked* at the foot. · **Origin:** first session on the MBP. The DS rehearsed this bump as `apps/editor-hub` (2026-10-03) and built the phone work on top (2026-10-05/06); both are published. The user's ruling 2026-10-07: the Hub is accepted — fxr goes onto `AppHub`, not `AppStudio`.
**Scope ruling:** every path and prop below was read in `kol-ds-ui` at the published versions (workspace == npm on 2026-10-07), not recalled.

## What exists today

fxr is on **design-editor 0.10.0 · component 0.212.0 · theme 0.145.0 · shell 0.56.0 · framework 0.44.0 · icons 0.27.0 · media-client 0.4.0** (2026-09-04). Nine files in `src/`: `App` · `AppLayout` · three pages · one hook · two stylesheets · `main`.

The DS since then, in order:

| when | what | where it is written |
|---|---|---|
| 09-26 → 09-29 | the app anatomy — Shell + Hub + Tool; `AppHub`, `HubHome`, `HubSettings` in kol-shell. **fxr's Settings page is the reference `HubSettings` was built from** | `docs/documentation/04-compositions/16-app-anatomy.md` |
| 09-27 → 09-30 | the editor rebuilt on DS parts (0.15), the inspector as panes (0.16), the randomiser as two tools (0.17), assets thumbnails (0.18–0.19). Peer floors rose: component ≥0.227 · icons ≥0.29 · theme ≥0.158 · shell ≥0.51 | `packages/design-editor/CHANGELOG.md` 0.11.0 → 0.21.0 — **the spec; the notes only summarise** |
| 10-03 | our nine files cloned onto today's packages, every route pixel-diffed against `fxr.kolkrabbi.io` at 1600×1000 and 390×844. **No hard break.** Four DS bugs the bump would have carried fixed in 0.20.0 | `.kol/llm-context/backlog/2026-10-03-fxr-bump-notes.md` · kit in `_tmp/2026-10-03-fxr-labs-testbed/` |
| 10-05 → 10-06 | the phone review: fourteen findings, five stages, built on the recommendation, published as design-editor 0.21.0 · shell 0.62.0 · component 0.240.0 | `backlog/2026-10-05-fxr-phone-findings.md` · `plan-2026-10-05-fxr-on-a-phone.md` |
| 10-06 | the media admin is `media.kolkrabbi.io`; media-client 0.4.1 defaults to it. fxr passes no `adminBase` → the version line alone closes our lobby ticket | `lobby/inbox/media-client-0-4-1-api-on-media.md` |

Bulletin: `PageHeader` moved to kol-component — fxr never imports it. kol-hardware `onHold` — fxr does not install kol-hardware.

## The design

### 1. The bump — one jump, exact pins

| package | from | to |
|---|---|---|
| `@kolkrabbi/design-editor` | 0.10.0 | **0.21.0** |
| `@kolkrabbi/kol-component` | 0.212.0 | **0.240.0** |
| `@kolkrabbi/kol-theme` | 0.145.0 | **0.166.0** |
| `@kolkrabbi/kol-shell` | 0.56.0 | **0.62.0** |
| `@kolkrabbi/kol-framework` | 0.44.0 | **0.49.0** |
| `@kolkrabbi/kol-icons` | 0.27.0 | **0.33.1** |
| `@kolkrabbi/kol-media-client` | 0.4.0 | **0.4.1** |
| `@kolkrabbi/kol-brand` | 0.1.3 | unchanged |

Nothing fxr imports has moved: every symbol in `App.jsx` and the pages is still on the root entry (`core.jsx` export block, read 2026-10-07). `pnpm dev` is `vite --force`, so the dep cache rebuilds on the bump (the 2026-08-27 lesson).

**Source edits the rehearsal found** (the diff between `src/` and `apps/editor-hub/src/`, minus the two lines that are the rehearsal's own — router `basename` and the workspace `@source` manifest):

- `HomePage.jsx` ×3 · `LibraryPage.jsx` ×3 — `<Button variant="grey|outline">` → `tone=`. Deprecated aliases since component 0.237.0; they render the same and warn in the console.
- `SettingsPage.jsx:219` — the chrome picker `className="w-40"` → `w-48`; the touch rung types it at 16px and "Open a chro…" truncates.
- `AppLayout.jsx` — `railSections="enter"` on the shell (the user's 2026-10-06 ruling for labs' rail; shell 0.62.0).

### 2. `AppHub` — Shell + Hub in one call, fxr supplies the tool

`AppHub` (`packages/shell/src/AppHub.jsx`) passes `items` straight through to `AppShell`, so labs' category rows ride under Labs exactly as today. `AppStudio` cannot — it builds the rail from its slots and hands over `{ path, icon, label }` only (`AppStudio.jsx:84`). **fxr takes `AppHub`.** Nothing to ship from the DS for that.

What maps where (every prop read in `AppHub.jsx` · `HubHome.jsx` · `HubSettings.jsx`, 2026-10-07):

| AppHub prop | fxr passes | replaces |
|---|---|---|
| `app` | `{ name: 'Effexor FXR', subtitle: 'Pick a chrome. All three run the same engine.', logomark, about: <the About prose, verbatim>, links: [GitHub · Kolkrabbi · Vercel] }` | `logomark`, Home's header, Settings' About + Repo tabs |
| `items` | `NAV_ITEMS` with labs' extras spliced under `/labs` — unchanged | — |
| `currentPath` · `onNavigate` | unchanged (the `RAIL_EXTRA_PREFIX` dispatch + scrim click) | — |
| `settings` | `{ sections: useSettingsSections(), drawer: true, picker: <Dropdown w-48 CHROMES tone="sunken">, splitShortcuts: true, tone: 'sunken' }` | `SettingsPage.jsx` whole: `SettingsScaffold` + `DisplaySettingsDrawer` + the hand-built tabs |
| `shortcuts` | `shortcutsBySection(null)` — the full map, what the page shows today | the page's shortcut list and the `S` sheet on shell pages |
| `comboLabel` · `themeToggle` | design-editor's `comboLabel`; `<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />` | same |
| `home` | `{ items: (view) => view === 'recent' ? CHROMES : saved, filtersTitle: 'All Chromes', toCard, actions: <New File> }` | `HomePage.jsx` whole — **see § 3, the one dependency** |
| `walkthrough` | the two placeholder steps; the last one's `actions` as a function `(close) => <Button …>Open Editor</Button>` | Home's walkthrough |
| `masthead` | unset — Home and Settings keep `size: 'sm', voice: 'mono'`, what both pages wear today | — |
| `shortcutsKey` | `onChrome ? null : 's'` — see § 2a | — |
| `shell` | `{ touch: 'drawer', railSections: 'enter', navKeys: false, settingsKey: onChrome ? undefined : ',' }` | — |
| children | `{onChrome && <ChromeSettingsKey />}<RailFrame><Outlet /></RailFrame>` — rendered on tool routes only, which is where both are needed | — |

`AppHub`'s defaults already match ours: `railToggleKey='\\'`, `settingsPath='/settings'`, `pageWash='var(--kol-fg-02)'`, the Settings row pinned when `settings` is passed. `touch="bar"` is its default and **not** ours — the phone work was built against the drawer, so `shell.touch = 'drawer'`.

#### 2a. The keys — two rules, one line each

Read 2026-10-07: `AppShell`'s `settingsKey` handler calls `toggleSettings()` directly and never dispatches `kol:open-settings` (`AppShell.jsx:202-220`). The chrome's `SettingsDrawerHost` binds **no key** — it listens for `kol:open-settings` and expects the host to fire it (`EditorShell.jsx:25-31`). The chrome's keymap binds `S` itself (`keymap.js:87`). So:

- **`,`** — on shell pages (`/` · `/library` · `/settings`) the shell's own `settingsKey=','` toggles `/settings` with its return path. On chrome routes `settingsKey` is `undefined` (the `shell` spread lands last, so it overrides `AppHub`'s `','`) and `ChromeSettingsKey` — a window listener that dispatches `kol:open-settings` and nothing else — mounts as children. Today's `SettingsKey` with its `useSettingsToggle` fallback goes: on a chrome route the chrome always takes the event, and on a shell page the shell has the key.
- **`S`** — `shortcutsKey={onChrome ? null : 's'}`, or two sheets open on `/labs`.
- **⌥1–6** — the local handler **stays**. `navKeys` walks mark → items → bottom rows now, but indexes `items` as given (`AppShell.jsx:306`); with labs' rows spliced under Labs, ⌥5 lands on Effects on `/labs`. `shell.navKeys = false`.
- **`\`** — the shell's, as today.

`onChrome` = `pathname` is `/editor` · `/labs` · `/randomiser`.

#### 2b. Routing

- The device gate moves from `HomeRoute` into `AppLayout`: at `/`, a touch-primary device without the desktop opt-in gets `<Navigate to="/randomiser" replace />` before `AppHub` renders.
- `App.jsx`: `/` and `/settings` keep their `<Route>` (the `*` redirect needs `/` to exist) with `element={null}` — `AppHub` renders `HubHome` / `HubSettings` there and ignores children. `/library` stays `LibraryPage`. `/output` stays outside the layout.
- `HomePage.jsx` and `SettingsPage.jsx` → `_tmp/2026-10-07-pages-onto-the-hub/`. `LibraryPage.jsx` stays (its own `GeneratorLibraryProvider`, its own `removeItem`).

### 3. The one dependency — Home's SAVED view

`HubHome`'s `items` is data or `(view) => items`, evaluated in its render; it cannot call a hook. fxr's saved presets come from `useGeneratorLibrary()`, which needs `GeneratorLibraryProvider` above the caller. A provider around `AppHub` would **go stale in the same tab**: `Editor.jsx:80` mounts its own provider, its saves never reach the outer one, and the `storage` event fires cross-tab only (`LibraryProvider.jsx:290-296`). Today `HomePage` is correct only because it remounts its provider on every visit. Keying the outer provider remounts `AppShell`, which is worse.

**The seam:** design-editor exports the sanitised reader — `loadFromStorage` (`LibraryProvider.jsx:222`), as `loadLibrary()` or similar — from `core.jsx`. Then `home.items = (view) => view === 'recent' ? CHROMES : savedCards(loadLibrary().preset)` reads fresh on every `HubHome` render and the shell tier needs no provider at all. One export line in the DS; a lobby ticket from here. Reading the storage key ourselves is the shim the 2026-08-09 ruling forbids.

**Until it ships:** `home` is not passed, so `/` renders children → our `HomePage` (with `variant` → `tone` applied) exactly as today. Settings, the `S` sheet and the rail are the Hub's from the first publish; Home flips when the reader lands. Each state is correct on its own.

## Steps

1. **Pins** — `package.json` to the table in § 1, `pnpm install`. Read the installed `design-editor` source from disk for anything the clone did not cover (the law: a green install is not a bump).
2. **The four small edits** — `tone=` ×6, `w-48`, `railSections="enter"`.
3. **`AppLayout` onto `AppHub`** per § 2, with `settings` and no `home`. `SettingsPage.jsx` → `_tmp/`. `App.jsx` routes per § 2b.
4. **File the seam** (§ 3) to the DS's lobby.
5. **Browser walk** on the user's dev server — he starts it, Playwright drives it, shots to `_tmp/` (gitignored). 1600×1000 and 390×844 with touch; every route; console clean. The keys: ⌥1–6 on `/` and `/labs`; `,` on `/editor` opens the drawer and the URL does not change; `,` on `/library` goes to `/settings` and back; `S` on `/` opens one sheet, `S` on `/labs` opens one sheet; the gear on `/settings` opens the drawer with the same rows as the page; the picker is whole at 390.
6. **Deploy** — his. Then the live bundle names `media.kolkrabbi.io` and not `admin.`.
7. **Lobby** — `media-client-0-4-1-api-on-media` to `done/` with the resolution, the ledger row, the history line, the receipt back.
8. **Home flips** when the reader publishes: `home={…}` per § 2, `HomePage.jsx` → `_tmp/`, the `/` route to `element={null}`, walk `/` again (RECENT and SAVED, a preset saved in the editor appears on SAVED in the same tab), deploy.

## Excluded (deliberate)

- **`AppStudio`** — the Library · Create · Use shape; not fxr's, and it cannot carry labs' rows.
- **`touch="bar"`** — the Hub's default phone chrome. The drawer is what the phone work was built and measured against; the bar is a separate ruling.
- **The About copy** — `app.about` carries today's prose verbatim, including "the embeddable `@kolkrabbi/design-editor` library", which AGENT-CONTEXT has flagged as stale since 2026-09-03. Copy is the user's word; not changed here.
- **`ARCHITECTURE.md` §2 + §N** — still say this repo publishes the editor. Flagged five sessions; a separate edit, his call.
- **Not rehearsed by anyone** — export, record, batch, MIDI, gamepad, real iOS Safari. The walk in step 5 does not cover them either and says so.

## Risks / laws

- **A green build is not verification** (AGENT-CONTEXT). Step 5 is the proof, not `pnpm build`.
- **0.x pins are exact.** No `^`.
- **`railExtras` and `mode.js` come from the package, never a local copy** — `AppLayout` keeps importing them from `@kolkrabbi/design-editor`.
- **`HubSettings` renders `sections` through kol-component's `SettingsSections`**, where today's page uses design-editor's `AppSettingsSections`. `HubSettings` was built from fxr's page and its docblock names the row shape (`{ label, render }`); if a row renders differently it shows in step 5, not in a build.
- **`,` on a chrome route must not navigate.** The split in § 2a is what prevents it; if `AppShell` ever dispatches `kol:open-settings` itself the split can go.
- **Never delete.** Retired pages go to `_tmp/<date>-<what>/`.

## Walked — 2026-10-07

Task-scoped dev server on 5399, killed after by PID. Shots and snapshots: `_tmp/2026-10-07-hub-walk/`.

| check | result |
|---|---|
| 1600×1000 — `/` `/library` `/settings` `/editor` `/labs` `/randomiser` `/output` | all load, 0 console errors, 0 warnings |
| 390×844 touch — the same seven | all load, 0 errors, no horizontal scroll; `/` → `/randomiser` (the gate, now in `AppLayout`); the picker reads "Open a chrome" whole |
| `/settings` | `HubSettings`: masthead cluster at the right (picker · theme · gear), PREFERENCES row, OPTIONS / SHORTCUTS pair, SETTINGS above the rule, ABOUT · REPO below; Display · Defaults · Transport rows as before |
| the gear on `/settings` | opens the drawer with the page's rows — Theme · Default aspect · Loop theme · Clip to frame · Modulation dots · Autoplay · Loop length |
| `,` on `/editor` | the editor's Display Settings drawer opens; the URL stays `/editor` |
| `,` on `/library` | → `/settings`; `,` again → `/library` |
| `S` on `/` | one sheet, the Hub's, the full map |
| `S` on `/labs` | one sheet, the chrome's — drawn **under** labs' entry card (both at `--kol-z-modal`): DS-side stacking, not ours, not filed |
| ⌥1 ⌥2 ⌥3 ⌥4 from `/` · ⌥5 ⌥6 from `/labs` | `/` · `/library` · `/editor` · `/labs` · `/randomiser` · `/settings` — the spliced labs rows shifted no digit |
| `/labs` rail | Effects · Generative · Vector · Composition · Modulation under Labs, Randomiser after, Settings pinned; the entry card over the stage |

**Found and fixed:** `vite --force` died in dependency optimization — kol-component 0.240.0's `PdfPage.jsx` does `import('pdfjs-dist/build/pdf.worker.min.mjs?url')` and the optimizer read `?url` as part of a filename (the production build was fine). `vite.config.js` now excludes the six raw-source KOL packages from `optimizeDeps` and pre-bundles `kol-component > react-syntax-highlighter` and `> embla-carousel-react` by name — the shape kol-website runs on the same version. Everything above was walked on that config.

**Not walked, as § Excluded said:** export, record, batch, MIDI, gamepad, real iOS Safari.

### Step 8, the same evening — Home onto `HubHome`

The DS returned `library-reader-for-a-hub-home` as **design-editor 0.22.0** (`loadLibrary()` on the root and `core` entries). Done here: pin 0.22.0; `home={{ items: (view) => view === 'recent' ? CHROMES : savedCards() }}` over `loadLibrary().preset`, `filtersTitle`, `toCard`, the New File action, the two placeholder walkthrough steps (the last one's `actions` as a function so `HubHome` hands it `close`); `HomePage.jsx` → `_tmp/2026-10-07-pages-onto-the-hub/`; the `/` route `element={null}`. A saved card is **`media: false`** — no cover by nature (kol-component 0.210.0), not the dashed MISSING plate an absent asset gets.

| check | result |
|---|---|
| `/` fresh | masthead, RECENT · SAVED strip, the three chromes, New File · Walkthrough |
| File → Save… in `/editor`, ⌥1 | Home in the same tab, SAVED lists the preset, no MISSING plate |
| `S` on `/` | one sheet |
| every route, 1600×1000 and 390×844 touch | all load, 0 console errors, no horizontal scroll |

**Found and fixed, pre-existing:** two Tailwind builds on one page. The editor's `style.css`, lazily appended with its chunk, carried `.hidden` inside the same `@layer utilities` as the app's sheet and no `md:flex`; later in source wins inside one layer, so after one visit to `/editor` kol-shell's `CatalogPage` view strip went `display: none` on Home — the old `HomePage` had it too. `index.css` now imports the editor's stylesheet **first**, before `tailwindcss`, and the lazy `style.css` imports in `App.jsx` are gone. The editor's bundle uses no responsive variant (grepped), so nothing of its own flips the other way. Cost: 43 KB gz of editor CSS on the shell tier. Passed to the DS in the ticket's adoption note as a consumer-notes item.

**Left:**
- **the user** — deploy. Then `media-client-0-4-1-api-on-media` → 🟢 on a measurement of the live bundle (`media.`, no `admin.`), and the receipt back to kol-website.
