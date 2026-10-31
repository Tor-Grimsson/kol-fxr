import { BezierPathEditor, LabeledControl } from '@kolkrabbi/kol-component'
import { useControlSize } from '../../params/controlSize'
import { DEFAULT_CURVE } from '../../../loops/pattern/fields/organicField.js'

/**
 * ProfileEditor — editable bezier profile for the organic band edge, ported
 * from labs (kol-labs-single/src/pages/loops/ProfileEditor.jsx, verbatim
 * geometry). Nodes carry in/out handle offsets (hl/hr); the path is
 * cubic-bezier between them. Normalized space: x ∈ [0,1] (one period) ·
 * y ∈ [-1,1]. Endpoints (x=0,1) are x-locked and share y so the profile
 * tiles seamlessly. Drag anchors + handles; double-click bg to add a node,
 * double-click an inner anchor to remove it.
 *
 * The engine side already ships in this repo — organicField.js bakes the
 * node array (`waveCurve`) to a LUT via sampleCurveLUT/customWave when
 * waveProfile === 'custom'.
 */
import { clamp } from '../../../loops/lib/util'

/* THE EDITOR IS KOL's BezierPathEditor (kol-component 0.330, plan 51 4.4). fxr keeps its value — y ∈ −1…1 up, handles
   as hlx/hly/hrx/hry — and its rules, applied in onChange: the ends sit at x 0 and 1 and share y (the profile tiles),
   inner nodes stay between their neighbours, never fewer than 3 nodes, never an end removed. */
const toKol = (nodes) => nodes.map((n) => ({
  x: n.x, y: (1 - n.y) / 2,
  hl: { x: n.hlx ?? 0, y: -(n.hly ?? 0) / 2 }, hr: { x: n.hrx ?? 0, y: -(n.hry ?? 0) / 2 },
}))
const fromKol = (pts) => pts.map((p) => ({
  x: p.x, y: clamp(1 - 2 * p.y, -1, 1),
  hlx: p.hl?.x ?? 0, hly: -2 * (p.hl?.y ?? 0), hrx: p.hr?.x ?? 0, hry: -2 * (p.hr?.y ?? 0),
}))

export default function ProfileEditor({ value, onChange }) {
  const nodes = (Array.isArray(value) && value.length > 1) ? value : DEFAULT_CURVE
  const cs = useControlSize()
  const change = (pts) => {
    const next = fromKol(pts)
    if (next.length < 3 || next[0].x > 0.001 || next[next.length - 1].x < 0.999) return /* an end was removed — refuse */
    next[0].x = 0; next[next.length - 1].x = 1
    /* the end that moved decides the shared y */
    const moved = Math.abs(next[0].y - nodes[0].y) > 1e-6 ? next[0].y : next[next.length - 1].y
    next[0].y = moved; next[next.length - 1].y = moved
    for (let i = 1; i < next.length - 1; i++) next[i].x = clamp(next[i].x, next[i - 1].x + 0.02, 0.98)
    onChange(next)
  }
  return <BezierPathEditor value={toKol(nodes)} onChange={change} aspect={2} size={cs} minPoints={3} ariaLabel="Profile curve" />
}

/**
 * OrganicProfileEditor — the pattern-rules mount wrapper: shows the curve
 * editor only on organic field layers with waveProfile === 'custom' (the
 * schema dropdown's Custom option, patternLoop PROFILE_OPTIONS). Drag writes
 * ride the coalesced `patch` (one undo per drag). A just-picked Custom with
 * no curve yet displays DEFAULT_CURVE (a sine-shaped seed — matching
 * drawOrganic's sine fallback for a null waveCurve); the first drag persists
 * the full node array.
 */
export function OrganicProfileEditor({ layer, patch }) {
  if (layer.render !== 'field' || layer.field !== 'organic' || layer.waveProfile !== 'custom') return null
  const value = (Array.isArray(layer.waveCurve) && layer.waveCurve.length > 1) ? layer.waveCurve : DEFAULT_CURVE
  return (
    <LabeledControl label="Profile curve">
      <ProfileEditor value={value} onChange={(c) => patch({ waveCurve: c })} />
    </LabeledControl>
  )
}
