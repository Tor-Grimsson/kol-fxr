# DropdownHeightAndHover — the sm trigger is 4px short, and hover contradicts its own ruling

**Filed:** 2026-08-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/DropdownHeightAndHover.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-28 · **kol-theme 0.90.0** — adopted here the same day
**Found building** fxr's settings header on kol-r2b2's row-1 shape: a `Dropdown`
beside `IconFrame`s and a `ThemeToggle`, all `sm`, all `tone="sunken"`.

## 1 — A `sm` Dropdown does not line up with a `sm` icon control

`.kol-dd-trigger` takes its box from `kol-btn-{size}` padding:

```
.kol-btn-sm { padding: 4px 12px; }          /* kol-components-atoms.css:369 */
```

on `kol-mono-12` → **~24px tall**. But every icon control on the same row is
PINNED:

```
.kol-btn-icon.kol-btn-sm { width: 28px; height: 28px; }   /* :236 */
```

So `Dropdown size="sm"` renders ~4px shorter than the `IconFrame size="sm"` and
`ThemeToggle size="sm"` sitting next to it. That row — picker then icon cluster
— is exactly what `MediaLibraryPages.jsx:281-287` builds, and what the
kol-r2b2 header the estate is copying looks like.

**The ask:** pin the trigger's height to the same rung as the icon ladder
(sm 28 / md 32 / lg 36), or say in the docs that a Dropdown must not be sized
`sm` beside icon controls. The first is the answer — one control row should not
need a consumer to know which of its members is pinned.

## 2 — Hover: the component contradicts its own documented ruling, and the two tones disagree

`kol-components-molecules.css:33` states the rule:

> *"No hover, no clicked state (2026-07-15 ruling) — rest and open."*

Twelve lines later it defines exactly that:

```
.kol-dd-trigger.kol-btn-primary:not(:disabled):hover,
.kol-dd-trigger.kol-btn-primary:not(:disabled):active { … }   /* :45-46 */
.kol-dd-trigger.kol-btn-outline:not(:disabled):hover,
.kol-dd-trigger.kol-btn-outline:not(:disabled):active { … }   /* :50-51 */
```

while the sunken tone flattens it straight back out — rest, hover and active
all one colour:

```
.kol-dd-trigger.kol-tone-sunken,
.kol-dd-trigger.kol-tone-sunken:not(:disabled):hover,
.kol-dd-trigger.kol-tone-sunken:not(:disabled):active
  { background-color: var(--kol-fg-inverse-96); }             /* :1271-1273 */
```

**So an untoned Dropdown lights on hover and a sunken one does not** — two
dropdowns side by side in one header behave differently, which is how this was
found (user, 2026-08-28: *"it 1 has a ahover state"*). Reproduced in fxr's
settings header with the two triggers rendered adjacent.

**The ask:** pick one and make both tones obey it. The 2026-07-15 ruling says
no hover; if that still stands, delete lines 45-51. If hover is wanted, give
`kol-tone-sunken` one too. Either is fine — what cannot stand is the file
stating a rule and then breaking it for one tone only.

## What stays here

Nothing structural — fxr is on the DS component either way. On the return:
bump, drop the side-by-side comparison Dropdown in `src/pages/SettingsPage.jsx`,
and re-measure the header row against the icon cluster.

**Remainder here:** none — adopted 2026-08-28, see below. Returned as: bump to kol-theme 0.90.0, drop the comparison Dropdown in `SettingsPage.jsx`, re-measure the header row.
**State:** 🟢 closed 2026-08-28 · **kol-theme 0.90.0**

## ↩ RETURNED — 2026-08-28

Closed as **kol-theme 0.90.0**. The trigger is pinned to the icon ladder — 28 / 32 / 36, `padding-block: 0`, horizontal padding untouched.

On part 2, your symptom was right and your mechanism was not: lines 45–51 are **pin-backs**, not hover states — they restate the variant's REST colours to cancel the hover `.kol-btn-*` would give a trigger. `primary`'s still holds. `outline`'s stopped: `.kol-btn-outline`'s rest border moved to `oq-08` on 2026-08-26 and that line kept `oq-16`, so the pin-back had quietly become a 1px hover. Now `oq-08`. Nothing was deleted and the 2026-07-15 ruling stands.

The lesson worth carrying: a pin-back mirrors a value it does not own, so it must be re-read whenever that value moves.

Remainder here: bump to 0.90.0, drop the comparison Dropdown in `SettingsPage.jsx`, re-measure the header row.

## ✅ ADOPTED — 2026-08-28 · kol-theme 0.90.0

Bumped, the side-by-side comparison `Dropdown` deleted from
`src/pages/SettingsPage.jsx` — one `Dropdown` on the page now (`:206`), riding
`PageHeader actions` beside the `IconFrame` cluster and the `ThemeToggle`, all
`sm`, all `tone="sunken"`.

Part 2 is closed as **my diagnosis being wrong**, not as a fix: `:45-51` are
pin-backs restating rest colours, not hover states. The real skew was
`outline`'s pin-back still on `oq-16` after the rest border moved to `oq-08`.
The 2026-07-15 no-hover ruling stands untouched.

**Re-verified 2026-08-30 on kol-theme 0.96.0** — header row measures 65.203125,
identical to kol-monitor's `/`; six routes loaded in a browser, zero console
errors.

**Remainder here:** none — adopted 2026-08-28.
