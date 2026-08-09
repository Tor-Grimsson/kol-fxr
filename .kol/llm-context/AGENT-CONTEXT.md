---
_template:
  version: 1
  path: .kol/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-design-editor — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `./history.md`. For speculative future work see `./plan.md`.

**Last updated:** 2026-08-09 (**KOL 0.25 BUMP + DD SHIM REMOVED**) — Registry checked via `npm view dist-tags` (`pnpm outdated` served stale data AGAIN — trust dist-tags): kol-component 0.25.0 · kol-framework 0.14.0 · kol-theme 0.30.2 bumped in devDeps AND peerDeps, install + build green (peer warning is pre-existing: kol-component wants `opentype.js ^1.3.4`, we ship 2.0.0). Then **USER RULING: the local `.kol-dd-*` shim was incorrect — use the shipped Dropdown as-is.** `kol-editor.css` §6 deleted wholesale; the "kol-theme owes a dd-chrome restore" premise is retired, don't re-shim and don't file that ticket. Dropdowns not visually verified (restart dev server first). See `session-log/2026-08-09-kol-025-bump-and-dd-shim-removed.md`.

**Prior:** 2026-08-09 (**LABS MODE BUILT — WORKS, BUT MILES OFF THE REFERENCE**) — All six Phase-11 steps landed (`src/editor/labs/`, `mode.js` + `ModeChooser`, topbar seam, `draftKey`, deep links) and browser-verified working; then the KOL-bump fallout: kol-theme lost ALL `.kol-dd-*` dropdown chrome after 0.6.0 → shimmed locally (`kol-editor.css` §6, incl. the shim-authored `.kol-dd-list` column-flex that fixes the panel's runaway intrinsic width), Geometry/Geometry doubled headers fixed editor-wide (`AutoControls`), boot made empty-stage (no autoplay/autoselect), chooser stripped to buttons, Space = transport in labs. **⚠ USER VERDICT: visually miles off labs.kolkrabbi.io** — nav icons, preset chips, `Effect·Motion` tabs, density all still editor-flavoured; the reskin pass is the next arc. DS debts: kol-ds-ui owes the dd chrome restore (ticket not yet filed) + kol-icons 0.10.0 dropped `stop`/`rewind`; `JetBrainsMono-Variable.woff2` corrupt. See `session-log/2026-08-09-labs-mode-built-and-ds-drift-fallout.md`; in-flight state in `session-bridge/handoff-2026-08-09-*`.

**Prior:** 2026-08-08 (**KOL → LATEST + LABS MODE SCOPED**) — All four KOL packages bumped to actual latest (`kol-component` 0.24.0 · `kol-theme` 0.30.1 · `kol-framework` 0.13.0 · `kol-icons` 0.10.0) in devDeps **and** peerDeps — the stale `^0.1.2`/`^0.1.1` peer contract is finally closed. Build green; **no visual pass yet** (24 theme minors of drift). `kol-helper-11` confirmed gone (ladder 8/10/12/14/16/20) — swap `ParametersPanel.jsx:305` to `kol-helper-12` awaits the user's go. Then **Labs mode scoped as plan.md Phase 11**: a second chrome over the same engine — standardized output, full capability (effects · generative · modulation), no compositor UI; **three-mode model** (Editor · Labs · Randomiser — the mobile chrome IS the randomiser, not labs' touch layout); own draft key; From-library|Upload two-pane source state. Build phases 11.1–11.6 **ALL BUILT the same day** — `src/editor/labs/` (LabsView · LabsNav · LabsMenuTop · LabsSourcePicker · useLabsLayer), `src/editor/mode.js` + `ModeChooser.jsx`, `EditorShell` `registry.topbar` seam, `draftKey` prop through `ComposeStateProvider`/`EditorProviders`, and `firstPresetPatch`/`presetLayerPatch`/`groupOfPreset` hoisted into `loops/registry.js`. App + lib builds green. ⚠ **Runtime unverified** — the 11.1 kill criteria are a live check (params drive the layer · filter attaches · bind dot modulates · transport plays) and a green build proves none of them. See `session-log/2026-08-08-kol-bump-and-labs-mode-plan.md` and plan.md Phase 11.

**Prior:** 2026-07-09 (**KOL-ICONS 0.5.0 BUMP**) — Bumped `@kolkrabbi/kol-icons` `0.4.0 → 0.5.0` in **both** `devDependencies` and `peerDependencies` (peer `^0.4.0` caret-pins the 0.x minor, so it would have excluded the installed 0.5.0). `pnpm install` regenerated the lockfile (supply-chain policy passed); `pnpm build` green (only the known chunk-size warning). Tree was already clean / `origin/main` up to date — the session-start dirty snapshot was stale. The **separate** stale peer ranges (`kol-component ^0.1.2` / `kol-theme ^0.1.1`) are untouched — still the deferred publish-contract call. Commit/push (`kol-ds-editor-09`) handed to the user (git permission-blocked this session). See `session-log/2026-07-09-kol-icons-bump.md`.

**Prior:** 2026-07-09 (**MOBILE CHROME DONE + DS SIZE SYSTEM 0.6.0 + ESCAPE HATCHES**) — Mobile chrome **user-approved**. Finished it: wrote **`docs/documentation/12-mobile/`** (active), wired the tablet↔desktop escape hatches (`device.js` `goDesktop`/`goMobile` navigate by `?view=` URL, not flag+reload — fixes the forced-`?view=mobile` reload loop) + a **Settings → Simple mode** desktop entry into the generative chrome (`MenuTop`). Drove two DS bumps: **0.5.0** gave `SegmentedToggle` a real `sm/md/lg` (retired the mobile CSS hack → `size="lg"`); **0.6.0** wrapped every `.kol-btn-*:hover` in `@media (hover: hover)` — root cause of the "one collapsed button transparent" bug (kol-btn-primary:hover → translucent `--kol-fg-08`, and `:hover` sticks after a tap on touch). Now a unified **touch-size system**: buttons/toggles/`TransportBar` (new `size` prop, `sm` default = desktop verbatim) all `lg`. Round-trip + hover-fix browser-verified; builds green. **Process lesson (cost ~4h):** the hover bug was DS-side CSS AND the dev server served stale pre-bundled 0.4.0 until restart — after any dep bump, restart the dev server before trusting a runtime check. See `session-log/2026-07-09-mobile-doc-escape-hatches-and-ds-size-system.md`.

---

## Status at a glance

- **One editor at `/`** — modes GONE (Tools→Color modal, Pattern/Text rail tabs); `pnpm build` green.
- **Ships two ways:** npm library `@kolkrabbi/design-editor` (`pnpm build:lib`, published) + standalone app (Vercel deploy, `vercel.json` `/media` rewrite).
- **Settings menu:** Theme light/dark/system (dark default removed) + Show grid (`G`, **hidden by default**).
- **Canvas fills theme-aware:** frame (`--kol-surface-absolute-split`) + infinite backdrop (`--kol-surface-secondary`, own inspector swatch) + rulers (`--kol-fg-*`) all flip. Fill model: `null`=None, `var(--kol-*)`=themed-auto, hex/`palette:*`=explicit.
- **Hierarchy:** METHOD > TYPE > CATEGORY > PRESET everywhere (`docs/documentation/01-hierarchy/INDEX.md`, canonical).
- **Layer types:** background · pattern · photo · shape · text · path · **bool** (non-destructive booleans) · group · loop · kinetic · **misc** (Para Type; Interfaces later).
- **Catalog:** full labs parity — ~380 generative presets (incl. Penrose 55), 90 kinetic (incl. morph 6), 30+ filters, Misc glyphs/styles.
- **DS:** consumes published `@kolkrabbi/kol-*` via npm (external consumer, no linking); **component 0.25.0 · theme 0.30.2 · framework 0.14.0 · icons 0.10.0**, peerDeps ranges matched. **No local DS shims** — `.kol-dd-*` shim removed 2026-08-09 by user ruling (shipped Dropdown is the truth). ⚠ Check versions with `npm view <pkg> dist-tags`, not `pnpm outdated` (stale registry cache, twice now).
- **Mobile chrome (user-approved):** touch-primary → generative-only `MobileView` (`src/editor/mobile/`, doc `12-mobile`); tabbed overlay, all controls `lg`. Tablet ↔ desktop via `goDesktop`/`goMobile`; **Settings → Simple mode** is the desktop entry. `?view=mobile|desktop|output` force views. Ephemeral (`persistDraft={false}`).
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
