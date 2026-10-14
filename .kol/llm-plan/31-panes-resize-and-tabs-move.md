# Plan — The bar, the tools strip, panes resize, tabs move

**Status:** BUILT 2026-10-13 — §§ 1–2 and 4–8 built and walked on `vite preview` (dark + light, 0 console errors; evidence `_tmp/2026-10-13-plan-31-walk/`). Three DS asks filed to kol-ds-ui and **waiting on the publish**: `MenuItemOffset` (§ 1 — `MenuTop` already passes `offset={2.5}`, inert until the bump; the gap is 1px today), `ToolPaletteVertical` (§ 2 — the strip is turned by `flex-col` until then, its folds open downward), `CanvasRulerGraduated` (§ 3 — nothing local). Journal: `.kol/llm-context/playbook/2026-10-13-plan-31-the-bar-the-tools-strip-panes-resize-tabs-move.md`.
**Origin:** user, 2026-10-13, walking plan 30. The bar: *"what did I ask for in the top banner? did I say keep same color or did I say MAKE IT DARKER"* · *"I literally said SANS, but you just changed the window items not THE TOP BAR"* · the open menu: *"why the gap? line to line, fix it"*. The head of the window against Affinity: *"I see top part, we are conflating things"* · *"look at how they place 'tools' v.s. how we do it"* · *"check out how they do rulers vs. how we do them"*. The Color pane: *"I can reposition panes, but not drag height … look at the bottom line, DRAG TO MAKE TALLER."* History: *"I should be able to drag not just the predefined panes … any individual pane to either side … I have my mouse over history and I should be able to drag it to right sidebar and to the bottom."* The `⌄`: *"what does this chevron on the end do exactly?"*
**What plan 30 got wrong:** its § 4 read *"much darker background … sans … 100% opacity"* as the **menu panel** and painted only that; the bar kept `surface-primary` and its mono triggers. The instruction was the bar too. Plan 30 § 9 built whole-pane reorder + collapse and missed both resize and the tab as the unit — Affinity's Studio resizes a pane from its bottom edge, and a pane is only the group a set of tabs currently sits in. And the tool palette (plan 28–29) is a toolbar wearing a pane header's slot.

## 0. What is already settled

| Rule / plan | Where this plan stands |
|---|---|
| Plan 30 § 3–4 — bar `h-8`, triggers `MenuItem size="sm"` (mono `kol-helper-12`), panels on `surface-tertiary`, sans 13 at full ink, 26px rows | **Amends**: the bar wears the panel's wash and face (§ 1). The panel look holds. |
| DS `MenuItem` — `usePopover({ offset: 4 })` hardcoded | **DS ask** (§ 1): an `offset` prop, default 4, every call site unchanged. |
| `ToolPalette` at `canvas.header` order 0 (plans 28–29): tools + actions in one row inside the canvas column | **Replaced** (§ 2): tools → a vertical strip, actions → a full-width toolbar band, the canvas header keeps only `DocTitle`. |
| 2026-08-12 inspector ruling — the tool's options live in the Inspector | Holds: no context toolbar (§ 2). |
| DS `CanvasRuler` (kol-component `organisms/Canvas.jsx`, public since `rulers-and-guides-are-private`) — 18px `fg-08` bar, one tick rank at `niceStep`, mono 9 labels, no unit, no pointer line | **DS ask** (§ 3): a graduated ruler — transparent bar, three ranks, sans labels, `px`, pointer line. |
| Plan 30 § 9 — workspace record `{ left, right, collapsed }`, one entry per fixed pane | **Replaced**: panes become groups of tab ids (§ 4). The grip, the drop line, Window › Workspace all stay. |
| Plan 30 § 8 — `PaneHeader` (grip · `TabChips` · trailing · `⌄`) | Holds as the drawing. The chips gain a drag; the `⌄` goes (§ 5). |
| Plan 30 § 14 — Color pane "sizes to its content", SB square `h-40` | **Amends**: 160 becomes the floor, the square takes the extra height (§ 8). |
| `.kol-timeline-grab` / `SheetGrab` — the estate's horizontal grab pill (`useGrabEdge({ axis: 'x' })`) | **Reused** for the pane's bottom edge (§ 7) — same drawing, no new handle. |
| `useOpenTab` / `kol:open-tab`, `kol:open-params|effects|pattern`, the Selection auto-flip, the Pattern tab's gate | Hold as behaviour; they move from the three panel components into the workspace store (§ 6). |

## 1. First — the bar is darker, sans, and the menu sits line to line · amends R1.1

Images 3–6. The bar reads as the rails (`surface-primary` #121215), its triggers are mono at 64% ink, and an open panel floats 7px under the bar (trigger 26 in a 32 bar → 3px, plus the DS's 4px offset) with its own hairline — two lines and a gap.

- **Wash:** `.kol-editor-topbar` gets `bg-surface-tertiary` (#0e0e11 dark / #fff light) — the same tone as the open panel, so bar and panel read as one piece, macOS's. `border-b border-oq-08` stays.
- **Face:** the one scoped rule widens — `.kol-editor-topbar .kol-menu-btn, .kol-editor-menu .kol-menu-btn { sans · 13px · letter-spacing 0 · fg-emphasis }` — so bar triggers and panel rows share the face in one place. `FXR` stays bold. The key labels in the panels stay mono (plan 30).
- **Line to line:** the panel's top edge lands on the bar's bottom line — **one hairline, no gap**: the panel's own top border overlays the bar's. The DS `MenuItem` hardcodes `offset: 4`; it gains an **`offset` prop** (default 4, so no call site moves) — **DS ask, filed to kol-ds-ui, one line** — and `MenuTop` passes the value that puts the panel's top border on the bar's: measured at build (≈ −(3 + 1)), one const beside `PANEL`. The flyouts are untouched.
- **Check:** dark + light; the bar is darker than the rails; `File` is sans; open `File`, `Window › Workspace ▸` three deep — the panel's top border is the bar's bottom border, no gap, no double line.

## 2. The head of the window — three kinds of thing, three homes · amends R1.x

Images 8–10. Affinity's head, top to bottom and left to right: the **toolbar** (full width: persona · boolean ops · align · snapping · Export), the **context toolbar** (full width: the active tool's options — *Rectangle* · fill/stroke · stroke width · Single radius · Corner…), then the columns — the **tools strip** (one icon wide, far left, full height: Select · Node · … · Pen · Pencil · Shapes · Text · Image · Measure · Pipette │ Hand · Zoom · ⋯ · the fill/stroke pair at the foot; each fold wears a corner triangle), the left Studio, the canvas with `<Untitled> @ 130%*` centred above the ruler, the right Studio. **Actions** in a band above, **tools** in a strip beside, **panes** in the Studios. The two rails' pane headers and the title line sit on one line directly under the bands.

FXR's head: the menu bar, then straight into the columns, and **one row inside the canvas column** at the pane-header line — `ToolPalette` — holding the tools (Select · Pen · Shape · Text · Zoom folds) *and* the actions (Rotate · Boolean · Insert image · Crop · Duplicate) *and* Undo, horizontal, where Affinity has nothing but the title. That is the conflation: a toolbar wearing a pane header's slot, and tools with no strip.

- **Tools strip** — a new shell column `tools`, one control wide (`--kol-ctl-md` + 8px gutters ≈ 40), at the far left of `.kol-editor-grid`, full height to the footer, `surface-primary`, right hairline. Vertical, in this order: Select (+ Node) · Pen (+ Line) · Shape ▾ · Text ▾ (+ Kinetic) │ divider │ Zoom (+ Hand · Orbit) │ at the foot, the fill/stroke pair (`SwatchStack`, the Color pane's own, reading the active paint — Affinity's). The fold's variants open as today (`SplitToolButton`, flyout to the right); the corner triangle is the DS's. Keys unchanged. One fold per row; the strip never scrolls.
- **Toolbar band** — a new shell slot `toolbar`, full width between the menu bar and the grid, `h-10`, the bar's wash (`surface-tertiary`, bottom hairline) so the head reads as one two-line block — menus, then actions. Left-aligned groups: Rotate ▾ · Boolean ▾ │ Insert image · Crop · Duplicate — the palette's action items as they were, nothing added (Affinity's toolbar has no undo either). The right end is empty for now (Export lands here when the export flow is reviewed; the view chips are the status line's).
- **No context toolbar.** The Inspector is the tool's options surface (2026-08-12 ruling); Affinity's second band is not built. If the user wants it, it is one more `toolbar` row fed by the active tool — a later plan.
- **The canvas header keeps only `DocTitle`** (plan 30 § 5) — `<Untitled> @ 100%` centred above the ruler, on the same line as both rails' pane headers, all three directly under the toolbar band.
- **Code:** `ToolPalette.jsx` splits into `ToolStrip.jsx` (slot `tools`) and `ActionBar.jsx` (slot `toolbar`); `EditorShell` renders `registry.toolbar` under the topbar and a `tools` column before the left rail; `Compose.jsx` registers both. Labs' registry declares neither and keeps its chrome. `ToolPalette.jsx` retires to `_tmp/`.
- **Check:** under the toolbar band, left to right on one line: the strip's first tool · `Layers` header · `Untitled @ 100%` · `Inspector` header. `V` `P` `R` `T` `Z` `H` select in the strip; `⌘Z`, the Boolean fold and Duplicate act from the band.

## 3. The rulers are a ruler, not a labelled band · DS ask

Images 11–12. Affinity's ruler has no band of its own — ticks and numbers sit on the pasteboard's tone with one hairline at the inner edge; **three tick ranks** (every 10 short, every 50 mid, every 100 full with a number) at a step that keeps the numbers ~100 screen px apart; numbers in a small sans beside the major tick, the vertical ruler's rotated to read bottom-to-top; `px` in the corner square; a hairline on each ruler follows the pointer.

Ours is the DS `CanvasRuler`: an 18px bar on `fg-08` — a band *lighter* than the pasteboard, the corner square lighter still — with **one rank**: 5px ticks at `niceStep(pxPer, 80)` and nothing between, so at 100% it reads 0 · 200 · 400 with 200px of blank bar between; mono 9 labels at 64% ink; no unit; no pointer line. It is a labelled axis wearing a strip of chrome, not a ruler. Same 18px thickness as Affinity's — the thickness is not the problem.

- **Ticket** `CanvasRulerGraduated` to kol-ds-ui (the ruler is theirs; same-day round trip, as plan 30's three): bar `transparent` so the pasteboard shows through, the inner-edge hairline only (`oq-16`, as now), the corner square the same with the unit `px` in it; three ranks — major = `niceStep` as now, medium = major / 2, minor = major / 10 — at 18 · 9 · 4 px from the inner edge, `fg-48` for the major, `fg-24` for the others; labels sans 10 at `fg-64` beside the major tick (as now, sans instead of mono), the vertical ruler's rotated −90° reading bottom-to-top; a 1px `fg-64` pointer line on each ruler from the stage's own `pointermove` (the `Canvas` organism already tracks the pointer for the zoom anchor — no prop from the consumer).
- **Here:** bump to the version it ships in. Nothing else — `shell/Canvas.jsx` passes `rulers` as today.
- **Check:** at 100% the top ruler reads 0 · 100 · 200 … with nine minors between each pair, the pasteboard's tone under the ticks; the pointer's line on both rulers moves with the mouse; at 25% and 400% the step picks itself; the corner says `px`; guides still drag off both rulers.

## 4. The tab is the unit · `state/workspace.js`

The registry declares **tabs**, not panes: `{ tab: 'History', label, Component, pane: 'layers', side: 'left', order, when? }`. The ten tabs today: Layers · Assets · History · Navigator (pane `layers`), Stroke · Color · Swatches (pane `color`), Inspector · Parameters · Effects · Pattern (pane `selection`; Pattern carries `when: layer is pattern`).

The record becomes

```
{ left:  [ { id, tabs: ['Layers','Assets','History','Navigator'], active: 'Layers' }, … ],
  right: [ { id, tabs: ['Inspector','Parameters','Effects','Pattern'], active: 'Inspector' } ],
  collapsed: { [paneId]: true },
  heights:   { [paneId]: px } }
```

`normalise` places every registered tab exactly once: a tab the record does not know lands in its default pane (or a new pane on its default side); a pane with no tabs left is dropped. `moveTab(tab, side, paneIndex | { between: i })` is the one write: into an existing pane (appended, made active) or into a new one-tab pane at a rail position. `movePane` stays for the grip. `openTab(tab)` makes it active in whatever pane holds it — this is what `kol:open-tab` and the three `kol:open-*` events call now, store-side, so a tab works wherever it was dropped.

## 5. A chip drags; the `⌄` goes · `PaneHeader.jsx`

Pointer-down on a chip, past 4px slop, lifts **that tab** (under the slop it is the DS click — the tab switches as now). The drag reuses `startPaneDrag`'s loop with one more target class: over a pane **header** → the drop lands *in* that pane (the header gets the accent ring, the chips do not reflow); over a pane body or a rail's empty end → the drop line as today (a **new pane** holding the one tab). The grip at the left still drags the whole pane. A ghost chip follows the pointer (the DS `ControlTone` chip, `pointer-events: none`), so the user sees what he holds.

The chip's own drag replaces nothing the DS `TabChips` does; it is a wrapper `onPointerDown` on the row that reads `[role="tab"]` under the pointer. If `TabChips` swallows pointer-down before the row sees it, this is a one-line DS ask (`onTabPointerDown`) — not a new chip component.

**The `⌄` at the end of the row** (image 7). It is plan 30 § 8's collapse: a click folds the pane to its header row (`toggleCollapsed`), the glyph turns to `›`, a second click unfolds. That is all it does. It is the wrong glyph for it — a chevron at the end of a tab row reads as *more tabs* or a dropdown, and nothing opens. **Retire it.** Collapse becomes a **double-click on the header row** (the grip or the empty space, not a chip — a chip's click switches, its press drags), which is Photoshop's and Affinity's gesture; `aria-expanded` moves to the header. The header row gains back its trailing 20px, which the four-chip Layers row needs.

## 6. One `Pane` component · `EditorShell.jsx` `RailBody`

`RailBody` renders the record: for each pane, `<Pane>` = `PaneHeader` with the pane's tabs (filtered by `when`) + the active tab's `Component`. `LayersAssetsPanel`, `ColorModal`-as-pane and `SelectionPalettePanel` stop owning tabs; their per-tab bodies (`LayerStack` + `LayerActions`, `AssetsBody`, `HistoryPanel`, `NavigatorPanel`, `StrokePanel`, `ColourBody`, `SwatchesPanel`, `InspectorRail`, `ParametersPanel`, `EffectsPanel`, `PatternPanel`) register as tab entries. The Selection auto-flip (`selectedId` → `openTab('Inspector')`) and the Pattern gate move to the store, subscribed to compose state once. The Layers footer `+` is the Layers tab's `trailing`/footer, so it travels with the tab. The three old panel files retire to `_tmp/`.

Labs' registry has no tab entries and renders by slot as today.

## 7. Every pane's bottom line is a grab

A `PaneGrab` inside each `.kol-pane` (absolute, bottom 0, full width, ~6px hit, `cursor: row-resize`), `useGrabEdge(ref, { axis: 'x' })` for the pill. Pointer capture; drag sets the pane's height LIVE (local state), commits `heights[paneId]` on pointer-up. Floor = the header + the active tab's content minimum, measured at drag start. Double-click resets to content height. Hidden on a collapsed pane. A dropped tab's new pane has no height; a pane that loses its last tab loses its height.

`.kol-pane` gets `position: relative`; with a height set, inline `height: Npx; flex: 0 0 auto`. The rail body already scrolls, so a tall stack overflows into the rail's scroll.

## 8. The content uses the height

- **Color**: the SB square goes `flex-1 min-h-40` (was `h-40`); the body column flexes so extra height lands in the square. Wheel centres; sliders top-align.
- **Layers**: the list flexes and scrolls inside; the footer bar stays pinned.
- **Everything else**: content top-aligned, extra height is empty space (Affinity's).

## 9. Verification

`vite preview` walk, dark + light, 0 console errors:
- §§ 1–3's checks first.
- drag History's chip to the right rail's end → a new pane `History`; drop it on the Selection header → it joins as a fifth chip; the Layers pane is unchanged.
- drag Color's chip out → Stroke · Swatches remain; drag Stroke and Swatches out too → the `color` pane is gone.
- `kol:open-tab` History (Window › …) opens it wherever it sits; selecting a layer flips Inspector wherever it sits; Pattern appears only with a pattern layer.
- double-click a header → the pane folds to its row; again → unfolds; no `⌄` anywhere.
- drag Color's bottom line taller → square grows; shorter → stops at the floor; reload keeps it; Window › Workspace save / apply / reset carries tabs and heights; collapse ignores height; double-click on the bottom line resets.
