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
 * ONE LINE AT EVERY RAIL (2026-09-01). The cells used to be 38 wide (px-3
 * around a 14px glyph), and 77 + 77 + a ~110px field never fit the desktop's
 * 264 rail (232 of content) nor the touch drawer — the row wrapped and the
 * stop group dropped under a half-row. The user's design is the one-liner, so
 * the parts got smaller, not the row taller: the cells are SQUARE on the
 * button ladder (26 / 32 / 40 — the DS icon-only geometry) and the field holds
 * 3 chars. sm: 104 + 16 + ~104 in 232 · md: 128 + 16 + ~122 in 288. The
 * loop length was briefly in the Output tab; it belongs here.
 *
 * Space is NOT bound to play/pause here — Space is pan in this editor.
 * The fps readout lives in the canvas corner, not here.
 */

/* Size presets. `sm` (default) reproduces the desktop footer verbatim; `lg`
 * scales the cells and icons to the touch scale used by the mobile overlay
 * (matches `size="lg"` buttons/toggles, ~40px tall). The loop readout takes
 * its own scale from the DS Input's `size`. */
const SIZES = {
  sm: { cell: 'size-[26px]', icon: 14 },
  md: { cell: 'size-8', icon: 16 },
  lg: { cell: 'size-10', icon: 20 },
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
        `${cfg.cell} inline-flex items-center justify-center cursor-pointer transition-colors`,
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
      chars={3}
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

  const playGroup = (
    <div className="inline-flex rounded overflow-hidden bg-surface-secondary shrink-0">
      <Cell name="play" title="Play" active={playing} onClick={play} cfg={cfg} />
      <Cell name="pause" title="Pause" active={!playing} onClick={pause} divider cfg={cfg} />
    </div>
  )
  const stopGroup = (
    <div className="inline-flex rounded overflow-hidden bg-surface-secondary shrink-0">
      <Cell name="stop" title="Stop" onClick={stop} cfg={cfg} />
      <Cell name="rewind" title="Rewind" onClick={rewind} divider cfg={cfg} />
    </div>
  )

  /* Stop / rewind bump the transport's reset epoch — stateful consumers
     (sims, trails, video) restart fresh. Pause (left group) never does.
     `flex-wrap` is the safety net, not the layout: if a font ever widens the
     field past the sums above, the stop group folds rather than overflows. */
  return (
    <div className="flex flex-wrap items-center gap-2">
      {playGroup}
      {/* The DS property field IS this anatomy — dim affordance, hugging
          numeric value, adjacent unit (Input variant="property", 0.36.0). */}
      <div className="flex-1 min-w-16 flex justify-center">
        <LoopField seconds={loopSeconds} onCommit={setLoopSeconds} size={size} />
      </div>
      {stopGroup}
    </div>
  )
}
