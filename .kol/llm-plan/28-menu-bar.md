# Plan — The menu bar, on the conventions

**Status:** BUILT 2026-10-13 — everything below, walked on `vite preview` (§ 19).
**Origin:** user, 2026-10-13: *"I would like our topbar to follow more known conventions f.e. affinity … usually (at least affinity) its file edit document text vector pixel layer view window and help. and I think we could aim for something similar?"* (He has asked for this before; spec R1.1 kept today's menus instead.)
**Today:** `src/editor/shell/MenuTop.jsx` — `Editor ▾` on the left, then right-aligned `Generative · Effects · Tools · File · Canvas · Templates · ⚙`. This order follows no convention: File sits fourth, Edit does not exist, and Undo/Redo live under File.

> **Superseded in part by plan 29 (2026-10-13):** creation and effects moved from `Layer › New / Effects` to a **Tools** menu (the user's ruling, misread here in § 15); the logo became a mark and an **Effexor FXR** app menu replaced the cog; the status bar went read-only; the Navigator became a left-rail tab. Read plan 29 before treating §§ 0, 4 and 14–15 as current.

## 0. The bar

```
[logo]   File  Edit  Layer  Text  Vector  View  Window  Help        ⚙
```

- **Left-aligned, after the logo.** In every reference app (Affinity, Adobe, Figma's menu) the menus start at the left. The logo plays the role of the app menu (Affinity's own `Affinity ▾`) — see § 14.
- **Affinity's set, minus Document and Pixel.** A top-level menu is a set of verbs on the document or the selection. Generative and Effects are catalogs — one inserts a layer, the other adds a stage to the selected layer — so they fold into **Layer** as `New ▸` and `Effects ▸`, exactly where Affinity keeps `New Fill Layer` and `New Live Filter Layer ▸` (third pass, § 15).
- **Five menus are dissolved: Tools, Canvas, Templates, Generative and Effects.** Every item moves to a conventional home (§§ 1–11). No item is dropped.
- **The cog stays** (spec R1.1), right-aligned.
- Item copy stays verbatim. Only its position changes. A new item is marked **NEW**.

## 1. File
| Item | Shortcut | From |
|---|---|---|
| New | | File |
| Files… | ⌘O | File |
| Starters ▸ | | Templates › Starters (Affinity: *New from template*) |
| — | | |
| Save / Save… | ⌘S | File |
| Save as… | ⇧⌘S **NEW** combo | File |
| — | | |
| Aspect ▸ | | Canvas › Aspect |
| Clear | | File |
| — | | |
| Library ▸ Palettes · Patterns · Types · Presets | | Templates (the four slots, with counts as today) |
| — | | |
| Export SVG | | File |
| Export PNG | | File |
| Batch export… | | the rail footer (Output) — **NEW** menu entry |
| Open output window | | the rail footer — **NEW** menu entry |

## 2. Edit
| Item | Shortcut | From |
|---|---|---|
| Undo | ⌘Z | File |
| Redo | ⇧⌘Z | File |
| — | | |
| Duplicate selection | ⌘D | keymap only — **NEW** menu entry |
| Delete selection | ⌫ | keymap only — **NEW** menu entry |
| — | | |
| Select all layers | ⌘A | keymap only — **NEW** menu entry |
| Deselect | Esc | keymap only — **NEW** menu entry |
| — | | |
| Eyedropper | I | keymap only — **NEW** menu entry |
| Color | | Tools |

Cut / copy / paste are left out because they don't exist yet. They go here when they're built.

## 3. Document — DROPPED (user, 2026-10-13: *"can document not go to file?"*)
Two rows don't earn a menu. Aspect ▸ and Clear go to File (Affinity keeps Document Setup under File too). The menu comes back only if the multi-canvas / frame model gives it a reason to exist.

## 4. Layer
| Item | Shortcut | From |
|---|---|---|
| New ▸ — see § 4a | | Generative · Text · the toolbar |
| Effects ▸ — see § 4b | | Effects |
| — | | |
| Group selection | ⌘G | keymap only — **NEW** menu entry |
| Ungroup | ⇧⌘G | keymap only — **NEW** menu entry |
| — | | |
| Align ▸ left · centre · right · top · middle · bottom · distribute | | Inspector (`alignSelected`) — **NEW** menu entry |
| Flip horizontal · Flip vertical | ⇧H · ⇧V | keymap only — **NEW** menu entry |
| — | | |
| Use as mask / Release mask | | Tools |
| — | | |
| Toggle lock · Toggle visibility | L · H | keymap only — **NEW** menu entry |

*Arrange* (bring to front / send to back) is missing because there is no action for it yet; reordering is drag-only. Gap noted, not proposed.

### 4a. Layer › New ▸ — everything that makes a layer
One panel, eyebrow headers (`kol-helper-10`, as `generativeItems` already draws sub-buckets), **no `Generative ▸` nest** — the method parents sit directly under the eyebrow so the deepest path stays at four panels (`Layer › New › Loops › Field › preset`), Affinity's own depth for `Layer › New Live Filter Layer › Blur › Gaussian`.

| Eyebrow | Rows | From |
|---|---|---|
| GENERATIVE | Scanline ▸ · Pattern ▸ · Loops ▸ · Math ▸ · Penrose ▸ · Drift ▸ · Gradients ▸ · Soft Forms ▸ (the `GENERATIVE_TREE` parents, as today) | Generative |
| PATTERN | Moiré ▸ · Mesh Gradient ▸ · Reaction ▸ · Halftone ▸ | Generative › Pattern |
| TYPE | Text `T` · Kinetic ▸ (`KINETIC_TREE`) · Para Type ▸ | keymap / inspector pickers — **NEW** menu entries |
| MEDIA | Photo… | the toolbar — **NEW** menu entry |

### 4b. Layer › Effects ▸ — a stage on the selected layer
Today's Effects menu, moved: None, divider, the categories ▸ their filters, ✓ on the ones in the chain. Greyed, not hidden, when nothing is selected (§ 14) — the "Select a layer" line goes. The Effects *panel* in the right rail stays the primary surface; this is the menu door to it.

## 5. Text — operations on the selected text layer (third pass, § 15)
Affinity's Text menu is traits, alignment, case — not creation. Creation is `Layer › New › TYPE`. All four props already live on the text layer (`state.jsx:342-344`, `TextPanel.jsx:222`), so every row is `updateLayer` on the selection; greyed when it isn't a text layer.

| Item | Shortcut | From |
|---|---|---|
| Alignment ▸ left · centre · right | | `textAlign` — **NEW** menu entry |
| Vertical alignment ▸ top · middle · bottom | | `verticalAlign` — **NEW** menu entry |
| — | | |
| Case ▸ (the `CASE_OPTIONS`) | | `case` — **NEW** menu entry |
| Italic | | `italic` — **NEW** menu entry |
| — | | |
| Convert to path | | `flattenText` — **NEW** menu entry |

## 6. Vector
| Item | Shortcut | From |
|---|---|---|
| Unite · Subtract · Intersect · Exclude | | Tools |
| Release boolean | | Tools |
| — | | |
| Convert to path | ⇧⌘O | Tools |
| Blend… | | Tools |

## 7. Generative — DISSOLVED into Layer › New ▸ (§ 4a)

## 8. Effects — DISSOLVED into Layer › Effects ▸ (§ 4b)

## 9. View
| Item | Shortcut | From |
|---|---|---|
| Preview mode | W | keymap only — **NEW** menu entry |
| — | | |
| Show / hide rulers | ⇧R | keymap only — **NEW** menu entry |
| Show/hide grid | G | keymap only — **NEW** menu entry |
| Show / hide modulation dots | M | keymap only — **NEW** menu entry |
| Toggle fps readout | F | keymap only — **NEW** menu entry |
| — | | |
| Snap to objects, guides and canvas | | File (Affinity has *Snapping* under View) |
| — | | |
| Layout ▸ Single · Social | | Canvas › View (renamed nest: two "View"s, one inside the other, would read badly; this needs a **ruling**) |
| Show / hide rail | \ | keymap only — **NEW** menu entry |

Checkmarks work as today: a ✓ shows in the shortcut slot when something is on.

## 10. Window
Every panel tab, by rail, each one opening its tab: **Layers · Assets · Color · Stroke · Swatches** | **Inspector · Parameters · Effects** | **Transport · Output · File · History · Navigator** | **Timeline**. Then a divider, then **Show / hide settings** (`,`).
**NEW** throughout. It needs one `kol:open-tab` event that each pane host listens for (`kol:open-effects` and `kol:open-color-modal` already do this for two of them).

## 11. Help
| Item | Shortcut | From |
|---|---|---|
| Show / hide shortcuts | S · ? | keymap only — **NEW** menu entry |

## 12. Rulings — all yes (user, 2026-10-13)
1. Left-aligned menus.
2. Tools, Canvas and Templates dissolved as mapped.
3. Canvas › View becomes View › Layout.
4. Window gets built.

## 14. Second pass (user, 2026-10-13 — brainstorm, proposed below, awaiting a yes)
> *"use the logo like the apple logo instead of editor? and completely fold the sidebar when you enter editor? then there you could chose the same nav paths?"* · Window with submenus and disabled rows, like Affinity (`28-assets` screenshots in chat).

- **Logo menu replaces `Editor ▾`.** The kol-brand logomark is the first cell. Its menu holds the shell rail's destinations in the rail's order (Home · Library · Editor ✓ · Labs · Randomiser), then a divider, then Settings… `,`. The mode door moves into it.
- **The shell rail is hidden on `/editor`.** This is kol-shell's `NavHiddenContext` seam (`navHidden.js`), the one monitor's rack and mirror's studio already use to replace the global rail with their own nav. No DS work. `\` still brings the rail back as the escape.
- **Disabled rather than hidden.** A row that doesn't apply to the selection shows greyed (`MenuDropdownItem disabled`), never vanishes. That fixes Effects' "Select a layer" line: the full menu shows, all of it disabled.
- **Window = submenus by rail:** Left rail ▸ (Layers · Assets · Color · Stroke · Swatches · Transport · Output · File · History · Navigator) · Right rail ▸ (Inspector · Parameters · Effects) · Timeline · — · Show / hide rail `\` · Show / hide settings `,`.
- **Rows carry a leading glyph where kol-icons has one,** with the shortcut right-aligned. `MenuDropdownItem` already has `prefix` and `shortcut`, so this is style, not new parts.

## 15. Third pass (user, 2026-10-13 — the audit)
> *"generative and effects … are both base layers, should they not fold together as tools? … text is more about alignment and casing, while text tool is a layer tool? same with pattern which is also a tool"*

The principle: **a top-level menu holds verbs on the document or the selection; creation is a tool or `Layer › New`.** Against it:
- Generative inserts a layer → creation → `Layer › New ▸` (§ 4a). Pattern with it. The pattern *tool* stays in the toolbar with the other tools.
- Effects adds a stage to the selected layer → a verb on the selection, not a layer → `Layer › Effects ▸` (§ 4b), Affinity's `New Live Filter Layer ▸` slot.
- Text tool, Kinetic, Para Type → creation → `Layer › New › TYPE`. **Text** becomes what Affinity's is: alignment, case, italic, convert (§ 5).
- The bar goes from ten menus to eight (§ 0).

## 16. Logistics — check before building
1. **`MenuDropdownNest` three deep.** Today's menus nest two (`parent › group › preset`). § 4a needs three (`New › Loops › Field › preset`). It is a hover popover (`MenuItem.jsx`), so it should chain, but **open it in a browser first** — if it clips or mis-flips at depth three, the fix is in the DS, and that is a plan 17 row, not a local patch.
2. **The hidden rail costs nothing.** `AppShell` provides `{ navHidden, setNavHidden }` (`kol-shell/src/AppShell.jsx:152,328`); the editor route calls `setNavHidden(true)` on mount, `false` on unmount, and the shell drops `--kol-shell-rail-width` to 0 (`:340`). `\` is the way back.
3. **Window** needs the one `kol:open-tab` event (§ 10). Each pane host listens for its own tab name.
4. **Text rows** are `updateLayer(selected.id, { textAlign | verticalAlign | case | italic })` — no new state, no new action.
5. **Shortcut labels** come from `shortcutById(id).combo` through `comboLabel`, never typed. Save as… `⇧⌘S` is the one new keymap row.

## 17. The timeline dock leaks out of morph (user, 2026-10-13: *"this is not supposed to be there unless your in morph, it could be an option in the menu, but no by default"*)
**Finding.** On `/editor` with no tracks, the dock draws an empty `Morph` header lane (screenshot in chat). `TimelineDock.jsx:432-435` keeps the dock up whenever `morph.active` is true — the labs rule *"show timeline when you enter morph regardless of slot empty or not"* (2026-10-09). `morph.active` is a module-store flag (`morphStore.js:14`), set by the labs Morph tab, New File → Morph and a morph file opened, and cleared only by `LabsView.jsx:551` when another labs tab is chosen — **not when labs unmounts**. The editor inherits it. Spec R1.6 (*the dock opens only when a track exists*) already rules this out; the leak is the bug.

**Fix (root, one line).** `LabsView.jsx:551`'s effect returns a cleanup that sets `{ active: false, editing: null }`, so leaving labs ends the morph surface. The always-up rule then holds exactly where it was asked for: the labs Morph rail. No change to the dock.

**The menu option.** `Window › Timeline` (§ 10) is a toggle with a ✓: on, the dock is shown even with no tracks (an empty lane, for someone about to add keys); off (default), spec R1.6 — the dock appears only when a track exists or the Morph rail is up. The toggle state is a plain module/`localStorage` flag read by `TimelineDock` beside `morph.active`.

## 13. Build notes
- All in `MenuTop.jsx`. Each menu becomes a small component in the same file, or one file per menu under `src/editor/shell/menus/` if the file passes ~600 lines.
- Shortcut labels come from `shortcutById(...).combo` through `comboLabel`, as Convert to path already does. No hand-typed `⌘Z` strings.
- Verify on `vite preview`: open every menu, run every item once, in both themes.

## 19. Build record (2026-10-13)
Walked on `vite preview` at 1600×1000, light and dark, 0 console errors. Evidence in `_tmp/2026-10-13-plan-28-walk/`.
- **Flyouts are local.** The DS `MenuDropdownNest` is an inline accordion, so § 16.1's depth check was moot: `menus/MenuFlyout.jsx` opens beside its row and is parked as plan 17 #16. Three deep (New › Loops › Field) walked; leaf panels cap at 320 × 60vh and scroll.
- **One command bridge.** Menu rows dispatch `kol:command` with a keymap id; `CanvasArea`'s keymap switch runs it, so a row and its key share every guard (lock greys Duplicate, canvas-delete guard and so on).
- **Root fix found on the walk.** Menu panels portal outside the shell, and a mousedown in one deselected before the row's click. The old menus hid it behind a stale closure. `CanvasArea`'s outside-press now treats `.kol-popover-float` as chrome.
- **Tabs:** one `kol:open-tab` event (`shell/openTab.js`) for Layers · Assets · History · Inspector · Parameters · Effects · Transport · Output · File · Navigator. The color pane keeps its own `kol:open-color-pane`. `Edit › Color` used to fire `kol:open-color-modal`, which nothing listened for, and now opens the pane.
- **New in the keymap:** ⌘S Save and ⇧⌘S Save as… in the editor (`FilesDialogHost`). They didn't exist; the plan listed them.
- **§ 17:** `LabsView`'s cleanup clears `morph.active`, walked Morph → Editor with no lane. Window › Timeline pins the dock (`params/timelinePinned.js`).
- **Hidden rail:** `setNavHidden(true)` on a microtask (the shell's own route effect runs after ours and reset it), `\` and Window › Show / hide rail bring it back.
- **Calls taken on the build:** no carets on the bar (Affinity has none); ✓ stays in the trailing slot, before the key (§ 9); *Toggle fps readout* left out of View because it is labs-only and the editor has no readout; Kinetic type lists its subs under Type / Kinetic eyebrows (four panels deep, not five); Insert image keeps the toolbar's label.
- **Second walk (2026-10-13, same day):** the rows not yet walked, all passing with 0 errors: Unite · Release boolean · Convert to path · Blend… (5 steps, grouped) · Use as mask / Release mask · Eyedropper (pipette cursor) · Save… (names the file, row becomes Save) · ⌘S · ⇧⌘S · Library › Presets (loads) · Starters (loads) · Export SVG / PNG (both download) · Open output window (`?view=output`) · logo › Settings… (drawer). The Morph step picker's categories walked too: drill in, back, search, pick.
