# Plan — Inspector: paints open where they are, image fills, one grid for Transform

**Status:** BUILT 2026-10-14 — § 1 `PaintPopover` (`color/PaintPopover.jsx`): Fill and Stroke open at the swatch, Solid is the Color pane's `ColourBody`. § 2 paint types (`compose/paintFill.js`): Solid · Gradient · Pattern · Image · Video on `layer.fill`, drawn by one `PaintFillWrap` in `LayerRenderer` (clipped to the outline; text by `background-clip`), exported as SVG `<pattern>` / gradient fills (`build.js` `paintFillSvg`). § 3 the Transform and Appearance rows on one `[1fr 1fr auto]` grid — X/W/SX on the same verticals, lock and origin dots in the trailing column (the origin moved there, not to the header), align strips three a side. § 4 spec R1.2, R6.6, R5.5a amended. Walked (`_tmp/2026-10-14-plans-33-34-walk/`), dark + light, 0 console errors. Not built, as named: Stroke gradient (Stroke is Solid), video on text, text paint in export (keeps its colour), bool layers' paint (outline lives elsewhere), Image › Crop, stacked fills; a file-picked video fill lasts the session (a library video persists).
**Origin:** user, 2026-10-13, the Inspector beside Affinity and Figma (images 34–37): *"fill and stroke here should open color picker WHERE SWATCH IS.. I already said this"* · *"fill should also accept images LIKE FIGMA"* · *"this lock icon breaks the UI layout … look at the reference"*.
**What went wrong before:** spec R6.6 recorded the user's 15 as *"opens the Color pane"*; plan 28 built that. He said *open the picker at the swatch*. R6.6 is amended here (§ 4).

## 0. What is already settled

| Today | Where this plan stands |
|---|---|
| `LayerInspector.jsx` `PaintSwatch` — a click sets the active paint and fires `kol:open-color-pane` (the left rail's Color tab) | **Replaced** (§ 1): a popover at the swatch. |
| `ColorField` (`compose/inspectors/ColorField.jsx`) — a swatch whose popover holds a hex field, the palette chips and None — **no hue strip or square**; the real picker (hue · square · wheel · sliders · opacity · pipette) is the Color pane's `ColourBody` (`color/ColourPanel.jsx`) | **Reused** for § 1: the popover is `ColorField`'s shell with `ColourBody` inside it (Figma's body: square · hue · alpha · hex · pipette · chips). No new picker drawn. |
| Fill is a colour only (`layer.color`: `null` · `var(--kol-*)` · hex · `palette:*`) | **Extends** (§ 2): a paint type — Solid · Gradient · Pattern · Image · Video. |
| Transform rows: X·Y `grid-cols-2`; W·H `grid-cols-2` + a lock Button as a third flex item (`LayerInspector.jsx:552–560`); SX·SY; rotation + rotate/flip strip; `AlignmentPanel` strip of eight that overflows the rail and clips | **Replaced** (§ 3): one three-column grid, Figma's. |

## 1. Fill and Stroke open the picker at the swatch · amends R6.6

The Fill and Stroke swatches open a **popover anchored to the swatch** — `ColorField`'s popover shell (`usePopover` + `PopoverPanel`, the same one every colour param opens) grown to hold the Color pane's `ColourBody` (SB square · hue strip · wheel / sliders view · opacity · pipette) above its hex field, palette chips and **None**. One `PaintPopover`; `ColorField`'s colour params keep their small popover. It writes `layer.color` / `layer.stroke` through `useLayerEdit` (coalesced). The active paint is set as today so the Color pane, if open, follows. The left-rail Color pane stays a pane (Window › Color, the tool strip's swatch pair); it is no longer what the inspector's swatch opens.

**Check:** click Fill → the picker opens beside the swatch, the left rail does not change; drag hue → the layer changes live, one undo step; Esc / click-away closes.

## 2. A paint is a type, not a colour · Figma's paint picker (image 38)

The user, 2026-10-13: *"solid gradient pattern image video shade (beta) blend check color contrast is what figma says. I don't think we need all, but … pattern is there and solid, gradient and image and video."*

Figma's picker has a row of paint **types** across its top; the body below is that type's editor. Ours takes **five** — and the point is that FXR already makes four of them somewhere else; the picker makes them paints any shape can wear:

| Type | Figma's | What FXR already has | The paint |
|---|---|---|---|
| **Solid** | ■ | `layer.color` + the picker (§ 1) | as today |
| **Gradient** | ▦ | Gradient Overlay's canvas gradient (plan 32, `layerEffects.js` `gradientImage`), `grad-lin` · `grad-rad` · `grad-con` icons | Linear · Radial · Conical, two-plus stops, angle; SVG `linearGradient` / `radialGradient` (conical as the canvas image) |
| **Pattern** | ▤ | the pattern layer's engine (`modes/pattern/render.js` `buildPatternSvg`, the Pattern tool's presets) | the same pattern, as a fill: the preset picker **and the pattern's params in the popover** (`AutoControls` over the pattern schema) — one surface; the Parameters tab stays the shape's |
| **Image** | 🖼 | photo layers, the media library picker, Insert image | Fill · Fit · Tile, scale; **Crop** (a hand-placed window) later — the photo layer's crop tool is the seed |
| **Video** | ▶ | photo layers with `srcType: 'video'`, clip persistence (plan 26) | the video plays inside the shape, loop · muted; Fill · Fit |

**Not taken:** Shader (beta) — Figma's GPU paint; our generative loops are the stronger version and are layers, not paints. Blend — a paint blend mode; layers already blend. Check color contrast — a later accessibility tool, not a paint. Libraries / "On this page" — our Swatches tab is that.

**One model, one render path.** `layer.fill = { type: 'solid' | 'gradient' | 'pattern' | 'image' | 'video', …params }`; absent = today's `layer.color` (every reader keeps working). Solid and gradient paint the shape directly (SVG fill / gradient def). Pattern, image and video render as **a source in the layer's box, clipped by the shape's outline** — the same outline the mask feature resolves (`compose/masks.js` `canvasOutline`), as `clip-path: path(…)` on an **inner** element (the mask's clip stays on the wrapper, so a masked layer with an image fill takes both) — one mechanism for shape, path and bool. **Text** takes Solid · Gradient · Image · Pattern through `background-clip: text` (an image or pattern data URL); a **video fill on text is later** — a `<video>` cannot be a CSS background, it needs the glyph outlines as an SVG clip (`textOutlinePaths` exists for export; the live path is the work). Export: gradient and pattern as SVG defs, image inlined as a `<pattern>`, video as its current frame (the export already snapshots video, plan 26).

The swatch shows what it paints: the colour, a gradient strip, the pattern's thumbnail, the image or the video's poster.

**Stroke** takes Solid and Gradient; a pattern, image or video stroke is later (a stroke is a path outline, not a box). A **video fill under a live-filter chain** renders its current frame per transport tick, as a video photo layer under a chain does (`rasterizeLayer` is the chain's source) — the plumbing exists, the walk proves it.

Later, named so it is not lost: Figma's **stacked fills** (Fill `+`, an eye and `−` per fill) — one fill per layer until a reference asks for more.

**Check:** a rectangle → Fill › each type in turn: Solid; Gradient linear → conical; Pattern › a preset; Image › a photo, Fit / Tile; Video › a clip, playing — the same on a star, a path and a text layer; export SVG and PNG carry each (video as its frame); Solid brings the colour back.

## 3. Transform on one grid · the lock stops breaking it

Figma (image 37): every row in a section is **two equal fields + one trailing icon column**, so X·Y, W·H, rotation and Appearance's opacity·radius all line up and the trailing icons stack in one column. Affinity (image 36) does the same — the W/H link sits in its own column to the right of both rows.

- The Transform section becomes one `grid grid-cols-[1fr_1fr_auto] gap-2` — the trailing column is the icon Button's own width on the rail's size group (26 at `sm`, 32 on touch), never a hard 24. Rows: X · Y · — │ W · H · **lock** │ SX · SY · — │ rotation · rotate/flip strip · —. The lock moves into the trailing cell; W and H are the same width as X and Y.
- The origin 3×3 dots move out of the X·Y row to the section header's trailing slot (Figma keeps position fields flush; Affinity's origin is its own block) — so X·Y start at the same left edge as W·H.
- Appearance uses the same grid: opacity · radius · the corner-mode icon in the trailing column (it is already there — now it lines up).
- `AlignmentPanel`'s eight buttons fit: two groups of three (Figma — left/centre/right · top/middle/bottom), the two distribute buttons move to Layer › Align (they are there already), so the strip never overflows the rail.

**Check:** at the rail's 264 and 320 widths, X/W, Y/H, SX, rotation and opacity start and end on the same verticals; the lock sits in the trailing column; nothing clips or scrolls sideways; light + dark.

## 4. The spec

R6.6 → "A paint swatch opens its **picker in a popover at the swatch** (the user's 15, 2026-10-13 — *not* the Color pane); Fill is a paint type: Solid · Gradient · Pattern · Image · Video (Figma's picker, the user's selection)." R6.x adds "Inspector sections share one grid: two fields + a trailing icon column the width of the rung's icon button."

## 5. Verification

`vite preview`, dark + light, 0 console errors: §§ 1–3 checks; a full-rail screenshot beside the Figma reference.
