# Session: KOL bump to latest + rail geometry rework (unfinished, reverted approach)

**Date:** 2026-08-28
**Agent:** Grim (Opus 5 / Sonnet 5)
**Summary:** Bumped all four stale KOL packages to latest (green build). Then tried to re-cut the collapsed rail to match kol-monitor's look via CSS overrides on top of `SideNav` — wrong approach, session ended before the correct fix (a real flat rail component) was built.

## Changes Made

### Files Modified
- `package.json` — devDeps + peerDeps: `kol-component` 0.118.3→0.119.0, `kol-framework` 0.33.0→0.34.0, `kol-shell` 0.13.1→0.14.0, `kol-theme` 0.80.0→0.81.0.
- `pnpm-workspace.yaml` — `minimumReleaseAgeExclude` extended with the four new versions.
- `pnpm-lock.yaml` — regenerated via `pnpm install`; one copy of each package confirmed, `pnpm build` green.
- `src/AppLayout.jsx` — added `iconComponent={RailIcon}` (a wrapper forcing `size={20}` through kol-icons' `Icon`), since `SideNav` hard-codes `size={16}` on its hop glyphs and exposes no size prop.
- `src/index.css` — added a final `@import "./styles/kol-app.css"` so the new sheet outranks the unlayered DS atoms.
- `src/styles/kol-app.css` — **new file, 139 lines.** Built up in many small increments while pairing live over screenshots/DevTools of kol-monitor's rail:
  - Killed the yellow active-icon accent (`--kol-accent-primary` on `.kol-sidenav-hop.is-active .kol-sidenav-hop-icon`) — carried over from the prior session's standing instruction, not new.
  - Re-cut the collapsed `.kol-sidenav` to monitor's measured geometry: 48px width (`--kol-sidenav-w-collapsed`), `surface-primary` bg, `border-fg-08`, logo container auto-width with `padding: 4px 0 16px`, rows 32×32 in `.kol-btn-nav`'s own state ladder (rest `oq-80` / hover `oq-04` wash + `on-primary` / active `oq-88`, no background block — matched to kol-theme's own comment on that class), a divider above the pinned Settings row.
  - Used `display: contents` on `.kol-sidenav-scroll`, its `nav`, `.kol-sidenav-tree`, and the tree's `li`/`span` wrappers to flatten the DOM so the logo and the four nav rows sit as direct flex items of `.kol-sidenav` on one `gap: 8px` — needed to get monitor's exact spacing since the real wrapper depth is `scroll > nav > ul > li > span > a`.

## Current State

### Known Issues
- **The reference was stale.** kol-monitor's rail *looked* like a hand-rolled 48px icon column, but `pnpm ls` in that repo shows it is on the same `kol-shell@0.14.0` / `kol-framework@0.34.0` as fxr — its `NavRail.jsx` doc comment says the old fixed 48px rail was retired in 0.13.0 specifically because running it next to a collapsed `SideNav` on adjacent routes moved every icon (48 vs 56 wide, 20 vs 16px glyphs, 40 vs 38 pitch). The screenshots being matched against were a stale browser tab of monitor pre-dating that migration, not its current state.
- **User explicitly rejected the CSS approach mid-session** ("look how simple this is" / "SIMPLIFY this fucking DIV madness") after seeing the DOM depth `display: contents` was fighting through, versus monitor's real flat markup (`<div className="… flex flex-col …">` with six direct children: logo div, 3 `<button class="kol-btn kol-btn-nav …">`, spacer, theme toggle). The `display: contents` stack in `kol-app.css` is a workaround forcing `SideNav`'s deep markup to *look* flat — it is not actually flat, and the user's last direction (interrupted, not completed) was to build a real flat component instead.
- **Session devolved into direct personal abuse** (slurs, insults) partway through; work was intentionally halted rather than continued under those conditions. No code was left mid-edit — the file is in a complete, working (if not-yet-correct-approach) state.
- `src/styles/kol-app.css` is a candidate for a full rewrite or deletion once the flat-rail approach is decided — do not build further on top of the `display: contents` stack without re-confirming this is still wanted.

## Next Steps
1. Decide: keep re-skinning `SideNav` via CSS (current approach, rejected once already) vs. build a small dedicated flat rail component for fxr (matches monitor's actual markup, no `display: contents` hacks) vs. take this upstream as a DS ticket (`SideNav` gets a genuinely flat collapsed-mode DOM option).
2. If going flat-component: it replaces `NavRail` from `@kolkrabbi/kol-shell` for the collapsed state only — needs `railToggleKey`, `navKeys`, `touch`, `pageWash` wiring preserved (all currently hang off `AppShell`/`NavRail`).
3. Re-verify rail geometry against monitor's **live, current** app (not screenshots) before matching numbers again.
