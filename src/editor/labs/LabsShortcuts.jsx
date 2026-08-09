import { useEffect, useState } from 'react'
import EditorButton from '../components/EditorButton'

/**
 * LabsShortcuts — labs' "Animate any value" card (the reference overlay on
 * labs.kolkrabbi.io): the expression quick-doc plus the labs keys. S toggles,
 * Esc / backdrop / X close. Content states what OUR expr.js actually ships
 * (params/expr.js PRELUDE) — reference layout, this engine's truth.
 *
 * Self-contained like the editor's ShortcutsOverlay: owns its key listener,
 * so LabsBody just mounts it.
 */
const SCRIM = 'rgba(0, 0, 0, 0.6)'

const EXAMPLES = [
  ['0.5', 'a plain value — stays put (normal slider)'],
  ['t', 'counts up in seconds: 0, 1, 2 …'],
  ['t*0.1', 'counts up slowly'],
  ['sin(t)', 'smooth swing, -1 … 1'],
  ['sin(t*2)*0.5', 'faster, smaller swing'],
  ['wave(t)', 'bounce 0 → 1 → 0, once per second'],
  ['wave(t*0.5)*40', 'bounce, scaled to 0 … 40'],
  ['saw(t)', 'ramp 0 → 1, repeat'],
  ['tri(t)', 'triangle 0 → 1 → 0'],
]

const FUNCTIONS = [
  ['Oscillators · 0…1', 'wave saw tri pulse(t,w) ease(t,c) bell step(t,n)'],
  ['Trig', 'sin cos tan atan2'],
  ['Math', 'abs floor ceil round sqrt pow'],
  ['Helpers', 'clamp(x,a,b) lerp(a,b,u) mod(a,b) frac smooth'],
  ['Constants', 'PI TAU PHI E'],
]

const KEYS = [
  ['Space', 'play / pause'],
  ['R', 'reset'],
  ['Shift+R', 'reroll'],
  ['M', 'modulation dots'],
  ['C', 'orbit camera'],
  ['F', 'framerate'],
  ['0', 'fit zoom'],
  ['1–4', 'zoom 50–200%'],
  ['S', 'toggle this'],
  ['Esc', 'close'],
]

export default function LabsShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t?.tagName === 'INPUT' || t?.tagName === 'TEXTAREA' || t?.isContentEditable) return
      if (e.key === 'Escape') setOpen(false)
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: SCRIM }}
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-surface-primary border border-fg-08 rounded shadow-xl flex flex-col"
        style={{ width: 640, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <p className="kol-helper-10 uppercase tracking-widest text-meta mb-1">Shortcuts</p>
            <p className="kol-mono-16 text-emphasis">Animate any value</p>
          </div>
          <EditorButton
            variant="primary" size="sm" quiet iconOnly="close" iconSize={14}
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
        </div>

        <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-5">
          <p className="kol-mono-12 text-body">
            Type math into any slider's number box instead of a number. It
            re-evaluates every frame, so the value animates — no keyframes.
            {' '}<span className="text-emphasis">t</span> is the playhead in
            seconds, so it pauses / scrubs / tempo-scales with the transport.
            Drag the slider to clear an expression.
          </p>

          <div>
            <p className="kol-helper-10 uppercase tracking-widest text-meta mb-2">Examples</p>
            <div className="flex flex-col gap-1">
              {EXAMPLES.map(([expr, what]) => (
                <div key={expr} className="flex items-center gap-4">
                  <code className="kol-mono-12 text-emphasis bg-fg-04 rounded px-2 py-0.5" style={{ minWidth: 132 }}>{expr}</code>
                  <span className="kol-mono-12 text-body flex-1 min-w-0">{what}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="kol-helper-10 uppercase tracking-widest text-meta mb-2">Loop</p>
            <p className="kol-mono-12 text-body">
              The transport clock is a loop, not a BPM —
              {' '}<span className="text-emphasis">Loop / N s</span> in the
              transport bar is the loop length in seconds, and every
              oscillator, sweep and export wraps seamlessly over it. Type a
              new length there; the default lives in Settings → Loop length.
            </p>
          </div>

          <div>
            <p className="kol-helper-10 uppercase tracking-widest text-meta mb-2">Functions</p>
            <div className="flex flex-col gap-2">
              {FUNCTIONS.map(([group, list]) => (
                <div key={group}>
                  <p className="kol-helper-10 text-subtle">{group}</p>
                  <p className="kol-mono-12 text-emphasis">{list}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-fg-08 flex flex-wrap gap-x-5 gap-y-1">
            {KEYS.map(([key, what]) => (
              <span key={key} className="kol-mono-12">
                <span className="text-emphasis">{key}</span>
                {' '}<span className="text-meta">{what}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
