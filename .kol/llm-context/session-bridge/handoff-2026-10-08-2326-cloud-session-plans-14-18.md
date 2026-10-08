# Handoff — 2026-10-08 23:26

**From a cloud session, for the next LOCAL session.** Everything below was built here and walked on `vite preview` in Chromium (desk 1600 · phone 390 touch emulation), never on a device or the live site. `/log-work` was not run; AGENT-CONTEXT's dated entry is this handoff's § "For AGENT-CONTEXT".

## Goal of the current arc
Morph and the timeline made right (plan 14), the phone's rail and viewer (plan 15), the randomiser's live screen (plan 18), the audit (plan 16) — and a parked list of DS gaps for a local session to file (plan 17).

## Last actions taken (causal trail, newest first)
- **Plan 18 built:** the collapsed randomiser row is one line of icons (bolt roll · download · eye-off Hide UI · maximize Fill); the pinch writes the stage transform per move (ceiling 4); **`rollScopes` / `rollEffects`** app settings + `RollScopesDialog` (gear beside every Randomize all — phone tab, labs rail, editor inspector) decide what *all* touches; **the time shape** — `vpTime` (linear · ease · pingpong · steps · bounce · drift) · `vpSpeed` · `vpPhase` in the Animation tab's Form section of every non-Penrose loop, applied in `drawLoopFrame` and on the GL engines' `u` (`loops/lib/viewport.js` `warpTime`, folded at `registry.js`).
- **Plan 16 audit run:** `.kol/llm-context/audit/2026-10-08.md`, 12 findings, nothing fixed.
- **Plan 17 written:** the parked DS list (step list → kol-component in two variants; `SegmentedToggle` per-option `disabled`).
- **Plan 15 built** (commit `980160b`): the touch sheet grab drags live on the DS gesture (`useGrabEdge` axis x + the tap-vs-drag slop; `SheetGrab` in `PanelHeader.jsx`, both labs and the randomiser), **`TransportFab`** (round play button + chevron over the canvas, the motion pack's new `canvas.overlay` slot on the local `EditorShell`; the touch footer is Output · File), **Media** in the rail at sign-in (`MediaLibrary variant="modal"`, a pick lands as a photo layer through `library/mediaPick.js`), a standalone safe-area rule (unverified).
- **Plan 14 built** (same commit): the timeline dock is this repo's file again (`params/TimelineDock.jsx`, off the DS organism); **Crossfade** as a third morph mode (`shape.js` `crossfadeMorphDef`), Blend greyed across generators and Shape/Crossfade greyed for GL engines; Shape **Resolution**; Length dropped from the Morph rail (the transport owns it, `UrlIntents` sets it on open); steps reorder by `drag-handle`; the labs title reads `Loops / Simple`; `Loop / 4s` centred; the counter in seconds; one **header lane per morph** with step names (a name presses `editRequest` → the rail edits it; Blend's param lanes fold under); the dock resizes by its top edge (`useGrabEdge`), a selected key shows its **cubic-bezier curve** with two handles (`Custom` in the easing menu — the resolver already read arrays).

## Current state / open decision points
- **Uncommitted at the time of writing:** plan 18 + the audit + this handoff (the user commits).
- The walks live in the cloud scratchpad only (`walk-morph.mjs` · `walk-mobile.mjs` · `walk-randomiser.mjs` · `walk-audit.mjs`, Playwright); none are in the repo. A local `_tmp/` copy is worth making if they are wanted again — they drive the built bundle through the real picker, grab and dialog.
- **Media in the rail lists nothing here** — the container cannot reach `media.kolkrabbi.io`; the modal opens and the pick path is wired. First real listing is local.
- **The time curves are unjudged by eye.** `steps` / `bounce` / `drift` are shapes that close; whether they feel right on a scanline is the user's call. `bounce` jumps at the half (by design, a hit).
- The sign-in flow was walked against a stub Worker (`/api/documents` → `[]`), not production D1.
- Plan 15 § 5 (the device pass) and plan 11 step 4 (safe area at 390) are still the user's phone.

## Next intended action
1. Commit/push (the user's).
2. On a device: the sheet drag, the floating transport, Fill + Hide UI for a screen recording, the pinch, and the time curves on a real loop.
3. Order the audit's 12 findings (`audit/2026-10-08.md`); the quick ones are #9 (four helper → mono lines), #10 (delete the retired lib build), #2/#3 (labs deep link: rails collapsed, the restore prompt).
4. File plan 17's two DS items as lobby tickets.
5. `/log-work` for the whole cloud arc (three commits: `980160b`, `95e8748`, and the plan-18 one).

## For AGENT-CONTEXT (the dated entry not yet written)
2026-10-08, cloud (**MORPH MADE RIGHT · THE TIMELINE HOME · THE PHONE'S SHEET, PLAY BUTTON AND MEDIA · THE RANDOMISER'S ROW, DIALOG AND TIME SHAPE · AUDIT**) — see plans 14 · 15 · 16 · 17 · 18, all with status lines. Laws this arc set: **the timeline is this repo's** (no DS round trip for editor work holds for it too); **a morph is one layer with a header lane**; **what Randomize all touches is a setting, not a rule**; **the loop clock has a shape** (`warpTime`, one seam, live and export); **DS gaps from a cloud session go to plan 17, never tickets**.

## Working memory not yet in AGENT-CONTEXT
- `SegmentedToggle` has no per-option `disabled` (0.244.0) — the greyed morph mode is a dimmed label + tooltip + a refusing `onChange`.
- The DS's horizontal grab pill CSS lives on `ColumnBrowser`'s class; the dock and the sheet carry their own copies (`.kol-timeline-grab`, `.kol-sheet-grab` in `kol-editor.css`) — the hook supplies `is-near` + `--kol-rail-grab-x` only.
- `PanelPills` is `flex-nowrap` now; anything added to the collapsed row must be an icon or it will not fit at 390.
- The randomiser's live screen opens with the sheet COLLAPSED on a fresh pick (the row shows); the walks pressed the pill to open it.
- `appSettings` key is `kol-editor-settings`; `rollScopes` is `{ scopeId: bool }`, `__color` is the Color scope's id.
