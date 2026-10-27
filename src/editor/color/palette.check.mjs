// node src/editor/color/palette.check.mjs — the colour pass's one check (plan 37 W5):
// a seed rolls the same palette twice; a roll's colours are one palette (roles hit, the rest rotate);
// a theme resolves exactly as the old themeParams did (no visual change, § 5.2).
import { createServer } from 'vite'
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', ssr: { noExternal: [/^@kolkrabbi\//] }, optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(new URL(p, import.meta.url).pathname)
const { rollPalette, RELATIONS, okL, generatePalette, assignRoles, hexToOklch } = await load('./palette.js')
const { mulberry32, randomizeSchema } = await load('../lib/rng.js')
const { themeParams } = await load('../../loops/theme.js')
const { THEMES, resolveTheme } = await load('../../loops/lib/themes.js')
const bad = []
const ok = (c, m) => { if (!c) bad.push(m) }

ok(JSON.stringify(rollPalette(mulberry32(7))) === JSON.stringify(rollPalette(mulberry32(7))), 'same seed, different palette')
for (const r of RELATIONS) ok(rollPalette(mulberry32(3), r.id).colors.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${r.id}: a colour is not hex`)

/* OKLCH (plan 39 § 4.3): an accent reads at one lightness whatever its hue — within the roll's L band,
   less a little where the gamut cut chroma */
for (let seed = 1; seed <= 60; seed++) for (const r of RELATIONS) {
  const p = rollPalette(mulberry32(seed), r.id)
  const L = okL(p.roles.accent)
  ok(L > 0.6 && L < 0.72, `seed ${seed} ${r.id}: accent OKLab L ${L.toFixed(3)} outside 0.60–0.72`)
}

/* one colour generates the palette (plan 41 § 6.2): base kept as colour 0, the count honoured,
   the same seed the same list; roles by meaning — bg darkest, ink lightest, accent most saturated */
for (const r of RELATIONS) for (let n = 2; n <= 8; n++) {
  const g = generatePalette(mulberry32(n), { base: '#3366CC', relation: r.id, count: n })
  ok(g.length === n && g[0] === '#3366cc', `${r.id} ×${n}: count or base wrong`)
  ok(g.every((c) => /^#[0-9a-f]{6}$/.test(c)), `${r.id} ×${n}: a colour is not hex`)
  ok(JSON.stringify(g) === JSON.stringify(generatePalette(mulberry32(n), { base: '#3366CC', relation: r.id, count: n })), `${r.id} ×${n}: not seeded`)
  const roles = assignRoles(g)
  ok(g.every((c) => okL(roles.bg) <= okL(c) && okL(roles.fg) >= okL(c)), `${r.id} ×${n}: bg not darkest or ink not lightest`)
  if (n >= 3) ok(g.filter((c) => c !== roles.bg && c !== roles.fg).every((c) => hexToOklch(roles.accent)[1] >= hexToOklch(c)[1]), `${r.id} ×${n}: accent not the most saturated`)
}

const schema = [{ key: 'a', type: 'color', role: 'bg' }, { key: 'b', type: 'color' }, { key: 'c', type: 'color' }]
const pal = rollPalette(mulberry32(11))
const rolled = randomizeSchema(schema, mulberry32(11))
ok(rolled.a === pal.roles.bg, 'a roled param did not take its role')
ok(pal.colors.includes(rolled.b) && pal.colors.includes(rolled.c), 'an un-roled param is not from the palette')

/* the old themeParams, verbatim, against the resolver */
const old = (params, s, id, inv) => {
  const t = resolveTheme(id, inv)
  const role = { bg: t.bg, fg: t.fg, accent: t.accent, dim: t.dim ?? t.accent, warm: t.warm ?? t.accent }
  const out = { ...params }
  for (const p of s) if (p.type === 'color' && p.role && role[p.role]) out[p.key] = role[p.role]
  return out
}
const s5 = ['bg', 'fg', 'accent', 'dim', 'warm'].map((r) => ({ key: r, type: 'color', role: r })).concat([{ key: 'own', type: 'color' }])
for (const t of THEMES) for (const inv of [false, true]) {
  ok(JSON.stringify(themeParams({ own: '#123456' }, s5, t.id, inv)) === JSON.stringify(old({ own: '#123456' }, s5, t.id, inv)), `theme ${t.id}${inv ? ' inverted' : ''} resolves differently`)
}

/* exit, not `vite.close()` — kol-component starts a lazy import on load that a closed server then
   fails to fetch, after every check has already run */
if (bad.length) { console.error(bad.join('\n')); process.exit(1) }
console.log(`palette ok — ${RELATIONS.length} relations, ${THEMES.length} themes unchanged`)
process.exit(0)
