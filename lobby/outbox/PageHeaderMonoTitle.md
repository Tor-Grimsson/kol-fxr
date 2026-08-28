# PageHeaderMonoTitle — the masthead needs a mono voice

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/PageHeaderMonoTitle.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 CLOSED + ADOPTED 2026-08-27 — kol-shell 0.7.0 (`voice="mono"`, `titleClass`) · 0.7.1 (`SettingsScaffold header`) · 0.7.2 (`SettingsSection` h2 fg-96/helper-14) + kol-theme 0.67.0 mono heading rungs; adopted here the same day. Remainder: none.

## Why it went there

`kol-shell` `PageHeader` 0.6.2 renders the title on a Right Grotesk role at
every `size`; there is no seam for the title's face. The user rules the app
masthead is JetBrains Mono 32/500 — monitor's deployed look — which monitor
gets only by accident (its local legacy sheet still styles the retired
`.kol-heading-sm`). A consumer/DS gap goes to the lobby, not a local fork.

## What stays here

- `src/pages/HomePage.jsx:51` · `src/pages/LibraryPage.jsx:84` —
  `<PageHeader size="sm" className="[&>h1]:font-mono" …/>`, the interim. It
  holds because `kol-typography.css` is `layer(components)` and Tailwind
  utilities cascade after it.
- **On ship: adopt.** Swap the className for the voice/seam the DS lands,
  delete the arbitrary variant.

## ✅ RETURNED — 2026-08-27 · kol-shell@0.7.0 · kol-theme@0.67.0

`PageHeader voice="mono"` — the title rides three new mono heading rungs (`kol-mono-heading-03` 32 / 110%, `kol-mono-display-03`, `kol-mono-display-02` on the display tokens at 100%; JetBrains Mono, weight 500) per `size`; `voice="sans"` is the default and unchanged; `titleClass` replaces the title role whole; the subtitle stays `kol-mono-14`. Measured: sm mono → JetBrains Mono 32px / 500, md → 48px / 500.

**Remainder here:** none — adopted 2026-08-27, see below. Returned as: bump kol-shell 0.7.0 + kol-theme 0.67.0; `<PageHeader size="sm" voice="mono" …/>` and drop the `[&>h1]:font-mono` interim. kol-monitor can retire its legacy `.kol-heading-*` rules once it adopts `voice="mono"`.

**Addendum:** `SettingsScaffold` (kol-shell) renders its own `PageHeader` with
no pass-through — `src/pages/SettingsPage.jsx` carries a `contents` wrapper
override as the interim. Same ticket; the seam must be forwarded there too.

## ➕ ADDENDUM ANSWERED — 2026-08-27 · kol-shell@0.7.1

`SettingsScaffold header` — PageHeader props spread onto the scaffold's header: `<SettingsScaffold header={{ size: 'sm', voice: 'mono' }} …/>`. **Remainder here:** bump kol-shell 0.7.1; drop the `[&_h1]:font-mono` contents wrapper on Settings.

## ➕ ADDENDUM 2 ANSWERED — 2026-08-27 · kol-shell@0.7.2

`SettingsSection` titles are `text-fg-96 kol-helper-14`. **Remainder here:** bump kol-shell 0.7.2; drop the section-title wrapper override.

## ✅ ADOPTED — 2026-08-27

`<PageHeader size="sm" voice="mono"/>` on Home and Library;
`<SettingsScaffold header={{ size: 'sm', voice: 'mono' }}/>` on Settings; the
`[&>h1]:font-mono` classes and the `contents` wrapper deleted. Section h2s are
the DS's `text-fg-96 kol-helper-14` since 0.7.2. Verified on kol-shell 0.7.2 ·
kol-theme 0.67.0.

**Remainder here:** none.
