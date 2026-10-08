# Handoff — 2026-10-08 21:30

**For a cloud agent.** You start from the remote only. Read § "What you do not have" before anything else.

## Goal of the current arc
Morph as its own place in the app (plans 10 + 13), the files dialog on the DS browse surface, and the app ready to work in a cloud session (plan 12). All of it is built and walked locally; the cloud session is the first time it runs anywhere else.

## Last actions taken (causal trail, newest first)
- `.gitignore`: `/docs/` dropped (the vault is tracked now; `docs/.obsidian/` stays ignored), `api/.wrangler/` added (wrangler's local D1 copy + cache). The user untracks the 19 old files with `git rm -r --cached api/.wrangler` and pushes.
- Three labs patches (Star morph · Scanline drift · Stripes) made through the app's own save and put into **production D1** (`https://fxr-api.kolkrabbi.io`) — the first rows there. Home lists them once signed in.
- **Plan 13 done:** the Morph step picker is `ShellSearchOverlay` (the DS search modal) — My files first (randomiser rolls included), then every preset grouped by generator; ↑ ↓ Enter adds, Escape closes. `src/editor/morph/StepPicker.jsx`.
- Morph is a **rail destination at `/morph`** (`NAV_ITEMS` in `src/AppLayout.jsx`, route in `src/App.jsx`, `'/morph': 'labs'` in `src/editor/mode.js`); the labs chrome serves it, `LabsView` sets `morph.active` from the path. Phones get a Morph door on the randomiser's chooser card (it covers the rail there). Arriving on `/morph` unfolds the right rail two frames late (the rail pairing re-folds an immediate unfold).
- Randomiser **Save…** (Output tab) and **⌘S** = Save patch in labs · morph · randomiser (`FilesDialogHost.jsx`, listed in `state/keymap.js`). Rail digits: ⌥5 Morph · ⌥6 Randomiser · ⌥7 Settings.
- **FilesDialog on the DS browse surface** (`MediaLibrary variant="browse"`, kol-component **0.244.0**) after two DS tickets (`browse-surface-honours-display-name`, `browse-views-label-by-display-name`), both 🟢.
- **Shape morph** (`src/editor/morph/shape.js` + `shape.check.mjs`): records each step's outline through a canvas Proxy, pairs in draw order, resamples, lerps point to point; Blend mode is plan 05's param tween.
- Home-screen app (plan 11): manifest, touch icons, the Apple metas.

## Current state / open decision points
- **Nothing was committed before this handoff.** If the remote is at `fxr-1005`, the user has not pushed yet — stop and say so; there is nothing here to work on.
- Production D1: 3 rows. The live site's sign-in password is the Worker secret `ADMIN_PASSWORD`; **the user is changing it** (`pnpm exec wrangler secret put ADMIN_PASSWORD --config api/wrangler.toml`). Do not change or ask for it.
- Lobby: one inbox ticket, `media-client-0-4-1-api-on-media` 🟠 — closes when the **live** bundle at `fxr.kolkrabbi.io` is measured naming `media.kolkrabbi.io` and not `admin.` (a `curl` of the deployed JS will do it). Vercel deploys on push, automatically — do not tell the user to deploy.
- The DS's `packages/design-editor` still publishes for its own apps; its fate is the user's ruling.

## Next intended action
1. Confirm the push landed: the tree has `src/editor/morph/StepPicker.jsx`, `src/editor/morph/shape.js`, `.kol/llm-plan/13-the-picker-works.md`, and `docs/` has files.
2. `pnpm install` then `pnpm build` — must be green. KOL packages are public on npm; no auth needed.
3. Measure the live bundle for the media ticket (above). Close it 🟢 only on that measurement.
4. Then wait for the user's task.

## What you do not have (plan 12)
- **The user's global rules and skills** (`~/.claude`: CLAUDE.md, `/ag-init`, `/kol-goal`, the lobby skills) and `LLM_RULES.md` (an ignored symlink into `~/.dotfiles`). Say in one line whether they loaded. The rules that matter most, if they did not: short replies, no option menus, never run git unless asked, never delete (move to a gitignored `_tmp/`), use DS components before building anything, `kol-mono-*` for text that wraps and `kol-helper-*` only for single-line chrome.
- **`_tmp/`** (ignored): the walk scripts, the parked old pickers, the DB password card. The walk scripts import Playwright from a sibling `kol-ds-ui` checkout that is not there.
- **`api/.dev.vars`** (ignored): the local Worker password. Local sync walks need it; nothing else does.
- **The kol-ds-ui lobby** — another repo. This repo's receipts in `lobby/outbox/` are visible; their returns are not.

## Working memory not yet in AGENT-CONTEXT
- **The user's hardest rule this session: use the DS asset that exists; never hand-build a lookalike.** Both step-picker failures (a hand-built list, then a whole file browser) came from skipping this. When a DS surface almost fits, consume it and file the seam to kol-ds-ui — and walk the *whole* feature against it before filing, so it is ONE ticket, not a round trip per symptom.
- **Walk the built bundle** (`vite preview` of `pnpm build`), never only dev — this repo has shipped tree-shaken code that dev never showed.
- `ShellSearchOverlay` closes itself after a pick (`onSelect` then `onClose`); keep the clear in `onClose` only. Row ids are prefixed (`stage` · `file:` · `preset:`).
- The bare `.kol-overlay-scrim` that blocks clicks above a dialog is the DS `Modal` (a `useModal` confirm) — usually *Restore your last canvas?*. `?new=1` stands it down.
- The labs rails are paired: the right follows the shell rail. Opening the right rail at mount is undone by the first sync; defer it.
- `AGENT-CONTEXT.md` and the session log are not updated for this arc — `/log-work` was not run. This handoff is the newest state.
