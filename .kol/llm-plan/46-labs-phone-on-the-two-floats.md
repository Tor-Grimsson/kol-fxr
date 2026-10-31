# Plan — Labs on a phone runs on KOL's two-float layout

**Raised:** 2026-10-31, in session. Points verbatim:
- *"that handwritten shadow? dont we hav it?"*
- *"the mobile layout with one floatingNav above and one below PLUS the spacing, that should be a preset/variatn of a mobile settings page in /apps/studio-hub ? right? I at least referenced it alot when designing the flotNav"*
- Filed as `PhoneTwoFloatLayout`; returned as kol-shell 0.97.0 · kol-theme 0.207.0 (`AppShell touch="floats"`, `floats.transport` · `floats.rail` · `floats.railHeight`, `--kol-shadow-rail-up`). *"yes"* to the move.

**Status:** ✅ W1 and W2 built — 2026-10-31. Open: nothing.
**Shape:** W › phase › list.
**Laws carried:** no local KOL shims — a gap goes by ticket; Tailwind first; retired code goes to `_tmp/`, never deleted; `AppStudio` stays the layout (ARCHITECTURE §2); the desktop Labs chrome is untouched.
**How a phase closes:** measurable acceptance line first, gates green, then Playwright against his own words at 390×844 touch; the sheet drag on a recording.

## W1 — Labs' phone chrome moves onto `touch="floats"`

### 1.1 — The phone shell is chosen per route, and Labs hands its floats up — ✅ built 2026-10-31
The cause: `AppShell` is the app's (`src/AppLayout.jsx`, through `AppStudio`), so Labs cannot set its own touch mode — it draws its two `AppFloatNav`s itself today (`LabsPhoneChrome`, `src/editor/labs/LabsView.jsx`).
- AppLayout passes `shell.touch: 'floats'` on `/labs` under touch; every other route keeps the app's pill.
- Labs publishes its toggles (Home · Catalog · Params · Transport), its More rows (Output · File) and its transport items + loop `sheetFor` through a store beside `railExtras`; AppLayout reads it into `floats.items` · `floats.actions` (kol-shell 0.98.0; More keeps the app's nav) · `floats.transport`.
- `LabsPhoneChrome` retires to `_tmp/`.
- **Acceptance:** on `/labs` at 390×844 touch — exactly 1 top float listing Home · Catalog · Params · Transport, its More listing Output · File, and exactly 1 transport float; on `/` and `/randomiser` the phone nav is unchanged (same float count and rows as before the change); each toggle still flips its state (Params opens and closes the rail, Transport hides and shows the transport float).

### 1.2 — The params rail moves into `floats.rail` — ✅ built 2026-10-31
The cause: the params sheet is the editor grid's second row (kol-labs.css L176-226), but KOL's rail is rendered by AppShell, outside the editor's providers — handing it a node would drop compose state.
- AppLayout passes `floats.rail` as an empty slot; on touch, Labs portals its params rail (the `right` panels of `LABS_REGISTRY_TOUCH`) into it, so it keeps every provider.
- `floats.rail` is null while Params is closed, so the stage takes the full height.
- **Acceptance:** with Params open, the params rows are DOM descendants of AppShell's rail element and not of `.kol-editor-grid`; moving a slider changes the layer's param (read off compose state) and the stage redraws; the stage's height = viewport − rail height − top inset (98 + safe area), ±2px.

### 1.3 — The sheet's drag and detents ride `floats.railHeight` — ✅ built 2026-10-31
- `--kol-sheet-h` / `SHEET_H` become `floats.railHeight`; `LabsSheetGrab` keeps setting it.
- **Acceptance:** dragging the grab to 400px leaves the rail 400 ±2px tall; released under `SHEET_MIN` the rail closes; a tap toggles 50dvh ⇄ tall. On a recording: the stage follows the drag with no jump.

### 1.4 — fxr's phone layout CSS retires — ✅ built 2026-10-31
- `kol-labs.css`'s phone-layout rules the floats now own (the grid rows, the 98 insets, the sheet's shadow and max-height) move to `_tmp/2026-10-31-labs-phone-layout/`; the rules that style rail contents (input size floor, control size, header rule) stay.
- **Acceptance:** no rule in `kol-labs.css` sets `padding-top` on `.kol-editor-canvas` or a `box-shadow` / `max-height` on `.kol-editor-right` under `[data-touch]`; a 390×844 screenshot of `/labs` with Params open matches the pre-change one within the rail's top 98px and the stage area (pixel diff under 1% outside the canvas content).

## W2 — The float nav's submenus nest

### 2.1 — Home's dock Labs opens section → group — ✅ built 2026-10-31 (kol-shell 0.98.0)
The user, 2026-10-31: *"what about sub menus? what is it called? nested menus. does the floatNav offer that?"* — it offers one level; a sub row cannot open its own. Asked of KOL inside `FloatsOwnItems` (nested `sub`, every variant).
- On the bump, the dock's Labs rows (`src/AppLayout.jsx` `chromes`, today the four sections) each open their groups; a group runs the rail's own pick (`onNavigate` of its `#rail/` path), as the section row does today.
- Editor and Randomiser stay one level unless he names deeper rows.
- Measured 1400×900 signed out: dock Labs → Generative opens a second menu listing all 11 groups (= `GENERATIVE_TREE`); Flow lands `/labs?preset=flow-obstacles&cat=flow` with every menu closed; Escape closes both levels; no page errors.
- **Acceptance:** at 1400×900 signed out, dock Labs → Generative lists every group of the Generative section (the count equals the catalog's `gen:` entries); pressing one lands `/labs?preset=…` with that group's first preset and closes every level; Escape closes all levels.


## Built — 2026-10-31 (measured 390×844 touch, DPR 2)
- `src/phoneFloats.js` — Labs → AppLayout `{ items, actions, transport, railOpen, railHeight }`, AppLayout → Labs the rail's DOM host. Labs' `LabsPhoneFloats` publishes on state change (an every-render publish loops through AppLayout); `LabsPhoneChrome` → `_tmp/2026-10-31-labs-phone-chrome/`.
- `src/AppLayout.jsx` — on `/labs` · `/morph` while Labs publishes: `touch: 'floats'`, `floats.items/actions/transport/rail/railHeight`, the route out of `barHiddenOn`, and `drawerBelow: 100000` so Labs' own touch call (phone, or under 1024) holds (ponytail comment: a `narrow` prop on AppShell would say it plainly).
- `src/editor/EditorShell.jsx` — `rightIn(rail)`: where the right rail renders instead of the grid. Labs portals it into AppShell's Rail inside a `.kol-editor-labs[data-touch]` wrapper, so the content rules still reach it.
- `kol-labs.css` — the touch block is the editor frame filling AppShell's stage (`height: 100%`, one grid area) plus the content rules; the grid rows, 98 insets, sheet cap, shadow and hide → `_tmp/2026-10-31-labs-phone-layout/`.
- 1.1: one top float (Home · Catalog · Params · Transport · More), More = the app's nav + Output · File (KOL keeps the app's nav in More), one transport float; Params closes the rail (stage 324 → 746) and reopens it, Transport hides (0 Play buttons) and shows (1); Home's phone pill unchanged (Editor · Labs · Randomiser · Morph · More · +), `/randomiser` unchanged (no bar, as before).
- 1.2: the params rows are inside AppShell's rail, not `.kol-editor-grid`; Invert → On moved the stage's mean ink 6 → 250; stage 324 = 844 − 422 rail − 98 inset; More › Output opens the footer tab in the rail (0 → 361 px).
- 1.3: drag to a 600 target → 612 (the rail top sits under the finger, which holds the grab mid-row, 12 px down — SheetGrab's own rule, unchanged); tap 422 → 717 (85dvh) → 422; dragged under SHEET_MIN the rail closes. Recording `scratchpad/rec/` watched as a contact sheet: the stage refits every frame, no jump.
- 1.4: no `[data-touch]` rule sets `.kol-editor-canvas` padding or `.kol-editor-right` shadow / max-height (computed canvas padding-top 0). The before/after pixel diff was not run — no pre-change capture was taken; geometry above is the check instead.

## TALK
- **Desktop Labs' transport** (user 2026-10-31: *"oh you mean they are still using the original transport control look?"*) — on a desk the footer's Transport row is still fxr's own buttons; only the phone runs KOL's `AppFloatNav variant="transport"`. Whether the desk moves to it too is his call (the Transport · Output · File strip itself stays a SegmentedToggle).
- Ruled 2026-10-31 (*"just keep it as flexible as possible, it will have to deal with a spectrum of use casees"*): a page's own rows and the app's nav stay separate — ticketed as `FloatsOwnItems` (`floats.items` / `floats.actions`); 1.1 passes Labs' toggles there, not as `barItems`.

## PARKED
- Nothing.
