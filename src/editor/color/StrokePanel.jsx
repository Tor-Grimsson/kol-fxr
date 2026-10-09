import { SettingsRow } from '@kolkrabbi/kol-component'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { useComposeState } from '../compose/state'
import { findLayerDeep } from '../compose/helpers'
import { useLayerEdit } from '../compose/useLayerEdit'
import { NumberField } from '../compose/inspectors/NumberField'
import { useControlSize, RAIL_LABEL_W } from '../params/controlSize'

/**
 * StrokePanel — weight + style controls for the selected layer's stroke.
 *
 * Strokeable layer types: shape (any kind — rect/ellipse/logo/flatten),
 * text (CSS -webkit-text-stroke), pattern (cascades through the tile's
 * SVG paths). Background is skipped (no stroke concept).
 *
 * `style` maps to `strokeDasharray`:
 *   solid  → ''
 *   dashed → '8 6'
 *   dotted → '2 6' + strokeLinecap='round' (circular dots)
 *
 * Dash / cap / join apply via SVG attribute cascade for shape + pattern;
 * they're stored but have no visual effect on text (CSS text-stroke has no
 * dash). Acceptable — data is preserved if the layer is later flattened or
 * exported with a different renderer.
 */

const STYLE_OPTIONS = [
  { value: 'solid',  label: <LinePreview />,            ariaLabel: 'Solid'  },
  { value: 'dashed', label: <LinePreview dash="4 3" />, ariaLabel: 'Dashed' },
  { value: 'dotted', label: <DotsPreview />,            ariaLabel: 'Dotted' },
]

function LinePreview({ dash }) {
  return (
    <svg width="40" height="2" viewBox="0 0 40 2" className="block">
      <line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray={dash} />
    </svg>
  )
}

function DotsPreview() {
  return (
    <svg width="40" height="3" viewBox="0 0 40 3" className="block">
      {[3, 11, 19, 27, 35].map((cx) => (
        <circle key={cx} cx={cx} cy="1.5" r="1.25" fill="currentColor" />
      ))}
    </svg>
  )
}

const CAP_OPTIONS  = [
  { value: 'butt',   label: 'Butt'   },
  { value: 'round',  label: 'Round'  },
  { value: 'square', label: 'Square' },
]
const JOIN_OPTIONS = [
  { value: 'miter', label: 'Miter' },
  { value: 'round', label: 'Round' },
  { value: 'bevel', label: 'Bevel' },
]
const DASH_FOR_STYLE = { solid: '', dashed: '8 6', dotted: '2 6' }
function styleFromDash(dash, cap) {
  if (!dash) return 'solid'
  if (cap === 'round' && /^[0-2]\s+[3-9]/.test(dash)) return 'dotted'
  return 'dashed'
}

const STROKEABLE_TYPES = new Set(['shape', 'text', 'pattern'])

const NOOP = () => {}

export function StrokeBody() {
  const cs = useControlSize()
  const { selectedId, layers, palette } = useComposeState()
  const layer = selectedId && selectedId !== 'canvas' ? findLayerDeep(layers, selectedId) : null
  const isStrokeable = layer && STROKEABLE_TYPES.has(layer.type) && !layer.locked /* one lock rule */

  /* Coalesce so weight-input typing flurries collapse to one undo entry —
   * symmetric with how the LayerInspector edits other layer fields. The
   * style/cap/join toggles benefit too: rapid clicks bundle into one entry. */
  const edit = useLayerEdit(isStrokeable ? layer.id : null, { history: 'coalesce' })
  const setProp = isStrokeable ? edit.setProp : NOOP
  const weight  = layer?.strokeWidth     ?? 0
  const dash    = layer?.strokeDasharray ?? ''
  const cap     = layer?.strokeLinecap   ?? 'butt'
  const join    = layer?.strokeLinejoin  ?? 'miter'
  const style   = styleFromDash(dash, cap)

  const onWeight = (v) => {
    const n = Math.max(0, Math.min(64, Number(v) || 0))
    /* a weight on a fill-only layer gives it a stroke to draw (new shapes carry none — the user's 7) */
    if (n > 0 && isStrokeable && !layer.stroke) edit.patch({ strokeWidth: n, stroke: '#000000' })
    else setProp('strokeWidth', n)
  }
  const onStyle = (s) => {
    if (!isStrokeable) return
    edit.patch({
      strokeDasharray: DASH_FOR_STYLE[s] ?? '',
      strokeLinecap:   s === 'dotted' ? 'round' : (cap === 'round' && s !== 'dotted' ? 'butt' : cap),
    })
  }

  return (
    <div className="p-4 flex flex-col gap-2">
      {/* the rail's one row (spec R5): uppercase label in the 112 column; the weight field as
          wide as "12.5" + its unit (R6.1) — it was a w-24 box; the strips on the rail's rung (R6.3) */}
      <SettingsRow label="Weight" align="fill" labelWidth={RAIL_LABEL_W}>
        <NumberField variant="filled" size={cs} suffix="pt" chars={4} value={weight} onCommit={onWeight} />
      </SettingsRow>
      <SettingsRow label="Style" align="fill" labelWidth={RAIL_LABEL_W}><SegmentedToggle tone="sunken" size={cs} className="w-full" value={style} onChange={onStyle} options={STYLE_OPTIONS} /></SettingsRow>
      <SettingsRow label="Cap" align="fill" labelWidth={RAIL_LABEL_W}><SegmentedToggle tone="sunken" size={cs} className="w-full" value={cap} onChange={(v) => setProp('strokeLinecap', v)} options={CAP_OPTIONS} /></SettingsRow>
      <SettingsRow label="Join" align="fill" labelWidth={RAIL_LABEL_W}><SegmentedToggle tone="sunken" size={cs} className="w-full" value={join} onChange={(v) => setProp('strokeLinejoin', v)} options={JOIN_OPTIONS} /></SettingsRow>
    </div>
  )
}

export default function StrokePanel() {
  return (
    <div
      className="bg-surface-primary border border-oq-08 rounded overflow-hidden"
      style={{ width: 320 }}
    >
      <StrokeBody />
    </div>
  )
}
