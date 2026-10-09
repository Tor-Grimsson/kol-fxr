// node src/editor/morph/shape.check.mjs — the Shape engine's one check (plan 10 § 4)
import assert from 'node:assert/strict'
import { recordOutline, resample, align, morphOutlines, morphKeys, mixStyle } from './shape.js'
import star from '../../loops/shape/starMorph.js'

/* a 2D context stub: style props, a transform stack, nothing painted */
const stub = () => ({
  fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, _m: [1, 0, 0, 1, 0, 0], _st: [], canvas: { width: 100, height: 100 },
  getTransform() { const [a, b, c, d, e, f] = this._m; return { a, b, c, d, e, f } },
  save() { this._st.push(this._m) }, restore() { this._m = this._st.pop() ?? this._m },
  setTransform(a, b, c, d, e, f) { this._m = [a, b, c, d, e, f] },
  translate(x, y) { const [a, b, c, d, e, f] = this._m; this._m = [a, b, c, d, a * x + c * y + e, b * x + d * y + f] },
  rotate(r) { const cs = Math.cos(r), sn = Math.sin(r); const [a, b, c, d, e, f] = this._m; this._m = [a * cs + c * sn, b * cs + d * sn, -a * sn + c * cs, -b * sn + d * cs, e, f] },
  scale(x, y) { const [a, b, c, d, e, f] = this._m; this._m = [a * x, b * x, c * y, d * y, e, f] },
})
const defaults = (def, over = {}) => Object.fromEntries(def.params.map((p) => [p.key, over[p.key] ?? p.default]))
const finite = (pts) => pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

// 1. the star records as a closed polygon of 2·points vertices (plus whatever bg it paints)
const five = recordOutline(star.draw.bind(star), 0, 100, 100, defaults(star), stub())
const poly5 = five.find((s) => s.closed && s.pts.length === 10)
assert.ok(poly5, `a 5-point star records 10 vertices (got ${five.map((s) => s.pts.length).join(',')})`)
assert.ok(finite(poly5.pts), 'recorded points are finite canvas coords')

// 2. resample keeps N and closure
const sq = [[0, 0], [10, 0], [10, 10], [0, 10]]
const r8 = resample(sq, true, 8)
assert.equal(r8.length, 8)
assert.deepEqual(r8[0], [0, 0]); assert.deepEqual(r8[4], [10, 10])
const r5 = resample(sq, false, 5)
assert.deepEqual(r5[0], [0, 0]); assert.deepEqual(r5[4], [0, 10])

// 3. align undoes a start-index rotation
const rot = [...r8.slice(3), ...r8.slice(0, 3)]
assert.deepEqual(align(r8, rot, true), r8)

// 4. a 5-star to a 7-star halfway: one polygon, N finite points
const seven = recordOutline(star.draw.bind(star), 0, 100, 100, defaults(star, { points: 7 }), stub())
const mid = morphOutlines([poly5], [seven.find((s) => s.closed && s.pts.length === 14)], 0.5)
assert.equal(mid.length, 1)
assert.ok(mid[0].pts.length >= 64 && finite(mid[0].pts), 'halfway polygon has N finite points')
assert.ok(mid[0].closed && mid[0].op === 'fill')

// 5. the side with more subpaths folds into runs: one star against 40 dashes is one pair
const dashes = Array.from({ length: 40 }, (_, i) => ({ pts: [[i, 0], [i + 0.5, 0]], closed: false, op: 'stroke', style: '#fff', alpha: 1, lineWidth: 1 }))
const folded = morphOutlines([poly5], dashes, 0.5)
assert.equal(folded.length, 2, 'fill meets stroke: two passes on one geometry'); assert.deepEqual(folded[0].pts, folded[1].pts)
assert.ok(Math.abs(folded[0].alpha - 0.5) < 1e-9 && Math.abs(folded[1].alpha - 0.5) < 1e-9)
// 5b. backgrounds pair with backgrounds
const bg = { pts: [[0, 0], [100, 0], [100, 100], [0, 100]], closed: true, op: 'fill', style: '#000', alpha: 1, lineWidth: 1 }
const withBg = morphOutlines([bg, poly5], [bg, ...dashes], 0.5, 100 * 100)
assert.equal(withBg[0].pts.length >= 64 && withBg[0].op, 'fill')

// 6. morphT keys
const loop = morphKeys(3, 'loop', 'in-out')
assert.deepEqual(loop.map((k) => k.v), [0, 1, 2, 3]); assert.deepEqual(loop.map((k) => +k.t.toFixed(3)), [0, 0.333, 0.667, 1])
assert.equal(morphKeys(3, 'pingpong', 'in-out').length, 5)
assert.deepEqual(morphKeys(3, 'once', 'in-out').map((k) => k.t), [0, 0.5, 1])

// 7. colours mix, other styles pick the nearer
assert.equal(mixStyle('#ff0000', '#0000ff', 0.5), 'rgba(128,0,128,1.000)')
assert.equal(mixStyle('#ff0000', { grad: true }, 0.25), '#ff0000')

// 8. alignment sticks: a near-tie keeps last frame's start point (the jolts, 2026-10-09)
{
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const memo = {}
  assert.deepEqual(align(sq, sq, true, memo), sq)                       // exact match: offset 0
  const nudged = [[0.02, 0], [1, 0.02], [1, 1], [0, 1]].map(([x, y]) => [x + 0.5, y + 0.5])
  const r = align(sq.map(([x, y]) => [x + 0.5, y + 0.5]), nudged, true, memo)
  assert.equal(memo.off, 0)                                             // a tiny change does not rotate it
  assert.equal(r[0][0], nudged[0][0])
}

console.log('shape.check: ok')
