# Session: the shell tier, the shortcuts round-trip, the fonts, and a view-aware keymap

**Date:** 2026-08-15
**Agent:** Grim (Haiku 4.5) — working from kol-ds-ui, in both repos
**Summary:** Home and Settings built on kol-shell, one DS round-trip filed and
landed same-day, the mono font found to have never loaded, and `keymap.js` made
view-aware. Continues `2026-08-15-ds-adoption-four-tickets-and-css-organisation.md`.

## Changes Made

### New surfaces (the shell tier)
- `src/editor/home/HomeView.jsx` — **new**. `PageShell` + `PageHeader` + three
  `GridCard`s from `MODES`. The `blurb` each mode has always carried finally
  renders; `ModeChooser` never showed it. Settings gets a `variant="list"` row.
- `src/editor/home/SettingsView.jsx` — **new**. One `SettingsScaffold` page,
  General · Playback · Shortcuts, merging the two topbar dropdowns that had
  drifted (`shell/MenuTop.jsx:390` + `labs/LabsMenuTop.jsx:40`). `appSettings`
  still owns every value — kol-shell ships no persistence at all.
- `src/App.jsx` — `?view=home` and `?view=settings` route above the device gate;
  a first visit lands on Home instead of ModeChooser.
- `src/editor/ModeChooser.jsx` → `_tmp/2026-08-15-modechooser-retired/` + WHY.

**No router, deliberately.** `AppShell`/`NavRail` want `currentPath`/`onNavigate`
and this app has none; a 48px icon rail for three destinations is chrome for its
own sake. The page scaffolds are used standalone. If the tier grows past two
pages the rail is the upgrade path.

### The ShortcutsOverlay round-trip
- Filed `ShortcutsOverlaySections` → kol-ds-ui, landed as **kol-shell 0.4.0**,
  adopted here the same run. `src/editor/shell/ShortcutsOverlay.jsx` went from
  99 lines to a ~30-line adapter owning only the open state and the
  `kol:show-shortcuts` channel; its Esc listener dropped (the DS panel owns Esc).
  Original in `_tmp/2026-08-15-shortcuts-overlay-local/`.

**The agent first *decided* not to adopt, and was corrected.** A gap between a
consumer and a DS component is not an agent's to close locally — it goes to the
lobby and comes back as a variant, where every consumer gets it.

### The fonts — never loaded, on every page
- `public/fonts/jetbrains-mono/` — the two **variable** files copied in from
  kol-ds-ui; the six static cuts → `_tmp/2026-08-15-jetbrains-static-cuts/`.

kol-theme's `@font-face` points at `JetBrainsMono-Variable.woff2`, which did not
exist here. The dev server answered with the SPA's index.html, the parser choked
on HTML ("OTS parsing error: invalid sfntVersion"), and the mono face silently
fell back to a system font. Verified after: `status: "loaded"`, console 5 msgs → 1.

### keymap.js is view-aware
- `src/editor/state/keymap.js` — `views:` field beside `section:`; omitted =
  universal, so nothing pre-existing was re-declared. Edit/Selection/Layer/
  Color/Tools scoped to `['editor']`, orbit to `['editor','labs']`, and a Labs
  section declaring what `useLabsKeys` actually binds. `shortcutsBySection(view)`
  and `matchAny(…, view)` filter.
- `src/editor/mode.js` — `currentView()`, read fresh (this app navigates by full
  page assignment, so there is no route change for a context to observe).
- `src/editor/labs/LabsShortcuts.jsx` — the hardcoded 10-row `KEYS` array now
  derives from `shortcutsBySection('labs')`.

**The premise was wrong and finding out mattered.** "The sheet lies in labs" —
it does not; in labs `S` opens `LabsShortcuts`, a different panel, and the
editor's sheet never appears there. The real duplicate was that panel's own
`KEYS` list, which claimed `R → reset` while `keymap.js` said Rectangle tool.
Both right, about different chromes, nothing declaring it.

### Other
- `src/index.lib.css` — gained the `@source` manifest (same exposure the app
  entry had). 230.99 → 243.72 kB CSS, 29.44 → 31.94 gzip. `kol-framework.css`
  stays excluded, verified against the real `@import` lines.
- `.gitignore` — `.active-goal*.md` globbed; the exact-name rule would have left
  every per-session goal file untracked-but-visible.
- `lobby/clip_*.png` ×4 → `_tmp/2026-08-15-lobby-root-clips/`.
- Deps: kol-shell added (devDeps only — a `<DesignEditor />` consumer must not be
  forced to install app chrome). All five KOL packages now exactly on latest.

## Current State

### Working
- App build green · lib build green · nothing listening on any port.
- Home, Settings and the labs shortcuts strip all **opened in a browser** and
  checked, not merely compiled.

### Known Issues — two receipts carry real unfinished work
- **SegmentedFilledStateFix** — 21 `text-oq-48` spans across 5 files
  (TextPanel · AlignmentPanel · LayerInspector · TransportBar · MobileOverlay).
  `.kol-seg-cell` already paints `--kol-oq-48` at rest and `fg-emphasis` on
  hover/active, so each wrapper **pins the icon and kills both states**. Not
  cosmetic.
- **PropertyField** — `AxisField` still hand-rolled at `LayerInspector.jsx:585`,
  used at `:71` and `:619`, while the same file already uses
  `Input variant="property"` at `:267`/`:294`. Half-adopted.

The other 14 outbox receipts were verified against source and squared to
`Remainder here: none`.

## Next Steps
1. The `text-oq-48` sweep — it is killing live hover/active states.
2. `AxisField` → `Input variant="property"`, pattern already in the same file.
3. `?view=randomiser` vs `mode.js`'s `view: 'randomiser'` are now consistent, but
   `goMobile()` still owns `?view=mobile` for the device job — intended, noted so
   the two URLs are not "fixed" into one by mistake.
