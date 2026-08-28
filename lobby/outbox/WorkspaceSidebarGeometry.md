# WorkspaceSidebarGeometry — one sidebar geometry for the three workspace apps

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/WorkspaceSidebarGeometry.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — kol-framework 0.30.0, 2026-08-27

## Why it went there

The geometry is the DS's; three forks of it were the drift.

## What stays here

The swap on the bump (below).

---

## ✅ RETURNED — 2026-08-27 · kol-framework 0.30.0

🟢 `closed` in **kol-ds-ui** — `SideNav` is the one geometry: (1) ACTION LEAVES — `{ label, onSelect, active? }` beside `{ label, to }`, at any depth and as a category (`{ id, label, icon, onSelect, active? }`): a `<button>` lit by `active`, never a route, no history walked. (2) ROUTER-AGNOSTIC — pass `currentPath` and the rail never calls react-router: route leaves render `<a href>` and call `onNavigate(event, to)`; a router-free app mounts it. (3) THE COLLAPSE RULE — a top-level node with no icon (and no `to` / `onSelect`) is a LABEL: `.kol-sidenav-section`, the eyebrow over its `pages`, hidden on collapse while the icon rows beneath stay. Existing trees render unchanged. Documented in `04-compositions/02-shells.md`. 22 gates clean; the showcase builds; verified in source only.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump kol-framework 0.30.0 and put labs on `<SideNav navTree currentPath onNavigate>` — sections as icon-less label nodes over action rows (`onSelect: pick(preset)`, `active`), groups as `{ label, children }` — and retire `LabsNav.jsx` + `.kol-labs-eyebrow` to `_tmp/`; kol-monitor's `ModuloSidebar` and kol-mirror's `MirrorSidebar` swap in their own tickets.

## ✅ ADOPTED — 2026-08-27 · kol-framework 0.30.0

`LabsNav.jsx` is a navTree builder now — **576 → 379 lines**, and every line of
rail markup is the DS's.

- **The tree.** Sections are bare labels (`{ label }`, no icon/route/action) and
  the icon categories follow as SIBLINGS, not children — nesting them under the
  label would take the whole subtree down on collapse with it. App
  destinations (Library · Editor · Labs · Randomiser · Settings) are route rows
  at the head, since `LabsView` hides AppShell's rail while labs is mounted.
- **Every leaf is an action leaf** — `{ label, onSelect, active }`. Measured:
  picking ASCII swapped the layer and **`history.length` did not change and the
  URL did not move**, so `LabsView.jsx`'s replace-not-push `?preset=` contract
  is untouched. That was the whole reason labs could not use the old rail.
- **Retired to `_tmp/2026-08-27-workspace-sidebar/`**: `NavIcons`,
  `NavSectionGroup`, `NavSection`, `NavGroup`, `NavLeaf`, `LeafGroupLabel`, the
  local `useDragResize` / open-key / open-section state, and
  `.kol-labs-eyebrow`'s collapse rule in `kol-labs.css` — SideNav ships
  `.kol-sidenav-section` and hides it itself.

Verified in a browser: 5 section labels · 28 icon rows · disclosure works
(Halftone → Dither/ASCII/Bitmap, the pick lands in the right rail) · collapse
round-trip 229 ⇄ 32px with the stamp set and cleared, 28 icon rows surviving
and 0 labels/lists showing collapsed, 5 labels back on expand · no console
errors · build green.

Two notes for the DS. The collapsed rail measures **32px** against the old
fork's 56 — SideNav's own token, so presumably intended, but it is tight for a
16px glyph plus padding and worth a look. And `useDragResize` left a live call
behind when the local rail went: the bundler does not catch that (it is a
runtime `ReferenceError`, not a build error), so a consumer adopting this will
build green and crash on mount if it misses one.

**Remainder here:** none.
