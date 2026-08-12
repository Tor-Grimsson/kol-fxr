---
_template:
  version: 1
  path: .kol/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-design-editor — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `./history.md`. For speculative future work see `./plan.md`.

**Last updated:** 2026-08-12 (**FIGMA INSPECTOR REBUILD + TYPOGRAPHY PASS + DS 0.37 ADOPTION**) — The inspector COPIES Figma now: purpose sections (Position/Layout/Appearance/Typography/Fill/Stroke), property inputs (Input `variant="property"` — `X 240`, `∟ 0°`), tonal segmented strips, one-container paint bars (slotLeft) with REAL per-paint opacity/eye through export, header ⋯ menu (booleans/flatten/Edit/Save-type), full-bleed dividers, right-click context menu, Effects tab empty-state, nothing-selected empty rail. **Text morph is BACK as a basic setting** (brand MorphedText port; Parameters→Style; `axisBlend` bindable; axis-aware flatten/export) on the family/style font model (`modes/type/families.js` — RG cuts / JetBrains / 45 Google render-only). Auto-resize text (real measurement), vertical align, corner radius, dots gated on `M`, `S` toggles shortcuts, Mode door by the title + labs-nav Mode section, Randomiser entry CARD. Seven DS round-trips adopted same-day → **component 0.37.0 · theme 0.37.0 · icons 0.15.0**; SegBar twin retired to `_tmp/`. UNVERIFIED tail: tonal strips render, Randomiser Labs door, dev-only yellow-X favicon (vite `apply:'serve'` plugin). LAWS re-learned hard: helper-mono NEVER on wrapping text · icons paint `text-oq-*` · glyph ladder 16 solo/14 adjacent · selected = tonal tile, no ring · DS components only, never local twins · **Playwright-verify before claiming visuals**. See `session-log/2026-08-12-figma-inspector-rebuild-typography-pass-and-ds-adoption.md`.

**Prior:** 2026-08-09 (**FRAME-BUDGET AUDIT + NaN CRASH ROOT FIX**) — The recurring crash was `rampRGB(NaN)` — guarded at the renderer AND clamped at every physics source. Perf audit over all 55 sims: 7 quadratic loops bounded, `strokeOutline` memoized, `shadowBlur` purged, draw storms batched, anti-strobe eased. Build green, fuzz clean. See `session-log/2026-08-09-frame-budget-audit-and-nan-crash-root-fix.md`.

**Prior:** 2026-08-09 (**PENROSE LIFE LAWS + RANDOMIZER ARC**) — The whole penrose catalog (55 sims) is pointer-interactive and under **THE LIFE LAWS** (auto-memory `generative-life-laws`: nothing fossilizes · pointer commands the primary dimension · interaction is an event): four agent fan-outs + inline surgery gave every sim lifecycles, ecosystems (predator-prey, hat-tile Game of Life, phyllotaxis garden, plummer supernovae), the BIGGER doctrine (marks 3×, rotated live `pc()` roles — "always yellow" cured), and a **low-passed weighted pointer** at the host (`{x,y,down}` in sim space; grab/fling on packing). **Generation-first ruling:** masks default `'none'` (preset pins retired; Glyph/shapes/**Custom SVG** opt-in). Randomizer: audit round shipped (Re-trigger, seeded shuffle, real icons, touch pointer events), pinch-to-scale, labs `LabsSourcePicker` for media-in. Inline fixes: apollonian blank clip, droste memory hog, stam add-source. 16 browser-only sims + all feel constants await the user's visual pass. See `session-log/2026-08-09-penrose-life-laws-and-randomizer-arc.md`.

**Prior:** 2026-08-09 (**OSCILLOSCOPE RAIL + INPUT LAWS**) — The Oscilloscope grew its full rail: working scope chips (⌥-click = scoped reset, everywhere), the **Wild** procedural-expression button (seeded grammar compositor, fuzz-verified), Fit/Reset, labs' X/Y zooms. Fit root-caused twice against labs source: eval now PINS (min 0, max 100) — bounds are viewport only, feeding live bounds into the max-scaled helpers was a divergence — and fit sampling scales with the window (fixed 300 aliased over 30s spikes). Fit = 10% Y headroom, none on X, zooms→1. `randomizeSchema` honors schema `p.roll(rng)` hooks (generic). THREE laws in auto-memory: **opaque icons** (oq-* scale, never alpha fg-* — multi-path glyphs compound), **filled inputs** (ghost resolves to outline in shipped atoms), **typed input outranks slider range** (RangeField commit unclamped). Audio toggle sm; transport cells on text-oq-*. See `session-log/2026-08-09-oscilloscope-rail-arc-and-input-laws.md`.

**Prior:** 2026-08-09 (**KOL 0.33 + CATEGORY LAW + OSCILLOSCOPE**) — Icons 0.14.0 consumed (LabsNavIcons 🟢; `GROUP_ICONS` on labs names, DS-ruled mappings, Randomize stays `refresh`, Drift = `dith-flow` wave), component 0.33.1 + theme 0.33.0 bumped. Then **USER RULING — THE CATEGORY LAW: the left rail is SECTIONS and CATEGORIES only; presets NEVER render there** (right rail owns them). `categoryLeaves`' loose-preset fallback deleted (sub-less group = one group-named leaf); labs-true categories authored: GRADIENTS Field·Pole·Volume, MATH Expression·Waveforms·Parametric·Surfaces·Fields, EFFECTS>PATTERN = the four generator pages (mesh-gradient family moved `gradients`→`optic`), EFFECTS>SCANLINE = six look leaves. Labs' /math Expression tool ported whole (`src/loops/math/expression.js`, own scope DSL ×max, 15 example presets, geometry-asserting verify). All three lobby receipts' remainders satisfied; stubs not yet squared. See `session-log/2026-08-09-kol-033-bump-category-law-and-oscilloscope-port.md`.


---

## Status at a glance

- **One editor at `/`** — modes GONE (Tools→Color modal, Pattern/Text rail tabs); `pnpm build` green.
- **Ships two ways:** npm library `@kolkrabbi/design-editor` (`pnpm build:lib`, published) + standalone app (Vercel deploy, `vercel.json` `/media` rewrite).
- **Settings menu:** Theme light/dark/system (dark default removed) + Show grid (`G`, **hidden by default**).
- **Canvas fills theme-aware:** frame (`--kol-surface-absolute-split`) + infinite backdrop (`--kol-surface-secondary`, own inspector swatch) + rulers (`--kol-fg-*`) all flip. Fill model: `null`=None, `var(--kol-*)`=themed-auto, hex/`palette:*`=explicit.
- **Hierarchy:** METHOD > TYPE > CATEGORY > PRESET everywhere (`docs/documentation/01-hierarchy/INDEX.md`, canonical).
- **Layer types:** background · pattern · photo · shape · text · path · **bool** (non-destructive booleans) · group · loop · kinetic · **misc** (Para Type; Interfaces later).
- **Catalog:** full labs parity — ~380 generative presets (incl. Penrose 55), 90 kinetic (incl. morph 6), 30+ filters, Misc glyphs/styles.
- **DS:** consumes published `@kolkrabbi/kol-*` via npm (external consumer, no linking); **component 0.37.0 · theme 0.37.0 · framework 0.18.0 · icons 0.15.0**, peerDeps ranges matched. **No local DS shims** (user ruling 2026-08-09 — shipped components are the truth; DS gaps go through the kol-ds-ui lobby, which round-trips same-day). ⚠ Check versions with `npm view <pkg> dist-tags`, not `pnpm outdated` (stale registry cache, twice now).
- **Mobile chrome (user-approved):** touch-primary → generative-only `MobileView` (`src/editor/mobile/`, doc `12-mobile`); tabbed overlay, all controls `lg`. Tablet ↔ desktop via `goDesktop`/`goMobile`; **Settings → Simple mode** is the desktop entry. `?view=mobile|desktop|output` force views. Ephemeral (`persistDraft={false}`).
- **Labs mode (`?view=labs`):** the labs.kolkrabbi.io chrome over the editor engine, built to the kol-labs-single SOURCE contract (read the repo, not screenshots — the three survey outputs are the law). `LabsParams` rail + `LabsNav` (DS sidenav, drag-collapse, accordion, category leaves, FX-RACK rack pages) + labs keys + zoom/fps chips + S-card overlay. **THE CATEGORY LAW (user ruling 2026-08-09): the left rail shows SECTIONS and CATEGORIES only — presets never render there;** `categoryLeaves` enforces it by construction.
- **Penrose = interactive living sims (2026-08-09):** all 55 under THE LIFE LAWS (`generative-life-laws` memory) — perpetual lifecycles, pointer-as-protagonist (host-smoothed `{x,y,down}` in sim space via `penrose/host.js`), events on press, `interaction` knob everywhere; masks generation-first (`'none'` default, Glyph/shapes/Custom-SVG opt-in).
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
