import { useEffect, useRef, useState } from 'react'
import Pane from '../../components/Pane'
import { proxied, isVideoType } from '../../library/mediaLibrary'
import { Button, ColorSwatch, Dropdown, MenuDropdownItem, Tooltip, glyphSize } from '@kolkrabbi/kol-component'
import { LabeledControl, SettingsRow } from '@kolkrabbi/kol-component'
import { useControlSize, RAIL_LABEL_W } from '../../params/controlSize'
import { PopoverPanel, usePopover } from '@kolkrabbi/kol-component'
import AlignmentPanel from '../AlignmentPanel'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import StrokePanel from '../../color/StrokePanel'
import { Icon } from '@kolkrabbi/kol-icons'
import { useComposeState, COVER_TYPES, resolveColor } from '../state'
import { scalePathNodes } from '../path-math'
import { useLayerEdit } from '../useLayerEdit'
import { ColorField } from './ColorField'
import BindDot from '../../params/BindDot'
import { BLEND_MODES } from '../LayerStack'
import { firstFilterDef } from '../filterChain'
import { pack } from '../../packs'
import { NumberField } from './NumberField'
import { TextSurface } from './TextPanel'
import MediaPickerDialog from '../../library/MediaPickerDialog'

/**
 * LayerInspector — HIGH-LEVEL surface for the selected layer (Phase 6-A):
 * position / transform / opacity / blend / paint / content source. Anything
 * schema-driven or type-deep (shape kinds, pattern surface, photo filters,
 * loop controls) lives in the Parameters tab (ParametersPanel); the pointer
 * rows below flip to it via `kol:open-params` (SelectionPalettePanel
 * listens). Text is the exception (the 2026-08-12 inspector ruling): its
 * full surface (TextSurface) renders here — the Inspector owns the selected
 * object's major interaction.
 */
export default function LayerInspector({ layer }) {
  const cs = useControlSize()
  const { ungroupLayer, flipLayer, palette } = useComposeState()
  const gen = pack('generators')
  /* Color writes route through useColorTarget so the inspector, the picker,
   * the keymap, and the swatch stack all share one writer. Photoshop model:
   * writes always succeed, app-level paint state is the canonical source. */

  /* `coalesce` collapses slider drags + typed-input flurries into one undo
   * entry per quiet period. */
  /* ONE LOCK RULE (the walk: a locked layer still took Inspector writes): a locked layer's fields
   * are read-only — the editor points at no layer, so every write is a no-op. */
  const edit = useLayerEdit(layer.locked ? null : layer.id, { history: 'coalesce' })
  const setProp = edit.setProp

  const positioned = !COVER_TYPES.includes(layer.type)
  /* the transform origin the typed W / H / rotation work about (G4) — panel state, as Affinity's */
  const [anchor, setAnchorState] = useState(anchorStore.value)
  const setAnchor = (a) => { anchorStore.value = a; setAnchorState(a) }

  /* PANES (inspector rebuild 2026-09-27, Affinity as the guide — user: "too many section
   * headers … why are we not sectioning off the panes?"): Transform · Appearance · Typography ·
   * the type's own pane · Parameters. Named panes, full-width rules, no sub-labels — the
   * controls' glyphs and tooltips name them. Position + Layout were two sections with five
   * sub-labels; they are Affinity's one Transform panel. */
  return (
    <div className="flex flex-col">
      {positioned && (
        <Pane label="Transform">
          <AlignmentPanel />
          <div className="flex items-center gap-2">
            <AnchorPicker value={anchor} onChange={setAnchor} />
            <div className="flex-1 min-w-0"><PositionFields layer={layer} setProp={setProp} /></div>
          </div>
          <LayoutFields layer={layer} setProp={setProp} patch={edit.patch} anchor={anchor} />
          {/* SHEAR (G3 — Affinity's S field): degrees along each axis, about the layer's centre */}
          <div className="grid grid-cols-2 gap-2">
            <AxisField label="SX" suffix="°" tooltip="Skew horizontal" value={Math.round(layer.skewX ?? 0)}
              onCommit={(raw) => setProp('skewX', clampSkew(raw))} />
            <AxisField label="SY" suffix="°" tooltip="Skew vertical" value={Math.round(layer.skewY ?? 0)}
              onCommit={(raw) => setProp('skewY', clampSkew(raw))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <AxisField
                label={<Icon name="angle" size={glyphSize(cs)} />} suffix="°" tooltip="Rotation"
                value={typeof layer.rotation === 'number' ? Math.round(layer.rotation) : 0}
                onCommit={(raw) => {
                  const n = Number(raw)
                  const next = Number.isFinite(n) ? ((Math.round(n) % 360) + 360) % 360 : 0
                  edit.patch({ rotation: next, ...rotateAboutAnchor(layer, next, anchor) })
                }}
              />
              <BindDot
                layer={layer}
                param={{ key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, default: 0 }}
                setProp={setProp}
              />
            </div>
            {/* The transform cluster — STATELESS (the 2026-08-12 state law: no selected ring on
              * action strips). Flipped axes tint their glyph accent. */}
            {/* the cells SHARE the half-rail: a photo layer adds Crop, and four `sm` cells at their own
              * padding are 163px in a 140px track — Crop sat half outside the rail (found in
              * apps/panels, 2026-10-03). Three cells already filled the track, so they do not move. */}
            <SegmentedToggle
              tone="sunken" size={cs} value={null}
              ariaLabel="Transform"
              className="[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1"
              options={[
                { value: 'rot', ariaLabel: 'Rotate 90° left', label: <Icon name="rotate-left" size={glyphSize(cs, true)} /> },
                { value: 'fh', ariaLabel: 'Flip horizontal', label: <span style={{ color: layer.flipX ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><Icon name="flip-horizontal" size={glyphSize(cs, true)} /></span> },
                { value: 'fv', ariaLabel: 'Flip vertical', label: <span style={{ color: layer.flipY ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><Icon name="flip-vertical" size={glyphSize(cs, true)} /></span> },
              ]}
              onChange={(op) => {
                if (op === 'rot') setProp('rotation', (((Math.round(layer.rotation ?? 0) - 90) % 360) + 360) % 360)
                else if (op === 'fh') flipLayer(layer.id, 'h')
                else if (op === 'fv') flipLayer(layer.id, 'v')
                else if (op === 'crop') window.dispatchEvent(new CustomEvent('kol:enter-crop', { detail: layer.id }))
              }}
            />
          </div>
          {layer.type === 'text' && (
            /* Real behavior, not chrome: fixed keeps the box; auto modes measure the rendered text
             * (TextLayer effect) and write it. Selected = the dark tile. */
            <SegmentedToggle
              tone="sunken" size={cs}
              ariaLabel="Resizing"
              value={layer.resizing ?? 'fixed'}
              onChange={(v) => setProp('resizing', v)}
              options={[
                { value: 'fixed',  ariaLabel: 'Fixed size',  label: <Icon name="resize-fixed" size={glyphSize(cs, true)} /> },
                { value: 'auto-w', ariaLabel: 'Auto width',  label: <Icon name="resize-auto-w" size={glyphSize(cs, true)} /> },
                { value: 'auto-h', ariaLabel: 'Auto height', label: <Icon name="resize-auto-h" size={glyphSize(cs, true)} /> },
              ]}
            />
          )}
        </Pane>
      )}

      <AppearanceSection layer={layer} setProp={setProp} edit={edit} first={!positioned} />

      {(layer.type === 'loop' || layer.type === 'misc') && gen && (
        <Pane label="Preset">
          {/* Loop pickers + backdrop — bg toggle hidden for loops whose bg
            * feeds their color math. The generators pack's (editor/packs.js). */}
          <gen.LoopPicker layer={layer} tree={layer.type === 'misc' ? gen.MISC_TREE : undefined} />
          {gen.loopBgToggleable(gen.loopById(layer.loopId)) && (
            <SettingsRow label="Background" align="fill" labelWidth={RAIL_LABEL_W}>
              <SegmentedToggle
                tone="sunken" size={cs} className="w-full"
                options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                value={layer.bgOn === false ? 'off' : 'on'}
                onChange={(v) => setProp('bgOn', v === 'on')}
              />
            </SettingsRow>
          )}
        </Pane>
      )}

      {/* Text's whole surface = the Typography pane, which TextSurface renders itself so its
        * type-settings trigger can ride the pane header (the 2026-08-12 inspector ruling; the
        * Text tab retired). */}
      {layer.type === 'text' && <TextSurface key={layer.id} layer={layer} />}

      {layer.type === 'photo' && (
        <Pane label="Image">
          {/* Content source — what the layer IS; fit + filters live in
            * Parameters. */}
          <ImageSource layer={layer} patch={edit.patch} />
        </Pane>
      )}

      {/* No Fill / Stroke sections (editor review #12, 2026-09-27 — user: "colour is changed in the
        * colour window"): the left rail's Colour and Stroke panels edit the selected layer's paint.
        * The removed sections are in _tmp/2026-09-27-editor-copies/. */}

      {layer.type === 'path' && (
        <Pane label="Path">
          {/* Open ↔ closed — renderer + export honor `closed` via pathD;
            * in node-edit, clicking the first anchor also closes. */}
          <SegmentedToggle
            tone="sunken" size={cs} className="w-full"
            options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
            value={layer.closed ? 'closed' : 'open'}
            onChange={(v) => setProp('closed', v === 'closed')}
          />
        </Pane>
      )}

      <ParamsLink layer={layer} />

      {layer.type === 'group' && (
        <Pane label="Group">
          <GroupFields layer={layer} ungroupLayer={ungroupLayer} />
        </Pane>
      )}
    </div>
  )
}

/* Small right-aligned header-row icon button (Section `actions`). */
function SectionIconBtn({ label, icon, onClick, active = false, refProps = {} }) {
  const cs = useControlSize()
  return (
    <Tooltip asChild label={label}>
      <Button tone="ghost" quiet size={cs} iconOnly={icon} aria-label={label} pressed={active} onClick={onClick} {...refProps} />
    </Tooltip>
  )
}

/* Appearance — the Figma shape: eye (visibility) + drop (blend popover) in
 * the header, Opacity and Corner-radius as INPUTS in the body (no sliders
 * for one-shot values — user ruling 2026-08-12). Radius only where the
 * renderer honors it (rect shapes). */
function AppearanceSection({ layer, setProp, edit, first }) {
  const cs = useControlSize()
  const { toggleLayer, palette } = useComposeState()
  const [blendOpen, setBlendOpen] = useState(false)
  const blendPop = usePopover({ open: blendOpen, onOpenChange: setBlendOpen, placement: 'bottom-end', offset: 4 })
  /* Corner radius follows Figma: present for text too (clips the frame),
   * not just rects. */
  const hasRadius = (layer.type === 'shape' && layer.kind === 'rect') || layer.type === 'text'
  const visible = layer.visible !== false
  const blend = layer.blend ?? 'normal'
  const clamp01 = (raw, fallback) => {
    const n = Number(raw)
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n / 100)) : fallback
  }
  return (
    <Pane
      label="Appearance"
      actions={
        <>
          <SectionIconBtn label={visible ? 'Hide layer' : 'Show layer'} icon={visible ? 'eye-on' : 'eye-off'} active={!visible} onClick={() => toggleLayer(layer.id)} />
          <SectionIconBtn
            label={`Blend: ${BLEND_MODES.find((b) => b.value === blend)?.label ?? blend}`}
            icon="paint-drop"
            active={blend !== 'normal' || blendOpen}
            refProps={{ ref: blendPop.refs.setReference, ...blendPop.getReferenceProps() }}
          />
          <PopoverPanel popover={blendPop} panel={false} focus={false} className="z-50 bg-surface-secondary border border-oq-08 rounded shadow-lg py-1" style={{ width: 160 }}>
            {BLEND_MODES.map((b) => (
              <MenuDropdownItem key={b.value} onClick={() => { setProp('blend', b.value); setBlendOpen(false) }} shortcut={blend === b.value ? <Icon name="check" size={11} /> : undefined}>
                {b.label}
              </MenuDropdownItem>
            ))}
          </PopoverPanel>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {/* no Opacity / Corner radius labels — the glyph + tooltip name the field (pane rule) */}
        <Tooltip label="Opacity" triggerClassName="flex min-w-0">
          <NumberField
            variant="property" size={cs} unit="%" className="w-full min-w-0"
            affordance={<Icon name="opacity" size={glyphSize(cs)} />}
            value={Math.round((layer.opacity ?? 1) * 100)}
            onCommit={(raw) => setProp('opacity', clamp01(raw, layer.opacity ?? 1))}
          />
        </Tooltip>
        {hasRadius && (
          <div className="flex items-center gap-1 min-w-0">
            {Array.isArray(layer.radii) ? <span className="flex-1" /> : (
              <Tooltip label="Corner radius" triggerClassName="flex flex-1 min-w-0">
                <NumberField
                  variant="property" size={cs} className="w-full min-w-0"
                  affordance={<Icon name="corner-radius" size={glyphSize(cs)} />}
                  value={Math.round(layer.radius ?? 0)}
                  onCommit={(raw) => {
                    const n = Number(raw)
                    setProp('radius', Number.isFinite(n) && n > 0 ? Math.round(n) : 0)
                  }}
                />
              </Tooltip>
            )}
            {/* PER-CORNER (G2): unlink and each corner takes its own radius; relink and they
                collapse back to the first. Rects only — text clips its frame with one radius. */}
            {layer.type === 'shape' && (
              <Tooltip label={Array.isArray(layer.radii) ? 'Link corners' : 'Edit corners separately'}>
                <Button tone="ghost" quiet size={cs} iconOnly="maximize" /* four corners; a `link` cut is owed (plan 17) — lock already means two things */
                  aria-label={Array.isArray(layer.radii) ? 'Link corners' : 'Edit corners separately'}
                  pressed={Array.isArray(layer.radii)}
                  onClick={() => (Array.isArray(layer.radii)
                    ? edit.patch({ radius: layer.radii[0] ?? 0, radii: null })
                    : edit.patch({ radii: [0, 1, 2, 3].map(() => Math.round(layer.radius ?? 0)) }))} />
              </Tooltip>
            )}
          </div>
        )}
      </div>
      {hasRadius && Array.isArray(layer.radii) && (
        <div className="grid grid-cols-2 gap-2">
          {['Top left', 'Top right', 'Bottom right', 'Bottom left'].map((name, i) => (
            <Tooltip key={name} label={`${name} radius`} triggerClassName="flex min-w-0">
              <NumberField
                variant="property" size={cs} className="w-full min-w-0"
                affordance={['TL', 'TR', 'BR', 'BL'][i]}
                value={Math.round(layer.radii[i] ?? 0)}
                onCommit={(raw) => {
                  const n = Number(raw)
                  setProp('radii', layer.radii.map((r, j) => (j === i ? (Number.isFinite(n) && n > 0 ? Math.round(n) : 0) : r)))
                }}
              />
            </Tooltip>
          ))}
        </div>
      )}
      {/* FILL AND STROKE ARE SWATCHES YOU CLICK (spec R6.6, the user's 15 and 16): each focuses its
          paint and opens the Color pane on it. The `Colour…` button that stood here opened the
          palette generator, not the Color pane, and is gone. A stroke with no weight reads as none. */}
      {'color' in layer && (
        <div className="flex items-center gap-2 pt-1">
          <PaintSwatch paint="fill" label="Fill" hex={resolveColor(layer.color, palette)} none={!layer.color} />
          <PaintSwatch paint="stroke" label="Stroke" hex={resolveColor(layer.stroke, palette)} none={!layer.stroke || !layer.strokeWidth} />
        </div>
      )}
    </Pane>
  )
}

/* One paint swatch + its label, a button: focus that paint, open the Color pane on it. */
function PaintSwatch({ paint, label, hex, none }) {
  const { setActivePaint } = useComposeState()
  const open = () => {
    setActivePaint(paint)
    window.dispatchEvent(new CustomEvent('kol:open-color-pane', { detail: { tab: 'Colour' } }))
  }
  return (
    <span className="inline-flex items-center gap-2">
      <ColorSwatch hex={none ? undefined : (hex ?? '#FFFFFF')} size={24} showTransparent={none} onClick={open} aria-label={`${label} color`} title={label} />
      <span className="kol-helper-10 tracking-widest text-meta">{label.toUpperCase()}</span>
    </span>
  )
}

/* Pointer rows → the Parameters / Effects tabs (SelectionPalettePanel
 * listens). One row for the type's own parameters, one for its effect
 * (Phase 7 — every positioned layer can host one; the photo row IS the
 * effect row). The pattern row opens its selection-driven Pattern tab —
 * the styling surface's home since it left Parameters. Text has no row:
 * its surface renders in the Inspector itself. */
const PARAMS_LABELS = {
  shape:   () => 'Shape parameters',
  pattern: () => 'Pattern parameters',
  loop:    (l) => `Loop · ${l.presetLabel ?? 'parameters'}`,
  misc:    (l) => `Misc · ${l.presetLabel ?? 'parameters'}`,
  kinetic: (l) => `Kinetic · ${l.presetLabel ?? 'parameters'}`,
}
const PARAMS_EVENTS = { pattern: 'kol:open-pattern' }

function ParamsLink({ layer }) {
  const cs = useControlSize()
  const openParams  = () => window.dispatchEvent(new CustomEvent(PARAMS_EVENTS[layer.type] ?? 'kol:open-params'))
  const labelFor = PARAMS_LABELS[layer.type]
  /* Effects section REMOVED from the Inspector (user ruling 2026-08-12) —
   * the Effects TAB owns effects; only the Parameters jump stays. */
  if (!labelFor) return null
  return (
    <Pane label="Parameters">
      <Tooltip label={layer.type === 'pattern' ? 'Open the Pattern tab' : 'Open the Parameters tab'}><Button aria-label={layer.type === 'pattern' ? 'Open the Pattern tab' : 'Open the Parameters tab'}
        tone="primary" size={cs} className="w-full"
        onClick={openParams}
      >
        {labelFor(layer)}
      </Button></Tooltip>
    </Pane>
  )
}

function GroupFields({ layer, ungroupLayer }) {
  const cs = useControlSize()
  const childCount = Array.isArray(layer.children) ? layer.children.length : 0
  return (
    <>
      <SettingsRow label="Children" align="fill" labelWidth={RAIL_LABEL_W}>
        <span className="kol-helper-12 text-meta">{childCount} layer{childCount === 1 ? '' : 's'}</span>
      </SettingsRow>
      <Button
        tone="primary"
        size={cs}
        className="w-full"
        onClick={() => ungroupLayer(layer.id)}
      >
        Ungroup
      </Button>
    </>
  )
}

/* Photo content source — upload / library pick / preview / clear. Every
 * write sets srcType so image ↔ video swaps render correctly (library picks
 * can be videos; the URL is proxied same-origin so filters don't taint). */
function ImageSource({ layer, patch }) {
  const cs = useControlSize()
  const fileRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  /* Context menu's "Replace image" routes here — the file input lives in
   * this component only. */
  useEffect(() => {
    const onReplace = (e) => { if (e.detail === layer.id) fileRef.current?.click() }
    window.addEventListener('kol:photo-replace', onReplace)
    return () => window.removeEventListener('kol:photo-replace', onReplace)
  }, [layer.id])
  const onPick = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' /* allow re-picking the same file */
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => patch({ src: reader.result, srcType: 'image' })
    reader.readAsDataURL(file)
  }
  const onLibraryPick = (url, { contentType } = {}) => {
    patch({ src: proxied(url), srcType: isVideoType(contentType) ? 'video' : 'image' })
  }
  const onClear = () => {
    patch({ src: null, srcType: 'image' })
    if (fileRef.current) fileRef.current.value = ''
  }
  return (
    <LabeledControl label={'Source'.toUpperCase()}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      {layer.src && (
        layer.srcType === 'video' ? (
          <video
            src={layer.src}
            muted
            preload="metadata"
            className="rounded overflow-hidden border border-oq-08 mb-2 w-full"
            style={{ aspectRatio: '16 / 9', objectFit: layer.fit ?? 'cover' }}
            aria-label="Video preview"
          />
        ) : (
          <div
            className="rounded overflow-hidden border border-oq-08 mb-2"
            style={{
              aspectRatio: '16 / 9',
              backgroundImage: `url("${layer.src}")`,
              backgroundSize: layer.fit ?? 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
            aria-label="Image preview"
          />
        )
      )}
      <div className="flex items-center gap-2">
        <Button
          tone="primary" size={cs} iconLeft="upload" iconSize={12}
          className="flex-1"
          onClick={() => fileRef.current?.click()}
        >
          {layer.src ? 'Replace' : 'Upload image'}
        </Button>
        <Button
          tone="primary" size={cs}
          className="flex-1"
          onClick={() => setPickerOpen(true)}
        >
          Library
        </Button>
        {layer.src && (
          <Tooltip label="Delete image"><Button
            tone="primary" size={cs} iconOnly="trash" iconSize={12}
            aria-label="Delete image"
            onClick={onClear}
          /></Tooltip>
        )}
      </div>
      {/* the DS modal library (2026-10-07) — the editor's own picker is retired; a media layer takes image or video */}
      <MediaPickerDialog open={pickerOpen} accept={['image', 'video']} onClose={() => setPickerOpen(false)} onSelect={onLibraryPick} />
    </LabeledControl>
  )
}


/* AxisField — one axis value on the DS property field (PropertyField ticket,
 * adopted): affordance inside the shell, the value hugs its own length, the
 * unit sits against it (`0°`). Draft/commit via NumberField so a bare '-'
 * never reshapes the layer. String affordances get 4px extra air — the
 * shipped 6px reads glued against mono digits (the "balanced" ref). */
function AxisField({ label, value, onCommit, suffix, tooltip }) {
  const cs = useControlSize()
  return (
    <Tooltip label={tooltip} triggerClassName="flex flex-1 min-w-0">
    <NumberField
      variant="property" size={cs}
      affordance={typeof label === 'string' ? <span className="pr-1">{label}</span> : label} unit={suffix}
      className="w-full min-w-0"
      value={value}
      onCommit={onCommit}
    />
    </Tooltip>
  )
}

const numOr0 = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : 0
}

/* Position section — X/Y only (the W/H half moved to the Layout section,
 * Figma split). Two equal columns, prefixes inside the boxes. */
function PositionFields({ layer, setProp }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <AxisField label="X" tooltip="X position" value={Math.round(layer.x)} onCommit={(raw) => setProp('x', numOr0(raw))} />
      <AxisField label="Y" tooltip="Y position" value={Math.round(layer.y)} onCommit={(raw) => setProp('y', numOr0(raw))} />
    </div>
  )
}

/* Layout section — W/H + the aspect lock. */
function LayoutFields({ layer, setProp, patch, anchor = [0, 0] }) {
  const cs = useControlSize()
  /* Lock state lives on the layer (not local) so canvas drag handlers can
   * read it too. Encoded as a single number-or-null: a finite number is
   * the locked aspect ratio; null/undefined means unlocked. */
  const aspect = Number.isFinite(layer.aspectLocked) && layer.aspectLocked > 0
    ? layer.aspectLocked
    : null
  const aspectLocked = aspect !== null
  const toggleLock = () => {
    if (aspectLocked) {
      setProp('aspectLocked', null)
    } else if (layer.h > 0) {
      setProp('aspectLocked', layer.w / layer.h)
    }
  }
  /* Path layers draw their nodes at 1:1 — a bare {w,h} write would move the
   * wireframe without touching the geometry. Scale the nodes with the box so
   * the render tracks the typed size. */
  const isPath = layer.type === 'path' && Array.isArray(layer.nodes)
  const withPathScale = (p) => {
    if (!isPath) return p
    const sx = p.w != null ? p.w / Math.max(1, layer.w) : 1
    const sy = p.h != null ? p.h / Math.max(1, layer.h) : 1
    return {
      ...p,
      nodes: scalePathNodes(layer.nodes, sx, sy),
      ...(layer.holes?.length ? { holes: layer.holes.map((r) => scalePathNodes(r, sx, sy)) } : {}),
    }
  }
  /* the anchor point stays put (G4): a box growing by dw moves left by dw × its anchor x */
  const anchored = (p) => ({
    ...p,
    ...(p.w != null ? { x: Math.round(layer.x - (p.w - layer.w) * anchor[0]) } : {}),
    ...(p.h != null ? { y: Math.round(layer.y - (p.h - layer.h) * anchor[1]) } : {}),
  })
  const onChangeW = (raw) => {
    const w = Math.max(8, numOr0(raw))
    patch(anchored(withPathScale(aspectLocked ? { w, h: Math.max(8, Math.round(w / aspect)) } : { w })))
  }
  const onChangeH = (raw) => {
    const h = Math.max(8, numOr0(raw))
    patch(anchored(withPathScale(aspectLocked ? { w: Math.max(8, Math.round(h * aspect)), h } : { h })))
  }
  return (
    <div className="flex items-center gap-2">
      <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
        <AxisField label="W" tooltip="Width" value={Math.round(layer.w)} onCommit={onChangeW} />
        <AxisField label="H" tooltip="Height" value={Math.round(layer.h)} onCommit={onChangeH} />
      </div>
      {/* Constrain proportions (editor review #6, 2026-09-27 — user: "just use a lock or something
        * more common"): a KOL Button on the inputs' rung, a lock that closes when constrained. It was
        * a raw <button> inking a corner glyph `fg` from its wrapper. */}
      <Tooltip label={aspectLocked ? 'Unconstrain proportions' : 'Constrain proportions'}>
        <Button tone="ghost" size={cs} iconOnly={aspectLocked ? 'lock' : 'unlock'} pressed={aspectLocked}
          aria-label={aspectLocked ? 'Unconstrain proportions' : 'Constrain proportions'} onClick={toggleLock} />
      </Tooltip>
    </div>
  )
}

const clampSkew = (raw) => {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(-89, Math.min(89, Math.round(n))) : 0
}

/* The anchor survives the inspector remounting on every selection change. Top-left by default —
 * Affinity's Transform panel. */
const anchorStore = { value: [0, 0] }

/* Rotating to `next` about the anchor (G4): the layer still rotates about its own centre (the
 * renderer and the selection box both do), so the anchor is held still by moving the centre —
 * C' = O + R(Δ)(C − O), O the anchor point as currently drawn. */
function rotateAboutAnchor(layer, next, [ax, ay]) {
  const prev = layer.rotation ?? 0
  const d = ((next - prev) * Math.PI) / 180
  if (!d || layer.w == null) return {}
  const cx = layer.x + layer.w / 2, cy = layer.y + layer.h / 2
  const r = (prev * Math.PI) / 180
  const lx = (ax - 0.5) * layer.w, ly = (ay - 0.5) * layer.h
  const ox = cx + lx * Math.cos(r) - ly * Math.sin(r), oy = cy + lx * Math.sin(r) + ly * Math.cos(r)
  const vx = cx - ox, vy = cy - oy
  const ncx = ox + vx * Math.cos(d) - vy * Math.sin(d), ncy = oy + vx * Math.sin(d) + vy * Math.cos(d)
  return { x: Math.round(ncx - layer.w / 2), y: Math.round(ncy - layer.h / 2) }
}

/* The 9-point transform origin (G4 — Affinity's anchor selector): the pressed dot is the point
 * the typed W / H / rotation hold still. */
function AnchorPicker({ value, onChange }) {
  const steps = [0, 0.5, 1]
  return (
    <div role="radiogroup" aria-label="Transform origin" className="grid grid-cols-3 gap-px p-1 rounded bg-surface-secondary shrink-0">
      {steps.flatMap((y) => steps.map((x) => {
        const on = value[0] === x && value[1] === y
        return (
          <button key={`${x}${y}`} type="button" role="radio" aria-checked={on}
            aria-label={`Origin ${['left', 'center', 'right'][x * 2]} ${['top', 'middle', 'bottom'][y * 2]}`}
            onClick={() => onChange([x, y])}
            className="w-[6px] h-[6px] p-0 m-[1px] rounded-full border-0 cursor-pointer"
            style={{ background: on ? 'var(--kol-accent-primary)' : 'var(--kol-fg-24)' }} />
        )
      }))}
    </div>
  )
}

/* ColorField extracted to ./ColorField; re-exported (imported at top) so
 * existing importers (CanvasInspector, TypeControls, pattern/ColorPicker)
 * keep working. */
export { ColorField }
