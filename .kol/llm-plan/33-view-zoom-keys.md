# Plan — View › Zoom and its keys

**Status:** BUILT 2026-10-14 — View › Zoom ▸ and ⌘1–⌘4 / ⌥⌘0 / ⇧⌘0 built; the title reads the REAL percentage (fitted 64% on a 1600 screen); `CanvasViewCommands` returned as kol-component 0.258.0 and adopted (`kol:zoom-to`, `kol:zoom-fit`, real clamps). Found on the build: the DS viewport already owned ⌘0 / ⌘= / ⌘- (step ×1.2, not ×2) — they stay its keys, listed passive in keymap.js and run from the menu; In/Out step ×1.2 to match. Walked on `vite preview` (`_tmp/2026-10-14-plans-33-34-walk/`): ⌘1–⌘4 → 100/200/400/800, ⌘0 → 64%, To Width fills the viewport, 0 console errors. Not walked: the installed app window and Safari for ⌘1–⌘4 (a Chrome tab is what Playwright drives).
**Origin:** user, 2026-10-13, Affinity's View › Zoom open (image 33): *"wait command 1 2 3 4 are not bound?"*

## 0. What is already settled

| Today | Where this plan stands |
|---|---|
| The editor zooms only by ⌘/Ctrl + wheel, pinch and the Zoom tool (`Z`; click = `kol:zoom-at` with a factor). No zoom keys, no View › Zoom. | **Adds** View › Zoom ▸ and its keys (§§ 1–2). |
| Labs binds `+` / `-` / `0` on its stage (`labs-zoom-*`, keymap). | Untouched — labs' own view. |
| DS `Canvas` (kol-component `organisms/Canvas.jsx`) owns the view `{ zoom, x, y }` (`zoomAt(v, factor, sx, sy)`); it listens to `kol:zoom-at` (relative factor at a client point) and nothing else. The published zoom is `zoomStore` (`useZoom`). | **DS ask** (§ 3): absolute zoom + fit, which a relative factor can't do (fit also resets the pan). |
| **`100%` today means the frame FITTED** — the DS scales the frame to the viewport first (`fit='contain'`), then `zoom` multiplies; the title line (plan 30 § 5) reads that zoom. Affinity's and Figma's 100% is **actual pixels** (one frame px = one screen px). | **Amends plan 30 § 5's readout** (§ 1): the title shows the real percentage — fitted reads e.g. `58%` on a 1600 screen, ⌘1 is 100%. Without this, ⌘1–⌘4 would be a lie beside Affinity's. |
| Plan 30 § 5 removed the status bar's reset-zoom button (*"it's just noise"*). | Holds — the reset lives in the menu and on ⌘0, Affinity's. |

## 1. View › Zoom ▸ — Affinity's rows, ours where they apply

First row of the View menu, a flyout, keys from `keymap.js` (Mod = ⌘ / Ctrl):

| Row | Key | Does |
|---|---|---|
| In | Mod+= (⌘= ; ⇧⌘= is the same key) | ×2 about the viewport centre |
| Out | Mod+- | ÷2 about the centre |
| To Fit | Mod+0 | the frame fitted, pan reset — the canvas's opening view |
| To Width | Alt+Mod+0 | the frame's width fills the viewport |
| To Selection | Shift+Mod+0 | the selection's bounds fitted (greyed with nothing selected) |
| 100% | Mod+1 | actual pixels about the centre — `zoom = 1 / fitScale` in the DS's terms |
| 200% | Mod+2 | |
| 400% | Mod+3 | |
| 800% | Mod+4 | |

`Untitled @ 100%` becomes the true percentage (the fitted view reads what it is); `zoomStore` publishes `zoom × fitScale`, which the DS exposes with § 3. Not taken: *To Document* (we have one frame — it is To Fit), *Actual Size* ⌘8 and *Pixel Size* ⌘9 (print and DPI views; FXR has no physical units). ✓ marks the row matching the current zoom.

## 2. The keys

New keymap rows in section **View** (`views: ['editor']`): `zoom-in` `Mod+=` · `zoom-out` `Mod+-` · `zoom-fit` `Mod+0` · `zoom-width` `Mod+Alt+0` · `zoom-selection` `Mod+Shift+0` · `zoom-100`…`zoom-800` `Mod+1`…`Mod+4`. The keymap's grammar takes a single character after `Mod+` (`=` and `-` are `event.key` matches; labs' `Plus` name is its own passive binding and is not reused). CanvasArea's key handler maps them to § 3's events and `preventDefault`s, so ⌘= / ⌘- / ⌘0 stop zooming the browser page (Figma does the same). The cheat sheet lists them.

**The browser's own keys — said plainly:** in a Chrome or Firefox **tab**, ⌘1–⌘8 switch tabs and the page cannot stop it; ⌘= ⌘- ⌘0 the page *can* take. In the **installed app window** (plan 32 § 3 — Chrome's Install FXR, Safari's Add to Dock) there are no tabs and ⌘1–⌘4 reach the editor. So: bind them, they work in the app window; **Safari's ⌘1–⌘9 are its Favorites-bar keys — whether a page may take them is verified in the walk, not assumed**; in a Chrome/Firefox tab they belong to the browser, and the menu rows still work there.

## 3. Absolute zoom and fit · DS ask `CanvasViewCommands`

`Canvas` takes two more window events beside `kol:zoom-at`:
- `kol:zoom-to` `{ zoom, anchor?: 'center' }` — set the view's zoom absolutely about the viewport centre, in **screen-per-frame-px** terms (1 = actual pixels; the DS folds its own `fitScale` in);
- the DS publishes the effective scale (`zoom × fitScale`) through `CanvasZoomContext`, so the title line can read the true percentage;
- `kol:zoom-fit` `{ to?: 'frame' | 'width' | { x, y, w, h } }` — reset the view so the frame (or its width, or a rect in frame px — the selection) fits, pan included.

Filed to kol-ds-ui as `CanvasViewCommands`; adopted at the bump. In: Mod+= / Mod+- reuse `kol:zoom-at` with factor 2 / 0.5 at the viewport centre — those can ship before the bump.

## 4. Verification

`vite preview` (and the installed app window for ⌘1–4), dark + light, 0 console errors: View › Zoom › 200% → the readout reads 200%; ⌘1 / ⌘2 / ⌘3 / ⌘4 → 100 / 200 / 400 / 800 in the app window (Safari tried, the result written down); the fitted view's readout is the true percentage, not 100; ⌘0 → the opening view; ⌥⌘0 → the frame's width fills; select a layer, ⇧⌘0 → it fills; ⌘= / ⌘- step and the browser page does not zoom.
