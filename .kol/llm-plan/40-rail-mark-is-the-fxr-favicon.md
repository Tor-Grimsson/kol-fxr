# Plan — rail mark, Home, labs rail review

**Raised:** 2026-10-24, the user, screenshots of the rail, Home, and the labs rails. Points verbatim:
- P1 *"we should use repo favicon instead of kolkrabbi logo in rail"*
- P2 *"broken patches, broken names, mutliple copies? … buggy names here but at least they have thumb. I think we should jsut select a few from library, not this bs. its confusing bc. it doesnt even matter if your signed in or not, so its not database files."*
- P3 *"from library or home, when entering a card-project and going Back doesnt go to the patch you were looking at, just to the page 'home' but tab is recent at top (should have been SAVED at the location of project card?)"*
- P4 *"what is Modulator tab in labs? and animation is its only child? is it related to the animation tab in the right siderail?"*
- P5 *"what is happening here with the yellow box?"* (the selected Elements row)
- P6 *"how does this work? I think its broken?"* (Edit on canvas)
- P7 *"Elements is in both GENERATE and STYLE and ANIMATE? why? and M for modulate doesnt work in Composition?"*
- P8 *"in paratype there is no way to modulate the xy pad?"*
- P9 *"press C does not orbit camera, bug?"*
- P10 *"wrong reset to default icon, way to few randomise options. AND kinetic and type dont have any ranomise options."*
- P12 *"and loader icon should be 2x biggeer"*
- P11 *"general point wrong sunken … it should be grey like DS apps/studio-hub shows … you have it correct on hub pages, just not in labs and other chromes?"*

**Status:** CLOSED — 2026-10-24 (user: "close the plan"). BUILT — W1–W8 built and walked on a task-scoped dev server at 1600 (0 console warnings, build green, `mergeRemote.check` green). Screens in `_tmp/2026-10-24-plan40-walk/`.
**Shape:** W › phase › list.
**Laws carried:** KOL consumed from npm, no local patch of the shell (ARCHITECTURE §2); the rail mark is inlined by the KOL `Logomark` and themes by `currentColor`; never delete — out of the tree means `_tmp/`; user-facing copy changes only where a point names it.
**How a phase closes:** acceptance line first, gates green, then Playwright against his own words.

## W1 — Rail mark

### 1.1 — FXR favicon in place of the Kolkrabbi mark (P1) — ✅ built 2026-10-24

**Acceptance:** the rail's top mark, open and collapsed, is `public/favicon/favicon.svg`, white in dark and ink in light by the app's theme toggle (not the OS); still navigates to `/`; 0 console errors.

- `src/AppLayout.jsx`: `APP.logomark` → `'/favicon/favicon.svg'`; drop the `@kolkrabbi/kol-brand/svg/favicon-01.svg?url` import.
- The favicon's paths are `fill="currentColor"` and `Logomark` strips its `<style>` on inline, so the OS-keyed colour cannot leak.

### 1.2 — Loader mark at 2× (P12) — ✅ built 2026-10-24

**Acceptance:** the boot loader's FXR mark draws at 128px (was 64), centred, same pulse.

- `vite.config.js`: `loaderApp({ graphic: 'src/assets/fxr-mark.svg', size: 128 })` — the option already exists in kol-framework.

## W2 — Home

### 2.1 — Home shows a few picks from the Library (P2) — ✅ built 2026-10-24

**Ruled 2026-10-24:** *"sounds good"* — six Library picks, a couple per chrome, above the user's own real saves; the test saves exported to `_tmp/` then cleared.

**Acceptance:** Home shows six shipped picks (covers drawn, real names) above the user's saves; no Plan08 / Sync A files remain in storage; the export sits in `_tmp/`.

- Home today lists this browser's localStorage saves (sign-in only merges the cloud in), which is why sign-in changes nothing. The Plan08 / Sync A files are test saves left by earlier agent walks.

### 2.2 — Back returns to the card you opened (P3) — ✅ built 2026-10-24

**Acceptance:** open a card from Home SAVED (or a Library view) scrolled down, open it, press Back → same page, same tab, same scroll, the card in view.

- Home tab + scroll and Library view + scroll ride the history entry (or sessionStorage keyed by path), restored on return.

## W3 — Labs left rail

### 3.1 — Drop the Modulation › Animation row (P4) — ✅ built 2026-10-24

**Acceptance:** the labs nav has no Modulation section; the right rail's Animation tab is unchanged.

- The row has no page of its own — it only opens the right rail (`kol:open-params`, `src/editor/labs/catalog.js`). Remove both rows.

## W4 — Type (kinetic) panel

### 4.1 — Elements list once, on Generate (P5, P7) — ✅ built 2026-10-24

**Acceptance:** Elements (list, Group/Ungroup, Add, Edit on canvas) shows on Generate only; Style and Animation act on the selected element and say which one in one line; the selected row reads as selected without the yellow fill.

- The yellow is the selected element painted in `--kol-accent-primary` at 26% (`KineticPanel.jsx`). Selection takes the KOL list-row selected state instead.

### 4.2 — Edit on canvas works (P6) — ✅ built 2026-10-24

**Acceptance:** press Edit on canvas → click an element on the canvas selects it, drag moves it, a corner scales it; Escape / Enter leaves; walked in labs and the editor.

- Walk it first; fix what is broken in `KineticElementOverlay.jsx` / the `kol:kinetic-edit` route in `CanvasArea.jsx`.

### 4.3 — Kinetic and Type get Randomize (P10) — ✅ built 2026-10-24

**Acceptance:** a Type layer's rail has Randomize all + per-scope rolls (Color · Type · Motion) with the same reset, and a roll changes the canvas.

## W5 — Modulation reach

### 5.1 — M works on Composition and the XY pad (P7, P8) — ✅ built 2026-10-24

**Acceptance:** M shows bind dots on Composition's params and on both Paratype XY-pad axes; binding one animates it.

- Today kinetic knobs and the pad have no bind dot, so M has nothing to show.

## W6 — Rolls rail

### 6.1 — Reset icon and more roll scopes (P10) — ✅ built 2026-10-24

**Acceptance:** reset uses the same glyph as the KOL settings rail's reset; every param section of the layer has its own roll cell beside Color · Motion Form · Motion Frame.

## W7 — Camera

### 7.1 — C is honest about the camera (P9) — ✅ built 2026-10-24

**Acceptance:** on every 3D preset, C + drag moves the camera; where a scene only zooms, the hint does not promise C.

- That screenshot's scene has no orbit or yaw rig — C arms the tool, but only scroll does anything. Either give it the yaw rig or drop "Press C" from its hint.

## W8 — Sunken controls

### 8.1 — Chromes use the default tone, like the Hub (P11) — ✅ built 2026-10-24

**Acceptance:** dropdowns and segmented strips in the labs rails and the settings rail render the Hub's grey, side by side with studio-hub in dark and light.

- fxr passes `tone="sunken"` on 11 controls (`src/settings/AppSettings.jsx`, `src/editor/labs/LabsParams.jsx`); the Hub pages pass none. Drop it. Not the retired ticket — that one was light-mode pills vanishing on the old settings page.

## Closed — what the walk found

- 2.1: the test saves came back after the 2026-10-08 one-time clean because a signed-in merge re-added the cloud copies. `mergeRemote` now refuses them and removes them from the cloud; `main.jsx` strips them on every load, keeping a copy under `kol.editor.library.plan08-backup`. They cannot be exported to `_tmp/` from here — they live in the user's browser.
- 2.2: HubHome has no `onViewChange`, so Home's view is read off a press on its view label (`ponytail:` in `AppLayout.jsx`); the scroller is found by `returnSpot.js`.
- 4.2: the button worked in the editor only — labs never listened for `kol:kinetic-edit`. The overlay now draws over `OutputCanvas` via its `overlay` slot.
- 6.1: the screenshot's loop was Paratype, whose anatomy params had no sections; they are Metrics · Weights · Expressive now. Reset is `refresh`, the KOL settings rail's glyph.
- 7.1: Paratype is 2D — C arms the tool and only the wheel zooms (and only up from 1×). The hint now says exactly that per loop kind.
- 8.1: 43 `tone="sunken"` props across 18 files dropped; the settings rail reads the Hub's grey in dark and light.
