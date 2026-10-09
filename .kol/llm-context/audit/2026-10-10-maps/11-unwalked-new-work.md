# 11 — Unwalked new work (fxr-1008 … fxr-1011): a functional walk script's map

Scope: code touched by the last session and never run in a browser. Last commits per file: `git log` — TimelineDock, MorphTab, shape, StepPicker, MediaPickerDialog, useComposeFile, LibraryProvider, FilesDialog, libraryApi, keymap, LoopFields, EffectsPanel, MobileOverlay, useLabsKeys all at `9b697d0 fxr-1010`; TransportBar last at `980160b` (plan 14 § 5). KOL packages: `node_modules/@kolkrabbi/kol-component` 0.246.0 (package.json), kol-theme, kol-icons, kol-shell.

Routes (src/App.jsx:112-116): `/editor` → Editor, `/labs` + `/morph` → LabsView, `/randomiser` → MobileView. Rail rows: src/AppLayout.jsx:87-93 (`Library · Editor · Labs · Morph · Randomiser`), pinned foot src/AppLayout.jsx:277-281 (`Media` only with a session, `Sign in` / `Synced · sign out` only with `VITE_FXR_API`, `Settings`). NavRail rows carry `aria-label={label}` (node_modules/@kolkrabbi/kol-shell/src/NavRail.jsx:217) and `aria-current="page"` (:211).

**No `data-testid` exists anywhere under src/editor** (grep, 0 hits); no DOM `id=` either — the only `id="…"` are SVG defs (src/editor/compose/build.js:140,177,200; src/editor/modes/pattern/render.js:148). Scripts must target `aria-label`, `role`, visible text, and the `data-*` listed in § 10.

---

## 1. TimelineDock — GraphLane · Sync loop · double-click grab (src/editor/params/TimelineDock.jsx)

Mounted as `canvas.footer`: editor via the motion pack (src/editor/Compose.jsx:33 → src/packs/motion.js:11,18), labs directly (src/editor/labs/LabsView.jsx:16,316); EditorShell renders the slot in `.kol-editor-canvas-footer` (src/editor/EditorShell.jsx:115-119). **Renders nothing until a track exists** (TimelineDock.jsx:454).

### Reach (fresh load)
| Step | Editor | Labs |
|---|---|---|
| Put a generator on stage | topbar menu `addGenerative` → `addLayer('loop', …)` (src/editor/shell/MenuTop.jsx:121-127) | click a labs section row then a group row in the shell rail (src/editor/labs/LabsNav.jsx:71-96, rows are NavRail buttons `aria-label={label}`), or the entry card's `Button` rows (src/editor/labs/LabsCatalogCard.jsx:32-45) |
| Show modulation dots | press `M` (src/editor/state/keymap.js:100) | press `M` (src/editor/labs/LabsParams.jsx:455-462) |
| Open the right rail's params | tab text `Parameters` (src/editor/shell/panels/SelectionPalettePanel.jsx:12,97) | rail already shows LoopFields (LabsParams.jsx:402-406) |
| Make a track | click a dot `aria-label="Modulate <param label>"` (src/editor/params/BindDot.jsx:79) → menu entry text `Keyframes` (BindDot.jsx:68) → writes `{bind:'track', keys:[{t:0,v},{t:1,v}]}` (BindDot.jsx:53) | same |
| Result | dock appears under the canvas: `.kol-timeline-dock` (TimelineDock.jsx:471), one `TrackRow` labelled `${labelForLayer(l)} · ${key}` (:72) | same; a morph adds a header lane (:67) |

### Measured values
| Thing | Value | Where |
|---|---|---|
| Label column width | `120` px (counter, track labels, graph axis) | :110, :200, :341 |
| Counter | `kol-mono-12 text-meta tabular-nums`, text `${(t*len).toFixed(2)} / ${len.toFixed(2)} s`, Tooltip "Time / loop length" | :109-110 |
| Scrub ruler | `h-4 cursor-ew-resize rounded`, bg `--kol-fg-04` | :114-115 |
| Playhead | `width: 1.5`, bg `--kol-accent-primary` | :135 |
| Sync loop button | `Button tone="ghost" quiet size="xs" iconOnly="repeat" aria-label="Sync loop"`, Tooltip "Sync loop — the end takes the start's values, so the loop is seamless" | :122-123 |
| Track label type | header `kol-mono-12 text-emphasis`, param lane `kol-helper-10 text-meta` | :202 |
| Fold button | `Button ghost quiet size="xs" iconOnly="chevron-down" aria-label="Show the morph’s tracks"/"Hide the morph’s tracks" aria-expanded`, `-rotate-90` when folded | :205 |
| Lane | `h-5 rounded cursor-copy`; bg header `--kol-fg-08` else `--kol-fg-04` | :210-211 |
| Diamond | `data-diamond=""`, 9×9, `rotate(45deg)`, `borderRadius 1.5`, fill `--kol-accent-primary` (selected) / `--kol-fg-emphasis` | :222-233 |
| Step-name button | `data-name=""`, `aria-label="Edit step <name>"`, `kol-helper-10 text-meta hover:text-emphasis` | :243-250 |
| Graph lane | `GH = 132`, `GPAD = 14`; container `height: 132`, bg `--kol-fg-04`, `touchAction: none` | :265, :344 |
| Graph segment | `<path>` stroke `--kol-fg-emphasis` 1.5; hold = `H…V…` dashed `3 3` | :348-349 |
| Graph handle | `<line>` + `<circle r=4>` fill `--kol-surface-primary` stroke `--kol-accent-primary` 1.5, `cursor: grab` | :334-336 |
| Graph key | `<rect 9×9 rx=1.5 rotate(45)>` fill accent/emphasis | :359-362 |
| Key editor | `key @ … s` `kol-helper-10`; `Input variant="ghost" size="sm" chars={7}`; `Dropdown variant="subtle" size="sm"` options EASING_OPTIONS + `Custom`; `Button ghost quiet size="sm"` `Delete key` · `Close` | :387-413, :370 |
| Dock root | `.kol-timeline-dock relative border-t border-oq-08 px-4 py-2 flex flex-col gap-1 select-none`, bg `--kol-surface-primary`, `height: dockH`, `maxHeight: 480` when auto | :471 |
| Dock height | `DOCK_KEY 'kol-fxr:dock-h'`, `DOCK_MIN 56`, `DOCK_MAX 480`, drag base `120` when auto | :420-422, :473 |
| Grab | `.kol-timeline-grab` (8px tall, `cursor: row-resize`, pill 4.5rem×0.125rem; src/editor/styles/kol-editor.css:188-211), `role="separator" aria-orientation="horizontal" aria-label="Resize the timeline"`, `useGrabEdge(ref, { axis: 'x' })` (node_modules/@kolkrabbi/kol-component/src/hooks/useGrabEdge.js:68) | :428-433 |

### Walk + expected result
1. **GraphLane**: click a diamond (`[data-diamond]`) on a numeric param lane → `selected` set (:179) → a 132px lane opens under that row (:484-486, only when every `k.v` is a number, not a header, not readOnly) → SVG with one `<rect>` per key, `<path>` per segment, handles only on segments adjacent to the selected key (:351-356). Drag a `<rect>` → `live` keys follow (:300-320), t clamped between neighbours (:307-308), v free; pointer-up → one `updateLayer` write (:326) via `writeKeys` (:456-459, keys re-sorted). Drag a `<circle>` → that segment's `easing` becomes a `[x1,y1,x2,y2]` tuple rounded to 3 dp (:315-317) and the key editor's dropdown reads `Custom` (:382). Axis labels show `hi` / `lo` rounded 2 dp (:342).
2. **Sync loop**: click `[aria-label="Sync loop"]` → `syncLoop` (:461-466): one transaction (`beginTransaction`/`commitTransaction`, src/editor/compose/state.jsx:711-714), every lane that is not readOnly, not a header and has >1 key gets `syncLoopKeys` (:82-89): first key forced to `t:0, v:sampleTrack(keys,0)`, keys with `0<t<1` kept, a new `{t:1, v:v0}` appended (no easing). Observable: last diamond at `left: 100%`, its tooltip `v=` equals the first key's; one undo entry.
3. **Double-click grab**: `dblclick` on `[aria-label="Resize the timeline"]` → `onReset` → `setDockH(null)` (:439, :475) → root `height` unset, `maxHeight 480`, `localStorage.removeItem('kol-fxr:dock-h')` (:452). Drag: `pointerdown` (preventDefault + capture :434) then `pointermove` with Δy → height clamped 56…480 (:473) and persisted (:452).

### Risks (read)
- `drag.current?.range` is read during render (:281) — a ref read in render; the scale freezes mid-drag by design but any unrelated re-render mid-gesture reads the same ref (harmless, lint-visible).
- `onPointerDown` calls `e.preventDefault()` (:434) then relies on `onDoubleClick` (:439): per Pointer Events, cancelling `pointerdown` suppresses compatibility mouse events but not `click`/`dblclick` — Chrome/Firefox fire it; Safari behaviour unverified (§ 12).
- At `DOCK_MIN 56` the root has `overflow` unset: the ruler (h-4) + `py-2` + grab + `SelectedKeyEditor` (outside the `overflow-y-auto` box, :478 vs :490) exceed 56px → the editor row paints over the canvas column.
- `GraphLane.end` recovers the moved key by object identity after `writeKeys` re-sorts (:327) — fine — but `TrackRow.onDiamondPointerUp` uses `next.indexOf(moved)` on a *different* sorted array (:191-193) — same technique, fine; both leave `selected.index` stale if a parent write reorders keys between renders.
- `syncLoop` iterates `tracks` from `useMemo([layers])` (:447) while `writeKeys` mutates `layers` inside the loop — each `updateLayer` is an updater on the compose store so stale `tr.keys` per track are the pre-sync keys, which is what is wanted; but two tracks on one layer produce two `updateLayer` calls in one transaction — correct only if `updateLayer` merges patches (it does, used everywhere).
- `collectTracks` header `names` map `Math.round(k.v) % steps.length` (:64) — a Blend morph's synthetic header has `readOnly: true` so GraphLane never opens on it (:484) and `SelectedKeyEditor` returns null (:376); clicking its diamonds still calls `setSelected` (:179) — selection highlight with no editor: expected.
- `SelectedKeyEditor` `Input type="number"` writes `Number(e.target.value) || 0` (:393) — typing `-` or `.` mid-entry writes 0.

## 2. TransportBar (src/editor/params/TransportBar.jsx)

Mounted: editor/labs footer `Transport` tab, desktop only, stays mounted hidden (src/editor/shell/panels/EditorFooter.jsx:197, 289-292, `hidden` class when `tab !== 'transport'`); touch → `TransportFab` (src/editor/params/TransportFab.jsx:38, lines 25/28/39 `aria-label` "Open the transport" / "Play"|"Pause" / "Close transport"); randomiser sheet `Transport` tab (src/editor/mobile/MobileOverlay.jsx:419-424, size `cs` = `'lg'` sheet / `'sm'` rail :179). Collapsed rail shows one `Button ghost size="md" iconOnly play|pause aria-label "Play"|"Pause"` (EditorFooter.jsx:260).

| Control | DOM | Where |
|---|---|---|
| Play/Pause strip | `SegmentedToggle size={size} ariaLabel="Playback"` → `role="radiogroup" aria-label="Playback"` (node_modules/@kolkrabbi/kol-component/src/atoms/SegmentedToggle.jsx:85-86); cells `role="radio" aria-checked aria-label="Play"/"Pause"` (:103-105), tooltips `Play (Space)`/`Pause (Space)` | TransportBar.jsx:79-86 |
| Loop field | `Input type="text" inputMode="decimal" variant="property" affordance="Loop /" unit="s" chars={3} aria-label="Loop length in seconds"`, `className="justify-center" inputClassName="text-center"`; Tooltip "Loop length" | :32-54 |
| Stop/Rewind strip | `SegmentedToggle ariaLabel="Reset" value={null}` → `role="group"`; cells `aria-label="Stop"/"Rewind"` (no tooltip prop → the DS shows `ariaLabel` as tooltip, SegmentedToggle.jsx:100) | :90-97 |
| Square cells | `SQUARE[size]`: `[&_.kol-seg-cell]:w-[var(--kol-ctl-sm|md|lg)]`; tokens 26/32/40 px (node_modules/@kolkrabbi/kol-theme/kol-base-tokens.css:215-217), touch override 32/36/40 (:222-224) | :66-70 |
| Glyphs | `Icon size={glyphSize(size, true)}` | :59 |

Walk: type `8` in `[aria-label="Loop length in seconds"]`, Enter → blur → `setLoopSeconds(8)` (:25-30, :47) → counter in the dock reads `/ 8.00 s`; Escape restores (:48); `transport.setLoopSeconds` floors at 0.1 (src/editor/params/transport.js:83). Click `[aria-label="Play"]` → `aria-checked="true"`, the dock's playhead `left` advances. `[aria-label="Stop"]` → `t=0, playing=false, epoch++` (transport.js:81); `Rewind` keeps playing (:82).
Risk: an empty or non-finite draft silently reverts (:28) — no error state.

## 3. Morph: MorphTab · shape.js · StepPicker

Reach: rail row `aria-label="Morph"` (src/AppLayout.jsx:92) → `/morph` (src/App.jsx:115) → LabsView sets `morph.active` (src/editor/labs/LabsView.jsx:535-536) → LabsParams renders `<Surface title="Morph"><MorphTab …/>` (src/editor/labs/LabsParams.jsx:468). Or New file → door text `Morph` → `/morph?new=morph` (src/components/NewFileDialog.jsx:22) → `resetMorph({active:true, picker:'preset'})` (src/editor/library/UrlIntents.jsx:48) opens the picker at once. Arriving from `/labs` with a generator on stage: MorphTab's mount effect adds it as step 1 (src/editor/morph/MorphTab.jsx:89-91). StepPicker is mounted once per LabsView (LabsView.jsx:542).

### MorphTab DOM (MorphTab.jsx)
| Element | Selector / text | Where |
|---|---|---|
| Mode strip | `SegmentedToggle size={cs}` cells text `Shape` · `Blend` · `Crossfade`; blocked cell `aria-disabled="true"` + tooltip reason (SegmentedToggle.jsx:34-37,106) | :73-79, :163 |
| Steps | KOL `StepList` (node_modules/@kolkrabbi/kol-component/src/molecules/StepList.jsx): rows `.kol-step-list-item` (:58), grab `aria-label="Reorder step N"` (:65), body button text = `stepLabel` (:83-90), `aria-label="Remove step N"` (:93), dashed add row text `Add a step` (:98-106) | :168-179 |
| Hints | `Two steps or more and the stage plays the morph.` (`kol-mono-12 text-meta`); blocked reason | :180-181 |
| Step editor | section label `Step N`, strip `editTabs` (GEN_TABS), LoopFields `inline picker={false}`, line `Editing step N — press Play to run the morph.` | :184-190 |
| Settings | AutoControls over `SETTINGS`: `Curve` (select), `Cycle` (select), `Resolution` (range 0–1024, `Auto` at 0, `when: mode === 'shape'`) | :44-48, :192 |
| Save | `Button tone="primary" size={cs} w-full` text `Save…` (no fileId) / `Save` (fileId), disabled `< 2 steps`; prompt `Name this morph:` | :196, :149 |

### StepPicker DOM (src/editor/morph/StepPicker.jsx on ShellSearchOverlay)
`role="dialog" aria-modal aria-label="Search"` (node_modules/@kolkrabbi/kol-component/src/organisms/ShellSearchOverlay.jsx:203-205); input `role="combobox"` placeholder `Search presets and files` (StepPicker.jsx:92, Overlay:230); `role="listbox"` rows `role="option"` (Overlay:260,272); close `aria-label="Close search"` (:197); footer `selectLabel="Add step"` (StepPicker.jsx:93). Rows: `Current stage` group (:53, only `stageOk` :46), `My files` (:59, labs files, morph files skipped :57), presets grouped by generator label (:65). Blend after step 1 lists one generator only (:43, :57, :63). Pick → `addStep` (+ `setOnly` for the first step :78) → overlay closes itself → `onClose` clears `picker` (:81).

### Walk + expected result
1. `/morph?new=morph` → picker open; type `spiral` (or any) → rows; Enter → step 1 on the stage, StepList row `1 <label>`; `Add a step` → second pick → `rebuild` runs (:110-115) → `updateLayer`/`setOnly` with `morph:{mode, steps, cycle, curve, resolution, name}` and `morphT:{bind:'track', keys: morphKeys(n, cycle, curve)}` (:100; shape.js:274-277: Loop = indices `0..n` eased, so the dock's header lane has n+1 diamonds, the last named as step 1, TimelineDock.jsx:64,238). Transport starts (`transport.play()` :114). The dock shows a header lane `kol-mono-12` named `morph.fileName || 'Morph'` (TimelineDock.jsx:63) with `data-name` buttons.
2. Mode `Blend` with two different generators → cell `aria-disabled`, tooltip `Blend tweens one generator — these steps are different generators` (:69); a GL engine step blocks Shape/Crossfade with `No outline to morph: … (GL)` / `Cannot fade: … (GL)` (:70-71); an impossible current mode falls to the first possible (:81-85).
3. Click a step row body → `editStep` (:132-138): transport pauses, `editing=i`, the stage shows that step static with `morph:null, morphT:null`; `Step N` section opens; LoopFields edits write back to the step (:118-122); pressing Play (`[aria-label="Play"]` or Space, LabsView.jsx:458-461) ends the edit (:124-128) and the sig effect rebuilds.
4. Dock → `[aria-label^="Edit step "]` → `setMorph({editRequest})` (TimelineDock.jsx:196) → MorphTab consumes (:140-144) → same as 3.
5. `Save…` → prompt → `buildSavedSpec` captures a thumb (§ 5) → `addItem('preset', {mode:'morph', morph:{…, seconds}})` (:151-154) → rail title keeps; Files dialog lists it under `preset/`.
6. Shape jolts fix (shape.js): `STICK = 1.1` alignment memo (:146-174), per-pair memos `Map` cleared past 32 (:290-291, :306), `EDGE = 0.12` cross-fade of the step's own drawing at segment ends (:293-304). Observable only visually: no twist at `k≈0` / `k≈1`.

### Risks
- `rebuild` writes `morph.name: morph.fileName` (:97) — `null` until saved → dock header label falls back to `'Morph'` (TimelineDock.jsx:63); after Save the name shows only after the next rebuild (sig unchanged → no rebuild until a setting changes).
- `useEffect(…, [layer])` (:118-122) compares `pickParams(layer)` to the step every layer tick; while playing (`editing == null`) it returns early — fine; while editing, the stage's own `u` animation does not touch params — fine.
- Unmount effect (:130) reads `morph.editing` from the first render's closure (deps `[]`) → leaving the rail mid-edit **does not** end the edit unless `editing` was already non-null at mount (stale closure). Then `rebuildRef.current()` runs against the current steps — fine when it runs.
- `save` with `editing != null` calls `rebuildRef.current()` then `buildSavedSpec` (:150-151) — the rebuild's `updateLayer` is async in React; `buildSavedSpec` reads `layers` from the hook's render closure → the saved spec/thumb is the **edited step**, not the morph.
- `blocked[mode]` on `/randomiser` (`readOnly`) skips the fallback (:82) → a read-only morph in an impossible mode just shows the reason (:181).
- shape.js `drawShapeMorph` memo key `${i}>${j}` is shared across every morph layer on the page (module `memos` :306) — two shape morphs with the same step indices share alignment memory.
- `crossfadeMorphDef` is honoured by LayerRenderer (src/editor/compose/LayerRenderer.jsx:33-35) but **not** by build.js (`defFor` shape only, src/editor/compose/build.js:44) → thumbnails/PNG/SVG of a Crossfade morph draw the base generator (§ 11 C7).

## 4. MediaPickerDialog and its four doors (src/editor/library/MediaPickerDialog.jsx)

| Door | Trigger (visible text / aria) | Mount | Result write |
|---|---|---|---|
| Shell rail | NavRail row `aria-label="Media"` — only while signed in (src/AppLayout.jsx:278) | AppLayout.jsx:344 | `pickMedia({url: proxied(url), srcType})`, leaves to `/editor` from a shell page (:284-288) |
| Editor footer File tab (photo layer) | `Button` text `From library` (src/editor/shell/panels/EditorFooter.jsx:141-143) | EditorFooter.jsx:153 | `patch({src: proxied(url), srcType})` (:116-118) |
| Labs source | `SegmentedToggle ariaLabel="Source"` cell text `Library` (src/editor/labs/LabsSourcePicker.jsx:111-118,125); card button text `From library` (:141) | LabsSourcePicker.jsx:84 | `patch({src…})` or `svgSrc` in distress mode (:65-68); `accept` is the function `isSvgObject` (:12) for SVG |
| Layer inspector | `Button` text `Library` (src/editor/compose/inspectors/LayerInspector.jsx:380-385) | LayerInspector.jsx:394 | `patch({src…})` (:333-335) |

DOM: `FullscreenOverlay open scrim` → `div.kol-overlay.kol-overlay-scrim[role="dialog"][aria-modal="true"]` > `.kol-overlay-sheet` (node_modules/@kolkrabbi/kol-component/src/utilities/FullscreenOverlay.jsx:107-108), close `.kol-overlay-close` (:116), Escape closes (:63), backdrop mousedown closes (:103). Card `div.kol-media-picker.gap-4` (MediaPickerDialog.jsx:39; CSS 64rem × 85vh, column flex, node_modules/@kolkrabbi/kol-theme/kol-components-organisms.css:496-523, phone 100dvh :533-537). Body `MediaLibrary variant="browse" title="Media"` (:40-49; DS title default is `'MEDIA'`, node_modules/@kolkrabbi/kol-component/src/organisms/MediaLibraryPages.jsx:1025). Footer (:50-54): `span.kol-mono-12.text-fg-48` = `file.key` or `Select a file`; `Button tone="grey" size="md"` `Cancel`; `Button size="md"` `Use` disabled until `ok` (:32). `CHROME = 280` (:7) → `columnHeight: calc(var(--kol-media-picker-h) - 280px)` (:27). Selection arrives via `onPickFile` (MediaLibraryPages.jsx:1095, effect :1117 — fires `null` on deselect).

Walk: open a door → `[role="dialog"] .kol-media-picker` present → click a file row in the columns view (`[data-marquee-key]` rows, MediaLibraryPages.jsx:349,438) → footer shows the key, `Use` enabled when `contentType` kind ∈ accept (:8, :32) → click `Use` → `onSelect(client.mediaUrl(key, bucket), {contentType, kind})` then `onClose` (:33-36) → layer `src` is a proxied CDN URL (src/editor/library/mediaLibrary.js:99).

Risks: `file`/`bucket` state persists across close/open because callers keep the component mounted with `open=false` (:28-30) → on reopen the footer shows the previous key and `Use` is enabled with nothing selected in the fresh browse surface. `file.fullKey` (:34) is never produced by the DS (grep `fullKey` in MediaLibraryPages.jsx: 0 hits) — dead branch, keys are bucket-relative (:1093). `bucket` stays `undefined` until the user switches store (`onBucketChange` only in `switchBucket`, MediaLibraryPages.jsx:1113) → `mediaUrl(key, undefined)` resolves to kol-media-client's default, which must equal the surface's initial bucket (§ 12).

## 5. Save thumbnail (useComposeFile.captureThumb → LibraryProvider → FilesDialog.thumbnailFor)

| Step | Where |
|---|---|
| `THUMB_PX = 240` long side; `captureThumb`: `buildArgs()` (resolved layers at live `t`), `warmExportFonts`, offscreen canvas, `drawSvgToCanvas(buildLayersSvg(args))`, `toDataURL('image/webp', 0.8)`; any throw → `null` | src/editor/compose/useComposeFile.js:55, 97-108 |
| `buildSavedSpec(name)` = `buildSpec` + `{thumb}`; used by `onSave` (:117,122), `onSaveAs` (:132), FilesDialogHost `onSaveCurrent` (src/editor/library/FilesDialogHost.jsx:63), MorphTab save (MorphTab.jsx:151) | :110-113, :418 |
| `validatePreset` keeps `thumb` when a string | src/editor/library/LibraryProvider.jsx:130 |
| Storage key `kol.editor.library.v3`; quota errors swallowed | :31, :266-267 |
| `thumbnailFor(o)` → `<img src={thumb} alt="" className="size-full object-cover">` or `null` (glyph) | src/editor/library/FilesDialog.jsx:91, passed :139 |
| DS consumes `thumbnailFor` in the rows view `FileRow` (`thumb={thumbnailFor?.(o)}`) | MediaLibraryPages.jsx:420, 2194; pass-through :2056 |

Reach: `⌘S` on `/labs` or `/randomiser` (FilesDialogHost.jsx:32) or `⌘O` anywhere (:33-35) → `FilesDialog` (`title="Files"`, bucket `Library`, `searchPlaceholder="Search files"`, FilesDialog.jsx:44,128-129): input placeholder `Name` (:151), `Button grey sm` `Save current` (:153), `Import` (:145), `Open` (:157), footer `Select a file` (:156), hint `Cloud sync is not configured — files stay on this device.` when no API (:143). Expected: after `Save current`, reopen (`⌘O`), switch the view to rows → the new row shows an `<img>` thumbnail; older files keep the DS glyph (`.kol-media-thumb-fallback`, MediaLibraryPages.jsx:485,495).

Risks: a thumb per save goes into localStorage (:266) — quota failures are silent → saves vanish without a message; `toDataURL('image/webp')` falls back to PNG on browsers without webp encode (larger payloads, § 12); `buildLayersSvg` snapshots live `canvas[data-layer-id]` (src/editor/compose/build.js:158) so the thumb depends on the stage having painted; `refreshKey` (FilesDialog.jsx:92) omits `thumb`, relying on `updatedAt` changing — true for `updateItem` (LibraryProvider.jsx:398).

## 6. Library session token (src/editor/library/libraryApi.js)

| Fact | Where |
|---|---|
| `setLibraryApi(base)` trims, then `restoreSession()`; called at module load `setLibraryApi(import.meta.env.VITE_FXR_API)` | :14-17; src/App.jsx:16 |
| `SESSION_KEY 'kol.fxr.library-session'` holds `{base, token, expiresAt}` — never the password | :56, :88 |
| `restoreSession`: needs `token`, `base === apiBase`, `expiresAt > Date.now()` (ms assumed) | :65-72 |
| `signInLibrary(pw)`: `POST /api/session` with `Basic admin:pw` → `{token, expiresAt}` → `createD1Backend(base, token)` (`Bearer`) → hydrate → `mergeRemote` → `saveLibrary` → push local-only → store + emit → returns live row count | :73-91, :24-46 |
| `signOutLibrary`: clears storage first, then session | :92 |
| Provider: hydrate+merge whenever `session` appears; 401 on hydrate/push → `signOutLibrary()` | src/editor/library/LibraryProvider.jsx:318-344 |
| UI: rail row `aria-label="Sign in"` / `"Synced · sign out"`, icon `user` / `cloud`; prompt `Password for the library sync:`; alert `Signed in. N saved items in the cloud library; saves now sync.`; `Wrong password. Still local only.`; sign-out confirm `Sign out of the library sync? Saves stay on this device only.` | src/AppLayout.jsx:278-280, 185-204 |

Walk (needs `VITE_FXR_API`): click `[aria-label="Sign in"]` → KOL prompt → password → alert → row becomes `Synced · sign out`, `Media` row appears (:278) → reload → row still `Synced · sign out` without a prompt (restore) → `localStorage['kol.fxr.library-session']` has `token`. Click again → confirm → row back to `Sign in`, key removed.
Risks: `restoreSession` emits before any subscriber exists (module load) — harmless since `useSyncExternalStore` reads `getLibrarySession` on mount (:61); a token the server has revoked is only discovered on the first hydrate 401 (LibraryProvider.jsx:340); if the Worker's `expiresAt` is in seconds, `stored.expiresAt > Date.now()` (:69) is always false → never restores (§ 12).

## 7. keymap.isTyping + useLabsKeys

`isTyping(e)` (src/editor/state/keymap.js:229-237): contentEditable/TEXTAREA/SELECT → true; non-INPUT → false; INPUT whose `type ∉ NON_TEXT` (`range checkbox radio button submit reset color file`) → true; otherwise true only for `CONTROL_KEYS` `/^(Arrow|Home$|End$|Page| $|Enter$)/`. Callers: src/editor/state/useGlobalShortcuts.js:34, src/editor/compose/CanvasArea.jsx:1134, src/editor/labs/LabsView.jsx:113,457, src/editor/labs/LabsParams.jsx:459, src/editor/labs/useLabsKeys.js:12.
`useLabsKeys(onReset, onReroll)` (useLabsKeys.js:7-20): `R`/`Shift+R`, no modifiers, `preventDefault`; **effect has no deps** (:8-19) so it re-subscribes every render. Bound by LabsParams.jsx:175 (effect: `params: {}`), :389 (generator: `setOnly(presetLayerPatch(current))`), :423 (kinetic), and MobileOverlay.jsx:193-199.

Walk (labs): drag a slider (`input[type=range]` keeps focus) → press `R` → generator returns to preset (LabsParams.jsx:388) — before this change the key was swallowed. Press `Space` with the slider focused → `' '` ∈ CONTROL_KEYS → not a transport toggle (LabsView.jsx:457-461). Type in the loop field (`type="text"`) → every key is typing.
Risks: a focused `<button>` was never guarded (old regex nor new) → Space on a focused `Reset` button both toggles the transport (LabsView.jsx:458) and re-activates the button; `S` / `M` / `F` / `-` `+` `0` now also pass through a focused slider (LabsView.jsx:113-121, LabsParams.jsx:455-462). src/AppLayout.jsx:180 keeps a second, older guard (`typing`) for ⌥-digit nav (§ 11 C4).

## 8. Reset beside Randomize all

| Surface | Button | Action | Where |
|---|---|---|---|
| LoopFields (labs rail `inline`, editor Parameters tab) | `Button tone="primary" size={cs} iconOnly="rotate-left" aria-label="Reset to defaults"`, Tooltip `Reset to defaults (R)`, `shrink-0`; row = `Randomize all` (`flex-1 min-w-0`) · `aria-label="What Randomize all rolls"` · Reset | `onReset ?? resetScope(allScopeParams(schema, layer))` — labs passes `onReset={reset}` (LabsParams.jsx:405), the editor passes none (src/editor/compose/inspectors/ParametersPanel.jsx:129-131) | src/editor/compose/inspectors/LoopFields.jsx:268-278, 113-121 |
| EffectsPanel `StageRolls` (editor Effects tab; labs effect stacks) | same button, text beside it `Randomize all` (effect tab) / `Randomize motion` (anim tab) | `reset(allParams)` → every `p.default` | src/editor/compose/inspectors/EffectsPanel.jsx:331-338, 319-323 |
| MobileOverlay Generate tab | same button after `Randomize all` · `What Randomize all rolls` | `resetLayer` → `presetLayerPatch(preset)`; also `R` via `useLabsKeys` | src/editor/mobile/MobileOverlay.jsx:345-352, 189-199 |

Walk: labs → roll (`Randomize all`) → click `[aria-label="Reset to defaults"]` → sliders return to the preset's values (same as `R`). Editor → select a loop layer → `Parameters` → Reset → `resetScope` (preset pinned value else schema default, LoopFields.jsx:114-118). Randomiser → open sheet → Generate → Reset. Icon `rotate-left` exists (node_modules/@kolkrabbi/kol-icons/src/iconData.js, 1 hit), as do `repeat`, `drag-handle`, `rewind`, `stop`, `bolt`, `nav-settings`, `maximize`.
Risks: two buttons share `aria-label="Reset to defaults"` wherever LoopFields and StageRolls render together (a labs generator with an effect stack) — scripts must scope by container; tooltip advertises `(R)` in the editor where `R` is the Rectangle tool (keymap.js:63) (§ 11 C3); MobileOverlay's Reset is a no-op for a layer whose `presetId` is not in `presetsInGroup` (:190-191) with no feedback.

## 9. MobileOverlay other new bits (src/editor/mobile/MobileOverlay.jsx)
`Start over` is now a KOL `Button ghost quiet size="sm"` (:317). Hidden-UI tap-catcher `button[aria-label="Show controls"]` (:205). Collapsed pill row: `aria-label` `Randomize all` · `Download` · `Hide UI` · `Fill the screen`/`Back to the frame` (`aria-pressed`) (:250-257). Tabs text `Generate · Effects · Transport · Output` (+ `Morph` with ≥2 steps, :262). `LoopChips` `ariaLabel="Loop length"` cells `2s 4s 8s 16s` (:123-134). Aspect strips `ariaLabel="Aspect"` / `"Aspect (landscape) and fill"` (:430-431). Desktop randomiser is the same component with `rail` (src/editor/mobile/MobileView.jsx:287-295: `rail={!chromes && !narrow}`), rung `sm` (:179).

## 10. Selector inventory — rails and canvas (grep `data-testid|aria-label=|id=` under src/editor, plus DS internals a walk needs)

| Selector | Role | Where |
|---|---|---|
| `[data-testid]` | **none** | grep |
| `[data-editor-keep-selection]` | shell root (click-away marker) | src/editor/EditorShell.jsx:102 |
| `canvas[data-layer-id]`, `video[data-layer-id]`, `[data-kinetic-host][data-layer-id]` | live layer surfaces | src/editor/compose/build.js:158,166,443; src/editor/compose/KineticElementOverlay.jsx:64 |
| `[data-layer-id="canvas"]` | canvas row in layers list | src/editor/compose/CanvasArea.jsx:1104 |
| `.kol-editor-labs[data-touch][data-params="open"][data-empty]` | labs root state | src/editor/labs/LabsView.jsx:502 |
| `.kol-timeline-dock`, `.kol-timeline-grab[role=separator][aria-label="Resize the timeline"]` | dock, grab | TimelineDock.jsx:471,432-433 |
| `[aria-label="Sync loop"]`, `[data-diamond]`, `[data-name]`, `[aria-label^="Edit step "]`, `[aria-label="Show the morph’s tracks"]` / `"Hide the morph’s tracks"` (`aria-expanded`) | dock controls | :123, :222, :244-245, :205 |
| `[aria-label="Playback"]` `radio` `Play`/`Pause`; `[aria-label="Reset"]` group `Stop`/`Rewind`; `[aria-label="Loop length in seconds"]` | transport | TransportBar.jsx:80-95, :41 |
| `[aria-label="Open the transport"]`, `[aria-label="Close transport"]` | touch fab | src/editor/params/TransportFab.jsx:25,39 |
| `[aria-label^="Modulate "]` | bind dots | src/editor/params/BindDot.jsx:79 |
| `[aria-label="Reset to defaults"]`, `[aria-label="What Randomize all rolls"]` | LoopFields / StageRolls / MobileOverlay | LoopFields.jsx:273,277; EffectsPanel.jsx:337; MobileOverlay.jsx:350-351 |
| `[aria-label="Add another effect"]`, `Disable effect`/`Enable effect`, `Move up`, `Move down`, `Remove effect`, `Disable sweep`/`Enable sweep`, `Remove sweep` | effects chain | EffectsPanel.jsx:214, 375-381, 440, 449; labs: src/editor/labs/LabsParams.jsx:317 |
| `[aria-label="Reorder step N"]`, `[aria-label="Remove step N"]`, text `Add a step` | StepList | kol-component StepList.jsx:65,93,98-106 |
| `[role=dialog][aria-label="Search"]`, `[role=combobox]`, `[role=option]`, `[aria-label="Close search"]` | StepPicker | kol-component ShellSearchOverlay.jsx:203-205,230,272,197 |
| `.kol-overlay-scrim[role=dialog]`, `.kol-overlay-sheet`, `.kol-overlay-close`, `.kol-media-picker`, `.kol-files-dialog` | overlays | kol-component FullscreenOverlay.jsx:107-116; MediaPickerDialog.jsx:39; FilesDialog.jsx:124 |
| `[data-marquee-key]`, `[data-hit]`, `[data-hit-zone]`, `.kol-column-browser-row.is-selected` | browse rows | MediaLibraryPages.jsx:349,360,438,441 |
| `[aria-label="Store"]` | bucket dropdown | MediaLibraryPages.jsx:915 |
| `[aria-label="Show controls"]`, `Randomize all`, `Download`, `Hide UI`, `Fill the screen`/`Back to the frame`, `[aria-label="Randomize scope"]`, `[aria-label="Loop length"]`, `[aria-label="Aspect"]` | randomiser sheet | MobileOverlay.jsx:205,251-256,115,132,430 |
| `[aria-label="Raise the sheet"]`/`"Lower the sheet"` | sheet grab | src/editor/components/PanelHeader.jsx:102 |
| `[aria-label="Frame name"]`, `[aria-label="Display settings"]` | topbar | src/editor/shell/MenuTop.jsx:220,467 |
| `[aria-label="Delete selected"]`, `[aria-label="More actions"]` | selection header | src/editor/shell/panels/SelectionPalettePanel.jsx:90,132 |
| `[aria-label="Clear image"]`, `[aria-label="Image preview"]`, `[aria-label="Video preview"]` | inspector photo | LayerInspector.jsx:354,366,388 |
| `[aria-label="Source"]` cells `Library`/`Upload`/`Camera` | labs source strip | LabsSourcePicker.jsx:116,124-128 |
| `[aria-label="Type settings"]`, `[aria-label="Size presets"]` | text panel | src/editor/compose/inspectors/TextPanel.jsx:140,280 |
| `[aria-label="Palette"]` | palette modal | src/editor/color/PaletteModal.jsx:134 |
| `[aria-label="Expression plot over one loop"]` | modulation | src/editor/params/ModulationEditor.jsx:139 |
| `[aria-label="Effects"]` + per-scope `aria-label={s.label}` switches | roll scopes dialog | src/editor/params/RollScopesDialog.jsx:28,32 |
| `[aria-label="Re-randomize rule"]`, `[aria-label="Remove rule"]` | pattern rules | src/editor/modes/pattern/RuleRow.jsx:129,139 |
| `Move form up/down`, `Duplicate form`, `Delete form`; `Duplicate element`, `Remove element`, `Move element up/down`, `Add motion layer`, `Remove motion layer` | softforms / kinetic | SoftformsLayers.jsx:217-236; KineticPanel.jsx:416-510 |
| NavRail `[aria-label="Editor"|"Labs"|"Morph"|"Randomiser"|"Library"|"Media"|"Sign in"|"Synced · sign out"|"Settings"]`, `[aria-current="page"]` | shell rail | AppLayout.jsx:87-93,277-281; kol-shell NavRail.jsx:211,217 |

## 11. Contradictions

| # | One side | Other side |
|---|---|---|
| C1 | Picker-A chrome `CHROME = 280` — MediaPickerDialog.jsx:7 | `CHROME = 300` for the same card shape — FilesDialog.jsx:46 |
| C2 | Picker footer buttons `size="md"` — MediaPickerDialog.jsx:52-53 | Files footer buttons `size="sm"` — FilesDialog.jsx:145,153,157 |
| C3 | Reset tooltip `Reset to defaults (R)` rendered in the editor's Parameters/Effects tabs — LoopFields.jsx:277 (via ParametersPanel.jsx:131), EffectsPanel.jsx:337 | `R` = Rectangle tool in the editor — keymap.js:63; `labs-reset` is `views: ['labs','randomiser']` — keymap.js:117 |
| C4 | `isTyping` lets `range/checkbox/…` through — keymap.js:229-237 | `typing` blocks any INPUT for ⌥-digit nav — src/AppLayout.jsx:180 |
| C5 | keymap comment: `useLabsKeys` "in labs/LabsParams.jsx" — keymap.js:14,114-116 | it lives in src/editor/labs/useLabsKeys.js:7 and is also bound by MobileOverlay.jsx:193 |
| C6 | `hasOutline` — shape.js:266 | identical predicate `canCrossfade` — shape.js:324; MorphTab ORs both — MorphTab.jsx:66 |
| C7 | Renderer honours `morph.mode` `shape` **and** `crossfade` — LayerRenderer.jsx:33-35 | export/thumb `defFor` honours `shape` only — build.js:44 |
| C8 | Photo upload = `saveClip` + objectURL ("audit F1") — EditorFooter.jsx:103-104 | same layer kind still written as a data: URL — LayerInspector.jsx:328-331 |
| C9 | Dock icon buttons `size="xs"` — TimelineDock.jsx:123,205 | dock text buttons `size="sm"` in the same dock — TimelineDock.jsx:403,411 |
| C10 | Labs effect `R` resets stage 0 to `params: {}` — LabsParams.jsx:176 | StageRolls Reset writes every `p.default` — EffectsPanel.jsx:319-323; both labelled `Reset to defaults` |
| C11 | `file.fullKey ?? file.key` — MediaPickerDialog.jsx:34 | DS never sets `fullKey` (0 hits in MediaLibraryPages.jsx); keys are bucket-relative — :1093 |
| C12 | Browse `title` sentence case `Media` / `Files` — MediaPickerDialog.jsx:43, FilesDialog.jsx:128 | DS default title `'MEDIA'` upper case — MediaLibraryPages.jsx:1025 |
| C13 | MorphTab `rebuild` carries `name: morph.fileName` — MorphTab.jsx:97 | dock reads `l.morph.name || 'Morph'` — TimelineDock.jsx:63 — the saved name reaches the lane only after a later rebuild |
| C14 | Reset tooltip `(R)` on the touch sheet — MobileOverlay.jsx:351 | the sheet is the `lg` touch rung with no keyboard — MobileOverlay.jsx:179 |

## 12. Open questions
1. Does the DS **columns** / grid view consume `thumbnailFor` (only `FileRow` at MediaLibraryPages.jsx:420,2194 and a pass-through at :2056 were seen)? If not, thumbs show in rows view only.
2. Units of the Worker's `expiresAt` (ms assumed at libraryApi.js:69). Not derivable from this repo.
3. What `useBucketLibrary` picks as the initial bucket vs `client.mediaUrl(key, undefined)` (MediaPickerDialog.jsx:34; `DEFAULT_BUCKET 'r2'` src/editor/library/mediaLibrary.js:58).
4. Safari: `dblclick` after `preventDefault()` on `pointerdown` (TimelineDock.jsx:434,439); `setPointerCapture` on SVG `<circle>`/`<rect>` (:296,:336,:362); `toDataURL('image/webp')` (useComposeFile.js:106).
5. Does `@kolkrabbi/kol-theme/kol-sources.css` (src/index.css:25) glob `molecules/StepList.jsx` so its Tailwind utilities (`bg-fg-08`, `border-dashed`, `opacity-40`) generate? No `.kol-step-list` CSS exists in kol-theme.
6. Where `src/packs/motion.js` is imported for the `/editor` build (TimelineDock in the editor depends on `pack('motion')`, Compose.jsx:33); labs imports the dock directly (LabsView.jsx:16).
7. On `/morph?new=morph` entered by SPA hop from `/labs` with a draft layer: does MorphTab's mount effect (MorphTab.jsx:89-91) run before UrlIntents' `clearLayers` (UrlIntents.jsx:46-48)? Cold loads are safe (morph.active is set after children's effects, LabsView.jsx:536).
8. `Tooltip asChild` clones the child with a `ref` (kol-component Popover.jsx:73); `Button` is a plain function spreading `...props` (Button.jsx:205) — works under React 19 ref-as-prop; the sync-loop button and fold button depend on it.
9. Whether `MediaLibraryBrowse` resets its own `pickedFile` to `null` through `onPickFile` on unmount — if not, the stale `file` in MediaPickerDialog (:29) survives a reopen.
