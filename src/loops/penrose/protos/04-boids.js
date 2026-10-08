
import { clear, strokeOutline, wrapLoop, sampleInside, sdfGrad, pc } from '../common.js'



// Reynolds boids (1986): separation + alignment + cohesion + SDF boundary.
// Produces "life" — swirling, flocking, drifting — inside the glyph.
// No external repo; algorithm is textbook (Reynolds, red3d.com/cwr/boids/).
export const boids            = {
  id: '04-boids',
  name: 'BOIDS / FLOCKING',
  repo: 'red3d.com/cwr/boids (Reynolds 1986)',
  summary:
    'N autonomous agents with separation, alignment, cohesion forces + SDF inward force. Reads as a school or swarm drifting inside the letter. Ideal as a motion layer over a static pack (layer 1 structure, layer 2 life).',
  helps:
    'The "motion over structure" layer — boids drift over a static packed base. Cross-layer rules (predator/prey between layers) map cleanly onto boid weights.',
  params: [
    { key: 'N', type: 'int', min: 50, max: 1200, step: 10, default: 320, label: 'count' },
    { key: 'neighbor', type: 'int', min: 8, max: 60, default: 22, label: 'neighbor radius' },
    { key: 'sepR', type: 'range', min: 2, max: 24, step: 0.5, default: 10, label: 'separation dist' },
    { key: 'sepW', type: 'range', min: 0, max: 0.6, step: 0.01, default: 0.18, label: 'separation' },
    { key: 'aliW', type: 'range', min: 0, max: 0.3, step: 0.01, default: 0.05, label: 'alignment' },
    { key: 'cohW', type: 'range', min: 0, max: 0.2, step: 0.005, default: 0.02, label: 'cohesion' },
    { key: 'maxSpeed', type: 'range', min: 0.5, max: 6, step: 0.1, default: 2.6, label: 'max speed' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { N, neighbor, sepR, sepW, aliW, cohW, maxSpeed } = params

    const boids         = []
    for (let i = 0; i < N; i++) {
      const [x, y] = sampleInside(sdf, rng)
      const a = rng() * Math.PI * 2
      // every 7th boid is a LEADER — accent-tinted, a size up; the rest warm
      boids.push({ x, y, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.8, lead: i % 7 === 0 })
    }

    const sdfMargin = 8
    let prevDown = false

    // PERF: neighbor grid hoisted (cell size fixed) — buckets length-reset
    // per frame instead of reallocating gw*gh arrays
    const cs = neighbor
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid             = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []

    /* ESCALATION (2026-08-09): units 3.5× — real velocity-oriented darts,
     * speed-stretched, warm-led with accent leaders — and the canvas fades
     * instead of clearing so every boid tows a motion trail. */
    clear(ctx, W, H)

    return wrapLoop(() => {
      // Pointer steer — hover = seek (the swarm follows the cursor),
      // press = flee (scatter); just a sign flip on the same force.
      const ptr = params.interact > 0 && pointer ? pointer() : null

      /* Living system (2026-08-09): the press is an EVENT, not a mode flip.
       * Down-edge = one-frame shockwave — a strong radial velocity kick plus
       * an instant displacement (so the burst reads through the same-frame
       * speed clamp). Holding after the edge keeps the sustained flee. */
      if (ptr && ptr.down && !prevDown) {
        const reach = Math.min(sdf.w, sdf.h) * 0.5
        const kick = maxSpeed * 6 * Math.min(2, params.interact)
        // ANTI-STROBE: cap the same-frame displacement at ~3% of the canvas
        const kickCap = Math.min(sdf.w, sdf.h) * 0.03
        for (const b of boids) {
          const dx = b.x - ptr.x, dy = b.y - ptr.y
          const d = Math.hypot(dx, dy)
          if (d >= reach || d < 1e-6) continue
          const f = Math.min(kickCap, (1 - d / reach) * kick)
          b.vx += (dx / d) * f
          b.vy += (dy / d) * f
          b.x += (dx / d) * f
          b.y += (dy / d) * f
        }
      }
      prevDown = !!(ptr && ptr.down)

      for (let i = 0; i < grid.length; i++) grid[i].length = 0
      for (let i = 0; i < boids.length; i++) {
        const gx = Math.max(0, Math.min(gw - 1, Math.floor(boids[i].x / cs)))
        const gy = Math.max(0, Math.min(gh - 1, Math.floor(boids[i].y / cs)))
        grid[gy * gw + gx].push(i)
      }

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i]
        let sepX = 0, sepY = 0
        let aliX = 0, aliY = 0
        let cohX = 0, cohY = 0
        let cnt = 0
        const gx = Math.floor(b.x / cs), gy = Math.floor(b.y / cs)
        for (let j = -1; j <= 1; j++) {
          const yy = gy + j
          if (yy < 0 || yy >= gh) continue
          for (let i2 = -1; i2 <= 1; i2++) {
            const xx = gx + i2
            if (xx < 0 || xx >= gw) continue
            const bucket = grid[yy * gw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const idx = bucket[k]
              if (idx === i) continue
              const o = boids[idx]
              const dx = o.x - b.x, dy = o.y - b.y
              const d2 = dx * dx + dy * dy
              if (d2 > neighbor * neighbor || d2 < 1e-6) continue
              const d = Math.sqrt(d2)
              // separation (push away if too close)
              if (d < sepR) {
                sepX -= dx / d
                sepY -= dy / d
              }
              // alignment (match velocity)
              aliX += o.vx
              aliY += o.vy
              // cohesion (toward center)
              cohX += o.x
              cohY += o.y
              cnt++
            }
          }
        }
        if (cnt > 0) {
          aliX /= cnt; aliY /= cnt
          cohX = cohX / cnt - b.x
          cohY = cohY / cnt - b.y
        }

        b.vx += sepX * sepW + aliX * aliW + cohX * cohW
        b.vy += sepY * sepW + aliY * aliW + cohY * cohW

        // SDF boundary force — pushes inward when near or past boundary
        const s = sdf.sample(b.x, b.y)
        if (s > -sdfMargin) {
          const [gX, gY] = sdfGrad(sdf, b.x, b.y)
          const m = Math.hypot(gX, gY) || 1e-6
          const push = (Math.max(0, s + sdfMargin) / sdfMargin) * 1.5
          b.vx -= (gX / m) * push
          b.vy -= (gY / m) * push
        }

        // pointer steer force (before the clamp so it can't exceed maxSpeed)
        if (ptr) {
          const pdx = ptr.x - b.x, pdy = ptr.y - b.y
          const pm = Math.hypot(pdx, pdy) || 1e-6
          const pw = 0.15 * params.interact * (ptr.down ? -2 : 1)
          b.vx += (pdx / pm) * pw
          b.vy += (pdy / pm) * pw
        }

        // clamp speed
        const sp = Math.hypot(b.vx, b.vy)
        if (sp > maxSpeed) { b.vx = (b.vx / sp) * maxSpeed; b.vy = (b.vy / sp) * maxSpeed }

        b.x += b.vx
        b.y += b.vy
      }

      // Render — fade wash instead of clear: motion trails for free
      ctx.fillStyle = pc('bg', 0.24)
      ctx.fillRect(0, 0, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.16), 1.4)

      // PERF: darts batch into two paths (leaders / rest) — two fills total
      // instead of a beginPath+fill per boid
      const warm = pc('warm', 0.95)
      const acc = pc('accent', 0.95)
      for (let pass = 0; pass < 2; pass++) {
        const wantLead = pass === 1
        ctx.fillStyle = wantLead ? acc : warm
        ctx.beginPath()
        for (const b of boids) {
          if (b.lead !== wantLead) continue
          // velocity-oriented dart, stretched by speed — presence, not dust
          const sp = Math.hypot(b.vx, b.vy)
          const ang = Math.atan2(b.vy, b.vx)
          const cx = b.x * sx, cy = b.y * sy
          const scale = (b.lead ? 1.35 : 1) * (0.8 + 0.5 * Math.min(1, sp / maxSpeed))
          const s1 = 4.5 * U * scale, s2 = 2.1 * U * scale
          ctx.moveTo(cx + Math.cos(ang) * s1, cy + Math.sin(ang) * s1)
          ctx.lineTo(cx + Math.cos(ang + 2.5) * s2, cy + Math.sin(ang + 2.5) * s2)
          ctx.lineTo(cx + Math.cos(ang - 2.5) * s2, cy + Math.sin(ang - 2.5) * s2)
          ctx.closePath()
        }
        ctx.fill()
      }
    })
  },
}
