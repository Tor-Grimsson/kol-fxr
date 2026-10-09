import { useEffect, useState } from 'react'
import { Input } from '@kolkrabbi/kol-component'

/**
 * NumberField — the ONE draft/commit number-input idiom, shared by
 * CanvasInspector's dimensions, LayerInspector's position/rotation fields
 * and StrokePanel's weight.
 *
 * Typing edits a local draft only; the value commits on blur / Enter, so
 * intermediate keystrokes ("1" → "19" → "192…", a bare "-") never reshape
 * the target. `onCommit` receives the raw draft string — parsing / clamping
 * stays at the call site. After commit the draft resnaps to the prop (the
 * effect re-syncs it if the commit changed the value), so invalid input
 * falls back to the last good value instead of lingering.
 *
 * Controlled draft on purpose: the DS Input always sets `value` internally,
 * so the old defaultValue+key trick logged controlled/uncontrolled warnings
 * on every render. Remaining Input props (variant/size/chars/suffix…) pass
 * through untouched.
 */
/* `chars` sizes the box to its value (spec R6.1) through the HTML `size` attribute, which
 * `type="number"` ignores — so a chars-sized field is a text input with a decimal keypad. */
export function NumberField({ value, onCommit, ...inputProps }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  return (
    <Input
      {...(inputProps.chars ? { type: 'text', inputMode: 'decimal' } : { type: 'number' })}
      {...inputProps}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { onCommit(draft); setDraft(String(value)) }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}
