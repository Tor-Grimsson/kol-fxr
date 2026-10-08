import { Icon } from '@kolkrabbi/kol-icons'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { useComposeState } from './state'

/* AlignmentPanel — Figma's alignment row: TWO 3-way strips, the DS
 * SegmentedToggle variant="filled" (0.36.0). STATELESS one-shot actions →
 * value={null}. A single selected layer aligns to the CANVAS, ≥2 to their
 * common bbox (state.alignSelected). */
const H_OPTS = [
  { value: 'start',  label: <Icon name="align-horizontal-left" size={16} />, ariaLabel: 'Align left' },
  { value: 'center', label: <Icon name="align-horizontal-center" size={16} />, ariaLabel: 'Align horizontal center' },
  { value: 'end',    label: <Icon name="align-horizontal-right" size={16} />, ariaLabel: 'Align right' },
]
const V_OPTS = [
  { value: 'start',  label: <Icon name="align-vertical-top" size={16} />, ariaLabel: 'Align top' },
  { value: 'center', label: <Icon name="align-vertical-center" size={16} />, ariaLabel: 'Align vertical center' },
  { value: 'end',    label: <Icon name="align-vertical-bottom" size={16} />, ariaLabel: 'Align bottom' },
]

export default function AlignmentPanel() {
  const { alignSelected } = useComposeState()
  return (
    <div className="grid grid-cols-2 gap-2">
      <SegmentedToggle variant="filled" size="sm" ariaLabel="Horizontal alignment" value={null} options={H_OPTS} onChange={(m) => alignSelected('h', m)} />
      <SegmentedToggle variant="filled" size="sm" ariaLabel="Vertical alignment" value={null} options={V_OPTS} onChange={(m) => alignSelected('v', m)} />
    </div>
  )
}
