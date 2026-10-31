import { mulberry32 } from '../gl/rng.js'
import { transport } from '../../editor/params/transport.js'

// GAME OF LIFE (plan 49 10.3, user 2026-10-31: *"INTRODUCE Game of life, its in kol-monitor, just grab that code file and
// settings?"*). The simulation and its settings come from kol-monitor's `src/modules/generators/LifeModule.jsx` — the nine
// rule sets, the long-lived seeds, the step — without the rack's jacks and knobs. Listed under Penrose › Reaction & Life.
//
// ⚠ NON-SCRUBBING: the frame is the colony's history. It steps only while the transport plays (plan 49 10.1, never on its
// own); Rule, Seed, Cell size, Variation, the frame's aspect, or a stop/rewind restart it. Cells draw as crisp squares at
// any size (plan 49 5.3 — pixelation is a choice, here the cell size). The pointer draws live cells (Mouse toggle).

/* kol-monitor's RULESETS, the same order (Life sits in the middle) */
const RULES = [
  { value: 'seeds', label: 'Seeds', birth: [2], survive: [] },
  { value: 'diamoeba', label: 'Diamoeba', birth: [3, 5, 6, 7, 8], survive: [5, 6, 7, 8] },
  { value: 'daynight', label: 'Day & Night', birth: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
  { value: 'maze', label: 'Maze', birth: [3], survive: [1, 2, 3, 4, 5] },
  { value: 'life', label: 'Life (B3/S23)', birth: [3], survive: [2, 3] },
  { value: 'highlife', label: 'HighLife', birth: [3, 6], survive: [2, 3] },
  { value: 'morley', label: 'Morley', birth: [3, 6, 8], survive: [2, 4, 5] },
  { value: 'anneal', label: 'Anneal', birth: [4, 6, 7, 8], survive: [3, 5, 6, 7, 8] },
  { value: 'replicator', label: 'Replicator', birth: [1, 3, 5, 7], survive: [1, 3, 5, 7] },
]
/* kol-monitor's METHUSELAHS — long-lived seeds for classic Life */
export const SEEDS = {
  rpentomino: [[0, 0], [1, 0], [-1, 1], [0, 1], [0, 2]],
  acorn: [[0, 0], [1, 0], [1, 2], [3, 1], [4, 0], [5, 0], [6, 0]],
  diehard: [[0, 0], [1, 0], [1, 1], [5, 1], [6, 1], [7, 1], [6, -1]],
  pi: [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
}
const SEED_OPTS = [
  { value: 'auto', label: 'Auto (per rule)' },
  { value: 'methuselahs', label: 'Methuselahs' },
  { value: 'random', label: 'Random' },
  { value: 'clusters', label: 'Clusters' },
]

const ruleOf = (v) => RULES.find((r) => r.value === v) ?? RULES[4]
/* AUTO SEED (kol-monitor's autoReseed: methuselahs for Life, clusters otherwise — extended): the sparse long-lived seeds
   suit Life and HighLife, but Diamoeba, Anneal, Day & Night and Morley need a dense soup or they die or freeze at once
   (measured 2026-10-31: Diamoeba and Anneal blank, Day & Night and Morley still, from methuselahs) */
const AUTO = { life: ['methuselahs'], highlife: ['methuselahs'], diamoeba: ['random', 0.5], anneal: ['random', 0.5], daynight: ['random', 0.5], morley: ['random', 0.35], seeds: ['clusters'], maze: ['clusters'], replicator: ['clusters'] }

/** one generation: `src` → `dst` (Uint8Array cols×rows), birth/survive as neighbour counts — kol-monitor's step, with
 *  lookup tables in place of `includes` so a 1080-wide grid stays inside a frame */
export function lifeStep(src, dst, cols, rows, rule, wrap) {
  const B = new Uint8Array(9), S = new Uint8Array(9)
  for (const n of rule.birth) B[n] = 1
  for (const n of rule.survive) S[n] = 1
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let c = 0
      for (let dy = -1; dy <= 1; dy++) {
        let ny = y + dy
        if (ny < 0 || ny >= rows) { if (!wrap) continue; ny = (ny + rows) % rows }
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          let nx = x + dx
          if (nx < 0 || nx >= cols) { if (!wrap) continue; nx = (nx + cols) % cols }
          c += src[ny * cols + nx]
        }
      }
      dst[y * cols + x] = src[y * cols + x] ? S[c] : B[c]
    }
  }
}

function seedGrid(cols, rows, mode, density, rand) {
  const g = new Uint8Array(cols * rows)
  const stamp = (pat, cx, cy) => { for (const [dx, dy] of pat) { const x = cx + dx, y = cy + dy; if (x >= 0 && x < cols && y >= 0 && y < rows) g[y * cols + x] = 1 } }
  if (mode === 'random') { for (let i = 0; i < g.length; i++) g[i] = rand() < density ? 1 : 0; return g }
  if (mode === 'clusters') {
    const n = 3 + Math.floor(rand() * 4)
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(cols * (0.2 + rand() * 0.6)), cy = Math.floor(rows * (0.2 + rand() * 0.6)), r = 2 + Math.floor(rand() * Math.max(2, cols / 40))
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r && rand() < 0.5) stamp([[0, 0]], cx + dx, cy + dy)
    }
    return g
  }
  /* methuselahs: a handful, scaled to the grid so a big field is not one lonely seed */
  const pats = Object.values(SEEDS)
  const n = Math.max(2, Math.round((cols * rows) / 9000))
  for (let i = 0; i < n; i++) stamp(pats[Math.floor(rand() * pats.length)], Math.floor(cols * (0.15 + rand() * 0.7)), Math.floor(rows * (0.15 + rand() * 0.7)))
  return g
}

let st = null // { key, cols, rows, a, b, acc }

export default {
  id: 'life-game',
  label: 'Game of Life',
  group: 'penrose',
  kind: '2d',
  duration: 8, // nominal — the colony free-runs; u only paces the transport
  about: { kind: 'generative', basis: "Conway's Game of Life and eight other outer-totalistic cellular automata (B/S rules), from kol-monitor's Life module", engine: 'canvas 2D', dimension: '2D' },
  params: [
    { key: 'rule', label: 'Rule', type: 'select', options: RULES.map(({ value, label }) => ({ value, label })), default: 'life', noRandom: true, tab: 'generate' },
    { key: 'seedMode', label: 'Seed', type: 'select', options: SEED_OPTS, default: 'auto', noRandom: true, tab: 'generate' },
    { key: 'density', label: 'Density', type: 'range', min: 0.05, max: 0.6, step: 0.01, default: 0.25, tab: 'generate', when: (l) => (l.seedMode ?? 'auto') === 'random' },
    { key: 'cell', label: 'Cell size', type: 'range', min: 2, max: 40, step: 1, default: 8, noRandom: true, tab: 'generate' },
    { key: 'variant', label: 'Variation', type: 'range', min: 1, max: 99, step: 1, default: 1, noRandom: true, tab: 'generate' },
    { key: 'wrap', label: 'Wrap', type: 'toggle', default: true, noRandom: true },
    { key: 'gap', label: 'Gap', type: 'range', min: 0, max: 0.4, step: 0.02, default: 0.12 },
    { key: 'paper', label: 'Background', type: 'color', role: 'bg', default: '#121215', section: 'Color' },
    { key: 'ink', label: 'Cells', type: 'color', role: 'fg', default: '#FAF7F0', section: 'Color' },
    { key: 'speed', label: 'Speed', type: 'range', min: 1, max: 30, step: 1, default: 10, noRandom: true, tab: 'anim', section: 'Motion' },
    { key: 'mouse', label: 'Mouse', type: 'toggle', default: true, noRandom: true, section: 'Interaction' },
  ],
  draw(ctx, u, w, h, p) {
    const cell = Math.max(2, p.cell ?? 8)
    const cols = Math.max(8, Math.floor(w / cell)), rows = Math.max(8, Math.floor(h / cell))
    const key = `${p.rule}|${p.seedMode}|${p.density}|${cols}x${rows}|${p.variant}|${transport.getEpoch()}`
    if (!st || st.key !== key) {
      const [mode, dens] = (p.seedMode ?? 'auto') === 'auto' ? AUTO[p.rule ?? 'life'] ?? ['methuselahs'] : [p.seedMode, p.density ?? 0.25]
      const a = seedGrid(cols, rows, mode, dens ?? 0.25, mulberry32((p.variant ?? 1) >>> 0))
      st = { key, cols, rows, a, b: new Uint8Array(cols * rows), acc: 0, last: performance.now() }
    }
    const now = performance.now(), dt = Math.min(0.1, (now - st.last) / 1000); st.last = now
    if (transport.isPlaying()) {
      /* the pointer draws live cells */
      const s = transport.getCtx().stage
      if (p.mouse !== false && s?.down && p.w && p.h) {
        const fx = (s.x - (p.x ?? 0)) / p.w, fy = (s.y - (p.y ?? 0)) / p.h
        if (fx >= 0 && fx < 1 && fy >= 0 && fy < 1) {
          const cx = Math.floor(fx * cols), cy = Math.floor(fy * rows)
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && x < cols && y >= 0 && y < rows) st.a[y * cols + x] = 1 }
        }
      }
      st.acc += dt * (p.speed ?? 10)
      const rule = ruleOf(p.rule)
      for (let n = 0; st.acc >= 1 && n < 4; n++, st.acc -= 1) { lifeStep(st.a, st.b, cols, rows, rule, p.wrap !== false); const t = st.a; st.a = st.b; st.b = t }
      if (st.acc > 4) st.acc = 0
    }
    ctx.fillStyle = p.paper ?? '#121215'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = p.ink ?? '#FAF7F0'
    const cw = w / cols, ch = h / rows, g = Math.min(cw, ch) * (p.gap ?? 0.12)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (st.a[y * cols + x]) ctx.fillRect(Math.round(x * cw + g / 2), Math.round(y * ch + g / 2), Math.max(1, Math.round(cw - g)), Math.max(1, Math.round(ch - g)))
  },
}
