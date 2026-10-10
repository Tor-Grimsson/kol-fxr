---
_template:
  version: 1
  path: .kol/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-fxr — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `./history.md`. For speculative future work see `./plan.md`.

**Cloud sessions:** start at `docs/operations/02-cloud-sessions/INDEX.md` (authorship, branch + handoff, deploy, house rules). No active cloud brief — plan 22's audit was built locally (plans 23–24).

**Last updated:** 2026-10-10, last (**PLAN 26 IN THE DOCS**) — the vault documents plan 26: `04-effects` (fx-blocks, fx-media, sweep origin/travel, pinned-first stages, GL loops with chains), `05-parameters-binding` (Modulate), `06-camera-motion` (camera fold groups, Model + Lighting), `09-media` (stills in the file, export inlining, models in R2), `11-persistence` (Home grid + thumbs). Nothing open. See `session-log/2026-10-10-and-update-documentation-if-needed.md`.

**Prior:** 2026-10-10, later (**PLAN 26 CLOSED — THE MODEL, THE LIGHTS, ASCII ON A GL LOOP**) — plan 26 has nothing open. The 3D scene takes a model file (OBJ · GLB · STL; default the Stanford Bunny at R2 `kol-media/meshes/stanford-bunny.obj`, upload more with `bucket-r2 up <file> meshes/<name>` — wrangler from this repo's `node_modules/.bin` on PATH), a Lighting section (key / fill / rim / ambient, Light orbit), and **GL loops now carry canvas + pixi stages** (the GL frame is the chain's source; labs generators get Post-processing on Style). Modulation range row fits; the label-column measure coalesced. See `session-log/2026-10-10-plan-26-closed-the-model-and-the-range-row.md`.

**Prior:** 2026-10-10, local (**PLAN 26 — THE WALK FINDINGS BUILT**) — **the live plan is `.kol/llm-plan/26-the-walk-findings.md`**: items 1–14 built and walked (dark + light, 0 errors); § 15 (mesh in the 3D scene, meshes from R2) and § 16 (Modulation editor range row overflow) OPEN. New: `fx-media` (tile · drift · spin · tilt, pinned first), `fx-blocks`, sweep origin + travel (Scanline on the rig), Modulate one-press LFO motion, camera on every 2d generator, stills as downscaled data URLs in the file, export inlines photos (thumbs/PNG no longer blank), Home grid + thumbs, media-first Effects door. kol-theme 0.173.0 (`PrimaryHoverIsTheWell` closed). **A collecting plan means log only — no builds until "build"** (memory). See `session-log/2026-10-10-plan-26-the-walk-findings-built.md`.

**Prior:** 2026-10-09, latest (**SYNC LOOP TOGGLE · SUNKEN STRIPS · MORPH ON HOME**) — Sync loop is a Morph setting (toggle under Cycle, applied at resolve time from `morph.syncLoop`); every desktop `SegmentedToggle` on `tone="sunken"`, kol-labs.css's fake-sunken block retired (it kept a 1px border → 24px cells); footer Transport · Output · File back to SegmentedToggle (**plan 23's TabsRow reverted — spec rules never silently swap user-chosen controls**); Morph card on Home + below Randomiser in the rail; morph un-builds under two steps; labs no longer writes `view=labs`. Bumped component 0.249.0 · icons 0.35.0 · media-client 0.5.0. Unwalked. See `session-log/2026-10-09-sync-loop-toggle-sunken-strips-morph-card.md`.

**Prior:** 2026-10-09, local (**PLANS 23 · 24 · 25 — THE SPEC BUILT, THE GAPS CLOSED, THE FRONT DOOR**) — the cloud spec built on every default it proposed (one row/rung/heading, rails on `--kol-sidenav-w` and resizable, status bar, 10-cell toolbar, per-tool cursors, A converts shapes, W preview, effect slots, vector effects on the node model); every gap-matrix row made (pen add-anchor, per-corner radius, skew, transform origin, Twist/Pucker/Warp, History tab, Navigator, masks, Distribute, ⌘A); share tags + OG image + boot curtain + dark touch icon. 103 MB of unused `public/kol-images` → `_tmp/`, old Vercel deploys removed. **The Inspector stays empty with nothing selected** (2026-08-12 ruling outranks spec R3.5). DS gaps → plan 17 #4–#15. See `session-log/2026-10-09-plans-23-24-25-the-spec-the-gaps-the-front-door.md`.

*(Older entries trimmed to the 5-entry cap 2026-10-09 — each keeps its detail in its own `session-log/…md`.)*

---

## Status at a glance

- **Lobby queue: ONE (2026-10-08)** — `media-client-0-4-1-api-on-media` 🟠, closes on the user's deploy. 35 tickets filed out to kol-ds-ui over the arc; the round-trip inventory is `round-trip-inventory.md`. **No new DS tickets for editor work** — the user ruled that out 2026-10-08; see plan 06.
- **The release-age policy is scope-wide (2026-09-04)** — `pnpm-workspace.yaml`'s `minimumReleaseAgeExclude` is `'@kolkrabbi/*'`, not a per-version list. The old list had to gain four numbers per bump or `pnpm dev` refused to start; the 24h delay still guards every third-party dep.
- **Export + history are packaged (2026-09-04)** — `svgToPngBlob` · `inlineFontFaces` · `embedFontFace` · `downloadBlob` · `useHistory` in kol-component 0.208.0. **Never synthesize an `@font-face`** — rewrite the block and swap only `src`, or Google's `unicode-range` subsets collapse and every glyph exports as a system fallback while the screen looks perfect. **Never push history inside a `setState` updater** — StrictMode doubles every entry.
- **D1 `kol-fxr` exists and is EMPTY (2026-09-04)** — `3dfc8e68-1c2e-4525-96ae-7bbfa20bd61d`, WEUR, no tables, nothing wired. One database per app, named after the repo; clients bare. Local-first when it lands: **localStorage stays the session's truth, D1 is write-behind, and the draft autosave never goes near it** (100k row writes/day, hard-enforced since 2026-09-01). The API has to be a **Worker in this repo** — Vercel cannot hold a D1 binding. Accounts + credential locations: `docs/operations/01-services.md`; the card with the password: `_tmp/2026-09-04-database/README.md`.
- **THE EDITOR IS THIS REPO'S SOURCE AGAIN (2026-10-08, plan 06).** `src/index.jsx` is the editor; `src/editor/` `loops/` `filters/` `kinetic/` are ours to edit, nothing is published, **no DS tickets for editor work** (user ruling). The DS's `packages/design-editor` still publishes for its own apps — its fate is an open ruling. **A green `pnpm build` is not verification and neither is a dev walk: walk `vite preview` of the built bundle** — the `sideEffects` tree-shake shipped live past both.
- **The layout is `AppHub` (2026-10-07)** — Home and Settings are kol-shell's Hub pages; `src/` is `App.jsx` · `AppLayout.jsx` · `pages/Library` · `components/hooks` · two stylesheets · `main.jsx`. The keys split by route (see the 2026-10-08 entry); ⌥-digits stay local. The editor's stylesheet is imported first in `index.css` and the raw-source KOL packages are excluded from dep optimization — both load-bearing, both explained in the files.
- **The library syncs to D1 (2026-10-08, plan 07)** — Worker `kol-fxr-api` (`api/`, `pnpm api:dev|schema|deploy`), `VITE_FXR_API` names it (set on Vercel; `.env.local` for dev), a rail **Sign in** row opens a per-session sync (one password, the Worker secret; Bitwarden item still to create, the card is `_tmp/2026-09-04-database/README.md`). Explicit saves only; the draft autosave never. Without the env or a sign-in: localStorage, as before.
- **Deploys as the standalone app** (Vercel, `vercel.json` `/media` rewrite). It no longer ships an npm library; `vite.lib.config.js` + `index.lib.css` are vestigial.
- **Two module stores must come from the PACKAGE, never a local copy** — `railExtras` (labs writes, AppLayout reads) and `mode.js` (`let navigator`; a second copy silently turns every in-package hop into a full page reload). Same rule as a React context: one copy or it does not work.
- **Settings, TWO surfaces off ONE definition** (`src/settings/AppSettings.jsx`): the `/settings` page (on `ContentFilters` — section chips, keyword search over rows AND shortcuts) and a `SettingsPanel` drawer over any chrome (cog in the editor topbar, or `,` / `⌥,` anywhere; a shell page navigates to the page instead). Show grid rides the drawer's host slot (compose state, not an app default).
- **Canvas fills theme-aware:** frame (`--kol-surface-absolute-split`) + infinite backdrop (`--kol-surface-secondary`, own inspector swatch) + rulers (`--kol-fg-*`) all flip. Fill model: `null`=None, `var(--kol-*)`=themed-auto, hex/`palette:*`=explicit.
- **Hierarchy:** METHOD > TYPE > CATEGORY > PRESET everywhere (`docs/documentation/01-hierarchy/INDEX.md`, canonical).
- **Layer types:** background · pattern · photo · shape · text · path · **bool** (non-destructive booleans) · group · loop · kinetic · **misc** (Para Type; Interfaces later).
- **Catalog:** full labs parity — ~380 generative presets (incl. Penrose 55), 90 kinetic (incl. morph 6), 30+ filters, Misc glyphs/styles.
- **DS:** consumes published `@kolkrabbi/kol-*` via npm (external consumer, no linking); **component 0.249.0 · theme 0.173.0 · shell 0.63.0 · icons 0.35.0 · framework 0.49.0 · brand 0.1.3 · media-client 0.5.0** (2026-10-09), ALL PINNED EXACT (2026-08-30 — a `^` range moved theme 0.108→0.109 mid-verification, so a fix was verified and a revert shipped without a version line changing). **No local DS shims** (user ruling 2026-08-09 — shipped components are the truth; DS gaps go through the kol-ds-ui lobby, which round-trips same-day). ⚠ Check versions with `npm view <pkg> dist-tags`, not `pnpm outdated` (stale registry cache, FOUR times now). ⚠ **After ANY bump: re-read the dep's source from DISK and load the app in a BROWSER** — build-green + node-green miss import-time failures entirely; fxr shipped a browser-fatal `kol-media-client` 0.3.1 that way, and separately filed a DS defect that was our own fork of stale source. **0.x packages are pinned EXACT** (no semver contract below 1.0) — enforced across every kol-* dep since 2026-08-30, not just media-client. ⚠ **A GREEN BUILD IS NOT VERIFICATION** — it says nothing about whether a CSS selector matched or a branch rendered; only a browser measurement does. A whole 2026-08-30 arc was reported as done on `pnpm build` alone and none of it worked. ⚠ A long-running dev server can serve a STALE module while the server serves fresh source: restart before concluding a change did nothing. **This repo owns no app-tier CSS** — `src/styles/kol-app.css` was retired to `_tmp/` 2026-08-28 with the rail it patched, and `src/index.css` is imports-only again.
- - **Labs' two rails are one treatment (2026-08-30):** the right rail is the shell rail's twin — 48/`--kol-sidenav-w` widths, `surface-primary` + hairline, `useGrabEdge` wake/travel via kol-framework 0.36.0, mirrored grab (`left: -3.5px`), a collapsed footer folding to `NavRail`'s pinned-row anatomy, and both rails synced two ways in `LabsView`. `min-width: 0` on `.kol-editor-shell`/`.kol-editor-grid` is what stops the editor overflowing the page — do not remove it.
- **Mobile chrome (user-approved):** touch-primary → generative-only `MobileView` (`src/editor/mobile/`, doc `12-mobile`); tabbed overlay, all controls `lg`. Tablet ↔ desktop via `goDesktop`/`goMobile`; **Settings → Simple mode** is the desktop entry. `?view=mobile|desktop|output` force views. Ephemeral (`persistDraft={false}`). **Every touch device gets a Labs door (2026-09-01)** — tablets route to the real labs chrome, phones open `LabsBrowseScreen` (the shared catalog as a two-level sheet) over the same stage; the Editor door stays tablet-only. ⚠ Verified under touch EMULATION only.
- **Labs mode (`/labs`):** the labs.kolkrabbi.io chrome over the editor engine, built to the kol-labs-single SOURCE contract (read the repo, not screenshots). `LabsParams` rail + labs keys + zoom/fps chips + S-card overlay. **ON TOUCH IT IS THE SAME CHROME AS DRAWERS (2026-09-02):** `AppShell touch="drawer"` puts the shell rail off-canvas under 768px (DS hamburger, catalog as L1/L2), the params rail is a right drawer at 264 under a one-toggle bar, and the transport folds into a ▶ glyph opening a viewport-wide sheet. **The rail renders at ONE size group** — `ControlSizeContext` in `src/editor/params/controlSize.js`, `sm` on desktop / `md` on touch; never write a `size="sm"` literal in a rail component again. **`LabsNav` renders NOTHING since 2026-08-28** — it publishes its category rows to the SHELL rail via `src/railExtras.js`, so labs runs the same `NavRail` as every route. **Two levels (kol-shell 0.17.0, `RailTwoLevelSections` — filed from here):** L1 = the four method sections at 20/32, L2 = their groups at 12/20 indented right; nothing auto-expands. THE CATEGORY LAW still holds — sections and categories only, never presets.
- **Penrose = interactive living sims (2026-08-09):** all 55 under THE LIFE LAWS (`generative-life-laws` memory) — perpetual lifecycles, pointer-as-protagonist (host-smoothed `{x,y,down}` in sim space via `penrose/host.js`), events on press, `interaction` knob everywhere; masks generation-first (`'none'` default, Glyph/shapes/Custom-SVG opt-in).
- **Media is `@kolkrabbi/kol-media-client` (0.3.2, exact)** — `mediaLibrary.js` is a thin facade, NOT a fork; it hand-rolled the package's whole surface until 2026-08-28 and saw only R2. Three stores now (R2 433 · B2 website 3,443 · B2 vault 4,095 = **7,971 files**); the picker has a store selector. R2 is proxied through `/media/`, both B2 hosts load direct. **R2's CORS is live** (kol-r2b2, 2026-08-27) so the proxy is optional — but KEPT, because pre-policy cached responses still taint until `crossOrigin="anonymous"` is everywhere. **Read-only by ruling** (kol-r2b2 ARCHITECTURE §2/§4): writes go through the `bucket-r2` CLI, never a local upload endpoint.
- **The labs rail's control vocabulary (2026-09-02, user rulings):** ONE segmented control — the DS default `SegmentedToggle` (group radius, dividers), wearing ControlToneSunken's three lines in `kol-labs.css` because **`SegmentedToggle` alone has no `tone` prop** (owed to kol-ds-ui, NOT filed); ONE row — `SettingsRow` in `LabeledControlSection`s, named or not; ONE label voice — uppercase helper. `ViewToggle` and label-above stay the EDITOR's inspector. ⚠ The DS coarse-pointer 16px input floor is switched off inside the rail (it split the size group); `index.html`'s `maximum-scale=1` is what stops iOS focus-zoom instead.
- **VECTOR is a fourth METHOD (2026-09-01):** `distress` (SVG path distress, source via the picker's svg mode) + `modulator` (parametric ring instrument), both LABS-ONLY — registered in `src/loops/registry.js` but deliberately out of `GENERATIVE_TREE`/`PICKER_TREE`, resolving read-only in the editor inspector via `LEGACY_GROUP_LABELS`. **The labs catalog is `src/editor/labs/catalog.js` now** (`buildLabsCatalog(ctx)`): the desktop rail and the mobile sheet both render it, so a new section lands once. ⚠ `getTotalLength()` throws on a detached `circle`/`rect`/`ellipse`/`line` — the distress engine attaches its parsed SVG off-screen to sample; that host div is load-bearing.
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
