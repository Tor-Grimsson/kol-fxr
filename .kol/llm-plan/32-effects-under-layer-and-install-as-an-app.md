# Plan — Effects under Layer, and FXR installed as an app

**Status:** BUILT 2026-10-13 — §§ 1, 2, 2b, 3 built and walked on `vite preview` (dark + light, 0 console errors; evidence `_tmp/2026-10-13-plan-32-walk/`: the window, every effect on one rectangle, the Live Filters menu, the bar's menus, Mask + undo, Empty layer, an SVG export carrying the filter). **Built differently from § 2's first draft, deliberately:** layer effects are NOT stages in `layer.filters` (the eight-stage canvas → pixi → GL chain) — they are `layer.effects` rendered as ONE SVG `<filter>` (`compose/layerEffects.js`), worn by every layer type through CSS `filter` and written verbatim into the SVG/PNG export; Affinity keeps the two systems apart too. The window's selected row wears the DS selection tone (`oq-16`), not Affinity's blue — the KOL has no blue accent. The FX button is the letters `FX` until kol-icons cuts an `fx` glyph. Not built, as the plan said: Profile curves, the Offset Tool, extra 3D lights, below-the-fill blend modes (SVG filters have no backdrop), Outline's gradient fill, a draggable window, true adjustment *layers*, pixel layers. Journal: `.kol/llm-context/playbook/2026-10-13-plan-32-effects-under-layer-the-layer-effects-window.md`.
**Origin:** user, 2026-10-13, with Affinity open: *"how are you supposed to get to effects from the topbar?"* · *"why are effects in tools? not layers?"* · *"or just like FX in layer panel"* (images 14–18: Affinity's `Pixel › New Live Filter Layer ▸ Blur · Sharpen · Distort · Noise · Lighting · Colors`, the Layers panel's **fx** button, the **Layer Effects** dialog — a list of effects with on/off, the selected one's controls on the right). And: *"can fxr be saved like an app on mac? like on iphone?"*
**The logistics, honestly:** plan 28 § 4b put Effects under **Layer › Effects ▸** — Affinity's home. Plan 29 § 7 moved it into **Tools** on the ruling *"fold effects and generative and type and pattern into tools"* / *"new is never in layer, layer is editing"*. Affinity draws the line differently: generative · pattern · type **create** a layer (tools), an effect is **applied to** a layer (Layer menu, the fx button). This plan follows Affinity and the user's instruction today; Tools keeps the creation folds.

## 0. What is already settled

| Rule / plan | Where this plan stands |
|---|---|
| Plan 29 § 7 — Tools = Generative ▸ · Pattern ▸ · Type ▸ · **Effects ▸** · Insert image | **Amends**: Effects leaves Tools (§ 1). Generative · Pattern · Type · Insert image stay. |
| Plan 28 § 4b — Layer › Effects ▸: None · categories ▸ filters, ✓ on the chain, greyed with no selection | **Restored** as written (§ 1). |
| Plan 30 § 8 — the Layers footer bar: eye · lock │ + · duplicate · delete | **Extends**: the **FX** button joins it (§ 2). |
| The Effects tab (selection pane; `EffectsPanel`) — the chain, per-row enable, `AutoControls` over a stage's schema | Holds as the *live filters* surface (§ 1's door). § 2's window is a second view over the same `layer.filters`, restricted to the ten layer effects, and reuses `AutoControls` for the right column. |
| `filterChain.js` — `addFilter · removeFilter · toggleFilter · moveFilter`, `MAX_FILTERS` | Reused by the window's rows, `+ ×`, circles and `▲ ▼`. `MAX_FILTERS` must allow ten effects plus the live filters, or the window raises it. |
| pixi defs — `filter-drop-shadow` · `filter-glow` · `filter-color-overlay` · `filter-bevel` · `filter-kawase-blur` | Five of the ten exist; four are new defs, one (3D) later (§ 2). |
| `MenuTop`'s `addEffect` → appends a stage, dispatches `kol:open-effects` | Reused by § 1's menu. |
| Plan 11 — `manifest.webmanifest`, apple-touch-icon, theme-color metas | **Extends** (§ 3): the icons Chrome needs to offer install. |

## 1. Effects leaves Tools for Layer › Effects ▸ · amends R1.1 / plan 29 § 7

The `MenuDropdownNest flyout label="Effects"` block (`addEffect`) moves from the Tools panel to the **Layer** panel, placed where Affinity has `New Live Filter Layer ▸` — after the layer verbs, before the divider — renamed **Live Filters ▸**, and keeps plan 28 § 4b's behaviour: greyed with no selection, ✓ on the filters in the chain, None clears. One more row under it: **Layer Effects…** — opens § 2's window. Tools reads `Generative ▸ · Pattern ▸ · Type ▸ · — · Insert image`.

**The menu's shape is Affinity's Live Filters menu (image 22)** — one flat list, `…` after each name, hairlines between the groups, in this order: **Blur** · **Sharpen** · **Distort** · **Noise** · **Lighting** · **Colors** — then ours. Each of our filters lands in the group Affinity would put it in; the labs families that have no Affinity twin keep their own group after the divider. What is on the list is what the catalog has; names in *italic* are Affinity's, ours in roman where they differ:

| Group | Ours, in the row order | Affinity has, we do not (not on the menu, not built) |
|---|---|---|
| Blur | Gaussian Blur (`fx-blur`) · Kawase Blur · Radial Blur · Zoom Blur · Motion Blur · Tilt Shift · Backdrop Blur · Bloom · Advanced Bloom | Diffuse Glow · Box · Lens · Depth of Field · Field · Maximum · Minimum · Bilateral · Median |
| Sharpen | Sharpen (`fx-sharpen`) · Enhance (`fx-enhance`, *Clarity*'s cousin) · Convolution | Unsharp Mask · Texture · High Pass · Multi Band Sharpen |
| Distort | Twist (*Twirl*) · Bulge/Pinch (*Pinch / Punch*) · Shockwave (*Ripple*) · Displacement Map (*Displace*) · Glitch · Pixelate (`fx-pixelate`) · Lens (`gl-lens`, *Lens Distortion*) · Distort (`gl-distort`) · Swirl · Waves · Wobble · Mirror · Kaleidoscope · Prism Ripple · Pixel Sort · Slitscan | Perspective · Spherical · Mesh Warp · Liquify |
| Noise | Noise (`fx-noise`, *Add Noise*) · Simplex Noise · Old Film · Texture · Paper | Denoise · Diffuse · Dust & Scratches |
| Lighting | Glow · God Ray · Simple Lightmap · Rays | — |
| Colors | Adjustment · HSL · HSV · Brightness · Contrast · Levels · RGB · RGB Split · Invert · Sepia · Grayscale · Posterize · Solarize · Threshold · Tint · Color Gradient · Color Map · Color Replace · Multi Color Replace · Chroma · Edge Detect · Emboss | Vignette · Defringe (*Halftone* is ours, richer, below) |
| — | | |
| Halftone | Dither · ASCII · Bitmap (the labs trio) | |
| Scanline · CRT · Refraction · Dither · Post-processing | as `effectCategories.js` lists them today | |

The menu is driven by **one list in `effectCategories.js`** — a `menuGroup` on each category (or on a filter where it differs), so the Effects tab's picker and the menu never drift. `fx-blur` is the chain's **Gaussian Blur** everywhere (the Layer Effects row in § 2 is the same def).

**Check:** Layer › Live Filters ▸ reads Blur … Colors — Halftone … in that order with hairlines; *Twirl*-shaped rows carry our names; Gaussian Blur… adds `fx-blur` to the selection and the right rail shows Effects; Tools has no filter row; with nothing selected the rows are greyed, not gone.

## 2. The fx button opens LAYER EFFECTS — the window in the reference, element by element

Images 19–21. Affinity has **two** effect systems and the reference is the second one: *live filters* (Blur · Sharpen · Distort · Noise … — a menu, § 1; ours is the Effects tab's chain) and **Layer Effects** — the Layers footer's **FX** button (tooltip *Layer Effects*) opens a **window** titled *Layer Effects*:

| In the reference | What it is | Ours |
|---|---|---|
| Left column: ten fixed rows — Bevel / Emboss · Outline · 3D · Inner Shadow · Inner Glow · Color Overlay · Gradient Overlay · Outer Glow · Outer Shadow · Gaussian Blur | The whole set, always listed, each with an **on/off circle**; off rows are still there | The same ten rows, same order, same names. On = a stage in `layer.filters`; off = no stage. The row's circle is the DS `ToggleSwitch`'s checkbox voice (`Checkbox` if the DS has one). |
| `+ ×` on Outline · Inner Shadow · Color Overlay · Gradient Overlay · Outer Shadow | **Stackable**: `+` adds another instance of that effect as a new row under it, `×` removes this one | Same five stackable; `+` = `addFilter(def)` after this row, `×` = `removeFilter`. The other five are single. |
| The selected row (blue) | Which effect the right column edits | Accent row (`bg-accent-primary/…`, the DS list's selected tone); click selects, does not toggle. |
| Right column: the selected effect's controls — Type · Radius · Depth (linked) · Soften · Profile (curve + Invert + Remove Profile) · Direction (dial + Azimuth · Elevation) · Highlight (blend · colour · %) · Shadow (blend · colour · %) | The effect's parameters, as a form | **`AutoControls schema={stage.def.params}`** — the same renderer the Effects tab uses — so each effect's params are a schema and the right column draws itself. Dial and curve are later (a `RangeField` for Azimuth / Elevation now). |
| `▲ ▼` bottom-left | Reorder the effects (they compose in list order) | `moveFilter(layer.id, i, ±1)` on the selected row. |
| **Scale with Object** | Effect sizes follow the layer's scale | `layer.effectsScale: true/false` — the renderer multiplies px params by the layer's scale when on. |
| **Fill Opacity** bottom-right | The content's opacity **without** the effects (a 0% fill keeps its shadow) | `layer.fillOpacity` — applied to the source before the effect stack, not to the composite. New. |
| **Close** | The window closes; everything applied live as it was edited | Same; no OK/Cancel — edits are live and undoable. |
| Window: titled, centred, resizable, over the canvas | A modal window | DS **`FullscreenOverlay`** (`PaletteModal` · `BatchExportModal` ride it), title *Layer Effects*, two columns: list 280 wide, controls fill; the canvas keeps rendering under it. |

**The ten effects — every control, from the reference (images 23–32), as the schema each def carries.** Every row but Gaussian Blur opens with **Blend mode** (popup: Normal · Multiply · Screen · … — the chain's blend list) and **Opacity** (0–100 %, the slider with the checker track = the DS `Slider` over `ColorSwatch`'s checker). A `°` value is a **dial** in Affinity; ours is a `RangeField` in degrees until the DS has a dial (one ask, later). **Offset Tool** (drag the shadow on the canvas) and the **Profile** curve are later, named below so they are not forgotten.

| Row | Controls, in Affinity's order | Today → build |
|---|---|---|
| **Bevel / Emboss** | Type (Outer · Inner · Pillow · Emboss) · Radius px · Depth px (**linked** to Radius by a chain toggle) · Soften px · Profile (curve + Invert + Remove Profile) · Direction: Azimuth ° · Elevation ° · Highlight (blend · colour · %) · Shadow (blend · colour · %) | pixi `Bevel` (rotation · thickness · light colour/alpha · shadow colour/alpha) → Type · Radius · Depth (link) · Soften · Azimuth · Elevation · Highlight · Shadow; Profile later |
| **Outline** | Blend · Opacity · Radius px · Alignment (Inside · Centre · Outside) · Fill style (Solid color · Gradient) · Color | pixi `Outline` (thickness · colour · alpha) → Radius · Alignment · Fill style (Solid now, Gradient with Gradient Overlay's editor) · Color |
| **3D** | Radius · Depth (linked) · Soften · Opacity · Profile (+ Remove Profile) · Diffuse % · Specular % · Shininess % · Specular color · Ambient % · Ambient light color · Light source (1 ▾ · Add · Remove) · Direction: Azimuth ° · Elevation ° · Color | **new**: Bevel's shape + a Phong light stack (pixi `SimpleLightmap` is not it) — Diffuse · Specular · Shininess · Ambient and **one** light source first; Add / Remove lights and Profile later |
| **Inner Shadow** | Blend (Multiply) · Opacity 50 · Radius px · Offset px · Intensity % · Color · Angle ° · Offset Tool | **new** pixi def: the drop shadow clipped to the inside of the alpha → Radius · Offset · Intensity · Color · Angle; Offset Tool later |
| **Inner Glow** | Blend (Screen) · Opacity · Radius px · Intensity % · Color · Center \| Edge | pixi `Glow` with `innerStrength` → Radius · Intensity · Color · Center / Edge (`SegmentedToggle`) |
| **Color Overlay** | Blend · Opacity · Color | pixi `Color Overlay` → as is |
| **Gradient Overlay** | Blend · Opacity · Type (Linear · Elliptical · Radial · Conical) · Gradient (the editor) · Scale X % · Scale Y % · Offset X % · Offset Y % · Angle ° | **new**: a gradient masked by the source alpha → Type · Gradient (our `Color Gradient`'s stops editor) · Scale X/Y · Offset X/Y · Angle |
| **Outer Glow** | Blend (Screen) · Opacity · Radius px · Intensity % · Color | pixi `Glow` (`outerStrength`) → as listed |
| **Outer Shadow** | Blend (Multiply) · Opacity 50 · Radius px · Offset px · Intensity % · Color · Angle ° · ☑ Fill knocks out shadow · Offset Tool | pixi `Drop Shadow` (offset · alpha · blur · colour · shadowOnly) → Radius · Offset · Intensity · Color · Angle · Fill knocks out shadow; Offset Tool later |
| **Gaussian Blur** | Radius px · ☐ Preserve alpha | `fx-blur` → Radius · Preserve alpha (blur the colour, keep the source alpha) |

Stackable (`+ ×`): Outline · Inner Shadow · Color Overlay · Gradient Overlay · Outer Shadow — as the reference. The defs carry `group: 'layer-effect'` so the window lists exactly them; they are also ordinary stages in `layer.filters`, so the Effects tab shows them too (Affinity's Layers panel shows an *fx* badge on the layer — ours shows the stage count; the badge comes when the layer row is redrawn). Defaults are Affinity's (shadows Multiply 50 % black at 315°, glows Screen white at 50 % intensity, blur 0).

**The button:** `LayerActions` gains **FX** (the DS cuts an `fx` glyph — Affinity's boxed FX — else `sparkle` until it does; tooltip *Layer Effects*), in the right group beside Duplicate: `eye · lock │ + · FX · duplicate · delete`; disabled with no selection. A press opens the window for the selection. **Layer › Layer Effects…** (§ 1) opens the same window.

### 2b. The rest of Affinity's Layers bar — what each button is, and ours

Image 20, left to right. The user: *"mask on layer, filters, adjustment layers? container layer, group, pixel layer, trash? did that happen to be considered?"* — they had not been. Here is each one, what it does in Affinity, what FXR has, and what this plan builds. The bar becomes **two groups like Affinity's**: the *apply-to-this-layer* group (FX · Mask · Adjustment · Live Filter) and the *add / remove* group (Layer · Group · Pixel · Delete). Eye · Lock move to the Layer menu rows they already have (Toggle visibility · Toggle lock) and the row's own hover controls.

| Affinity's button | What it does there | FXR today | Build |
|---|---|---|---|
| ✎ **Edit All Layers** | Toggle: selection and edits reach every layer, or only the current one | n/a — one selection model | Not built; no such mode here. |
| **FX** Layer Effects | § 2's window | Effects tab chain | § 2. |
| ● **Mask Layer** | Adds an empty mask to the selected layer (paint to hide); a shape dropped on a layer clips it | `Use as mask` / `Release mask` (Layer menu; `compose/masks.js`) — a layer becomes another's mask | **Mask** button: with two layers selected → `Use as mask` (the upper masks the lower, as Affinity's drag-onto does); with one → adds a full-frame **shape** mask (a rect the size of the layer) it can then edit — our masks are vector, not painted. Tooltip *Mask Layer*. |
| ◑ **Adjustment** | A menu: Levels · Curves · HSL · White balance · … → adds an **adjustment layer** above the selection that affects everything below it (non-destructive) | The adjustments exist as filters on a layer (`filter-adjustment` · HSL · Color Map · …), never as a layer affecting what is below | **Adjustment ▾** menu: Adjustment · HSL · Color Gradient · Color Map · Color Replace — each adds the stage to the **selected layer** now (what the engine does); the true adjustment *layer* (a layer type whose chain filters the composite below it) is a **new layer type `adjust`** and a compositor change — **later plan**, listed here so it is not forgotten. |
| ⧗ **Live Filter** | A menu: Blur · Sharpen · Distort · Noise · Lighting · Colors ▸ … → a live filter layer on the selection | The Effects tab's chain; Layer › Effects ▸ (§ 1) | **Live Filter ▾** button: the same menu as Layer › Effects ▸ (categories ▸ filters, `addEffect`), from the bar. |
| ⊡ **Add Layer** | An empty container layer (Designer's *Layer*) to drop things into | Only `group` is a container; `+` adds a *typed* layer (shape · text · photo · …) | **Layer** button = our `+` (AddLayerButton's picker), and the picker gains **Empty layer** → a `group` with no children, named *Layer* — Affinity's container, on the container we have. |
| 📁 **Group** | Groups the selection (`⌘G`) | `Group selection` (Layer menu, `groupLayers`) | **Group** button → `groupLayers`; disabled under two selected. |
| ▦ **Add Pixel Layer** | A blank raster layer to paint on | No painting tools; `photo` is the raster layer (image source) | **Not built.** A pixel layer without a brush is an empty photo; it comes with painting, if ever — § N non-goal until then. |
| 🗑 **Delete** | Deletes the selection | Delete (`deleteSelected`) | Stays, last. |

The bar: `[+ Layer] [Group] │ [FX] [Mask] [Adjust ▾] [Live Filter ▾] │ [Duplicate] [Delete]` — at the rail's 264 width eight `sm` icon buttons with two dividers fit (8 × 26 + gaps ≈ 240). Eye · Lock leave the bar (each row has its own eye, the lock is a menu verb and `⌘L`).

**Check:** two layers selected → Mask masks the lower with the upper, Release mask in the Layer menu undoes it; one layer → Mask adds a rect mask the size of the layer; Adjust ▾ HSL → a stage on the layer, the Effects tab shows it; Live Filter ▾ Halftone ▸ (a filter) → same; Group with two selected → a group; `+` › Empty layer → an empty container row named *Layer* that accepts a drop.

**Check:** select a layer, press FX → the window: ten rows, all off; turn Outer Shadow on → the layer casts it live; `+` on Outer Shadow → a second Outer Shadow row; select Color Overlay, set a colour → applied; ▲ moves it above; Scale with Object on, scale the layer → the shadow scales; Fill Opacity 0 → the content vanishes, the shadow stays; Close → the Effects tab lists the same stages; undo steps back through them.

## 3. Installed as an app

Yes — the file already ships a manifest (`display: standalone`, `start_url /`, theme colours) and the Apple touch icon, so on iPhone *Add to Home Screen* works today. On the Mac:

- **Safari** (17+): File › Add to Dock — works today, any site.
- **Chrome / Edge**: the install icon in the address bar needs **192 × 192 and 512 × 512 PNG icons** with `purpose: any` (ours lists only the 180 Apple icon and an SVG), and a `maskable` 512 for the rounded Dock tile. No service worker is required for install any more (Chrome dropped that in 2024); offline is a separate, later ask.
- **Firefox** (the browser in every screenshot): no app install on desktop, by design. Nothing we ship changes that.

Change: cut `touch-icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` from the dark logomark on `#121215` (the same ground the Apple icon uses — plan 11's lesson), list them in the manifest, keep the 180 for Apple. `id: "/"` on the manifest so Chrome keys the install on it.

**Check:** Chrome on the Mac shows the install icon on fxr.kolkrabbi.io; installed, it opens in its own window with no browser chrome; Safari › Add to Dock the same; on an iPhone the Home-Screen icon is the dark mark.

## 4. Verification

`vite preview` walk, dark + light, 0 console errors: § 1 and § 2 checks; Lighthouse PWA / Chrome's `Application › Manifest` panel reports installable with no icon warnings.
