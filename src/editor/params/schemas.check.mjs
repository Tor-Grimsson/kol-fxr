// node src/editor/params/schemas.check.mjs — every range slider can reach its own default (plan 27 § 8):
// the default sits inside [min, max] and on the step grid from min, or the first drag loses it for good.
// And every range slider names itself — a missing label renders the raw key (plan 27 § 9).
import { createServer } from 'vite'
/* the registry reaches React and the DS (.jsx, extensionless imports) — load it the way the app does */
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', ssr: { noExternal: [/^@kolkrabbi\//] }, optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(new URL(p, import.meta.url).pathname)
const { PRESETS, loopById } = await load('../../loops/registry.js')
const LOOPS = [...new Set(PRESETS.map((p) => loopById(p.loop)))]
const { FILTERS } = await load('../../filters/index.js')
const { VP_PARAMS, TIME_PARAMS } = await load('../../loops/lib/viewport.js')
const bad = []
const seen = new WeakSet()
const check = (owner, p) => {
  if (!p || p.type !== 'range' || seen.has(p) || typeof p.default !== 'number' || p.min == null || p.max == null) return
  seen.add(p)
  if (!p.label || p.unlabeled) bad.push(`${owner}.${p.key}: no label (renders its key)`)
  const steps = (p.default - p.min) / (p.step || 1)
  if (p.default < p.min || p.default > p.max) bad.push(`${owner}.${p.key}: default ${p.default} outside ${p.min}..${p.max}`)
  else if (Math.abs(steps - Math.round(steps)) > 1e-6) bad.push(`${owner}.${p.key}: default ${p.default} off the ${p.step} grid from ${p.min}`)
}
for (const l of LOOPS) for (const p of [...(l.params || []), ...(l.camera || [])]) check(l.id, p)
for (const f of FILTERS) for (const p of f.params || []) check(f.id, p)
for (const p of [...VP_PARAMS, ...TIME_PARAMS]) check('viewport', p)
await vite.close()
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log(`schemas ok — ${LOOPS.length} loops, ${FILTERS.length} filters`)
