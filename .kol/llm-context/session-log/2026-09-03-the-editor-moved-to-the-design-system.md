# Session: The editor moved to the design system

**Date:** 2026-09-03
**Agent:** Grim (Opus 5)
**Summary:** The round-trip ran both directions and then the editor itself left — `src/editor` · `loops` · `filters` · `kinetic` · `brand` · `data` moved to `kol-ds-ui/packages/design-editor` and come back as `@kolkrabbi/design-editor@0.4.2`; kol-fxr is a private app of two files, three pages and a hook.

## Changes Made

### Files Modified
- `package.json` — **`@kolkrabbi/design-editor` → `kol-fxr`, `private: true`**, `main`/`module`/`exports`/`files`/`peerDependencies` dropped. This repo published its last version (0.2.0) and cannot publish again by accident.
- `src/App.jsx` — all four chrome routes are the package now: `/editor` → `<DesignEditor mediaProxyBase="/media/" />`, `/labs` `/randomiser` `/output` → `LabsView` · `MobileView` · `OutputView`, each with `style.css` on its own lazy chunk. `setNavigator` · `VIEW_PATHS` and the device trio import from the package, NOT a local copy.
- `src/AppLayout.jsx` — `useRailExtras` · `RAIL_EXTRA_PREFIX` from the package.
- `src/pages/HomePage.jsx` · `LibraryPage.jsx` · `SettingsPage.jsx` · `components/hooks/usePageTitle.js` — twelve page-side symbols + `BRAND` from the package.
- `src/editor/color/ColourPanel.jsx` · `PaletteModal.jsx` — five DS components adopted before the move (spectrum trio, swatch pieces, harmony wheel, `SwatchRow`→`ColorInputRow`); rode into the package with it.
- `src/editor/compose/CanvasArea.jsx` · `shell/Canvas.jsx` — DS `SelectionOverlay` adopted, `box={l}`, and the zoom value published into both zoom contexts.
- `pnpm-workspace.yaml` — every adopted version added to `minimumReleaseAgeExclude` (component 0.152→0.197, framework 0.44, theme 0.142, icons 0.26, shell 0.51, media-client 0.4.0, design-editor 0.4.2).
- `lobby/` — `editor-pin-is-30-versions-back` closed with its resolution; two tickets and seven glyphs filed out; queue empty.
- **NEW** `.kol/llm-context/round-trip-inventory.md` — the table of what has and has not been through a ticket.

### Moved to `_tmp/2026-09-03-design-editor-moved-to-ds/` (eleven entries, nothing deleted)
`editor/` · `loops/` · `filters/` · `kinetic/` · `brand/` · `data/` · `components/styleguide/` · `railExtras.js` · `settings/AppSettings.jsx` · `index.jsx` · `pages/Compose.jsx`

### Features Added/Removed
- **fxr stopped being a package.** It was `@kolkrabbi/design-editor` publishing itself from an app repo, outside every kol-ds-ui gate — which is how it sat at 0.1.0 for two months pinning `^0.1.1` peers and a retired `kol-loader`.
- **Two tickets out:** `editor-set-is-behind-its-source` (twelve components the DS had copied, each with what its copy lost — ten fixed same-day) and `editor-panels-the-held-specs` (seventeen still hand-rolled, with props, seams and the coupling to drop — six shipped since). Seven glyphs promoted into kol-icons 0.26.0.

## Current State

### Working — every claim measured in a browser
| | |
|---|---|
| routes | `/` `/library` `/settings` `/editor` `/labs` `/randomiser` `/output` — 0 console errors each |
| build | `pnpm build` green with the editor source gone, first try, no twelfth import |
| SPA bridge | sentinel set on `/labs` survived labs → editor → randomiser; `performance` reports exactly ONE navigation entry |
| rail extras | labs' five method sections render in the SHELL rail — the store is single-copy across the package boundary |
| adoption | palette wheel drives the palette (FFCF33 → 99FF33, secondary keeps its own S/L), halo ring theme-aware in light, all nine overlay handles incl. ROT |

### Known Issues
- **`ARCHITECTURE.md` §2 and §N are stale** — they still say this repo publishes the editor as `@kolkrabbi/design-editor` via `pnpm build:lib`. That document is what sent this session down a publishing path that ended in a version going to npm that should not have. **Flagged, not corrected — awaiting the user's word.**
- `SettingsPage` About copy still says the app "ships as the embeddable `@kolkrabbi/design-editor` library" — user-facing, now false, untouched deliberately.
- `vite.lib.config.js` and `src/index.lib.css` are vestigial: no library builds from here any more.
- **35,584 lines have never been through any ticket** — `loops/` 28,421 · `filters/` 5,194 · `kinetic/` 1,969. Plus ~48 editor components, `LayerRenderer` 1,967 · `state.jsx` 1,959 · `CanvasArea` 1,597 the largest.
- Two DS rows still open: AlignmentGrid's momentary press treatment (a design call) and SplitToolButton onto Dropdown (the DS declined the collapse, with reasoning).

### The lessons, both mine
1. **A CLI success line is not a publish, and `npm view` is not the registry.** I told the user and kol-ds-ui that 0.2.0 had not published while it had — reading a cached response twice and reporting it as fact. Only a cache-busted `curl` to `registry.npmjs.org` is the check. kol-ds-ui hit the same thing in the opposite direction an hour later.
2. **I read the round-trip backwards for most of the session.** The user said at the start that this was the repo where the editor changes live; two open tickets framed fxr as the laggard, and I wrote it up that way — homework for fxr — until he ruled *"fxr is RIGHT, DS is WRONG."* My own diff had already proved it at every row: every difference was the package having less.
3. **The render caught what the line-diff missed.** `WheelTriangle` shipped `conic-gradient(from 0deg)` against the source's `from 90deg` with the handle math byte-identical — a hue ring 90° off its own handle. Invisible in a diff of the first forty changed lines; obvious the moment both were on screen beside each other.

## Next Steps
1. **Correct `ARCHITECTURE.md` §2 + §N** — record that the editor moved and this repo is a consumer. It is the single highest-value fix here; the next session will misread it exactly as this one did.
2. Rule the `SettingsPage` About wording, then reword.
3. Retire `vite.lib.config.js` + `src/index.lib.css` to `_tmp/` if the library build is truly finished here.
4. **The engine has never been examined** — 35,584 lines of `loops`/`filters`/`kinetic` went across as-is. Whether any of it is DS-tier is a question nobody has asked.
5. Adoption of the six shipped spec components happens **inside the package** now; fxr has no editor source to adopt them into.
