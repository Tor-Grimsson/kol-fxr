
import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'



// Front-propagation / growing circles. Every frame: spawn a new seed (at the
// interior point farthest from existing circles + SDF boundary), then let all
// live circles grow until they touch another or the SDF boundary.
//
// Reference approach: "Growing Circles" (generativeartistry.com circle-packing tutorial),
// also Gorilla Sun recursive circle packing strategy.
export const frontPack            = {
  id: '05-front-pack',
  name: 'CIRCLE PACKING (GROWING)',
  repo: 'generativeartistry.com/tutorials/circle-packing',
  summary:
    'Each frame, N new seeds spawn and grow as circles until they collide with a neighbor or the SDF boundary. Higher-quality packings than dart-throwing (tighter, no gaps). Animates natively as circles visibly inflate.',
  helps:
    'The "build-up over time" feel from the brief. Unlike the static pack (01), this one visually accretes. Use as the initial trigger animation.',
  params: [
    { key: 'maxCircles', type: 'int', min: 100, max: 2400, step: 50, default: 900, label: 'max circles' },
    { key: 'seedsPerFrame', type: 'int', min: 1, max: 24, default: 8, label: 'seeds/frame' },
    { key: 'growStep', type: 'range', min: 0.1, max: 2, step: 0.05, default: 0.7, label: 'grow step' },
    { key: 'minR', type: 'int', min: 1, max: 12, default: 3, label: 'min radius' },
    { key: 'maxR', type: 'int', min: 16, max: 100, default: 55, label: 'max radius' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { maxCircles, seedsPerFrame, growStep, minR, maxR } = params

    const circles      = []

    /* Living system (2026-08-09): a full pack fossilizes. The OLDEST circles
     * are continuously retired — marked dying, faded out over FADE frames,
     * then removed — so the front always has room to regrow. Dying circles
     * stop blocking spawns/growth, so the pack refills through them. */
    const FADE = 30
    let prevDown = false

    /* PERF (2026-08-09): spawn checks and grow-collision were all-pairs —
     * O(N) per seed and per growing circle against up to maxCircles. Circles
     * never move, so they bucket once into a spatial grid (removed on death);
     * both checks scan only the buckets within reach. */
    const cellW = maxR + 1
    const gw = Math.ceil(sdf.w / cellW) + 1
    const gh = Math.ceil(sdf.h / cellW) + 1
    const gridC = new Array(gw * gh)
    for (let i = 0; i < gridC.length; i++) gridC[i] = []
    const gi = (x, y) =>
      Math.max(0, Math.min(gh - 1, Math.floor(y / cellW))) * gw +
      Math.max(0, Math.min(gw - 1, Math.floor(x / cellW)))
    // hit(x, y, dist(c)) → true if any live circle c has |c - (x,y)| < dist(c)
    const nearHit = (x, y, distOf, reach, skip) => {
      const cx = Math.floor(x / cellW), cy = Math.floor(y / cellW)
      const rc = Math.max(1, Math.ceil(reach / cellW))
      for (let j = -rc; j <= rc; j++) {
        const yy = cy + j
        if (yy < 0 || yy >= gh) continue
        for (let i = -rc; i <= rc; i++) {
          const xx = cx + i
          if (xx < 0 || xx >= gw) continue
          const bucket = gridC[yy * gw + xx]
          for (let k = 0; k < bucket.length; k++) {
            const c = bucket[k]
            if (c.dying || c === skip) continue
            const dx = c.x - x, dy = c.y - y
            const s = distOf(c)
            if (dx * dx + dy * dy < s * s) return true
          }
        }
      }
      return false
    }

    return wrapLoop(() => {
      // Spawn new seeds — pointer bias: positions freeze after spawn (no
      // relaxation), so spawning IS the interaction. Most seeds appear in a
      // jitter ring around the cursor; the SDF-inside check below still gates.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      for (let s = 0; s < seedsPerFrame && circles.length < maxCircles; s++) {
        const [x, y] = ptr && rng() < 0.7 * Math.min(1, params.interact)
          ? [ptr.x + (rng() + rng() - 1) * maxR, ptr.y + (rng() + rng() - 1) * maxR]
          : sampleInside(sdf, rng)
        if (nearHit(x, y, (c) => c.r + minR, maxR + minR)) continue
        if (sdf.sample(x, y) > -minR) continue
        const nc = { x, y, r: minR / 2, growing: true, dying: false, fade: FADE }
        circles.push(nc)
        const bucket = gridC[gi(x, y)]
        bucket.push(nc)
        nc.bk = bucket
      }

      // Grow circles
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i]
        if (!c.growing) continue
        const nr = c.r + growStep
        if (nr >= maxR) { c.r = maxR; c.growing = false; continue }
        // SDF check
        if (-sdf.sample(c.x, c.y) <= nr + 0.5) { c.growing = false; continue }
        // Collision (grid-bounded)
        if (nearHit(c.x, c.y, (o) => o.r + nr + 0.4, maxR + nr + 0.4, c)) {
          c.growing = false
          continue
        }
        c.r = nr
      }

      // lifecycle — near the cap, retire the oldest live circles (array is
      // push-ordered, so age order is index order) at a steady trickle
      if (circles.length > maxCircles * 0.85) {
        let n = Math.ceil(seedsPerFrame / 3)
        for (let i = 0; i < circles.length && n > 0; i++) {
          const c = circles[i]
          if (c.dying) continue
          c.dying = true
          c.growing = false
          n--
        }
      }

      // press = clear a HOLE (2× the old blast radius) — kill every circle
      // in the ring at the cursor; the spawn bias above refills the crater
      if (ptr && ptr.down && !prevDown) {
        const hole = Math.min(sdf.w, sdf.h) * 0.28 * Math.min(2, params.interact)
        for (const c of circles) {
          if (c.dying) continue
          const dx = c.x - ptr.x, dy = c.y - ptr.y
          if (dx * dx + dy * dy < hole * hole) {
            c.dying = true
            c.growing = false
            c.fade = Math.min(c.fade, 18) // ≥300ms fade (anti-strobe)
          }
        }
      }
      prevDown = !!(ptr && ptr.down)

      // fade + remove the dying (also drop them out of their grid bucket)
      for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i]
        if (!c.dying) continue
        if (--c.fade <= 0) {
          circles.splice(i, 1)
          if (c.bk) {
            const bi = c.bk.indexOf(c)
            if (bi >= 0) c.bk.splice(bi, 1)
          }
        }
      }

      // Render — fg-led rings 3× heavier; the LIVE growth front pops warm
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.2), 1.4)

      // outlines — growing circles are the visible life, settled ones calm fg.
      // PERF: settled and growing batch into one stroked path each; only the
      // (few) dying circles stroke individually for their fade alpha.
      ctx.lineWidth = 0.9 * U
      const rScale = Math.min(sx, sy)
      for (let pass = 0; pass < 2; pass++) {
        const wantGrowing = pass === 1
        ctx.strokeStyle = wantGrowing ? pc('warm', 0.95) : pc('fg', 0.55)
        ctx.beginPath()
        for (const c of circles) {
          if (c.dying || c.growing !== wantGrowing) continue
          const rr = c.r * rScale
          ctx.moveTo(c.x * sx + rr, c.y * sy)
          ctx.arc(c.x * sx, c.y * sy, rr, 0, Math.PI * 2)
        }
        ctx.stroke()
      }
      for (const c of circles) {
        if (!c.dying) continue
        const a = Math.max(0, c.fade / FADE)
        ctx.strokeStyle = pc('fg', 0.55 * a)
        ctx.beginPath()
        ctx.arc(c.x * sx, c.y * sy, c.r * rScale, 0, Math.PI * 2)
        ctx.stroke()
      }

      // centers — solid marks, not dust (live batch + dying individually)
      ctx.fillStyle = pc('warm', 1)
      ctx.beginPath()
      const cR = 1.5 * U
      for (const c of circles) {
        if (c.dying) continue
        ctx.moveTo(c.x * sx + cR, c.y * sy)
        ctx.arc(c.x * sx, c.y * sy, cR, 0, Math.PI * 2)
      }
      ctx.fill()
      for (const c of circles) {
        if (!c.dying) continue
        ctx.fillStyle = pc('warm', Math.max(0, c.fade / FADE))
        ctx.beginPath()
        ctx.arc(c.x * sx, c.y * sy, cR, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  },
}
