# Plan — Tunnel, grab, and the mobile way out

**Raised:** 2026-10-26, chat (refs: `~/dev/ref/new style/IMG_3084–3086.PNG`; `01-fxr.PNG` for Home on a phone).
**Status:** all built 2026-10-26/27 except W5 (normalising audit, next) and 7.8's renderer share. Phone layout on PhoneNav + TransportPill (kol-shell 0.83.0).
**Shape:** W › phase › list.
**Laws carried:** the editor is this repo's source, no DS tickets for editor work; the Dev page stays; RAIL never sheet; user copy verbatim.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — Gradient tunnel

### 1.1 — Tunnel category under Generative › Gradients — ✅ built 2026-10-26
Acceptance: Generative › Gradients shows Tunnel with Tunnel · Halo · Horizon, and they read like the refs.
- A fourth Iridescent branch (`cat` 3): rings in depth, a breathing halo, a rolling floor. Violet palette, scanlines.

### 1.2 — Shape of the rings — ✅ built 2026-10-26
Acceptance: Tunnel and Halo take circle · rounded square · polygon · star, same scale, pointing up.
- `shape` + `sides`; Horizon has no ring, so no Shape.

### 1.3 — Grab to move the shape — ✅ built 2026-10-26
Acceptance: with Grab on, a canvas drag moves the shape's centre, not the layer; one drag is one undo.
- `grabKeys` on the def (posX · drop), `useGrabKeysDrag` beside the Orbit hook; Grab never rolls.

## W2 — Dev page

### 2.1 — FX changelog tab (P: "a list of effects, what they do, when added, newest first") — ✅ built 2026-10-26
Acceptance: Dev › FX changelog lists every effect newest first with its rail path, filterable.
- `src/pages/fxChangelogRows.js` is the data; a new visual adds its row on top.

## W3 — Mobile Home

### 3.1 — The chooser comes back between the heading and the files — ✅ built 2026-10-26
Acceptance: on a phone, Home shows Generate · Effects · Labs · Morph above the files; Generate and Effects open the randomiser at that step.
- HubHome's `touch.doors`; the randomiser reads `?start=` once and drops it.

## W4 — Mobile Labs layout — ✅ built 2026-10-27
Proposal canvas: https://claude.ai/artifact/KRTF3jBpfpHUsEpyroDqRD (row 1 today · row 2 photos · row 3 live, real markup + CSS).
Today (390 wide): no way Home; the transport bar covers Output · File, and the lowered Rail's "Tunnel ^" button.

### 4.1 — PhoneNav on top, the panel below (P: "use the top and bottom") — ✅ built 2026-10-27
- Nav pill at the top: Home · Catalog · Params · Transport · More; the open panel sits at the bottom.
- Swipe the nav sideways to fold it to an edge tab (his ref: the iOS edge handle); tap the tab to bring it back.

### 4.2 — Transport stacks on the panel, not instead of it (P: "transport goes on top of settings not OR") — ✅ built 2026-10-27
- Transport is its own toggle: open with Params, it sits above the Params panel. The panels stop being either/or.

### 4.3 — More opens a list, closes nothing (P: "pressing '...' should not close what is open") — ✅ built 2026-10-27
- More shows its dropdown (Output · File) over whatever is open; the open panel stays.

### 4.4 — Transport without the × (P: "if we dont use X we dont need the space") — ✅ built 2026-10-27
- The nav toggles the transport, so the bar loses its × and the space it took.

### 4.5 — Speed by scrubbing, not the number pad (P: "scrub or something more natural") — ✅ built 2026-10-27 as the pill's stopwatch sheet (2, 4, 8, 12, 16 s), no number pad; a Speed scrub beside it not built
- Tapping "Loop / 4s" opens the iPhone number pad; drag on the value to scrub instead.
- Loop length is not the only speed control: each preset's Anim tab has a Speed knob (0–3). Surface it next to the loop.

### 4.6 — Rail tightening (P: grey Roll, "3 in a row?") — ✅ built 2026-10-27
- Roll is `Button tone="grey"`; it reads as a stray grey block. Match the row's tone.
- The roll-scope buttons (Color · Composition · Look · Motion · Motion Form) go three to a row.

### 4.7 — Catalog card padding (P: "why is it so extreme") — ✅ built 2026-10-27
- `LabsCatalogCard` uses p-8 (32px) where the rest of the rail uses 16. Bring it to the rail's inset.

### 4.8 — Gen · Style · Anim (P: "what segmentedtoggle is this, on what background") — ✅ built 2026-10-27 (tone="sunken" on the Labs rail toggles; the foot strip and transport bar are shared with the editor and unchanged)
- The DS `SegmentedToggle`, default variant, on the rail's `--kol-surface-primary` (kol-labs.css paints the rail).

## W6 — Color in Labs — ✅ built 2026-10-27
Refs (Adobe Color): base color · color wheel + harmonies · 2 to 8 colors · edit a tint · per-color lock / adjust / move / delete.

### 6.1 — Where Color lives in Labs (P: rail level 1 or level 2) — ✅ built 2026-10-27
- Color Modes has no home in Labs today. Options he named: a row in the shell rail's top level, or in the Labs level beside Effects · Generative · Vector · Composition.

### 6.2 — One color generates the palette (P: "it just needs one", "why is background first") — ✅ built 2026-10-27
- Today five fixed slots (Background · Ink · Accent · Dim · Warm, `ROLES` in `color/palette.js`), Background first by array order, not by meaning.
- Target: a base color plus a harmony make the palette; the count is chosen (2–8); roles are assigned after, not typed in first.

### 6.3 — Per-color actions — ✅ built 2026-10-27
- Lock, edit tint (a lightness ladder), reorder, delete, per swatch, as in the Adobe refs.

### 6.4 — Color Modes window is local, built from DS parts — ✅ answered 2026-10-27
- `src/editor/color/ColorModesWindow.jsx` + `PaletteBody.jsx`: fxr code on the DS `FullscreenOverlay`, `Dropdown`, `Button tone="grey"`, `ColorSwatch`. The ghost dropdowns and grey buttons are the DS defaults, composed here.

## W7 — Rail and catalog audit — ✅ built 2026-10-27
Raised 2026-10-27 ("we are due for some sort of audit").

### 7.1 — Flow and Letter Gap have no icons (P: "why dont they get icons?") — ✅ built 2026-10-27
- Both landed 2026-10-23 (plan 37) and were never added to `GROUP_ICONS` in `editor/labs/catalog.js`, so they fall back to `square`.

### 7.2 — Divider above the randomise block (P: "seperated by a divider?") — ✅ built 2026-10-27
- Randomize preset · Randomize all · the scope buttons sit flush under Background; one divider sets them apart.

### 7.3 — The borderless SegmentedToggle (P: "Im looking for the one that does not have border") — ✅ resolved 2026-10-27: tone="sunken" (no outer border, dark selected, grey cells, dividers)
- DS `SegmentedToggle` variants: `default` (outer stroke + dividers), `filled` (tiles with gaps, no shell, ring on the selected cell), `tonal` (tiles, no shell, selected by fill, no ring). `tone="sunken"` drops the shell border on `default`.
- Pick the one for Gen · Style · Anim and the other rail strips.

### 7.4 — Speed and Phase value boxes differ in width (P: "why is speed not the same width as phase?") — ✅ built 2026-10-27
- One width for every range value box in a section.

### 7.5 — Swatch press gives 6 palette chips and an inline None (P: "why dont you get the color picker") — ✅ built 2026-10-27
- `compose/inspectors/ColorField.jsx`: the popover holds the palette swatches plus a `Tag` None. Pressing a swatch should open a real picker (palette chips as a row inside it), None as a proper control.

### 7.6 — Soft Forms 3D and 3D Scene overlap (P: "why wouldnt we just call this 3d scene? and use categories?") — ✅ built 2026-10-27 (3D Scene › Soft forms; categories now read Forms, Metaballs and Stack, Solo, Cluster)
- Fold Soft Forms 3D into 3D Scene as categories.

### 7.7 — No category name in preset names, no bullets (P: "Letter gap · rule", "Glyph vortex · n", "Spiral · pinwheel") — ✅ built 2026-10-27
- Preset labels repeat the type or category before a "·". Category is already chosen above; the preset names its own difference only.

### 7.8 — Flow › Glyphs vs Halftone › ASCII (P: "check ascii options from halftone, see if there is overlap") — ✅ ASCII field loop built 2026-10-27; moving Glyph vortex onto the shared renderer not done
Findings:
- Both are one glyph per grid cell, driven by a field. They differ only in what the field decides.
- Glyph vortex (`loops/flow/glyphVortex.js` on `fieldCore.instanceGlyphs`): a generator. One fixed glyph; the vector field sets each cell's rotation, its strength sets size and the weak-to-strong colour. Draws with `fillText` per cell.
- ASCII (`filters/fxAscii.js`): an effect on media. Image brightness picks the character (8 charsets, Custom ramp, Braille dots); Edges picks one of four stroke glyphs by gradient direction. Colour from the source or one ink. Draws from a glyph atlas (plan 27: `fillText` was a fifth of the frame), with the sweep rig for motion.
- Overlap: ASCII Edges is the vortex idea snapped to four angles; the vortex is ASCII with a fixed charset and continuous rotation.
Proposal:
- One glyph-grid renderer (ASCII's atlas path) with per-cell mappings: character from a ramp or one glyph, rotation from a vector field or none, size and colour from a scalar.
- Glyph vortex moves onto it (it gains the atlas speed and the charsets). The same renderer fed a generated field is 7.9's generative ASCII layer, so the two land together.

### 7.9 — A generative ASCII / halftone layer (P: "a halftone version of generative scanline") — ✅ built 2026-10-27
- Today ASCII only runs as an effect on media. Wanted: a generated field with ASCII on top, inside Generative.

### 7.10 — Loops vs Pattern vs Math (P: "isnt field and pattern loops just patterns?") — ✅ built 2026-10-27
- Loops › Field and Loops › Pattern Loops read as Pattern; Loops › Simple is part Math (curves, lissajous) and part Pattern (grids, wave grid). Regroup by what the output is.

### 7.11 — Presets that are a toggle (P: "pinwheel just adds a fill? shouldnt that just be a toggle?") — ✅ built 2026-10-27
Every preset whose override turns a switch on its base loop (scanned against each loop's schema; nothing culled yet):

| Category | Preset | Switch | Also tunes |
|---|---|---|---|
| Simple › Curves | Spiral pinwheel | Fill shape | turns, fill alpha |
| Simple › Curves | Rose filled | Fill shape | k, fill alpha |
| Simple › Curves | Lissajous woven | Fill shape | a, b, fill alpha, fill rule |
| Simple › Rings | Concentric bands | Ring fill | ring alpha, rings, weight |
| Simple › Lines | Arc sweep bands | Ring fill | ring alpha, rings |
| Simple › Particles | Orbit dots discs | Ring fill | ring alpha |
| Simple › Particles | Orbit dots bands | Ring fill | ring alpha, rings, dots per ring |
| Simple › Particles | Orbit dots radial | Ring fill | ring alpha, fill, rings |
| Simple › Particles | Orbit dots target | Ring fill + path off | ring alpha, rings, dots, dot size |
| Simple › Particles | Orbit dots bare | Path off | dot size |
| Math › Parametric | Spinner Mono, Threads Mono | Mono | drift or pull, glow, weight, ball size |

Not switch variants (a different form, not a flipped switch): Threads Mesh (grid form), Surfaces Lorenz (another attractor), Scanline Weave (lattice weave), every Pattern rules preset.
Proposal: the ten Simple-loop rows fold into their base preset; Fill shape and Ring fill already sit in each base's Style tab, so nothing is lost but the duplicate entries. The two Mono rows stay (they retune five values, not one).

## W5 — Normalise exposed params and randomised values — TALK, audited 2026-10-27
Scanned every loop the presets use (live registry, 2026-10-27). "Knobs" = non-colour params; "gated" = shown only for some settings (`when`); "rolled" = what Randomize all touches; "curated" = ranges with a musical roll span (`rMin`/`rMax`).

| Family | Loops | Knobs | Gated | Rolled | Curated per loop |
|---|---|---|---|---|---|
| Loops › Simple | 16 | 11–19 | 0 | 13–18 | 3–4 |
| Pattern › Rules, Pattern Loops | 1 engine | 53 | 43 | 52 | 8 |
| Pattern › Field | 10 | 9–11 | 0 | 12–13 | 3 |
| Scanline | 1 | 29 | 16 | 27 | 3 |
| Penrose | 55 | 20–26 | 4 | 21–27 | 2 |
| Math | 8 | 11–30 | 0–24 | 11–32 | 1–3 |
| Flow, Letter Gap | 6 | 9–13 | 0–1 | 11–15 | 1 |
| Drift | 3 | 15 | 0–5 | 15 | 1 |
| Gradients | 1 engine | 33 | 26 | 32 | 1 |
| Soft Forms, 3D Scene › Soft forms | 2 | 20–22 | 1 | 20–22 | 1 |
| 3D Scene (Primitive, Ribbon, Forms, Environment, Abstract) | 6 | 8–39 | 0–17 | 8–33 | 1–2 |

Findings:
- Visible knobs run from 8 to about 26 at once; the big engines hide most behind gates, Penrose shows all of its 20 to 26.
- Randomize all rolls almost everything: rolled is params minus a handful of `noRandom`, so one press moves 11 to 52 values.
- Few rolls are curated: most families have 1 to 3 ranges with a musical span, the rest roll across the whole slider, which is why rolls land on extremes.
- Colours are inconsistent: 0 (Drift, Gradients, Soft Forms, roll through a palette select) to 5 (Penrose) colour params.

Proposed rule (one rule, all families):
- **Show at most 12 knobs at once.** Form and look first; the rest move to a named section that stays collapsed (Gradients and Scanline already gate this way; Penrose, Math waveform and field, 3D Scene Primitive and Ribbon need it).
- **Randomize all rolls the look, not the structure.** Counts, seeds, geometry modes and anything that swaps the form are `noRandom` by default (they stay on their own scope buttons); every rolled range carries a curated `rMin`/`rMax`. Target: 6 to 10 values per press.
- **Colours roll through roles only** (bg, fg, accent from one palette), never as free hexes, in every family.
