# Plan — Audit: bugs and consistency

**Status:** RUN 2026-10-08 (cloud session) — `.kol/llm-context/audit/2026-10-08.md`: 12 findings (3 bugs · 4 hand-built · 2 vocabulary · 3 dead code), none fixed; the user orders them.
**Origin:** user, 2026-10-08: *"should we run an audit? just to try to find bugs and look for consistency opportunities?"*

## What it looks for

1. **Bugs** — every route (`/` `/library` `/settings` `/editor` `/labs` `/morph` `/randomiser`) walked on `vite preview` at 1600 and 390 touch, console clean, every rail row and every tab pressed. The last full one was 2026-07-07 (*four fix waves*); the editor and morph arrived since.
2. **Hand-built where the DS has it** — the user's hardest rule. Grep the rails and sheets for local markup doing a DS component's job: lists, rows, fields with a loose unit, titles. Each is either swapped for the asset here, or — when the DS lacks it — written into **plan 17, the parked DS list** (user, 2026-10-08: *"what should go to DS should just go to the parked plan, I'll fetch it there locally later"*). No tickets from the cloud.
3. **One vocabulary** — the labs rail laws (`AGENT-CONTEXT` § control vocabulary): one segmented control, one row, one label voice, `kol-mono-*` for wrapping text, `kol-helper-*` single-line only, no `size="sm"` literals in rail components.
4. **Dead code** — the retired library build (`vite.lib.config.js`, `index.lib.css`, `src/index.jsx` as "library entry"), `_tmp/` references, `onSaveSettings`-style names the docs call cosmetic.

## Output

One file, `.kol/llm-context/audit/2026-MM-DD.md`: findings as a numbered list, each with the file:line, what is wrong, the fix — grouped fix / ticket / ignore. No fixes land during the audit; the user orders them.

## Not in scope

The editor chrome — its own plan after this (user, 2026-10-08).
