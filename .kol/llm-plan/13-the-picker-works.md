# Plan — The step picker works, on the assets we have

**Status:** DONE 2026-10-08, walked on the built bundle desk + phone. Step picker on `ShellSearchOverlay`; the browse version in `_tmp/2026-10-08-step-picker-browse/`; a Morph door on the phone's chooser card (it covers the rail there); arriving on /morph unfolds the right rail; the three patches are in production D1. Password stays the user's. Follows plan 10, whose step picker is wrong twice over.
**Origin:** user, 2026-10-08, on the live site and after — verbatim:
- *"what is this?????? are we for real right now????"* (the step picker on `fxr.kolkrabbi.io/labs`)
- *"you know this is the search modal dialog … and this is the picker … how did you get from there to what you made??"*
- *"it is a version of file browser, so we can accommodate in the style of DS … even if we build a new component for it"*
- *"we dont need it to look exactly like that … I just want you to USE THE ASSETS AVAILABLE … we dont need 3 views and a filter system, we just need to make the picker WORK"*

## 0. What is wrong

- **Live (pushed):** `StepPicker.jsx` is a hand-built list on a scrim — no panel, the × on top of the toggle, rows in the display face. No reference behind it.
- **In the tree (not pushed):** the same picker moved onto `MediaLibrary variant="browse"` — the Files surface, with three views, filters, folders and a settings gear. A file manager for a job that is *find a preset, add it*.

## 1. The asset

`ShellSearchOverlay` (kol-component 0.244.0, `organisms/ShellSearchOverlay.jsx`) — the ⌘K search modal the user pointed at. It already does every part of the job and nothing more:

| need | the overlay's own prop / behaviour |
|---|---|
| a modal over the page | dim + centred panel, focus trap, focus back to the opener |
| find by name | `SearchInput` on top; `query` / `onQueryChange` |
| grouped by generator | rows carry `group` → one heading per group, first-seen order |
| something to pick before typing | `suggestions` — the rows shown while the query is empty |
| keyboard | ↑ ↓ rove, Enter picks, Escape closes |
| say what Enter does | `selectLabel="Add step"` |
| a pick | `onSelect(row)` |

No new component, no new CSS.

## 2. The rows

- **Current stage** — one row, top, group *Stage*, while the stage holds a plain generator (fewer than two steps, or a step being edited).
- **Every catalog preset** — `group` = its generator (*Simple*, *Scanline*, …), `label` = the preset, `hint` = its sub-category.
- **My files** — saved labs files, randomiser rolls included (they save as labs), group *My files*.
- **Blend mode after a first step** — that generator's rows only (one schema to tween). Shape mode — everything.
- **Search** — label, group and hint, case-insensitive; the overlay underlines the match.

## 3. Steps

1. `StepPicker.jsx` → `ShellSearchOverlay` over the rows above; `onSelect` adds the step (the first also puts its generator on the stage) and closes. Keep the three `stepFrom*` builders as they are.
2. The browse-panel version → `_tmp/2026-10-08-step-picker-browse/`. Files keeps the browse panel — it needs rename, delete, export.
3. Walk on the built bundle, desk 1600 + phone 390: empty slot → the modal → type *star* → ↓ → Enter → step 1 on the stage → again with *spiral* → the morph plays → Escape closes → Blend lists one generator → a saved roll appears under *My files* → 0 console errors.

## 4. The rest of the arc, in the same pass

| item | state |
|---|---|
| Morph a rail destination at `/morph` (`NAV_ITEMS`, the route, Home + New File open there; the labs-only row gone) | built, desk walked; phone walk owed |
| Randomiser **Save…** (Output tab) → a labs file | built, not walked |
| **⌘S** = Save patch in labs · morph · randomiser, on the shortcuts sheet | built; labs ⌘S walked, randomiser not |
| Three patches on Home when signed in | blocked — an overlay intercepted Save current during the run; find it, then make them through the app and put them to production D1 |
| Password | the user's: `pnpm exec wrangler secret put ADMIN_PASSWORD --config api/wrangler.toml`; then `api/.dev.vars` and the card match |

## 5. Done when

Every row of § 4 walked green with § 3's walk, one report line each, then the user pushes.

## 6. Review — 2026-10-08, Fable, before the build

Verified against kol-component 0.244.0 and this tree. Read before step 1.

1. **The list scrolls, so every preset can be a suggestion.** The overlay's results pane is `h-80 overflow-y-auto` (`ShellSearchOverlay.jsx:261`): ~380 rows scroll inside a 320px pane. Pass them all as `suggestions`, in catalog order — *Current stage* first, *My files* second, then the generators. Do not cap or paginate.
2. **Prefix the row ids.** `id` must be unique across presets, files and the stage row: `preset:<id>` · `file:<id>` · `stage`. A preset id and a file id can collide.
3. **The overlay closes itself after a pick** (`onClose` fires "post-select"). `onSelect` adds the step; `onClose` clears `morph.picker`. Do not also clear it in `onSelect`, or the second call races the first on a fast double Enter.
4. **The blocker on the three patches was the DS `Modal`, not the shortcuts sheet.** The element that intercepted *Save current* was a bare `<div class="kol-overlay-scrim">` — that is `Modal.jsx:91`, a `useModal` prompt/confirm, portalled to `document.body` above the Files dialog. On a second visit to `/labs` with a draft present it is the *Restore your last canvas?* confirm. Make the patches from `/labs?new=1` (the restore prompt stands down for `?new`), or answer the confirm first. Labs' own `S` binding guards `metaKey` (`LabsView.jsx:433`), so ⌘S does not open the sheet.
5. **Correction to § 4:** the ⌥ digits moved — Morph is ⌥5, Randomiser ⌥6, Settings ⌥7. `KEY_ORDER` derives from `NAV_ITEMS` so the handler is right; the comment at `keymap.js:91` ("the rail's ⌥6") and the AppLayout docblock still say the old digits. Fix the two comments in the same pass.

Not a trap, a note: typing in the overlay's field must not fire labs' single-letter keys (R · space · M). The overlay's input is a real `<input>`, and labs' handlers guard on `tagName === 'INPUT'` — step 3's walk types *star* with a layer on the stage, which proves it or catches it.
