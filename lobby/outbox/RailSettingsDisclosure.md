# RailSettingsDisclosure — Settings as a click-open/close disclosure, theme inside

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailSettingsDisclosure.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` at the DS (framework 0.34.0 + shell 0.14.0, the shell half withdrawn by 0.16.0) · ⚫ `retired` here 2026-08-30, user ruling (synced 2026-10-07)

## Why it went there

Built here first on the user's order ("we make it work here then ship it"):
`src/editor/labs/RailSettings.jsx` + the `bottomItems` action leaf in
`LabsNav.jsx`. Labs' rail has it; the shell rail cannot (NavRail has no
footer/disclosure seam), so on `/` · `/library` · `/settings` Settings is still
a route row — same gear, same pixel. The DS ships the seam so both rails
behave identically; fxr's file is the reference.

## What stays here

On the return: bump; delete `RailSettings.jsx` and the local action-leaf wiring
for the DS's shape; re-measure the pair.

**Remainder here:** none — retired 2026-08-30, see below.

## ↩ RETURNED — 2026-08-28

Closed in kol-ds-ui: **kol-framework 0.34.0** (`SideNav` panel leaf `{ id, label, icon, panel }` — your RailSettings.jsx geometry, portalled above the row at the rail's width; `panel` may be `({ collapsed, close }) => node`) + **kol-shell 0.14.0** (`AppShell settings={{ icon, path, label }}` — the gear as the disclosure, theme toggle + settings row inside, rail theme slot off). Verified in source only.

Remainder here: bump both; pass `settings` on AppShell; labs' Settings leaf becomes `{ …, panel }` with the same content and RailSettings.jsx retires to `_tmp/`; re-measure the gear at 858 on both routes. The yellow active icon is held for the user.

## 🔴 SUPERSEDED BEFORE ADOPTION — 2026-08-28 · needs the user's ruling

Never adopted here, and the shape it returned no longer exists.

The return above landed as **kol-framework 0.34.0** (`SideNav` panel leaf) +
**kol-shell 0.14.0** (`AppShell settings={{ icon, path, label }}`). Later the
same day **kol-shell 0.16.0** reversed the rail to the flat `NavRail`
(`RailFlatGrabOpen`, ruled from kol-mirror) and its own docstring records the
casualty:

> *NOTE (0.16.0): `settings` and `themeToggle` left with the SideNav-backed rail
> — the flat rail carries neither.*

So the disclosure seam was shipped and withdrawn inside one day, and fxr bumped
straight past it (0.14.0 → 0.16.0 → 0.16.1). Both halves are gone: `AppShell`
has no `settings` prop, and labs no longer mounts `SideNav` at all, so the
framework panel leaf has nothing to attach to either.

**Current behaviour here:** Settings is a pinned `bottomItems` row on the one
rail, on every route, and it TOGGLES — click opens `/settings`, click again
returns to the page it was opened from (kol-mirror's model, ported 2026-08-28).

**Dead code this leaves:** `src/editor/labs/RailSettings.jsx` is unreferenced.

**The ruling owed — the agent will not make it (statuses are the user's call):**
either ⚫ `retired` (the flat rail's pinned-row-plus-toggle is the answer and the
disclosure is not wanted), or **re-file against `NavRail`** if the disclosure
panel is still the shape you want, since the ticket that closed it was aimed at
a component that is no longer in the tree.

**Remainder here:** blocked on that ruling. On ⚫ — retire `RailSettings.jsx` to `_tmp/` and close the row. On re-file — a new ticket against `NavRail`, this one stays history.


## ⚫ RETIRED — 2026-08-30 · user ruling

Dead. `src/editor/labs/RailSettings.jsx` had no importer and the shape it was
built for was deleted from the DS (kol-shell 0.16.0) before fxr ever adopted it.
The need it served is met anyway: the rail's Settings row toggles, and `,` opens
the settings drawer from anywhere without leaving the page.

Moved to `_tmp/2026-08-30-railsettings-dead/`. Build green. Nothing in the app
changed — nothing referenced it.

**Remainder here:** none — retired 2026-08-30.
