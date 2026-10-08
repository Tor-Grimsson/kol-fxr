
import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'




// Second layer-composition demo — PREDATOR–PREY between the layers.
// Layer A: cells — mobile discs that graze, grow, split when big, die of age.
// Layer B: hunters — they chase cells, eat them down (the cell shrinks and
// dies, the hunter fattens), reproduce when fed, starve when the prey runs
// out. Classic Lotka–Volterra oscillation trapped inside the glyph.
export const layeredErase            = {
  id: '14-layered-erase',
  name: 'LAYERED · PREDATOR–PREY (A ↔ B)',
  repo: 'composition · own code',
  summary:
    'Two-species ecosystem. A: cells — drifting discs that grow, SPLIT when they hit max radius (birth ring), and die of age. B: hunters — velocity darts that chase the nearest cell, eat it down (its radius visibly shrinks), reproduce when fed and starve when not. Hover drops food the cells swarm; press drops a fresh hunter into the pit. The populations oscillate — boom, feast, crash, regrow.',
  helps:
    'The explicit life/death contract between two layers: B eats A, A regrows. The balance knobs (growth, eat rate, lifespan) ARE the Lotka-Volterra coefficients — this is the scaffold for any cross-layer ecology.',
  params: [
    { key: 'minR', type: 'int', min: 4, max: 24, default: 7, label: 'min radius' },
    { key: 'maxR', type: 'int', min: 20, max: 80, default: 30, label: 'max radius' },
    { key: 'attempts', type: 'int', min: 1000, max: 9000, step: 500, default: 3500, label: 'density' },
    { key: 'circleLife', type: 'int', min: 200, max: 3000, step: 50, default: 900, label: 'cell lifespan' },
    { key: 'erasers', type: 'int', min: 1, max: 40, default: 5, label: 'hunters' },
    { key: 'eraserReach', type: 'int', min: 6, max: 50, default: 18, label: 'hunter reach' },
    { key: 'damagePerTick', type: 'range', min: 0.1, max: 3, step: 0.1, default: 0.5, label: 'eat rate' },
    { key: 'cellGrow', type: 'range', min: 0.01, max: 0.2, step: 0.005, default: 0.06, label: 'cell growth' },
    { key: 'hunterSpeed', type: 'range', min: 0.5, max: 4, step: 0.1, default: 1.9, label: 'hunter speed' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { minR, maxR, circleLife, erasers: NE, eraserReach, damagePerTick, cellGrow, hunterSpeed } = params

    const CELL_CAP = 220
    const HUNTER_CAP = 28
    const events = []
    const flash = (x, y, kind) => {
      if (events.length < 160) events.push({ x, y, kind, ttl: 18, max: 18 })
    }

    // ---- Layer A: cells (prey) ----
    const cells = []
    const spawnCell = (x, y, r, age = 0) => {
      cells.push({ x, y, r, age, ang: rng() * Math.PI * 2, vx: 0, vy: 0, fade: -1 })
    }
    const seedCells = Math.round(params.attempts / 100)
    for (let i = 0; i < seedCells; i++) {
      const [x, y] = sampleInside(sdf, rng)
      spawnCell(x, y, minR + rng() * (maxR * 0.5 - minR), (rng() * circleLife * 0.5) | 0)
    }

    // ---- Layer B: hunters (predators) ----
    const hunters = []
    const spawnHunter = (x, y, e = 5) => {
      if (x === undefined) [x, y] = sampleInside(sdf, rng)
      hunters.push({ x, y, vx: 0, vy: 0, e, fade: -1 })
    }
    for (let i = 0; i < NE; i++) spawnHunter()

    // ---- food pellets (pointer hover) ----
    const pellets = []

    const HUNT_METAB = 0.016
    const REPRO_AT = 10
    let tick = 0
    let prevDown = false

    return wrapLoop(() => {
      tick++
      const ptr = params.interact > 0 && pointer ? pointer() : null

      // hover = drop food the cells swarm
      if (ptr && !ptr.down && tick % 3 === 0 && pellets.length < 50) {
        const fx = ptr.x + (rng() - 0.5) * 14
        const fy = ptr.y + (rng() - 0.5) * 14
        if (sdf.sample(fx, fy) < -2) pellets.push({ x: fx, y: fy, amt: 1 })
      }
      // press = drop a hunter into the pit (2 when interaction is cranked)
      if (ptr?.down && !prevDown && sdf.sample(ptr.x, ptr.y) < -2) {
        const n = params.interact >= 2 ? 2 : 1
        for (let i = 0; i < n && hunters.length < HUNTER_CAP; i++) {
          spawnHunter(ptr.x + (rng() - 0.5) * 8, ptr.y + (rng() - 0.5) * 8)
        }
        flash(ptr.x, ptr.y, 'spawn')
      }
      prevDown = !!(ptr && ptr.down)

      // ── cells: wander, swarm food, separate, grow, split, age ──
      for (let i = cells.length - 1; i >= 0; i--) {
        const c = cells[i]
        if (c.fade >= 0) { if (--c.fade <= 0) cells.splice(i, 1); continue }
        // wander
        c.ang += (rng() - 0.5) * 0.3
        c.vx += Math.cos(c.ang) * 0.045
        c.vy += Math.sin(c.ang) * 0.045
        // swarm the nearest pellet
        let bp = null, bd = 140
        for (const f of pellets) {
          const d = Math.hypot(f.x - c.x, f.y - c.y)
          if (d < bd) { bd = d; bp = f }
        }
        if (bp) {
          const m = bd || 1
          const fw = 0.12 * Math.max(1, params.interact)
          c.vx += ((bp.x - c.x) / m) * fw
          c.vy += ((bp.y - c.y) / m) * fw
          if (bd < c.r + 4) { bp.amt -= 0.04; c.r = Math.min(maxR, c.r + 0.05) }
        }
        // SDF containment
        const s = sdf.sample(c.x, c.y)
        if (s > -(c.r * 0.4 + 3)) {
          const h = 1.5
          const gx = sdf.sample(c.x + h, c.y) - sdf.sample(c.x - h, c.y)
          const gy = sdf.sample(c.x, c.y + h) - sdf.sample(c.x, c.y - h)
          const m = Math.hypot(gx, gy) || 1e-6
          c.vx -= (gx / m) * 0.3
          c.vy -= (gy / m) * 0.3
        }
        c.vx *= 0.86; c.vy *= 0.86
        c.x += c.vx; c.y += c.vy
        // grow — gated by maxR and the local mask depth
        const effMax = Math.min(maxR, Math.max(minR + 2, -sdf.sample(c.x, c.y) * 0.9))
        if (c.r < effMax) c.r += cellGrow
        // split — the birth event
        if (c.r >= maxR * 0.98 && cells.length < CELL_CAP) {
          const a = rng() * Math.PI * 2
          c.r = maxR * 0.55
          spawnCell(c.x + Math.cos(a) * c.r, c.y + Math.sin(a) * c.r, maxR * 0.45)
          flash(c.x, c.y, 'birth')
        }
        // age out
        if (++c.age > circleLife) { c.fade = 24; flash(c.x, c.y, 'death') }
      }
      // separation (live cells only)
      for (let i = 0; i < cells.length; i++) {
        const a = cells[i]
        if (a.fade >= 0) continue
        for (let j = i + 1; j < cells.length; j++) {
          const b = cells[j]
          if (b.fade >= 0) continue
          const dx = b.x - a.x, dy = b.y - a.y
          const need = a.r + b.r
          const d2 = dx * dx + dy * dy
          if (d2 >= need * need || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const push = ((need - d) / need) * 0.35
          const ux = dx / d, uy = dy / d
          a.vx -= ux * push; a.vy -= uy * push
          b.vx += ux * push; b.vy += uy * push
        }
      }

      // ── hunters: chase, eat, reproduce, starve ──
      for (let i = hunters.length - 1; i >= 0; i--) {
        const h = hunters[i]
        if (h.fade >= 0) { if (--h.fade <= 0) hunters.splice(i, 1); continue }
        // nearest live cell within sense
        let prey = null, pd = eraserReach * 8
        for (const c of cells) {
          if (c.fade >= 0) continue
          const d = Math.hypot(c.x - h.x, c.y - h.y)
          if (d < pd) { pd = d; prey = c }
        }
        if (prey) {
          const m = pd || 1
          h.vx += ((prey.x - h.x) / m) * 0.16 * hunterSpeed
          h.vy += ((prey.y - h.y) / m) * 0.16 * hunterSpeed
          // eat — the cell visibly shrinks, the hunter fattens
          if (pd < prey.r + eraserReach * 0.5) {
            prey.r -= damagePerTick * 0.3
            h.e += damagePerTick * 0.1
            if (prey.r < minR * 0.6) { prey.fade = 18; flash(prey.x, prey.y, 'death') } // ≥300ms fade (anti-strobe)
          }
        } else {
          // wander when the larder is empty
          h.vx += (rng() - 0.5) * 0.3
          h.vy += (rng() - 0.5) * 0.3
        }
        // SDF containment
        const s = sdf.sample(h.x, h.y)
        if (s > -6) {
          const g = 1.5
          const gx = sdf.sample(h.x + g, h.y) - sdf.sample(h.x - g, h.y)
          const gy = sdf.sample(h.x, h.y + g) - sdf.sample(h.x, h.y - g)
          const m = Math.hypot(gx, gy) || 1e-6
          h.vx -= (gx / m) * 0.6
          h.vy -= (gy / m) * 0.6
        }
        const sp = Math.hypot(h.vx, h.vy)
        if (sp > hunterSpeed) { h.vx = (h.vx / sp) * hunterSpeed; h.vy = (h.vy / sp) * hunterSpeed }
        h.x += h.vx; h.y += h.vy
        // metabolism — reproduce fed, starve hungry
        h.e -= HUNT_METAB
        if (h.e >= REPRO_AT && hunters.length < HUNTER_CAP) {
          h.e = 5
          spawnHunter(h.x + (rng() - 0.5) * 6, h.y + (rng() - 0.5) * 6, 5)
          flash(h.x, h.y, 'spawn')
        }
        if (h.e <= 0) { h.fade = 18; flash(h.x, h.y, 'death') } // ≥300ms fade (anti-strobe)
      }

      // ── floors — extinction never locks the sim ──
      const liveCells = cells.reduce((n, c) => n + (c.fade < 0 ? 1 : 0), 0)
      if (liveCells < 8 && tick % 30 === 0) {
        for (let k = 0; k < 4; k++) {
          const [x, y] = sampleInside(sdf, rng)
          spawnCell(x, y, minR)
        }
      }
      const liveHunters = hunters.reduce((n, h) => n + (h.fade < 0 ? 1 : 0), 0)
      if (liveHunters === 0 && liveCells > CELL_CAP * 0.6 && tick % 90 === 0) spawnHunter()

      // pellets decay
      for (let i = pellets.length - 1; i >= 0; i--) {
        pellets[i].amt -= 0.004
        if (pellets[i].amt <= 0) pellets.splice(i, 1)
      }

      // ── render ── fg-led cells, warm hunters, accent food
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.16), 1.4)

      // food pellets
      for (const f of pellets) {
        ctx.fillStyle = pc('accent', 0.85 * Math.min(1, f.amt))
        ctx.beginPath()
        ctx.arc(f.x * sx, f.y * sy, 1.5 * U, 0, Math.PI * 2)
        ctx.fill()
      }

      // cells — big bodies with rims and warm nuclei. PERF: live cells batch
      // into three passes (bodies fill / rims stroke / nuclei fill); only
      // fading cells draw individually for their alpha.
      const rScale = Math.min(sx, sy)
      const nucR = 1.6 * U
      ctx.lineWidth = 1 * U
      ctx.fillStyle = pc('fg', 0.12)
      ctx.beginPath()
      for (const c of cells) {
        if (c.fade >= 0) continue
        const rr = Math.max(1, c.r) * rScale
        ctx.moveTo(c.x * sx + rr, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, rr, 0, Math.PI * 2)
      }
      ctx.fill()
      ctx.strokeStyle = pc('fg', 0.7)
      ctx.stroke()
      ctx.fillStyle = pc('warm', 0.8)
      ctx.beginPath()
      for (const c of cells) {
        if (c.fade >= 0) continue
        ctx.moveTo(c.x * sx + nucR, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, nucR, 0, Math.PI * 2)
      }
      ctx.fill()
      for (const c of cells) {
        if (c.fade < 0) continue
        const a = c.fade / 24
        const rr = Math.max(1, c.r) * rScale
        ctx.fillStyle = pc('fg', 0.12 * a)
        ctx.beginPath()
        ctx.arc(c.x * sx, c.y * sy, rr, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = pc('fg', 0.7 * a)
        ctx.stroke()
        ctx.fillStyle = pc('warm', 0.8 * a)
        ctx.beginPath()
        ctx.arc(c.x * sx, c.y * sy, nucR, 0, Math.PI * 2)
        ctx.fill()
      }

      // hunters — glowing warm darts, fattening with energy. PERF: the glow
      // is a batched pass of soft low-alpha discs under the darts instead of
      // shadowBlur (which re-ran a blur for every dart fill).
      ctx.fillStyle = pc('warm', 0.22)
      ctx.beginPath()
      for (const h of hunters) {
        if (h.fade >= 0) continue // dying darts gutter out without glow
        const size = (4 + Math.min(3, h.e * 0.25)) * U * 1.7
        ctx.moveTo(h.x * sx + size, h.y * sy)
        ctx.arc(h.x * sx, h.y * sy, size, 0, Math.PI * 2)
      }
      ctx.fill()
      for (const h of hunters) {
        const a = h.fade >= 0 ? h.fade / 18 : 1
        const ang = Math.atan2(h.vy, h.vx)
        const size = (4 + Math.min(3, h.e * 0.25)) * U
        const cx = h.x * sx, cy = h.y * sy
        ctx.fillStyle = pc('warm', 0.95 * a)
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(ang) * size, cy + Math.sin(ang) * size)
        ctx.lineTo(cx + Math.cos(ang + 2.5) * size * 0.5, cy + Math.sin(ang + 2.5) * size * 0.5)
        ctx.lineTo(cx + Math.cos(ang - 2.5) * size * 0.5, cy + Math.sin(ang - 2.5) * size * 0.5)
        ctx.closePath()
        ctx.fill()
      }

      // event flashes — birth ring expands, death ring collapses, spawn booms
      for (let i = events.length - 1; i >= 0; i--) {
        const ev = events[i]
        const t = ev.ttl / ev.max
        ctx.lineWidth = 0.9 * U
        if (ev.kind === 'birth') {
          ctx.strokeStyle = pc('fg', 0.7 * t)
          ctx.beginPath()
          ctx.arc(ev.x * sx, ev.y * sy, (2 + (1 - t) * 8) * U, 0, Math.PI * 2)
          ctx.stroke()
        } else if (ev.kind === 'death') {
          ctx.strokeStyle = pc('dim', 0.14 * t)
          ctx.beginPath()
          ctx.arc(ev.x * sx, ev.y * sy, (1 + t * 6) * U, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.strokeStyle = pc('warm', 0.85 * t)
          ctx.lineWidth = 1.3 * U
          ctx.beginPath()
          ctx.arc(ev.x * sx, ev.y * sy, (3 + (1 - t) * 12) * U, 0, Math.PI * 2)
          ctx.stroke()
        }
        if (--ev.ttl <= 0) events.splice(i, 1)
      }
    })
  },
}
