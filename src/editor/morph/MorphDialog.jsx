import { useEffect, useMemo, useState } from 'react'
import { Button, ContentRow, Dropdown, EmptyState, FullscreenOverlay, Input } from '@kolkrabbi/kol-component'
import { buildMorph, loopSnapshot, CURVES, CYCLES } from './buildMorph'

/**
 * MorphDialog — pick saved presets of the current generator IN ORDER, choose a
 * curve and a cycle, Build. FilesDialog's shape (the overlay, the rows, the
 * footer) so the two read as one family; the dialog knows a list of presets
 * and one callback — everything editor-shaped is wired in MorphDialogHost.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object[]} presets      library items holding a loop layer of `current.loopId`
 * @param {Object}   current      the loop layer being morphed (null when there is none)
 * @param {string}   loopLabel    the generator's label, for the header
 * @param {Object[]} schema       the generator's params
 * @param {number}   defaultLoopSeconds  the transport's loop length
 * @param {Function} onBuild      ({ snapshots, curve, cycle, seconds }) => void
 */

const fmtDate = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}
const labelOf = (it) => it.name || 'Untitled'
const names = (ps) => ps.map((p) => p.label ?? p.key).join(' · ')

export default function MorphDialog({ open, onClose, presets, current, loopLabel, schema, defaultLoopSeconds, onBuild }) {
  const [picked, setPicked] = useState([])
  const [curve, setCurve] = useState('in-out')
  const [cycle, setCycle] = useState('loop')
  const [seconds, setSeconds] = useState(String(defaultLoopSeconds ?? 4))

  /* reopens clean — a stale pick from last time would Build the wrong thing */
  useEffect(() => { if (!open) setPicked([]) }, [open])
  useEffect(() => { if (open) setSeconds(String(defaultLoopSeconds ?? 4)) }, [open, defaultLoopSeconds])

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const snapshots = useMemo(
    () => picked.map((id) => presets.find((it) => it.id === id)).filter(Boolean).map((it) => loopSnapshot(it, current?.loopId)).filter(Boolean),
    [picked, presets, current?.loopId],
  )
  /* the preview is the build itself, on the pick so far — what tweens, what cuts, what holds */
  const preview = useMemo(() => (snapshots.length >= 2 ? buildMorph({ snapshots, schema, curve, cycle }) : null), [snapshots, schema, curve, cycle])

  if (!open) return null

  const build = () => {
    if (snapshots.length < 2) return
    onBuild?.({ snapshots, curve, cycle, seconds: Number(seconds) })
  }

  return (
    <FullscreenOverlay open={open} onClose={onClose}>
      <div className="kol-morph-dialog flex flex-col gap-4" style={{ minWidth: 'min(640px, 90vw)' }}>
        <div className="flex items-baseline gap-3">
          <span className="kol-eyebrow text-meta">Morph</span>
          <span className="kol-mono-14 text-emphasis">{loopLabel}</span>
          <span className="ms-auto kol-helper-10 text-meta">{presets.length} saved · pick in order</span>
        </div>
        {!current ? (
          <EmptyState eyebrow="Morph" title="Pick a generator first" body="Morph tweens between saved presets of the generator on the stage." />
        ) : presets.length < 2 ? (
          <EmptyState eyebrow="Morph" title={`Save two or more ${loopLabel} presets first`} body="Morph tweens between saved presets of the same generator. Save… puts the current one in the library." />
        ) : (
          <ul className="flex flex-col">
            {presets.map((it) => {
              const n = picked.indexOf(it.id)
              return (
                <li key={it.id}>
                  <ContentRow
                    variant="default"
                    media={false}
                    title={labelOf(it)}
                    eyebrow={n >= 0 ? `${n + 1}` : 'preset'}
                    date={fmtDate(it.updatedAt ?? it.savedAt)}
                    selected={n >= 0}
                    onClick={() => toggle(it.id)}
                  />
                </li>
              )
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-oq-08">
          <span className="kol-helper-10 text-meta">Curve</span>
          <Dropdown size="sm" options={CURVES} value={curve} onChange={setCurve} aria-label="Curve" />
          <span className="kol-helper-10 text-meta">Cycle</span>
          <Dropdown size="sm" options={CYCLES} value={cycle} onChange={setCycle} aria-label="Cycle" />
          <span className="kol-helper-10 text-meta">Loop</span>
          <Input size="sm" chars={4} value={seconds} onChange={(e) => setSeconds(e.target.value)} aria-label="Loop seconds" />
          <span className="kol-helper-10 text-meta">s</span>
        </div>
        {preview && (
          <div className="flex flex-col gap-1 kol-helper-10 text-meta">
            {preview.tweened.length > 0 && <span>Tweens: {names(preview.tweened)}</span>}
            {preview.stepped.length > 0 && <span className="text-emphasis">Steps, not tweens: {names(preview.stepped)}</span>}
            {preview.held.length > 0 && <span>Held at the first preset's: {names(preview.held)}</span>}
            {preview.tweened.length + preview.stepped.length === 0 && <span>These presets differ in nothing the morph can move.</span>}
            {cycle === 'once' && <span>Once does not loop — it ends on the last preset.</span>}
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button tone="primary" size="sm" onClick={onClose}>Cancel</Button>
          <Button tone="primary" size="sm" disabled={snapshots.length < 2} onClick={build}>Build</Button>
        </div>
      </div>
    </FullscreenOverlay>
  )
}
