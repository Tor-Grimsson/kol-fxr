# Plan — The bar and the status line, back on the spec

**Status:** BUILT 2026-10-13 — §§ 1–12, walked on `vite preview` (§ 13). The spec and gap matrix are amended (§ 11).
**Origin:** user, 2026-10-13, after plan 28 shipped: the status-bar name input (*"it should be in file save as"*), the Navigator (*"shouldnt it be a pane? like affinity"*), the logo (*"too big"*), settings (*"should be in the name … usually its command + comma"*), the Tools menu (*"I specifically said fold effects and generative and type and pattern into tools"*), flyout width (*"why is it wide there but not here"*), the footer (*"transport doesnt need to show by default, just with the timeline"*). And the standing complaint: *"we had a huge audit, there must have been research behind it, do we have to reinvent the same shit every time?"*
**The law this plan answers to:** `.kol/llm-context/audit/2026-10-10-editor-spec.md` (the spec, R-rules), `2026-10-10-I-gaps.md` (the gap matrix), plan 24 (the gaps closed). Every section below says which rule it **fulfils**, **amends** or **restores**. § 11 edits the spec so the next plan starts from the current law.

## 0. What the audit already settled — read before anything else

| Rule / row | What it says | Where plans 28–29 stand |
|---|---|---|
| R1.1 | Top bar = mode door · menus · cog. The menus listed are the six that existed (Generative · Effects · Tools · File · Canvas · Templates) — **R1.1 recorded the bar, it never designed it.** The user's 8 asked for "a standard setup"; the spec answered only by removing the name field. | Plan 28 designed it (Affinity's order). R1.1 is stale: **amend** (§ 11). |
| R1.2 | File name + zoom in a status bar, Affinity's `<Untitled> @ 130%`. The spec **added** "click to rename" — Affinity's bar is read-only. | The input the user objects to is that addition. **Amend** (§ 1). |
| R1.6 | Timeline dock only when a track exists. | Plan 28 § 17 enforced it; the Window › Timeline pin is a deliberate opt-in on top. Holds. |
| R2.1 | Left rail: Layers · Assets, Color · Stroke · Swatches, footer Transport · Output · File. | Transport joins the footer only with the dock. **Amend** (§ 9). |
| R2.4 | Flatten / Release live in "the Tools menu they already have". | Plan 28 renamed that menu **Vector** (Affinity) and did not update R2.4. **Amend** (§ 11). The new **Tools** is a different menu (§ 7). |
| R3.1 + memory | Footer strip is a `SegmentedToggle` by user choice; spec rules never silently swap it. | Holds. § 9 changes which tabs it holds, not the control. |
| Plan 24 § 6 | History = a tab in the left rail. Built as Layers · Assets · History. | Holds. |
| Plan 24 § 7 | **Navigator = "a tab beside History"**, live thumbnail, drag to pan. | **The build drifted**: it shipped as a status-bar popover (gap row 28 records the as-built, not the decision). § 2 **restores** plan 24 § 7. |
| Gap row 28 | Navigator "present". | Present, but drawn without the canvas fill and memoised on `layers` (§ 3). Re-graded in § 11. |
| Gap rows 13 · 20 · 31 | Convert to path, Blend, masks under "Tools menu". | Now Vector / Layer. Re-worded in § 11. |
| R3.2 | Every mode strip inside a pane is a `SegmentedToggle` — "not a dropdown (the Colour mode picker is a dropdown today)". | **The user's reference was the dropdown** (Affinity's `RGB ▾`); R3.2 was not one of the seven questions, so the swap went through unasked, the same class as the footer strip (memory). § 12 **restores** the dropdown and scopes R3.2. |

Nothing in the references puts creation under File (File › New is a document everywhere), and the references do put new layers under Layer (Affinity `Layer › New Fill Layer`, Photoshop `Layer › New ▸`) — which is where plan 28 put them. The user's ruling overrides that with a Tools menu (§ 7); the plan says so instead of re-arguing it.

## 1. Status bar — the name is read-only · amends R1.2
- **References:** Affinity `<Untitled> @ 130%`, Illustrator's artboard + zoom. Neither is editable in place; renaming is Save As.
- **Change:** `StatusBar.jsx` drops the `Input`. Plain `kol-helper-10` text: `Untitled @ 100%`, then `*` while the document is dirty (`currentPresetId && canUndo`, the signal `confirmReplaceIfUnsaved` already trusts). The `%` keeps its click-to-reset.
- **Rename** lives in **File › Save as…** only — it already opens the Files dialog on its name field (plan 28 § 1).

## 2. Navigator — a pane tab · restores plan 24 § 7
- **References:** Affinity groups Transform · Navigator · History in one pane; a zoom row (− · slider · + · `%`) sits above the thumbnail.
- **Change:** `LayersAssetsPanel` tabs become **Layers · Assets · History · Navigator**. `NavigatorPanel` renders inside the tab with the zoom row on top (the slider drives the viewport's own zoom — `kol:zoom-at`, the idiom the Hand tool already uses). The status bar loses its Navigator button; `Window › Left rail › Navigator` opens the tab (the `useOpenTab(['Navigator'])` listener moves from `StatusBar` to the pane).

## 3. Navigator thumbnail — the fill and the tick · fulfils plan 24 § 7 ("live thumbnail")
- **Corrected 2026-10-13 (rosa pass).** The thumbnail is not blind to generators: `build.js` snapshots every live `canvas[data-layer-id]` into the SVG (`:163,423,491`), and the plan 28 walk shows a Stripes loop drawn in it. Two real defects:
  1. **No canvas fill.** `NavigatorPanel.jsx:28` passes `{ layers, palette, aspect, customRatio, canvasW, canvasH }` and never the canvas fill, so a black-canvas document draws as the pane's grey box — the "empty" Navigator the user saw.
  2. **Stale frame.** The SVG is memoised on `layers`, so an animating loop keeps its first snapshot until something is edited.
- **Change:** pass the resolved `bgColor` (`CanvasArea.jsx:154-156` — `resolveColor(canvasFill, palette)` with opacity) into the build as the frame's background rect; rebuild the snapshot on the existing 100 ms viewport tick, throttled to ~2 fps, only while the tab is open. No new compositor; `buildLayersSvg` stays.
- **Check:** a black canvas with nothing on it shows black; a loop layer moves; a photo with an effect and a kinetic layer both show.

## 4. The logo — a mark, not a menu · amends R1.1 (the mode door moves, § 5)
- **References:** the Apple mark is the system's menu; a web app has no system to open. Figma's top-left mark opens its main menu *because it has no app-name item* — we will (§ 5).
- **Change:** `Logomark size={16}` (the bar's text is 12px; 20 read as a logotype), not interactive, flush left where it is.

## 5. The app-name menu · amends R1.1 (mode door + cog)
- **References:** macOS app menu — bold app name, `About`, `Settings… ⌘,`, then app-wide destinations (Affinity: `Home`, `Studios ▸`). kitty and Affinity screenshots in chat.
- **Change:** a bold **Effexor FXR** `MenuItem` after the logo, before File. Rows: **Home** (`/`) · **Chromes ▸** (Library · Editor ✓ · Labs · Randomiser · Morph — the rail's order) · — · **Settings…** (`,`, § 6). The plan 28 logo menu's rows move here; **the cog at the right end retires** (R1.1's "settings cog" is superseded).
- **Labels are the app's own vocabulary, not new copy:** *Effexor FXR* is `APP.name` in `AppLayout.jsx`; *chrome* is the word the app already uses for its three surfaces (`CHROME_PICKS` "Open a chrome", `CHROME_PATHS`, the Home card "Pick a chrome"). No ruling needed.

## 6. Settings and ⌘,
- **References:** every Mac app opens Settings on ⌘,.
- **The constraint:** in Chrome and Safari on macOS, ⌘, is the **browser's** Settings shortcut and is reserved — a page never receives the keydown, so it cannot be bound. (The same class as ⌘T · ⌘W · ⌘N.)
- **Change:** the row shows the key the app can honour — the bare `,` already in the keymap (`settings-drawer`). No new binding; no promise of ⌘,. If the app ever ships in a desktop wrapper, ⌘, is one keymap row then.

## 7. A Tools menu — creation folds here · user ruling 2026-10-13
- **Ruling:** *"fold effects and generative and type and pattern into tools"*, *"new is never in layer, layer is editing"*. Plan 28 § 15 misread this as "fold into Layer › New"; corrected here.
- **Change:** a top-level **Tools** between Vector and View (Affinity's Pixel slot): **Generative ▸** (plan 28 § 4a's eyebrow + method parents, unchanged) · **Pattern ▸** (Moiré · Mesh Gradient · Reaction · Halftone) · **Type ▸** (Text tool `T` · Kinetic type ▸ · Para Type ▸) · **Effects ▸** (plan 28 § 4b, greyed with no selection) · — · **Insert image**.
- **Layer** keeps the edit verbs only: group · ungroup · align ▸ · flip · mask · lock · visibility. `New ▸` and `Effects ▸` leave it.
- **File › New** stays the new-document row (every reference).
- **Vector** stays as plan 28 built it (booleans · Release boolean · Convert to path · Blend…) — R2.4's "Tools menu" meant this menu; § 11 renames it in the spec.
- **The bar:** `[logo]  Effexor FXR  File  Edit  Layer  Text  Vector  Tools  View  Window  Help`.

## 8. Flyout width — a bug
- **Seen:** flyouts with `scroll` (Starters, Aspect, preset lists) stretch to the 320px cap; flyouts without it (Library) hug their text. Same component (`menus/MenuFlyout.jsx`); the only difference is `max-h-[60vh] overflow-y-auto` on the `w-max` panel.
- **Fix:** every flyout hugs its text (min 180 · max 320). Measure Starters beside Library before and after; if the scroll container is what inflates `max-content`, move the scroll onto an inner wrapper and keep the sized box non-scrolling.

## 9. Transport only with the timeline · amends R2.1
- **Ruling:** *"transport doesnt need to show by default, just with the timeline right?"* — yes: the transport drives the clock the dock shows.
- **Change:** `TimelineDock`'s gate (a track exists · Window › Timeline pinned · the Morph rail is up) becomes one hook, `useTimelineUp()`, that the dock and `EditorFooter` both read. Footer tabs: **Output · File** at rest, **Transport · Output · File** while the dock is up; opens on Output at rest, on Transport when the dock is up at mount. If the dock appears while Output is open, the tab stays put and Transport joins the strip. `Window › Left rail › Transport` greys while the tab is absent. The strip stays a `SegmentedToggle` (memory).

## 10. Verification
On `vite preview`, 1600×1000, light and dark, 0 console errors:
- Status bar reads `Untitled @ 100%`; `*` after an edit, gone after Save; File › Save as… renames; no input in the bar.
- Left rail tabs Layers · Assets · History · Navigator; the Navigator shows the canvas fill, a moving loop, an effect and a kinetic layer; drag pans; the zoom row zooms; no Navigator button in the status bar.
- Logo 16px, inert. **Effexor FXR** › Home / Chromes › each / Settings… all work; `,` opens the drawer; no cog.
- Tools holds Generative · Pattern · Type · Effects · Insert image; Layer has no New / Effects; File › New is the document; Vector unchanged.
- Starters, Aspect and Library flyouts each hug their text.
- Footer is Output · File with no tracks; pin Window › Timeline and Transport joins; unpin and it leaves.
- Color pane: one dropdown top-right beside the swatches (Hue · Wheel · HSL · RGB), no strips; each view works; Generate · Style · Animation and Effect · Motion strips untouched.

## 11. Amend the law — the spec and the gap matrix, same build
The reason this keeps feeling reinvented: plan 28 changed the bar and did not edit the rules that describe it. This plan edits them. In `2026-10-10-editor-spec.md`:
- **R1.1** → "The top bar holds the **logo mark**, the **app-name menu** (Effexor FXR: Home · Chromes ▸ · Settings…), and the **menus** File · Edit · Layer · Text · Vector · Tools · View · Window · Help. Nothing else. (Plan 28 set the order on Affinity's; plan 29 added the app menu and retired the cog.)"
- **R1.2** → drop "(click to rename)"; add "read-only; `*` while dirty; renaming is File › Save as…".
- **R1.6** → add "or Window › Timeline is pinned, or the Morph rail is up".
- **R2.1** → footer "Output · File, plus Transport while the timeline dock is up (R1.6)".
- **R2.4** → "Flatten / Release → the **Vector** menu" (was "Tools").
- **R3.2** → scoped: "the Generate · Style · Animation and Effect · Motion strips are `SegmentedToggle size=\"sm\" tone=\"sunken\"`. The Color pane's view picker is a **`Dropdown`** top-right beside the swatches (Affinity's `RGB ▾`) — the user's reference; the 2026-10-10 strip was a consistency swap, reverted by plan 29 § 12."
In `2026-10-10-I-gaps.md`: rows 13 · 20 · 31 say **Vector** / **Layer**; row 28 says **left rail tab** and is re-graded after § 3.
Plan 28 § 0 gets one line pointing here for the Tools correction, so its "eight menus" paragraph isn't read as current.

## 12. Color pane — the view picker is a dropdown again · restores the user's reference, amends R3.2
- **Found 2026-10-13** (user: *"was this always a segmentedtoggle? I thought it used to be a dropdown … this was the original reference, how did it change?"*). It was a 110px `Dropdown` (`ColourPanel.jsx:43` still says so). Spec R3.2 made every in-pane mode strip a `SegmentedToggle` and named this picker as the one to convert; plan 23 built it. R3.2 was outside the seven questions, so no ruling covered it — the footer-strip class of swap (memory: *spec rules never silently swap user-chosen controls*).
- **References:** Affinity's Color pane — swatches left, `RGB ▾` dropdown top-right (RGB · RGB Hex · HSL · CMYK · LAB · Grayscale), then the sliders. One control picks the model; no strip.
- **Change:** `ColourPanel.jsx` — the swatch row gets a `Dropdown` at its right end (DS `Dropdown`, `size={cs}`, `variant="subtle"`, as the footer's aspect dropdown) with **Hue · Wheel · HSL · RGB**. The Hue · Wheel · Sliders strip (`:44`) and the HSL/RGB `ModelToggle` strip (`:181,192,200-205`) both retire — `SlidersMode` takes the model from the dropdown's value. Bodies unchanged.
- **Scope:** only the Color pane. Generate · Style · Animation and Effect · Motion stay strips — those the user chose (R3.2's remaining scope, § 11).

## 13. Build record (2026-10-13)
Walked on `vite preview` at 1600×1000, light and dark, 0 console errors. Evidence in `_tmp/2026-10-13-plan-29-walk/`.
- **§ 1:** `Untitled` → `Untitled*` after an insert → the file's name with no `*` after Save. The mark is `compose/savedMark.js`: `markSaved` runs in `buildSavedSpec` (every save goes through it) and when `currentPresetId` changes (opening a file). It compares the layers **and the canvas** (aspect, size, fill, fill opacity, backdrop), so any unsaved change shows the `*`, as in Affinity. The clean baseline is taken one frame after mount or open, after the canvas height settles to the aspect. Walked: a fresh document reads `Untitled`; an aspect change gives `Untitled*`; Save clears it; a canvas fill change sets it again; ⌘S clears it.
- **§§ 2–3:** Navigator is the left rail's fourth tab; Zoom in moved 100% → 125%; a black canvas draws black; the loop draws and re-takes at 2 fps. The thumbnail sits in a fixed 200px stage (`width: min(100%, 200 × ratio)`) — full width, a portrait frame was taller than the pane and squeezed the Color pane.
- **§ 4–5:** logo a 16px inert `span`; **Effexor FXR** bold, Home → `/`, Chromes ▸ lists all five and navigates; no cog.
- **§ 6:** Settings… and `,` both open the drawer.
- **§ 7:** Tools holds Generative ▸ · Pattern ▸ · Type ▸ · Effects ▸ (greyed with no selection) · Insert image; Layer holds Group · Ungroup · Align ▸ · Flip · mask · Lock · Visibility.
- **§ 8 — the cause:** not the scroll. `MenuDropdownItem` is an `inline-flex` button, so bare rows in a `w-max` panel measured as one inline line (5 starters ≈ 795px) and hit the 320 cap; Library's rows sit in `div`s and measured right. The flyout panel is `flex flex-col` now: Starters 192, Aspect 180, Library 180, preset leaves 180.
- **§ 9:** editor footer Output · File at rest; Window › Timeline pinned → Transport joins; unpinned → it leaves; Window › Left rail › Transport greys at rest. **Labs and Morph keep Transport · Output · File** — the gate is `currentView() === 'editor'`, because the labs loop plays on the transport with no track.
- **§ 12:** one Dropdown (Hue · Wheel · HSL · RGB) top-right in the swatch row; HSL shows H · S · L, RGB shows R · G · B; both strips gone.
- **§ 11:** spec rows R1.1 · R1.2 · R1.6 · R2.1 · R2.4 · R3.2 rewritten with their amendment dates; gap rows 13 · 20 · 28 · 31 re-worded; plan 28 carries a superseded-in-part note.
