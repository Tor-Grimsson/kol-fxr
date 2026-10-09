---
title: Branch and handoff
type: playbook
status: active
created: 2026-10-09
updated: 2026-10-09
audience: internal
description: The session branch, fast-forwarded into main
providers:
  - GitHub
tags:
  - project/kol-fxr
  - domain/workflow
  - pattern/workflow
  - audience/agency-internal
related:
  - "[[INDEX|Cloud sessions]]"
  - "[[01-authorship|Authorship]]"
  - "[[03-deploy|Deploy]]"
---

# Branch and handoff

## 0. The branch

Each cloud session is handed a branch named `claude/<words>` and works only there. It commits and
pushes freely to it, and never pushes to `main`. The branch exists for one session and is deleted
once `main` has it.

## 1. Keep main linear

The handoff is a **fast-forward**: `main` moves up to the branch's last commit, no merge commit is
made, so the branch name never lands in history.

That only works while the branch sits on top of `main`. If the user has pushed to `main` since the
session started, the agent **rebases** its branch onto `origin/main` (its own branch — safe) and
force-pushes the branch. It never merges `main` into the branch: that merge commit would read
*"Merge … into claude/…"* and carry the name into history.

## 2. Handoff

The session's last message gives these steps, with the branch name filled in:

```bash
cd ~/dev/projects/kol-fxr
git checkout main
git pull
git fetch origin claude/<words>
git merge --ff-only origin/claude/<words>
pnpm install
pnpm build               # green, the chunk-size warning is known
git push origin main     # Vercel deploys main
```

`--ff-only` refuses to merge when a fast-forward is impossible — if it fails, stop and ask the agent
to rebase (§ 1), never drop the flag.

Then whatever [[03-deploy|Deploy]] says is owed, then delete the branch:

```bash
git push origin --delete claude/<words>
```

## 3. Verification

- `git log --oneline -5 main` shows the session's `fxr-NNNN` commits and no merge commit
- `git branch -r` no longer lists `origin/claude/<words>`
