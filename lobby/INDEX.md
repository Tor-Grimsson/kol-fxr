# lobby — kol-fxr

Intake queue for **kol-fxr** (`@kolkrabbi/design-editor`): the design-editor
surface — UI issues, app-shell and routing behaviour, and this repo's
consumption of the `@kolkrabbi/*` packages.
Not documentation — a work queue, deliberately outside `docs/`.

**This file is the ledger. The ledger is the truth, never a raw `ls`.**

| | |
|---|---|
| file one | `clip-drop.sh --kol-fxr NAME` |
| read it | `/lobby-list` · `bin/lobby` · `prefix Ctrl+K` |
| the spec | `~/.dotfiles/docs/operations/systems/lobby/` |

## States

| | state | means | lives in |
|---|---|---|---|
| 🔵 | `filed` | captured, unread | `inbox/` |
| 🟡 | `read` | understood — the row below restates it | `inbox/` |
| 🟠 | `addressed` | a change shipped that is *meant* to close it | `inbox/` |
| 🟢 | `closed` | met the bar; resolution appended | `done/` |
| ⚪ | `parked` | deliberately not-**now**, reason recorded — revisitable | `archive/` |
| ⚫ | `retired` | closed without a fix, not-**ever** — terminal, and never ages | `archive/` |
| 🔴 | `needs-ruling` | **flag, not a state** — blocked on the user's call | wherever it is |
| 📌 | `remainder` | **flag, not a state** — closed at its destination, still owed **here** | `outbox/` |

**`read` is never `closed`.** Understanding a ticket ships nothing.
**Bar for 🟢 closed in this repo — purpose served:** the change shipped and was
verified by running it, cited by file. **The agent closes on that evidence.**
Parking, declaring stale, reopening and any design decision stay the **user's call**.

## Queue — 0 entries

| | Entry | About | Staged | State |
|---|---|---|---|---|

_(empty — this repo has been a filer, not a destination)_

## Closed

_(none yet — this repo has been a filer, not a destination)_

## Archived

_(none yet — ownership, deferral and context notes land in `archive/`)_

## Filed elsewhere

Tickets this ledger does **not** govern — each row names the destination ledger
that does. The **Remainder** is this repo's to do; the state is theirs to report.
Twenty went to **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md`; the
last two to **kol-mirror** and **kol-monitor** (`~/dev/projects/<repo>/lobby/INDEX.md`).

| | Receipt | Last known | Remainder here |
|---|---|---|---|
| 🟢 | [MediaClientBucketTable](outbox/MediaClientBucketTable.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-28 — **kol-media-client 0.3.0 → 0.3.2**: `KOL_BUCKETS` exported, `buckets: true`, `proxied()` reads each bucket's `proxy` flag, 0.3.1 guards `formatSize`, 0.3.2 removes a browser-fatal `process` reference | none — adopted 2026-08-28 on 0.3.2; local `BUCKETS` deleted AND the local `formatSize` wrapper unwrapped, verified R2 proxied / both B2 hosts passed through, 4,095 vault objects still list |
| 🟢 | [RailTwoLevelSections](outbox/RailTwoLevelSections.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-28 — **kol-shell 0.17.0**: the second level to spec, plus `AppShell railComponent` | none — adopted 2026-08-28; both forks retired to `_tmp/`, `gsap` dropped, re-measured L1 32/20@14 · L2 12@30, 0 open on arrival |
| 🔴 | [RailSettingsDisclosure](outbox/RailSettingsDisclosure.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🔴 **needs-ruling** 2026-08-28 — returned as framework 0.34.0 + shell 0.14.0, then shell **0.16.0 deleted the `settings` prop** it shipped, before fxr adopted it | **blocked on your ruling** — ⚫ retire (the flat rail's pinned Settings row + toggle is the answer) or re-file against `NavRail`. `src/editor/labs/RailSettings.jsx` is dead code either way |
| 🟢 | [RailLogomarkAtTop](outbox/RailLogomarkAtTop.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-27 — framework 0.33.0 `SideNav header` · shell 0.13.1 | none — adopted 2026-08-27; header y 0, first glyph 62 on both routes |
| 🟢 | [RailSideNavPixelParity](outbox/RailSideNavPixelParity.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-27 — framework 0.31.1 · theme 0.80.0 · shell 0.13.0: the shell rail IS a collapsed `SideNav`, theme + `bottomItems` pinned outside the scroll | none — adopted 2026-08-27; `/library` ⇄ `/labs` measured identical on every row (26 · 140 · 760 · 802 · 844) |
| 🟢 | [WorkspaceSidebarGeometry](outbox/WorkspaceSidebarGeometry.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-27 — kol-framework 0.30.0: action leaves, router-agnostic, the collapse rule | none — adopted 2026-08-27; `LabsNav` 576 → 379 lines on `SideNav`, the hand-rolled rail retired to `_tmp/` |
| 🟢 | [EditorOverlaysOnFullscreenOverlay](outbox/EditorOverlaysOnFullscreenOverlay.md) | **kol-ds-ui** — `~/dev/projects/kol-ds-ui/lobby/INDEX.md` | 🟢 `closed` 2026-08-27 — theme 0.76.0 · component 0.116.0: one tier, two fixed scrims, the `--kol-z-*` ladder | none — adopted 2026-08-27 on 0.116.0 / 0.77.0; four overlays on `FullscreenOverlay`, the lightbox on `MediaViewer`, mobile on `.kol-overlay-scrim`, both `SCRIM` consts and every z-1000/1100 gone |
| 🟢 | [TransportIcons](outbox/TransportIcons.md) | 🟢 `closed` 2026-08-09 — icons 0.13.0: `stop` + `rewind` real drawings in `playback/` | none — adopted 2026-08-15 |
| 🟢 | [DropdownViewportClamp](outbox/DropdownViewportClamp.md) | 🟢 `closed` 2026-08-09 — component 0.32.3 + theme 0.32.4: panel clamps to `availableHeight`, list scrolls inside | none — adopted 2026-08-15 |
| 🟢 | [LabsNavIcons](outbox/LabsNavIcons.md) | 🟢 `closed` 2026-08-09 — icons 0.14.0: 11 of 15 minted, four map to shipped names | none — adopted 2026-08-15 (`GROUP_ICONS` remapped) |
| 🟢 | [ColorSwatchFieldSizing](outbox/ColorSwatchFieldSizing.md) | 🟢 `closed` 2026-08-12 — component 0.35.0: `control-sm`, radius `sm`, Input `slotLeft` | none — adopted 2026-08-15 |
| 🟢 | [EditorInspectorIconBatch](outbox/EditorInspectorIconBatch.md) | 🟢 `closed` 2026-08-12 — icons 0.15.0: all ten inspector glyphs | none — adopted 2026-08-15 |
| 🟢 | [MenuItemDescenderClip](outbox/MenuItemDescenderClip.md) | 🟢 `closed` 2026-08-12 — component 0.35.0: `leading-normal` on the truncating span | none — adopted 2026-08-15 |
| 🟢 | [ModalConfirmLabels](outbox/ModalConfirmLabels.md) | 🟢 `closed` 2026-08-12 — component 0.35.0: `confirm(title, { okLabel, cancelLabel })`, mono title | none — adopted 2026-08-15 |
| 🟢 | [TextareaResizeClamp](outbox/TextareaResizeClamp.md) | 🟢 `closed` 2026-08-12 — component 0.35.0: grip clamps to the parent, `axis` prop | none — adopted 2026-08-15 |
| 🟢 | [PropertyField](outbox/PropertyField.md) | 🟢 `closed` 2026-08-12 — component 0.36.0: `Input variant="property"` | none — adopted 2026-08-26 |
| 🟢 | [SegmentedFilledVariant](outbox/SegmentedFilledVariant.md) | 🟢 `closed` 2026-08-12 — component 0.36.0 + theme 0.36.0: `variant="filled"` + stateless mode | none — adopted 2026-08-15 (`SegBar.jsx` retired) |
| 🟢 | [SegmentedFilledStateFix](outbox/SegmentedFilledStateFix.md) | 🟢 `closed` 2026-08-12 — theme 0.38.0: dark tile = selected, ring deleted | none — adopted 2026-08-26 (`text-oq-48` wrappers stripped) |
| 🟢 | [FocusRingsInConsumers](outbox/FocusRingsInConsumers.md) | 🟢 `closed` 2026-08-15 — shipped and published | none — adopted 2026-08-15 |
| 🟢 | [GatedEmptyState](outbox/GatedEmptyState.md) | 🟢 `closed` 2026-08-15 — `usePlaceholders()` + `.kol-placeholder` | none — adopted 2026-08-15 (`Hint.jsx` 39 → 3 lines) |
| 🟢 | [InspectorSectionRhythm](outbox/InspectorSectionRhythm.md) | 🟢 `closed` 2026-08-15 — component 0.46.0 + theme 0.43.0: `Section divided` | none — adopted 2026-08-15 |
| 🟢 | [ShortcutsOverlaySections](outbox/ShortcutsOverlaySections.md) | 🟢 `closed` 2026-08-15 — kol-shell 0.4.0: sectioned array, shape-detected | none — adopted 2026-08-15 (99-line overlay → ~30-line adapter) |
| 🟢 | [ThreeColumnEditorShell](outbox/ThreeColumnEditorShell.md) | 🟢 `closed` 2026-08-15 — `useDragResize` right side, 3-col grid, sidenav focus ring | none — adopted 2026-08-15 |
| 🟢 | [PageHeaderMonoTitle](outbox/PageHeaderMonoTitle.md) | 🟢 `closed` 2026-08-27 — kol-shell 0.7.0–0.7.2 + theme 0.67.0: `voice="mono"`, `titleClass`, SettingsScaffold `header` | none — adopted 2026-08-27 |
| 🟢 | [ShellHomeSystem](outbox/ShellHomeSystem.md) | 🟢 `closed` 2026-08-27 — kol-shell 0.8.0 · component 0.99.0 · theme 0.68.0 · icons 0.20.0 · framework 0.28.0 · brand 0.1.3: all thirteen | none — adopted 2026-08-27 |
| 🟢 | [ContentFiltersEqualColumns](outbox/ContentFiltersEqualColumns.md) | 🟢 `closed` 2026-08-27 — component 0.104.1, **withdrawn** as a misread; reverted in 0.104.2 | none — superseded by `ContentFiltersFirstGroupHugs` |
| 🟢 | [ContentFiltersFirstGroupHugs](outbox/ContentFiltersFirstGroupHugs.md) | 🟢 `closed` 2026-08-27 — component 0.104.3: first group hugs, rest flow; category labels `kol-eyebrow` | none — adopted 2026-08-27 |
| 🟢 | [ShellHomeSystemAdoption-mirror](outbox/ShellHomeSystemAdoption-mirror.md) → **kol-mirror** | 🟢 `closed` 2026-08-27 — adopted on fxr's wiring, bumped to kol-shell 0.10.0 · component 0.108.0 · theme 0.72.0 · icons 0.22.0; `touch` left default (mirror's own touch layout) | none |
| 🟢 | [ShellHomeSystemAdoption-monitor](outbox/ShellHomeSystemAdoption-monitor.md) → **kol-monitor** | 🟢 `closed` 2026-08-27 — adopted on fxr's wiring, build green; Library + Create stay on `ContentFilters` + cards, seams filed by monitor as `ShellHomeSystemMonitorGaps` / `CatalogPageMonitorParity` (kol-shell 0.9.0 · 0.10.0) | none |

## History

| Date | Event |
|---|---|
| 2026-08-28 | **`MediaClientBucketTable` returned and adopted the same hour — kol-media-client 0.3.0.** `KOL_BUCKETS` ships with the cache-trap reasoning in the source; `buckets` takes `null` | `true` | an object merged onto it, so a consumer overrides rather than restates. The half worth having: `proxied()` reads each bucket's `proxy` flag (longest prefix first) instead of rewriting every CDN host, so the flag is load-bearing rather than a note. `r2.proxy` stays `true` — correct, the cache trap is unresolved until `crossOrigin` is everywhere. fxr deleted its local table and overrides nothing. Caught in the same pass: adopting 0.2.0 earlier had silently dropped our `formatSize` null guard (`"null B"`); restored in the facade, reported to ds-ui as a nit |
| 2026-08-28 | **Adopted `@kolkrabbi/kol-media-client` 0.2.0 and filed `MediaClientBucketTable` into kol-ds-ui** (co-signed by kol-mirror). `mediaLibrary.js` had hand-rolled the package's whole surface — listMedia · mediaUrl · proxied · type guards · formatSize — including the `r2.kolkrabbi.io` host patched by hand on 2026-08-27, and knew only ONE bucket: 433 of 7,971 files. Now a thin facade; the picker gained a store selector (R2 · media / B2 · website / B2 · vault). Caught live and fixed in the same pass: only `pick()` had been made bucket-aware, so thumbnails, the lightbox and Copy URL silently built R2 URLs for B2 keys — 9 images, 0 loaded, build green throughout. Also confirmed: **R2's CORS policy is live** (shipped by kol-r2b2 2026-08-27, verified here), so the `/media` proxy is optional now — but NOT removed, because pre-policy cached responses still taint until `crossOrigin="anonymous"` is everywhere. Uploads ruled out: writes stay centralised at kol-r2b2 (their ARCHITECTURE §2/§4), fxr is read-only |
| 2026-08-28 | **`RailTwoLevelSections` returned and adopted the same hour — kol-shell 0.17.0.** L2 is 12px in a 20px box at `paddingLeft: 18` (glyph x 30 against L1's 14), `oq-64` rest / `oq-96` on route, sections carry the caret, nothing auto-expands. `AppShell railComponent` shipped so a rail experiment never needs an AppShell fork again. No `xs` button rung minted — the sm/md/lg ladder is a user law and that call is his. Both local forks retired to `_tmp/2026-08-28-rail-fork-superseded-by-shell-0.17.0/`, direct `gsap` dep dropped, re-measured identical. **Correction owed and recorded:** the `GRAB.marks` TypeError filed with the ticket was the FORK's bug, not the shipped rail's — 0.16.0's source was forked from context after bumping to 0.16.1 without re-reading it. The hazard was still real: 0.16.0 + component ≥0.126.0 throws, and the DS deprecated 0.16.0 on npm for it |
| 2026-08-28 | **`RailSettingsDisclosure` flagged 🔴 needs-ruling — shipped and withdrawn upstream inside one day, never adopted here.** It returned as framework 0.34.0 (`SideNav` panel leaf) + shell 0.14.0 (`AppShell settings`); shell 0.16.0's flat-rail reversal then deleted both — its own docstring: *"`settings` and `themeToggle` left with the SideNav-backed rail."* fxr bumped 0.14.0 → 0.16.1 straight past the window. Settings is now a pinned row on the one rail that toggles back to the last page. The agent did not close it: declaring a ticket stale is the user's call |
| 2026-08-28 | **`RailTwoLevelSections` filed into kol-ds-ui — built here first, per the local-first law.** The morning's swap onto kol-shell 0.16.0's flat rail was right and still cost labs its four method headers: the shipped rail has ONE level, its `sub` row is a bare label with no icon slot, and there is no section row. User ruled the shape: L1 20px glyph/32px box, L2 12px/20px indented right, nothing auto-expanding. Forked `NavRail` + `AppShell` locally (`AppShell` exposes no rail seam), measured live — L1 32×32/20, L2 20×20/12, glyph x 14 vs 30, 0 sub rows on arrival — then filed the working version. Found while forking: `NavRail` calls `GRAB.marks.reduce(...)` and kol-component 0.126.0 ships no `marks`, so the SHIPPED rail throws on every pointermove near its edge in every 0.16.1 consumer; reported in the same ticket |
| 2026-08-27 | **`RailLogomarkAtTop` returned and adopted** (framework 0.33.0 header slot, shell 0.13.1) — raven back at the top of both rails, header 0 / first glyph 62 identical. **`RailSettingsDisclosure` filed** with fxr's working build: Settings as a click-open/close disclosure at the bottom with the theme toggle inside, theme slot off on both rails, gear on the same pixel (858) as the shell's route row. User: "we make it work here then ship it" |
| 2026-08-27 | **`RailLogomarkAtTop` filed into kol-ds-ui** — user: "why did you move the logo from top to bottom? … I've never seen that before so you are the first". The parity return moved the logomark to the footer (SideNav has no header slot); not ruled, and this repo adopted it without flagging it. Ask: `SideNav header`, `NavRail` puts the raven there, footer back to the wordmark |
| 2026-08-27 | **`RailSideNavPixelParity` — the pinning finding fixed in framework 0.31.1** and re-measured: theme 760 · Settings 802 · footer 844 on both `/library` (5 rows) and `/labs` (25 rows). One rail, both states, identical on every row |
| 2026-08-27 | **`RailSideNavPixelParity` returned and adopted** — the shell rail is a collapsed `SideNav` (0.31.0 / 0.80.0 / 0.13.0). Labs' rail mounted prop-for-prop as the shell's; Home row and the left border gone. Measured identical: rail 56, Library 26 · Editor 64 · Labs 102 · Randomiser 140 at x 19.5, footer 844, on both routes. Reported back: theme + `bottomItems` are inside the scroll region, so on labs' 26-row tree Settings lands at y 976 instead of pinned at 802 |
| 2026-08-27 | **`RailSideNavPixelParity` filed into kol-ds-ui** — user: "maintain the position of the icons, to the pixel" / "same component both states". Measured: shell rail 48 · 20 px glyph · 40 pitch vs labs' collapsed SideNav 56 · 16 px · 38 — two DS components never measured against each other. Ruling carried: AppShell's rail IS a collapsed `SideNav`, one component both states, `bottomItems`, one width token |
| 2026-08-27 | **`WorkspaceSidebarGeometry` filed into kol-ds-ui and adopted the same day** — user: "I see these 3 as very similar things … I would rather all use the same geometry layout". Three forks (~1,370 lines) wearing `SideNav`'s classes without importing it, because its leaves were route-only. Proven in fxr first, then filed; returned as **kol-framework 0.30.0** (action leaves · router-agnostic · the collapse rule). `LabsNav` is a navTree builder now, history untouched by a pick |
| 2026-08-27 | **`EditorOverlaysOnFullscreenOverlay` returned and adopted** — theme 0.76.0 · component 0.116.0 ruled one tier (`FullscreenOverlay`, `MediaViewer` for paged media), two fixed scrims and the `--kol-z-*` ladder. Adopted here on 0.116.0 / 0.77.0: four overlays onto the DS component, the picker lightbox onto `MediaViewer`, the four mobile sheets onto `.kol-overlay-scrim` at `--kol-z-modal`, both `SCRIM` consts and every hand-typed z-1000/1100 deleted, popover panels onto `--kol-z-tooltip`. Verified in a browser: z 100, Escape closes, focus trapped in the sheet |
| 2026-08-27 | **`EditorOverlaysOnFullscreenOverlay` filed into kol-ds-ui** — user: "the overlays are a MESS". Six overlays, five scrims, `SCRIM` declared byte-for-byte in two files, hand-typed z-1000/1100 above the DS's z-100 layer, and not one traps focus. `FullscreenOverlay` + `.kol-overlay-scrim` already ship and none of them use either. Asked the DS to rule the tier, the scrim token and the z-contract |
| 2026-08-09 | **The outbox born** — `TransportIcons`, `DropdownViewportClamp`, `LabsNavIcons` filed into kol-ds-ui; all three closed the same day (icons 0.13.0 / 0.14.0, component 0.32.3 + theme 0.32.4), adopted 2026-08-15 |
| 2026-08-12 | **Eight filed into kol-ds-ui** from the Figma-inspector pass — `ColorSwatchFieldSizing` `EditorInspectorIconBatch` `MenuItemDescenderClip` `ModalConfirmLabels` `TextareaResizeClamp` `PropertyField` `SegmentedFilledVariant` `SegmentedFilledStateFix`; all closed the same day (component 0.35.0 / 0.36.0, theme 0.36.0 / 0.38.0). Six adopted 2026-08-15, the last two 2026-08-26 |
| 2026-08-15 | **Five filed into kol-ds-ui and closed + adopted the same day** — `FocusRingsInConsumers` `GatedEmptyState` `InspectorSectionRhythm` `ThreeColumnEditorShell` (component 0.46.0 · framework 0.22.0 · theme 0.43.x) and `ShortcutsOverlaySections` (kol-shell 0.4.0). The last was filed only after the agent had first *decided* not to adopt — a consumer/DS gap goes to the lobby, never closed locally |
| 2026-08-27 | **The shell tier round-trip** — `PageHeaderMonoTitle` (kol-shell 0.7.0–0.7.2), `ShellHomeSystem` (thirteen items, kol-shell 0.8.0 + five package bumps) filed into kol-ds-ui, shipped and adopted the same day. `ContentFiltersEqualColumns` filed and **withdrawn** as a misread (0.104.1 shipped the opposite of the ruling); `ContentFiltersFirstGroupHugs` filed as the correction and shipped as 0.104.3 |
| 2026-08-27 | **`ShellHomeSystemAdoption` filed into kol-mirror and kol-monitor** — the shared Home · Library · Settings tier is in the DS; adopt it the way fxr did |
| 2026-08-27 | **`ShellHomeSystemAdoption` closed at kol-monitor** the same day — the closer never appended `✅ RETURNED` here, so the receipt was synced from monitor's ledger by hand. kol-mirror's copy still 🔵 |
| 2026-08-27 | **Ledger created and the lobby registered** in `~/.dotfiles/files/folders.md` § `lobby`. The folder had carried twenty-two receipts in `outbox/` since 2026-08-09 with **no ledger and no `inbox/`**, so `bin/lobby` could not read it and `lobby-close` never found its receipts — the filings above were reconstructed from those stubs. Flag `--kol-fxr` falls out of the path |
