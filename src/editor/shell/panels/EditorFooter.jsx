import { useEffect, useRef, useState } from 'react'
import { Button, Dropdown, LabeledControlSection, SegmentedToggle, FullscreenOverlay, TabsRow, Tooltip, glyphSize } from '@kolkrabbi/kol-component'
import { proxied, isVideoType } from '../../library/mediaLibrary'
import { useTransport } from '../../params/transport'
import { pack } from '../../packs'
import AudioInputRow from '../../params/AudioInputRow'
import { useComposeFile } from '../../compose/useComposeFile'
import { openFiles } from '../../library/filesDialogStore'
import { useComposeState } from '../../compose/state'
import { useLayerEdit } from '../../compose/useLayerEdit'
import { findLayerDeep } from '../../compose/helpers'
import { saveClip } from '../../lib/clipStore'
import { ensureWebcam } from '../../lib/webcam'
import { ASPECTS } from '../aspects'
import BatchExportModal from './BatchExportModal'
import { useControlSize, stripClamp } from '../../params/controlSize'
import { Icon } from '@kolkrabbi/kol-icons'
import MediaPickerDialog from '../../library/MediaPickerDialog'

/**
 * EditorFooter — the tabbed rail footer, ported from the labs standard
 * (kol-labs-single `RailFooterTabs` + `EditorFooter`). Pinned below the
 * left rail's scroll body via the `left.footer` panel slot.
 *
 *   Transport · Output · File
 *     Transport — the playback TransportBar (stays mounted hidden so
 *                 playback chrome never re-inits on tab switch, per labs)
 *     Output    — Aspect preset + @Nx export scale + PNG / webm-loop export
 *     File      — context-sensitive: settings save/load + library save by
 *                 default; image upload/clear when a photo layer is selected
 */
const TABS = [
  { value: 'transport', label: 'Transport' },
  { value: 'output', label: 'Output' },
  { value: 'file', label: 'File' },
]
/* THE TOUCH FOOTER FOLDS THE TRANSPORT INTO ONE GLYPH (user, 2026-09-01 —
 * "transport folding into an icon or button, shown as overlay, such that the
 * sidenav can be more narrow on mobile"): the same ▶ the collapsed dock below
 * already shows, sitting left of an Output · File strip; a tap opens the full
 * bar (▶ ❚❚ · Loop / N s · ■ ◀◀) as a sheet along the bottom of the viewport,
 * where it has the whole width. That takes the transport row out of the
 * drawer's width budget, so the drawer is the desktop rail's 264 again. */
const TABS_TOUCH = TABS.filter((t) => t.value !== 'transport')

/* Tailwind v4 doesn't scan node_modules, so an ARBITRARY value used only inside
 * a package (`h-[26px]`) never gets generated and the toggle collapses. Naming
 * it here puts it in app source → emitted → the component's own identical class
 * resolves.
 *
 * The border used to be named here too and never needed to be: `.border-fg-*`
 * and `.border-oq-*` are STATIC rules in kol-theme (`kol-opacity.css` /
 * `kol-opaque.css`, imported into the components layer), not Tailwind
 * utilities — nothing generates them, so nothing can fail to. The old comment
 * asserted otherwise and would have taught the next reader to name every ladder
 * class they used. Only arbitrary bracket values belong in this string. */
const TOGGLE_FIX = 'h-[26px]'

/* Collapsed, the rail is the LEFT rail's bottom anatomy and nothing else:
 * a full-bleed rule, then ONE glyph in a `w-8` centring box — the same shape
 * `NavRail` uses for its pinned rows (`self-stretch -mx-2 border-t border-oq-08`
 * then a 20px icon in a 32px box, inside `px-2`). The tabbed dock cannot fold
 * into 48px by clipping, because its first control is a 77px two-cell group,
 * so collapsed it is replaced rather than squeezed. */
function useRailCollapsed() {
  const read = () => document.documentElement.getAttribute('data-rail') === 'collapsed'
  const [collapsed, setCollapsed] = useState(read)
  useEffect(() => {
    /* RE-READ ON ATTACH. `useDragResize` stamps `data-rail` from its persisted
     * state during mount — between this hook's lazy initial read and the
     * observer attaching below. The attribute therefore never *changes* after
     * we start watching, so a page that loads already-collapsed stayed stuck on
     * the expanded dock while a manual toggle folded it correctly. */
    setCollapsed(read())
    const mo = new MutationObserver(() => setCollapsed(read()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-rail'] })
    return () => mo.disconnect()
  }, [])
  return collapsed
}

/* File tab, photo-with-source mode — replace / clear the selected photo
 * layer's src (the ImageFields reader idiom; discrete history → undo-safe).
 * Sources: local image upload (data URL), local video upload (object URL),
 * or the kol-media CDN library via MediaPicker (proxied same-origin URL so
 * canvas filters don't taint). Every write sets srcType so image ↔ video
 * swaps render correctly. */
function PhotoFileTab({ layer }) {
  const cs = useControlSize()
  const { patch } = useLayerEdit(layer.id)
  const fileRef = useRef(null)
  const videoRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* allow re-picking the same file */
    if (!file) return
    /* The same side-channel as video since 2026-10-09 (audit F1): the blob keyed by the layer id in
     * the clip store, an objectURL on the layer. The data: URL this used to write put the whole
     * image into the localStorage draft — a 5 MB photo blew the quota. */
    saveClip(layer.id, file)
    patch({ src: URL.createObjectURL(file), srcType: 'image' })
  }
  const onPickVideo = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* allow re-picking the same file */
    if (!file) return
    /* Persist the blob keyed by this layer's id so the objectURL (dead after
     * reload) can be re-minted on draft hydrate (clipStore side-channel). */
    saveClip(layer.id, file)
    patch({ src: URL.createObjectURL(file), srcType: 'video' })
  }
  const onLibraryPick = (url, { contentType } = {}) => {
    patch({ src: proxied(url), srcType: isVideoType(contentType) ? 'video' : 'image' })
  }
  /* Live camera source. Request the stream on this user gesture (better
   * permission UX + primes webcam.js's registry so LayerRenderer's mount
   * attaches without a second prompt) BEFORE switching the layer to webcam —
   * a denial leaves the current source untouched. No src to store: the stream
   * lives in the webcam registry keyed by layer id, the layer just flags
   * srcType. */
  const onWebcam = () => {
    ensureWebcam(layer.id)
      .then(() => patch({ src: null, srcType: 'webcam' }))
      .catch(() => { /* camera denied / unavailable — keep the current source */ })
  }
  const onClear = () => {
    patch({ src: null, srcType: 'image' })
    if (fileRef.current) fileRef.current.value = ''
  }
  return (
    <div className="flex flex-col gap-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onPickVideo} />
      <Button tone="primary" size={cs} className="w-full" iconLeft="upload" iconSize={12} onClick={() => fileRef.current?.click()}>
        Upload image
      </Button>
      <Button tone="primary" size={cs} className="w-full" iconLeft="upload" iconSize={12} onClick={() => videoRef.current?.click()}>
        Upload video
      </Button>
      <Button tone="primary" size={cs} className="w-full" iconLeft="nav-library" iconSize={12} onClick={() => setPickerOpen(true)}>
        From library
      </Button>
      <Button tone="primary" size={cs} className="w-full" iconLeft="camera" iconSize={12} onClick={onWebcam}>
        Webcam
      </Button>
      {(layer.src || layer.srcType === 'webcam') && (
        <Button tone="primary" size={cs} className="w-full" iconLeft="trash" iconSize={12} onClick={onClear}>
          Clear image
        </Button>
      )}
      {/* the DS modal library (2026-10-07) — the editor's own picker is retired; a media layer takes image or video */}
      <MediaPickerDialog open={pickerOpen} accept={['image', 'video']} onClose={() => setPickerOpen(false)} onSelect={onLibraryPick} />
    </div>
  )
}

/* File tab, default mode — document .json save/load (file lane) above the
 * library Save/Save as (library lane); a divider keeps the lanes distinct. */
function SettingsFileTab({ onSaveSettings, onLoadSettings, onSave, currentPresetId }) {
  const cs = useControlSize()
  const fileRef = useRef(null)
  const [err, setErr] = useState('')
  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* allow re-loading the same file */
    if (!file) return
    onLoadSettings(file)
      .then(() => setErr(''))
      .catch((ex) => setErr(ex.message || 'Load failed'))
  }
  return (
    <div className="flex flex-col gap-2">
      <Button tone="primary" size={cs} className="w-full" iconLeft="download" iconSize={12} onClick={onSaveSettings}>
        Save to file
      </Button>
      <Button tone="primary" size={cs} className="w-full" iconLeft="upload" iconSize={12} onClick={() => fileRef.current?.click()}>
        Load from file
      </Button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onPick} />
      {err && <span className="kol-mono-10 text-ui-error">{err}</span>}
      {/* Save… · Save as… · Files… left this tab 2026-10-09 (audit C2): they are the File MENU's
          verbs, and two homes for one verb set drift. The tab keeps what the menu does not have —
          the on-disk import/export above and the audio source below. */}
    </div>
  )
}

export default function EditorFooter() {
  const cs = useControlSize()
  /* every rung above the desktop's 'sm' is the touch rail */
  const touch = cs !== 'sm'
  /* THE TRANSPORT IS THE MOTION PACK'S (editor review #1, 2026-09-27 — user: "transport obviously is
   * motion … why would they be in core?"). The clock stays in the engine; its controls — the
   * Transport tab, the touch ▶ sheet, the collapsed dock's ▶ — only exist when the motion pack is
   * loaded. `/core` has no motion and shows no time controls. */
  const TransportBar = pack('motion')?.TransportBar ?? null
  const tabs = (touch || !TransportBar) ? TABS_TOUCH : TABS
  /* ON TOUCH THE FOOTER IS ONE ROW UNTIL A TAB IS OPENED (2026-10-05): the rail is a sheet half
   * the display high there, and Output's eight controls standing open took all of it. No tab is
   * lit at rest; a tap opens one and the same tap closes it. */
  const [tab, setTab] = useState(touch ? null : (TransportBar ? 'transport' : 'output'))
  const [pngScale, setPngScale] = useState(1)
  const [batchOpen, setBatchOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [webmProgress, setWebmProgress] = useState(null) /* { done, total } while baking, else null */
  const {
    onSave, onExportPng, onExportWebm,
    runBatchExport, onRecordStart, onRecordStop,
    onSaveSettings, onLoadSettings, openOutputWindow, currentPresetId,
  } = useComposeFile()
  const { aspect, setAspect, canvasW, canvasH, selectedId, layers } = useComposeState()
  const collapsed = useRailCollapsed()
  const { playing, play, pause } = useTransport()

  /* Stop any in-flight live capture if the footer unmounts (route change /
   * rail teardown) — onRecordStop reads the hook-stable recorder ref, so the
   * closure is never stale. */
  useEffect(() => () => { onRecordStop() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRecord = async () => {
    if (recording) { await onRecordStop(); setRecording(false); return }
    const ok = await onRecordStart(pngScale)
    if (ok) setRecording(true)
  }

  /* Offline loop bake — dim-scrim + determinate bar while it runs (the bake
   * blocks the main thread per frame, so the scrim also gates re-entry). */
  const exportWebm = async () => {
    if (webmProgress) return
    setWebmProgress({ done: 0, total: 1 })
    try {
      await onExportWebm(pngScale, (done, total) => setWebmProgress({ done, total }))
    } finally {
      setWebmProgress(null)
    }
  }

  /* 'custom' isn't pickable (it arises from typing W/H) — but stays listed
   * while active so the dropdown reflects the frame's actual state. */
  const aspectOptions = ASPECTS
    .filter((a) => a.id !== 'custom' || aspect === 'custom')
    .map((a) => ({ value: a.id, label: a.label }))

  /* Figma-style @Nx resolution multiplier (labs SCALE_OPTIONS shape). */
  const scaleOptions = [1, 2, 3].map((k) => ({ value: k, label: `@${k}x · ${canvasW * k}` }))

  const selectedLayer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const photoLayer = selectedLayer?.type === 'photo' ? selectedLayer : null

  /* THE COLLAPSED DOCK — the left rail's pinned row, mirrored. The rule runs
     the full rail width out past the padding (`-mx-2`, as NavRail's does), and
     one glyph sits in a 32px box so it lands on the same x as the left rail's. */
  if (collapsed) {
    return (
      <div className="flex flex-col px-2 pb-4">
        <div className="self-stretch -mx-2 border-t border-oq-08 mb-2" />
        {TransportBar && (
          <Tooltip label={playing ? 'Pause' : 'Play'} shortcut="Space">
            <Button tone="ghost" size="md" iconOnly={playing ? 'pause' : 'play'} aria-label={playing ? 'Pause' : 'Play'}
              onClick={playing ? pause : play} className="self-center" />
          </Tooltip>
        )}
      </div>
    )
  }

  return (
    <div className="relative border-t border-oq-08 flex flex-col gap-3" style={{ padding: '16px 16px 20px' }}>
      <div className="flex items-center gap-2">
        {/* the 26px pin is 'sm' geometry — above it the strip is on the ladder */}
        {/* the default strip — raised cells, dividers, the selected one on the ground — filling
          * the row, as fxr drew it (inspector rebuild 2026-09-27: `filled` read as bare tabs).
          * ON TOUCH THE TRANSPORT IS ITS FIRST CELL (2026-10-06; the user: "transport new layout
          * uneven"): a filled ▶ square stood beside the strip as a second shape; now one strip,
          * the ▶ cell lit while the transport sheet is up. */}
        {/* ON TOUCH THE TRANSPORT LEFT THE STRIP (plan 15 § 2): it is the floating play button over the
          * canvas (`TransportFab`, the motion pack's `canvas.overlay`), so the row is Output · File. */}
        {/* A PANE'S TABS ARE THE UNDERLINE ROW on the desk (spec R3.1): Layers · Assets and
          * Inspector · Parameters · Effects are TabsRows, so this pane's Transport · Output · File
          * is one too. Touch keeps the strip — a second tap on a cell closes its sheet. */}
        {touch ? (
          <SegmentedToggle
            value={tab}
            onChange={(v) => setTab((t) => (t === v ? null : v))}
            options={tabs}
            size={cs}
            className={`flex-1 min-w-0 ${stripClamp(cs) ?? ''}`.trim()}
          />
        ) : (
          <div className="flex-1 min-w-0">
            <TabsRow tabs={tabs.map((t) => ({ id: t.value, label: t.label }))} value={tab} onChange={setTab} />
          </div>
        )}
      </div>
      {/* stays mounted hidden on desktop so playback chrome never re-inits on a
          tab switch; on touch the bar lives in the sheet below */}
      {TransportBar && !touch && (
        <div className={tab === 'transport' ? undefined : 'hidden'}>
          <TransportBar size={cs} />
        </div>
      )}
      {tab === 'output' && (
        <div className="flex flex-col gap-3">
          {/* LabeledControlSection, not Section — the rail's one section
              organism (eyebrow + 8px rows); Section's label was the
              sentence-case helper the estate stopped writing */}
          <LabeledControlSection label="Aspect">
            <Dropdown size={cs} variant="subtle" className="w-full" options={aspectOptions} value={aspect} onChange={setAspect} />
          </LabeledControlSection>
          <LabeledControlSection label="Export">
            <div className="flex items-center gap-3">
              {/* 'w-full' in className opts out of Dropdown's fixed inline width
                  so flex-1 can actually size the control. */}
              <Dropdown size={cs} variant="subtle" className="flex-1 w-full" options={scaleOptions} value={pngScale} onChange={setPngScale} />
              <span className="kol-helper-10 text-meta whitespace-nowrap">{canvasW * pngScale} × {canvasH * pngScale} px</span>
            </div>
            <Button tone="primary" size={cs} className="w-full" iconLeft="download" iconSize={12} onClick={() => onExportPng(pngScale)}>
              Export PNG
            </Button>
            <Button tone="primary" size={cs} className="w-full" iconLeft="download" iconSize={12} onClick={exportWebm}>
              Export loop (webm)
            </Button>
            {/* Live capture — records the composed frame in real time (transport
                running, params being tweaked), complementing the deterministic
                loop bake above. */}
            <Button tone={recording ? 'inverted' : 'primary'} size={cs} className="w-full" iconLeft={recording ? 'eye-on' : 'download'} iconSize={12} onClick={toggleRecord}>
              {recording ? 'Stop recording' : 'Record'}
            </Button>
            {/* Chromeless output in its own tab — a clean surface to screen-
                record with OS / tab capture (bypasses the in-app Record path). */}
            <Button tone="primary" size={cs} className="w-full" iconLeft="maximize" iconSize={12} onClick={openOutputWindow}>
              Open output window
            </Button>
            {/* Multi-size matrix — tick aspects × scales, bundle every PNG into
                one .zip. */}
            <Button tone="primary" size={cs} className="w-full" iconLeft="layers" iconSize={12} onClick={() => setBatchOpen(true)}>
              Batch export
            </Button>
          </LabeledControlSection>
        </div>
      )}
      {tab === 'file' && (
        <>
          {photoLayer
            ? <PhotoFileTab layer={photoLayer} />
            : (
              <SettingsFileTab
                onSaveSettings={onSaveSettings}
                onLoadSettings={onLoadSettings}
                onSave={onSave}
                currentPresetId={currentPresetId}
              />
            )}
          {/* Audio analyser input for the audio-band modulation sources —
              File tab per labs (source: Off / Mic / File). */}
          <AudioInputRow />
        </>
      )}
      {webmProgress && (
        /* DS overlay, closeButton off — a bake is not dismissible (ruled
           2026-08-27; it was a hand-rolled scrim at z-[1000] that dismissed
           on nothing, which at least was honest about being modal). */
        <FullscreenOverlay open closeButton={false}>
          <div className="bg-surface-primary border border-oq-08 rounded shadow-xl flex flex-col gap-3" style={{ width: 320, padding: 20 }}>
            <div className="flex items-center justify-between">
              <span className="kol-helper-12 text-emphasis">Baking loop…</span>
              <span className="kol-helper-10 text-meta">{webmProgress.done} / {webmProgress.total}</span>
            </div>
            <div className="rounded overflow-hidden" style={{ height: 6, background: 'var(--kol-oq-08)' }}>
              <div style={{ height: '100%', width: `${Math.round((webmProgress.done / Math.max(1, webmProgress.total)) * 100)}%`, background: 'var(--kol-accent-primary)', transition: 'width 80ms linear' }} />
            </div>
          </div>
        </FullscreenOverlay>
      )}
      <BatchExportModal
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        runBatchExport={runBatchExport}
        baseAspect={aspect}
        defaultScale={pngScale}
      />
    </div>
  )
}
