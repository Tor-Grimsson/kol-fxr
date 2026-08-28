# Session: KOL bump to 0.16.0 and the one-rail swap

**Date:** 2026-08-28
**Agent:** Grim (Sonnet 5)
**Summary:** Bumped four KOL packages to latest, then swapped labs off kol-framework's `SideNav` onto kol-shell's flat `NavRail` — one rail component on every route.

## Changes Made

### Files Modified
- `package.json` — devDeps + peerDeps: `kol-component` 0.119.0→**0.125.0**, `kol-framework` 0.34.0→**0.35.0**, `kol-shell` 0.14.0→**0.16.0**, `kol-theme` 0.81.0→**0.88.0**.
- `pnpm-workspace.yaml` — `minimumReleaseAgeExclude` extended with the four new versions.
- `pnpm-lock.yaml` — regenerated; ONE copy of each confirmed (`pnpm why`), `pnpm build` green. `gsap` is a new kol-shell peer and resolves transitively through kol-component 0.125.0 — nothing to add here.
- `src/styles/kol-app.css` — **retired to `_tmp/2026-08-28-kol-app-css-dead-sidenav-hack/`**, import dropped from `src/index.css`, the now-empty `src/styles/` removed. Every selector in it was `.kol-sidenav.is-collapsed`, which 0.16.0's rail no longer produces.
- `src/railExtras.js` — **new.** A tiny `useSyncExternalStore` store letting a route hand rows to the shell rail. Rows carry sentinel paths (`#rail/…`) and a `dispatch` map, because `NavRail` only knows `onNavigate(path)` and labs' leaves dispatch rather than route.
- `src/AppLayout.jsx` — consumes the store (`[...NAV_ITEMS, ...extras.items]`), routes sentinel paths to `dispatch`. Dropped the stale `iconComponent`/`RailIcon` seam (NavRail hardcodes `iconSize={20}` itself now) and `themeToggle={false}` (gone from AppShell in 0.16.0). Ported kol-mirror's Settings-row toggle: click opens `/settings`, click again returns to the last page.
- `src/editor/labs/LabsNav.jsx` — **renders `null` now.** Builds the same `navTree` and publishes it as NavRail rows in an effect. `SideNav`, `Logomark`, `RailSettingsPanel`, `useNavigate`/`useLocation` imports all gone.
- `src/editor/labs/LabsView.jsx` — the `setNavHidden(true)` mount-timeout + re-assert pair **deleted**; `useNavHidden` import gone. `LabsNav` moved out of the `left.body` panel slot and mounted directly in `LabsBody` (the wrapper is `contents`, so it costs no layout).
- `src/editor/styles/kol-labs.css` — nav track → `0px`; the `:root[data-sidenav="collapsed"]` track rule, the `.kol-editor-rail-body > .kol-sidenav` stretch rule and the `data-sidenav-dragging` half of the transition-suspend all removed.

### Features Added/Removed
- **One rail component across the whole app.** Labs no longer mounts a second, different nav — same `NavRail`, same grab-drag open, same active styling.
- **Removed:** labs' in-rail Settings disclosure. `src/editor/labs/RailSettings.jsx` is now unreferenced (left in place, not retired). The rail's Settings row goes to `/settings` like everywhere else.
- **Removed (upstream, not by us):** `AppShell` lost `settings` and `themeToggle` in 0.16.0.

## Current State

### Working
- `/library` · `/editor` · `/labs` · `/randomiser` all render exactly one `.kol-shell-rail` at 48px with the `.kol-rail-grab` handle. Verified in a browser: `.kol-sidenav` is absent from `/labs` entirely, 44 rows (4 destinations + labs' categories with chevrons), rail background and border measure identical on all three routes.
- `pnpm build` green.

### Known Issues
- **Section headers do not render.** `NavRail` has no section-anchor row, so labs' bare EFFECTS / GENERATIVE / COMPOSITION / MODULATION labels are gone; every icon row they grouped still renders, in order. **This is the ticket owed to kol-ds-ui** — not filed yet.
- **The labs rail changed colour.** The old `SideNav` was mounted `background={false}` and showed the editor rail-body behind it; `NavRail` hardcodes `bg-surface-primary` in its own className (`NavRail.jsx:223`), so labs' rail now matches Library/Editor instead of being darker. Consistent by construction — user was asked and had no strong call either way. An override on `.kol-editor-labs .kol-shell-rail` is the escape hatch if he wants the dark column back.
- `navKeys` (⌥1–9) maps to `items[n-1]`, and labs' rows are appended to `items` — so on `/labs` the digits past ⌥4 now land on categories. Not raised, not verified.
- **`RailSettingsDisclosure` (🔵 at kol-ds-ui) is moot** — it was filed against the SideNav-backed rail's footer, which 0.16.0 removed. Needs closing or redirecting; user's call.
- `RailSettings.jsx` is dead code, left in the tree.

### Process notes
- `pnpm outdated` returned nothing while four packages were behind — the **fourth** time. `npm view <pkg> dist-tags` is the check.
- Deleting `kol-app.css` silently broke labs' collapsed rail: those rules were the ONLY styling a manually `.is-collapsed`-stamped `SideNav` received, since kol-framework retired its manual collapse mode in 2026-07-29 (the surviving rules are `:root[data-sidenav]` and the ≤1024px breakpoint). Two symptom-chasing fixes went in before `NavRail.jsx` was actually read; the user's screenshots are what forced the correct read. **Read the shipped component before theorising about its CSS.**

## Next Steps
1. **File the section-header gap at kol-ds-ui** — `NavRail` needs a section-anchor row (a bare label that collapses to nothing) so labs' four method headers come back.
2. Close or redirect `RailSettingsDisclosure` in `lobby/INDEX.md` — the shape it asked for no longer exists.
3. Decide the labs rail background (match, or override back to the darker column).
4. Retire `src/editor/labs/RailSettings.jsx` to `_tmp/` once 2 is settled.
5. Check ⌥5–9 on `/labs` now that categories extend `items`.
