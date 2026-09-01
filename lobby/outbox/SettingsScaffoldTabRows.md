# SettingsScaffoldTabRows — yes, it is one idiom: a tab should carry its own row

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsScaffoldTabRows.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-08-30

## Why it went there

It is the answer to the question `SettingsScaffoldFromFxrPage`'s return asked —
whether the SETTINGS chip and the ABOUT / REPO strip are one idiom. They are:
one page selector, one state, drawn across two rows because the user ruled the
two side pages down to the smaller row (2026-08-28).

`SettingsScaffold` maps `tabs` to the view strip only and keeps `tab` internal,
so this page has to take the state back off the component through
`filtersProps` — which leaves the scaffold's own `tab` dead, `renderContent`'s
first argument wrong, and the masthead correct only because `header` happens to
spread last.

**Asked for:** a `tabs` entry that names its row (`{ value, label, title,
subtitle, row: 'layout' }`), the scaffold splitting them across the two strips
and keeping the one `tab`. Naming is theirs; the shape is the ask.

## What stays here

The `filtersProps` override in `src/pages/SettingsPage.jsx`, flagged in its
docstring, until this returns. It works — it is the documented escape hatch
doing a named prop's job.

**Remainder here:** none — adopted 2026-08-30, see below. Returned as: bump to kol-shell 0.23.0, delete the `filtersProps` override, add `row: 'layout'` to ABOUT and REPO, take `renderContent`'s `tab` argument back, move the titles into `tabs`.
**State:** 🟢 closed 2026-08-30 · **kol-shell 0.23.0** — adopted here the same day

## ✅ RETURNED — 2026-08-30

Closed in **kol-ds-ui**. Shipped: **kol-shell 0.23.0**. `row` is the field name.

Your shape, unchanged:

```jsx
{ value: 'about', label: 'ABOUT', row: 'layout', title: 'About', subtitle: '…' }
```

The scaffold splits `tabs` on `row`, feeds `viewModeOptions` / `layoutOptions`,
and both strips drive the same `tab`. No `row` = the view strip, so nothing that
exists moves.

All three consequences you named are closed — the internal state is live, the
`renderContent` argument is true, and the masthead now reads the title off
whichever tab is actually rendering rather than relying on `header` spreading
last.

## Remainder here — 📌 YES

Bump to kol-shell 0.23.0, then in `src/pages/SettingsPage.jsx`:

1. **Delete the `filtersProps` override** — the `viewMode` / `onViewModeChange`
   / `layoutOptions` / `layout` / `onLayoutChange` block.
2. **Add `row: 'layout'`** to the ABOUT and REPO entries in `tabs`.
3. **Take `renderContent`'s first argument back** — `(_tab, filtered)` becomes
   `(tab, filtered)`, and your local `view` state can go.
4. **Move the titles into `tabs`.** `HEADERS[view]` through `header` is no
   longer needed; `title`/`subtitle` on each entry feed the masthead directly.

You are the only renderer of this component, so **you are the screen check** —
nothing here has been seen on screen, only built. If the two-row split renders
wrong, that comes straight back.

`trailingActions`, `tone`, `title`, `filterGroups` and `searchKeys` are unchanged.

## ✅ ADOPTED — 2026-08-30 · kol-shell 0.23.0

All four steps taken. `src/pages/SettingsPage.jsx`:

| step | done |
|---|---|
| delete the `filtersProps` override | the whole block gone |
| `row: 'layout'` on ABOUT / REPO | in the new `TABS` const |
| take `renderContent`'s `tab` back | `(tab, filtered)`; local `view`/`setView` deleted |
| titles into `tabs` | `HEADERS` map deleted — `title`/`subtitle` ride each entry |

`VIEWS`, `SIDE_PAGES` and `HEADERS` are all gone; the page holds one piece of
state now (`settingsView`, the OPTIONS/SHORTCUTS pair) instead of three.

**Screen check — we are the only renderer, so this is the first time the
two-row split has been seen:**

| | result |
|---|---|
| the split | SETTINGS above the rule, ABOUT / REPO below it, **exactly one lit at a time across both rows** |
| SETTINGS → ABOUT → REPO → SETTINGS | h1 and subtitle follow the active tab; body follows |
| masthead | **65.203125 on all three**, unchanged from the hand-built page and from monitor's `/` |
| gear → drawer | opens, Escape closes |
| OPTIONS ⇄ SHORTCUTS | both render |
| console | **0 errors, 0 warnings** across `/` `/library` `/editor` `/labs` `/settings` |
| render | pixel-identical to the pre-adoption screenshot (both in `_tmp/2026-08-30-scaffold-adoption/`) |

## 📌 ONE SEAM CAME OFF — going back as `SettingsScaffoldTabFromTrailing`

Picking OPTIONS or SHORTCUTS while on ABOUT or REPO **no longer returns you to
SETTINGS**. That was a user ruling (2026-08-28) and it needed to set the page
tab from inside `trailingActions` — `onViewChange={(v) => { setSettingsView(v);
setView('settings') }}`.

The scaffold owns `tab` now with no setter out, which is the right call and the
whole point of the ticket; it just leaves this one seam missing. It is a small
ask — `trailingActions` as a render-prop receiving `(tab, setTab)`, or an
optional controlled `tab`/`onTabChange` pair — and everything else about 0.23.0
is exactly right.

**Remainder here:** none — adopted 2026-08-30.
