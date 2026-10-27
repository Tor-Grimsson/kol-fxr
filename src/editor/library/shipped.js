import { GROUPS, presetsInGroup, presetLayerPatch, isToolPreset, loopById } from '../../loops/registry'
import { KINETIC_PRESETS, presetComp } from '../../kinetic/presets'
import { CANVAS_W, CANVAS_H, TEXT_DEFAULTS } from '../compose/state'
import { getAppSettings } from '../lib/appSettings'
import { stepFromPreset } from '../morph/StepPicker'
import { loadLibrary, saveLibrary } from './LibraryProvider'

/**
 * shipped — WHAT FXR SHIPS, forty files, ten per chrome (plan home-library-detail-one-card § 2, user
 * 2026-10-24: *"each category in labs IS A CATEGORY … THESE ARE ALL SAVED PRESETS IN LABS … Randomiser also has
 * presets … MORPH just needs to generate 10 presets … EDITOR, just save 10 EDITOR FILES"*). The Library lists them by
 * chrome; Home lists only the user's (everything without `shipped`).
 *
 *   LABS         ten files, one per category across Effects · Generative · Vector · Composition (LABS_PICKS)
 *   RANDOMISER   ten files across ten Generative categories (RANDOMISER_PICKS) — a Randomiser file records the pick
 *   MORPH        ten files, two presets of one generator as the steps (one generator per morph — morphStore)
 *   EDITOR       ten files made from the editor's own layer kinds
 *
 * BUILT, NEVER STORED (see shippedFiles below) and LOCAL ONLY: `shipped: true` still keeps them out of every sync
 * push (libraryApi, libraryOps, the provider, mergeRemote) should one ever reach a write.
 */
/* the seed flag of the first build, which wrote these files into localStorage (see dropStoredShipped) */
const FLAG = 'kol.editor.library.shipped.v1'
const SHIP_DATE = Date.parse('2026-10-24T12:00:00Z')

const base = (id, name, mode, group, sub, layers, extra = {}) => ({
  v: 1, id, name, mode, aspect: '1:1', group, sub: sub ?? null, shipped: true,
  savedAt: SHIP_DATE, updatedAt: SHIP_DATE, intent: 'whole', palette: null, layers, ...extra,
})
const layer = (type, fields) => ({ id: `ship-${type}`, type, visible: true, opacity: 1, blend: 'normal', ...fields })
const full = { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H }
const loopLayer = (p, gid) => layer('loop', { ...full, ...presetLayerPatch(p, gid), themeId: getAppSettings().defaultTheme })
const bg = (color = 'palette:primary') => layer('background', { color })

/* every loops preset once, under the first group that lists it */
function loopPool() {
  const seen = new Set()
  const out = []
  for (const g of GROUPS) for (const p of presetsInGroup(g.id)) {
    if (seen.has(p.id)) continue
    seen.add(p.id)
    out.push({ p, gid: g.id, group: g.label })
  }
  return out
}

/* TEN PER CHROME (user 2026-10-24: *"maintaining 1337 saves is ridiculous … they need to slim down and work within a
 * reasonable number"*). The labs and randomiser catalogs stay where they are — every category, type and preset is an
 * OPTION in the chrome — and the Library ships ten files each, one per category where it can: LABS across its four
 * sections (Effects and Generative both in), RANDOMISER across ten Generative categories (the randomiser's own pool).
 * `group` is the section, `sub` the category. The full 1,137-file generator is in _tmp/2026-10-24-shipped-1137-generator/. */
const LABS_PICKS = [
  ['Effects', 'Pattern', 'optic', (ps) => ps.find((p) => p.sub === 'Mesh Gradient')],
  ['Generative', 'Scanline', 'scanline'],
  ['Generative', 'Loops', 'shape'],
  ['Generative', 'Math', 'math'],
  ['Generative', 'Penrose', 'penrose'],
  ['Generative', 'Flow', 'flow'],
  ['Generative', 'Gradients', 'gradients'],
  ['Vector', 'Distressor', 'distress'],
  ['Composition', 'Para Type', 'paratype', null, 'misc'],
]
const RANDOMISER_PICKS = ['scanline', 'pattern', 'shape', 'field', 'math', 'penrose', 'flow', 'lettergap', 'gradients', 'softforms']
const CATEGORY_OF = { scanline: 'Scanline', pattern: 'Pattern', shape: 'Loops', field: 'Pattern', math: 'Math', penrose: 'Penrose', flow: 'Flow', lettergap: 'Letter Gap', gradients: 'Gradients', softforms: 'Soft Forms' }

const labsAndRandomiser = () => {
  const visual = (gid) => presetsInGroup(gid).filter((p) => !isToolPreset(p))
  const labs = LABS_PICKS.map(([section, category, gid, pick, type = 'loop']) => {
    const p = (pick ? pick(presetsInGroup(gid)) : null) ?? presetsInGroup(gid)[0]
    return p && base(`ship:labs:${p.id}`, p.label, 'labs', section, category, [{ ...loopLayer(p, gid), type }])
  }).filter(Boolean)
  /* the tenth LABS file is the Composition section's kinetic type */
  const kt = KINETIC_PRESETS[0]
  labs.push(base(`ship:labs:type-${kt.id}`, kt.label, 'labs', 'Composition', 'Kinetic type',
    [layer('kinetic', { ...full, presetId: kt.id, presetLabel: kt.label, comp: presetComp(kt) })]))
  /* the randomiser's ten — a different preset from LABS' where the category has one, so the two views are not twins */
  const randomiser = RANDOMISER_PICKS.map((gid) => {
    const ps = visual(gid)
    const p = ps[1] ?? ps[0]
    return p && base(`ship:randomiser:${p.id}`, p.label, 'randomiser', 'Generative', CATEGORY_OF[gid], [loopLayer(p, gid)])
  }).filter(Boolean)
  return [...labs, ...randomiser]
}

/* ten morphs, spread across the generators that have two presets or more */
function morphs() {
  const byLoop = new Map()
  for (const e of loopPool()) {
    if (isToolPreset(e.p)) continue
    if (!byLoop.has(e.p.loop)) byLoop.set(e.p.loop, [])
    byLoop.get(e.p.loop).push(e)
  }
  const pairs = [...byLoop.values()].filter((list) => list.length >= 2)
  return Array.from({ length: 10 }, (_, i) => {
    const list = pairs[Math.floor((i * pairs.length) / 10)]
    const a = list[0], b = list[list.length - 1]
    const name = `${a.p.label} → ${b.p.label}`
    return base(`ship:morph:${a.p.id}--${b.p.id}`, name, 'morph', a.group, loopById(a.p.loop)?.label ?? null, [loopLayer(a.p, a.gid)], {
      morph: { mode: 'blend', loopId: a.p.loop, steps: [stepFromPreset(a.p), stepFromPreset(b.p)], curve: 'in-out', cycle: 'loop', resolution: 0, syncLoop: false, seconds: 4 },
    })
  })
}

/* ten editor files from the editor's own layer kinds — a preset (background + a loop), type, a logo, a vector form */
function editorFiles() {
  const find = (id) => loopPool().find((e) => e.p.id === id) ?? loopPool()[0]
  const preset = (id, name, color) => { const e = find(id); return base(`ship:editor:${id}`, name, 'editor', 'Preset', e.group, [bg(color), loopLayer(e.p, e.gid)]) }
  const text = (slug, name, copy, extra = {}) => base(`ship:editor:${slug}`, name, 'editor', 'Type', null, [bg('palette:light'),
    layer('text', { x: 90, y: 340, w: 900, h: 400, ...TEXT_DEFAULTS, text: copy, color: 'palette:dark', ...extra })])
  const logo = (slug, name, ground, ink) => base(`ship:editor:${slug}`, name, 'editor', 'Logo', null, [bg(ground),
    layer('shape', { x: 340, y: 340, w: 400, h: 400, kind: 'logo', variant: 'logomark', fit: 'fill', color: ink })])
  /* nodes sit at the layer's bbox origin (kol-component pathMath) — the layer's x/y/w/h is the box */
  const vector = (slug, name, nodes, closed) => {
    const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y)
    return base(`ship:editor:${slug}`, name, 'editor', 'Vector form', null, [bg('palette:light'),
      layer('path', { x: (CANVAS_W - Math.max(...xs)) / 2, y: (CANVAS_H - Math.max(...ys)) / 2, w: Math.max(...xs), h: Math.max(...ys), nodes, closed, color: closed ? 'palette:primary' : null, stroke: 'palette:dark', strokeWidth: closed ? 0 : 24 })])
  }
  const n = (x, y, ix, iy, ox, oy) => ({ x, y, in: ix == null ? null : { x: ix, y: iy }, out: ox == null ? null : { x: ox, y: oy } })
  return [
    preset('scan-spaced-drift', 'Poster, scanline', 'palette:dark'),
    preset(loopPool().find((e) => e.gid === 'field')?.p.id ?? 'plasma', 'Poster, field', 'palette:primary'),
    preset(loopPool().find((e) => e.gid === 'optic')?.p.id ?? 'optic-moire', 'Poster, optic', 'palette:light'),
    text('type-headline', 'Type, headline', 'Made to last'),
    text('type-radial', 'Type, radial', 'Without a soul, is it a place?', { size: 64, weight: 500 }),
    text('type-statement', 'Type, statement', 'Turning and turning', { size: 120, weight: 900 }),
    logo('logo-primary', 'Logomark on primary', 'palette:primary', 'palette:dark'),
    logo('logo-dark', 'Logomark on dark', 'palette:dark', 'palette:light'),
    vector('vector-ribbon', 'Vector, ribbon', [n(0, 200, null, null, 160, 0), n(400, 200, 240, 400, 560, 0), n(800, 200, 640, 400, null, null)], false),
    vector('vector-leaf', 'Vector, leaf', [n(300, 0, 60, 120, 540, 120), n(300, 600, 540, 480, 60, 480)], true),
  ]
}

/* THE LIST IS BUILT, NOT STORED (2026-10-24). Written into localStorage it was ~1.1 MB, and on a browser whose
 * quota was already near full the write failed silently — the Library came up empty and Home's covers could not save
 * (user: "why is library empty??"). The files are a pure function of the registry, so they are built once per tab;
 * only the user's changes to them persist, small: the ids removed and the names changed. */
let built = null
export const shippedFiles = () => (built ??= [...editorFiles(), ...labsAndRandomiser(), ...morphs()])

const OVERRIDES = 'kol.editor.library.shipped.v2'
export const readShippedRaw = () => { try { return localStorage.getItem(OVERRIDES) } catch { return null } }
const overrides = () => { try { return JSON.parse(readShippedRaw() || '{}') } catch { return {} } }
function writeOverrides(next) {
  try { localStorage.setItem(OVERRIDES, JSON.stringify(next)) } catch (e) { console.warn('shipped files: could not save the change —', e?.message || e) }
  window.dispatchEvent(new CustomEvent('kol:shipped'))
}
export const subscribeShipped = (onChange) => {
  window.addEventListener('kol:shipped', onChange)
  window.addEventListener('storage', onChange)
  return () => { window.removeEventListener('kol:shipped', onChange); window.removeEventListener('storage', onChange) }
}

/** The shipped files with this device's removals and renames applied. */
export function listShipped() {
  const { removed = [], names = {} } = overrides()
  const gone = new Set(removed)
  return shippedFiles().filter((f) => !gone.has(f.id)).map((f) => (names[f.id] ? { ...f, name: names[f.id] } : f))
}
export function renameShipped(id, name) { const o = overrides(); writeOverrides({ ...o, names: { ...o.names, [id]: name } }) }
export function removeShipped(id) { const o = overrides(); writeOverrides({ ...o, removed: [...new Set([...(o.removed ?? []), id])] }) }

/** A file by id — the user's saves first, then what fxr ships. Every `?open=` resolves through here. */
export const findFile = (id) => (loadLibrary().preset ?? []).find((p) => p.id === id) ?? listShipped().find((p) => p.id === id) ?? null

/** Once: the shipped files an earlier build WROTE into the library leave it again, giving the quota back. */
export function dropStoredShipped() {
  try {
    if (localStorage.getItem(FLAG) == null) return
    const lib = loadLibrary()
    if ((lib.preset ?? []).some((p) => p.shipped)) saveLibrary({ ...lib, preset: lib.preset.filter((p) => !p.shipped) })
    localStorage.removeItem(FLAG)
  } catch { /* storage blocked — nothing was written either */ }
}
