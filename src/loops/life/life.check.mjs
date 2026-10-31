// Game of Life check (plan 49 10.3): the step matches known patterns. `node src/loops/life/life.check.mjs`
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error', ssr: { noExternal: [/^@kolkrabbi\//] }, optimizeDeps: { noDiscovery: true, include: [] } })
const { lifeStep, SEEDS } = await vite.ssrLoadModule(new URL('./gameOfLife.js', import.meta.url).pathname)
await vite.close()

const LIFE = { birth: [3], survive: [2, 3] }
const grid = (cols, rows, cells, ox = 0, oy = 0) => { const g = new Uint8Array(cols * rows); for (const [x, y] of cells) g[(y + oy) * cols + x + ox] = 1; return g }
const run = (g, cols, rows, n, wrap = false) => { let a = g, b = new Uint8Array(g.length); for (let i = 0; i < n; i++) { lifeStep(a, b, cols, rows, LIFE, wrap); [a, b] = [b, a] } return a }
const live = (g, cols) => [...g].flatMap((v, i) => (v ? [[i % cols, Math.floor(i / cols)]] : []))

/* blinker: period 2 */
const b0 = grid(5, 5, [[1, 2], [2, 2], [3, 2]])
assert.notDeepEqual(run(b0, 5, 5, 1), b0, 'blinker changes after 1')
assert.deepEqual(run(b0, 5, 5, 2), b0, 'blinker repeats after 2')

/* glider: one cell diagonally every 4 generations */
const G = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]
const g4 = live(run(grid(20, 20, G, 2, 2), 20, 20, 4), 20)
assert.deepEqual(g4, live(grid(20, 20, G, 3, 3), 20), 'glider moved +1,+1 in 4')

/* R-pentomino settles at 116 cells by generation 1103 (grid large enough that nothing reaches the edge) */
const N = 800 /* its six gliders travel ~275 cells by 1103 — a smaller grid loses them at the dead edge */
const r = run(grid(N, N, SEEDS.rpentomino, 400, 400), N, N, 1103)
assert.equal(r.reduce((a, v) => a + v, 0), 116, 'R-pentomino → 116 at 1103')

console.log('life ok — blinker · glider · R-pentomino 116')
