import { useEffect, useState } from 'react'
import { Input, SegmentedToggle, Tooltip, glyphSize } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { useTransport } from './transport'

/**
 * TransportBar — the loop clock's controls: rewind · play / pause · stop, and the loop length.
 *
 * fxr's two strips on KOL's SegmentedToggle — the 2026-09-27 sync's single row of ghost buttons
 * lost the shape the user wanted. (Not `PlaybackBar`: that is a media player's bar, this is a loop
 * clock.)
 *
 * Stop and rewind bump the transport's reset epoch — stateful loops (sims, trails, video) restart
 * fresh. Pause never does.
 *
 * @param {'sm'|'md'|'lg'} size  the rung — the desktop footer is sm, the phone overlay lg
 */

/* Draft-then-commit: what is typed is the draft, Enter / blur commits, Escape restores */
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
    <Tooltip label="Loop length" triggerClassName="flex w-full">
      <Input
        type="text"
        inputMode="decimal"
        variant="property"
        size={size}
        affordance="Loop /"
        unit="s"
        chars={3}
        aria-label="Loop length in seconds"
        value={draft}
        onFocus={(e) => { setEditing(true); e.target.select() }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') { setDraft(shown); setEditing(false); e.currentTarget.blur() }
        }}
        /* the shell centred too — `property` left-packs its content by design, and `text-center` alone
           only centres inside the hugging input (plan 14 § 5; the user: "'loop/4s' should be centered") */
        className="justify-center"
        inputClassName="text-center"
      />
    </Tooltip>
  )
}

const glyph = (name, size) => <Icon name={name} size={glyphSize(size, true)} />

/* THE GLYPH CELLS ARE SQUARE ON THE LADDER (26 / 32 / 40 — the DS icon-only geometry; ruled
 * 2026-09-02 so ▶❚❚ · Loop / N s · ■◀◀ is one line at every rail width). The 2026-09-27 rebuild
 * onto `SegmentedToggle` left them at a text cell's padding — 53px a cell at `md` — and the two
 * strips squeezed the loop field until its number had no width at all: on a phone the transport
 * read "Loop / s". Written out per rung: Tailwind only emits a class it can read whole. */
const SQUARE = {
  sm: 'shrink-0 [&_.kol-seg-cell]:flex-none [&_.kol-seg-cell]:px-0 [&_.kol-seg-cell]:w-[var(--kol-ctl-sm)]',
  md: 'shrink-0 [&_.kol-seg-cell]:flex-none [&_.kol-seg-cell]:px-0 [&_.kol-seg-cell]:w-[var(--kol-ctl-md)]',
  lg: 'shrink-0 [&_.kol-seg-cell]:flex-none [&_.kol-seg-cell]:px-0 [&_.kol-seg-cell]:w-[var(--kol-ctl-lg)]',
}

export default function TransportBar({ size = 'sm' }) {
  const { playing, loopSeconds, play, pause, stop, rewind, setLoopSeconds } = useTransport()
  /* fxr's shape (inspector rebuild 2026-09-27 — user: "should look closer to this"): play | pause
   * as one strip with the current state lit, the loop field filling the row, stop | rewind as a
   * second strip. Glyph cells take their tooltips from `ariaLabel` (SegmentedToggle). */
  return (
    <div className="flex items-center gap-2">
      <SegmentedToggle
        size={size} ariaLabel="Playback" value={playing ? 'play' : 'pause'} className={SQUARE[size]}
        onChange={(v) => (v === 'play' ? play() : pause())}
        options={[
          { value: 'play', ariaLabel: 'Play', tooltip: 'Play (Space)', label: glyph('play', size) },
          { value: 'pause', ariaLabel: 'Pause', tooltip: 'Pause (Space)', label: glyph('pause', size) },
        ]}
      />
      <div className="flex-1 min-w-0">
        <LoopField seconds={loopSeconds} onCommit={setLoopSeconds} size={size} />
      </div>
      <SegmentedToggle
        size={size} ariaLabel="Reset" value={null} className={SQUARE[size]}
        onChange={(v) => (v === 'stop' ? stop() : rewind())}
        options={[
          { value: 'stop', ariaLabel: 'Stop', label: glyph('stop', size) },
          { value: 'rewind', ariaLabel: 'Rewind', label: glyph('rewind', size) },
        ]}
      />
    </div>
  )
}
