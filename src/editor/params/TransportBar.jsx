import { useEffect, useState } from 'react'
import { Icon } from '@kolkrabbi/kol-icons'
import { Input } from '@kolkrabbi/kol-component'
import { useTransport } from './transport'

/**
 * TransportBar — playback transport, a port of the labs TransportBar
 * (kol-labs-single `components/framework/TransportBar.jsx`): two joined
 * icon button-groups flanking a centered ghost readout.
 *
 *   [▶ | ❚❚]      Loop / N s      [■ | ◀◀]
 *
 * Left group = play / pause (play lit when playing, pause lit when not).
 * Right group = stop (pause + rewind) / rewind (seek 0, keeps playing).
 * Center = loop length in seconds (labs centers tempo; our clock is a
 * normalized loop). Drives the module-level `transport` singleton.
 *
 * Space is NOT bound to play/pause here — Space is pan in this editor.
 * The fps readout lives in the canvas corner, not here.
 */

/* Size presets. `sm` (default) reproduces the desktop footer verbatim; `lg`
 * scales the cells and icons to the touch scale used by the mobile overlay
 * (matches `size="lg"` buttons/toggles, ~40px tall). The loop readout takes
 * its own scale from the DS Input's `size`. */
const SIZES = {
  sm: { cell: 'px-3 py-1.5', icon: 14 },
  lg: { cell: 'px-4 py-2.5', icon: 20 },
}

function Cell({ name, title, active, onClick, divider, cfg }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={[
        `${cfg.cell} inline-flex items-center cursor-pointer transition-colors`,
        divider ? 'border-l border-fg-08' : '',
        /* Icons paint OPAQUE (oq-* — the baked-grey mirror of the fg alpha
         * scale): multi-path glyphs (rewind's two triangles) compound where
         * shapes overlap if the ink carries alpha. Text keeps fg tokens;
         * this rule is for icons. */
        /* hover via the raw token — kol-opaque ships bg-* hovers only (its
         * header promises text/border hovers; DS gap, ticket-worthy). */
        active ? 'text-oq-96' : 'text-oq-48 hover:text-[var(--kol-oq-96)]',
      ].filter(Boolean).join(' ')}
    >
      <Icon name={name} size={cfg.icon} />
    </button>
  )
}

/* Draft-then-commit, the same contract RangeField's box already uses: what
 * you type survives until you leave the field. The store's floor stays where
 * it belongs — the loop clock divides by this value, so 0 is not a legal
 * state — but it lands on COMMIT, never on a keystroke. Clamping live is what
 * made an emptied field snap straight back to the floor. */
function LoopField({ seconds, onCommit, size }) {
  const shown = String(seconds)
  const [draft, setDraft] = useState(shown)
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!editing) setDraft(shown) }, [shown, editing])

  const commit = () => {
    setEditing(false)
    const n = Number(draft.trim())
    if (draft.trim() === '' || !Number.isFinite(n)) { setDraft(shown); return }
    onCommit(n)
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      variant="property"
      size={size}
      affordance="Loop /"
      unit="s"
      chars={4}
      title="Loop length (seconds)"
      value={draft}
      onFocus={(e) => { setEditing(true); e.target.select() }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { setDraft(shown); setEditing(false); e.currentTarget.blur() }
      }}
      inputClassName="text-center"
    />
  )
}

export default function TransportBar({ size = 'sm' }) {
  const cfg = SIZES[size] ?? SIZES.sm
  const { playing, loopSeconds, play, pause, stop, rewind, setLoopSeconds } = useTransport()

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded overflow-hidden bg-surface-secondary shrink-0">
        <Cell name="play" title="Play" active={playing} onClick={play} cfg={cfg} />
        <Cell name="pause" title="Pause" active={!playing} onClick={pause} divider cfg={cfg} />
      </div>

      {/* The DS property field IS this anatomy — dim affordance, hugging
          numeric value, adjacent unit (Input variant="property", 0.36.0).
          The old authored chrome predated it. */}
      <div className="flex-1 flex justify-center">
        <LoopField seconds={loopSeconds} onCommit={setLoopSeconds} size={size} />
      </div>

      {/* Stop / rewind bump the transport's reset epoch — stateful consumers
          (sims, trails, video) restart fresh. Pause (left group) never does. */}
      <div className="inline-flex rounded overflow-hidden bg-surface-secondary shrink-0">
        <Cell name="stop" title="Stop" onClick={stop} cfg={cfg} />
        <Cell name="rewind" title="Rewind" onClick={rewind} divider cfg={cfg} />
      </div>
    </div>
  )
}
