import { useRef } from 'react'
import { ToolPalette as DsToolPalette } from '@kolkrabbi/kol-component'
import { TOOL_META, useTool } from '../../state/tools'
import { useComposeState, COVER_TYPES, CANVAS_W, CANVAS_H } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import { isBooleanable } from '../../compose/boolean-ops'
import { pack } from '../../packs'

/**
 * ToolPalette — the editor's tool bar on kol-component's `ToolPalette` (lifted from this file,
 * editor-panels-the-held-specs A3; editor DS sync phase 3b, 2026-09-27 — this file carried its own
 * buttons, three hand-built fold menus and a divider). What is the editor's: the tool store, the
 * compose actions, and WHEN each item is disabled — KOL renders the row, the folds, the tooltips
 * (with the key as a chip) and the pinned-square rung (`md`: 32px square, 20px glyph).
 */
const tool = (id) => ({ kind: 'tool', id, label: TOOL_META[id].label, icon: TOOL_META[id].icon, shortcut: TOOL_META[id].shortcut || undefined })
const variant = (id) => ({ id, label: TOOL_META[id].label, icon: TOOL_META[id].icon, shortcut: TOOL_META[id].shortcut || undefined })
const SHAPES = ['rect', 'ellipse', 'triangle', 'line', 'polygon', 'star'].map(variant)
const BOOLEANS = [
  { id: 'unite', icon: 'boolean-unite', label: 'Unite' },
  { id: 'subtract', icon: 'boolean-subtract', label: 'Subtract front' },
  { id: 'intersect', icon: 'boolean-intersect', label: 'Intersect' },
  { id: 'exclude', icon: 'boolean-exclude', label: 'Exclude' },
]
const DIVIDER = { kind: 'divider' }

export default function ToolPalette() {
  const { tool: active, setTool } = useTool()
  const {
    layers, selectedId, selectedIds,
    flipSelected, duplicateLayer, updateLayer, addLayer, booleanSelected,
  } = useComposeState()

  const selectedLayer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const hasSel   = selectedIds.some((id) => id !== 'canvas')
  const canXform = !!selectedLayer && !COVER_TYPES.includes(selectedLayer.type) && !selectedLayer.locked
  const canBool  = layers.filter((l) => selectedIds.includes(l.id) && isBooleanable(l)).length >= 2

  const rotateBy = (delta) => {
    const rot = selectedLayer.rotation ?? 0
    updateLayer(selectedLayer.id, { rotation: ((Math.round(rot + delta) % 360) + 360) % 360 })
  }

  /* Insert image — a picked file becomes a photo layer, contained to 720px and centred. */
  const fileRef = useRef(null)
  const onPickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''  /* allow re-picking the same file */
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) return
        const k = Math.min(1, 720 / img.naturalWidth, 720 / img.naturalHeight)
        const w = Math.round(img.naturalWidth * k)
        const h = Math.round(img.naturalHeight * k)
        addLayer('photo', { src: reader.result, x: Math.round((CANVAS_W - w) / 2), y: Math.round((CANVAS_H - h) / 2), w, h, fit: 'cover' })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const items = [
    tool('select'),
    { kind: 'split', id: 'text-fold', label: 'Text', variants: [
      variant('text'),
      /* kinetic type is the motion pack's (editor/packs.js) — a one-shot row in the tool fold */
      ...(pack('motion') ? [{ id: 'kinetic', label: 'Kinetic type', icon: 'type', action: true }] : []),
    ] },
    tool('pen'),
    { kind: 'split', id: 'shape-fold', label: 'Shape', variants: SHAPES },
    tool('pattern'),
    tool('zoom'),
    tool('orbit'),
    DIVIDER,
    { kind: 'action', id: 'flip-horizontal', icon: 'flip-horizontal', label: 'Flip horizontal', shortcut: '⇧H', disabled: !hasSel },
    { kind: 'action', id: 'flip-vertical', icon: 'flip-vertical', label: 'Flip vertical', shortcut: '⇧V', disabled: !hasSel },
    { kind: 'action', id: 'rotate-left', icon: 'rotate-left', label: 'Rotate 90° left', disabled: !canXform },
    { kind: 'action', id: 'rotate-right', icon: 'rotate-right', label: 'Rotate 90° right', disabled: !canXform },
    DIVIDER,
    { kind: 'split', id: 'boolean-fold', label: 'Boolean', action: true, variants: BOOLEANS, disabled: !canBool },
    DIVIDER,
    { kind: 'action', id: 'image', icon: 'image', label: 'Insert image' },
    { kind: 'action', id: 'crop', icon: 'crop', label: 'Crop image', disabled: selectedLayer?.type !== 'photo' || selectedLayer?.locked },
    { kind: 'action', id: 'duplicate', icon: 'copy', label: 'Duplicate', shortcut: '⌘D', disabled: !selectedLayer },
  ]

  const onAction = (id) => {
    if (id === 'kinetic') addLayer('kinetic')
    else if (id === 'flip-horizontal') flipSelected('h')
    else if (id === 'flip-vertical') flipSelected('v')
    else if (id === 'rotate-left') rotateBy(-90)
    else if (id === 'rotate-right') rotateBy(90)
    else if (BOOLEANS.some((b) => b.id === id)) booleanSelected(id)
    else if (id === 'image') fileRef.current?.click()
    else if (id === 'crop') window.dispatchEvent(new CustomEvent('kol:enter-crop', { detail: selectedLayer.id }))
    else if (id === 'duplicate') duplicateLayer(selectedLayer.id)
  }

  return (
    <>
      <DsToolPalette items={items} activeId={active} onSelect={setTool} onAction={onAction}
        size="md" className="px-3 h-12" />
      <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
    </>
  )
}
