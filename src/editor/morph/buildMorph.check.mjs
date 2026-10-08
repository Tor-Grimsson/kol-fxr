// the one runnable check — `node src/editor/morph/buildMorph.check.mjs`
import assert from 'node:assert/strict'
import { buildMorph, keysFor, loopSnapshot } from './buildMorph.js'

const schema = [
  { key: 'geometry', type: 'select', default: 'rows' },
  { key: 'ringCount', type: 'range', default: 60 },
  { key: 'minGap', type: 'range', default: 5 },
  { key: 'seed', type: 'range', default: 0 },
  { key: 'fg', type: 'color', default: '#f4f1ea' },
  { key: 'invert', type: 'toggle', default: false },
]
const P1 = { type: 'loop', loopId: 'scanline', presetId: 'a', geometry: 'rings', ringCount: 60, minGap: 5, seed: 0, fg: '#f4f1ea', invert: false }
const P2 = { type: 'loop', loopId: 'scanline', presetId: 'b', geometry: 'rings', ringCount: 100, minGap: 5, seed: 7, fg: '#ff7a3c', invert: true }
const P3 = { type: 'loop', loopId: 'scanline', presetId: 'c', geometry: 'rows', ringCount: 36, minGap: 5, seed: 0, fg: '#f4f1ea', invert: false }

// loop: closing key returns to P1; equal param untouched; identity from P1
const { patch, tweened, stepped, held } = buildMorph({ snapshots: [P1, P2, P3], schema })
assert.equal(patch.presetId, 'a')
assert.equal(patch.minGap, 5, 'equal across the N stays raw')
assert.deepEqual(patch.ringCount.keys.map((k) => k.v), [60, 100, 36, 60])
assert.deepEqual(patch.ringCount.keys.map((k) => k.t), [0, 1 / 3, 2 / 3, 1])
assert.equal(patch.ringCount.keys[0].easing, 'in-out')
assert.equal(patch.geometry.keys[0].easing, 'hold', 'a select steps')
assert.equal(patch.invert.keys[0].easing, 'hold', 'a toggle steps')
assert.equal(patch.seed, 0, 'seed held at P1')
assert.deepEqual(tweened.map((p) => p.key), ['ringCount', 'fg'])
assert.deepEqual(stepped.map((p) => p.key), ['geometry', 'invert'])
assert.deepEqual(held.map((p) => p.key), ['seed'])

// stepSeeds: a cut, not a hold
assert.equal(buildMorph({ snapshots: [P1, P2], schema, stepSeeds: true }).patch.seed.keys[0].easing, 'hold')

// ping-pong: out and back, ends where it starts; once: no closing key
assert.deepEqual(keysFor([1, 2, 3], 'pingpong', 'linear').map((k) => k.v), [1, 2, 3, 2, 1])
assert.deepEqual(keysFor([1, 2, 3], 'once', 'linear').map((k) => k.t), [0, 0.5, 1])
assert.deepEqual(keysFor([1, 2], 'loop', 'linear').map((k) => k.t), [0, 0.5, 1])

// snapshot lookup
assert.equal(loopSnapshot({ layers: [{ type: 'photo' }, P2] }, 'scanline'), P2)
assert.equal(loopSnapshot({ layers: [P2] }, 'halftone'), null)
assert.throws(() => buildMorph({ snapshots: [P1], schema }))

console.log('buildMorph: all checks pass')
