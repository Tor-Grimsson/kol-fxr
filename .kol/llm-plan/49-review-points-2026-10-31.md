# Plan — Review points, 2026-10-31 (evening)

**Raised:** 2026-10-31, in session, one point at a time (*"just read and add to /plan-shape and wait for next point"*). Points verbatim under each phase.
**Status:** built — 2026-10-31, every phase ✅. Open: Stam fluid needs a solver rewrite (5.4); Droste mid-height seam (5.4); Penrose sims sit outside 10.2's still check.
**Shape:** W › phase › list.
**Laws carried:** no local KOL shims — a gap in a KOL component goes by ticket to kol-ds-ui, filed so it is not buried; retired code to `_tmp/`; **an audit adds controls where a tab is thin, it never only takes them away** (user 2026-10-31: *"when you had your audit you sholud not have taken control, ,you sholud have made sure there weere MORE controls then less"*); pixelation is a choice, never a default (*"I liike to downsample but thats because I choose it"*); **nothing starts on its own — it plays on Play** (*"NEVER AUTO START, just start on play"*); **a control that does nothing is not shown** (*"DONT show controls that dont work"*).
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his own words; motion on a recording.

## W1 — The rail

### 1.1 — A dragged rail stays where it is let go — ✅ built 2026-10-31 (kol-component 0.327.0)
- His words (screenshots: the app rail dragged wide, then snapped): *"why cant I set the siderail custom? it just snaps to collapsed and expanded? if user clicks on the rail then it should snap between the two. but you should be able to drag it however you want, it will just get reset on rail click"*
- The cause, one place: kol-component's `NavRail` → `useRailDrag` (`organisms/NavRail.jsx`). Release ends in `snapTo(w > (CLOSED + open) / 2 ? open : CLOSED)` — every drag snaps to the nearer state — and the move clamps the width to `[CLOSED, open]`, so it cannot be dragged wider than the open width either. A click (no travel) already toggles closed ⇄ open, which is the half he wants kept.
- The change: release keeps the dragged width (no snap); the rows' open/closed state follows the width (open past a threshold, so labels never show in a strip too narrow for them); a click on the rail still snaps between collapsed and expanded, and that resets a custom width. The drag's upper bound: a max width rather than the open width.
- Route: a ticket to kol-ds-ui against `NavRail` (fxr owns no rail code — it renders `AppStudio`'s). **Filed 2026-10-31 as `RailDragHoldsWidth`**; fxr's side is the bump and the walk when it returns.
- Measured on 0.327.0, `/library` 1400×900: drag → 301.5, → 560, → 121.5 (held, no snap); click → 48, click → 380; labels shown at 380 and 300, hidden at 120. fxr places nothing `position: fixed` in the rail slot.
- **Acceptance:** dragging the rail's grab from 380 to 300 and letting go leaves the rail 300 ±2 wide one second later (no snap); dragging to 560 leaves it 560 (past today's 380 cap, under the max); a click on the grab from 300 snaps to collapsed (48), a second click to expanded (380); a drag to under the label threshold shows icons only; on a recording, the release has no jump.

## W2 — Randomise

### 2.1 — One Color roll, not two — ✅ built 2026-10-31
- His words (screenshot: Color · Color · Motion Frame · Motion Form): *"this is not normalised amount of random buttons! not by a long shot"* · *"color color? thats weird. one does nothing..."*
- The cause: `params/rolls.jsx` `deriveScopes` makes one scope for every colour param (labelled Color) and one per section — Penrose's opacity sliders sit in a section also named Color, so two cells read Color and the second moves only opacities.
- **Acceptance:** no generator shows two roll cells with the same label (a script over every preset's scopes: 0 duplicates); Penrose shows one Color cell and it changes ≥ 1 colour param.

### 2.2 — Randomise at four levels: Type · Category · Preset · Settings — ✅ built 2026-10-31
- His words: *"randomise: Type/CAtegory/Preset/Settings … randomise type is the wides random, category level below that, randomise preset is just like swapping a bit, settings is gonna be same but slightly differnet"*
- Built (`labs/presetStep.js` `randomPresetPatch` · `nudgeSettings`, `LoopFields.jsx`): one row Type · Category · Preset · Settings + the scope dialog + reset; Settings nudges ±15% of span what Randomize all rolled. Measured from Scanline › Drift: Preset 50/50 same category, new preset; Category 50/50 same type, new category; Type 47/50 a new type label (the 3 others changed group under one Type — Pattern holds two groups); Settings 30/30 moved ≥ 1 param on the same preset, 0 out of span (30 presses, not 50 — each needed the draft autosave to land); nothing started playing.
- Four buttons replace Randomize preset / Randomize all: Type (any generator), Category (same type), Preset (same category), Settings (same preset, values nudged inside their spans); the scope cells stay below.
- **Acceptance:** 50 presses of each from one start: Type changes `loopGroup` on ≥ 40; Category keeps the type and changes category on ≥ 40; Preset keeps type and category and changes preset on ≥ 40; Settings keeps all three and moves ≥ 1 param every press, each within its span.

### 2.3 — Previous / next, by button and key — ✅ built 2026-10-31
- His words: *"instead of just randomise pattern , to have arrow left and right buttons for next and previosu pattern , it could also be mapped to shortcuts? f.e. hjkl"*
- ‹ › beside the Preset row; keys h/l (and ←/→) previous/next preset, k/j previous/next category, wrapping; none fire while typing; collisions with existing keys checked first.
- **Acceptance:** from preset n, l lands n+1 and h lands n back; j lands the next category's first preset; at the last preset l wraps to the first; typing "hjkl" in a text field changes nothing; the shortcuts sheet lists them.

## W3 — Canvas and input

### 3.1 — The dotted accent frame goes quiet — ✅ built 2026-10-31
- His words: *"REMOVE yellow accent focus!! make white and wayyy less attention demanding!"*
- The dotted frame around the Penrose stage is drawn in the palette's accent; it draws in the foreground at low alpha instead.
- **Acceptance:** sampled frame pixels on 5 Penrose presets match the foreground colour (ΔE < 10 from fg), alpha ≤ 0.25; none match the accent.

### 3.2 — Grab, interactions and zoom lock as toggles with keys — ✅ built 2026-10-31
- His words: *"if C toggles grab, then make a grab toggle in settings that turns of and on with C"* · *"Mouse interacts with canvas even if C is on or off, we should also make a interactions OFF/on toggle"* · *"WE NEED TO LOCK CANVAS ZOOM on toggle and keycommand"*
- Settings gains Grab (mirrors C both ways), Interactions (off: the pointer reaches no generator) and Zoom lock (and its key, checked for collisions).
- His follow-up: *"Mouse should declare its interactive with toggle"* — every patch the pointer drives shows a Mouse toggle, on by default where it is on; a patch the pointer does not touch shows none.
- Built: Settings › Canvas — Grab (C) · Interactions · Zoom lock (Z) (`appSettings` grab · interactions · zoomLock); C writes Grab and the Labs tool follows it; Interactions off nulls the stage pointer at its one setter (`transport.setStagePointer`); Zoom lock gates wheel, ± / digit keys and pinch. Mouse toggles: Drift, Gradients, Soft forms (Animation tab), every Penrose sim (host), Growing line, Game of Life.
- Measured: 62 pointer-driven defs all carry Mouse, 0 others do; C → grab true, C → false; Interactions off: a drag over a settled Growing orb leaves `hot` 0 (on: 5725); Zoom lock: wheel + `=` leave the frame 544 → 544 (unlocked → 577); no errors.
- **Acceptance:** every def the pointer drives has a Mouse toggle and every def it does not has none (script + one drag test each on 10 defs); C flips the Grab toggle and the toggle flips C's state; Interactions off → a drag over Growing line moves no node (`hot` stays 0); Zoom lock on → wheel and pinch leave the zoom unchanged.

### 3.3 — 3D orbit and 3D zoom where the patch is 3D — ✅ built 2026-10-31
- His words: *"if you did , then you could have applied a 3d pan toggle for the mouse"* · *"expose 3d zoom"*
- Every patch marked 3D in its description (W6) shows Orbit (a toggle) and a 3D Zoom control (the camera distance — separate from the canvas zoom 3.2 locks); 2D ones show neither.
- Built: `registry.js` marks `is3D` (a yaw+pitch camera, or a 3D engine: scene · softforms3d · forms · environment · ribbon) and makes its camera distance — or field of view where there is none — the "3D zoom" control (never rolled); `LoopFields` shows one 3D section on the Animation tab: Orbit (C) (= Settings' Grab) + 3D zoom. 3D defs: Math curves · Math surface · Soft forms 3D · 3D Scene · Forms · Environment · Ribbon. The DOM check came before W6's descriptions, so 3D is read from the camera/engine, and 6.1's `dimension` will be written from the same rule.
- Measured: all 7 show Orbit + 3D zoom, sampled 2D defs show neither (by construction none do); Math surface 3D zoom 3 → 6 shrinks the surface (screenshots); Orbit On sets Grab and a drag rotates the frame; one 3D heading; no errors.
- **Acceptance:** Orbit and 3D Zoom appear on every 3D def and on no 2D def (script over the registry); on 3D Scene, Orbit on + drag rotates the camera, and 3D Zoom 2× halves the subject's on-screen size while the canvas zoom stays put.

### 3.4 — Undo / redo in Labs — ✅ built 2026-10-31
- His words: *"we need maybe BACK or undo redo, because one wrong click and your entire patch is gone"*
- Labs gets the editor's history (`useHistory`, kol-component): ⌘Z / ⇧⌘Z and back / forward buttons; a pick, a roll or an edit is one step.
- Built: Labs uses the compose history the editor already keeps — ⌘Z / ⇧⌘Z (`LabsView`) and ← → buttons beside the rail title (`LabsParams` `HistoryButtons`). Found on the walk: undo walked below what was opened (the deep-link seed and the frame's fit are tracked writes) — `clearHistory` (compose state) runs once Labs' boot settles, so the opened patch is the floor.
- Measured: roll → pick → ⌘Z = the roll, ⌘Z = the opened patch, ⌘Z again stays there, ⇧⌘Z ×2 back to the pick, the Undo button matches ⌘Z; no errors.
- **Acceptance:** pick preset A, roll, pick preset B → ⌘Z ×2 restores A's exact params; ⇧⌘Z ×2 returns to B; no entry is doubled (StrictMode).

## W4 — Colour

### 4.1 — Palette acts on pick, and only where it can — ✅ built 2026-10-31
- His words (Hyperbolic Droste): *"pallette does nothing here. is palette mapped to generators?"*
- The cause: the dropdown only stores the relation (`LoopFields.jsx` — nothing recolours until Roll), and generators with no colour params (Droste colours itself) have nothing for Roll to reach.
- Picking a relation rolls at once; the row hides where the def has no colour params.
- Built (`LoopFields.jsx`): the relation pick rolls in the same write; the row shows only where the def has colour params. Measured: Scanline › Drift, Analogous → Triadic changed bg and fg in one press.
- Found: Hyperbolic Droste *does* carry colour params (Penrose's five roles) and ignores them — that is 4.3's and 10.2's case (list only what a sim draws; hide controls that change nothing), not this one's.
- **Acceptance:** picking a relation changes ≥ 1 colour param in the same press; the Palette row is absent on every def without colour params (script) and present on every def with them.

### 4.2 — Choose what the palette rolls; hop to Color and back — ✅ built 2026-10-31
- His words: *"Pelette here needs toggle to set what you wanna roll. AND why cat we hop over to the color tool from labs? and hop back?"*
- Per-role toggles (background, foreground, accent …) choose what Roll touches; *Edit in Color* opens the Color tool with this palette, and *Back to Labs* returns with the edited one applied.
- Built (`LoopFields.jsx`): a Rolls row of one toggle per colour param (`_rollKeep` holds what a roll leaves alone); Edit in Color Modes beside Roll opens the Color tool over Labs — it edits this generator live and closing it is the way back (it was reachable only from the rail's Color row).
- Measured on Hat monotile: Background off → 20 rolls, background unchanged 20/20, the others moved; Edit in Color Modes opens the tool, its Roll recolours the layer.
- **Acceptance:** with background off, 20 rolls never change the background; Edit in Color → change a swatch → Back to Labs → that swatch is on the layer.

### 4.3 — LAYERS: what a sim draws, each with show/hide and opacity — ✅ built 2026-10-31
- His words: *"we really need to be able to drill into layers? we could have it in Style after the sliders a section called LAYERS, and just a number + show/hide and a opacity slider?"* · (Aizawa, the role colours) *"adding color here does nothing. and why do you add color here? for what purpose?"* · (Soft forms › Stack › Trinity) *"found layers section … this is neat, could be better tho"* · (Gradients' Color) *"first color that actually does something in Gradient"*
- The cause: Penrose lists five role colours and four opacities for every sim, though most draw two or three — the rest do nothing.
- LAYERS after the sliders: one row per role the sim actually draws — number, colour, show/hide, opacity — built on Soft forms' Forms row; roles a sim never draws are not listed. Gradients' Color section is the reference for what a colour section that works looks like.
- Built: `penrose/roles.js` records the roles a sim actually draws (pc · roleRGB · rampRGB · the tint mapper report while the host draws); `PenroseLayers.jsx` lists those after the Style sliders — number, swatch, show/hide (eye), opacity — and the Color section's four opacity sliders are LAYERS' now. Hidden = opacity 0, and opacity 0 swaps the role for the background in the palette sync (ramp fields ignore opacity) and in the tint mapper (sims that cached their colours at init).
- Measured (role colour pixels, before → after Hide, 2.5 s of play): Packing fg 155→0 · accent 152→0 · dim 111→0 · warm gone (41 px left at full res are accent rings, not warm) · Aizawa lists Foreground · Accent · Warm (no Dim), accent 256→0 · warm 671→0 · FitzHugh–Nagumo dim 1737→0 · warm 11599→456 · Boids accent 340→0 · warm 964→0 · Diffgrow accent 196→0 · warm 145→0. First pass left ramp and cached-colour sims unhidden — fixed by the palette swap.
- **Acceptance:** for 10 Penrose sims, every listed layer, hidden, changes ≥ 1% of the frame's pixels (none listed that change nothing); opacity 0 ≡ hidden; Aizawa lists only the roles it draws.

## W5 — Penrose

### 5.1 — Penrose's size is not the point — answered
- His words: *"penrose half are 4-5 presets and half are around 10 preset. main point is that alot of penrose is MATH and low res needs workres."*
- No count target. The work is 5.2 (the Math ones move out) and 5.3 (the low-res ones get resolution).

### 5.2 — Math moves to Math — ✅ built 2026-10-31
- His words: *"Clifford torus is math not penrose"* · *"AZIWA TRAIL is MATH … so is Thomas Cycle"* · *"MAURER ROSE is MATH · BARABASI ALBERT is MATH · appolonian gasket is MATH · Alpha shape sweep is MATH · HOPF FIBRATION is MATH"*
- Clifford torus, Aizawa trail, Thomas cyclic, Maurer rose, Barabási–Albert, Apollonian gasket, Alpha-shape sweep, Hopf fibration move to Generative › Math (ids kept, so saved files open).
- **Acceptance:** those 8 are listed under Math and not under Penrose; a saved file using one opens on it.

### 5.3 — The sims render at the output's resolution — ✅ built 2026-10-31 (with stated exceptions)
- His words: *"so many patches are so pixelated. why? … I liike to downsample but thats because I choose it. not because i start with low resolution assets"* · the list: Lenia, SmoothLife, BTW sandpile, Forest fire, μNCA, DyNCA; FitzHugh–Nagumo, Seashell growth front, Layered's triggered growth; Chladni membrane, Kuramoto–Sivashinsky, Chemotaxis physarum, Competitive physarum; Vicsek bands, MIPS, Flame fractal, Buddhabrot; Eden growth; Hyperbolic Droste spiral; Apollonian diagram; P3 rhombs.
- The cause: these sims compute on a coarse grid and scale it up — `Resolution` (960) sizes the canvas, not the grid.
- The grid follows the output (performance permitting, the grid steps down only to hold frame rate); a *Downsample* control makes pixelation a choice.
- Built: the cause was each sim's own grid (`res` 80–180) or fixed internal size, not the canvas. Raised as far as 30 fps holds on the MBP, measured each: Lenia 128→176 (33 fps) · SmoothLife 128→160 (29) · μNCA / DyNCA 112→192 (60) · FitzHugh–Nagumo 160→360 (60) · Seashell 180→360 (60) · Chladni 140→300 (60) · Kuramoto–Sivashinsky 96→256 (33) · BTW / Forest fire 150/160→360 (60) · Eden lattice 120→300 (59) · Chemotaxis / Competitive physarum grid 160→400 (42 / 60) · Flame 160→480 (60) · Buddhabrot 150→400 (36) · Hyperbolic Droste buffer 300→480 (29) · Apollonius diagram cell /256→/640 (60) · Stam fluids 80→112 (30). Continuous fields (Lenia, SmoothLife, the NCAs, Stam, Reaction-diffusion) scale up smoothly instead of nearest-neighbour; discrete CAs keep crisp cells. Penrose's Generate tab has **Downsample** (1–12): pixelation by choice — at 6 the median cell run is 6 px.
- Measured at 1080 wide: median same-colour run along a row is 1–2 px on every changed sim (was ~7–9 px blocks); fps above.
- Not changed: Vicsek bands, MIPS and Layered's triggered growth have no low-resolution grid of their own (particles drawn at full size) — what reads as low-res there is not found yet; P3 rhombs is 5.4's. Found: Stam fluids draws a blank frame (→ 5.4); Droste shows a horizontal seam at mid-height, present in his screenshot too (→ 5.4).
- **Acceptance:** for each listed sim at 1080², the smallest drawn cell is ≤ 2 output px (measured edge run-lengths), at ≥ 30 fps p50 on the MBP; Downsample 4 gives cells ≥ 4 px.

### 5.4 — Broken ones work; P3 is remade or retired — ✅ built 2026-10-31 (Stam and the Droste seam open)
- His words: *"these two are broken, need fixing"* (Flow field, Reaction-diffusion (Gray-Scott)) · *"Penrose P3 RHOMBS is low res and just ugly. makes no sense"* · *"in general this is lacking"*
- Flow field and Gray-Scott fixed at the cause; P3 rebuilt as a real P3 tiling at full resolution, or retired to `_tmp/` if it cannot be made good; every Penrose sim watched on a recording.
- Gray-Scott (cause: a 4-neighbour Laplacian with weights −4…+1 at dA 1, dt 1 — four times past explicit Euler's limit; the field went NaN, NaN drew as the ramp's darkest stop): Sims' 3×3 stencil (0.2 / 0.05 / −1). Now coral fills the frame, changing every frame (38→7% bright over 30 s as the pattern thins), no errors.
- Flow field (cause: energy uncapped once the population hit its cap — heads are energy-sized, they swelled into blobs that flooded the frame): energy caps at 1; organisms blocked at the wall step inward; the colony tops up under 12; stronger forage turn + wander. Now a moving foraging colony that grazes trails, no flood — it still funnels into one stream over time (tuning, not broken).
- P3 rhombs (cause: the deflation subdivided without growing — a ~113 px star in an empty frame — and its rhomb split made overlapping slivers, not a tiling): rebuilt as the standard Robinson-triangle P3 (a wheel of 10 half-rhombs, golden-ratio subdivision), the seed reaching the frame's corners, depth derived from **Tile size** (the old Depth knob retired — it was the tile size in disguise); a radial reveal. Measured 98% of the frame covered, 61 fps, real thick/thin rhombs with the five-fold stars.
- **Open:** Stam stable fluids drew blank (velocity ran to 1e38 → NaN → alpha 0); clamped finite and given plumes it now draws, but the solver is still unstable (dye sits; one plume checkerboards) — needs a proper solver rewrite. Hyperbolic Droste's horizontal seam at mid-height not touched.
- **Acceptance:** Flow field and Gray-Scott draw a changing, non-blank frame for 30 s with no error; P3 shows thick/thin rhombs with edges ≤ 2 px soft at 1080²; a contact sheet of all Penrose sims is watched, and each one that stalls or reads as noise is listed and fixed.

## W6 — Every patch says what it is

### 6.1 — Descriptions — ✅ built 2026-10-31
- `src/loops/about.js`: kind · basis · engine · 2D/3D for every def; engine and dimension derived (never typed), Penrose sims use their own source + summary. `AboutLine` under Preset (generators) and under the effect picker. Measured: 118/118 generators, 73/73 effects carry a basis.
- His words: *"EVERY SINGLE 'file patch generation effect whatever' in FXR needs a description.. like is it genearative? what kind of math, is it based on something? (like game of life) what tools does it use three.js or shader? is it 3d object or 2d"*
- Each generator and effect def carries `about`: kind (generative · effect), basis (the maths or source, e.g. Gray-Scott, Game of Life), engine (canvas 2D · shader · three.js), dimension (2D · 3D); shown under the Preset row.
- **Acceptance:** a script finds `about` with all four fields on every def in the registry and every filter (0 missing); the rail shows it for the selected preset.

## W7 — Drift

### 7.1 — Names, the mouse toggle, the first preset, half speed — ✅ built 2026-10-31
- His words: *"Drift needs to fix naming categgory should not be lowercase. and if they are bound to mouse by default, it should be toggled!! its not"* · *"you can not make AIR first preset when you enter DRIFT, you can start with anything more contrasty drift/air/storm for example. or CUMULUS"* · *"every drift should be 50% shower by default"*
- Category labels capitalised; the mouse toggle reads on when the pointer drives the preset; Drift opens on Storm; every Drift preset's default speed halves.
- **Acceptance:** no Drift category label starts lowercase; on every Drift preset the mouse toggle state equals whether the pointer moves it; entering Drift lands Storm; each preset's speed = ½ its value before.

### 7.2 — A Generate tab that generates — ✅ built 2026-10-31
- Cause: 61 defs left every param untabbed, so Generate held only the pickers. `registry.js` fold: on any def with < 3 Generate params, what makes the picture moves to Generate (form sections win; colour, glow, grain, material, light and camera stay in Style). The field camera's Zoom and Angle, read by the shader but never listed, join Generate.
- Measured: 116/118 defs hold ≥ 3 Generate params; Soft forms and Soft forms 3D hold 1–2 plus their per-form Layers editor. Drift Storm with the transport paused: Scale 57%, Warp 55%, Coverage 66% of the frame changed (0% with no change). Dead-control hiding is 10.2.
- His words (Drift's Generate: pickers, Theme/Invert/Palette, randomise): *"THIS IS NOT enough for generate tab. there is literally NOTHING here … HOW is any of this GENERATE??? hint its not"* · *"why doesnt disconnected controls auto fold or hide?"*
- Drift's field and form controls (what makes the picture) move into Generate; a control the current preset does not read is hidden; the rule is checked on every def: Generate holds ≥ 3 controls that change the picture.
- **Acceptance:** every def's Generate tab has ≥ 3 params besides the pickers and colour row (script, 0 under); on Drift, each Generate control changes ≥ 1% of the frame; a control with no effect on the frame is not shown.

## W8 — Gradients

### 8.1 — Tunnel first, ten of them, at half speed — ✅ built 2026-10-31
- His words: *"Gradient/TUnnel should be first, we need more presets of tunnel, I think 10? maybe? and they shoudl all be 200% [half faster.]"*
- Tunnel is the first category; 10 presets (Tunnel, Halo, Horizon and seven more); each at 200% of its duration.
- **Acceptance:** Gradients' first category is Tunnel; it lists 10 presets; each runs at twice its previous loop length.
- Built: Tunnel · Halo · Horizon · Hex tunnel · Star tunnel · Square tunnel · Iris · Triangle · Star halo · Magma horizon, all `speed: 0.5`. Measured: categories Tunnel · Field · Pole · Volume; entering Gradients lands Tunnel › Tunnel; all 10 render distinct (contact sheet).

### 8.2 — Volume › Blob starts wide and calm — ✅ built 2026-10-31
- His words: *"Gradient/volumne/blob is too zoommed in and too much mouse interactive changing color, we want it to start around here"* (screenshot: smaller blobs, more ground).
- Blob's defaults: size down so the forms sit inside the frame with ground around them; the pointer's colour shift cut to a quarter.
- **Acceptance:** at start, ≥ 30% of the frame is backdrop; a full-width pointer sweep shifts the mean hue ≤ 25% of what it does today.
- Built: Blob opens on his frame's own values (Count 5 · Size 0.40 · Spread 0.75); the pointer's hue swing is a quarter (×0.125 for ×0.5, IridescentEngine.setPointer). Measured backdrop 20% — **the 30% line was the agent's number, not his; his frame wins** (memory: his edited frame is the spec).

## W9 — Rail consistency through KOL

### 9.1 — One label column on every tab — ✅ built 2026-10-31
- Cause: the column is fit to the longest label in the panel, and only the open tab's rows are in the DOM — each tab fit its own, so the column jumped 7–42 px on a switch. Labs' Surface now carries every tab's labels as unseen ghosts (the Dropdown's own ghost trick) and a `data-label-scope`; the panel keeps its widest while the same generator / effect is open.
- Measured: 10 presets × Generate → Style → Animation → Generate, each preset's controls start on ONE x (1116 · 1161 · 1130 · 1123 · 1116 · 1137 · 1144 · 1130 · 1144 · 1161).
- His words: *"when I hop between generate and Style the UI Labelledcontrol hop around buggy, like they are set at differrnt width... look how wide dropdown relative to sliders"*
- The cause: dropdown rows and slider rows lay out their label column at different widths; one width for every row.
- **Acceptance:** switching Generate ⇄ Style ⇄ Animation on 10 presets, every row's control starts at the same x (±1 px).

### 9.2 — Audit: local controls vs KOL, and a shortlist to ship — ✅ built 2026-10-31
- 22 local control components, each traced to what it renders:

| local | file | KOL under it | verdict |
|---|---|---|---|
| NumberField · AxisField · SizeField · MetricInput · SeedField · NumInput | inspectors/NumberField, LayerInspector, CanvasInspector, TextPanel, params/rolls, pattern/RuleRow | Input (property variant) · Stepper | wrapper — keep |
| RangeField · SliderRow · OpacityField | params/AutoControls, color/ColourPanel | Slider · Stepper | wrapper — keep |
| ColorField · ColorPicker (pattern) | inspectors/ColorField, modes/pattern/ColorPicker | ColorPickerPopover · ColorSwatch | wrapper — keep |
| ChipsRow · LoopChips | labs/LabsParams, mobile/MobileOverlay | SegmentedToggle · Tag | wrapper — keep |
| MorphBlendKnob · KineticKnob | inspectors/KineticPanel | Knob | wrapper — keep |
| ExplorePad | inspectors/ParatypeTools | XYPad | wrapper — keep |
| CurveEditor · KeyframeEditor | inspectors/* | CurveEditor · KeyframeEditor | wrapper — keep |
| StepPicker · ProfileEditor | morph/StepPicker, inspectors/ProfileEditor | (domain editors) | fxr's own — keep |
| **CheckRow** | shell/panels/BatchExportModal | none used — hand-built box + check icon | **replaced** by KOL ToggleCheckbox; the old one is in `_tmp/2026-10-31-checkrow/` |
| **AnchorPicker** | inspectors/LayerInspector | none — nine hand-built radio dots; AlignmentGrid fires actions, holds no value | **replaced** by KOL OriginPicker (kol-component 0.329.0); the old one is in `_tmp/2026-10-31-anchorpicker/` |

- Measured: 0 hand-built duplicates of a shipped KOL control left; 1 gap ticketed (both ledgers).
- His words: *"this kind of stuff would be ironed out if we washed it through KOL DS. WE have to audit how many local control components there are here vs. DS. then we have a shortlist to ship."*
- Count every control component fxr defines locally against KOL's; each local one: replace with KOL's, or ticket it to kol-ds-ui; the shortlist is filed, not left in chat.
- **Acceptance:** a table of every local control with its KOL counterpart (or none) in this plan; each "none" has a kol-ds-ui ticket filed; the replacements land with 0 local duplicates left.

## W10 — Play is the start, shown controls work, Game of Life

### 10.1 — Nothing auto-starts — ✅ built 2026-10-31
- His words: *"NEVER AUTO START, just start on play"*
- Every way into a patch lands still and waits for Play: a Labs pick (today a pick on touch starts the clock — `LabsNav` dispatch), a Morph preset (`loadMorphPreset` and a morph file opened by URL both call `transport.play()` — plan 47 added the first), a randomise, the Randomiser.
- **Acceptance:** after each of — a Labs pick (desk and 390 touch), a Morph preset from the rail and from Home's dock, a `?open=` morph file, each randomise level, a Randomiser roll — `transport.isPlaying()` is false and two frames 1 s apart are identical; Play then starts it.

### 10.2 — A control that does nothing is not shown — ✅ built 2026-10-31
- The check: every visible Generate / Style control of every deterministic preset (261 presets, 2230 controls) drawn offscreen at 320×400, moved to 0 · 13 · 37 · 61 · 83 · 100 % of its range (or every other option), frame compared (< 0.5 % pixels = dead).
- Hidden (each now shows only when it draws): fill **Angle** unless the fill is linear / conic / polar, **Polar stops** unless polar, the whole fill set while **Fill shape** / **Fill rings** is off, **Fill opacity** (shape and ring) likewise — all in `lib/fill.js` + the three ring loops; field **Angle** on the radial fields (Rings, Moiré, Halftone); Halftone matrix **Rotate** on its radial / waves fields; Pattern **Offset Y** and **Wave frequency** while Wave depth is 0; Pattern **Stretch** on square tiles.
- Left shown, with the reason: Pattern **Cols / Rows** set the rule repeat (act when a preset's rules vary by cell); the grid overlay and Lissajous **Dot**, graph dot and loop opacity are real marks under 0.5 % of a thumbnail; Saddle's **Range** — x² − y² is self-similar, zoom draws the same picture; motion controls (Travel, Stagger, Sway, Pan direction, Pulse, Fade…) act over time, not on a still.
- Out of the still check's reach: the Penrose sims (random frame to frame), the GL engines, and the stateful ones (Scanline's async source, Threads, Growing line, Orbits, Curves, Glyph, Game of Life) — their controls were walked by hand in 3.x / 5.x / 7.2.
- His words: *"DONT show controls that dont work"* (and 7.2's *"why doesnt disconnected controls auto fold or hide?"*, 4.3's colours that do nothing)
- A check over every def and preset: for each visible control, move it end to end and compare the frame; one that changes nothing is hidden for that def (or the param fixed if it should work). 4.1, 4.3 and 7.2 are cases of this.
- **Acceptance:** the check reports 0 visible controls that leave the frame unchanged (< 0.5% pixels) across all presets; the list of what it hid or fixed is written into this plan.

### 10.3 — Game of Life, from kol-monitor — ✅ built 2026-10-31
- His words: *"INTRODUCE Game of life, its in kol-monitor, just grab that code file and settings?"*
- Source: `kol-monitor/src/modules/generators/LifeModule.jsx` — Conway's automaton with 9 rule sets (Seeds · Diamoeba · Day & Night · Maze · Life B3/S23 · HighLife · Morley · Anneal · Replicator) and the long-lived seeds (R-pentomino …). The simulation and its settings come over as a generator; the rack module's jacks and knob UI do not.
- Placed under Generative › Penrose › Reaction & Life beside Lenia and SmoothLife; settings: Rule, Seed (methuselah · random density), Cell size, Speed, Wrap; Mouse draws live cells (3.2's toggle); cells crisp at any size (5.3); still until Play (10.1); `about` filled (6.1).
- Built: `src/loops/life/gameOfLife.js` (rules, seeds and step from kol-monitor's LifeModule; lookup-table step), first in Penrose › Reaction & Life; settings Rule · Seed (Auto per rule · Methuselahs · Random · Clusters) · Density · Cell size · Variation · Wrap · Gap · colours · Speed · Mouse; check `node src/loops/life/life.check.mjs`.
- Found on the walk: from the sparse Life seeds Diamoeba and Anneal blanked and Day & Night and Morley froze — **Auto** seeds per rule (kol-monitor's own reseed split Life from the rest).
- Measured: blinker period 2 ✓ · glider +1,+1 in 4 ✓ · R-pentomino 116 at 1103 (800² grid; a 400² grid loses the gliders at the edge → 111) ✓; all 9 rules alive and changing over 300 generations ✓; opens still, moves on Play, a drag draws cells, crisp squares ✓; no errors.
- **Acceptance:** classic Life matches the known patterns — a blinker repeats every 2 generations, a glider moves one cell diagonally every 4, and an R-pentomino on a grid large enough not to wrap settles at 116 cells by generation 1103; each of the 9 rules runs 30 s without blanking or error; cells render as sharp squares (edges ≤ 1 px soft) at 1080²; a mouse drag adds live cells; nothing moves before Play.

## TALK
- None.

## PARKED
- Nothing.
