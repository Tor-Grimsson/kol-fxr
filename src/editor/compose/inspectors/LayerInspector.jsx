import { useEffect, useRef, useState } from 'react'
import MediaPicker from '../../library/MediaPicker'
import { proxied, isVideoType } from '../../library/mediaLibrary'
import { Button, Dropdown } from '@kolkrabbi/kol-component'
import { LabeledControl } from '@kolkrabbi/kol-component'
import { PopoverPanel, usePopover } from '@kolkrabbi/kol-component'
import { ViewToggle } from '@kolkrabbi/kol-component'
import AlignmentPanel from '../AlignmentPanel'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import StrokePanel from '../../color/StrokePanel'
import { Icon } from '@kolkrabbi/kol-icons'
import { useComposeState, COVER_TYPES } from '../state'
import { scalePathNodes } from '../path-math'
import EditorIcon from '../../icons/EditorIcon'
import { useLayerEdit } from '../useLayerEdit'
import { useColorTarget } from '../../color/useColorTarget'
import { ColorField } from './ColorField'
import BindDot from '../../params/BindDot'
import { BLEND_MODES } from '../LayerStack'
import { firstFilterDef } from '../filterChain'
import { loopById, loopBgToggleable } from '../../../loops/registry'
import { MISC_TREE } from '../../../loops/taxonomy'
import { LoopPicker } from './LoopPicker'
import { NumberField } from './NumberField'
import { Section } from './Section'
import { TextSurface } from './TextPanel'

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
  const { ungroupLayer, flipLayer, palette } = useComposeState()
  /* Color writes route through useColorTarget so the inspector, the picker,
   * the keymap, and the swatch stack all share one writer. Photoshop model:
   * writes always succeed, app-level paint state is the canonical source. */
  const target = useColorTarget()

  /* `coalesce` collapses slider drags + typed-input flurries into one undo
   * entry per quiet period. */
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const setProp = edit.setProp

  const positioned = !COVER_TYPES.includes(layer.type)
  const paintable  = ['background', 'pattern', 'shape', 'text', 'path'].includes(layer.type)

  /* Purpose-divided sections (2026-08-12 restructure, the Figma model):
   * Position · Layout · Appearance · type sections · Fill · Stroke ·
   * Parameters · Effects — instead of the flat control pile. */
  return (
    <div className="flex flex-col">
      {positioned && (
        <Section label="Position" first>
          {/* Figma order: Alignment (to canvas for a single layer) ·
            * Position X/Y · Rotation + the transform cluster. */}
          <LabeledControl label="Alignment">
            <AlignmentPanel />
          </LabeledControl>
          <LabeledControl label="Position">
            <PositionFields layer={layer} setProp={setProp} />
          </LabeledControl>
          <LabeledControl label="Rotation">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <AxisField
                  label={<Icon name="angle" size={14} />} suffix="°"
                  value={typeof layer.rotation === 'number' ? Math.round(layer.rotation) : 0}
                  onCommit={(raw) => {
                    const n = Number(raw)
                    setProp('rotation', Number.isFinite(n) ? ((Math.round(n) % 360) + 360) % 360 : 0)
                  }}
                />
                <BindDot
                  layer={layer}
                  param={{ key: 'rotation', label: 'Rotation', type: 'range', min: 0, max: 360, default: 0 }}
                  setProp={setProp}
                />
              </div>
              {/* The transform cluster — filled tiles, STATELESS (the
                * 2026-08-12 state law: no outline shell, no selected ring on
                * action strips). Flipped axes tint their glyph accent. */}
              <SegmentedToggle
                variant="filled" size="sm" value={null}
                ariaLabel="Transform"
                options={[
                  { value: 'rot', ariaLabel: 'Rotate 90° left', label: <EditorIcon name="rotate-left" size={16} /> },
                  { value: 'fh', ariaLabel: 'Flip horizontal', label: <span style={{ color: layer.flipX ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><EditorIcon name="flip-h" size={16} /></span> },
                  { value: 'fv', ariaLabel: 'Flip vertical', label: <span style={{ color: layer.flipY ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><EditorIcon name="flip-v" size={16} /></span> },
                  ...(layer.type === 'photo' ? [{ value: 'crop', ariaLabel: 'Crop image', label: <EditorIcon name="crop" size={16} /> }] : []),
                ]}
                onChange={(op) => {
                  if (op === 'rot') setProp('rotation', (((Math.round(layer.rotation ?? 0) - 90) % 360) + 360) % 360)
                  else if (op === 'fh') flipLayer(layer.id, 'h')
                  else if (op === 'fv') flipLayer(layer.id, 'v')
                  else if (op === 'crop') window.dispatchEvent(new CustomEvent('kol:enter-crop', { detail: layer.id }))
                }}
              />
            </div>
          </LabeledControl>
        </Section>
      )}

      {positioned && (
        <Section label="Layout">
          {layer.type === 'text' && (
            <LabeledControl label="Resizing">
              {/* Real behavior, not chrome: fixed keeps the box; auto modes
                * measure the rendered text (TextLayer effect) and write it.
                * PLACEHOLDER glyphs from the shipped set (square /
                * arrow-right / arrows-vertical) — swapped the moment the
                * drawn resizing icons publish. Selected = the DARK tile. */}
              <SegmentedToggle
                variant="tonal" size="sm"
                ariaLabel="Resizing"
                value={layer.resizing ?? 'fixed'}
                onChange={(v) => setProp('resizing', v)}
                options={[
                  { value: 'fixed',  ariaLabel: 'Fixed size',  label: <Icon name="resize-fixed" size={16} /> },
                  { value: 'auto-w', ariaLabel: 'Auto width',  label: <Icon name="resize-auto-w" size={16} /> },
                  { value: 'auto-h', ariaLabel: 'Auto height', label: <Icon name="resize-auto-h" size={16} /> },
                ]}
              />
            </LabeledControl>
          )}
          <LabeledControl label="Dimensions">
            <LayoutFields layer={layer} setProp={setProp} patch={edit.patch} />
          </LabeledControl>
        </Section>
      )}

      <AppearanceSection layer={layer} setProp={setProp} first={!positioned} />

      {(layer.type === 'loop' || layer.type === 'misc') && (
        <Section label="Preset">
          {/* Loop pickers + backdrop — bg toggle hidden for loops whose bg
            * feeds their color math. */}
          <LoopPicker layer={layer} tree={layer.type === 'misc' ? MISC_TREE : undefined} />
          {loopBgToggleable(loopById(layer.loopId)) && (
            <LabeledControl label="Background">
              <ViewToggle
                options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                viewMode={layer.bgOn === false ? 'off' : 'on'}
                onViewChange={(v) => setProp('bgOn', v === 'on')}
              />
            </LabeledControl>
          )}
        </Section>
      )}

      {/* Text's whole surface = the Typography section (the 2026-08-12
        * inspector ruling; the Text tab retired). */}
      {layer.type === 'text' && (
        <Section label="Typography">
          <TextSurface key={layer.id} layer={layer} />
        </Section>
      )}

      {layer.type === 'photo' && (
        <Section label="Image">
          {/* Content source — what the layer IS; fit + filters live in
            * Parameters. */}
          <ImageSource layer={layer} patch={edit.patch} />
        </Section>
      )}

      {/* Fill and Stroke — the Figma paint rows (T5/T6 2026-08-12):
        * [swatch+hex][opacity %][eye][−], header + when absent. Per-paint
        * opacity + the eye are REAL (fillOpacity/fillHidden through render
        * and export). A paint exists only when it paints. */}
      {paintable && (
        <Section
          label="Fill"
          actions={layer.color == null && (
            <SectionIconBtn label="Add fill" onClick={() => target.setFill('palette:dark')}>
              <EditorIcon name="plus" size={12} />
            </SectionIconBtn>
          )}
        >
          {layer.color != null && (
            <PaintRow
              value={layer.color}
              onColor={target.setFill}
              palette={palette}
              label="Fill"
              opacity={layer.fillOpacity}
              hidden={!!layer.fillHidden}
              onOpacity={(v) => setProp('fillOpacity', v)}
              onToggleHidden={() => setProp('fillHidden', !layer.fillHidden)}
              onRemove={() => { target.setFill(null); edit.patch({ fillHidden: false, fillOpacity: 1 }) }}
            />
          )}
        </Section>
      )}
      {paintable && (
        <Section
          label="Stroke"
          actions={!(layer.stroke != null && (layer.strokeWidth ?? 0) > 0) && (
            <SectionIconBtn
              label="Add stroke"
              onClick={() => { target.setStroke('palette:dark'); setProp('strokeWidth', 2) }}
            >
              <EditorIcon name="plus" size={12} />
            </SectionIconBtn>
          )}
        >
          {layer.stroke != null && (layer.strokeWidth ?? 0) > 0 && (
            <>
              <PaintRow
                value={layer.stroke}
                onColor={target.setStroke}
                palette={palette}
                label="Stroke"
                opacity={layer.strokeOpacity}
                hidden={!!layer.strokeHidden}
                onOpacity={(v) => setProp('strokeOpacity', v)}
                onToggleHidden={() => setProp('strokeHidden', !layer.strokeHidden)}
                onRemove={() => { target.setStroke(null); edit.patch({ strokeWidth: 0, strokeHidden: false, strokeOpacity: 1 }) }}
              />
              <StrokeDepthRow layer={layer} setProp={setProp} />
            </>
          )}
        </Section>
      )}

      {layer.type === 'path' && (
        <Section label="Path">
          {/* Open ↔ closed — renderer + export honor `closed` via pathD;
            * in node-edit, clicking the first anchor also closes. */}
          <ViewToggle
            options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
            viewMode={layer.closed ? 'closed' : 'open'}
            onViewChange={(v) => setProp('closed', v === 'closed')}
          />
        </Section>
      )}

      <ParamsLink layer={layer} />

      {layer.type === 'group' && (
        <Section label="Group">
          <GroupFields layer={layer} ungroupLayer={ungroupLayer} />
        </Section>
      )}
    </div>
  )
}

/* PaintRow — the Figma paint bar: [swatch+hex][opacity%][eye][−]. The
 * swatch-in-one-container upgrade rides the ColorSwatch DS ticket; until
 * then swatch + hex sit adjacent. */
function PaintRow({ value, onColor, palette, label, opacity, hidden, onOpacity, onToggleHidden, onRemove }) {
  const pct = Math.round((opacity ?? 1) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <ColorField label={label} hideLabel inline value={value} onChange={onColor} palette={palette} />
      </div>
      {/* property self-applies w-full — cage it so the hex keeps its room */}
      <div className="w-[72px] shrink-0">
        <NumberField
          variant="property" size="sm" unit="%"
          value={pct}
          onCommit={(raw) => {
            const n = Number(raw)
            if (Number.isFinite(n)) onOpacity(Math.min(1, Math.max(0, n / 100)))
          }}
        />
      </div>
      <SectionIconBtn label={hidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`} active={hidden} onClick={onToggleHidden}>
        <EditorIcon name={hidden ? 'eye-off' : 'eye-on'} size={13} />
      </SectionIconBtn>
      <SectionIconBtn label={`Remove ${label.toLowerCase()}`} onClick={onRemove}>
        <Icon name="minus" size={12} />
      </SectionIconBtn>
    </div>
  )
}

/* StrokeDepthRow — Weight + the stroke-settings popover (the left rail's
 * StrokePanel mounted whole — moved, not duplicated; Figma's ⚙ pattern). */
function StrokeDepthRow({ layer, setProp }) {
  const [open, setOpen] = useState(false)
  const popover = usePopover({ open, onOpenChange: setOpen, placement: 'bottom-end', offset: 4 })
  return (
    <div className="flex items-center gap-2">
      <LabeledControl label="Weight">
        <NumberField
          variant="property" size="sm" affordance="W"
          value={Math.round(layer.strokeWidth ?? 2)}
          onCommit={(raw) => {
            const n = Number(raw)
            setProp('strokeWidth', Number.isFinite(n) && n > 0 ? Math.round(n) : 0)
          }}
        />
      </LabeledControl>
      <button
        type="button"
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        aria-label="Stroke settings"
        data-kol-tip="Stroke settings"
        className={`ml-auto self-end inline-flex items-center justify-center rounded text-emphasis ${open ? '' : 'kol-btn-quiet'}`}
        style={{ width: 26, height: 26, padding: 5 }}
      >
        <Icon name="slider-01" size={14} />
      </button>
      <PopoverPanel popover={popover} panel={false} focus={false} className="z-50 bg-surface-secondary border border-fg-08 rounded shadow-lg p-3" style={{ width: 280, maxHeight: '60vh', overflowY: 'auto' }}>
        <StrokePanel />
      </PopoverPanel>
    </div>
  )
}

/* Small right-aligned header-row icon button (Section `actions`). */
function SectionIconBtn({ label, onClick, active = false, refProps = {}, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-kol-tip={label}
      aria-pressed={active || undefined}
      className={`inline-flex items-center justify-center rounded text-emphasis ${active ? '' : 'kol-btn-quiet'}`}
      style={{ width: 22, height: 22, padding: 4 }}
      {...refProps}
    >
      {children}
    </button>
  )
}

/* Appearance — the Figma shape: eye (visibility) + drop (blend popover) in
 * the header, Opacity and Corner-radius as INPUTS in the body (no sliders
 * for one-shot values — user ruling 2026-08-12). Radius only where the
 * renderer honors it (rect shapes). */
function AppearanceSection({ layer, setProp, first }) {
  const { toggleLayer } = useComposeState()
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
    <Section
      label="Appearance"
      first={first}
      actions={
        <>
          <SectionIconBtn label={visible ? 'Hide layer' : 'Show layer'} active={!visible} onClick={() => toggleLayer(layer.id)}>
            <EditorIcon name={visible ? 'eye-on' : 'eye-off'} size={13} />
          </SectionIconBtn>
          <SectionIconBtn
            label={`Blend: ${BLEND_MODES.find((b) => b.value === blend)?.label ?? blend}`}
            active={blend !== 'normal' || blendOpen}
            refProps={{ ref: blendPop.refs.setReference, ...blendPop.getReferenceProps() }}
          >
            <Icon name="paint-drop" size={13} />
          </SectionIconBtn>
          <PopoverPanel popover={blendPop} panel={false} focus={false} className="z-50 bg-surface-secondary border border-fg-08 rounded shadow-lg py-1" style={{ width: 160 }}>
            {BLEND_MODES.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => { setProp('blend', b.value); setBlendOpen(false) }}
                className="w-full kol-helper-12 px-3 h-8 inline-flex items-center gap-2 text-oq-64 hover:text-emphasis text-left"
              >
                <span className="flex-1 truncate leading-normal">{b.label}</span>
                {blend === b.value && <EditorIcon name="check" size={11} />}
              </button>
            ))}
          </PopoverPanel>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <LabeledControl label="Opacity">
          {/* Container = icon + value + unit (the user's spec); the opacity
           * glyph is interim (ptrn-dot) until the icon ticket ships. */}
          <NumberField
            variant="property" size="sm" unit="%" className="w-full min-w-0"
            affordance={<Icon name="opacity" size={14} />}
            value={Math.round((layer.opacity ?? 1) * 100)}
            onCommit={(raw) => setProp('opacity', clamp01(raw, layer.opacity ?? 1))}
          />
        </LabeledControl>
        {hasRadius && (
          <LabeledControl label="Corner radius">
            <NumberField
              variant="property" size="sm" className="w-full min-w-0"
              affordance={<Icon name="corner-radius" size={14} />}
              value={Math.round(layer.radius ?? 0)}
              onCommit={(raw) => {
                const n = Number(raw)
                setProp('radius', Number.isFinite(n) && n > 0 ? Math.round(n) : 0)
              }}
            />
          </LabeledControl>
        )}
      </div>
    </Section>
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
  const openParams  = () => window.dispatchEvent(new CustomEvent(PARAMS_EVENTS[layer.type] ?? 'kol:open-params'))
  const labelFor = PARAMS_LABELS[layer.type]
  /* Effects section REMOVED from the Inspector (user ruling 2026-08-12) —
   * the Effects TAB owns effects; only the Parameters jump stays. */
  if (!labelFor) return null
  return (
    <Section label="Parameters">
      <Button
        variant="primary" size="sm" className="w-full"
        onClick={openParams}
        title={layer.type === 'pattern' ? 'Open the Pattern tab' : 'Open the Parameters tab'}
      >
        {labelFor(layer)}
      </Button>
    </Section>
  )
}

function GroupFields({ layer, ungroupLayer }) {
  const childCount = Array.isArray(layer.children) ? layer.children.length : 0
  return (
    <>
      <LabeledControl label="Children">
        <span className="kol-helper-12 text-meta">{childCount} layer{childCount === 1 ? '' : 's'}</span>
      </LabeledControl>
      <Button
        variant="primary"
        size="sm"
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
    <LabeledControl label="Source">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      {layer.src && (
        layer.srcType === 'video' ? (
          <video
            src={layer.src}
            muted
            preload="metadata"
            className="rounded overflow-hidden border border-fg-08 mb-2 w-full"
            style={{ aspectRatio: '16 / 9', objectFit: layer.fit ?? 'cover' }}
            aria-label="Video preview"
          />
        ) : (
          <div
            className="rounded overflow-hidden border border-fg-08 mb-2"
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
        <Button iconComponent={EditorIcon}
          variant="primary" size="sm" iconLeft="upload" iconSize={12}
          className="flex-1"
          onClick={() => fileRef.current?.click()}
        >
          {layer.src ? 'Replace' : 'Upload image'}
        </Button>
        <Button
          variant="primary" size="sm"
          className="flex-1"
          onClick={() => setPickerOpen(true)}
        >
          Library
        </Button>
        {layer.src && (
          <Button iconComponent={EditorIcon}
            variant="primary" size="sm" iconOnly="trash" iconSize={12}
            aria-label="Clear image"
            onClick={onClear}
          />
        )}
      </div>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onLibraryPick} />
    </LabeledControl>
  )
}

/* Flip action button — mirrors the selected layer about its own center.
 * Paths bake the mirror into node geometry; other layers toggle flipX/Y
 * (state.flipLayer decides). Flag layers show an active tint when flipped. */
function FlipButton({ axis, layer, flipLayer, segmented = false }) {
  const active = axis === 'h' ? !!layer.flipX : !!layer.flipY
  return (
    <button
      type="button"
      onClick={() => flipLayer(layer.id, axis)}
      title={axis === 'h' ? 'Flip horizontal (⇧H)' : 'Flip vertical (⇧V)'}
      className={segmented
        ? 'kol-btn-quiet flex-1 inline-flex items-center justify-center'
        : 'inline-flex items-center justify-center w-6 h-6 rounded shrink-0'}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: active ? 'var(--kol-accent-primary)' : 'var(--kol-fg-48)',
        ...(segmented ? { height: 26, padding: 5 } : {}),
      }}
    >
      <EditorIcon name={axis === 'h' ? 'flip-h' : 'flip-v'} size={segmented ? 13 : 14} />
    </button>
  )
}

/* AxisField — one axis value on the DS property field (PropertyField ticket,
 * adopted): affordance inside the shell, the value hugs its own length, the
 * unit sits against it (`0°`). Draft/commit via NumberField so a bare '-'
 * never reshapes the layer. String affordances get 4px extra air — the
 * shipped 6px reads glued against mono digits (the "balanced" ref). */
function AxisField({ label, value, onCommit, suffix }) {
  return (
    <NumberField
      variant="property" size="sm"
      affordance={typeof label === 'string' ? <span className="pr-1">{label}</span> : label} unit={suffix}
      className="w-full min-w-0"
      value={value}
      onCommit={onCommit}
    />
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
      <AxisField label="X" value={Math.round(layer.x)} onCommit={(raw) => setProp('x', numOr0(raw))} />
      <AxisField label="Y" value={Math.round(layer.y)} onCommit={(raw) => setProp('y', numOr0(raw))} />
    </div>
  )
}

/* Layout section — W/H + the aspect lock. */
function LayoutFields({ layer, setProp, patch }) {
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
  const onChangeW = (raw) => {
    const w = Math.max(8, numOr0(raw))
    if (aspectLocked) {
      patch(withPathScale({ w, h: Math.max(8, Math.round(w / aspect)) }))
    } else if (isPath) {
      patch(withPathScale({ w }))
    } else {
      setProp('w', w)
    }
  }
  const onChangeH = (raw) => {
    const h = Math.max(8, numOr0(raw))
    if (aspectLocked) {
      patch(withPathScale({ w: Math.max(8, Math.round(h * aspect)), h }))
    } else if (isPath) {
      patch(withPathScale({ h }))
    } else {
      setProp('h', h)
    }
  }
  return (
    <div className="flex items-center gap-2">
      <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
        <AxisField label="W" value={Math.round(layer.w)} onCommit={onChangeW} />
        <AxisField label="H" value={Math.round(layer.h)} onCommit={onChangeH} />
      </div>
      {/* The constrain-proportions button — FILLED like the inputs, corner
        * glyph, accent when constrained (user ruling 2026-08-12: no lock
        * icon, no outline). Proper constrain glyph rides the icon ticket. */}
      <button
        type="button"
        onClick={toggleLock}
        aria-pressed={aspectLocked}
        title={aspectLocked ? 'Unconstrain proportions' : 'Constrain proportions'}
        className="inline-flex items-center justify-center rounded shrink-0"
        style={{
          width: 26, height: 26,
          border: 'none',
          background: 'var(--kol-surface-secondary)',
          cursor: 'pointer',
          color: aspectLocked ? 'var(--kol-accent-primary)' : 'var(--kol-fg-48)',
        }}
      >
        <Icon name="constrain" size={16} />
      </button>
    </div>
  )
}

/* ColorField extracted to ./ColorField; re-exported (imported at top) so
 * existing importers (CanvasInspector, TypeControls, pattern/ColorPicker)
 * keep working. */
export { ColorField }
