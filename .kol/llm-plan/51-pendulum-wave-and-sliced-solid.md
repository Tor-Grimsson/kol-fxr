# Plan — Pendulum wave, sliced solid, and a rail that tells the truth

**Raised:** 2026-10-31, the user: *"scope the 2 effects, how could it work?"* with 13 phone screen recordings in `~/Downloads/ref` (IMG_3099–3105: "WAIT FOR ALL 100 TO SYNC · watch the ripples" pendulum grid, light and dark; IMG_3106–3113: stacked pink/red/violet ellipses in an oval). Then *"yes add to /plan-shape"* on the scope: both as canvas 2D generators, presets after his references, built after plan 50.
**Status:** built — 2026-10-31, every phase ✅. The five kol-ds-ui tickets returned and are adopted at kol-component 0.330.0 (StepList, ParamBindDot, FunctionPlot, BezierPathEditor, ColorPickerPopover footer); fxr's local pieces retired to `_tmp/`.
**Also raised (W4):** *"what about the local rail control components? layers and special rail sections? did we have any idea of DS vs. local?"* · *"I mainly want to know what is local o do the audit and report what you find"*.
**Also raised (W3):** *"did you normalise the generate controls and random buttons? did you make sure no disabled buttons were in view?"* · *"what about canvas lock and declared interactions in the rail? so there isnt baked in interactions you cant turn off?"* · *"but what about 3d orbit toggle for 3d based presets?"*
**Shape:** W › phase › list.
**Laws carried:** NEVER AUTO START (49 10.1) · every generator has an `about` line (49 6.1) · Generate holds ≥ 3 picture controls (49 7.2) · ≤ 12 rows a tab, no repeated roll labels (`rolls.check.mjs`) · a control that does nothing is not shown (49 10.2) · effects ship generative too.
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his references; motion closes on a 30 fps recording, stitched with ffmpeg and watched beside his screen recordings.

## W1 — Pendulum wave (Math › Sync)

### 1.1 — The analytic pendulum wave — ✅ built 2026-10-31
- Pendulum *k* of *N* swings `θₖ(u) = A·cos(2π(n₀ + k)·u)` on the loop clock u ∈ [0, 1]: pure maths, no simulation. Every pendulum is back in line at u = 0 and 1, so the loop is seamless, and at u = p/q they fall into q groups.
- Drawn on a grid (10 × 10 by default, his reference): pivot dot, rod, bob. A bob glows when ≥ 3 others share its phase within a tolerance, which is his orange "group" highlight.
- Generate: Count (16–144), Base swings n₀, Amplitude, Rod length, Grid (rows × cols or one row), Glow tolerance. Style: Theme (light and dark, his two looks), glow colour.
- `about`: "Pendulum wave — N pendulums whose swing counts differ by one; in-phase groups form at every rational fraction of the cycle".
- **Acceptance:** u = 0 and u = 1 draw identical frames (0 % pixel diff); at u = 1/2, 1/3, 1/5 the bob angles fall into exactly 2, 3, 5 distinct values (±0.5°); the glow count at u = 1/3 ≥ 90 of 100; 60 fps at 144 pendulums.

### 1.2 — The sync readout (optional layer) — ✅ built 2026-10-31
- His reference's strip under the grid: the order parameter `R(u) = |1/N Σ e^{iθₖ}|` plotted over the loop with a cursor, and the phases as dots on a ring. A toggle, Show sync, off by default.
- **Acceptance:** Show sync off draws none of it (0 % change below the grid); on, the plot's peak sits at u = 0 and R(1/2) is within 0.02 of the analytic value.

### 1.3 — Presets after the references — ✅ built 2026-10-31
- Light (IMG_3099–3102: white ground, black bobs, orange glow), Dark (IMG_3103–3105: navy ground, pale bobs, gold glow), plus Ripple (one long row), Slow sync (n₀ high) and Dense (12 × 12).
- **Acceptance:** 5 presets in Math › Sync; Light and Dark set side by side with his frames, same layout (grid, bob size relative to cell ±15 %).

### W1 — built
- `src/loops/math/pendulum.js` (`math-pendulum`, 60 s loop) + `pendulum.check.mjs` (node: seamless, 2 · 3 · 5 groups at u = ½ · ⅓ · ⅕, R(0) = 1, R(½) ≈ 0, all pass). Grid is ⌈√N⌉ wide (10 × 10 at 100, his layout); a lit bob keeps its colour and wears the glow as a ring + halo, as in his frames. Row layout is the classic pendulum wave: rod length ∝ 1/(n₀+k)², so the bobs hang on a curve, each swinging under half a spacing.
- Measured: u = 0 and u = 1 render byte-identical; glow-coloured pixels at u = ⅓ (16 977) equal u = 0 (16 884, all 100 lit), at u = 0.37 none; Dense (144) 61 fps; about line shows under Preset. Phase groups are counted, not bob angles: angle = A·cos φ, so φ and −φ share an angle (at ⅓ the 3 phase groups show 2 angles), which is why the acceptance's "angles" reads as phases.
- Sync readout off → `draw` returns before it (nothing drawn below); on → the phase ring and R(u) with its cursor, peaks at u = 0 and 1.
- Presets in Math › Sync: Dark, Light, Ripple (row), Slow sync, Dense; Light and Dark set beside IMG_3100 / IMG_3105: same 10 × 10 grid and glow look.

## W2 — Sliced solid (Shape › Sliced)

### 2.1 — A solid of revolution cut into discs — ✅ built 2026-10-31
- A profile `r(h)` (sphere, capsule, dome, hourglass) cut into *S* horizontal slices; each slice is a disc seen from a tilt, so it draws as an ellipse with ry = r·sin(tilt). The slices drift along the axis by one slice spacing per loop, so the loop is seamless.
- Discs are translucent and drawn back to front with additive-style blending, coloured from a height ramp (pink → red → violet, his frames), clipped to the solid's silhouette, which is the oval.
- Generate: Shape, Slices (8–60), Tilt, Drift (whole slices per loop), Inner shape (a second, smaller solid sliced the same way, IMG_3113's dome). Style: palette ramp, Disc opacity, Rim brightness.
- `about`: "Sliced solid — a solid of revolution cut into translucent discs that drift along its axis".
- **Acceptance:** u = 0 and u = 1 identical (0 % diff); every slice's ellipse ratio ry/rx = sin(tilt) ±1 %; the silhouette's bounding box matches the profile's at the tilt ±2 px; 60 fps at 60 slices.

### 2.2 — Texture and glints — ✅ built 2026-10-31
- The fine woven line pattern on the discs (IMG_3108 zoomed) is a fine line screen drawn inside each disc, with Texture 0–1 (0 = none). Four-point glints flash on disc rims: short, fading, a few at a time, with Glints 0–1.
- **Acceptance:** Texture 0 and Glints 0 each draw 0 % of their marks; at defaults a 10 s recording shows ≥ 3 and ≤ 12 glints alive at once, each living ≤ 0.6 s.

### 2.3 — Presets after the references — ✅ built 2026-10-31
- Bloom (IMG_3106), Tunnel (IMG_3107), Lens (IMG_3108), Dark core (IMG_3110), Dome (IMG_3113).
- **Acceptance:** 5 presets in Shape › Sliced; each set beside its reference frame: same silhouette (oval aspect ±5 %) and the same order of hues top to bottom.

### W2 — built
- `src/loops/shape/slicedSolid.js` (`sliced-solid`, 12 s loop): sphere / capsule / dome / hourglass profiles; discs drawn as ellipses (ry = r·sin tilt), each shading from a dark back edge to a light front edge with a two-tone rim; the solid runs the frame's full height, its end discs cropped as in his frames; optional inner solid drawn darker; a 4 px line-screen pattern over the silhouette; glints from 16 slots, each flashing 6 times a loop.
- Found and fixed on the way: the disc-alpha param was first called `opacity`, which is the layer's own opacity, so the whole layer drew at 30 % (renamed `discAlpha`); presets set all four colours and `bgOn` because his pink ground is part of the look (an unset colour takes the theme).
- Measured: u = 0 and u = 1 render byte-identical; Texture 0 and Glints 0 draw none of their marks (on: 41 391 and 90 px changed at 300 × 375); glints alive at once 4–5 across the loop, each 0.6 s; 61 fps live; 60 slices + inner solid 1.4 ms a frame at 1080 × 1350; a 40-frame recording (`sliced.mp4`) changes 1.0–1.1 % per frame, one bump of 1.3 as a disc leaves the bottom. Ellipse ratio is sin(tilt) by construction.
- Presets in Shape › Sliced: Bloom, Tunnel, Lens, Dark core, Dome, set beside IMG_3106 / 3107 / 3108 / 3110 / 3113: same hue order top to bottom; his frames are 9 : 19.5 phone captures and the Labs frame is 4 : 5, so the oval's aspect follows the frame (no ±5 % match is possible across the two ratios).

## W3 — The rail tells the truth

### 3.1 — No disabled button in view — ✅ built 2026-10-31
- **Cause:** controls render whether or not they can act. Undo / redo sit greyed beside the rail title on every freshly opened patch, and nothing checked for others.
- A button that cannot act is not drawn (the slot stays, so nothing shifts when it appears); undo / redo show once there is history.
- Built: a button that cannot act is not drawn — in a row it keeps its slot (`invisible`, `aria-hidden`), on its own it is not rendered. Fixed: undo / redo (LabsParams), the effect chain's move up / down (EffectsPanel StageRow), Soft forms' move / duplicate / delete / Add form, Kinetic's delete / move / Group / Ungroup / Remove point / delete motion layer, the effect chain's Add FX / Add media motion at the cap, Parameters' Flatten (outline fonts only), Color's Apply to layer and palette delete, Swatches' Add swatch, Morph's Save (needs two steps), the phone overlay's Randomize; a bound param's slider gives way to its expression field. Random levels that cannot act are not drawn (3.2). Originals in `_tmp/2026-10-31-nodisabled/`.
- Measured: every generator (120, three tabs each — 110 at a 10 s load, the 11 GL / 3D engines at 30 s) 0 disabled buttons or inputs in view; effect pages walked across Halftone, Scanline, CRT, Refraction, Dither and 12 random hops: 0; Color, Composition, Morph, Vector: 0 after Color's two fixes.
- Outside the rail and stage chrome, left as they are: menu items in the editor's menus and the media-library dialog's Use (KOL MediaLibrary) disable by the menu/dialog convention.
- **Acceptance:** a check opens every generator preset's first preset and every effect page, on all three tabs, and counts `button:disabled` / `[aria-disabled=true]` in the rail and the stage chrome: 0.

### 3.2 — One random row on effect pages too — ✅ built 2026-10-31
- **Cause:** plan 49 2.2 put Type · Category · Preset · Settings on the generator rail only; effect pages kept their own randomise block (`StageRolls`).
- Effect pages get the same row at the same levels (Type = another effect family, Category = another effect in the family, Preset = another preset of this effect, Settings = nudge), from the shared `presetStep.js`.
- Built: `presetStep.js` adds `randomEffectId` (Type = another nav family, Category = another effect in this one), `randomEffectPreset`, `canEffectLevel`; `StageRolls` takes the level row in place of Randomize all on labs' effect pages; a level the effect cannot take is not drawn (Scanline has no siblings → no Category; effects without a preset list → no Preset). Generators got the same rule (`canRandomLevel`).
- Measured with media loaded (kol-image/kol-alien/01.jpg): Settings · Preset · Category changed 7.7–64.6 % of the frame across Halftone dither, Bitmap, ASCII, Riso; Type hopped Lens → Threshold → Reflection → Kawase blur → Displacement; buttons 26 px, the generator row's height. One 0 %: Growing line's Settings while paused — a stateful effect that redraws only when playing.
- **Acceptance:** every effect page shows the four buttons in the same order and size as a generator page (same height ±1 px); each one changes the frame (≥ 1 % pixels) on 10 sampled effects.

### 3.3 — Every pointer interaction is declared and can be turned off — ✅ built 2026-10-31
- **Cause:** the pointer is gated globally (Settings › Interactions), but only some patches declare it in their own rail. The effect pages Distortion (warp follows the pointer) and Rutt-Etra (drag orbits), and the Math Field / Surface drag, act on the pointer with no toggle of their own.
- Each one gets a Mouse toggle (plus Drag or Orbit where that is the gesture) in the Animation tab's Interaction section. Off means the patch gets no pointer.
- Built: every path that hands a patch the pointer goes through one of two gates — the stage pointer (`transport.setStagePointer`, which the patch declares as Mouse) or the drag / orbit rig (`useCameraKeysDrag`, `setCameraDrag`). Distortion turned out already declared: its pointer acts only while its own Record cursor toggle is on. The rig gate now reads the patch's own `orbit` param (3.4).
- Measured: scan over 120 generators + 73 effects: 0 pointer-reading defs without a Mouse / Interaction toggle; 0 rig defs (95 generators + Rutt-Etra) without Orbit.
- **Acceptance:** a scan of every generator and effect def: a def that reads the pointer (`pointer`, `setPointer`, an orbit or drag rig) without a declared Interaction toggle fails, target 0; for each declared toggle, off → a scripted drag over the stage changes the frame < 0.5 %.

### 3.4 — Orbit per 3D patch, and every 3D patch counted — ✅ built 2026-10-31
- **Cause, first:** the rail's Orbit (C) is the global Grab setting shown in place; flipping it on one patch flips it everywhere.
- **Cause, second:** the 3D fold (`registry.js` `is3D`) knows only the three.js engines and defs with yaw/pitch camera keys. The 3D Penrose / Math sims (Aizawa, Thomas, Hopf, Clifford, Apollonian) project their own rotation, so they get no Orbit and their spin cannot be grabbed or stopped.
- Orbit becomes a per-patch param (`orbit`, default on) that the C key toggles for the selected patch; Settings › Grab stays the global master. The 3D sims declare `is3D` with their rotation as camera keys, so drag turns them and Orbit / 3D zoom show.
- Built (ruled inside the goal, the user being away: Grab stays the master): `registry.js` declares `orbit` (default on) on every def with a rig; `LayerRenderer` gates the rig on Grab AND the patch's `orbit`; the rail shows Orbit (C) on 3D patches and Drag (C) on 2D-rig patches, Rutt-Etra's on its Motion tab. The row reads on only while Grab is on and the patch has not opted out; switching it on also switches Grab on, so it never does nothing. C still flips Grab. The 3D sims Aizawa, Thomas, Hopf and Clifford now store their raw 3D points and apply a live view (`yaw` · `pitch` · distance) at draw, declared as `cameraKeys`; the Penrose host passes `cameraKeys` through and keeps those keys live, so turning the view never restarts the sim. Apollonian is a flat 2D gasket, not 3D, so it gets no Orbit. Originals in `_tmp/2026-10-31-orbit3d/`.
- Measured: Math Surface (Saddle), Orbit on: a 160 px drag changed 38.6 % of the frame; Orbit off: 0 %. Per-patch by construction (the param lives on the layer). Aizawa, Thomas, Hopf, Clifford each list Orbit (C) and 3D zoom; a 150 × 80 px drag moved the view from yaw 0 / pitch 0 to −90 / 22.7 (Aizawa, Hopf; read from the saved patch).
- **Acceptance:** Orbit off on patch A leaves patch B orbiting (scripted drag: A < 0.5 %, B ≥ 5 % change); every def that draws a 3D projection lists Orbit and 3D zoom (scan: 0 missing, Aizawa, Thomas, Hopf, Clifford, Apollonian included); a drag on each of those turns its view (≥ 5 % change).

## W4 — Rail sections: what is local, what is KOL

### 4.1 — The audit — ✅ done 2026-10-31
- Plan 49 9.2 audited single controls only. This audits the 28 rail sections and composites in `compose/inspectors/`, `params/`, `labs/` and `shell/`: what each draws by hand vs the KOL parts it is built from. File inputs (`<input type="file" hidden>` behind a KOL button) are not counted; they are the platform's.

| section | lines | hand-built inside | KOL it uses | KOL counterpart for the hand-built part | verdict |
|---|---|---|---|---|---|
| **ColorField** | 181 | the swatch trigger (raw `<button>`) and a whole colour popover assembled from SBSquare + HueStrip + Input | ColorSwatch, SBSquare, HueStrip, PopoverPanel | ColorPickerPopover — but it has no place for ColorField's palette-reference swatches and Theme / None (found while swapping, 4.2) | **ticket** (`ColorPickerPopoverExtras`) |
| **TextPanel** | 465 | Size-presets chevron trigger (raw `<button>`) | Button, Dropdown, PopoverPanel, Slider… | Button (iconOnly) | raw trigger: swap |
| **KineticPanel** | 705 | a popover trigger (raw `<button>`); a motion-path editor: SVG path + draggable points | ToggleCheckbox, PopoverPanel, Knob, Slider… | trigger → Button; path editor → none (CurveEditor is an easing curve, not a 2D path) | trigger: swap · path editor: **ticket** |
| **BindDot** | 115 | the modulation dot beside a param (raw `<button>`) | Tooltip, PopoverPanel, MenuDropdownItem | none: a per-row "bound" indicator + menu | **ticket** |
| **ProfileEditor** | 116 | bezier profile editor (SVG, nodes with in/out handles), ported from labs | LabeledControl | none: CurveEditor is a 1D easing curve, this is a 2D bezier with handles | **ticket** (same part as Kinetic's path editor) |
| **ModulationEditor** | 303 | expression plot over one loop (`<canvas>`) | Button, Input, Slider, SegmentedToggle… | none: a function plot | **ticket** |
| **SoftformsLayers** | 295 | a list of forms: rows with select, move up / down, duplicate, delete, plus the selected form's controls | Button, Dropdown, Slider, LabeledControl, Tooltip | **none that fits**: KOL `LayerStack` is the editor's document-layers panel (types, blend, groups), too heavy for a list of forms | **ticket**: a reorderable item list |
| **PenroseLayers** | 51 | — | LabeledControlSection, SettingsRow, Button, Slider | — | KOL-built; but a second, different "Layers" look beside SoftformsLayers |
| LayerInspector · CanvasInspector · EffectsPanel · PatternPanel · ParametersPanel · ParatypeTools · CameraPoseSlots · RulesEditor · LoopPicker · TreePicker · InputRows · AudioInputRow · RollScopesDialog · AutoControls · LabsParams · LabsSourcePicker · ModelSource · LiveFilterRows · KeyframeEditor · CurveEditor | 29–588 | nothing hand-built (hidden file inputs only) | KOL rows, sections and controls throughout | — | KOL-built: keep |

- Found while swapping (4.2): `params/TimelineDock.jsx` (461 lines) shares its name with KOL's `TimelineDock` — it is a deliberate local fork (plan 14 § 1: lifted to KOL 2026-09-27, brought back whole by the user's ruling that editor work does not round-trip the DS); stays local.
- **Totals:** 28 sections; 20 built from KOL alone; 2 hand-built pieces that duplicate a shipped KOL part (TextPanel's and KineticPanel's raw triggers); 6 hand-built pieces with no KOL part (ColorField's popover added once the swap showed KOL's lacks its swatches) (2D bezier / path editor ×2, BindDot, the expression plot, a reorderable item list); 2 "Layers" sections that look and work differently.
- Layout: KineticPanel (22) and TextPanel (18) carry the most hand-built flex/grid blocks around KOL rows; that is arrangement, not controls, and stays local.

### 4.2 — Swap the duplicates — ✅ built 2026-10-31
- ColorField's popover → ColorPickerPopover; the three raw triggers → KOL Button. Old code retires to `_tmp/`.
- Built: TextPanel's Size-presets chevron and KineticPanel's OpenType trigger are KOL Buttons (the old markup in `_tmp/2026-10-31-raw-triggers/`). ColorField's popover could not swap — KOL's has no place for its palette swatches and Theme / None — so it is ticketed (4.4) instead.
- Measured: raw `<button>` left in `compose/inspectors/` + `params/`: 3 — ColorField and BindDot (ticketed) and TimelineDock's step names (the deliberate local fork).
- **Acceptance:** `grep` finds 0 raw `<button>` in `compose/inspectors/` and `params/` apart from the ticketed BindDot; ColorField opens KOL's popover (Playwright: pick a colour, the layer's colour changes).

### 4.3 — One Layers look, on KOL — ✅ built 2026-10-31
- Ruled 2026-10-31, the user: *"I would like things to look the same, so if we can do that and swap for DS then Im good."*
- SoftformsLayers and PenroseLayers keep their jobs but share one row anatomy: number · swatch · eye · name · actions (Penrose: opacity; Soft forms: move, duplicate, delete), selected row lit. Both render through the KOL **ItemList** ticketed in 4.4 and swap to it the day it ships; the local row is a stopgap until then.
- Built: `compose/inspectors/LayerRow.jsx` (number · swatch · eye · name · inline control · actions; a hidden action keeps its slot), used by SoftformsLayers and PenroseLayers; Soft forms' Add / Duplicate / Delete / Move hide when they cannot act.
- Measured: Soft forms (Trinity) and Penrose (Flow field) rows: height 32 px both, number column at x 1045 both, action buttons 26 px both.
- **Acceptance:** on Soft forms and on a Penrose sim the Layers rows measure the same (row height, swatch size, eye position ±1 px; Playwright); after ItemList ships, both import it and 0 local row markup remains (the old code in `_tmp/`).

### 4.4 — Ticket the gaps to kol-ds-ui — ✅ built 2026-10-31
- Four tickets, filed to `kol-ds-ui/lobby/inbox/`: **BezierPathEditor** (2D nodes with handles: ProfileEditor + Kinetic's path), **ParamBindDot** (bound indicator + menu on a row), **FunctionPlot** (y = f(u) over one loop, a cursor), **ItemList** (reorderable rows: number · swatch · eye · name · actions, select, duplicate, delete; both Layers sections, 4.3).
- Filed: BezierPathEditor, ParamBindDot, FunctionPlot, ItemList, and ColorPickerPopoverExtras (the fifth, from 4.2) — kol-ds-ui `lobby/inbox/`, both ledgers, receipts in `lobby/outbox/`.
- **Acceptance:** 4 tickets in kol-ds-ui's inbox and both ledgers; each names its fxr call sites.
