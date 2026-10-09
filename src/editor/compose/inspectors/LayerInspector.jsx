import { useEffect, useRef, useState } from 'react'
import { MediaLibrary } from '@kolkrabbi/kol-component'
import { proxied, isVideoType, getMediaClient } from '../../library/mediaLibrary'
import { Button, ColorSwatch, Dropdown, InspectorSection, MenuDropdownItem, Tooltip, glyphSize } from '@kolkrabbi/kol-component'
import { LabeledControl } from '@kolkrabbi/kol-component'
import { PopoverPanel, usePopover } from '@kolkrabbi/kol-component'
import { ViewToggle } from '@kolkrabbi/kol-component'
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
  const gen = pack('generators')
  /* Color writes route through useColorTarget so the inspector, the picker,
   * the keymap, and the swatch stack all share one writer. Photoshop model:
   * writes always succeed, app-level paint state is the canonical source. */

  /* `coalesce` collapses slider drags + typed-input flurries into one undo
   * entry per quiet period. */
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })
  const setProp = edit.setProp

  const positioned = !COVER_TYPES.includes(layer.type)

  /* PANES (inspector rebuild 2026-09-27, Affinity as the guide — user: "too many section
   * headers … why are we not sectioning off the panes?"): Transform · Appearance · Typography ·
   * the type's own pane · Parameters. Named panes, full-width rules, no sub-labels — the
   * controls' glyphs and tooltips name them. Position + Layout were two sections with five
   * sub-labels; they are Affinity's one Transform panel. */
  return (
    <div className="flex flex-col">
      {positioned && (
        <InspectorSection pane label="Transform">
          <AlignmentPanel />
          <PositionFields layer={layer} setProp={setProp} />
          <LayoutFields layer={layer} setProp={setProp} patch={edit.patch} />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <AxisField
                label={<Icon name="angle" size={glyphSize('sm')} />} suffix="°" tooltip="Rotation"
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
            {/* The transform cluster — STATELESS (the 2026-08-12 state law: no selected ring on
              * action strips). Flipped axes tint their glyph accent. */}
            {/* the cells SHARE the half-rail: a photo layer adds Crop, and four `sm` cells at their own
              * padding are 163px in a 140px track — Crop sat half outside the rail (found in
              * apps/panels, 2026-10-03). Three cells already filled the track, so they do not move. */}
            <SegmentedToggle
              variant="filled" size="sm" value={null}
              ariaLabel="Transform"
              className="[&_.kol-seg-cell]:min-w-0 [&_.kol-seg-cell]:px-1"
              options={[
                { value: 'rot', ariaLabel: 'Rotate 90° left', label: <Icon name="rotate-left" size={glyphSize('sm', true)} /> },
                { value: 'fh', ariaLabel: 'Flip horizontal', label: <span style={{ color: layer.flipX ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><Icon name="flip-horizontal" size={glyphSize('sm', true)} /></span> },
                { value: 'fv', ariaLabel: 'Flip vertical', label: <span style={{ color: layer.flipY ? 'var(--kol-accent-primary)' : undefined, display: 'inline-flex' }}><Icon name="flip-vertical" size={glyphSize('sm', true)} /></span> },
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
              variant="filled" size="sm"
              ariaLabel="Resizing"
              value={layer.resizing ?? 'fixed'}
              onChange={(v) => setProp('resizing', v)}
              options={[
                { value: 'fixed',  ariaLabel: 'Fixed size',  label: <Icon name="resize-fixed" size={glyphSize('sm', true)} /> },
                { value: 'auto-w', ariaLabel: 'Auto width',  label: <Icon name="resize-auto-w" size={glyphSize('sm', true)} /> },
                { value: 'auto-h', ariaLabel: 'Auto height', label: <Icon name="resize-auto-h" size={glyphSize('sm', true)} /> },
              ]}
            />
          )}
        </InspectorSection>
      )}

      <AppearanceSection layer={layer} setProp={setProp} first={!positioned} />

      {(layer.type === 'loop' || layer.type === 'misc') && gen && (
        <InspectorSection pane label="Preset">
          {/* Loop pickers + backdrop — bg toggle hidden for loops whose bg
            * feeds their color math. The generators pack's (editor/packs.js). */}
          <gen.LoopPicker layer={layer} tree={layer.type === 'misc' ? gen.MISC_TREE : undefined} />
          {gen.loopBgToggleable(gen.loopById(layer.loopId)) && (
            <LabeledControl label="Background">
              <ViewToggle
                options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
                viewMode={layer.bgOn === false ? 'off' : 'on'}
                onViewChange={(v) => setProp('bgOn', v === 'on')}
              />
            </LabeledControl>
          )}
        </InspectorSection>
      )}

      {/* Text's whole surface = the Typography pane, which TextSurface renders itself so its
        * type-settings trigger can ride the pane header (the 2026-08-12 inspector ruling; the
        * Text tab retired). */}
      {layer.type === 'text' && <TextSurface key={layer.id} layer={layer} />}

      {layer.type === 'photo' && (
        <InspectorSection pane label="Image">
          {/* Content source — what the layer IS; fit + filters live in
            * Parameters. */}
          <ImageSource layer={layer} patch={edit.patch} />
        </InspectorSection>
      )}

      {/* No Fill / Stroke sections (editor review #12, 2026-09-27 — user: "colour is changed in the
        * colour window"): the left rail's Colour and Stroke panels edit the selected layer's paint.
        * The removed sections are in _tmp/2026-09-27-editor-copies/. */}

      {layer.type === 'path' && (
        <InspectorSection pane label="Path">
          {/* Open ↔ closed — renderer + export honor `closed` via pathD;
            * in node-edit, clicking the first anchor also closes. */}
          <ViewToggle
            options={[{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
            viewMode={layer.closed ? 'closed' : 'open'}
            onViewChange={(v) => setProp('closed', v === 'closed')}
          />
        </InspectorSection>
      )}

      <ParamsLink layer={layer} />

      {layer.type === 'group' && (
        <InspectorSection pane label="Group">
          <GroupFields layer={layer} ungroupLayer={ungroupLayer} />
        </InspectorSection>
      )}
    </div>
  )
}

/* Small right-aligned header-row icon button (Section `actions`). */
function SectionIconBtn({ label, icon, onClick, active = false, refProps = {} }) {
  return (
    <Tooltip asChild label={label}>
      <Button tone="ghost" quiet size="sm" iconOnly={icon} aria-label={label} pressed={active} onClick={onClick} {...refProps} />
    </Tooltip>
  )
}

/* Appearance — the Figma shape: eye (visibility) + drop (blend popover) in
 * the header, Opacity and Corner-radius as INPUTS in the body (no sliders
 * for one-shot values — user ruling 2026-08-12). Radius only where the
 * renderer honors it (rect shapes). */
function AppearanceSection({ layer, setProp, first }) {
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
    <InspectorSection pane
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
            variant="property" size="sm" unit="%" className="w-full min-w-0"
            affordance={<Icon name="opacity" size={glyphSize('sm')} />}
            value={Math.round((layer.opacity ?? 1) * 100)}
            onCommit={(raw) => setProp('opacity', clamp01(raw, layer.opacity ?? 1))}
          />
        </Tooltip>
        {hasRadius && (
          <Tooltip label="Corner radius" triggerClassName="flex min-w-0">
            <NumberField
              variant="property" size="sm" className="w-full min-w-0"
              affordance={<Icon name="corner-radius" size={glyphSize('sm')} />}
              value={Math.round(layer.radius ?? 0)}
              onCommit={(raw) => {
                const n = Number(raw)
                setProp('radius', Number.isFinite(n) && n > 0 ? Math.round(n) : 0)
              }}
            />
          </Tooltip>
        )}
      </div>
      {/* WHERE THE COLOUR IS (the user's 20, 2026-10-09: "shapes have no color parameters"). Paint
          left the inspector by the 2026-09-27 ruling — it is the left rail's Colour and Stroke
          panels — and nothing here said so. The layer's own fill and stroke, read-only, and the
          door to the panel that edits them. */}
      {'color' in layer && (
        <div className="flex items-center gap-2 pt-1">
          <ColorSwatch hex={resolveColor(layer.color, palette) ?? '#FFFFFF'} size={14} hoverable={false} />
          <span className="kol-helper-10 text-meta">Fill</span>
          <ColorSwatch hex={resolveColor(layer.stroke, palette) ?? '#FFFFFF'} size={14} showTransparent={!layer.stroke} hoverable={false} />
          <span className="kol-helper-10 text-meta">Stroke</span>
          <Button tone="ghost" quiet size="xs" className="ms-auto" onClick={() => window.dispatchEvent(new CustomEvent('kol:open-color-modal'))}>Colour…</Button>
        </div>
      )}
    </InspectorSection>
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
    <InspectorSection pane label="Parameters">
      <Tooltip label={layer.type === 'pattern' ? 'Open the Pattern tab' : 'Open the Parameters tab'}><Button aria-label={layer.type === 'pattern' ? 'Open the Pattern tab' : 'Open the Parameters tab'}
        tone="primary" size="sm" className="w-full"
        onClick={openParams}
      >
        {labelFor(layer)}
      </Button></Tooltip>
    </InspectorSection>
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
        tone="primary"
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
          tone="primary" size="sm" iconLeft="upload" iconSize={12}
          className="flex-1"
          onClick={() => fileRef.current?.click()}
        >
          {layer.src ? 'Replace' : 'Upload image'}
        </Button>
        <Button
          tone="primary" size="sm"
          className="flex-1"
          onClick={() => setPickerOpen(true)}
        >
          Library
        </Button>
        {layer.src && (
          <Tooltip label="Clear image"><Button
            tone="primary" size="sm" iconOnly="trash" iconSize={12}
            aria-label="Clear image"
            onClick={onClear}
          /></Tooltip>
        )}
      </div>
      {/* the DS modal library (2026-10-07) — the editor's own picker is retired; a media layer takes image or video */}
      <MediaLibrary variant="modal" open={pickerOpen} client={getMediaClient()} accept={['image', 'video']} onClose={() => setPickerOpen(false)} onSelect={onLibraryPick} />
    </LabeledControl>
  )
}


/* AxisField — one axis value on the DS property field (PropertyField ticket,
 * adopted): affordance inside the shell, the value hugs its own length, the
 * unit sits against it (`0°`). Draft/commit via NumberField so a bare '-'
 * never reshapes the layer. String affordances get 4px extra air — the
 * shipped 6px reads glued against mono digits (the "balanced" ref). */
function AxisField({ label, value, onCommit, suffix, tooltip }) {
  return (
    <Tooltip label={tooltip} triggerClassName="flex flex-1 min-w-0">
    <NumberField
      variant="property" size="sm"
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
        <AxisField label="W" tooltip="Width" value={Math.round(layer.w)} onCommit={onChangeW} />
        <AxisField label="H" tooltip="Height" value={Math.round(layer.h)} onCommit={onChangeH} />
      </div>
      {/* Constrain proportions (editor review #6, 2026-09-27 — user: "just use a lock or something
        * more common"): a KOL Button on the inputs' rung, a lock that closes when constrained. It was
        * a raw <button> inking a corner glyph `fg` from its wrapper. */}
      <Tooltip label={aspectLocked ? 'Unconstrain proportions' : 'Constrain proportions'}>
        <Button tone="ghost" size="sm" iconOnly={aspectLocked ? 'lock' : 'unlock'} pressed={aspectLocked}
          aria-label={aspectLocked ? 'Unconstrain proportions' : 'Constrain proportions'} onClick={toggleLock} />
      </Tooltip>
    </div>
  )
}

/* ColorField extracted to ./ColorField; re-exported (imported at top) so
 * existing importers (CanvasInspector, TypeControls, pattern/ColorPicker)
 * keep working. */
export { ColorField }
