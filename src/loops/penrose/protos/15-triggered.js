
import { clear, strokeOutline, wrapLoop, sampleInside, pc } from '../common.js'




// Canvas starts empty. Click inside the letter to seed a DLA aggregate at
// that exact point. Each click spawns its own colored aggregate with its own
// walkers. Multiple clicks = multiple aggregates competing / filling the glyph.
// This is the brief's "trigger an expression to start growth trapped in the
// shape" in miniature.
export const triggered            = {
  id: '15-triggered',
  name: 'TRIGGERED GROWTH (CLICK)',
  repo: 'composition · interactive',
  summary:
    'Empty on load — only the outline is visible. Click inside the letter to plant a DLA seed at that point and release 60 walkers. Each click adds another seed with its own color. Walkers stick to their own aggregate when they land nearby. Multi-click → multi-layer growth.',
  helps:
    'The literal form of the brief\'s "trigger an expression" flow. User authors growth spatially; multiple triggers build up layered geometry. The scaffold everyone else plugs into.',
  params: [
    { key: 'walkers', type: 'int', min: 10, max: 300, step: 10, default: 60, label: 'walkers' },
    { key: 'cellSize', type: 'int', min: 4, max: 40, default: 14, label: 'cell size' },
    { key: 'step', type: 'range', min: 0.5, max: 5, step: 0.1, default: 1.5, label: 'step' },
    { key: 'stickDist', type: 'range', min: 1, max: 10, step: 0.5, default: 3, label: 'stick dist' },
    // EDITOR PORT: seeds planted at init — the labs trigger was a canvas
    // click, but the editor host draws into an offscreen buffer that never
    // receives pointer events. 0 restores the labs empty-until-clicked state.
    { key: 'autoSeeds', type: 'int', min: 0, max: 8, default: 3, label: 'auto seeds' },
    { key: 'interact', type: 'range', min: 0, max: 3, step: 0.1, default: 1, label: 'interaction' },
  ],
  init({ canvas, ctx, sdf, W, H, rng, params, pointer }) {
    const sx = W / sdf.w, sy = H / sdf.h
    const U = Math.max(1, Math.min(W, H) / 320) // size unit — marks scale with the canvas

    const { walkers: walkersPerClick, cellSize, step, stickDist } = params

    const stuck          = []
    const walkers           = []
    let seedCounter = 0
    let prevDown = false

    const cs = cellSize
    const gw = Math.ceil(sdf.w / cs) + 1
    const gh = Math.ceil(sdf.h / cs) + 1
    const grid             = new Array(gw * gh)
    for (let i = 0; i < grid.length; i++) grid[i] = []
    const gi = (x        , y        ) =>
      Math.max(0, Math.min(gh - 1, Math.floor(y / cs))) * gw +
      Math.max(0, Math.min(gw - 1, Math.floor(x / cs)))

    // each seed leads with a different PALETTE ROLE — aggregates stay
    // distinguishable and every one lands in the live theme
    const SEED_ROLES = ['warm', 'accent', 'fg']
    const seedC = (sid, a) => pc(SEED_ROLES[sid % SEED_ROLES.length], a)

    /* Living system (2026-08-09): the aggregate accumulated forever. Now the
     * OLDEST stuck nodes dissolve continuously — stuck[] is age-ordered, so
     * a sliding head with a fade window ahead of it works — and the dendrite
     * keeps hunting instead of saturating. A fully dissolved aggregate
     * reseeds itself. Press still plants; it now also bursts a walker ring. */
    let dissolveHead = 0
    const FADE_WIN = 40
    let dissolveAcc = 0

    /* PERF (2026-08-09): every click added walkersPerClick walkers forever —
     * unbounded pool growth. At the cap, new walkers RECYCLE the oldest
     * (round-robin) instead of pushing; the live aggregate is also hard-
     * bounded (STUCK_CAP) — past it nothing sticks until dissolve catches up. */
    const WALKER_CAP = 900
    const STUCK_CAP = 4000
    let walkerRR = 0
    const addWalker = (x        , y        , seed        ) => {
      if (walkers.length < WALKER_CAP) { walkers.push({ x, y, seed }); return }
      const w = walkers[walkerRR++ % walkers.length]
      w.x = x; w.y = y; w.seed = seed
    }

    const plant = (cx        , cy        , addWalkers = true) => {
      if (sdf.sample(cx, cy) >= 0) return
      const sid = seedCounter++
      const idx = stuck.length
      stuck.push({ x: cx, y: cy, parent: -1, seed: sid })
      grid[gi(cx, cy)].push(idx)
      if (!addWalkers) return
      for (let i = 0; i < walkersPerClick; i++) {
        const [x, y] = sampleInside(sdf, rng)
        addWalker(x, y, sid)
      }
    }

    const onClick = (e            ) => {
      // offsetX/Y is canvas-local pre-transform, survives the camera's CSS transform
      plant((e.offsetX / canvas.clientWidth) * sdf.w, (e.offsetY / canvas.clientHeight) * sdf.h)
    }
    canvas.addEventListener('click', onClick)

    // EDITOR PORT (see params): plant the auto seeds up front so the growth
    // runs without interaction — the click path above is kept verbatim.
    for (let i = 0; i < (params.autoSeeds ?? 0); i++) {
      const [ax, ay] = sampleInside(sdf, rng)
      plant(ax, ay)
    }

    const rafCleanup = wrapLoop(() => {
      // Pointer plant — a fresh press seeds a new aggregate at the cursor
      // (plant() gates on the mask). Runs at the very top of the step: the
      // empty-state early return below would otherwise starve it forever.
      const ptr = params.interact > 0 && pointer ? pointer() : null
      if (ptr?.down && !prevDown) {
        const before = seedCounter
        plant(ptr.x, ptr.y)
        if (seedCounter > before) {
          // burst (2× the old ring) — a full walker ring feeds the new seed
          const nb = Math.round(walkersPerClick * Math.min(2, params.interact))
          for (let i = 0; i < nb; i++) {
            const ba = (i / nb) * Math.PI * 2
            const br = cs * (1 + rng() * 2)
            const wx = ptr.x + Math.cos(ba) * br
            const wy = ptr.y + Math.sin(ba) * br
            if (sdf.sample(wx, wy) < 0) addWalker(wx, wy, seedCounter - 1)
          }
        }
      }
      prevDown = !!(ptr && ptr.down)

      // dissolve the oldest nodes — rate scales with aggregate size; below a
      // floor it idles so a young aggregate can establish
      const live = stuck.length - dissolveHead
      dissolveAcc += live > 2000 ? 4 : live > 800 ? 1.5 : live > 300 ? 0.75 : live > 120 ? 0.3 : 0
      while (dissolveAcc >= 1 && stuck.length - dissolveHead > 60) {
        dissolveAcc -= 1
        const s = stuck[dissolveHead]
        const bucket = grid[gi(s.x, s.y)]
        const bi = bucket.indexOf(dissolveHead)
        if (bi >= 0) bucket.splice(bi, 1)
        dissolveHead++
      }
      // compact the dead prefix so the array stays bounded
      if (dissolveHead > 800) {
        const off = dissolveHead
        stuck.splice(0, off)
        for (const s of stuck) s.parent = s.parent < off ? -1 : s.parent - off
        for (let i = 0; i < grid.length; i++) grid[i].length = 0
        for (let i = 0; i < stuck.length; i++) grid[gi(stuck[i].x, stuck[i].y)].push(i)
        dissolveHead = 0
      }
      // a fully dissolved aggregate reseeds itself (no extra walkers)
      if (stuck.length - dissolveHead === 0 && walkers.length > 0) {
        const [ax, ay] = sampleInside(sdf, rng)
        plant(ax, ay, false)
      }

      // simulate
      for (const w of walkers) {
        const ang = rng() * Math.PI * 2
        const nx = w.x + Math.cos(ang) * step
        const ny = w.y + Math.sin(ang) * step
        if (sdf.sample(nx, ny) >= 0) continue
        w.x = nx; w.y = ny

        const gx = Math.floor(w.x / cs), gy = Math.floor(w.y / cs)
        let hit = -1
        outer: for (let j = -1; j <= 1; j++) {
          const yy = gy + j
          if (yy < 0 || yy >= gh) continue
          for (let i = -1; i <= 1; i++) {
            const xx = gx + i
            if (xx < 0 || xx >= gw) continue
            const bucket = grid[yy * gw + xx]
            for (let k = 0; k < bucket.length; k++) {
              const s = stuck[bucket[k]]
              const dx = s.x - w.x, dy = s.y - w.y
              if (dx * dx + dy * dy < stickDist * stickDist) { hit = bucket[k]; break outer }
            }
          }
        }
        if (hit >= 0 && stuck.length - dissolveHead < STUCK_CAP) {
          const idx = stuck.length
          stuck.push({ x: w.x, y: w.y, parent: hit, seed: stuck[hit].seed })
          grid[gi(w.x, w.y)].push(idx)
          const [rx, ry] = sampleInside(sdf, rng)
          w.x = rx; w.y = ry
        }
      }

      // render
      clear(ctx, W, H)
      strokeOutline(ctx, sdf, W, H, pc('fg', 0.25), 1.5)

      if (stuck.length === 0) {
        ctx.fillStyle = pc('fg', 0.55)
        ctx.font = '11px ui-monospace, Monaco, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('click inside the letter to seed growth', W / 2, H / 2)
        return
      }

      // walkers tinted by seed — visible weather, not dust.
      // PERF: batched per palette role (3 fills) instead of one per walker.
      const wR = 1.8 * U
      for (let role = 0; role < SEED_ROLES.length; role++) {
        ctx.fillStyle = seedC(role, 0.27)
        ctx.beginPath()
        for (const w of walkers) {
          if (w.seed % SEED_ROLES.length !== role) continue
          ctx.moveTo(w.x * sx + wR, w.y * sy)
          ctx.arc(w.x * sx, w.y * sy, wR, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      // edges — nodes below the dissolve head are gone; the FADE_WIN indices
      // above it fade out as the head advances toward them.
      // PERF: fully-opaque elements batch per role; only the FADE_WIN fading
      // window (≤40 nodes) pays a per-element stroke for its alpha.
      ctx.lineWidth = 0.9 * U
      for (let role = 0; role < SEED_ROLES.length; role++) {
        ctx.strokeStyle = seedC(role, 0.8)
        ctx.beginPath()
        for (let i = dissolveHead; i < stuck.length; i++) {
          const s = stuck[i]
          if (s.parent < 0 || s.parent < dissolveHead) continue
          if (s.parent - dissolveHead < FADE_WIN) continue // fading — below
          if (s.seed % SEED_ROLES.length !== role) continue
          const p = stuck[s.parent]
          ctx.moveTo(p.x * sx, p.y * sy)
          ctx.lineTo(s.x * sx, s.y * sy)
        }
        ctx.stroke()
      }
      const fadeEnd = Math.min(stuck.length, dissolveHead + FADE_WIN)
      for (let i = dissolveHead; i < stuck.length; i++) {
        const s = stuck[i]
        if (s.parent < 0 || s.parent < dissolveHead) continue
        if (s.parent - dissolveHead >= FADE_WIN) continue
        const p = stuck[s.parent]
        ctx.globalAlpha = Math.min(1, (s.parent - dissolveHead) / FADE_WIN)
        ctx.strokeStyle = seedC(s.seed, 0.8)
        ctx.beginPath()
        ctx.moveTo(p.x * sx, p.y * sy)
        ctx.lineTo(s.x * sx, s.y * sy)
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      // stuck dots — same split: opaque batched per role, fading window solo
      const dR = 2.2 * U
      for (let role = 0; role < SEED_ROLES.length; role++) {
        ctx.fillStyle = seedC(role, 1)
        ctx.beginPath()
        for (let i = fadeEnd; i < stuck.length; i++) {
          const s = stuck[i]
          if (s.seed % SEED_ROLES.length !== role) continue
          ctx.moveTo(s.x * sx + dR, s.y * sy)
          ctx.arc(s.x * sx, s.y * sy, dR, 0, Math.PI * 2)
        }
        ctx.fill()
      }
      for (let i = dissolveHead; i < fadeEnd; i++) {
        const s = stuck[i]
        ctx.globalAlpha = Math.min(1, (i - dissolveHead) / FADE_WIN)
        ctx.fillStyle = seedC(s.seed, 1)
        ctx.beginPath()
        ctx.arc(s.x * sx, s.y * sy, dR, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    })

    return () => {
      canvas.removeEventListener('click', onClick)
      rafCleanup()
    }
  },
}
