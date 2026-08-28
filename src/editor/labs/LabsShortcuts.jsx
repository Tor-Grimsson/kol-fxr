import { useEffect, useState } from 'react'
import { LabeledControlSection, FullscreenOverlay } from '@kolkrabbi/kol-component'
import { comboLabel, shortcutsBySection } from '../state/keymap'
import EditorIcon from '../icons/EditorIcon'

/**
 * LabsShortcuts — labs' "Animate any value" card (the reference overlay on
 * labs.kolkrabbi.io): the expression quick-doc plus the labs keys. S toggles,
 * Esc / backdrop / X close. Content states what OUR expr.js actually ships
 * (params/expr.js PRELUDE) — reference layout, this engine's truth.
 *
 * Self-contained like the editor's ShortcutsOverlay: owns its key listener,
 * so LabsBody just mounts it.
 */

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

/* KEYS IS NO LONGER HAND-MAINTAINED (2026-08-15). It was ten hardcoded rows
 * that had already drifted from the real keymap — it claimed `R → reset` and
 * `Shift+R → reroll` while `keymap.js` said Rectangle tool and rulers, and it
 * predated `I` entirely. Both lists were right about DIFFERENT chromes, and
 * nothing declared which.
 *
 * `keymap.js` gained a `views:` field, so labs' own keys are declared there
 * now and this reads them. One source of truth; the drift cannot come back.
 *
 * `Esc → close` stays local: it is this panel's own affordance, bound below,
 * not an app shortcut the keymap should carry.
 *
 * Labels render AS AUTHORED — no `.toLowerCase()`. A first pass had one, and it
 * turned "Orbit tool (3D camera)" into "3d camera". Casing is authored, never
 * transformed; that is the same law the uppercase rule in this repo's CSS was
 * deleted for. */
const labsKeys = () => [
  ...shortcutsBySection('labs').flatMap(({ items }) =>
    items.map((s) => [comboLabel(s.combo), s.label])),
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
    /* The DS overlay owns the scrim, Escape, backdrop dismiss, scroll lock,
       the focus trap and the z tier (EditorOverlaysOnFullscreenOverlay, ruled
       2026-08-27). This file used to hand-roll all of it around a local
       `SCRIM` const at `z-[1000]`, and trapped nothing. */
    <FullscreenOverlay open onClose={() => setOpen(false)}>
      <div
        className="flex flex-col"
        style={{ width: 640, maxWidth: '100%' }}
      >
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <p className="kol-eyebrow text-meta mb-1">Shortcuts</p>
            <p className="kol-mono-16 text-emphasis">Animate any value</p>
          </div>
        </div>

        <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-5">
          <p className="kol-mono-12 text-body">
            Type math into any slider's number box instead of a number. It
            re-evaluates every frame, so the value animates — no keyframes.
            {' '}<span className="text-emphasis">t</span> is the playhead in
            seconds, so it pauses / scrubs / tempo-scales with the transport.
            Drag the slider to clear an expression.
          </p>

          <LabeledControlSection label="Examples">
            <div className="flex flex-col gap-1">
              {EXAMPLES.map(([expr, what]) => (
                <div key={expr} className="flex items-center gap-4">
                  <code className="kol-mono-12 text-emphasis bg-fg-04 rounded px-2 py-0.5" style={{ minWidth: 132 }}>{expr}</code>
                  <span className="kol-mono-12 text-body flex-1 min-w-0">{what}</span>
                </div>
              ))}
            </div>
          </LabeledControlSection>

          <LabeledControlSection label="Loop">
            <p className="kol-mono-12 text-body">
              The transport clock is a loop, not a BPM —
              {' '}<span className="text-emphasis">Loop / N s</span> in the
              transport bar is the loop length in seconds, and every
              oscillator, sweep and export wraps seamlessly over it. Type a
              new length there; the default lives in Settings → Loop length.
            </p>
          </LabeledControlSection>

          <LabeledControlSection label="Functions">
            <div className="flex flex-col gap-2">
              {FUNCTIONS.map(([group, list]) => (
                <div key={group}>
                  <p className="kol-helper-10 text-subtle">{group}</p>
                  <p className="kol-mono-12 text-emphasis">{list}</p>
                </div>
              ))}
            </div>
          </LabeledControlSection>

          <div className="pt-3 border-t border-fg-08 flex flex-wrap gap-x-5 gap-y-1">
            {labsKeys().map(([key, what]) => (
              <span key={key} className="kol-mono-12">
                <span className="text-emphasis">{key}</span>
                {' '}<span className="text-meta">{what}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </FullscreenOverlay>
  )
}
