---
title: Working here
type: reference
status: active
created: 2026-10-09
updated: 2026-10-09
description: The kol-fxr house rules a cloud agent cannot load from the local skills — where context, plans, audits and DS gaps live, and how work is verified and reported
tags:
  - project/kol-fxr
  - domain/workflow
  - audience/agency-internal
aliases:
  - cloud-house-rules
related:
  - "[[INDEX|Cloud sessions]]"
  - "[[03-deploy|Deploy]]"
---

# Working here

Locally these come from `~/.claude/CLAUDE.md`, `LLM_RULES.md` and the skills. The container has none
of them, so they are written down here.

## Where things live

| Path | What |
|---|---|
| `.kol/llm-context/ARCHITECTURE.md` | load-bearing decisions — flag a contradiction before acting on it |
| `.kol/llm-context/AGENT-CONTEXT.md` | current state; the "Last updated" chain is capped at five entries |
| `.kol/llm-context/session-log/` | one log per session (`YYYY-MM-DD-slug.md`) |
| `.kol/llm-context/audit/` | audit logs — one per pass, numbered findings with file:line, nothing fixed in a pass |
| `.kol/llm-plan/NN-slug.md` | plans; a plan's screenshots sit beside it in `NN-assets/` |
| `.kol/llm-plan/17-parked-for-the-ds.md` | every design-system gap. The cloud has no kol-ds-ui; the user files these locally |
| `lobby/` | tickets to and from other repos — read-only from the cloud |
| `docs/` | this vault; `docs/documentation/` is the subject, `docs/operations/` the machinery |

## How work is done

- **Source:** the editor is `src/` (no DS round trips for editor work). The DS is consumed from
  `node_modules/@kolkrabbi/*` — read its source there; cite components and tokens by name and path
  before proposing anything new.
- **Styling:** Tailwind utilities first; new CSS only where Tailwind cannot reach. KOL type classes
  only — `kol-mono-*` for text that can wrap, `kol-helper-*` for single-line chrome.
- **Copy:** never rename user-facing text unless the plan says to.
- **Scope:** the smallest change that does what was asked. Removing a file means moving it to
  `_tmp/YYYY-MM-DD-what/` — and since `_tmp/` does not survive the container, say in the handoff what
  was moved.
- **Verify:** on the built bundle (`pnpm build && pnpm preview`). The repo has no Playwright
  dependency — use the session's browser tools, or `pnpm dlx playwright` with a throwaway script.
  Say what was checked and what was not.
- **Logic leaves one check:** a branch, loop or parser gets one runnable check (an `assert` script
  beside it, like `src/editor/morph/shape.check.mjs`). No frameworks.

## Reporting

- Short. Answer what was asked; work done is a line or two per item.
- No options menus — pick one, say why in a sentence, ask yes/no.
- End with the session log (`.kol/llm-context/session-log/`) and a bounded AGENT-CONTEXT update,
  then the handoff from [[02-branch-and-handoff|Branch and handoff § 2]].
