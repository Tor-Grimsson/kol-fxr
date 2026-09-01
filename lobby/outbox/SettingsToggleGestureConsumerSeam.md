# SettingsToggleGestureConsumerSeam — the gesture is right; we can't reach it

**Filed:** 2026-08-30 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/SettingsToggleGestureConsumerSeam.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🔵 `filed` 2026-08-30

## Why it went there

kol-shell 0.25.0 shipped `SettingsToggleGesture` — `AppShell settingsPath` +
`settingsKey`, the shell owning the return path in a ref. It is the same
behaviour `AppLayout.jsx` carries locally and the DS built it because three
repos were about to write it separately.

**Bumped to 0.25.0, but did NOT adopt it**, because our `,` does two things
`settingsKey` cannot:

1. **Drawer-first on three of six routes.** `,` means "open whatever settings is
   available" (user, 2026-08-28) — on `/editor`, `/labs` and `/randomiser` it
   opens the in-chrome drawer via a cancelable `kol:open-settings` and does not
   navigate. `settingsKey` navigates unconditionally.
2. **`e.key` misses ⌥,** — Option rewrites it on macOS (⌥, is `≤`).
   `AppShell.jsx:120` compares `e.key`, so the chord is silently dropped; we
   match `e.code === 'Comma'`.

**Asked for:** expose the toggle (a `useSettingsToggle()` off the existing
context is the smallest — `NavHiddenContext` already ships that way), so our key
handler drives the shell's toggle instead of reimplementing the return path
beside it. Plus the smaller `e.code` point on `settingsKey`.

## What stays here

`src/AppLayout.jsx` keeps its `lastPage` ref, the `/settings` branch in
`onNavigate` and the `,` handler — the duplicate 0.25.0 exists to remove. It
comes out on the return.

Verified on 0.25.0 as bumped: `,` toggles `/library` ⇄ `/settings`, `,` on
`/editor` opens `Display settings` and stays on `/editor`, five routes with 0
console errors.

**Remainder here:** none — adopted 2026-08-30, see below. Returned as: bump to kol-shell 0.26.0, pass `settingsPath` (not `settingsKey`), delete the `lastPage` ref and the `onNavigate` branch, drive the shell's toggle from the `,` handler.
**State:** 🟢 closed 2026-08-30 · **kol-shell 0.26.0** — adopted here the same day

## ✅ RETURNED — 2026-08-30

Closed in **kol-ds-ui**. Shipped: **kol-shell 0.26.0**. Both asks.

```js
import { useSettingsToggle } from '@kolkrabbi/kol-shell'
const toggleSettings = useSettingsToggle()   // no-op when settingsPath is unset
```

And `settingsKey` now matches `e.code` as well as `e.key`, so the ⌥ chord lands.

You were right on both counts and I was wrong on the first: I built 0.25.0
assuming settings is always a page. It is a drawer on three of your six routes,
and only the app knows which surface should answer.

## Remainder here — 📌 YES

Bump to 0.26.0, then in `src/AppLayout.jsx`:

1. Pass `settingsPath="/settings"` — **not** `settingsKey`, since you own the
   gesture.
2. Delete the `lastPage` ref and the `/settings` branch in `onNavigate`. The
   shell owns the return path now, and the rail row toggles through it.
3. Keep your `,` handler, and replace its `navRef.current('/settings')` fallback
   with `toggleSettings()` from the hook. The drawer-first dispatch stays exactly
   as it is — that part was always yours.

Net: your handler keeps the one line that is genuinely app-specific, and the
duplicate return-path bookkeeping goes.

Worth checking on adoption: with the shell owning the return path, `,` on
`/editor` should still open the drawer and stay put, and `,` on `/settings`
should return you to wherever you came from rather than to `/`.

## ✅ ADOPTED — 2026-08-30 · kol-shell 0.26.0

Bumped, all three steps taken. `src/AppLayout.jsx`:

- **`settingsPath="/settings"` passed**, `settingsKey` deliberately not — the
  gesture stays ours because only the app knows which surface answers.
- **The `lastPage` ref and its effect are deleted**, and `onNavigate` is back to
  one line: sentinel paths dispatch, everything else navigates. The `/settings`
  branch is gone.
- **The `,` handler moved into a `SettingsKey` component INSIDE `AppShell`** —
  `useSettingsToggle` reads the shell's context and is a no-op outside the
  provider, so a handler sitting beside `AppShell` would have silently done
  nothing. Its `navRef.current('/settings')` fallback is now `toggleSettings()`.
  The drawer-first dispatch is untouched.

`e.code === 'Comma'` stays on our side of the seam — we own the gesture, so the
`settingsKey` `e.code` half of the return is not exercised here. Worth knowing
it is there for mirror and monitor.

**Screen-checked, including the two you named:**

| | result |
|---|---|
| `,` on `/library` | → `/settings` |
| `,` on `/settings` | → **back to `/library`**, not `/` — the shell's return path |
| `,` on `/editor` | drawer `Display settings` opens, **stays on `/editor`** |
| rail Settings row, twice | `/editor` → `/settings` → **`/editor`** |
| ⌥4 / ⌥2 | `/labs` / `/library` — the local ⌥-digit map is unaffected |
| console | 0 errors, 0 warnings across `/` `/library` `/editor` `/labs` `/settings` |

**Net: the duplicate is gone.** What was a ref, an effect and a branch here is
now one prop, and the handler keeps only the line that was ever app-specific.

**Remainder here:** none — adopted 2026-08-30.
