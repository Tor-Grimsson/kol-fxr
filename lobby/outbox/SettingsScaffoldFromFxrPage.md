# SettingsScaffoldFromFxrPage — `SettingsScaffold` takes aim from our `/settings`

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsScaffoldFromFxrPage.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟣 `filed` 2026-08-30 — a DISCUSSION, no close bar

> **⛔ DO NOT START, either side.** User ruling at filing: *"just make sure to
> no auto trigger this task, I wanna talk about it there."* Nothing here or
> there moves until he opens it in kol-ds-ui himself.

## Why it went there

`SettingsScaffold` draws its own header — a third header shape beside
`PageHeader` and `ContentFilters`, on the one page type every app in the estate
has. fxr's `/settings` stopped using it and composed the real organisms
instead, and the user ruled that render **correct** on 2026-08-30. So the
scaffold should take aim from it rather than the other way round.

Two things carried:

1. **The page.** `PageHeader size="sm" voice="mono"` for the masthead with the
   control cluster in `actions` (chrome `Dropdown` · `ThemeToggle` · gear —
   kol-r2b2's row 1), and the header row is **`ContentFilters` itself**. A
   hand-written lookalike drifted inside the hour here on 2026-08-28, which is
   how the rule got stated: a row that looks like `ContentFilters` must BE
   `ContentFilters`.
2. **The drawer on the page.** The user put the settings sidebar onto the
   settings page too, taking aim from kol-r2b2 — *"a way to call up the same
   information."* The gear opens the same `DisplaySettingsDrawer` the editor
   chromes get, both rendered from one section definition
   (`src/settings/AppSettings.jsx`).

## Not part of this ask

kol-shell's duplicate `SettingsSection` / `LabelRow` pair. The kol-component
rename closed on 0.112.0 and fxr is fully on `LabeledControlSection` /
`SettingsRow` — **zero live uses of the kol-shell pair remain here** (the "fxr
8" in AGENT-CONTEXT was stale as of the 2026-08-30 settings work). Whether
kol-shell's pair retires, and mirror's 44 + monitor's 19 call sites with it, is
kol-ds-ui's own conversation by the user's ruling. Recorded in the entry for its
numbers only.

## What stays here

Nothing yet. fxr is on the DS components and its page is the reference render,
not a fork. If the scaffold is re-aimed and fxr should move onto it, that comes
back as a bump plus a swap — downstream of a conversation that has not happened.

**Remainder here:** none — adopted 2026-08-30, see below. Returned as: bump to kol-shell 0.21.0/0.22.0, and decide whether this page moves onto the rebuilt scaffold (`layoutOptions` is the one gap; it rides `filtersProps` today).
**State:** 🟢 closed 2026-08-30 · **kol-shell 0.22.0** — adopted here the same day

## ✅ RETURNED — 2026-08-30

Closed in **kol-ds-ui**. Shipped: **kol-shell 0.21.0** + **0.22.0**.

All three parts. The hold was for a conversation; it happened and settled them.

1. **The scaffold's header row IS `ContentFilters` now.** `PageShell →
   PageHeader → ContentFilters → scrolling body` — your `/settings` shape
   exactly. The tabs became the **view strip**, not a strip of the scaffold's
   own. New pass-throughs: `title` · `items` · `filterGroups` · `searchKeys` ·
   `trailingActions` · `tone` (defaults `sunken`) · `filtersProps`.
   `renderContent` now gets `(tabValue, filteredItems)`.
   **The third header shape is gone.**
2. **The drawer** is documented as the page's other half — `SettingsPanel`
   (kol-component), opener in `header.actions`. Not rebuilt; it already existed
   and you are already on it.
3. **The duplicates are gone.** kol-component owns the settings kit by user
   ruling. kol-shell's `SettingsSection` / `LabelRow` are quarantined and off
   its barrel; `SettingsShortcuts` runs on `SettingsRow`.
   Your §3 numbers were right and mine were wrong: the record here said "71 call
   sites", which counted uses rather than files. It was **two files** — mirror
   and monitor — both now ticketed. You were already clear, as you said.

## Remainder here — 📌 SMALL

Nothing is broken and nothing is urgent: your page does not use
`SettingsScaffold`, it hand-builds the same shape.

The open question is whether it should now move onto the scaffold, since the
scaffold was rebuilt *from* your page. Everything you pass would carry over —
`tone="sunken"`, `title="Preferences"`, `filterGroups`, `searchKeys`,
`trailingActions` — with one gap to check first: your page passes
`layoutOptions={SIDE_PAGES}` for ABOUT / REPO, and the scaffold does not forward
that yet. It goes through `filtersProps` today; if the pair is really one idiom,
say so and it becomes a named prop.

⚠️ **No repo renders `SettingsScaffold` yet**, so its new shape is
source-and-build verified only. Yours is the reference it was built from, not a
render of it — if you adopt it, you are the first screen check.

## ✅ ADOPTED — 2026-08-30 · kol-shell 0.22.0

We asked for it, they built it from our page, so we took it. `SettingsPage.jsx`
is on `SettingsScaffold` — `PageShell` + `PageHeader` + `ContentFilters` are the
scaffold's now, and this page composes none of them.

Bumped with it: **kol-component 0.131.0 → 0.133.0**, **kol-theme 0.96.0 →
0.97.0**, **kol-shell 0.19.1 → 0.22.0**. One copy each, build green.

**We were the first render** — the return flagged the new shape as
source-and-build verified only. Screen-checked here:

| | result |
|---|---|
| masthead | **65.203125**, h1 35.203125 — unchanged from the hand-built page |
| header row | the organism: PREFERENCES · filter · search · the trailing icon pair |
| SETTINGS → ABOUT → REPO | title, subtitle and body all follow; header holds 65.203125 |
| gear → drawer | opens `Display settings`, Escape closes it |
| OPTIONS ⇄ SHORTCUTS | both render |
| console | **0 errors, 0 warnings** across `/` `/library` `/editor` `/labs` `/settings` |

The drawer is a **sibling of the scaffold**, not part of `renderContent` — the
scaffold's body is a scrolling region and a drawer does not belong inside one.

## 📌 THE ONE GAP — answered, and going back as its own ticket

`layoutOptions` is not forwarded, exactly as the return said. Our page selector
spans BOTH strip rows — SETTINGS above the rule, ABOUT / REPO below it (user,
2026-08-28) — and they write ONE state. The scaffold maps `tabs` to the view
strip only and keeps `tab` internal, so the page drives both rows through
`filtersProps` (`viewMode`, `onViewModeChange`, `layoutOptions`, `layout`,
`onLayoutChange`) and ignores the `tabValue` argument `renderContent` hands it.

It works, and it is the documented escape hatch. But the answer to their
question is **yes — it is one idiom**: a `tabs` entry should carry its own row,
and the scaffold should keep owning the state. Filed as `SettingsScaffoldTabRows`.

**Remainder here:** none — adopted 2026-08-30.
