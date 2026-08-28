# TextareaResizeClamp — the Textarea grip overflows fixed-width containers

**Filed:** 2026-08-12 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/done/TextareaResizeClamp.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-08-12 — shipped in `@kolkrabbi/kol-component@0.35.0`: the grip's width write clamps to the parent's content width (120 floor wins), new `axis` prop (`'both'`|`'y'`). Entry graduated to `done/` with the resolution. 📌 **Remainder here:** bump ≥0.35.0, consider `axis="y"` on rail textareas, drop the `max-w-full` stopgaps if redundant

## Why it went there

The grip drag lives in the shipped `Textarea.jsx` (`shell.style.width` on
pointermove); consumers are barred from patching DS chrome (the 2026-08-09
no-shims ruling), and no prop constrains the axis today.

## What stays here

- `className="max-w-full"` on the rail textareas (AutoControls Content,
  KineticPanel Text, TextSurface Content) — legit public-API use that caps
  the overflow until the atom clamps at the source.
- **On ship: adopt.** Bump, drop the stopgaps if redundant, verify an X-drag
  in the right rail can no longer scroll the sidebar.

## ✅ ADOPTED — 2026-08-15

kol-component ^0.46.0, past the 0.35.0 this asked for — verified 2026-08-15.

**Remainder here:** none.
