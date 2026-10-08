# Plan — Morph is a file kind, with its own rail tab

**Status:** SUPERSEDED 2026-10-08 by plan 10 — the generator-rail tab, the `FullscreenOverlay` pickers and the param-only engine are what it replaces; the file kind, `mode`, New File's doors and `UrlIntents` stand. Was: BUILT AND WALKED 2026-10-08 on the built bundle + the local Worker (`plan09-walk.mjs`, 20 checks; plans 07 + 08, Home, sync and the route walks re-run green). Deviations: reorder is ↑ ↓ buttons, not drag; the picker's rows are the catalog's presets and the saved labs files; the randomiser's tab is read-only as planned. Two things found on the way: the preset validator dropped `canvasW/H`, `mode` and `morph` (fixed), and the URL intent had to be stripped a tick late or the provider's restore check never saw it. Replaces the Morph… button in the File tab (plan 05).
**Origin:** user, 2026-10-08 — a morph should be a fourth file type you can make from New File and work on in its own rail tab, not a button in the File tab.

## What a user sees

**New File** offers four doors: Editor · Labs · Randomiser · Morph. Morph opens labs on an empty Morph tab.

**The Morph tab** sits in labs' right rail beside Generate · Style · Animation.

- Empty: two doors, *From presets* (the built-in catalog) and *From my files* (saved labs files). The first pick becomes step 1 and fixes the generator.
- With steps: a numbered list. *+ Add step* opens the same two doors; *Add current* snapshots what is on the stage. Drag to reorder, × to remove.
- One row of controls: curve · Loop / Ping-pong / Once · loop length.
- Two steps or more and the stage plays the morph.

**Editing a step:** click it. Its settings go on the stage, the transport pauses, and the sliders write to that step. Press Play, or leave the tab, and the morph rebuilds from the steps and runs again.

**Save** in the Morph tab saves a morph file. It appears on Home like any file and opens back into the Morph tab. The randomiser can open and play a morph file; building one is labs' job.

**The File tab** is files again: save, load, export. Morph… leaves it.

## What is stored

- Every saved file gets a `mode`: `editor` · `labs` · `morph`. Home shows it, filters by it, and opens the file in the right place. Files saved before this keep today's guess (one generator layer → labs, else editor). The randomiser saves nothing to the library, so there is no randomiser kind.
- A morph file holds its steps as **copies** of the settings, each with a note of where it came from (preset id or file id, for the label), plus curve, cycle and loop length. Copies, not pointers: a pointer breaks the day its file is renamed or deleted.
- Playback is the keyframe tracks `buildMorph` already makes; the steps are the source, the tracks are rebuilt from them.

## Limits, phase 1

- One generator per morph. Mixing generators needs a crossfade (plan 05 § 3).
- The randomiser's Morph tab is read-only: the steps and the three controls.

## Steps

1. `mode` on saved files — written by every save, read by Home and `?open`.
2. New File → the four doors. Closes the open New File bug.
3. The Morph tab in labs: empty state, steps, controls, the editing rule, Save.
4. Open a morph file from Home into the tab; the randomiser plays one.
5. Morph… leaves the File tab.
6. Walk on the built bundle: new morph from presets, add a file as a step, reorder, edit a step, save, reopen, play in the randomiser, zero console errors.
