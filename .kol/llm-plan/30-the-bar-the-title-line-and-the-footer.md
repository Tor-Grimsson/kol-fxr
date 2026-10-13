# Plan — The bar, the title line and the footer

**Status:** BUILT 2026-10-13 — §§ 1–15, walked on `vite preview` (dark + light, 0 errors; evidence `_tmp/2026-10-13-plan-30-walk/`). §§ 12–13 adopted as kol-component 0.253.0; one follow-up filed (`SelectionOverlayLabelClearsRotateHandle`). Journal: `.kol/llm-context/playbook/2026-10-13-plan-30-the-bar-the-title-line-and-the-footer.md`.
**Origin:** user, 2026-10-13, walking plans 28–29 live with references in hand: the logo (*"wasn't the point of having the logo here to be interactable?"*), the menu panel (*"clipping or different color than menu"*; macOS and Firefox menus as the reference: *"much darker background … tertiary? or just absolute? … font sans … 100% opacity … slight almost not noticeable shadow? or border? or both?"*), the bar's height against kitty's, the canvas (*"still very hard to select … especially around the aspect number 4:5"*), the footer (*"when I say transport I mean the entire goddamn thing … remove this thing from editor"*), the status bar (*"why does it say untitled? this is where untitled would go! middle above ruler. and reset zoom button, why??? it's just noise"*), and the name (*"do we call it effexor or fxr? I thought fxr?"*).
**The law this plan answers to:** `.kol/llm-context/audit/2026-10-10-editor-spec.md` (R-rules), plan 29 (the bar as built). Each section says which rule it **amends** or **fulfils**; § 11 edits the spec so the next plan starts from the current law.
**Memory:** `match-the-reference-first` — a reference screenshot is the instruction; DS laws are a footnote.

## 0. What is already settled — read before anything else

| Rule / plan | What it says | Where this plan stands |
|---|---|---|
| R1.1 (amended 2026-10-13) | Logo mark **inert**, app-name menu, nine menus, `h-12`, `MenuItem size="md"`. | The inert logo was plan 29 § 4's call, not the user's. **Amend**: logo → Home, name → menu (§ 1); `h-8` + `sm` triggers (§ 3). |
| R1.2 (amended 2026-10-13) | File name in a **status bar under the canvas**, `%` click resets zoom. | The user's reference (Affinity) has it **above the ruler, centred, read-only**, no button. **Amend** (§ 5). |
| R2.1 (amended 2026-10-13) | Left rail footer **Output · File**, Transport with the dock. | The whole footer follows the dock's gate — off by default, Transport · Output · File together when the timeline is up; **Labs keeps it always**. **Amend** (§ 6). |
| R3.1 + memory `footer-strip-is-segmentedtoggle` | The footer strip is a `SegmentedToggle`. | Holds in Labs, the only place the strip remains. |
| Plan 29 § 5 | The app menu is the bold name: Home · Chromes ▸ · Settings…. | Holds. § 1 only changes what the logo does. |
| Plan 04 § hub | `APP.name = 'Effexor FXR'` (AppLayout), copied to the manifest (plan 11) and the og tags (plan 25). | Nothing in `docs/` calls the app Effexor; the vault, the repo and the domain say **FXR**; the manifest's `short_name` is already `FXR`. **Ruling** (§ 2). |
| DS `.kol-popover` | A floating panel carries `oq-04` border + a two-layer shadow. | `MenuItem` opts out (`panel={false}`), which is why the menu has neither — the reference look is **inside the DS's own law** (§ 4). |

## 1. The logo goes Home, the name opens the menu · amends R1.1
- **References:** the user: *"just logo should go to home, and name should open menu."* Affinity's top-left mark is the Home door; the bold name is the app menu (plan 29 § 5).
- **Change:** `MenuTop.jsx` — the `Logomark` wraps in a button (`aria-label="Home"`, same 16px) that calls `navigateTo('/')`; hover ink `text-emphasis`. The `Effexor FXR` / `FXR` `MenuItem` stays the app menu, unchanged rows. Plan 29 § 4's "a mark, not a menu" is superseded.
- **Check:** click the logo → Home; click the name → Home · Chromes ▸ · Settings….

## 2. The name — FXR · ruled
- **Where it lives:** `src/AppLayout.jsx` `APP.name` (Home's header, Settings' About, the app menu via plan 29 § 5), `index.html` `<title>` + `og:title` + `twitter:title`, `public/manifest.webmanifest` `name`, `src/editor/mobile/MobileView.jsx:54` (the touch chrome's wordmark line).
- **Proposed:** `FXR` in all five. `short_name` is already `FXR`. The subtitle, the About prose and the links do not change.
- **Ruled 2026-10-13:** FXR (the user: *"yes fxr > effexor"*).

## 3. The bar's height · amends R1.1
- **References:** macOS menu bar (kitty screenshot) — 24px; ours is 48 (`h-12`, `md` triggers at 32).
- **Change:** `kol-editor-topbar` `h-12` → `h-8`; every `MenuItem size="sm"` (26 on the ladder). Padding `px-4` stays; the logo button sits in the same row.
- **Check:** the bar reads as a menu bar, not a toolbar; the ToolPalette row below is unchanged.

## 4. The menu panels — the reference look · fulfils the user's references, inside DS law
- **References:** macOS (image 4) and Firefox (image 6) menus: panel darker than the bar, sans face at full ink, ~24px rows, a hairline and a soft shadow, 8px radius. Ours (images 3, 5, 7): `bg-surface-secondary` (#19191d — *lighter* than the bar's #121215 in dark, so the panel edge reads as a cut), `kol-helper-12` mono at `fg-body` (64%), 32px rows, no border, no shadow.
- **Change:** one scoped block in `src/editor/styles/kol-editor.css`, reached through `panelClassName="kol-editor-menu …"` on every bar `MenuItem` (the flyouts are DOM children of the panel, so one scope covers every level):
  - panel + `[role="menu"]` flyouts: `background: var(--kol-surface-tertiary)` (#0e0e11 dark / #fff light — darker than the bar in dark), `border: 1px solid var(--kol-oq-08)`, the DS popover's shadow (`0 8px 24px -8px rgba(0,0,0,.4), 0 2px 6px -2px rgba(0,0,0,.3)`), `border-radius: var(--kol-radius-sm)`;
  - rows (`.kol-menu-btn`): `font-family: var(--kol-font-family-sans)`, 13px, `color: var(--kol-fg-emphasis)` (100%), `height: 26px`; disabled keeps `opacity-40`; the trailing shortcut keeps `kol-helper-10` (a key label is mono everywhere in the app);
  - dividers and eyebrows unchanged.
- **Owed to the DS:** once the user settles the look, it goes to kol-ds-ui as a `MenuItem` tone (`tone="bar"` or the panel reading `--kol-tone-*`), and the local block retires to `_tmp/`. Not filed before the look is settled — the point is to iterate here first.
- **Filed 2026-10-13:** §§ 12–13 went to kol-ds-ui as `SplitToolButtonFoldAlwaysOpens` · `SelectionOverlayLabelUpright` (receipts in `lobby/outbox/`).
- **Check:** open each menu three deep in dark and light; the panel is darker than the bar in dark, the edge reads as a panel edge, the rows are sans at full ink.

## 5. The title line — `Untitled @ 100%` above the ruler · amends R1.2
- **References:** Affinity (image 13): a thin centred strip between the toolbar and the ruler, `<Untitled> @ 130%*`, read-only. The user: *"this is where untitled would go! middle above ruler. and reset zoom button, why???"*
- **Change:** `StatusBar.jsx` → `DocTitle.jsx` (moved, not retired): `canvas.header` order 1 (after ToolPalette), `h-5 flex items-center justify-center kol-helper-10 text-meta border-t border-oq-08`, text `${name || 'Untitled'}${dirty ? '*' : ''} @ ${zoom}%`. **No button**: zoom reset is ⌘0 and View. The `canvas.footer` registration goes; `.kol-editor-canvas-footer` keeps the timeline dock. The `kol-editor.css` rule that hides the DS zoom chip retargets from `.kol-editor-statusbar` to `.kol-editor-doctitle` (Labs has no title line and keeps its chips).
- **Check:** the line is centred over the ruler; `*` appears on an edit and clears on ⌘S; the bottom-right zoom chip stays hidden in the editor and present in Labs.

## 6. The footer is off by default; it comes with the transport and the timeline · amends R2.1
- **References:** the user: *"when I say transport I mean the entire goddamn thing"*, then the ruling: *"not out of editor, just out of default, if you want it then it comes with the transport and timeline."* R1.6's one gate, `useTimelineUp()` (a track exists · Morph is up · Window › Timeline pins it), already decides the dock and the Transport tab; it now decides the whole footer.
- **Change:**
  - `EditorFooter.jsx`, editor only (`currentView() === 'editor'`): while the timeline is down the strip renders **nothing** — no Output · File, no collapsed-rail ▶ dock. While it is up: **Transport · Output · File**, all three, the `SegmentedToggle` as it is (memory). Labs is untouched — its footer is always up. The `BatchExportModal` and the webm bake overlay keep rendering whether or not the strip shows, so File › Batch export… and a running bake survive the strip being down.
  - `MenuTop.jsx` — **Window › Left rail › Transport / Output / File** stay, never greyed: with the footer down a row pins the timeline (the footer comes up) and opens that tab; with it up, just the tab. `timelineUp` stays in MenuTop for that.
  - `Compose.jsx` unchanged — the slot registration stays; the footer decides for itself.
- **Reach:** the six things that live only in the footer (export scale · Export loop (webm) · Record · Save to file / Load from file · the photo source swap · Audio input) are reachable through Window › Left rail or by pinning the timeline. No menu duplicates.
- **Check:** a fresh editor shows no footer; Window › Timeline brings the dock and Transport · Output · File together; unpinning (no track, no Morph) takes both away; File › Batch export… opens with the footer down; Labs' footer is unchanged.

## 7. Selecting the canvas · fulfils the user's 1 (plan 26) again
- **References:** Figma's frame title is the frame's handle; the user: *"make it so that the margin of click is larger and especially around the aspect number 4:5."*
- **Change:** `CanvasArea.jsx` `FRAME_EDGE` 8 → 16 (the band outside the frame; the hover outline follows). The frame label's corner — the DS `CanvasFrame` label is `pointer-events: none` at top 6 / left 8, 10px — becomes a hit area: a press inside the frame within the top-left 56 × 24 virtual-scaled box selects the canvas (same `selectCanvas()`), on the select tool only, and only when no layer is under the pointer there.
- **Check:** a press 12px outside the frame selects it; a press on `4:5` selects it; a press on a layer under the label still selects the layer.

## 8. Pane headers are the pill toggle · amends R3.1 for the pane header
- **References:** Affinity's pane header, three times over — `Paragraph | Character` (image 10), `Path Brushes · Color · Swatches · Stroke` and `Assets · Appearance` (image 18): a grip bar at the left, the tabs as **pills** (the selected one a lighter rounded pill, the rest bare text), a `⌄` panel menu at the right. ui.kolkrabbi.io's `Preview | Code` (image 11) is the same control — the DS `SegmentedToggle`, `filled`.
- **Change:** the three pane tab rows — `LayersAssetsPanel` (Layers · Assets · History · Navigator), `ColorModal` (Stroke · Color · Swatches), `SelectionPalettePanel` (Inspector · Parameters · Effects) — swap the underline `TabsRow` for the DS `TabChips size="sm"` (*as built: `TabChips` is the control ui.kolkrabbi.io's `Preview | Code` row was promoted to — `SegmentedToggle filled` is a joined tile strip, not the pill*) with a 6px grip bar at the left and the `⌄` at the right (the row's existing `onMinimise`; `onClose` stays on the colour pane). One `PaneHeader` wrapper in `src/editor/shell/panels/` so the three rows are one shape and the grip is the hook for workspace rearranging later.
- **As built:** the Layers `+` moved to the Layers footer bar beside duplicate / delete (Affinity's Layers bar, image 10) — four chips, the grip and the ⌄ fill the rail; chips sit 6px in (`kol-editor.css`).
- **Check:** every pane header reads as image 18's; the selected tab is the lit pill; Window › rows still switch tabs.

## 9. The workspace — reorder the panes, save it, reset it
- **References:** Affinity's Studio: every panel header carries a grip; drag it to reorder a panel in its rail, drop it in the other rail, or stack it as a tab beside another panel's tabs; `⌄` collapses the panel; `View › Studio › Save Studio Preset… / <presets> / Reset Studio` keeps and restores the arrangement. The user: *"at some point we might want to allow for rearranging the workspace"*, then *"how are we dealing with the reordering of panes? the 'save workspace' feature?"*
- **Ours today:** panes are fixed by the registry — `Compose.jsx` names a slot and an `order` per pane (`left.body` −1 ColorModal · 0 LayersAssetsPanel · `right.body` 0 SelectionPalettePanel), `EditorShell` renders them in that order; only the rail widths persist (`useDragResize`, `--kol-editor-left-w` / `-right-w`). Nothing reorders, nothing is saved.
- **Change:**
  - **One workspace record** — `src/editor/shell/workspace.js` (the `timelinePinned.js` store idiom): `{ left: [paneId…], right: [paneId…], collapsed: { paneId: bool }, timelinePinned, railW: { left, right } }`, persisted at `kol.editor.workspace`. The registry's `order` becomes the **default** workspace; `EditorShell` renders each rail in the record's order instead.
  - **The grip drags** (§ 8's `PaneHeader`): pointer-drag by the grip reorders within a rail and across rails — the DS `LayerStack` drag-reorder idiom (a drop line between panes), not a new library. `⌄` collapses the pane to its header (the record's `collapsed`).
  - **Window › Workspace ▸**: `Save workspace…` (a name, via `modal.prompt`), the saved workspaces as rows (✓ on the current), `Reset workspace` (back to the registry default). Saved sets live beside the record at `kol.editor.workspaces`.
  - Labs keeps its own registry and does not take part — its two rails are one treatment by ruling (2026-08-30).
- **Not in this plan:** floating / undocked panels and stacking one pane as a tab inside another. Reorder + collapse + save/reset is the whole of it here.
- **Check:** drag Color below Layers → it stays after reload; drag Inspector to the left rail → it renders there; Save workspace… → the row appears under Window › Workspace; Reset → the registry order; Labs unchanged.

## 10. Not changed
- The nine menus and their rows (plan 28–29), the app menu's rows, the keymap, `kol:command`.
- The Files dialog, ⌘S / ⇧⌘S, the saved mark (`savedMark.js`).
- Labs: its footer, its chips, its rail.

## 11. Spec amendments (on build)
- **R1.1:** logo = the Home door (16px button); bar `h-8`, `MenuItem size="sm"`; panels on `surface-tertiary`, sans at full ink, 26px rows, hairline + shadow (local until the DS tone lands).
- **R1.2:** the name + zoom are a **centred read-only line above the ruler** (`DocTitle`), no control; zoom reset is ⌘0 / View.
- **R2.1:** the editor's left rail footer is **off by default** and comes up whole — Transport · Output · File — on R1.6's gate (`useTimelineUp()`); Window › Left rail rows pin the timeline to bring it. Labs keeps it always.
- **R3.1:** a pane's **header** tab row is the DS `SegmentedToggle` pill with a grip and a `⌄` menu (Affinity); the underline `TabsRow` is retired from the three panes. The footer strip's rule stands.
- **R6.x (the colour pane):** Opacity is a header-row field beside the view dropdown; the pane sizes to its content.
- Gap matrix rows that name the status bar or the footer: re-worded to the title line and the menu rows.

## 12. The toolbar folds — always open, rows greyed; the panel hugs its rows · DS
- **Seen:** with nothing selected the Rotate fold does nothing (image 14 — the tooltip shows, the fold will not open); with a layer selected the fold opens as a panel the width of the canvas (image 15). The user: *"even if nothing is applicable shouldn't it still show what's available in these dropdown tools?"* — the menus' own law (plan 29: *"a row that does not apply is greyed, never hidden"*).
- **Why:** both are in the DS `SplitToolButton` (kol-component 0.252.0, `molecules/SplitToolButton.jsx`). `disabled` disables the whole trigger — caret included — so a fold whose action does not apply cannot be opened; `variants` carry no per-row `disabled`. The panel is `w-max` and its rows are `w-full … inline-flex` — the exact defect `MenuDropdownItemBlockRow` fixed for `MenuDropdownItem` on 2026-10-13 (inline rows in a content-sized panel measure as one line), left unfixed in this sibling.
- **Change:** lobby ticket to kol-ds-ui, `SplitToolButtonFoldAlwaysOpens`: (1) `disabled` dims and disarms the trigger's action only; the caret opens the fold regardless; a variant takes `disabled` and renders greyed (`disabled:opacity-40`), never hidden; (2) rows are `flex` (block), the panel hugs its longest label as the menu panels now do. Here: `ToolPalette.jsx` passes `disabled` per variant (`!canXform` on the four Rotate rows, `!canBool` on the Boolean rows) and drops it from the fold.
- **Note:** Rotate 90° left / right have no key in the keymap (Flip has ⇧H / ⇧V), so the tooltip and the rows show none; none of the references bind one either. Unchanged unless the user wants one.
- **Check:** nothing selected → the fold opens, its rows greyed; a layer selected → the panel is as wide as `Rotate 90° right ⇧V`, not the canvas.

## 13. The selection's size readout — upright, legible · DS
- **Seen (image 16):** `259 × 306` standing on end against the box's right edge, 10px, unreadable. The user: *"the size here glued to the side is so small it can't be read."*
- **Why:** the DS `SelectionOverlay` (`utilities/SelectionOverlay.jsx`) draws the chrome inside one rotated group — *"the chrome rotates WITH the box (centre origin)"* — so after Rotate 90° left (§ 12's fold, rotation −90) the label turns with the handles and lands vertical on the right. It is also 10px mono at `scale(1/zoom)` on a 60% black chip.
- **Change:** lobby ticket to kol-ds-ui, `SelectionOverlayLabelUpright`: the label counter-rotates (`rotate(-rotation)`) and sits centred under the box's **screen** bounds, upright at any rotation (Figma's size chip); 12px, not 10. Nothing changes here — the editor already passes `showLabel`.
- **Check:** rotate a layer 90° and 45° — the readout stays horizontal under the box and reads at arm's length.

## 14. The colour pane — Affinity's header row, and the square gets its height
- **Seen (image 17):** the Hue view's saturation/value square is a ~64px strip under the hue slider; the user: *"slider has more space, why is it so small, and why can't I drag vertically to get more of the ramp?"* **Image 18**, the reference: the swatch pair (fill over stroke, swap arrow, no-colour strike), the eyedropper and a small black dot on the left, **Opacity: 100 %** with its stepper on the right — one header row; the body below takes the pane's height.
- **Why:** `ColorModal.jsx:35` fixes the pane at `height: 320`; the tab row, the swatch row, the hue strip, the gaps and the opacity row take the rest, and the DS `SBSquare` (`flex-1 min-h-0`) is handed what is left. Vertical drag **does** work — `SBSquare` reads `clientY` for value — but over 64px it moves nothing visible, so the square reads as a 1D ramp.
- **Change:**
  - **Opacity moves into the header row**, right-aligned beside the view dropdown: the `OpacityRow`'s value field (and its coalesced writes — layer `opacity` / canvas fill opacity) as `Opacity` + the number, no slider; the slider row at the foot of the pane goes.
  - The pane stops being a fixed 320: `height: auto`; the Hue view gives the square `min-height: 160` (the Wheel view already sizes to its ring). The pane grows to its content and the rail scrolls, as every other pane does.
- **Check:** the square is at least 160 tall on the desktop rail; a vertical drag runs white → black; opacity edits from the header field; Wheel · HSL · RGB views unchanged.

## 15. The Swatches tab — Affinity's body
- **Reference (image 18):** `Recent:` strip of the last-used colours; a palette dropdown (`Colours ⌄`) with a gear, an add-swatch glyph, four fixed chips (none · black · grey · white); a 16-column swatch grid, hue across and saturated → muted down; a `Search` field at the foot.
- **Ours:** `SwatchesPanel.jsx` — a palette dropdown (AC · Standard) over an 8 × 6 grid of brand tokens. No recent, no fixed chips, no add, no search.
- **Change:** `SwatchesBody` gains, in Affinity's order: a **Recent** strip (the last 8 picks, session-local), the palette dropdown with **add swatch** (`+`, the current colour into a `Custom` palette, kept in `kol.editor.swatches`) and the four fixed chips, the grid at the rail's width (8 columns at 264, hue across where the palette is a ramp), and a **Search** field filtering by name / hex. The tokens stay as the `AC` palette.
- **Check:** pick → Recent fills; `+` adds the live colour; search narrows the grid; none · black · grey · white apply.

## 16. Verification
- `vite preview` of the built bundle, light + dark, 0 console errors: every bar menu three deep; the footer with the timeline up and down; the title line; the canvas select band; the three pane headers; the folds with and without a selection; a rotated layer's readout (after the DS ticket lands); the colour pane and the Swatches tab; Labs unchanged. Evidence to `_tmp/2026-10-13-plan-30-walk/`.
