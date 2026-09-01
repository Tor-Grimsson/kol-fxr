# SettingsMastheadCluster — the settings masthead row is the scaffold's now

**Staged:** 2026-08-30 · from **kol-ds-ui**
**Nature:** new props on `SettingsScaffold`, shipped in **kol-shell 0.27.0**. Adopt to get the consistent row.

## Why

The user, on three settings pages side by side: *"Im trying to ship a
universally consistent settings page, visually and functionally, but I keep
hitting the same issues over and over again."*

The masthead's control row was a raw `header.actions` slot. kol-fxr and
kol-r2b2 each hand-built the same shape into it; **kol-mirror and kol-monitor
passed nothing at all** — the string `actions` does not appear in either
SettingsPage. So the three pages did not differ by drift or version skew. Two of
them were simply never handed the row.

## What shipped

`SettingsScaffold` owns the arrangement — order, gap and tone — and the gear:

```jsx
<SettingsScaffold
  picker={<Dropdown className="w-40" tone="sunken" options={…} />}   // yours, optional
  themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
  onOpenSettings={() => setDrawerOpen(true)}                        // the gear; DS draws it
/>
```

Renders **picker · theme toggle · gear** on the subtitle's baseline, right
aligned, above the rule. `IconFrame settings-01`, `tone` inherited from the
scaffold, `size="sm"`.

- **`themeToggle` is a node**, not drawn by the scaffold — it lives in
  kol-framework and shell dropped that peer in 0.16.0.
- Pass none of the three and no cluster renders. Nothing moves until you opt in.
- An explicit `header.actions` still wins, so nothing existing breaks.

## Also in this wave — the `sunken` tone was raised

**kol-theme 0.106.0.** `tone="sunken"` had no token of its own and borrowed
`--kol-oq-inverse-96`, which lands at luminance 23.7 on an 18.2 dark page: every
control wearing it rendered as its own PALE box. Measured on fxr's /settings.

Now `--kol-surface-sunken` → `oq-ab-96`, and the `ab` ladders flip toward the
ground, so the well is below the page on both themes. The state ladder is three
rungs — rest / `+fg-04` hover / `+fg-08` selected, ~9.5 apart either theme.

**Bump theme to 0.106.0 or the row still looks wrong**, whatever you pass.

## Remainder here — 📌 YES

1. Bump kol-shell **0.27.0** and kol-theme **0.106.0**.
2. Pass `themeToggle` and `onOpenSettings` at minimum — that alone makes this
   page match the other two.
3. `picker` only if this app has something to pick (fxr opens a chrome, r2b2 a
   bucket). Omit it and the row is toggle + gear.
4. If you have a settings drawer, wire `onOpenSettings` to it. If not, the gear
   is the place it goes when you build one.

⚠️ **Nothing here is screen-verified** — no repo renders the cluster yet. The
first to adopt is the check.

---

## ✅ CLOSED — 2026-08-30 · adopted in full

All four steps taken, in the same pass that found the ⚠ below.

1. **Bumped** kol-shell 0.27.0 · kol-theme 0.106.0 (also kol-component 0.136.0).
2. **`themeToggle` and `onOpenSettings` passed** — the gear opens
   `DisplaySettingsDrawer`, which this page already had.
3. **`picker` passed** — the three chromes (Editor · Labs · Randomiser), which
   is fxr's answer to r2b2's bucket picker.
4. The hand-built `header.actions` div is **deleted**, along with the local
   `IconFrame` import. `header` is down to `{ size: 'sm', voice: 'mono' }`.

**Screen-verified — we are the first to render it, as you flagged.** The cluster
is identical to the hand-built row it replaced: picker · theme toggle · gear on
the subtitle's baseline, right-aligned, masthead still 65.203125. Five routes,
0 console errors, 0 warnings.

## ⚠️ The `sunken` raise is right in dark and cancels in LIGHT

Your half is confirmed: dark reads as a well now, not a pale box.

But `--kol-surface-sunken` = `oq-ab-96` = **245**, and `kol-base-tokens.css:77`
says "under the 250 page" — while `AppShell pageWash` paints ink on that page.
fxr passes the ruled `var(--kol-fg-02)`: `250×0.98 + 18×0.02 = 245.4`.

Measured on `/settings`, light: trigger `245,245,245`, washed page
`245,245,245`, **delta `0,0,0`** — the four sunken controls render with no pill
at all. Dark is unaffected, because there the wash is ink over ink.

Filed back as **`SunkenWellEatenByPageWash`**, since both halves are DS rules —
the five-level well and `pageWash`, which is `AppShell`'s own prop. Any consumer
passing `pageWash` is in the same position.

**Remainder here:** none — adopted 2026-08-30.
