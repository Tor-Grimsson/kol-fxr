# Session: KOL bump to latest + Labs mode scoped (Phase 11)

**Date:** 2026-08-08
**Agent:** Grim (Fable 5)
**Summary:** Bumped all four KOL packages to actual latest (deps + peer ranges — the stale `^0.1.2` peer contract is closed), build green. Then scoped **Labs mode** — a second chrome over the same engine, labs.kolkrabbi.io-shaped — as Phase 11 in `plan.md`, with a 6-step build plan. **No mode code written; build handed to the next session by design.**

## Changes Made

- `package.json` — `kol-component ^0.24.0` · `kol-theme ^0.30.1` · `kol-framework ^0.13.0` · `kol-icons ^0.10.0` in **both** devDependencies and peerDependencies (peer ranges were `^0.1.2`/`^0.1.1` — the deferred publish-contract fix, now done). `pnpm-lock.yaml` regenerated. Note: `pnpm outdated` served stale registry data — verify against `npm view <pkg> dist-tags` when it matters.
- `.kol/llm-context/plan.md` — **Phase 11 — Labs mode** added: scope, the standing pieces, the one-layer trick, three-mode model (Editor · Labs · Randomiser), draft-key + media-source resolutions, kill criteria, and build phases **11.1–11.6**.

## Current State

- `pnpm build` green (known chunk-size warning only). **Not visually checked** — 24 kol-theme minors of drift; needs user eyes.
- `kol-helper-11` confirmed gone from theme 0.30.1 (ladder is 8/10/12/14/16/20). One site: `ParametersPanel.jsx:305`. Proposed `kol-helper-12`; **user has not said go** — still owed.
- `kol-component@0.24.0` peer-wants `opentype.js ^1.3.4`, repo has 2.0.0 — warning only.
- Labs mode: **decided and scoped, zero code**. All decisions in plan.md Phase 11 (user-resolved 2026-08-08: full capability not reduced; three modes; own draft key; From-library|Upload both).

## Next Steps

1. **Build 11.1** — the spike (`?view=labs`, labs registry, one selected loop layer, existing rail). Kill criteria live there; read plan.md Phase 11 first.
2. Then 11.2 → 11.6 in order.
3. Small owed items: `kol-helper-11` → `kol-helper-12` one-liner (awaiting go); visual pass over the editor on the new DS versions.
