---
title: Cloud sessions
type: index
status: active
created: 2026-10-09
updated: 2026-10-09
description: Agents working on kol-fxr from a claude.ai container — what they have, what they don't, and how the work comes home
tags:
  - project/kol-fxr
  - domain/workflow
  - pattern/workflow
  - audience/agency-internal
related:
  - "[[../INDEX|Operations]]"
  - "[[../01-services|Services]]"
---

# Cloud sessions

A cloud session is an agent running in a throwaway container on claude.ai, not on the iMac or the
MBP. The repo is cloned fresh from GitHub when the container starts. Nothing on the local machines
reaches it — no `~/.dotfiles`, no local skills, no `_tmp/`, no uncommitted work, no other repo (the
kol-ds-ui lobby included) — and nothing it leaves outside git survives it.

`LLM_RULES.md` is written for the local machines (in the container it is a dangling symlink). Where
it and this shelf disagree, **this shelf wins inside a cloud session** — git especially: locally the
user owns all git; in the cloud the agent commits and pushes to its own branch.

| Page | What it holds |
|---|---|
| [[01-authorship\|Authorship]] | The user is the only author. No agent credit, trailer or identity anywhere in the repo |
| [[02-branch-and-handoff\|Branch and handoff]] | The session branch, how it reaches `main` without a merge commit, and when it is deleted |
| [[03-deploy\|Deploy]] | The cloud builds and verifies; Vercel deploys from `main`; the Worker deploys locally |
| [[04-working-here\|Working here]] | The house rules the local skills would have loaded: context, plans, audits, verification, DS gaps |

## Starting

- **Context:** the boot skill (`/ag-init`) lives in `~/.dotfiles`, which the container does not have.
  Read, in order: `.kol/llm-context/ARCHITECTURE.md`, `.kol/llm-context/AGENT-CONTEXT.md`, the
  newest file in `.kol/llm-context/session-log/`, then the plan the user named in `.kol/llm-plan/`.
- **Install:** `pnpm install` — the `@kolkrabbi/*` packages install from npm without auth.
- **Machine:** the container reports `x86_64`. That is not the iMac — say "cloud container".
- **The report:** one line, "Context loaded." Nothing after it.
- **Replies:** short. A yes/no question gets a yes or no.

## Ending

Everything worth keeping is committed and pushed before the turn ends — `_tmp/` is gitignored, so a
screenshot or log that matters is copied beside its audit or plan first. The last message gives the
user the terminal steps from [[02-branch-and-handoff|Branch and handoff § 2]] and anything owed from
[[03-deploy|Deploy]].
