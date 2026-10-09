# Audit — pass B: the editor's tools and verbs (plan 21 § B)

**Run:** 2026-10-09, local (MBP), `vite preview` of the current `dist/`, Chromium via the Playwright MCP, 1600×1000. Signed out. Mouse only (no coarse pointer).
**Method:** every `ToolPalette` item and every `MenuTop` verb read and pressed in each selection state — nothing · a shape · a loop · a photo · a locked layer — the keymap key by key, modifiers, the modes (crop · node-edit · kinetic · boolean) entered and exited, undo/redo after each. A finding carries file:line, the state and what happened. Nothing fixed.

## State 0 — nothing selected (empty canvas)

Toolbar: Select (pressed) · Text · Pen · Rectangle · Pattern · Zoom · Orbit enabled; Flip h/v · Rotate l/r · Unite · Crop image · Duplicate disabled; Insert image enabled. Menus: Effects reads *Select a layer to apply an effect*; Tools' Flatten / Release disabled; File's Clear · Undo · Redo disabled. Layers: *Canvas* only. Inspector: empty. Consistent.

## State 1 — a rectangle (R, drag 700,400 → 900,600)

Works: the rect lands selected (X 344 · Y 441 · W 316 · H 316, Transform · Appearance · Parameters), Select re-arms; Flip h/v · Rotate l/r · Duplicate act, Unite · Crop stay off; ⌘Z / ⇧⌘Z walk the stack; ← → nudge 1px; Esc deselects and the inspector empties; a click on empty canvas INSIDE the frame deselects; two rects shift-clicked → ⌘G *Group* / ⇧⌘G back; Unite → a *Unite* layer, Tools' Flatten / Release enable, ⌘Z restores the pair.

**B1 · A click outside the frame does not deselect.** Rect selected, click the grey viewport at 1230,920 (inside `main`, outside the 4:5 frame): the selection and the inspector stay. The same click inside the frame's white deselects. `src/editor/compose/CanvasArea.jsx:519` — the click-deselect commits on pointerup on the STAGE; the viewport around it has no handler. The user's finding 22, confirmed. *fix.*

**B2 · Lock disagrees with itself.** `L` on the rect: Rotate l/r go disabled, Flip h/v and Duplicate stay enabled; the menu verbs are untouched. A locked layer either refuses transforms or it doesn't — today it refuses half. `shell/panels/ToolPalette.jsx:86` — the per-item `disabled` rules read `locked` for rotate only. *fix: one rule.*

## State 2 — text, path, pattern

**B3 · Placing text and typing fires the keymap.** `T`, click the canvas: a *New text* layer lands selected and focus sits on its LAYER ROW (`button.kol-layer-stack-main`), not in any text field — the Typography section has no text input, and nothing enters an editing mode. Type `Hello`: `H` hides the layer (the row is `is-hidden` afterwards), `L` locks and unlocks it, `O` arms the ellipse tool — the word goes to the shortcuts, never to the text. Measured twice (`Hello`, then `xy` on a second placement: same). There is no visible way to type into a text layer short of finding the double-click. `src/editor/compose/CanvasArea.jsx` (the text tool's place handler) + `inspectors/TextPanel.jsx`. *fix: placing text enters text editing with focus in the field; keys while a text field has focus never reach the keymap.*

Works: Pen — three clicks + Enter → a *path* layer (Transform · Appearance · Path); `A` on it shows the three node handles, Esc leaves; Pattern — click → a full-frame *Pattern* layer (0 · 0 · 1080 · 1350, Parameters).

## State 3 — a photo (Assets → the first Images tile)

The tile lands a *Photo* at the frame (0 · 0 · 1080 · 1350, Transform · Appearance · Image with Replace · Library · delete); the toolbar's Crop enables; Unite stays off.

**B4 · Crop does nothing.** Photo selected, press the toolbar's *Crop image* (it lights), or double-click the photo: no overlay, no handles, no hint — three shots identical (`B-crop-mode` · `B-crop-dragged` · `B-crop-dblclick`); a drag inside changes nothing (X · Y · W · H stay 0 · 0 · 1080 · 1350); Enter and Esc change nothing. The user's 27, confirmed. Root-cause candidate: `CanvasArea.jsx:936` — `cropLayer` requires `l.imgW != null`, and a photo inserted from the Assets tile / library carries no natural size, so crop mode is entered (`cropId` set) and `CropOverlay` never mounts. The toolbar lights for a mode that has no body. *fix: read the natural size on insert (every photo path), and never light Crop without the overlay.*

**B5 · The toolbar has TWO `Crop image` buttons.** The palette's and the inspector Transform strip's segmented cell carry the same `aria-label` — one action, two homes (a locator strict-mode collision found it). *ruling: one or the other.*

## Modifiers and drops

**B6 · Alt-drag does not duplicate.** Rect selected, ⌥ + drag 100px: the layer count stays 16 → 16 and the drag moves it. The user's 28, confirmed; `CanvasArea.jsx:600` uses ⌥ only as draw-from-centre during creation — no clash. *fix.*

**B7 · A file dropped anywhere but the stage navigates the browser.** Synthetic `dragover` + `drop` with a PNG `File`: on the stage (an `<img>` of the photo) both events are `defaultPrevented` and a layer lands; on the grey viewport, the left rail body and the topbar — **none prevented**, so a real drop there opens the file in the tab, which is how the user lost his window (25 → 24). `CanvasArea.jsx:1318` is the only `onDrop`. *fix: `dragover`/`drop` prevented at the app root; a file dropped off-stage lands at the frame's centre.*

## Keys (the sheet's list, pressed)

**B8 · A locked layer still nudges.** Path locked (`L`): ⌫ and ⌘D are refused (12 → 12 rows, correct), but `→` moves it 818 → 819. Same rule as B2 — lock is enforced per verb instead of once. `CanvasArea.jsx` keymap nudge branch. *fix, with B2.*

Works: a loop (Generative → Scanline → Drift) lands selected at the frame (Transform · Appearance · Preset · Parameters; the Parameters tab = Type · Category · Preset + Generate / Style / Animation, 11 sliders · 7 dropdowns); its Effects menu offers None · Halftone · Scanline · CRT · Refraction · FX rack · Pattern (nests — hover-opened, the picker proper is pass C); Space toggles play / pause (the transport cells swap `is-active`); Zoom tool: click 100 → 200 %, ⌥-click back; G grid, ⇧R rulers.

Works: V · T · P · R · O (ellipse, not walked) · Z · C arm tools; ⌘Z / ⇧⌘Z; ⌘D duplicates, ⌫ deletes; Esc deselects; ⌘G / ⇧⌘G; L / H (B2); ← → nudge; 1–9 / 0 / 00 opacity (50 · 100 · 0); D default paint (white / black), X focus, ⇧X swap, N clears the focused paint; `\` collapses the SHELL rail (320 → 48), not the inspector; F toggles the fps readout; S the shortcuts sheet (A9: Esc does not close it); `?` nothing (A12); `I` = placeholder text (A8).

