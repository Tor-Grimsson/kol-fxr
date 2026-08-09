import { Icon } from '@kolkrabbi/kol-icons'
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
 * scales the cells, icons, and the loop readout to the touch scale used by
 * the mobile overlay (matches `size="lg"` buttons/toggles, ~40px tall). */
const SIZES = {
  sm: { cell: 'px-3 py-1.5', icon: 14, mono: 'kol-mono-12' },
  lg: { cell: 'px-4 py-2.5', icon: 20, mono: 'kol-mono-16' },
}

/* stop / rewind are absent from kol-icons 0.10.0 (TransportIcons filed in the
 * kol-ds-ui lobby) — local glyphs bridge the gap so the cells aren't blank.
 * Delete when the set ships the names. */
const FALLBACK_GLYPHS = {
  stop: (size) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.75" y="3.75" width="8.5" height="8.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  rewind: (size) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 4 4.5 8 8 12M12 4 8.5 8 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
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
        active ? 'text-emphasis' : 'text-meta hover:text-emphasis',
      ].filter(Boolean).join(' ')}
    >
      {FALLBACK_GLYPHS[name] ? FALLBACK_GLYPHS[name](cfg.icon) : <Icon name={name} size={cfg.icon} />}
    </button>
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

      {/* Bare readout, labs' transport center ("Tempo / 120", borderless) —
          the DS Input lost its borderless variant (ghost → outline, the
          2026-07-08 chrome law), so the readout is authored chrome here. */}
      <label className={`flex-1 flex items-center justify-center gap-1.5 ${cfg.mono}`} title="Loop length (seconds)">
        <span className="text-meta">Loop /</span>
        <input
          type="text"
          inputMode="numeric"
          value={String(loopSeconds)}
          onChange={(e) => setLoopSeconds(e.target.value)}
          className="bg-transparent border-0 outline-none p-0 w-8 text-center text-emphasis"
          style={{ font: 'inherit' }}
        />
        <span className="text-meta">s</span>
      </label>

      {/* Stop / rewind bump the transport's reset epoch — stateful consumers
          (sims, trails, video) restart fresh. Pause (left group) never does. */}
      <div className="inline-flex rounded overflow-hidden bg-surface-secondary shrink-0">
        <Cell name="stop" title="Stop" onClick={stop} cfg={cfg} />
        <Cell name="rewind" title="Rewind" onClick={rewind} divider cfg={cfg} />
      </div>
    </div>
  )
}
