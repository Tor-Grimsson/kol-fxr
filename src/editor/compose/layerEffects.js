/**
 * LAYER EFFECTS (plan 32 § 2; Affinity's Layer Effects window, the user's references 2026-10-13) —
 * the ten styling effects a layer wears: Bevel / Emboss · Outline · 3D · Inner Shadow · Inner Glow ·
 * Color Overlay · Gradient Overlay · Outer Glow · Outer Shadow · Gaussian Blur.
 *
 * They are NOT stages in `layer.filters` (the live-filter chain — canvas → pixi → GL, eight max):
 * Affinity keeps the two systems apart and so do we. A layer carries
 *
 *   effects:       [{ id, key, enabled, params }]   — instances, any order; five types stack
 *   effectsRefW:   number | null                     — Scale with Object: the width px params were set at
 *   effectsFillOpacity: 0..1                         — the content without its effects (a 0 fill keeps its shadow);
 *                                                     NOT `fillOpacity`, which is the fill PAINT's alpha (paint.js)
 *
 * and renders them as ONE SVG `<filter>` — the platform's own shadow / glow / lighting primitives —
 * so every layer type (DOM, SVG or canvas) takes them through CSS `filter: url(#…)`, and the SVG export
 * writes the same markup (PNG export rasterises that SVG). `effectsFilter()` is the one generator both
 * call; `origin` is where the layer's box sits in the filter's user space (0,0 on screen, x,y in export).
 *
 * The stack composes in Affinity's fixed order whatever the array order: below the fill Outer Shadow ·
 * Outer Glow; then the fill (Gaussian Blur and Fill Opacity act on it); above it Color Overlay ·
 * Gradient Overlay · Inner Shadow · Inner Glow · Bevel / Emboss · 3D · Outline. Instances of one type
 * compose in array order (the window's ▲▼). Blend modes apply above the fill; below it there is no
 * backdrop inside a filter (SVG has no BackgroundImage), so a below effect blends Normal.
 * ponytail: Profile curves, the Offset Tool and extra 3D lights are not built — named in the plan.
 */

const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn',
  'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']
const BLEND_OPTIONS = BLENDS.map((b) => ({ value: b, label: b[0].toUpperCase() + b.slice(1).replace('-', ' ') }))

const blend = (dflt) => ({ key: 'blend', label: 'Blend mode', type: 'select', options: BLEND_OPTIONS, default: dflt })
const opacity = (dflt = 100) => ({ key: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 100, step: 1, default: dflt, unit: '%' })
const px = (key, label, dflt = 0, max = 100) => ({ key, label, type: 'range', min: 0, max, step: 1, default: dflt, unit: 'px', px: true })
const pct = (key, label, dflt = 0) => ({ key, label, type: 'range', min: 0, max: 100, step: 1, default: dflt, unit: '%' })
const deg = (key, label, dflt = 0, min = 0, max = 360) => ({ key, label, type: 'range', min, max, step: 1, default: dflt, unit: '°' })
const color = (key, label, dflt) => ({ key, label, type: 'color', default: dflt })
const select = (key, label, options, dflt) => ({ key, label, type: 'select', options: options.map((o) => ({ value: o, label: o[0].toUpperCase() + o.slice(1) })), default: dflt })
const toggle = (key, label, dflt = false) => ({ key, label, type: 'toggle', default: dflt })

/* the ten, in the window's order (Affinity's), with their controls as the references show them */
export const LAYER_EFFECTS = [
  { id: 'bevel', label: 'Bevel / Emboss', params: [
    select('type', 'Type', ['outer', 'inner', 'pillow', 'emboss'], 'pillow'),
    px('radius', 'Radius', 5, 50), px('depth', 'Depth', 5, 50), px('soften', 'Soften', 0, 50),
    deg('azimuth', 'Azimuth', 135), deg('elevation', 'Elevation', 45, 0, 90),
    select('highlightBlend', 'Highlight blend', ['screen', 'normal', 'lighten', 'overlay'], 'screen'),
    color('highlight', 'Highlight', '#ffffff'), pct('highlightOpacity', 'Highlight opacity', 75),
    select('shadowBlend', 'Shadow blend', ['multiply', 'normal', 'darken', 'overlay'], 'multiply'),
    color('shadow', 'Shadow', '#000000'), pct('shadowOpacity', 'Shadow opacity', 75),
  ] },
  { id: 'outline', label: 'Outline', stack: true, params: [
    blend('normal'), opacity(100), px('radius', 'Radius', 0),
    select('alignment', 'Alignment', ['outside', 'centre', 'inside'], 'outside'),
    color('color', 'Color', '#000000'),
  ] },
  { id: 'threeD', label: '3D', params: [
    px('radius', 'Radius', 5, 50), px('depth', 'Depth', 5, 50), px('soften', 'Soften', 0, 50), opacity(100),
    pct('diffuse', 'Diffuse', 100), pct('specular', 'Specular', 50), pct('shininess', 'Shininess', 80),
    color('specularColor', 'Specular color', '#ffffff'),
    pct('ambient', 'Ambient', 20), color('ambientColor', 'Ambient light color', '#ffffff'),
    deg('azimuth', 'Azimuth', 45), deg('elevation', 'Elevation', 45, 0, 90), color('lightColor', 'Color', '#ffffff'),
  ] },
  { id: 'innerShadow', label: 'Inner Shadow', stack: true, params: [
    blend('multiply'), opacity(50), px('radius', 'Radius', 0), px('offset', 'Offset', 0),
    pct('intensity', 'Intensity', 0), color('color', 'Color', '#000000'), deg('angle', 'Angle', 315),
  ] },
  { id: 'innerGlow', label: 'Inner Glow', params: [
    blend('screen'), opacity(100), px('radius', 'Radius', 0), pct('intensity', 'Intensity', 50),
    color('color', 'Color', '#ffffff'),
    { key: 'source', label: 'Source', type: 'segmented', options: [{ value: 'center', label: 'Center' }, { value: 'edge', label: 'Edge' }], default: 'edge' },
  ] },
  { id: 'colorOverlay', label: 'Color Overlay', stack: true, params: [
    blend('normal'), opacity(100), color('color', 'Color', '#000000'),
  ] },
  { id: 'gradientOverlay', label: 'Gradient Overlay', stack: true, params: [
    blend('normal'), opacity(100),
    select('type', 'Type', ['linear', 'elliptical', 'radial', 'conical'], 'linear'),
    color('from', 'Gradient start', '#000000'), color('to', 'Gradient end', '#ffffff'),
    { key: 'scaleX', label: 'Scale X', type: 'range', min: 1, max: 400, step: 1, default: 100, unit: '%' },
    { key: 'scaleY', label: 'Scale Y', type: 'range', min: 1, max: 400, step: 1, default: 100, unit: '%' },
    { key: 'offsetX', label: 'Offset X', type: 'range', min: -100, max: 100, step: 1, default: 0, unit: '%' },
    { key: 'offsetY', label: 'Offset Y', type: 'range', min: -100, max: 100, step: 1, default: 0, unit: '%' },
    deg('angle', 'Angle', 0),
  ] },
  { id: 'outerGlow', label: 'Outer Glow', params: [
    blend('screen'), opacity(100), px('radius', 'Radius', 0), pct('intensity', 'Intensity', 50),
    color('color', 'Color', '#ffffff'),
  ] },
  { id: 'outerShadow', label: 'Outer Shadow', stack: true, params: [
    blend('multiply'), opacity(50), px('radius', 'Radius', 0), px('offset', 'Offset', 0),
    pct('intensity', 'Intensity', 0), color('color', 'Color', '#000000'), deg('angle', 'Angle', 315),
    toggle('knockout', 'Fill knocks out shadow', true),
  ] },
  { id: 'gaussianBlur', label: 'Gaussian Blur', params: [
    px('radius', 'Radius', 0), toggle('preserveAlpha', 'Preserve alpha', false),
  ] },
]
export const effectDef = (id) => LAYER_EFFECTS.find((e) => e.id === id) ?? null

const BELOW = ['outerShadow', 'outerGlow']
const ABOVE = ['colorOverlay', 'gradientOverlay', 'innerShadow', 'innerGlow', 'bevel', 'threeD', 'outline']

const newKey = () => `fx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
export function makeEffect(id, enabled = true) {
  const def = effectDef(id)
  const params = {}
  for (const p of def?.params ?? []) params[p.key] = p.default
  return { id, key: newKey(), enabled, params }
}

export const layerEffectsOf = (layer) => (Array.isArray(layer?.effects) ? layer.effects : [])
export const hasLayerEffects = (layer) =>
  layerEffectsOf(layer).some((e) => e.enabled !== false && effectDef(e.id)) || (layer?.effectsFillOpacity ?? 1) < 1
export const effectsFilterId = (layer) => `le-${String(layer.id).replace(/[^a-zA-Z0-9_-]/g, '')}`

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d)
const f2 = (v) => (Math.round(v * 100) / 100).toString()
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const rad = (d) => (d * Math.PI) / 180

/* Gradient Overlay's picture: a canvas-drawn gradient (canvas has the conic one SVG lacks) as a data
   URL the filter's feImage lays over the layer's box. Cached per recipe. */
const gradCache = new Map()
function gradientImage(p, w, h) {
  const k = JSON.stringify([p.type, p.from, p.to, p.scaleX, p.scaleY, p.offsetX, p.offsetY, p.angle, Math.round(w), Math.round(h)])
  if (gradCache.has(k)) return gradCache.get(k)
  if (typeof document === 'undefined') return null
  const W = Math.max(2, Math.min(1024, Math.round(w))), H = Math.max(2, Math.min(1024, Math.round(h)))
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d')
  const cx = W / 2 + (num(p.offsetX) / 100) * W, cy = H / 2 + (num(p.offsetY) / 100) * H
  const sx = num(p.scaleX, 100) / 100, sy = num(p.scaleY, 100) / 100
  const a = rad(num(p.angle))
  g.translate(cx, cy); g.rotate(a); g.scale(sx, sy)
  const R = Math.hypot(W, H) / 2
  let grad
  if (p.type === 'conical') grad = g.createConicGradient(0, 0, 0)
  else if (p.type === 'radial' || p.type === 'elliptical') {
    if (p.type === 'elliptical') g.scale(1, H / W)
    grad = g.createRadialGradient(0, 0, 0, 0, 0, p.type === 'elliptical' ? W / 2 : R)
  } else grad = g.createLinearGradient(-W / 2, 0, W / 2, 0)
  grad.addColorStop(0, p.from ?? '#000000'); grad.addColorStop(1, p.to ?? '#ffffff')
  g.fillStyle = grad
  g.fillRect(-W * 4, -H * 4, W * 8, H * 8)
  const url = c.toDataURL('image/png')
  if (gradCache.size > 64) gradCache.clear()
  gradCache.set(k, url)
  return url
}

/**
 * The `<filter>` markup for a layer's effects, or '' when it has none. `box` = { w, h } of the layer in
 * the filter's user space; `origin` = { x, y } where that box starts (0,0 for a DOM element's own
 * space, the layer's x,y in the export document).
 */
export function effectsFilter(layer, box, origin = { x: 0, y: 0 }) {
  if (!hasLayerEffects(layer)) return ''
  const w = Math.max(1, num(box?.w, 1)), h = Math.max(1, num(box?.h, 1))
  const ox = num(origin.x), oy = num(origin.y)
  /* Scale with Object: px params follow the layer's width since the toggle went on */
  const k = layer.effectsRefW ? w / layer.effectsRefW : 1
  const on = layerEffectsOf(layer).filter((e) => e.enabled !== false && effectDef(e.id))
  const P = (e) => ({ ...Object.fromEntries((effectDef(e.id).params).map((p) => [p.key, p.default])), ...e.params })
  const L = (v) => num(v) * k
  let pad = 8
  for (const e of on) { const p = P(e); pad = Math.max(pad, (L(p.radius) + L(p.offset) + L(p.depth)) * 2 + 8) }

  let n = 0
  const id = () => `r${n++}`
  const out = []
  const fo = num(layer.effectsFillOpacity ?? 1, 1)

  /* the fill: the content, blurred if Gaussian Blur is on, at Fill Opacity */
  let fill = 'SourceGraphic'
  for (const e of on.filter((x) => x.id === 'gaussianBlur')) {
    const p = P(e), r = L(p.radius)
    if (r <= 0) continue
    const b = id()
    out.push(`<feGaussianBlur in="${fill}" stdDeviation="${f2(r / 2)}" result="${b}"/>`)
    fill = b
    if (p.preserveAlpha) { const c = id(); out.push(`<feComposite in="${fill}" in2="SourceAlpha" operator="in" result="${c}"/>`); fill = c }
  }
  if (fo < 1) { const f = id(); out.push(`<feComponentTransfer in="${fill}" result="${f}"><feFuncA type="linear" slope="${f2(fo)}"/></feComponentTransfer>`); fill = f }

  /* a shape's alpha grown by `r` (intensity spreads it before the blur, Affinity's Intensity) */
  const spreadBlur = (src, r, intensity) => {
    let s = src
    const spread = r * (intensity / 100)
    if (spread > 0) { const d = id(); out.push(`<feMorphology in="${s}" operator="dilate" radius="${f2(spread)}" result="${d}"/>`); s = d }
    const soft = r - spread
    if (soft > 0) { const b = id(); out.push(`<feGaussianBlur in="${s}" stdDeviation="${f2(soft / 2)}" result="${b}"/>`); s = b }
    return s
  }
  const paint = (alphaSrc, col, op) => {
    const fl = id(), c = id()
    out.push(`<feFlood flood-color="${esc(col)}" flood-opacity="${f2(op)}" result="${fl}"/>`)
    out.push(`<feComposite in="${fl}" in2="${alphaSrc}" operator="in" result="${c}"/>`)
    return c
  }
  const shift = (src, dist, angle) => {
    if (!dist) return src
    const o = id()
    out.push(`<feOffset in="${src}" dx="${f2(dist * Math.cos(rad(angle)))}" dy="${f2(-dist * Math.sin(rad(angle)))}" result="${o}"/>`)
    return o
  }
  const clipIn = (src) => { const c = id(); out.push(`<feComposite in="${src}" in2="SourceAlpha" operator="in" result="${c}"/>`); return c }
  const clipOut = (src) => { const c = id(); out.push(`<feComposite in="${src}" in2="SourceAlpha" operator="out" result="${c}"/>`); return c }
  const invAlpha = () => { const i = id(); out.push(`<feComponentTransfer in="SourceAlpha" result="${i}"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer>`); return i }

  /* below the fill */
  const below = []
  for (const type of BELOW) {
    for (const e of on.filter((x) => x.id === type)) {
      const p = P(e)
      if (type === 'outerShadow') {
        let s = spreadBlur('SourceAlpha', L(p.radius), num(p.intensity))
        s = shift(s, L(p.offset), num(p.angle))
        s = paint(s, p.color, num(p.opacity) / 100)
        if (p.knockout && fo < 1) s = clipOut(s)
        below.push(s)
      } else {
        const s = spreadBlur('SourceAlpha', Math.max(1, L(p.radius)), num(p.intensity))
        below.push(paint(s, p.color, num(p.opacity) / 100))
      }
    }
  }
  let acc
  if (below.length) {
    acc = id()
    out.push(`<feMerge result="${acc}">${[...below, fill].map((r) => `<feMergeNode in="${r}"/>`).join('')}</feMerge>`)
  } else acc = fill

  const over = (src, mode) => {
    const r = id()
    out.push(mode && mode !== 'normal'
      ? `<feBlend in="${src}" in2="${acc}" mode="${mode}" result="${r}"/>`
      : `<feMerge result="${r}"><feMergeNode in="${acc}"/><feMergeNode in="${src}"/></feMerge>`)
    acc = r
  }
  const light = (p, kind, extra = '') => {
    const az = num(p.azimuth), el = num(p.elevation)
    return `<${kind} ${extra}><feDistantLight azimuth="${f2(-az)}" elevation="${f2(el)}"/></${kind}>`
  }

  /* above the fill */
  for (const type of ABOVE) {
    for (const e of on.filter((x) => x.id === type)) {
      const p = P(e)
      const op = num(p.opacity ?? 100) / 100
      if (type === 'colorOverlay') over(clipIn(paint('SourceAlpha', p.color, op)), p.blend)
      else if (type === 'gradientOverlay') {
        const url = gradientImage(p, w, h)
        if (!url) continue
        const im = id(), a = id()
        out.push(`<feImage href="${url}" x="${f2(ox)}" y="${f2(oy)}" width="${f2(w)}" height="${f2(h)}" preserveAspectRatio="none" result="${im}"/>`)
        out.push(`<feComponentTransfer in="${im}" result="${a}"><feFuncA type="linear" slope="${f2(op)}"/></feComponentTransfer>`)
        over(clipIn(a), p.blend)
      } else if (type === 'innerShadow') {
        let s = spreadBlur(invAlpha(), L(p.radius), num(p.intensity))
        s = shift(s, L(p.offset), num(p.angle))
        over(clipIn(paint(s, p.color, op)), p.blend)
      } else if (type === 'innerGlow') {
        const r = Math.max(1, L(p.radius))
        const s = p.source === 'center'
          ? (() => { const e2 = id(); out.push(`<feMorphology in="SourceAlpha" operator="erode" radius="${f2(r * (1 - num(p.intensity) / 100))}" result="${e2}"/>`); const b = id(); out.push(`<feGaussianBlur in="${e2}" stdDeviation="${f2(r / 2)}" result="${b}"/>`); return b })()
          : spreadBlur(invAlpha(), r, num(p.intensity))
        over(clipIn(paint(s, p.color, op)), p.blend)
      } else if (type === 'bevel' || type === 'threeD') {
        const b = id()
        out.push(`<feGaussianBlur in="SourceAlpha" stdDeviation="${f2(Math.max(0.5, (L(p.radius) + L(p.soften)) / 2))}" result="${b}"/>`)
        const scale = Math.max(0.5, L(p.depth) / 2)
        const region = (src) => (type === 'threeD' || p.type === 'inner' ? clipIn(src) : p.type === 'outer' ? clipOut(src) : src)
        if (type === 'bevel') {
          const sp = id(), hi = id(), di = id(), sh = id()
          out.push(light(p, 'feSpecularLighting', `in="${b}" surfaceScale="${f2(scale)}" specularConstant="1" specularExponent="40" lighting-color="${esc(p.highlight)}" result="${sp}"`))
          out.push(`<feComponentTransfer in="${sp}" result="${hi}"><feFuncA type="linear" slope="${f2(num(p.highlightOpacity) / 100)}"/></feComponentTransfer>`)
          over(region(hi), p.highlightBlend)
          /* the shade: unlit diffuse → alpha, in the shadow colour */
          out.push(light(p, 'feDiffuseLighting', `in="${b}" surfaceScale="${f2(scale)}" diffuseConstant="1" lighting-color="#ffffff" result="${di}"`))
          out.push(`<feColorMatrix in="${di}" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.66 -0.66 -0.66 0 ${f2(2 * Math.sin(rad(num(p.elevation))))}" result="${sh}"/>`)
          over(region(paint(sh, p.shadow, num(p.shadowOpacity) / 100)), p.shadowBlend)
        } else {
          const di = id(), am = id(), lt = id(), lit = id(), sp = id()
          out.push(light(p, 'feDiffuseLighting', `in="${b}" surfaceScale="${f2(scale)}" diffuseConstant="${f2(num(p.diffuse) / 100)}" lighting-color="${esc(p.lightColor)}" result="${di}"`))
          out.push(`<feFlood flood-color="${esc(p.ambientColor)}" flood-opacity="${f2(num(p.ambient) / 100)}" result="${am}"/>`)
          out.push(`<feComposite in="${di}" in2="${am}" operator="arithmetic" k2="1" k3="1" result="${lt}"/>`)
          out.push(`<feComposite in="${acc}" in2="${lt}" operator="arithmetic" k1="1" result="${lit}"/>`)
          out.push(light(p, 'feSpecularLighting', `in="${b}" surfaceScale="${f2(scale)}" specularConstant="${f2(num(p.specular) / 100 * 2)}" specularExponent="${f2(1 + num(p.shininess) / 100 * 63)}" lighting-color="${esc(p.specularColor)}" result="${sp}"`))
          const both = id()
          out.push(`<feComposite in="${lit}" in2="${clipIn(sp)}" operator="arithmetic" k2="1" k3="1" result="${both}"/>`)
          const mixed = id()
          out.push(`<feComposite in="${clipIn(both)}" in2="${acc}" operator="arithmetic" k2="${f2(op)}" k3="${f2(1 - op)}" result="${mixed}"/>`)
          acc = mixed
        }
      } else if (type === 'outline') {
        const r = L(p.radius)
        if (r <= 0) continue
        let ring
        const morph = (op2, rr) => { const m = id(); out.push(`<feMorphology in="SourceAlpha" operator="${op2}" radius="${f2(rr)}" result="${m}"/>`); return m }
        if (p.alignment === 'inside') { ring = id(); out.push(`<feComposite in="SourceAlpha" in2="${morph('erode', r)}" operator="out" result="${ring}"/>`) }
        else if (p.alignment === 'centre') { ring = id(); out.push(`<feComposite in="${morph('dilate', r / 2)}" in2="${morph('erode', r / 2)}" operator="out" result="${ring}"/>`) }
        else { ring = id(); out.push(`<feComposite in="${morph('dilate', r)}" in2="SourceAlpha" operator="out" result="${ring}"/>`) }
        over(paint(ring, p.color, op), p.blend)
      }
    }
  }

  const fid = effectsFilterId(layer)
  return `<filter id="${fid}" filterUnits="userSpaceOnUse" x="${f2(ox - pad)}" y="${f2(oy - pad)}" width="${f2(w + pad * 2)}" height="${f2(h + pad * 2)}" color-interpolation-filters="sRGB">${out.join('')}<feMerge><feMergeNode in="${acc}"/></feMerge></filter>`
}
