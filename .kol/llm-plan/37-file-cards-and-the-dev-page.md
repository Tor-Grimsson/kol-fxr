# Plan — File cards and the Dev page

**Raised:** 2026-10-22, the user, four screenshots of Home (RECENT · SAVED) and `/library`. Points verbatim:
- P1 *"this card needs fixing, is it local or ds?"* — Home's grid card, `···` menu reads `editRename` · `copyDuplicate` · `trashDelete`.
- P2 *"RECENT missing thumbnails and Im clicking some and they are empty?"*
- P3 *"and SAVED same thing, whats going on here?"*
- P4 *"in library there is another issue, delete button overlayed without ui regard"*
- P5 *"naming is also just looking like a huge bug?"*
- P6 *"its for LOCAL DVELOPMENT, so why the fuck wouldnt you show me the LOCAL CARD DEVELOPMENT there?"* — the Dev page (kol-shell `HubDev`) is where local work is shown.

**Status:** BUILT — 2026-10-22 (late): every phase built or PARKED; Home + Library on the approved file card (tone, ISO date, cog/trash, right-click), Labs rail Palette row, editor Palette tab, LayerStack + Canvas owned here; walked on `vite preview`, 0 console messages. The Dev page retired to `_tmp/2026-10-22-dev-page-retired/` once nothing was left on it. Earlier: Open (on the Dev page, `/dev`): 2.0 card kind · 2.3 long names · 5.4 colour panels · 7.3 drawer z · 8.6 drop-into (DS) · 8.10 ruler px (DS). Partial: 5.6 by-property mapping (the flow loops each declare one). W5 + W6 are the two lobby tickets, read 2026-10-22.
**Shape:** W › phase › list.
**Laws carried:** card frame is the DS's (`CatalogPage` → `ContentCard`) — fix what we put in it, no DS tickets for editor work (plan 06); never delete — retire to `_tmp/`; Tailwind first; user-facing copy verbatim.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — The Dev page shows the local cards

### 1.1 — Turn on `/dev` with a Cards tab (P6) — ✅ built 2026-10-22 (`src/pages/DevCards.jsx`; also carries 2.0 · 2.3 · 4.1 · 5.4)
- Pass `dev={{ tabs: [...] }}` to `AppHub` in `src/AppLayout.jsx`; the `</>` row appears on localhost only (kol-shell's own gate).
- One tab, **Cards**, in its own file (`src/pages/DevCards.jsx`): the real `ContentCard` / `ContentRow` with FXR's own `toCard` output — file with thumb, file without thumb, long name, Library card — side by side, both layouts.
- Built from the same functions Home and Library use, so a fix to the card shows here first.

**Acceptance:** on `pnpm dev`, the rail shows `</>` → `/dev` → Cards tab renders every card state Home and Library can produce; a production build has no `/dev`.

## W2 — Home's file card

- P7 *"you'll adress the broken dropdown in the '...'? and delete button goes somewhere? you can reference other catalog cards when you are designing. like media had a comprehensive card that could even show size mb it had download button. but cant remember variant name."*

### 2.0 — Design the file card from the DS's own cards (P7) — ✅ ruled + built 2026-10-22: the DS `file` card and row — download on the cover, size, cog over trash in the plate, the same menu on right-click; Library is on it (`src/pages/LibraryPage.jsx`, parts in `src/components/FileCard.jsx`)
- Home renders `CatalogPage`'s default grid card, variant `catalog`. The media card he means is `ContentCard variant="file"` (the default kind; kol-r2b2's media library): `date` · `size` slots, `SizeOrDownload`, and a `control` node in the media frame's corner (the download chip), `controlStart` top-left.
- Mock both in the Dev Cards tab with a real FXR file: `catalog` as now vs `file` with the verbs — `···` menu (Rename · Duplicate · Delete) — and what FXR puts in `size`/`control` (layers · aspect · date, an Open or Export chip).
- He picks from the Dev tab; 2.1–2.3 and W3 build on the pick.

**Acceptance:** the Dev Cards tab shows both variants side by side with the same file; his pick is written on this heading.

### 2.1 — The `···` dropdown fixed (P1, P7) — ✅ built 2026-10-22 (`src/components/FileCard.jsx`)
- `src/AppLayout.jsx:233-235` passes `iconLeft="edit"` etc.; `MenuDropdownItem` takes a node, so the name prints as text and overflows its 16px column (why `trashDelete` sits left of the others). Pass `<Icon name="…" size={16} />`.
- Check the panel against a DS menu (alignment, width, z-order over the next card) in the Dev tab; fix what is ours.

**Acceptance:** the `···` menu reads Rename · Duplicate · Delete with their glyphs, rows aligned, panel over the neighbouring card — on Home and in the Dev Cards tab.

### 2.2 — A file without a thumbnail (P2, P3) — ruled 2026-10-22 — ✅ built 2026-10-22 (`FileThumb` placeholder)
- Ruling: *"thumb on next save is fine, but we should have a temp placeholder until then loaded in card"*.
- A file with no `thumb` shows a placeholder in the media slot (designed in the Dev Cards tab with 2.0); the next save writes its thumb. No backfill.

**Acceptance:** an old file's card shows the placeholder, not an empty block; open + save it, and the card shows its thumb.

### 2.3 — Long names and the `···` (P5) — filed 2026-10-22: `FileCardTitleClearsActions` (kol-ds-ui) — truncate before the plate actions
- Names like `Morph W 1791484577796` clip into the `···`; `Sync A … copy` wraps to two lines while others truncate.
- Needs a look in the Dev Cards tab first: is it the title's truncation in `ContentCard`, our `actions` width, or just the names?

**Acceptance:** written after the ruling.

## W3 — Library's cards

### 3.1 — Library card takes Home's `···` menu (P4, P7) — ✅ built 2026-10-22
- `src/pages/LibraryPage.jsx` drops a raw outline `Delete` Button into `actions`, drawn over the title. Delete moves into the same `···` menu Home uses (lift `FileActions` out of `AppLayout.jsx` so both import it), on the card variant 2.0 picks.

**Acceptance:** no button over the title on `/library`; the `···` menu deletes a preset and the card leaves.

### 3.2 — Library shows the file's own picture (P4) — ✅ built 2026-10-22
- `LibraryPage.jsx` cycles the three chrome screenshots (`PREVIEWS`) as media on every card — not the file. Presets use `item.thumb` like Home; other slots per 2.2's ruling.

**Acceptance:** a preset with a thumb shows that thumb on `/library`, same as on Home.

## W4 — The Oct 8 test files (P2, P3, P5)

### 4.1 — Clear the plan-08 leftovers — ruled 2026-10-22: the agent cleans them out — ✅ built 2026-10-22: D1 holds none of them (4 docs, all real); they live in your browser storage only, so the clean is a button on /dev — **Export and remove**, once per origin (localhost:5173, fxr.kolkrabbi.io)
- `Plan08 Editor` · `Plan08 Labs renamed` · `Sync A 1791…` · `Morph W 1791…` are plan-08 sync test saves, likely near-empty — why they open blank (unconfirmed until inspected).
- Inspect them, then remove them from this device and the D1 library in one pass; list every name removed. A JSON export of what goes lands in `_tmp/<date>-plan-08-test-files/` first.

**Acceptance:** none of those names on Home, Library or after a sync; the export and the removed-list exist.

## W5 — Color pass: one palette every layer reads

From [[lobby/inbox/color-pass-one-palette-for-every-layer|color-pass-one-palette-for-every-layer]] (2026-10-22, claude.ai chat). Raised: colour is *"pretty sure just random now, maybe connected to some saved swatches"*. Context re-checked 2026-10-22: every cited file exists; 139 `type: 'color'` params (single-line count; ticket says 145); 7 in `filters/` + `kinetic/` carry no `role`; `rng.js:62` gives each colour param its own `randColor`; no colour library installed (`d3-delaunay` is the only geometry dep). Build before W6 — its effects read colour through this.

### 5.1 — Audit appended to the ticket — ✅ 2026-10-22
- Per folder: which colour params carry a role, which layer types ignore the theme today.

**Acceptance:** the table is in the ticket; counts match a grep.

### 5.2 — One palette store — ✅ built 2026-10-22 (`src/editor/color/palette.js` `allPalettes`; themes unchanged — `palette.check.mjs`)
- Shape `{ id, name, colors, roles?, source, harmony?, seed }`; the nine `loops/lib/themes.js` themes, Combo Lab output and `kol.editor.swatches` all load as palettes.

**Acceptance:** one preset compared before/after shows no visual change.

### 5.3 — The resolver and the shared generator — ✅ built 2026-10-22 (DS engine, not a Combo Lab lift — see 5.4 note; HSL, not OKLCH: the DS engine is HSL and a third engine is the thing the ticket rejects)
- `themeParams()` (`loops/theme.js:10`) becomes `(params, schema, palette, settings) → params`; un-roled params resolve by index (Rotation).
- `generatePalette` lifts out of `editor/modes/palette/colorMath.js` into a shared module, gains split-comp · tetradic · duotone, generates in OKLCH, stores hex.
- Tag roles on the 7 un-roled params in `filters/` + `kinetic/`.

**Acceptance:** a loop, a filter and a kinetic layer all recolour from one palette change.

### 5.4 — Color settings per chrome — ✅ built 2026-10-22: the color pane's Palette tab (`src/editor/color/PaletteBody.jsx`) — relationship · roll · lock · load · save · apply to layer; Window › Left rail › Palette and Edit › Palette open it
- His answer (2026-10-22): *"depends on which chrome you mean"* — **Labs**: a colour section in the settings rail; **Generator/Randomiser**: a simplified version, randomise over the modes. The editor's place is still open.
- References: (a) the old another-creation palette tool (brand.another-creation.xyz/editor/palette — Aspect · Layout 60/30/10 · Pool · Mode · role swatches Primary/Secondary/Light/Dark/Accent · Randomize · Save palette to library). It survives here as `src/editor/color/PaletteModal.jsx` over `editor/modes/palette/` (Combo Lab). (b) The DS's colour tool — *"probably even better reference for modes generations"*; ask the kol-ds-ui peer agent (same tmux session) where it lives and what modes it generates. kol-acyr is a sibling repo to read too. (c) *"look at the new DS tool in styleguide set, theres huge overlap in functionality. even if its just the engine"* (2026-10-22) — the kol-ds-ui styleguide colour tool; if its engine covers W5.3's generator, W5 consumes it instead of lifting Combo Lab.
- Output: a short research note in this plan — what each reference does, what W5's generator takes from which — then the per-chrome panel shapes for his ruling. **Gates 5.3**: the generator's source (DS engine vs lifted Combo Lab) is decided here first.

**Research note (2026-10-22).** Three references, one engine underneath:
- **kol-component `colorMath`** (installed, `@kolkrabbi/kol-component` 0.283.0): `HARMONIES` (analogous · complementary · split · triadic · tetradic, as role hue offsets), `harmonyColors(hue, harmony, {s, l})`, `generateHarmony`, `seedHarmony` (six jittered modes: random · monochromatic · analogous · complementary · triadic · doubleComplementary — `Math.random`, not seedable). Its header says it was raided from this repo's palette mode.
- **kol-styleguide `ColorLab`** (`kol-ds-ui/packages/styleguide/src/colorLab.js`, 0.6.0): one base + a harmony → ten hues 36° apart, blue-grey + grey ramps, five-step "Material Girl" blend ramps per hue, four brand slots, a 60/30/10 mix — built ON kol-component's `generateHarmony`. Its roles are the another-creation tool's (Primary · Secondary · Light · Dark · Accent).
- **FXR `PaletteModal`** (`src/editor/color/PaletteModal.jsx` over `modes/palette/colorMath.js` · `pools.js`): pools (Brand…), six modes, locks, a seed colour, 60/30/10 layout, Save palette to library — the screenshot's tool, alive here.
- **kol-acyr**: not read yet — no colour engine surfaced in a grep of the sibling; ask if it holds one.

Decision taken: W5's generator is kol-component's harmonies under FXR's seeded roll (`palette.js`). Owed to the DS if wanted: a seedable `seedHarmony(baseHex, mode, rng)` — then `rollPalette` could drop its own spread. PaletteModal's own `colorMath.js` is the duplicate; retiring it onto the DS engine is a follow-up, not done.

Still TALK — the panels: **Labs** a colour section in the settings rail (relation · base · lock · load · save); **Randomiser** the simplified one (randomise over relations); **Editor** — where? (the Dev page carries this question).

**Acceptance:** research note written; per-chrome panel shapes ruled on this heading before 5.4 builds.

### 5.5 — The Color roll rolls a palette — ✅ built 2026-10-22 (walked: penrose Packing, three rolls, three related palettes — `_tmp/2026-10-22-plan-37-walk/w5-roll*.png`)
- `editor/lib/rng.js` + `editor/params/rolls.jsx`: roll a relationship + seed, resolve it; per-param hex survives only as the explicit "Random" relationship. Contrast check warns, never enforces.

**Acceptance:** five rolls in a row each read as related colours.

### 5.6 — Mapping proven on one layer — PARTIAL: by index built (un-roled params rotate through the palette in `randomizeSchema` + `resolvePalette({ rotate })`); BY PROPERTY is per-loop engine work (a loop colouring its elements by cell size / field strength) — lands with W6's effects, each declares its property
- By index plus one property (a loop that already exposes cell size or field strength).

**Acceptance:** changing the mapping visibly redistributes colour on that layer; desk + 390, 0 console errors.

## W6 — Effects intake: eight motion references

From [[lobby/inbox/effects-intake-motion-references-2026-10|effects-intake-motion-references-2026-10]] (2026-10-22, claude.ai chat). Context re-checked 2026-10-22: the reused parts exist — `loops/penrose/protos/01-packing-lloyd.js`, `07-flow-field.js`, `loops/abstract/RDEngine.js`, `filters/fxHalftoneDither.js`, `filters/dither.js`, `kinetic/KineticType.js` + `animations.js`; `d3-delaunay` installed. Frames not attached — source posts named per row in the ticket.

### 6.0 — Order — ruled 2026-10-22: as proposed
- W5 → E2 → field core → E4 → E5 → E3 → E6a → E6b → E1; E8 later; E7 parked.

### 6.1 — E2 letter-gap kinetic type — ✅ built 2026-10-22 as a 2D loop (`loops/flow/letterGap.js`, type Letter Gap) — the kinetic engine lays glyphs on a path and draws nothing between them, so the decorations had no home there
- A kinetic-type mode: per-gap width on noise, gap decoration none · box · connector rule · tick · dot.

**Acceptance:** a labs preset, params on `AutoControls`, colour via W5; walked desk + 390.

### 6.2 — Field core — ✅ built 2026-10-22 (`loops/flow/fieldCore.js`; 07 reads `noiseAngle` — same rng draw, same values)
- One module: components (uniform · noise/curl · vortex · source/sink · charge · obstacle · image gradient · letterform mask) → `sample(x, y, t)`; renderers: RK4 streamlines + glyph instancer. `07-flow-field` moves onto it.

**Acceptance:** `07-flow-field` reads the core with no visual change.

### 6.3 — E4 obstacle flow · 6.4 — E5 charge streamlines · 6.5 — E3 glyph vortex — ✅ built 2026-10-22 (type Flow: Obstacle flow · Charge lines · Glyph vortex; 61 fps on the page clock)
- Each a labs preset on the field core; mapping property: E5 cluster, E3 field strength.

**Acceptance (each):** a labs preset, params on `AutoControls`, colour via W5 with one mapping property, desk + 390, 0 console errors.

### 6.6 — E6 slicer: (a) zoom-wave filter, (b) screens — ✅ built 2026-10-22 (`filters/fxSlicer.js`: Slice wave in Post-processing, Riso in Halftone with dots + labyrinth screens; riso is a CPU pass — fine on stills, ~0.5s/frame on a moving generator at full size)
- (a) cols × rows slice with a travelling zoom band. (b) riso + labyrinth (RD threshold) — the gaps beside `fxHalftoneDither`.

**Acceptance:** as 6.3, mapping ← image tone.

### 6.7 — E1 Voronoi pulse — ✅ built 2026-10-22 (type Flow › Cells)
- On `d3-delaunay` from `01-packing-lloyd`: rounded inset cells, glow ← cell area, proximity graph.

**Acceptance:** as 6.3, mapping ← cell area.

### 6.8 — E8 line portrait — PARKED: heavy; same family as E6's labyrinth, vector output — after W6.6
### 6.9 — E7 eye-tile poster — PARKED: layout, not motion; likely composable today with frames + masks

## W7 — Labs is a level; its sections expand in place

- P8 *"when you press labs you should enter that level and the sub categories should expand collapse, instead of now you press lab then magically more tabs appear but dont indicate being children of lab (not indented) and then you enter each sub category."*
- P9 *"rail ships both options I believe"*

Today: `src/AppLayout.jsx` splices Labs' five sections (Effects · Generative · Vector · Composition · Modulation, from `src/editor/labs/LabsNav.jsx` via `railExtras`) flat under the Labs row on `/labs`; pressing a section drills the whole rail into its groups (← Effects, Halftone, Scanline …). Two moves, no indentation.

### 7.1 — Read the DS rail's two modes (P9) — ✅ 2026-10-22
- Find in the shipped rail (kol-component `NavRailSite` / kol-shell `AppShell`) the drill level and the in-place expand, and the props that pick them. No local shim if it is there.

**Acceptance:** the props named here, with file:line; if the drill-then-accordion combination is missing, a kol-shell ask is drafted instead of a local workaround.

Found: `AppShell railSections: 'fold' | 'enter'` (kol-shell `AppShell.jsx:46`) → `NavRail sections` (kol-component `NavRail.jsx:321`). In `enter` mode an entered level renders its rows as plain `RailItem`s with no `onEnter` (`NavRail.jsx:408`), so a section inside it FOLDS — the combination ships; no DS ask.

### 7.2 — Labs drills; sections expand (P8) — ✅ built 2026-10-22
- Built: on `/labs` the Labs row carries the five sections as `sub` (`src/AppLayout.jsx`); `railSections` stays `enter`. Walked desk + 390 drawer: ← LABS level, Effects folds open with indented groups, a group press still dispatches; 0 console warnings.
- Pressing Labs enters a Labs level (← Labs back row); the five sections inside it expand/collapse in place, their groups indented under them; a group press runs as today (`dispatch` in `LabsNav.jsx`).
- The flat splice in `AppLayout.jsx` goes; `/morph` keeps its Morph rail.

**Acceptance:** on `/labs` the rail shows Labs → its five sections → each opening in place with indented children, no second drill; ⌥-digits, touch drawer and collapsed rail still work; desk + 390, 0 console errors.
- Not done: arriving at `/labs` from elsewhere does not auto-enter — `NavRail`'s `entered` is internal state with no prop. One more press enters. A controlled `entered` prop would be a kol-component ask (not filed).

### 7.3 — Labs overlays cover the touch drawer — ✅ built 2026-10-22: our two overlays (`LabsCatalogCard`, `LabsSourcePicker`) moved under the drawer's scrim (z sticky − 2); walked at 390, the drawer opens over the chooser
- At 390 the Labs chooser / source picker (`LabsCatalogCard.jsx:30`, `LabsSourcePicker.jsx:156`, z `--kol-z-modal` 100) draw over the open nav drawer (kol-theme `.kol-shell-drawer*`, z ≈ `--kol-z-sticky` 20) and block its trigger. Navigation should sit above in-chrome overlays — a kol-theme layering question, not a local override.

**Acceptance:** written after the ruling.


## W8 — Editor review, 2026-10-22

Points verbatim (the user, 2026-10-22, screenshots of the editor):
- P10 *"from top menu sub-layers open on hover, shouldnt that also happen on new layer dialog?"*
- P11 *"there is an empty layer option, but no way to drag other items into it? just over and under it?"*
- P12 *"remove the logo"* (menu bar)
- P13 *"we have no selected state, can we make one? we already have this style? easy picking?"* — the Inspector tab chip as the open-menu state.
- P14 *"when category is seclected, children items get hoverstate … we should also have this"*
- P15 *"when you have clicked a category and entered a selected state, moving between categories automatically triggerst selected state with hover … this is just how the mac topbar works."*
- P16 *"sub categories of category have overlapping frames, while we have edge to edge"*
- P17 *"this font doesnt work for ui. right grotesk is a brand typeface … you can suggest something."*
- P18 *"this new rail is kinda weird, what was the reference? affinity? the color item on the bottom has no padding from edges?"*
- P19 *"why does the color spectrum in the color panel have a min height? … I think it shouldnt have min height, or at least not as large as it is."*
- P20 *"the title has bug in the border, looks double on top, why?"*
- P21 *"this doesnt need to say px? just remove it."*
- P22 *"text tool needs text frame vs text without a frame … and get character vs. paragraph text panels"*
- P23 *"didnt we talk about making top bar darker background then the app? like mac … tetriary … absolute even darker?"*

### 8.1 — Menu bar: no logo, an open state, a live bar (P12, P13, P15) — ✅ built 2026-10-22
- `src/editor/shell/MenuTop.jsx`: the logomark goes (Home stays on the app-name menu).
- The open menu's trigger wears the Inspector tab chip's selected fill (same token, no new style).
- Once one menu is open, hovering another trigger opens it (mac bar); click outside / Esc closes.

**Acceptance:** no logo; the open trigger has the chip fill; click File, slide to View — View opens without a click.

### 8.2 — Menu panels: hover rows, flyouts edge to edge (P14, P16) — ✅ built 2026-10-22
- Rows in a panel get the hover fill (today only the trigger does) — `.kol-editor-menu` in `src/editor/styles/kol-editor.css`, or the DS row's own hover if it is being suppressed.
- A flyout's top row aligns with its parent row and sits edge to edge with the parent panel — no overlap.

**Acceptance:** hovering any row fills it; Layer › Live Filters flyout butts the parent panel with no overlapping frame.

### 8.3 — Menu bar darker than the app (P23) — ✅ built 2026-10-22 (`surface-absolute-split`, #000 in dark)
- Plan 31 already ruled *"MAKE IT DARKER"* for the bar; read what shipped and take it to the darkest step the theme has below the app (`surface-tertiary` → `surface-absolute` if tertiary is not darker than the panes).

**Acceptance:** the bar reads visibly darker than the panes and the toolbar band in dark and light; token named here.

### 8.4 — UI typeface — PARKED: ruled "later" 2026-10-22; Right Grotesk stays for now (P17)
- Suggestion: the platform UI face (`system-ui` → SF Pro on Mac) for the menu bar, menus and pane chrome — what the mac reference uses, zero load; Right Grotesk stays brand, mono stays for numbers/labels. A typeface is a KOL decision — if ruled, it is a kol-theme ask, not a local override.

**Acceptance:** written after the ruling.

### 8.5 — New-layer menu flyouts on hover (P10) — ✅ built 2026-10-22 (composed locally from DS MenuItem + MenuDropdownNest flyout; DS AddLayerButton hard-codes the accordion)
- The `+` add-layer menu's Shape uses the accordion nest; switch to the DS `MenuDropdownNest flyout` the top menu uses, so sub-types open on hover to the side.

**Acceptance:** hovering Shape opens Logo · Rectangle · … to the right, no click.

### 8.6 — Empty layer accepts drops (P11) — ✅ built 2026-10-22: LayerStack taken in from kol-component (`src/editor/compose/LayerStackView.jsx`, plan 06 — editor organisms are edited here); a container row's middle third drops INTO it
- "Empty layer" is a `group` (`compose/state.jsx:429`); the Layers panel only offers above/below on it. An empty group needs an "into" drop zone (the middle band of its row).

**Acceptance:** drag a layer onto the empty layer's row middle → it becomes its child, indented; above/below still work.

### 8.7 — Tools strip: reference and foot padding (P18) — ✅ built 2026-10-22 (pair scaled to the buttons' 32)
- Reference was Affinity's tools strip (plan 31 § head). The fill/stroke pair at its foot sits flush to the edges — give it the strip's gutter; review the strip against the Affinity reference with him.

**Acceptance:** the swatch pair has the same side/bottom gutter as the tool buttons.

### 8.8 — Colour spectrum min height (P19) — ✅ built 2026-10-22 (floor 160 → 64)
- `src/editor/color/ColourPanel.jsx:157` `min-h-40` forces 160px and a scroll when the pane is shorter. Drop it (or a small floor ~`min-h-16`).

**Acceptance:** drag the Color pane short — the spectrum shrinks, no vertical scroll.

### 8.9 — Title line double border (P20) — ✅ built 2026-10-22
- `src/editor/shell/DocTitle.jsx:29` draws `border-t` against a neighbour that already draws its bottom hairline — two lines. Keep one.

**Acceptance:** a single hairline above `Untitled @ 60%`.

### 8.10 — Ruler corner without "px" (P21) — ✅ built 2026-10-22: Canvas taken in from kol-component (`src/editor/shell/CanvasView.jsx`); the corner square is empty
- Remove the `px` label from the ruler corner square (ours or the DS `CanvasRuler` prop — find which).

**Acceptance:** the corner square is empty.

### 8.11 — Text frames, Character and Paragraph — PARKED: ruled its own plan (38) 2026-10-22 (P22)
- Two text kinds: **point text** (no frame, grows with content) and **frame text** (a box; text aligns and wraps inside it). Panels split into **Character** (font, size, tracking, leading) and **Paragraph** (alignment, indents, spacing).
- Big enough to be its own plan; scope with him first.

**Acceptance:** written after the ruling.
