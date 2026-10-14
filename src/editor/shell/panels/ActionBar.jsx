import { useEffect, useRef } from 'react'
import { ToolPalette as DsToolPalette } from '@kolkrabbi/kol-component'
import { useComposeState, COVER_TYPES, CANVAS_W, CANVAS_H } from '../../compose/state'
import { findLayerDeep } from '../../compose/helpers'
import { isBooleanable } from '../../compose/boolean-ops'
import { key, BOOLEANS, DIVIDER } from './toolItems'

/**
 * ActionBar — THE ACTIONS, in the full-width band under the menu bar (plan 31 § 2; Affinity's
 * toolbar): Rotate ▾ · Boolean ▾ │ Insert image · Crop · Duplicate. What is the editor's: the compose
 * actions and WHEN each is disabled — KOL renders the row, the folds, the tooltips (with the key as a
 * chip) and the pinned-square rung (`md`: 32px square, 20px glyph). The tools are the strip's.
 */
export default function ActionBar() {
  const { layers, selectedId, selectedIds, flipSelected, duplicateLayer, updateLayer, addLayer, booleanSelected } = useComposeState()

  const selectedLayer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const canXform = !!selectedLayer && !COVER_TYPES.includes(selectedLayer.type) && !selectedLayer.locked
  const canBool  = layers.filter((l) => selectedIds.includes(l.id) && isBooleanable(l)).length >= 2

  const rotateBy = (delta) => {
    const rot = selectedLayer.rotation ?? 0
    updateLayer(selectedLayer.id, { rotation: ((Math.round(rot + delta) % 360) + 360) % 360 })
  }

  /* Insert image — a picked file becomes a photo layer, contained to 720px and centred. */
  const fileRef = useRef(null)
  /* Layer › New › Photo… (plan 28) opens the same picker — dispatched inside the menu click, so the
     input still has the user's activation */
  useEffect(() => {
    const on = () => fileRef.current?.click()
    window.addEventListener('kol:insert-image', on)
    return () => window.removeEventListener('kol:insert-image', on)
  }, [])
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

  /* ONE lock rule (audit B2/B8, 2026-10-09): a locked layer refuses every transform — flip,
     rotate, nudge, delete, duplicate — not half of them. `canXform` carries it. The fold's
     trigger re-runs the last-picked turn. */
  /* THE FOLD OPENS WHATEVER APPLIES (plan 30 § 12, kol-component 0.253.0): `disabled` on the fold
     disarms only its trigger's action; each row greys itself, never hidden */
  const items = [
    { kind: 'split', id: 'rotate-fold', label: 'Rotate', action: true, disabled: !canXform, variants: [
      { id: 'rotate-left', icon: 'rotate-left', label: 'Rotate 90° left', disabled: !canXform },
      { id: 'rotate-right', icon: 'rotate-right', label: 'Rotate 90° right', disabled: !canXform },
      { id: 'flip-horizontal', icon: 'flip-horizontal', label: 'Flip horizontal', shortcut: key('flip-h'), disabled: !canXform },
      { id: 'flip-vertical', icon: 'flip-vertical', label: 'Flip vertical', shortcut: key('flip-v'), disabled: !canXform },
    ] },
    { kind: 'split', id: 'boolean-fold', label: 'Boolean', action: true, variants: BOOLEANS.map((b) => ({ ...b, disabled: !canBool })), disabled: !canBool },
    DIVIDER,
    { kind: 'action', id: 'image', icon: 'image', label: 'Insert image' },
    { kind: 'action', id: 'crop', icon: 'crop', label: 'Crop image', disabled: selectedLayer?.type !== 'photo' || selectedLayer?.locked },
    { kind: 'action', id: 'duplicate', icon: 'copy', label: 'Duplicate', shortcut: key('duplicate'), disabled: !selectedLayer || selectedLayer.locked },
  ]

  function onAction(id) {
    if (id === 'flip-horizontal') flipSelected('h')
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
      <DsToolPalette items={items} activeId={null} onSelect={onAction} onAction={onAction} size="md" className="px-1" />
      <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
    </>
  )
}
