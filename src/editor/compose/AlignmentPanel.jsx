import { Icon } from '@kolkrabbi/kol-icons'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { useComposeState } from './state'
import { useControlSize } from '../params/controlSize'

/* AlignmentPanel — Figma's alignment row: TWO strips, three aligns + distribute (≥3 layers), the DS
 * SegmentedToggle variant="filled" (0.36.0). STATELESS one-shot actions →
 * value={null}. A single selected layer aligns to the CANVAS, ≥2 to their
 * common bbox (state.alignSelected). */
export const H_OPTS = [
  { value: 'start',  label: <Icon name="align-horizontal-left" size={16} />, ariaLabel: 'Align left' },
  { value: 'center', label: <Icon name="align-horizontal-center" size={16} />, ariaLabel: 'Align horizontal center' },
  { value: 'end',    label: <Icon name="align-horizontal-right" size={16} />, ariaLabel: 'Align right' },
  { value: 'distribute', label: <Icon name="space-evenly-horizontal" size={16} />, ariaLabel: 'Distribute horizontally' },
]
export const V_OPTS = [
  { value: 'start',  label: <Icon name="align-vertical-top" size={16} />, ariaLabel: 'Align top' },
  { value: 'center', label: <Icon name="align-vertical-center" size={16} />, ariaLabel: 'Align vertical center' },
  { value: 'end',    label: <Icon name="align-vertical-bottom" size={16} />, ariaLabel: 'Align bottom' },
  { value: 'distribute', label: <Icon name="space-evenly-vertical" size={16} />, ariaLabel: 'Distribute vertically' },
]

const ALIGN_H = H_OPTS.filter((o) => o.value !== 'distribute')
const ALIGN_V = V_OPTS.filter((o) => o.value !== 'distribute')

export default function AlignmentPanel() {
  const { alignSelected } = useComposeState()
  const cs = useControlSize()
  return (
    <div className="grid grid-cols-2 gap-2">
      {/* three aligns a strip (plan 34 § 3 — four overflowed the rail and clipped); distribute lives in
          Layer › Align, which still reads the full H_OPTS / V_OPTS */}
      <SegmentedToggle tone="sunken" size={cs} ariaLabel="Horizontal alignment" value={null} options={ALIGN_H} onChange={(m) => alignSelected('h', m)} className="w-full" />
      <SegmentedToggle tone="sunken" size={cs} ariaLabel="Vertical alignment" value={null} options={ALIGN_V} onChange={(m) => alignSelected('v', m)} className="w-full" />
    </div>
  )
}
