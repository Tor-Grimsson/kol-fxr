# ShellSearchOverlayActionKeepsOpen

**Filed:** 2026-10-13 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellSearchOverlayActionKeepsOpen.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-10-13

`ShellSearchOverlay` closes after every pick though its row contract says an `action` row keeps it open. The Morph step picker's category drill-in works around it. Parked here as plan 17 until filed (2026-10-13).

## What this repo does on the return
bump; in `src/editor/morph/StepPicker.jsx` drop the `drilled` swallow and the `key={cat}` remount, use the row's `action`; walk drill in / back / pick.

**Remainder here:** none yet — on the return: the steps above.

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**: `action` and new `keepOpen` rows select and keep the modal open; the highlight resets when the rows change. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/ShellSearchOverlayActionKeepsOpen.md`.

**Remainder here:** bump kol-component ^0.252.0, then the steps above (see the resolution's "For fxr").

## Answered — 2026-10-13

kol-ds-ui closed it as **kol-component 0.252.0**. Resolution: `~/dev/projects/kol-ds-ui/lobby/done/ShellSearchOverlayActionKeepsOpen.md`. The registry still lists 0.251.0 as latest — adoption waits on the publish.

**Remainder here:** bump to 0.252.0; in `StepPicker.jsx` mark the category rows and the back row `keepOpen: true`, drop the `drilled` swallow and the `key={cat}` remount; walk drill in / back / pick.

## Adopted — 2026-10-13

kol-component 0.252.0 pinned; `StepPicker.jsx` marks the category and back rows `keepOpen: true`, the `drilled` swallow and the `key={cat}` remount are gone. Walked on `/morph`: ↓ Enter on a category → stays open, `← All categories` first, highlight 0, focus in the input; back → categories; a preset → step added, closed. 0 console errors.

**Remainder here:** none.
