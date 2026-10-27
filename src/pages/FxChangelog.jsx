import { useState } from 'react'
import { Input, SectionText } from '@kolkrabbi/kol-component'
import { FX_CHANGELOG } from './fxChangelogRows.js'

/**
 * FxChangelog — the Dev page's FX tab: every effect, generator family and preset set fxr has gained,
 * newest first, with where it lives in the rail. Effects get folded into existing categories
 * (Tunnel went under Generative › Gradients), so this is the map for finding them again.
 * Add a row to `fxChangelogRows.js` whenever a visual lands.
 */
export default function FxChangelog() {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const rows = needle
    ? FX_CHANGELOG.filter((r) => `${r.name} ${r.where} ${r.what}`.toLowerCase().includes(needle))
    : FX_CHANGELOG
  return (
    <section className="flex flex-col gap-6 pb-24">
      <SectionText level="content" eyebrow="Dev" headline="FX changelog" body="Effects and generators by the day they landed, newest first, with where to find them." />
      <Input size="sm" chars={24} placeholder="Filter" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="flex flex-col">
        {rows.map((r) => (
          <li key={`${r.date}-${r.name}`} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-fg-08 py-3 md:grid-cols-[7rem_16rem_1fr]">
            <span className="kol-mono-12 text-fg-48">{r.date}{r.approx ? ' ~' : ''}</span>
            <div className="flex flex-col gap-1">
              <span className="kol-helper-14 text-fg-96">{r.name}</span>
              <span className="kol-mono-10 text-fg-64">{r.where}</span>
            </div>
            <p className="kol-helper-12 text-fg-80 col-start-2 md:col-start-3">{r.what}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
