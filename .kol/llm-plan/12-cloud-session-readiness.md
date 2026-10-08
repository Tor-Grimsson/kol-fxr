# Plan — Ready for a cloud session

**Status:** PARKED 2026-10-08, not started. Measured with git-read (agent-grant), nothing changed.
**Origin:** user, 2026-10-08 — *"I'm gonna try a cloud session, but I wanna make sure we have whats needed there to work, check whats in gitignore and assess whats needed."*

## What a cloud session gets

Only the remote. It is at `fxr-1005`, and local has no commits past it, so **none of plans 08–11 or the 2026-10-08 work is there**: 26 modified, 4 deleted, 18 untracked. The KOL packages install there without npm auth (checked with an empty npm config).

## What it would not have

1. **The uncommitted work** — `UrlIntents.jsx`, `NewFileDialog.jsx`, `src/editor/morph/` (Shape engine, rail, picker, store), `scripts/dev.mjs`, the manifest + touch icons, plans 09–11, both lobby receipts.
2. **`docs/`** — gitignored (`/docs/`), 0 tracked files, 22 MB; the agent context points into it.
3. **`_tmp/`** — gitignored; holds the walk scripts (`_tmp/2026-10-08-plan10/*.mjs`). The files-dialog port is live in `src/` since 2026-10-08.
4. **Playwright** — the walk scripts import it from `~/dev/projects/kol-ds-ui/node_modules` by absolute path.
5. **The boot** — `LLM_RULES.md` is an ignored symlink into `~/.dotfiles`; the global CLAUDE.md and the skills (`/ag-init`, `/kol-goal`, lobby) live in `~/.claude`. Absent unless the cloud environment mirrors them.
6. **The kol-ds-ui lobby** — another repo; the receipt here is visible, the return is not.
7. **`api/.dev.vars`** — the Worker's local password; only for sync walks, stays out of the repo.

Oddity: `api/.wrangler/` is not ignored — 19 local D1 state files are tracked.

## Steps

1. Move the walk scripts into a tracked path; point the scripts at this repo's own Playwright.
2. User rules on `docs/`: stays ignored, or tracked.
3. User rules on `api/.wrangler/`: ignore it (and untrack the 19 files), or keep.
4. User commits and pushes.
5. In the cloud session: `pnpm install`, `pnpm build`, one walk — say whether the boot rules loaded.
