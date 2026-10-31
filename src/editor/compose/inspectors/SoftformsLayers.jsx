import { useEffect, useState } from 'react'
import { Button, Dropdown, LabeledControl, Slider, StepList, Tooltip } from '@kolkrabbi/kol-component'
import { useComposeState } from '../state'
import { useLayerEdit } from '../useLayerEdit'
import { mulberry32, randomSeed } from '../../lib/rng'

/**
 * SoftformsLayers — the per-form Layers surface for a Soft Forms (2D / 3D)
 * loop layer, ported from labs SoftFormsPage's Layers tab (add/dup/delete/
 * reorder up to 5 forms, plus the selected form's transform controls) and
 * SoftForms3DPage's structural randomisers.
 *
 * A softforms layer already carries an editable `forms` array as an off-schema
 * layer prop (catalog SOFTFORMS_PRESETS pass `forms: s.forms`; the engine's
 * setParams reads `layer.forms` every frame). This panel is the UI over that
 * same array — no engine-contract change. Mounted in ParametersPanel's
 * Generate tab for the softforms / softforms3d loops.
 *
 * Writes:
 *   • structural (add / duplicate / delete / reorder / type / rolls) →
 *     updateLayer (discrete: one undo entry per action)
 *   • the selected form's transform sliders → useLayerEdit coalesce (one
 *     undo entry per drag)
 * Selection is local UI state, synced with the on-canvas handle overlay
 * (SoftformsHandleOverlay) both ways via kol:softform-select. The 2D layer's
 * "Edit forms on canvas" button flips CanvasArea into handle-edit mode via
 * kol:softform-edit (mirrors the kinetic kol:kinetic-edit idiom).
 */

const MAX_FORMS = 5

const TYPE_OPTS_2D = [
  { value: 'teardrop', label: 'Teardrop' },
  { value: 'pill', label: 'Pill' },
  { value: 'dome', label: 'Dome' },
  { value: 'orb', label: 'Orb' },
  { value: 'super', label: 'Lozenge' },
]
const TYPE_OPTS_3D = [
  { value: 'sphere', label: 'Sphere' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'teardrop', label: 'Teardrop' },
  { value: 'lozenge', label: 'Lozenge' },
]

/* Selected-form transform controls — 3D inserts Z position + Scale Z. */
const CTRL_2D = [
  { k: 'x', label: 'Position X', min: -1, max: 1, step: 0.01, def: 0 },
  { k: 'y', label: 'Position Y', min: -1, max: 1, step: 0.01, def: 0 },
  { k: 'sx', label: 'Scale X', min: 0.12, max: 1.6, step: 0.01, def: 0.6 },
  { k: 'sy', label: 'Scale Y', min: 0.12, max: 1.6, step: 0.01, def: 0.6, fallback: 'sx' },
  { k: 'rot', label: 'Rotation', min: 0, max: 360, step: 1, def: 0 },
  { k: 'hue', label: 'Hue', min: 0, max: 1, step: 0.01, def: 0 },
]
const CTRL_3D = [
  { k: 'x', label: 'Position X', min: -1.2, max: 1.2, step: 0.01, def: 0 },
  { k: 'y', label: 'Position Y', min: -1.2, max: 1.2, step: 0.01, def: 0 },
  { k: 'z', label: 'Position Z', min: -1.2, max: 1.2, step: 0.01, def: 0 },
  { k: 'sx', label: 'Scale X', min: 0.12, max: 1.6, step: 0.01, def: 0.7 },
  { k: 'sy', label: 'Scale Y', min: 0.12, max: 1.6, step: 0.01, def: 0.7, fallback: 'sx' },
  { k: 'sz', label: 'Scale Z', min: 0.12, max: 1.6, step: 0.01, def: 0.7, fallback: 'sx' },
  { k: 'rot', label: 'Rotation', min: 0, max: 360, step: 1, def: 0 },
  { k: 'hue', label: 'Hue', min: 0, max: 1, step: 0.01, def: 0 },
]

const TAU = Math.PI * 2
import { clamp } from '../../../loops/lib/util'
import { useControlSize } from '../../params/controlSize'
const round2 = (v) => Math.round(v * 100) / 100
const rnd = (rng, a, b) => a + rng() * (b - a)
/* Uniform point in a disk (2D) / ball (3D) — labs inBall (z squashed ×0.8). */
const inDisk = (rng, R) => { const r = R * Math.sqrt(rng()), th = rng() * TAU; return [r * Math.cos(th), r * Math.sin(th)] }
const inBall = (rng, R) => {
  const r = R * Math.cbrt(rng()), th = rng() * TAU, ph = Math.acos(2 * rng() - 1)
  return [r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) * 0.8]
}
const recenter2 = (arr) => {
  const n = arr.length || 1
  const c = arr.reduce((a, f) => ({ x: a.x + f.x / n, y: a.y + f.y / n }), { x: 0, y: 0 })
  return arr.map((f) => ({ ...f, x: round2(f.x - c.x), y: round2(f.y - c.y) }))
}
const recenter3 = (arr) => {
  const n = arr.length || 1
  const c = arr.reduce((a, f) => ({ x: a.x + f.x / n, y: a.y + f.y / n, z: a.z + f.z / n }), { x: 0, y: 0, z: 0 })
  return arr.map((f) => ({ ...f, x: round2(f.x - c.x), y: round2(f.y - c.y), z: round2(f.z - c.z) }))
}

const labelOf = (opts, t) => opts.find((o) => o.value === t)?.label ?? t

export default function SoftformsLayers({ layer }) {
  const cs = useControlSize()
  const { updateLayer } = useComposeState()
  const edit = useLayerEdit(layer.id, { history: 'coalesce' })

  const is3d = layer.loopId === 'softforms3d'
  const metaball = is3d && !!layer.metaball
  const typeOpts = is3d ? TYPE_OPTS_3D : TYPE_OPTS_2D
  const ctrls = is3d ? CTRL_3D : CTRL_2D
  const minForms = metaball ? 2 : 1

  const forms = Array.isArray(layer.forms) ? layer.forms : []

  /* Selected form — local UI state, synced with the canvas handle overlay. */
  const [sel, setSel] = useState(-1)
  const selForm = sel >= 0 && sel < forms.length ? forms[sel] : null
  const selectForm = (i) => {
    setSel(i)
    window.dispatchEvent(new CustomEvent('kol:softform-select', { detail: { id: layer.id, index: i, from: 'panel' } }))
  }
  useEffect(() => {
    const onSel = (e) => { if (e.detail?.id === layer.id && e.detail.from === 'canvas') setSel(e.detail.index) }
    window.addEventListener('kol:softform-select', onSel)
    return () => window.removeEventListener('kol:softform-select', onSel)
  }, [layer.id])

  /* Structural writes → discrete (one undo each); slider writes → coalesced. */
  const writeForms = (next) => updateLayer(layer.id, { forms: next })
  const updSel = (k, v) => edit.patch({ forms: forms.map((f, i) => (i === sel ? { ...f, [k]: v } : f)) })

  const addForm = () => {
    if (forms.length >= MAX_FORMS) return
    const f = is3d
      ? { t: 'sphere', x: 0, y: 0, z: 0, sx: 0.7, sy: 0.7, sz: 0.7, rot: 0, hue: round2(Math.random()) }
      : { t: 'dome', x: 0, y: 0, sx: 0.6, sy: 0.6, rot: 0, hue: round2(Math.random()) }
    writeForms([...forms, f])
    selectForm(forms.length)
  }
  const dupForm = (i) => {
    if (forms.length >= MAX_FORMS) return
    const c = { ...forms[i], x: clamp((forms[i].x ?? 0) + 0.12, -1.2, 1.2), y: clamp((forms[i].y ?? 0) - 0.1, -1.2, 1.2) }
    writeForms([...forms.slice(0, i + 1), c, ...forms.slice(i + 1)])
    selectForm(i + 1)
  }
  const delForm = (i) => {
    if (forms.length <= minForms) return
    writeForms(forms.filter((_, k) => k !== i))
    selectForm(-1)
  }
  const swapForm = (i, j) => {
    if (j < 0 || j >= forms.length) return
    const n = [...forms]; [n[i], n[j]] = [n[j], n[i]]; writeForms(n)
    selectForm(j)
  }

  /* ── Scoped / structural randomisers (labs softforms rolls + 3D Rearrange).
   * Each press seeds a fresh mulberry32; one discrete undo entry. ── */
  const rollColor = () => { const rng = mulberry32(randomSeed()); writeForms(forms.map((f) => ({ ...f, hue: round2(rng()) }))) }
  const rollTransform = () => {
    const rng = mulberry32(randomSeed())
    writeForms(forms.map((f) => (is3d
      ? { ...f, x: round2(rnd(rng, -0.7, 0.7)), y: round2(rnd(rng, -0.7, 0.7)), z: round2(rnd(rng, -0.5, 0.5)), rot: Math.round(rnd(rng, 0, 360)) }
      : { ...f, x: round2(rnd(rng, -0.55, 0.55)), y: round2(rnd(rng, -0.75, 0.75)), rot: Math.round(rnd(rng, 0, 360)) })))
  }
  const rollScale = () => {
    const rng = mulberry32(randomSeed())
    writeForms(forms.map((f) => {
      const sx = round2(rnd(rng, 0.35, 0.95)), sy = round2(rnd(rng, 0.35, 0.95))
      return is3d ? { ...f, sx, sy, sz: round2(rnd(rng, 0.35, 0.95)) } : { ...f, sx, sy }
    }))
  }
  const rollAnim = () => {
    const rng = mulberry32(randomSeed())
    updateLayer(layer.id, { motion: round2(rnd(rng, 0, 1.1)), sweep: Math.round(rnd(rng, 0, 360)) })
  }
  /* Rearrange = a fresh N-form arrangement (2–5). Metaballs rebuild as spheres
   * at necking distance (labs SoftForms3DPage rollTransform); discrete forms
   * keep their shapes but jump to fresh placement (recentred). */
  const rollRearrange = () => {
    const rng = mulberry32(randomSeed())
    if (is3d) {
      if (metaball) {
        const N = 2 + Math.floor(rng() * 4), R = rnd(rng, 0.45, 0.9)
        writeForms(recenter3(Array.from({ length: N }, (_, i) => {
          const [x, y, z] = inBall(rng, R), s = round2(rnd(rng, 0.5, 0.92))
          return { t: 'sphere', x: round2(x), y: round2(y), z: round2(z), sx: s, sy: s, sz: s, rot: 0, hue: round2(i / N) }
        })))
      } else {
        const R = rnd(rng, 0.6, 1.15)
        writeForms(recenter3(forms.map((f) => { const [x, y, z] = inBall(rng, R); return { ...f, x: round2(x), y: round2(y), z: round2(z), rot: Math.round(rnd(rng, 0, 360)) } })))
      }
      return
    }
    const N = 2 + Math.floor(rng() * 4), R = rnd(rng, 0.45, 0.85)
    writeForms(recenter2(Array.from({ length: N }, (_, i) => {
      const [x, y] = inDisk(rng, R)
      return {
        t: TYPE_OPTS_2D[Math.floor(rng() * TYPE_OPTS_2D.length)].value,
        x: round2(x), y: round2(y),
        sx: round2(rnd(rng, 0.4, 0.85)), sy: round2(rnd(rng, 0.4, 0.85)),
        rot: Math.round(rnd(rng, 0, 360)), hue: round2(i / N),
      }
    })))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="kol-eyebrow text-fg-80">Forms</span>

      {/* Rows: reversed so the topmost (last-painted) form sits at the top
          of the list (labs Layers order). */}
      {/* KOL StepList with row slots (kol-component 0.330, the ItemList ticket — plan 51 4.3). Rows are reversed so the
          topmost (last-painted) form sits at the top (labs Layers order); `d` is the row, `n - 1 - d` the form. */}
      <StepList
        size={cs}
        reorder="grab" /* the drag handle — StepList's arrows grey out at the ends (plan 51 3.1) */
        activeIndex={sel >= 0 ? forms.length - 1 - sel : null}
        items={forms.map((_, d) => {
          const i = forms.length - 1 - d
          return {
            id: i, label: labelOf(typeOpts, forms[i].t),
            actions: [
              { icon: 'copy', label: 'Duplicate form', hidden: forms.length >= MAX_FORMS, onClick: () => dupForm(i) },
              { icon: 'trash', label: 'Delete form', hidden: forms.length <= minForms, onClick: () => delForm(i) },
            ],
          }
        })}
        onSelect={(d) => selectForm(forms.length - 1 - d)}
        onMove={(from, to) => swapForm(forms.length - 1 - from, forms.length - 1 - to)}
      />

      {/* at the cap there is nothing to add — not drawn (plan 51 3.1) */}
      {forms.length < MAX_FORMS && (
        <Button
          tone="primary" size={cs} className="w-full" iconLeft="plus" iconSize={12}
          onClick={addForm}
        >
          Add form
        </Button>
      )}

      {!is3d && (
        <Tooltip label="Edit forms on the canvas (click to select, drag to move, corners to scale, knob to rotate)"><Button aria-label="Edit forms on the canvas (click to select, drag to move, corners to scale, knob to rotate)"
          tone="primary" size={cs} className="w-full"
          onClick={() => window.dispatchEvent(new CustomEvent('kol:softform-edit', { detail: { id: layer.id, index: Math.max(0, sel) } }))}
        >
          Edit forms on canvas
        </Button></Tooltip>
      )}

      {selForm && (
        <div className="flex flex-col gap-2 pt-1">
          <span className="kol-eyebrow text-fg-80">Selected form</span>
          <LabeledControl label="Type">
            <Dropdown
              variant="subtle" size={cs} className="w-full"
              options={typeOpts} value={selForm.t}
              onChange={(v) => writeForms(forms.map((f, i) => (i === sel ? { ...f, t: v } : f)))}
            />
          </LabeledControl>
          {ctrls.map((c) => {
            const raw = selForm[c.k] ?? (c.fallback ? selForm[c.fallback] : undefined)
            const value = typeof raw === 'number' ? raw : c.def
            return (
              <LabeledControl key={c.k} label={c.label}>
                <Slider min={c.min} max={c.max} step={c.step} value={value} onChange={(v) => updSel(c.k, v)} />
              </LabeledControl>
            )
          })}
        </div>
      )}

      <span className="kol-helper-10 text-meta pt-1">Randomize forms</span>
      <div className="grid grid-cols-2 gap-2">
        <Button tone="primary" size={cs} onClick={rollColor}>Color</Button>
        <Button tone="primary" size={cs} onClick={rollTransform}>Transform</Button>
        <Button tone="primary" size={cs} onClick={rollScale}>Scale</Button>
        <Button tone="primary" size={cs} onClick={rollAnim}>Animation</Button>
      </div>
      <Button tone="primary" size={cs} className="w-full" onClick={rollRearrange}>Rearrange</Button>
    </div>
  )
}
