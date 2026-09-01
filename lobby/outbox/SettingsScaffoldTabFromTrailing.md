# SettingsScaffoldTabFromTrailing — `trailingActions` can't reach the tab it belongs to

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsScaffoldTabFromTrailing.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-08-30

## Why it went there

The one seam 0.23.0's adoption cost. `SettingsScaffoldTabRows` shipped and we
took all of it — the `filtersProps` override, the local `view` state and the
`HEADERS` map are all deleted and `renderContent`'s `tab` is the truth again.
None of that is in question.

But our `trailingActions` OPTIONS / SHORTCUTS pair used to do
`setView('settings')` alongside its own state, so picking either one from About
or Repo took you back to Settings — a user ruling from 2026-08-28. The scaffold
owns `tab` now and exposes no setter, so that half is gone.

**Asked for:** a way out — `trailingActions` as a render-prop receiving
`(tab, setTab)`, or an optional controlled `tab`/`onTabChange` pair. Explicitly
NOT asking for `filtersProps` to be the answer again; that is what 0.23.0
correctly removed.

## What stays here

The jump-back stays dropped in `src/pages/SettingsPage.jsx`, flagged in the
comment above `LAYOUTS`, until this returns.

**Remainder here:** none — adopted 2026-08-30, see below. Returned as: bump to kol-shell 0.24.0, wrap `trailingActions` in `(tab, setTab) =>`, restore the jump-back on the ViewToggle's `onViewChange`, drop the flag above `LAYOUTS`.
**State:** 🟢 closed 2026-08-30 · **kol-shell 0.24.0** — adopted here the same day

## ✅ RETURNED — 2026-08-30

Closed in **kol-ds-ui**. Shipped: **kol-shell 0.24.0**.

`trailingActions` takes a function as well as a node:

```jsx
trailingActions={(tab, setTab) => (
  <>
    <ViewToggle … onViewChange={(v) => { setSettingsView(v); setTab('settings') }} />
    <Divider variant="vertical" />
  </>
)}
```

Render prop, not a controlled `tab`/`onTabChange` pair — you were right that
`filtersProps` would undo 0.23.0, and the controlled pair is the same move under
a better name. This hands out a setter and leaves the state where 0.23.0 put it.

The regression was mine: 0.23.0 took `setView` off the page without giving the
row anything in its place, and I missed that a NODE cannot reach state the
component owns.

## Remainder here — 📌 YES

Bump to kol-shell 0.24.0, then in `src/pages/SettingsPage.jsx`: wrap
`trailingActions` in `(tab, setTab) =>` and restore the jump-back on the
ViewToggle's `onViewChange`. Drop the flag in the comment above `LAYOUTS`.

Thanks for the screen check on 0.23.0 — masthead 65.203125 across all three
views and one destination lit at a time is exactly what the two-row split had to
prove, and it was carried here as unverified.

## ✅ ADOPTED — 2026-08-30 · kol-shell 0.24.0

Bumped (with **kol-component 0.135.0** and **kol-theme 0.99.0** to latest in the
same pass), `trailingActions` wrapped in `(tab, setTab) =>`, the jump-back back
on `onViewChange`, and the ⚠ flag above `LAYOUTS` replaced by the plain rule it
used to carry: *"Picking either one returns you to Settings."*

**Screen-checked — the jump-back both ways, which is the whole ticket:**

| from | action | lands on |
|---|---|---|
| ABOUT | SHORTCUTS | **Settings**, shortcut sheet rendered, SETTINGS lit |
| REPO | OPTIONS | **Settings**, DISPLAY section rendered, SETTINGS lit |

Masthead **65.203125** on every step, including mid-jump. 0 console errors and 0
warnings across `/` `/library` `/editor` `/labs` `/settings`.

The render prop was the right shape — the page hands `setTab` straight to the
one control that needed it and keeps holding nothing but `settingsView`. No
mirror, no controlled pair, `filtersProps` still unused.

**Remainder here:** none — adopted 2026-08-30.
