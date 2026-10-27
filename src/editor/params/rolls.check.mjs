// node src/editor/params/rolls.check.mjs — the plan 42 rule, on every preset of every loop:
// at most 12 knobs show per rail tab (a closed section counts as one row), Randomize all moves at
// most 10 non-colour values (ranges roll inside rMin/rMax or the middle half, lib/rng.js).
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', ssr: { noExternal: [/^@kolkrabbi\//] }, optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(new URL(p, import.meta.url).pathname)
const R = await load('../../loops/registry.js')
const { visibleParams, paramTab, paramSection } = await load('./schema.js')
const { allScopeParams } = await load('./rolls.jsx')
const COLOUR = new Set(['color'])
const bad = []
let presets = 0
for (const pr of R.PRESETS) {
  const def = R.loopById(pr.loop)
  if (!def || def.id !== pr.loop || !def.params) continue
  presets++
  const layer = { ...(def.defaults || {}), ...R.presetParams(pr) }
  const vis = visibleParams(def.params, layer).filter((p) => p.type !== 'hidden')
  for (const tab of ['generate', 'style', 'anim']) {
    const rows = new Set()
    for (const p of vis.filter((q) => paramTab(q) === tab)) {
      const sec = paramSection(p)
      rows.add(sec && vis.some((q) => paramSection(q) === sec && q.collapsed) ? `§${sec}` : p.key)
    }
    if (rows.size > 12) bad.push(`${pr.id} (${def.id}) ${tab}: ${rows.size} rows`)
  }
  const roll = allScopeParams(def.params, layer).filter((p) => !p.noRandom && !['text', 'hidden'].includes(p.type) && !p.roll)
  /* colour rolls (colour params, and the Color section's palette and look selects) are one palette, not N values */
  const looks = roll.filter((p) => !COLOUR.has(p.type) && paramSection(p) !== 'Color' && p.key !== 'palette')
  if (looks.length > 10) bad.push(`${pr.id} (${def.id}) rolls ${looks.length}: ${looks.map((p) => p.key).join(' ')}`)
}
await vite.close()
const uniq = [...new Set(bad)]
if (uniq.length) { console.error(uniq.join('\n')); console.error(`\n${uniq.length} problems`); process.exit(1) }
console.log(`rolls ok — ${presets} presets`)
