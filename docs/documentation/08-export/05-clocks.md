---
title: The three clocks — what animates vs. what freezes
type: reference
status: active
updated: 2026-07-08
description: Why the offline bake reproduces only motion that is a pure function of transport t, why free-running sims and video freeze, the transport-t-vs-epoch model, and the Export-loop-vs-Record decision rule.
tags:
  - project/kol-fxr
  - domain/export
  - editor/transport
aliases:
  - clocks
  - animate-vs-freeze
  - export-loop-vs-record
covers:
  - the three clocks (transport t, sim state, video currentTime)
  - what bakes deterministically vs what freezes
  - the transport t vs epoch model
  - the Export-loop-vs-Record rule
sources:
  - src/editor/params/transport.js
  - src/editor/compose/useComposeFile.js
  - src/editor/compose/LayerRenderer.jsx
related:
  - "[[INDEX|export]]"
  - "[[03-formats|formats]]"
  - "[[04-batch-and-record|batch & record]]"
  - "[[../06-camera-motion/INDEX|camera & motion]]"
  - "[[../09-media/INDEX|media]]"
---

# The three clocks — what animates vs. what freezes

The two webm modes exist because the editor has **three independent clocks**, and the offline bake can only reproduce one of them. The bake works by *seeking* the transport `t` frame by frame (`transport.seek(i/N)`), so it can only reproduce motion that is a **pure function of `t`**. Anything carrying its own accumulated state freezes.

| What moves | Clock it reads | Offline loop bake (`onExportWebm`) | Live record (`onRecordStart`) |
|---|---|---|---|
| **Keyframes / bound props** (the timeline edits) | pure function of transport `t` | ✅ deterministic — re-resolved exactly at each seeked `t` | ✅ live |
| **`u`-derived loops** (phase-based generators) | pure function of `t` (`u = t`) | ✅ deterministic — one seamless `u: 0→1` loop | ✅ live |
| **Free-running loops / sims** (GL engines, reaction-diffusion, penrose — integrate `dt`) | own state, reset only by `epoch` | ⚠️ **frozen** — the bake pauses the transport, so `dt=0`, each holds one frame and is snapshotted `N` times | ✅ captured actually running |
| **Video** (`srcType:'video'`) | `currentTime` — play/pause + `epoch`→`trimIn` + trim window | ⚠️ **frozen** — video is not `t`-scrubbed; a paused transport holds it on one frame | ✅ plays for real |

## The master clock and the reset epoch

**The transport is the master clock** (`src/editor/params/transport.js`): normalized `t ∈ [0,1]` wrapping every `loopSeconds` (default 4). `t` *is* the loops' `u`.

A monotonic **`epoch`** counter — bumped only by stop/rewind, never by pause (pause must hold every sim exactly in place) — is what reseeds the stateful consumers: free-running sims **and** a video's `currentTime` (→ `trimIn`) both key on it. That shared `epoch` is why **video and free-running sims sit on the same side of the line** — governed by `epoch`, not `t`. The reset-epoch governance itself is owned by [[../06-camera-motion/INDEX|camera & motion]].

## Video edits are structural, not timeline motion

`trimIn` / `trimOut`, `playbackRate`, `videoLoop`, `videoMuted` are `animatable:false` — they shape the clip's *own* playback window and never join the transport-`t` seek (binding them would re-seek the element every tick). So editing a video's trim changes what Record captures, but an offline loop bake freezes the video regardless. The video source itself is [[../09-media/INDEX|media]].

## The practical rule

- **Timeline edits + generative loops → Export loop** — deterministic, seamless, `t`-driven.
- **Video, or any free-running sim → Record** — the only mode that captures a clock other than `t` actually running.
</content>
