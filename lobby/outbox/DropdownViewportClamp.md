# DropdownViewportClamp — long dropdown panels clamp to the viewport

**Filed:** 2026-08-09 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/DropdownViewportClamp.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-09 — shipped in `@kolkrabbi/kol-component@0.32.3` + `@kolkrabbi/kol-theme@0.32.4`: the panel caps itself to the space below the trigger (floating-ui `availableHeight`, padding 8), `.kol-dd-list` scrolls inside, and the panel opens scrolled to the checked row. No height prop — the clamp is automatic; consumers pass nothing. Flip-above not taken (fused-edge law). 📌 **Remainder here:** update `@kolkrabbi/kol-component` to ≥0.32.3 + `@kolkrabbi/kol-theme` to ≥0.32.4, then verify the labs "Add FX…" picker (~30 filters) scrolls inside the viewport

## Why it went there

`.kol-dd-*` chrome is the DS's; consumer repos are barred from patching it
(the 2026-08-09 no-shims ruling), so the fix could only ship at the source.
The defect: Dropdown opens with `flip: false` (fused trigger/panel edge) and
the Popover `size` middleware set width only — panel height was content
height regardless of the space below, so the labs "Add FX…" picker rendered
past the viewport bottom.

## What stays here

- **On ship: adopt.** Bump both packages and verify the labs picker — the
  panel should cap at the viewport with the list scrolling inside, opening
  scrolled to the selected row.
- Nothing else — no shim existed to retire (the no-shims ruling held).
