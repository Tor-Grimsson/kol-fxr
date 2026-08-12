import EditorIcon from '../icons/EditorIcon'
import { SegmentedToggle } from '@kolkrabbi/kol-component'
import { useComposeState } from './state'

/* AlignmentPanel — Figma's alignment row: TWO 3-way strips, the DS
 * SegmentedToggle variant="filled" (0.36.0). STATELESS one-shot actions →
 * value={null}. A single selected layer aligns to the CANVAS, ≥2 to their
 * common bbox (state.alignSelected). */
const H_OPTS = [
  { value: 'start',  label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-h-start" size={16} /></span>, ariaLabel: 'Align left' },
  { value: 'center', label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-h-center" size={16} /></span>, ariaLabel: 'Align horizontal center' },
  { value: 'end',    label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-h-end" size={16} /></span>, ariaLabel: 'Align right' },
]
const V_OPTS = [
  { value: 'start',  label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-v-start" size={16} /></span>, ariaLabel: 'Align top' },
  { value: 'center', label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-v-center" size={16} /></span>, ariaLabel: 'Align vertical center' },
  { value: 'end',    label: <span className="text-oq-48 inline-flex"><EditorIcon name="align-v-end" size={16} /></span>, ariaLabel: 'Align bottom' },
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
