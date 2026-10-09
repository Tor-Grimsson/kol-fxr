import { InspectorSection } from '@kolkrabbi/kol-component'

/* Pane — the DS `InspectorSection pane` (header strip, padded body, full-width rule) with its
 * title in the editor's ONE heading voice, the eyebrow (spec R4.1, the user's 17: Transform /
 * Appearance / Path were 14px `kol-inspector-pane-title`). The DS pane title is mono-14; until it
 * takes the eyebrow itself (plan 17), the label node carries it. */
export default function Pane({ label, ...props }) {
  return <InspectorSection pane label={label && <span className="kol-eyebrow text-fg-80">{label}</span>} {...props} />
}
