# Playbook — Labs on mobile + the Vector section

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`. Plan: `.kol/llm-plan/02-labs-mobile-and-vector.md`.

**Goal:** Execute the five-step plan — extract the labs catalog out of `LabsNav`, port the modulator and distressor engines from kol-apps, mount them as a new VECTOR labs section, then give phones a Labs door feeding the same catalog.

**Standing rules (non-negotiable):**
- A green build is not verification — every done-when is a browser measurement.
- THE CATEGORY LAW: the rail shows sections and categories only, never presets.
- No local DS shims; a consumer/DS gap goes through the lobby.
- Icons opaque `oq-*` only — never an alpha `fg-*` on a glyph.
- `npm view <pkg> dist-tags`, never `pnpm outdated`.
- Restart the dev server before concluding a change did nothing (stale-module trap).

---
## Entries

[16:47 GMT · 2026-09-01] · setup · playbook created
  what → initialised the live playbook + plan file   why → user kicked off the labs-mobile + vector arc (/playbook + /kol-goal)
  note → sources confirmed outside repo: kol-apps/kol-modulator (DialRotation 224 ln), kol-apps/kol-svg-distress (useSvgDistortion 465 ln, paper dep unused)

[16:52 GMT · 2026-09-01] · T1/catalog-extraction · src/editor/labs/catalog.js + LabsNav.jsx
  what → labs catalog (icons, sections, groups, pick semantics) → new catalog.js buildLabsCatalog(ctx); LabsNav keeps only carried-source + the railExtras fold   why → shared seam for T4 (VECTOR) and T5 (mobile labs)
  after → CategoryScreen/MobileView import icons from catalog, not LabsNav
  verify → build n/a (HMR) · /labs rail 30 rows identical to pre-refactor baseline ✓ · Penrose pick seeds pen-01-packing-lloyd + canvas ✓ · /randomiser generator grid ✓ · 0 console errors ✓

[16:57 GMT · 2026-09-01] · T2/modulator-engine · src/loops/modulator/{rings.js,presets.js} + registry.js
  what → DialRotation ported onto the loop contract: warped ring pairs, breath = |sin(TAU·u·breaths/2)|, drift = integer turns per loop, waves always integer per ring (seamless by construction)   why → the source's gsap drift accumulator never loops; quantize branch was the correct closure
  after → group 'modulator', 6 presets (Pulse ×3, Weave ×3); registry GROUPS/LOOPS/PRESETS_BY_GROUP/PRESETS wired
  verify → deep link ?preset=mod-pulse seeds + rings render (screenshot) ✓ · Space animates, frame diff 304 ✓ · Style tab: 12 params, 10 sliders, 10 bind dots ✓ · 0 console errors ✓
  note → not in GENERATIVE_TREE on purpose — surfaces under sec:vector in T4

[17:08 GMT · 2026-09-01] · T3/distressor-engine · src/loops/distress/{engine.js,presets.js} + registry + picker seam
  what → useSvgDistortion ported pure: parse+sample cached per (source, frequency), mode offsets per frame (8 modes verbatim), catmull-rom → Path2D; svgSrc off-schema (markup or URL, engine fetches); LabsSourcePicker svgMode (Library|Upload, no Camera) + MediaPicker accept='svg' + SourceStrip on the distress GenerativeSurface
  why → the distressor eats PATHS — the photo/filter pipeline can't carry vector sources
  note → ROOT CAUSE FOUND: getTotalLength THROWS InvalidStateError on detached circle/rect — the source app silently dropped every non-path shape; engine attaches off-screen for the sampling pass
  verify → default art distresses + animates (diff 344) ✓ · seam frame(0)===frame(1) ✓ · vault pick b2v biskup.svg renders distressed (screenshot, diff 1465) ✓ · svg filter lists 320 vault / 144 b2 ✓ · 0 console errors ✓

[17:10 GMT · 2026-09-01] · T4/vector-section · catalog.js + taxonomy.js + docs/01-hierarchy
  what → sec:vector between Generative and Composition; Distressor (scribble) + Modulator (dashed-circle) rows off leafRows; section glyph pen-nib; LEGACY_GROUP_LABELS entries; hierarchy doc: METHOD table + Vector types para, updated 2026-09-01
  verify → rail shows VECTOR → DISTRESSOR/MODULATOR between GENERATIVE and COMPOSITION ✓ · section press opens rail + expands ✓ · L2 picks dispatch (?preset=mod-pulse, ?preset=dst-press) ✓ · 0 icon warnings ✓

[17:12 GMT · 2026-09-01] · T5/mobile-labs · mobile/LabsBrowseScreen.jsx (new) + MobileView.jsx
  what → phone entry card gains a Labs door (in-chrome; tablets keep the routed door, Editor stays tablet-only); LabsBrowseScreen renders buildLabsCatalog as EffectScreen's two-level sheet (sections → groups → category leaves), picks run the catalog's own dispatches; active falls back to the lone survivor after setOnly's swap
  why → one catalog, two chromes — mobile inherited VECTOR for free
  note → Modulation section filtered out (its entry is the bind dots, which mobile has none of); distress SVG re-sourcing not reachable on mobile (default art only) — v1 gap, deliberate
  verify → touch-emulated 390×844: entry = Generate·Labs ✓ · sheet lists EFFECTS(6)/GENERATIVE(10)/VECTOR(2)/COMPOSITION(3) ✓ · Modulator→Pulse renders + ANIMATES on the phone stage, overlay "Modulator · Pulse" full tabs ✓ · Halftone→Dither seeds photo+filter and opens the two-pane source picker ✓ · 0 console errors · pnpm build green ✓

[17:27 GMT · 2026-09-01] · coverage-pass · no code changes
  what → the surfaces the T1–T5 checks never opened, after the user asked what had actually been reviewed
  verify → /editor loads clean, Generative panel = the 10 GENERATIVE_TREE types, NO distress/modulator leak ✓ · /randomiser desktop unchanged, generator grid clean, Penrose pick + Randomize all stay in-group ✓ · tablet 820×1180 touch: doors still Generate·Editor·Labs (my ternary didn't alter the ≥600 branch) ✓ · /labs full rail 33 rows incl. VECTOR ✓ · 0 horizontal overflow at 1024 and 1280 ✓ · 0 console errors on every route
  note → light/dark measured IDENTICAL for both new engines — checked against ring-pulse and bars-wave, which behave the same: a loop's pixels are its own bg/ink params, re-themed by the loop Theme dropdown, not the app theme. Existing model, not a regression
  note → `Icon "list" not found` warns on /editor — PRE-EXISTING (`AssetsBody.jsx:15`), untouched this session; a kol-icons gap, not mine
  note → harness trap: CDP touch emulation is STICKY across newCDPSession + clearDeviceMetricsOverride; a stale coarse pointer made AppShell render `touch="bare"` and read as "the rail vanished". Use a fresh browser context per device class

[17:31 GMT · 2026-09-01] · icon-name-fix · src/editor/compose/AssetsBody.jsx:15
  what → VIEW_OPTIONS list icon `list` → `view-list`   why → NOT a DS gap: kol-icons ships it as `view-list` in the layout group (its sibling `grid` is why the other half rendered)
  note → user called it before I did — "possible its called something different". I had queued a kol-icons ticket off a missing-name assumption; that would have been a false filing. Read the icon set, don't infer the name
  verify → /editor Assets: List view 1 svg / 1 path, Grid view 1 svg / 4 paths, 0 icon warnings, 0 console errors ✓

[18:09 GMT · 2026-09-01] · randomiser-list · MobileOverlay.jsx
  what → (1) media effects get per-stage scoped rolls — labs' StageRolls derivation (deriveScopes on stage.def.params, stage view + bare-stage write = LabsParams verbatim, generalised to index i), strips under each chain row; (2) scope grids → stateless lg SegmentedToggle action strips with width-aware row packing (9.6px/char heuristic — blind 4-per-row mangled "Motion Frame"); (3) collapsed cluster left-anchored, disclosure pill first, px-3 matching the expanded header inset
  why → user list: media had no scoped rolls (they existed in labs since the effect tab — I'd wrongly said unbuilt), chevron jumped sides, panel too tall. md buttons rejected: ladder 26/32/40, 32px too small a touch target — strips keep 40px and save more
  verify → touch 390×844: scanline scopes 3 strips 0 clipped, panel 380→332, Geometry roll changes canvas ✓ · media+ASCII: strips under the chain row, Cells + Characters rolls change render (hash) ✓ · collapsed: pill x=12 first, label+chevron holds one x both states ✓ · 0 console errors
  note → ASCII strip shows "Color" AND "Colour" adjacent — its section literally named 'Color' (non-color params) beside the derived colour scope; same on desktop/labs (shared derivation), reads like a typo on one strip. User's call, not patched

──────────── MILESTONE: plan 02 steps 1–5 all shipped ──────────── [17:12]
  changed: 14 files (5 new) · quarantined: 0 · build ✓ · goal .active-goal → done
  log: (owed — /log-work on request)

