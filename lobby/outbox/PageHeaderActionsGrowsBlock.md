# PageHeaderActionsGrowsBlock — `actions` makes the masthead 10px taller, so no two pages line up

**Filed:** 2026-08-28 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/PageHeaderActionsGrowsBlock.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-28 · **kol-shell 0.19.1** — adopted here the same day
**Measured live in two consumers**, same kol-shell 0.19.0, same props otherwise.

## The defect

`PageHeader` puts the `actions` cluster in a flex row **with the subtitle**:

```jsx
<div className="flex items-baseline justify-between gap-6" style={{ marginTop: 12 }}>
  {lede}
  {cluster}
</div>
```

A flex row takes the height of its tallest child. The lede is one line of
`kol-mono-14` — **18px**. A cluster of `sm` controls (`IconFrame` /
`ThemeToggle` / `Dropdown`, all pinned 28 since kol-theme 0.90.0) is **28px**.

So the masthead is **10px taller on any page that has actions**:

| consumer | actions | header block |
|---|---|---|
| **kol-monitor** `/` | none | **65.2** = 35.2 h1 + 12 + 18 |
| **kol-fxr** `/settings` | 3 sm controls | **75.2** = 35.2 h1 + 12 + 28 |

Both on `kol-mono-heading-03` (32px / 35.2 line box) — the titles are identical.
Screenshots of both DevTools overlays are with this ticket's filer.

**Why it matters:** the masthead is the one block every page in an app shares.
A consumer cannot put a control cluster on one page without that page's title
block, rule, and everything below it sitting 10px lower than every other page —
and there is no prop to opt out. It is invisible until two pages are compared
side by side, which is exactly how it was found.

## The ask

The cluster should sit on the subtitle's line **without growing the row** —
centred against that 18px line box, overflowing it symmetrically (±5px) rather
than pushing the block down. The header's height should be a function of its
TEXT only, so `actions` is free.

`items-baseline` was chosen deliberately (`PageHeaderTrailingSlot`, kol-website
2026-08-28) so the cluster lands on the subtitle's baseline rather than the
h1's — that intent is right and should survive; it is the row's *height* that
must stop depending on the cluster.

**And a variant per title scale** (user, 2026-08-28). The numbers above are the
`sm` masthead with `sm` controls. `size="lg"` is `kol-mono-display-02`
(44 / 56 / 64) and `md` is `display-03` (36 / 42 / 48) — their line boxes are
far taller than 18, so the cluster's offset cannot be one constant. Cover the
ramp, not just the rung fxr happens to be on.

## What stays here

Nothing — fxr is on the DS component and passes `actions` as documented. On the
return: bump and re-measure `/settings` against kol-monitor's `/`; they should
both read 65.2.

**Remainder here:** none — adopted 2026-08-28, see below. Returned as: bump to kol-shell 0.19.1 and re-measure `/settings` against monitor's `/` — both should read 65.2.
**State:** 🟢 closed 2026-08-28 · **kol-shell 0.19.1**

## ↩ RETURNED — 2026-08-28

Closed as **kol-shell 0.19.1** — the cluster is `h-0 self-center`, a zero-height box centred on the row, so its children overflow symmetrically and the header's height is its text's. No constant (your `sm` 10 / `md` 14 point ruled that out) and horizontal layout is untouched, so `justify-between` holds and a long lede cannot run under the controls. The baseline intent survives for the lede.

Remainder here: bump to 0.19.1 and re-measure `/settings` against monitor's `/` — both should read 65.2.

## ✅ ADOPTED — 2026-08-28 · kol-shell 0.19.1

Bumped. The `actions` cluster is `h-0 self-center` in the DS component, so the
masthead's height is its text's — no consumer change was needed here beyond the
bump, and no per-size variant: a zero-height box measures nothing at every rung.

**Measured on `/settings`:** header block **65.203125**, h1 35.203125 on
`kol-mono-heading-03` — identical to kol-monitor's `/`, which is the number the
ticket asked for. Was 75.2 with the cluster in the row.

**Re-verified 2026-08-30 on kol-shell 0.19.1 / kol-component 0.131.0 /
kol-theme 0.96.0** — 65.203125 unchanged, zero console errors on six routes.

**Remainder here:** none — adopted 2026-08-28.
