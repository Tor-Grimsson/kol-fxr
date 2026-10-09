# Plan — Everything outstanding, in order

**Status:** DONE 2026-10-09 (local) — all seven steps. §§ 1–5 built and walked on the built bundle (`vite preview`, 1600: deep link lands with both rails open and no prompt; Assets on `ContentRow` + `MediaTile`; context menu, colour chips, labs rail clean; 0 console errors); § 3 narrowed (`core.jsx` + `index.lib.css` are live app code — only the config and script were dead); § 6 answered (nothing external at mount; audit #1 was a cloud-network one-off); § 7 filed (`StepList` · `SegmentedToggleOptionDisabled` in kol-ds-ui, receipts in `lobby/outbox/`). Not eyeballed, same DS atoms + green build: the dock's Delete key/Close, Learn ×2, the blend/bind/size menus, EffectsPanel's xs buttons — the user's live pass. Playbook: `.kol/llm-context/playbook/2026-10-08-plan-19-everything-outstanding.md`.
**Was:** OPEN 2026-10-08 (local). THE one list: the audit's six fixes (`.kol/llm-context/audit/2026-10-08.md`, plan 16) and the two DS tickets plan 17 parked. Nothing outstanding lives anywhere else.
**Origin:** user, 2026-10-08: *"make a plan from the audit"* → *"put this into a single plan"*

## 1. Labs deep link — rails open, no restore prompt (audit #2 · #3)

- **Now:** `/labs?preset=…&cat=…` at 1600 lands with the shell rail at 48px and the params rail folded (`LabsView.jsx` opens the rail on a pick, not on a seeded preset), and `Restore your last canvas?` stands over the preset already on stage when a draft exists.
- **Do:** the deep-link seed drops the collapsed stamp the way the pick path does; a `?preset=` is an explicit ask, so the restore prompt is skipped as `?open=` already skips it.

## 2. Four sentences off `kol-helper-12` (audit #9)

`InspectorRail.jsx:32` · `EffectsPanel.jsx:126` · `PatternPanel.jsx:57` · `TimelineDock.jsx:253` — `<p className="kol-helper-12">` on wrapping text. Helper is single-line chrome; a sentence is `kol-mono-12`. Four class swaps.

## 3. The retired library build to `_tmp/` (audit #10) — narrower than the audit said

The audit named `src/core.jsx` and `src/index.lib.css` as dead. They are not: `App.jsx`, `AppLayout.jsx` and `LibraryPage.jsx` import `src/index.jsx`, which re-exports `./core`, which imports `./index.lib.css` — the app bundle ships them. What is dead is the **config and the script**: `vite.lib.config.js` → `_tmp/2026-10-08-lib-build/`; `build:lib` out of `package.json`; the README line out. `core.jsx` + `index.lib.css` stay (renaming the "library entry" barrel is audit #12's cosmetic class — ignored). One `pnpm build` to prove the app still builds.

## 4. Bare `<button>`s → the DS asset each one is (audit #4)

The audit's "30 bare buttons, one ghost-quiet sweep" is six kinds, read 2026-10-08 (local); only the first two are `Button tone="ghost" quiet`.

- **Ghost quiet, text (4):** `TimelineDock.jsx:311` Delete key · `:322` Close · `LabsView.jsx:269` Catalog (`pressed`) · `MobileOverlay.jsx:303` Start over.
- **Ghost quiet, icon-only (7):** `TimelineDock.jsx:188` fold chevron · `EffectsPanel.jsx:356` `:442` `:456` · `LabsParams.jsx:344` remove effect · `LayerInspector.jsx:179` `:412` (the flip already wears `kol-btn-quiet` by hand) — the pattern `MorphTab.jsx:226` already uses.
- **Outline, text (2):** `ModulationEditor.jsx:256` Learn · `:268` Pad learn — bordered pills → `tone="outline"`.
- **Menu rows, not Button (5):** `LayerInspector.jsx:228` blend · `ModulationEditor.jsx:240` expressions · `BindDot.jsx:107` sources · `TextPanel.jsx:292` sizes · `CanvasArea.jsx:1583` context menu → `MenuDropdownItem` / `ContextMenu`.
- **Chips, not Button (3):** `ColorField.jsx:153` `:163` Auto/None · `LabsParams.jsx:95` option pills → `Tag` (pressed) or `TabChips`.
- **Not targets (9):** popover triggers (`ColorField.jsx:69` · `BindDot.jsx:75` · `TextPanel.jsx:276` · `KineticPanel.jsx:532`), `TimelineDock.jsx:228` step names on the lane, `PanelHeader.jsx:99` the sheet grab, `MobileOverlay.jsx:191` the invisible show-controls target, `PanelHeader.jsx:24` the collapse title (a disclosure header), `MorphTab.jsx:222` `:233` (plan 17), `AssetsBody.jsx` (§ 5).

Three passes, not one: ghost/outline Buttons; menu rows; chips. Each lands and is looked at before the next.

## 5. `AssetsBody` → the DS browse surface (audit #6)

`compose/AssetsBody.jsx` is a hand-built `<ul>` of thumb + name. `ContentRow` / `MediaLibrary variant="browse"` is that surface; swap, keep the pick behaviour.

## 6. The editor's one denied request at mount (audit #1)

`/editor` made one external request the cloud network refused (`ERR_TUNNEL_CONNECTION_FAILED`, once, not reproduced). Locally: Network tab at mount — which host (fonts? `media.kolkrabbi.io`?), and whether a failure there leaves anything unstyled. A check, then a fix only if something degrades.

## 7. The two DS tickets (plan 17, folded in)

File to kol-ds-ui, one each, then strike:
- **Step list → kol-component** — the Morph rail's numbered `StepList` (`MorphTab.jsx`) as a list item + group, two variants: arrows, and the `drag-handle` grab. Swap the local copy when it ships (audit #5).
- **`SegmentedToggle` per-option `disabled`** — options take `{ value, label, ariaLabel, tooltip }` only (0.244.0); the greyed morph mode here is a dimmed label + tooltip + a refusing `onChange` (`MorphTab.jsx`, `dim`). The cell takes `disabled` and draws it (audit #7).

## Ignored (audit #8 · #11 · #12)

#8 `size` literals live in screens that own their rung. #11 `_tmp/` pointers in comments are history. #12 `onSaveSettings`-style names wait for a touch of those files.

## Verification

`pnpm dev`: `/labs?preset=…&cat=…` at 1600 lands with both rails open and no prompt over a draft; the four sentences wrap in mono; `pnpm build` passes with `build:lib` gone; the swept buttons read as DS ghost-quiet at 1600 and 390; the Assets list is a `ContentRow` surface; the editor's mount makes no request that fails.
