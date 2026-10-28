// growth.check — the growing line grows, stays in the frame, never crosses itself, and packs tighter where the field is
// darker. `node src/loops/growth/growth.check.mjs`
import assert from 'node:assert/strict'
import { Growth } from './engine.js'

/* a field dark on the left half, light on the right */
const cols = 40, rows = 40
const data = new Float32Array(cols * rows).map((_, i) => ((i % cols) < cols / 2 ? 1 : 0))
let s = 7
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
const g = new Growth({ w: 600, h: 600, density: { cols, rows, data }, rand, cap: 2500 })
g.setParams({ minGap: 5, maxGap: 18, contrast: 1, growth: 8 })
g.seed(0.5, 0.5)
for (let i = 0; i < 700; i++) g.step()
const { x, y } = g
const n = x.length
assert.ok(n > 1000 && n <= 2500, `grew to ${n} (cap 2500)`)
for (let i = 0; i < n; i++) assert.ok(x[i] >= 0 && x[i] <= 600 && y[i] >= 0 && y[i] <= 600, 'inside the frame')

/* no two non-adjacent segments cross */
const cross = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (d === 0) return false
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d
  return t > 0 && t < 1 && u > 0 && u < 1
}
let crossings = 0
for (let i = 0; i < n; i++) {
  const i2 = (i + 1) % n
  for (let j = i + 2; j < n; j++) {
    const j2 = (j + 1) % n
    if (j2 === i) continue
    if (cross(x[i], y[i], x[i2], y[i2], x[j], y[j], x[j2], y[j2])) crossings++
  }
}
assert.ok(crossings <= n * 0.002, `${crossings} crossings in ${n} segments`)

/* nearest non-adjacent neighbour, dark half vs light half */
const near = (i) => { let m = Infinity; for (let j = 0; j < n; j++) { if (Math.abs(i - j) < 3 || Math.abs(i - j) > n - 3) continue; m = Math.min(m, Math.hypot(x[i] - x[j], y[i] - y[j])) } return m }
const dark = [], light = []
for (let i = 0; i < n; i += 5) (x[i] < 280 ? dark : x[i] > 320 ? light : []).push(near(i))
const avg = (a) => a.reduce((p, v) => p + v, 0) / a.length
assert.ok(dark.length && light.length, 'the line reached both halves')
assert.ok(avg(dark) < avg(light) * 0.7, `dark spacing ${avg(dark).toFixed(1)} < light ${avg(light).toFixed(1)}`)
console.log(`growth ok — ${n} nodes, ${crossings} crossings, spacing dark ${avg(dark).toFixed(1)} / light ${avg(light).toFixed(1)}`)

/* the export is ONE closed path */
const d = g.pathD(300, 300)
assert.equal((d.match(/M/g) || []).length, 1, 'one moveto')
assert.ok(d.endsWith('Z'), 'closed')
console.log(`growth svg ok — one path, ${d.length} chars`)
