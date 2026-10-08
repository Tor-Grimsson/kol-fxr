// the one runnable check — `node src/editor/library/mergeRemote.check.mjs`
import assert from 'node:assert/strict'
import { mergeRemote } from './mergeRemote.js'

const row = (id, kind, updatedAt, deleted = false, spec = {}) => ({ id, kind, name: id, spec: { id, name: id, savedAt: 1, updatedAt, ...spec }, updatedAt, deleted })
const local = {
  preset: [
    { id: 'a', name: 'a', savedAt: 100 },                 // only local → pushed up
    { id: 'b', name: 'b', savedAt: 100, updatedAt: 300 }, // local newer than remote → kept, pushed
    { id: 'c', name: 'c', savedAt: 100 },                 // remote newer → remote wins
    { id: 'd', name: 'd', savedAt: 100 },                 // remote tombstone newer → dropped
    { id: 'e', name: 'e', savedAt: 500 },                 // remote tombstone OLDER → kept, pushed (resurrects)
  ],
  palette: [],
}
const rows = [
  row('b', 'preset', 200),
  row('c', 'preset', 900, false, { ringCount: 99 }),
  row('d', 'preset', 400, true),
  row('e', 'preset', 300, true),
  row('f', 'preset', 50),          // only remote → appears
  row('g', 'preset', 50, true),    // remote tombstone, nothing local → nothing
  row('p', 'palette', 10),         // another kind
]
const { next, pushes } = mergeRemote(local, rows)
assert.deepEqual(next.preset.map((it) => it.id), ['a', 'b', 'c', 'e', 'f'])
assert.equal(next.preset.find((it) => it.id === 'c').ringCount, 99, 'remote newer replaces the item')
assert.deepEqual(next.palette.map((it) => it.id), ['p'])
assert.deepEqual(pushes.map((p) => p.item.id).sort(), ['a', 'b', 'e'])
assert.equal(pushes.every((p) => p.op === 'put' && p.kind === 'preset'), true)

// empty both ways
assert.deepEqual(mergeRemote({ preset: [] }, []), { next: { preset: [] }, pushes: [] })
console.log('mergeRemote: all checks pass')
