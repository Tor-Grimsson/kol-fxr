---
_template:
  version: 1
  path: .kol/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-design-editor — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `./history.md`. For speculative future work see `./plan.md`.

**Last updated:** 2026-08-30 (**THE SETTINGS SET · ONE PAGE, ONE DRAWER · FOUR DS ROUND-TRIPS**) — All packages latest: **shell 0.19.1 · component 0.129.0 · theme 0.95.0 · icons 0.25.0 · framework 0.35.0 · brand 0.1.3 · media-client 0.3.2**. **ONE SECTION DEFINITION, TWO SURFACES:** new `src/settings/AppSettings.jsx` holds the settings as DATA (`{ label, rows: [{ label, render }] }`), rendered by the `/settings` page and by a `SettingsPanel` drawer over any chrome, so they cannot drift the way the topbar menus did. **MenuTop's Settings dropdown DELETED** — it was the third live copy of `appSettings`; a cog (`settings-01`, kol-r2b2's trigger) dispatches `kol:open-settings` and `EditorShell` hosts the drawer, because every chrome renders EditorShell and only the editor renders MenuTop. **`,` / `⌥,` opens settings from anywhere** — matched on `e.code === 'Comma'` (Option rewrites `e.key` on macOS: ⌥, is `≤`); a chrome answers with its drawer and `preventDefault()`s, a shell page navigates to `/settings` instead. **THE PAGE IS `ContentFilters`, NOT AN IMITATION** — I hand-wrote a lookalike header and it drifted inside the hour (the organism's search is `size="md" iconSize={16} fieldHeight={28}`; a copy passing none of those renders a different pill on the next page over). Section names are one filter group, search reads a row's own label. Header cluster (chrome Dropdown · ThemeToggle · gear) rides `PageHeader actions`. **Four defects filed to kol-ds-ui, all returned same-day:** `DropdownHeightAndHover` → theme 0.90.0 (trigger pinned to the icon ladder; **my hover diagnosis was wrong** — those lines are *pin-backs*, not hover states), `PageHeaderActionsGrowsBlock` → shell 0.19.1 (the `actions` cluster shared a row with the subtitle, so a page with controls sat 10px lower — now `h-0 self-center`; **header re-measured 65.203125, identical to monitor's**), plus `SettingsChoice` forwarding `tone`/`size`/`variant` (component 0.129.0, local `ChoiceRow` deleted) and `--kol-surface-ab-split` (theme 0.95.0). ⚠ **TWO RULINGS OWED BY THE USER** — kol-ds-ui declined both pending them: retiring kol-shell's `SettingsSection`/`LabelRow` (71 call sites: mirror 44 · monitor 19 · fxr 8) and whether `SettingsScaffold` should render the ContentFilters header row. ⚠ The `PageHeaderActionsGrowsBlock` **bulletin is unposted** — bulletins are user-invoked only. ⚠ `RailSettingsDisclosure` still 🔴. ⚠ T6 webcam/phone camera still unverified. **LESSON: a row that looks like ContentFilters must BE ContentFilters** — and, theirs: a component that wraps another must forward the wrapped one's seams or it becomes a wall. See `session-log/2026-08-30-settings-set-page-drawer-and-four-ds-round-trips.md`.


**Prior:** 2026-08-28 (**THE TWO-LEVEL RAIL · THE MEDIA CLIENT · THREE VIDEO FIXES**) — All packages latest: **shell 0.17.1 · component 0.128.0 · framework 0.35.0 · theme 0.89.0 · icons 0.24.0 · brand 0.1.3**, plus **`kol-media-client` 0.3.2 added** (exact pin — 0.x has no semver contract; mirror's convention). **THE RAIL IS ONE COMPONENT WITH TWO LEVELS** (user ruling): L1 sections 20px glyph in a 32px box (glyph x 14), L2 groups 12px in 20px indented right (x 30), and **nothing auto-expands** — `/labs` arrives with zero L2 rows. Built locally as a fork first, filed as `RailTwoLevelSections`, returned as **kol-shell 0.17.0** within the hour and both forks deleted. Labs no longer mounts its own `SideNav`: `src/railExtras.js` (a `useSyncExternalStore` store; `#rail/…` sentinel paths + a dispatch map, because `NavRail` only knows `onNavigate(path)`) lets `LabsNav` render `null` and publish its tree to the shell rail; `LabsView`'s `setNavHidden` hack and `src/styles/kol-app.css` are both gone. **`mediaLibrary.js` was a hand-rolled fork of a published package** — now a thin facade on `createMediaClient({ buckets: true })`, and the picker reaches **three stores, 7,971 files** (R2 433 · B2 3,443 · vault 4,095) instead of 433. **Three real defects, all found by RUNNING the app:** a source swap image→video crashed the whole editor (`v.pause` on a stale `<img>`; guard the element, not the flag); `setMedia` fired at `loadedmetadata` before any frame was decoded; and **video rendered BLACK while the transport was stopped** — `readyState 4` does not mean a frame can be composited, a never-played detached `<video>` has none, so it is now primed with a 1/240s seek before publishing. All six routes verified in a browser with error listeners, zero errors. **⌥-digit is local now, not AppShell's `navKeys`** (user ruling): ⌥1 Home · ⌥2 Library · ⌥3 Editor · ⌥4 Labs · ⌥5 Randomiser · ⌥6 Settings — the prop skipped HOME (the logomark is not a rail item) and let labs' appended category rows steal ⌥5-9; `KEY_ORDER` derives from NAV_ITEMS + BOTTOM_ITEMS so a new destination cannot renumber the rest. ⚠ **T6 — webcam + phone camera — is NOT verified; it needs real hardware.** ⚠ `RailSettingsDisclosure` is **🔴 needs-ruling** (shipped at shell 0.14.0, deleted by 0.16.0 before fxr adopted it). ⚠ **THE SESSION'S LESSON, hit three times: never trust a pre-bump observation.** A defect was filed against the DS that was actually our own fork of stale source, and fxr shipped a browser-fatal `kol-media-client` 0.3.1 because build-green + node-green were mistaken for "it loads". After any bump: re-read from DISK, load a BROWSER. See `session-log/2026-08-28-two-level-rail-media-client-and-video-fixes.md`.
**Prior:** 2026-08-28 (**KOL 0.16.0 + THE ONE-RAIL SWAP**) — Four packages to latest: **component 0.125.0 · framework 0.35.0 · shell 0.16.0 · theme 0.88.0** (one copy each, build green; `gsap` is a new kol-shell peer and resolves transitively). **kol-shell 0.16.0 REVERSES `RailSideNavPixelParity`**: the shell rail is a flat 48px `NavRail` again (its own fixed div, 20px glyphs, grab-drag open writing `--kol-shell-rail-width`), not a collapsed `SideNav` — and `settings`/`themeToggle` left `AppShell` with it. That made `src/styles/kol-app.css` dead (every selector was `.kol-sidenav.is-collapsed`); **retired to `_tmp/`** — which also silently broke labs' collapsed rail, since those rules were the only styling a hand-stamped `.is-collapsed` SideNav still got. **Fixed properly by swapping labs onto the same component:** new `src/railExtras.js` (a `useSyncExternalStore` store; rows carry `#rail/…` sentinel paths + a dispatch map, because `NavRail` only knows `onNavigate(path)` and labs' leaves dispatch), `LabsNav` renders `null` and publishes its tree, `LabsView`'s `setNavHidden` hack deleted, kol-labs.css's nav track → 0. **One rail component on every route now**, verified in a browser (`.kol-sidenav` absent from `/labs`, 44 rows, identical bg/border across routes). ⚠ **Section headers are gone** — `NavRail` has no section-anchor row, so labs' EFFECTS/GENERATIVE/COMPOSITION/MODULATION labels don't render (the icon rows do); **owed to kol-ds-ui, not yet filed**. ⚠ Labs' rail changed colour (old SideNav was `background={false}`; NavRail hardcodes `bg-surface-primary`) — consistent now, user had no strong call. ⚠ `pnpm outdated` stale a FOURTH time. See `session-log/2026-08-28-kol-016-bump-and-one-rail-swap.md`.

**Prior:** 2026-08-28 (**KOL BUMP TO LATEST + RAIL GEOMETRY REWORK, UNFINISHED**) — All four stale KOL packages bumped: **component 0.119.0 · framework 0.34.0 · shell 0.14.0 · theme 0.81.0** (devDeps + peerDeps + `minimumReleaseAgeExclude`, one copy each, build green). Then tried re-cutting the collapsed rail to match kol-monitor's look — **wrong approach, not finished.** New `src/styles/kol-app.css` kills the yellow active-icon accent (carried standing instruction) and layers `display: contents` on `SideNav`'s scroll/nav/tree/li/span wrappers to fake a flat 48px rail matching monitor's measured geometry. **The reference was stale**: monitor is on the same `kol-shell@0.14.0`/`SideNav` as fxr now — its old hand-rolled 48px rail was retired in 0.13.0 specifically because it drifted from `SideNav`'s 56px collapsed geometry; the screenshots being matched were a stale browser tab, not monitor's current state. User explicitly rejected the CSS-hack approach ("SIMPLIFY this fucking DIV madness") after seeing the DOM depth it was fighting through vs. monitor's real flat markup (six direct children, no wrapper depth). Session ended before the correct fix (a real flat rail component, or a DS ticket) was built. `AppLayout.jsx` also gained an `iconComponent` seam forcing 20px glyphs (`SideNav` hard-codes 16, no size prop). See `session-log/2026-08-28-kol-bump-and-rail-geometry-unfinished.md`.

**Prior:** 2026-08-27 (**KOL-COMPONENT 0.105.0 + THE LOBBY REGISTERED**) — `@kolkrabbi/kol-component` 0.104.3 → **0.105.0** (devDeps + peerDeps; one copy; build green — 0.105.0 is `SectionCtaConnectVariant`, kol-website's, nothing for fxr). **fxr's `lobby/` was the kol-monitor case**: 22 receipts, no ledger, no `inbox/`, not in `~/.dotfiles/files/folders.md` § lobby — invisible to `bin/lobby`, skipped by `lobby-close`. Now: `lobby/INDEX.md` (six sections, all 22 rowed under *Filed elsewhere*), the four dirs, registry rows in `folders.md` · `01-registry.md` · `05-lookup.md`; flag `--kol-fxr`. **8 receipts read as owed** — the DS's return-time `**Remainder here:** bump, …` sat above our `✅ ADOPTED … none` and the tool judges the FIRST field; rewritten in place to `none — adopted <date> … Returned as: <original>` (monitor's precedent). `lobby --counts` → owed 0, `--lint` clean. `ShellHomeSystemAdoption` still 🔵 at mirror and monitor. See `session-log/2026-08-27-kol-bump-0105-and-lobby-registered.md`.

*(Older entries trimmed to the 5-entry cap 2026-08-27 — each keeps its detail in its own `session-log/…md`.)*

---

## Status at a glance

- **One editor at `/`** — modes GONE (Tools→Color modal, Pattern/Text rail tabs); `pnpm build` green.
- **Ships two ways:** npm library `@kolkrabbi/design-editor` (`pnpm build:lib`, published) + standalone app (Vercel deploy, `vercel.json` `/media` rewrite).
- **Settings, TWO surfaces off ONE definition** (`src/settings/AppSettings.jsx`): the `/settings` page (on `ContentFilters` — section chips, keyword search over rows AND shortcuts) and a `SettingsPanel` drawer over any chrome (cog in the editor topbar, or `,` / `⌥,` anywhere; a shell page navigates to the page instead). Show grid rides the drawer's host slot (compose state, not an app default).
- **Canvas fills theme-aware:** frame (`--kol-surface-absolute-split`) + infinite backdrop (`--kol-surface-secondary`, own inspector swatch) + rulers (`--kol-fg-*`) all flip. Fill model: `null`=None, `var(--kol-*)`=themed-auto, hex/`palette:*`=explicit.
- **Hierarchy:** METHOD > TYPE > CATEGORY > PRESET everywhere (`docs/documentation/01-hierarchy/INDEX.md`, canonical).
- **Layer types:** background · pattern · photo · shape · text · path · **bool** (non-destructive booleans) · group · loop · kinetic · **misc** (Para Type; Interfaces later).
- **Catalog:** full labs parity — ~380 generative presets (incl. Penrose 55), 90 kinetic (incl. morph 6), 30+ filters, Misc glyphs/styles.
- **DS:** consumes published `@kolkrabbi/kol-*` via npm (external consumer, no linking); **component 0.129.0 · theme 0.95.0 · framework 0.35.0 · icons 0.25.0 · shell 0.19.1 · brand 0.1.3 · media-client 0.3.2**, peerDeps ranges matched. **No local DS shims** (user ruling 2026-08-09 — shipped components are the truth; DS gaps go through the kol-ds-ui lobby, which round-trips same-day). ⚠ Check versions with `npm view <pkg> dist-tags`, not `pnpm outdated` (stale registry cache, FOUR times now). ⚠ **After ANY bump: re-read the dep's source from DISK and load the app in a BROWSER** — build-green + node-green miss import-time failures entirely; fxr shipped a browser-fatal `kol-media-client` 0.3.1 that way, and separately filed a DS defect that was our own fork of stale source. **0.x packages are pinned EXACT** (no semver contract below 1.0). **This repo owns no app-tier CSS** — `src/styles/kol-app.css` was retired to `_tmp/` 2026-08-28 with the rail it patched, and `src/index.css` is imports-only again.
- **Mobile chrome (user-approved):** touch-primary → generative-only `MobileView` (`src/editor/mobile/`, doc `12-mobile`); tabbed overlay, all controls `lg`. Tablet ↔ desktop via `goDesktop`/`goMobile`; **Settings → Simple mode** is the desktop entry. `?view=mobile|desktop|output` force views. Ephemeral (`persistDraft={false}`).
- **Labs mode (`/labs`):** the labs.kolkrabbi.io chrome over the editor engine, built to the kol-labs-single SOURCE contract (read the repo, not screenshots). `LabsParams` rail + labs keys + zoom/fps chips + S-card overlay. **`LabsNav` renders NOTHING since 2026-08-28** — it publishes its category rows to the SHELL rail via `src/railExtras.js`, so labs runs the same `NavRail` as every route. **Two levels (kol-shell 0.17.0, `RailTwoLevelSections` — filed from here):** L1 = the four method sections at 20/32, L2 = their groups at 12/20 indented right; nothing auto-expands. THE CATEGORY LAW still holds — sections and categories only, never presets.
- **Penrose = interactive living sims (2026-08-09):** all 55 under THE LIFE LAWS (`generative-life-laws` memory) — perpetual lifecycles, pointer-as-protagonist (host-smoothed `{x,y,down}` in sim space via `penrose/host.js`), events on press, `interaction` knob everywhere; masks generation-first (`'none'` default, Glyph/shapes/Custom-SVG opt-in).
- **Media is `@kolkrabbi/kol-media-client` (0.3.2, exact)** — `mediaLibrary.js` is a thin facade, NOT a fork; it hand-rolled the package's whole surface until 2026-08-28 and saw only R2. Three stores now (R2 433 · B2 website 3,443 · B2 vault 4,095 = **7,971 files**); the picker has a store selector. R2 is proxied through `/media/`, both B2 hosts load direct. **R2's CORS is live** (kol-r2b2, 2026-08-27) so the proxy is optional — but KEPT, because pre-policy cached responses still taint until `crossOrigin="anonymous"` is everywhere. **Read-only by ruling** (kol-r2b2 ARCHITECTURE §2/§4): writes go through the `bucket-r2` CLI, never a local upload endpoint.
- **Engine decision RESOLVED:** DOM/SVG base, no Konva (§4).

## What works (beyond the vector/canvas base)

- Vector base: pen/node editing, flip/rotate/crop, canvas sizing, infinite canvas + rulers/guides, zoom tools.
- **Booleans non-destructive:** wrap into `bool` layer, live recompute + bounds refit, panel child editing; Vector menu = Flatten shape / Release boolean; toolbar = one boolean dropdown.
- **Layers panel:** Figma container model (Canvas parent, 16px nests, hover chevrons, accent selection + children tint, drag-reorder/reparent everywhere).
- **Motion:** bind dot = **source picker** (time/mouse/layer/audio/MIDI/LFO/gamepad→"Joystick"/expr); transform shaped in the **Animation tab** (`ModulationEditor`); **direct input** — type a number or expression into a range value (`RangeField`). Timeline + transport; kinetic `morphBlend` bindable.
- **Type family:** text layer (real-vector SVG/PNG/webm export), kinetic type tool (Type/Kinetic picker, per-element editing, morph modes), misc layer (Para Type glyphs/styles, Classic/Skeleton).
- **Export:** aspect/@Nx/PNG/SVG + **offline webm loop bake** (WebCodecs VP9 via Mediabunny, deterministic, progress overlay) + live Record + batch zip.
- **Output window:** `?view=output` → chromeless full-screen `OutputView` (no chrome, autoplaying) — a clean OS/tab screen-record surface; opened via the footer's **Open output window** (snapshot-at-open, standalone-app only).

## What's pending (deferred pool, user-ordered)

- **Labs parity DONE (2026-07-08, waves A–F)** — kinetic tier-2, per-tool scoped randomize, filter chains, authoring editors, AND the Pixi GPU filter tier (35 fx, lazy) all shipped. Remaining parity gaps are the deferred/flagged items below only.
- Out-of-scope (user-accepted, app-sized/backend): Interfaces composer, Radar 3D Lens scene, server ffmpeg/poster pipelines (client-side batch export shipped).
- Pixi caveats: 6 parameterless effects construct with defaults (color-map may want a runtime texture); webcam→pixi→engine 3-way stack caches at first frame.
- Parity nice-to-haves deferred: distort cursor-path persistence (session-live now), gamepad button→action mapping (needs shell wiring), appSettings `clipToFrame` consumer, seed-field styling unify (EffectsPanel vs ParametersPanel).
- KOL bumps DONE (→0.6.0). Two open decisions: **`kol-helper-11` still absent** (0.6.0) — desktop inspector labels render 16px; sweep to `kol-helper-12` vs DS restore. And **stale `peerDependencies`** (`^0.1.2`) — bump the published-lib contract range.
- multi-canvas/frame-model proposal; Tools → Layouts + Assets manager; perf backlog (field family GPU port).

## Active known issues

- Mono-cut text EXPORTS fall back to foreignObject (woff2-only font; render is correct).
- `pnpm build` (app) and `pnpm build:lib` (package) both write `dist/` — last build wins locally (no conflict on Vercel; only `pnpm build` runs there).
- Embedding host must proxy `/media/*` and `/fonts/*` same-origin or filters/export taint and mono fonts fall back; lib bundle heavy (483 KB gz + 636 KB three chunk).
- Bare `mesh`/`ripple` preset-id collision (pattern vs gl catalog) — rename touches drafts, user's call.
- Pattern tool has no keyboard shortcut (`P` = pen).
- Marquee selects hidden/locked layers; nudge floods history; paths inside groups can't be node-edited. Nested absolute coords ignore ancestor ROTATION (shared with reparentLayer).
- @3x exports: engine/filtered-photo snapshots capped at ≤2× (live-canvas backing store; re-render at k× architecturally rejected).
- Main chunk ~9 MB (warning only); kol-loader eager icon glob (+1.37 MB) — code-split is a future cleanup.
- Penrose heavyweights (lenia/smoothlife/droste/apollonian/KS) are labs-cost; three untinted-pixel protos don't re-theme.
- Video-clip leak CLOSED (per-delete `deleteClip` in `removeLayer` + load-time `gcClips`, gated behind `indexedDB.databases()` so it never creates an empty DB — old Firefox excepted).
- Internal names `onSaveSettings`/`onLoadSettings`/`SettingsFileTab` still say "settings" (user labels fixed; internal rename deferred as cosmetic).
- **`kol-helper-11` still absent as of kol-theme 0.6.0** — desktop inspector meta labels render 16px default (decision owed). Mobile already on `kol-helper-12`.
- Mobile: **user-approved**; video insert unverified on device post-fix. 0.5.0 changed SegmentedToggle size semantics (sm 16→26, md 26→32) — desktop footer toggles unverified.
- **Stale `peerDependencies`** — `kol-component ^0.1.2` / `kol-theme ^0.1.1` exclude even 0.4.0; the published `@kolkrabbi/design-editor` lib contract is wrong. Range bump owed (publish-contract call).
- Webm loop export depends on **WebCodecs** (`mediabunny` dep) — Safari no-ops silently. Output window is **snapshot-at-open** (re-press after edits) and **standalone-app only** (embeds don't serve `?view=output`; gating it off in the lib build is a deferred nice-to-have).

---

## Key files and their roles

| file | role | hot edit points |
|---|---|---|
| `src/App.jsx` | gates `?view=output|desktop|mobile`; touch-primary → `MobileView`, else `<Editor />` (no router) | — |
| `src/editor/mobile/` | mobile generative chrome (doc `12-mobile`) — `MobileView` (screens), `MobileOverlay` (tabbed lg modal), `device.js` (gate + `goDesktop`/`goMobile`) | tablet/desktop entry, overlay |
| `src/editor/OutputView.jsx` | chromeless full-screen output (recording surface); reuses `EditorProviders` + `Canvas`/`LayerRenderer`, hydrates from `OUTPUT_SNAPSHOT_KEY` | output/record |
| `src/index.jsx` | **library entry** — `<DesignEditor mediaProxyBase />` (npm build target) | lib public API |
| `vite.lib.config.js` | lib build (externals, single css) — `pnpm build:lib` | packaging |
| `src/editor/theme.js` | theme mode light/dark/system + `useThemeMode` (data-theme) | theme wiring |
| `src/editor/Editor.jsx` | provider stack (library/tool/compose/palette/pattern/type) + Compose + PaletteModal | new providers |
| `src/loops/taxonomy.js` | GENERATIVE_TREE / MISC_TREE / PICKER_TREE — the TYPE level as data | new families slot in here |
| `src/editor/compose/state.jsx` | layer state, LAYER_TYPES, booleans/reparent/flatten actions (context in `composeContext.js`) | layer ops |
| `src/editor/compose/CanvasArea.jsx` | pointer router — tool gestures, keymap | new tool gestures |
| `src/editor/compose/inspectors/` | LoopPicker / KineticPanel / TextPanel / PatternPanel / EffectsPanel — the rail surfaces | tab surfaces |
| `src/kinetic/` | KineticType engine + morph.js + presets (KINETIC_TREE) + knobs | type-tool depth |
| `src/index.css` | Tailwind import + published DS imports | token/DS wiring |
| `pnpm-workspace.yaml` | `allowBuilds: esbuild: true` (pnpm 11 build-gate) | — |

---

## Roadmap (prioritized)

0. **Mobile chrome DONE + user-approved.** Follow-ups: bump stale `peerDependencies` (publish-contract call); glance at desktop footer SegmentedToggles after the 0.5.0 size shift; video-insert retest on device.
1. **USER REVIEW of the text family** (Misc layer, morph, kinetic Elements, vector text export) — nothing queued behind it.
2. Deferred pool (see "What's pending" above) + long-tail: pixi filter tier (opt-in), export motion-baking, deeper DS integration, npm publish.

---

## Known gotchas

### pnpm 11 build-script gate
`pnpm dev`/`build` run a deps-status pre-check that fails if a package's build script is "ignored". `esbuild` needs its build to run — approved via `allowBuilds: esbuild: true` in `pnpm-workspace.yaml` (NOT the old `pnpm.onlyBuiltDependencies` in `package.json`, which pnpm 11 no longer reads).

### kol-loader icons need `optimizeDeps.exclude`
`@kolkrabbi/kol-loader`'s `Icon` reads its SVG registry via `import.meta.glob`. Vite only expands globs in source-transformed files, so pre-bundling the dep (default for node_modules) yields an empty registry → every kol-loader icon warns "not found" **in dev only** (Rollup prod builds are fine). `vite.config.js` excludes it from `optimizeDeps` so Vite processes its source. Any future DS package that ships `import.meta.glob` in its source needs the same exclusion.

### zsh doesn't word-split unquoted variables
Shell here is zsh. `cmd $FILES` passes the whole string as one arg (bash would split). Use explicit args or a zsh array when scripting multi-file operations.

---

## Contracts the next agent should not quietly break

- **DS is consumed via published npm packages**, not workspace-linked (ARCHITECTURE §2).
- **Don't strip the brand color layer** (§3) or do destructive UI swaps (§4) — re-skin, don't bulldoze.
- **Brand editor look is the current target UI** — preserve its chrome unless told otherwise.

---

## Open architecture explorations

Engine decision settled (DOM/SVG, no Konva); both 2026-07-01 RFCs (render fork → hybrid, param graph) are **fully executed** — history lives in `../../docs/documentation/10-research/` and the session logs. The one open architecture question: the **multi-canvas / frame model** (canvas as optional container, layers outside canvases, Figma page model) — user-raised, proposal owed before any build.
