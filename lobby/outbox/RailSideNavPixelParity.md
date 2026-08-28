# RailSideNavPixelParity — one rail, both states, to the pixel

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/RailSideNavPixelParity.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-27 · kol-framework 0.31.0 · kol-theme 0.80.0 · kol-shell 0.13.0 — adopted here the same day

## Why it went there

User: *"nothing has to shift … maintain the position of the icons, to the
pixel"* · *"I think it's best in brand"* · *"same component both states super
nice."* The shell rail (kol-shell `NavRail`, 48 wide, 20 px glyphs, 40 pitch)
and labs' collapsed rail (kol-framework `SideNav`, 56 / 16 px / 38) are two DS
components that were never measured against each other; every icon moves on
the route into labs and the canvas shifts 8 px. Ruling: AppShell's rail IS a
collapsed `SideNav` — one component, both states — with `bottomItems` and one
width token. Measured table in the entry.

## What stays here

On the return: bump; AppLayout's rail and labs' rail become the same component
in two states; drop the `seedCollapsedOnce` and the flex-stretch rule if the
DS mounts it as the layout's own column; re-measure both routes to the pixel.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump 0.31.0 / 0.80.0 / 0.13.0; drop `seedCollapsedOnce`; re-measure /library ⇄ /labs.

## ↩ RETURNED — 2026-08-28

Closed in kol-ds-ui on the ruling "the rail IS a collapsed SideNav": **kol-framework 0.31.0** (`SideNav` `bottomItems` · `footer` · `themeToggle` · `iconComponent` · `expandOnSelect` · `defaultCollapsed`), **kol-theme 0.80.0** (`--kol-shell-rail-width` live, `.kol-shell-rail` retired), **kol-shell 0.13.0** (`AppShell` on `.kol-brand-layout`; `NavRail` = the SideNav adapter, collapsed, `hairline`; the logomark in the footer). Verified in source only.

Remainder here: bump the three; drop `seedCollapsedOnce` (the shell rail boots collapsed on its own) and the labs flex-stretch if labs now mounts the same rail; re-measure `/library` ⇄ `/labs` to the pixel.

## ✅ ADOPTED — 2026-08-27 · framework 0.31.0 · theme 0.80.0 · shell 0.13.0

Labs' rail is mounted prop-for-prop the way `NavRail` (shell 0.13.0) mounts
the shell rail: `bottomItems` (Settings, out of the tree), the logomark as the
`footer` (→ `/`), `expandOnSelect={false}`, `defaultCollapsed` (replaced the
render-phase localStorage seed), `hairline`, the same `isActive`. The Home row
went — it had shifted every destination 38 px. `.kol-editor-left`'s own
border-right went too: it doubled SideNav's hairline and ate the pixel that
made this rail 55 against the shell's 56.

**Re-measured, `/library` ⇄ `/labs`, stamp cleared first so both boot from the
DS default:** rail 56 on both · Library y 26 · Editor 64 · Labs 102 ·
Randomiser 140, all at x 19.5, 16 px · footer 844 with the logomark on both.
**Identical.** A destination press leaves the stamp `collapsed` and lands on
`/library` on the same pixels. A category press while collapsed opens the rail
and discloses (that path is not gated by `expandOnSelect`, correctly).

**One finding, the DS's:** `SideNav` keeps the theme slot and `bottomItems`
INSIDE `.kol-sidenav-scroll`. Fine on a 4-row tree (`/library`: theme 760,
Settings 802, above the footer). On labs' 26-row collapsed tree they scroll
with it — theme **934**, Settings **976**, below a 900 px viewport and below
the footer. "Pinned below the theme, above the footer" holds only while the
tree is shorter than the rail. Reported back; not shimmable from here (it is
SideNav's own DOM).

## ✅ RESOLVED — 2026-08-27 · kol-framework 0.31.1

The pinning finding above is fixed at the DS: the theme slot and `bottomItems`
are the block after `.kol-sidenav-scroll`, above the footer; only the tree
scrolls. Bumped and re-measured the pair, stamp `collapsed` on both:

| | `/library` (5 rows) | `/labs` (25 rows) |
|---|---|---|
| Library · Randomiser | 26 · 140 | 26 · 140 |
| theme slot | 760 | 760 |
| Settings | 802 | 802 |
| footer | 844 | 844 |

Identical, every row. Theme and Settings measured outside the scroll region.
**Remainder here:** none.
