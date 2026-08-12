# ModalConfirmLabels — confirm dialogs need their own words

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/ModalConfirmLabels.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.35.0`: `confirm(title, { okLabel, cancelLabel })` (+ same options third-arg on `prompt`), title → `kol-mono-12`, once-per-session console.warn in the no-provider fallback. Entry graduated to `done/`. 📌 **Remainder here:** bump ≥0.35.0, mount `ModalProvider`, label the restore dialog (`Restore` / `New file`)

## Why it went there

The label surface and the title type class live in the shipped `Modal.jsx`;
no-shims bars a consumer patch, and no prop exists today.

## What stays here

- `ModalProvider` now mounted in `EditorProviders` (that half was ours — the
  native-dialog sighting was the missing provider, not the DS).
- Interim copy on the restore confirm: "Restore your last canvas? Cancel
  starts a new file." — carries the meaning until the labels API ships.
- **On ship: adopt.** Bump, pass the real labels, drop the interim copy.
