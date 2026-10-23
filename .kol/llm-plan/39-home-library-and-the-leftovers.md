# Plan — Home vs Library, empty covers, and everything left

**Raised:** 2026-10-23, the user, a screenshot of Home on fxr.kolkrabbi.io. Points verbatim:
- P1 *"why does library and home show the same thing?? those are not the same fucing page????"*
- P2 *"why does it have a fucking hover state???"*
- P3 *"why are the thumbnails empty?"*
- P4 *"HOME IS THE START THE USER HOME... Library is saved presets fucking look around you look at fucking monitor and mirror... besides the simple point of you can set different chrome saves in library that you wouldnt in USER HOME"*
- P5 *"open /plan-shape for EVERUYTHING LEFT and let this be the fucking LAST RUN"*
- Carried from the 2026-10-23 session log: Color Modes is a panel tab, not a tool; `PaletteModal` still lives beside it; palettes in HSL, not OKLCH.

**Status:** BUILT — 2026-10-23: W1–W4 built and walked on the dev server (0 console errors, `palette.check` green). Number 38 stays with text frames (ruled its own plan).
**Shape:** W › phase › list.
**Laws carried:** the card is the DS's — fix what fxr puts in it, a DS defect is a ticket (plan 06 covers editor organisms only); Home / Library follow monitor + mirror; never delete — retire to `_tmp/`; Tailwind first; user-facing copy verbatim.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — Home is the user's, Library is the chrome saves (P1, P4)

Today both list the `preset` slot (your files): Home's RECENT = newest 12, SAVED = all, Library = all four slots pooled. Monitor and mirror: Home = a blank start + your files; Library = the app's own material, never your files.

### 1.1 — Home: a blank start, then your files — ✅ built 2026-10-23
- RECENT = one blank-start card (opens New File's four doors) + your newest 12 files; SAVED = all your files.
- Signed in or not (monitor's rule): signed out is a user with a local library. The chrome cards (`CHROMES`, `/previews/chromes/`) come off Home.

**Acceptance:** `/` RECENT shows the blank-start card then files newest first; SAVED shows every file; no chrome card; the same signed out.

### 1.2 — Library: the chrome saves only — ✅ built 2026-10-23 (palettes show their colours, type its own text as the cover)
- `SLOT_ORDER` drops `preset`: Library lists Type · Palettes · Patterns, the saves made inside a chrome.
- Header copy stays verbatim.

**Acceptance:** `/library` shows no saved file; a palette saved in the editor shows there and not on Home.

### 1.3 — Shipped presets stay out of Library — ruled by the agent 2026-10-23
- fxr's shipped material is generators and kinetic presets, and each already has its picker inside its chrome (LoopPicker, KineticPanel). Listing them again in Library would be the duplicate W1 removes.

## W2 — The hover (P2)

### 2.1 — Verify the DS fix — `AppCardNoHoverFill`, kol-component 0.293.0 — ✅ built 2026-10-23 (rest = hover `rgb(18,18,21)`; receipt closed)
- Measure a clickable card on Home and `/library`, rest vs hover.
- Close the receipt in `lobby/outbox/` and the ledger row.

**Acceptance:** rest and hover backgrounds are equal on both pages; cover zoom and corner controls still respond.

## W3 — Empty covers (P3)

Covers are captured on save since 2026-10-09 (`useComposeFile.js` `captureThumb`); Stripes · Scanline drift · Star morph (2026-10-08) have none.

### 3.1 — A file without a cover gets one when it opens — ✅ built 2026-10-23 (backfilled cover = a save's cover; layers + savedAt unchanged)
- Generators draw on live canvases, so a cover cannot be drawn from a file that is not mounted. Instead, opening a cover-less file captures its frame once it has drawn (`UrlIntents`, 1.5 s) and writes it as the thumb — `setThumb`, cover only, `savedAt` kept so RECENT order holds.
- No save needed; a failed capture keeps the placeholder.

**Acceptance:** open an old file from Home, come back — its card shows a real cover; its saved content and place in RECENT are unchanged.

## W4 — Color Modes is a tool (session log, owed)

### 4.1 — An overlay window, like Adobe's colour tool — ✅ built 2026-10-23 (`color/ColorModesWindow.jsx`; Apply to document writes Primary · Secondary · Dark · Accent · BG)
- Color Modes opens as an overlay window from Tools (and Window › Color Modes), not a tab in the colour pane.
- It edits the document palette; the pane's Palette tab goes.

**Acceptance:** Tools › Color Modes opens the window over the canvas; the colour pane has no Palette tab; a change in the window recolours the document.

### 4.2 — One palette generator — ✅ built 2026-10-23 (`_tmp/2026-10-23-palette-modal-retired/`)
- `PaletteModal` retires to `_tmp/`; every route that opened it opens Color Modes.

**Acceptance:** no code path reaches `PaletteModal`; one palette generator in the app.

### 4.3 — Generate in OKLCH — ✅ built 2026-10-23 (60 seeds × 7 relations, accent L 0.60–0.72)
- `palette.js` generates in OKLCH, stores hex (plan 37 § 5 asked this; HSL shipped).

**Acceptance:** `palette.check.mjs` passes on OKLCH output; ramps read even in lightness.

## PARKED

- Text frames + Character / Paragraph panels — PARKED: its own plan, 38.
- Riso ~0.5 s/frame on moving generators — PARKED: a CPU pass, fine on stills; needs a GPU port.
- Thin streamlines read dashed in the phone preview — PARKED: the output is solid; a preview-scale artefact.
