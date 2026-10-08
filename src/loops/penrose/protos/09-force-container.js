import {
  forceSimulation,
  forceCollide,
  forceManyBody,


} from 'd3-force'

import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, repelPoints } from '../common.js'









// d3-force particle simulation with a custom SDF-boundary force that keeps
// all nodes trapped inside the glyph. Node-level collision + many-body
// repulsion produces a self-organizing sphere pack that settles into the
// shape.
//
// Reference: d3/d3-force, 1wheel/d3-force-container (arbitrary-shape containment).
export const forceContainer            = {
  id: '09-force-container',
  name: 'D3-FORCE · SDF CONTAINER',
  repo: 'd3/d3-force + 1wheel/d3-force-container',
  summary:
    'd3-force simulation (collision + many-body) with a custom SDF-inward force. Nodes settle into a self-organizing pack that fills the glyph. Adding new nodes (additional layer) triggers a fresh settle. Perfect physics backbone for interactive layers.',
  helps:
    'The physics backbone. Add nodes on trigger → they settle; cross-layer rules become d3 forces (repel layer-A from layer-B, etc). This is the most composable foundation for the multi-layer vision.',
  params: [
    { key: 'count', type: 'int', min: 50, max: 1200, step: 10, default: 380, label: 'nodes' },
    { key: 'minR', type: 'range', min: 1, max: 20, step: 0.5, default: 4, label: 'min radius' },
    { key: 'rJitter', type: 'range', min: 0, max: 30, step: 0.5, default: 10, label: 'radius range' },
    { key: 'charge', type: 'range', min: -30, max: 0, step: 0.5, default: -6, label: 'repulsion' },
    { key: 'chargeDist', type: 'int', min: 10, max: 120, step: 5, default: 40, label: 'repel reach' },
    { key: 'margin', type: 'int', min: 0, max: 30, default: 6, label: 'wall margin' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h

    const { minR, rJitter } = params

    const nodes      = []
    const count = params.count
    for (let i = 0; i < count; i++) {
      const [x, y] = sampleInside(sdf, rng)
      nodes.push({
        x, y, vx: 0, vy: 0,
        r: minR + rng() * rJitter,
      })
    }

    const sdfForce = (alpha        ) => {
      const margin = params.margin
      for (const n of nodes) {
        const s = sdf.sample(n.x, n.y)
        if (s > -margin) {
          const [gX, gY] = sdfGrad(sdf, n.x, n.y)
          const m = Math.hypot(gX, gY) || 1e-6
          const push = Math.max(0, s + margin) * 0.6 * alpha
          n.vx -= (gX / m) * push
          n.vy -= (gY / m) * push
        }
      }
    }
    sdfForce.initialize = () => {}

    const sim                           = forceSimulation(nodes)
      .alphaDecay(0.004)
      .velocityDecay(0.35)
      .force('collide', forceCollide   ().radius((d) => d.r + 1))
      .force('charge', forceManyBody   ().strength(params.charge).distanceMax(params.chargeDist))
      .force('sdf', sdfForce)

    let prevDown = false

    /* PERF (2026-08-09): the connecting-edges render was all-pairs O(N²)
     * (~720k distance checks per frame at max node count). Nodes bucket into
     * a hoisted spatial grid each frame; cell size = the max edge distance,
     * so a 3×3 scan with index-order dedupe finds every neighbor pair. */
    const maxNodeR = minR + rJitter
    const cellW = Math.max(8, maxNodeR * 2 + 4)
    const egw = Math.ceil(sdf.w / cellW) + 1
    const egh = Math.ceil(sdf.h / cellW) + 1
    const egrid = new Array(egw * egh)
    for (let i = 0; i < egrid.length; i++) egrid[i] = []

    return wrapLoop(() => {
      sim.tick(1)
      // Pointer repel — positional push after the tick (d3 owns nodes[]), and
      // an alpha reheat so the cooled sim (alphaDecay) relaxes the pack back.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr) {
        /* Living system (2026-08-09): press = EXPLOSION. Down-edge fires a
         * strong radial impulse into the d3 velocities plus a hard alpha
         * reheat — collide + many-body then re-pack the burst. */
        if (ptr.down && !prevDown) {
          const reach = Math.min(sdf.w, sdf.h) * 0.35
          const kick = Math.min(sdf.w, sdf.h) * 0.09 * params.interact
          // ANTI-STROBE: cap the injected velocity at ~3% of the canvas per
          // frame — the burst was a same-frame ~9% teleport at defaults
          const kickCap = Math.min(sdf.w, sdf.h) * 0.03
          for (const n of nodes) {
            const dx = n.x - ptr.x, dy = n.y - ptr.y
            const d = Math.hypot(dx, dy)
            if (d >= reach || d < 1e-6) continue
            const f = Math.min(kickCap, (1 - d / reach) * kick)
            n.vx += (dx / d) * f
            n.vy += (dy / d) * f
          }
          sim.alpha(Math.max(sim.alpha(), 0.9))
        }
        repelPoints(nodes, ptr, {
          reach: Math.min(sdf.w, sdf.h) * 0.2,
          strength: Math.min(sdf.w, sdf.h) * 0.015 * params.interact,
        })
        sim.alpha(Math.max(sim.alpha(), 0.3))
      }
      prevDown = !!(ptr && ptr.down)
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, 'rgba(243, 231, 207, 0.18)', 1)

      // connecting edges (collision-neighbors) — grid-bounded
      for (let i = 0; i < egrid.length; i++) egrid[i].length = 0
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const gx = Math.max(0, Math.min(egw - 1, Math.floor(n.x / cellW)))
        const gy = Math.max(0, Math.min(egh - 1, Math.floor(n.y / cellW)))
        egrid[gy * egw + gx].push(i)
      }
      ctx.strokeStyle = 'rgba(170, 174, 220, 0.28)'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        const gx = Math.floor(a.x / cellW), gy = Math.floor(a.y / cellW)
        for (let j = -1; j <= 1; j++) {
          const yy = gy + j
          if (yy < 0 || yy >= egh) continue
          for (let i2 = -1; i2 <= 1; i2++) {
            const xx = gx + i2
            if (xx < 0 || xx >= egw) continue
            const bucket = egrid[yy * egw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const bi = bucket[k]
              if (bi <= i) continue // dedupe pairs by index order
              const b = nodes[bi]
              const dx = a.x - b.x, dy = a.y - b.y
              const d2 = dx * dx + dy * dy
              const sum = a.r + b.r + 4
              if (d2 < sum * sum) {
                ctx.moveTo(a.x * sx, a.y * sy)
                ctx.lineTo(b.x * sx, b.y * sy)
              }
            }
          }
        }
      }
      ctx.stroke()

      // node circles — PERF: one batched path + one stroke
      ctx.strokeStyle = 'rgba(210, 215, 235, 0.7)'
      ctx.lineWidth = 0.9
      const rScale = Math.min(sx, sy)
      ctx.beginPath()
      for (const n of nodes) {
        const rr = n.r * rScale
        ctx.moveTo(n.x * sx + rr, n.y * sy)
        ctx.arc(n.x * sx, n.y * sy, rr, 0, Math.PI * 2)
      }
      ctx.stroke()

      // centers — batched
      ctx.fillStyle = '#f3c9c4'
      ctx.beginPath()
      for (const n of nodes) {
        ctx.moveTo(n.x * sx + 1.5, n.y * sy)
        ctx.arc(n.x * sx, n.y * sy, 1.5, 0, Math.PI * 2)
      }
      ctx.fill()
    })
  },
}
