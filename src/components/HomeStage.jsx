import { useEffect, useRef } from 'react'
import { Growth, densityFrom, waveAt } from '../loops/growth/engine.js'
import { sourceCanvas, vectorCanvas } from '../loops/flow/growthLine.js'
import { hideLoaderApp } from '@kolkrabbi/kol-framework/src/loaderApp.js'
import { claimIntro, endIntro } from './intro.js'

/* THE SIGNED-OUT STAGE (plan 44 W3, user 2026-10-28: "a live generative stage") — the growing line filling the built-in
 * orb, full-bleed behind HubHome's signed-out page (`home.stage`). Its own small sim, not a loop layer: no transport, no
 * editor stack on the shell tier. It grows to its cap and settles; a resize keeps it (4.2). Ink is the theme's
 * meta fg, so it reads in light and dark.
 *
 * FILLS THE ORB (user 2026-10-30: "why does this also stop growing at this size?") — the cap was 8000 nodes at gaps 4/16,
 * which fills 30% of the orb's radius at a desk; gaps 6/24 and 14000 nodes fill 99% (measured on a 1392×1131 stage, ~12ms
 * a step at the cap). THE POINTER IS A FORCE — a move pushes the line aside, as hard as it moves, a press blasts a crater
 * it regrows into (engine `poke`); either wakes a finished line, which settles and sleeps again once its heat is gone.
 * THE LINE SETTLES (plan 45 W1, 2026-10-31): the engine's `settle` — every node carries a heat its motion, a split, the
 * pointer or a pressing neighbour raise and that fades by itself; the loop runs while anything is warm (`sim.hot`) or the
 * line is still growing, and only draws otherwise (the wave). Two steps a frame while it grows, one while it settles.
 * `/?stage=logo` grows into the FXR mark instead of the orb — the A/B the user asked for.
 * ONE LINE FROM LOAD TO HOME (plan 45 W4, user 2026-10-31: *"it stays a pattern and the other elements just slide in or
 * reveal? and then it … grows out of the shape to fill the screen, like the circle does now"* → *"yes LOVE it"*): on a load
 * of `/` this stage is the loader. The line grows through the FXR mark and is drawn only inside its letters, so the logo is
 * the pattern from the first frame; it rests and breathes while the page's controls fade in around it; then the letters let
 * go — the same line, the orb's density — and it grows out of the mark to fill the screen. No second line, no solid mark.
 * A RESIZE KEEPS THE LINE (4.2): `\` (the shell's rail key) and a window resize change the box; the line re-centres in the
 * new frame and grows on into it, never reseeds. A SLOW WAVE (4.3) drifts the drawn line, so it is never static. */
const LOGO = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('stage') === 'logo'
const HOME = { minGap: 6, maxGap: 24, contrast: 1.4, growth: 2.5 }
/* the intro, ms from its first frame: the line fills the mark · it breathes (two 2 s breaths) while the page fades in ·
 * the letters let go and the rest of the line fades up as it grows out */
const MARK_MS = 3800, REST_MS = 4000, BREATH_MS = 2000, UI_AT = 800, UI_MS = 700, RELEASE_MS = 4000, MARK_FIT = 0.5
let markImg = null
const loadMark = () => (markImg ??= new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = '/favicon/favicon.svg' }))

export default function HomeStage() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    /* SIGN IN NEVER RESTARTS IT (plan 44 6.2, user 2026-10-30: *"its just supposed to change bg color and overlay the home
     * view... nothing should retrigger the growth"*): the canvas sizes to the whole signed-out Home, never to the stage's
     * box, and sits centred; kol-shell 0.91.3's HubHome slides the stage 336 right while the column is open (user
     * 2026-10-30: *"when shelf opens, then growth center shifts to center the gray visible area"*) */
    const box = canvas.closest('[data-hub-signed-out]') ?? canvas.parentElement
    let sim = null, raf = 0, w = 0, h = 0, dpr = 1, run = 0, intro = null
    let ptr = null, sm = null
    const fit = () => {
      const r = box.getBoundingClientRect()
      w = Math.max(1, r.width); h = Math.max(1, r.height); dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    /* the page's own controls (logo, +, dock) — hidden under the intro, faded in while the mark breathes */
    const page = () => [...box.children].filter((c) => !c.contains(canvas))
    const showPage = (on) => page().forEach((c) => { c.style.transition = on ? `opacity ${UI_MS}ms ease` : 'none'; c.style.opacity = on ? '' : '0' })
    /* the letters as an alpha mask, and the layer the line is drawn on before it is cut by them */
    const masks = () => {
      const mk = (draw) => { const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height; draw?.(c.getContext('2d')); return c }
      const img = intro.img, iw = img.width || 24, ih = img.height || 24, k = Math.min(w / iw, h / ih) * MARK_FIT
      intro.mask = mk((g) => { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.drawImage(img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k) })
      intro.layer = mk()
    }
    const start = async () => {
      fit()
      const id = ++run
      const playing = !LOGO && claimIntro()
      const img = playing ? await loadMark().catch(() => null) : null
      const shape = LOGO ? await vectorCanvas(null, w / h, 0.6).catch(() => null) : img ? await vectorCanvas(null, w / h, MARK_FIT).catch(() => null) : sourceCanvas('orb', '', w / h)
      if (id !== run || !shape) return false
      /* the sim runs in CSS px, so the spacing reads the same on a phone as on a desk (frames A2 · B2) */
      /* the budget scales with the window, so a wide desk fills to its corners; growth ends when the front leaves the frame */
      sim = new Growth({ w, h, density: densityFrom(shape), cap: Math.round(w * h / 90) })
      /* the mark wants a harder contrast than the orb to read as letters: tight inside, wide outside */
      /* the line runs past the edges and freezes there instead of piling into them, and settles where it is done */
      sim.setParams({ ...(LOGO ? { minGap: 4, maxGap: 48, contrast: 2, growth: 2.5 } : img ? { minGap: 5, maxGap: 18, contrast: 1.2, growth: 5 } : HOME), bleed: 48, settle: 60 })
      if (LOGO) sim.seed(); else sim.seed(0.5, 0.5)
      if (img) {
        /* the letters wear the logo's ink (Home's line is the meta fg); the release fades them down to it */
        const probe = document.createElement('span'); probe.className = 'text-emphasis'; box.append(probe)
        intro = { img, t0: 0, ink: 1, out: 0, bright: getComputedStyle(probe).color, mark: sim.density, mix: null }
        probe.remove(); masks(); showPage(false)
      } else if (playing) { endIntro(); hideLoaderApp({ minMs: 0 }) }
      /* the measure hook for plan 45's acceptance (dev only): the sim, read by Playwright */
      if (import.meta.env.DEV) window.__fxrStage = { get sim() { return sim }, get intro() { return intro } }
      return true
    }
    /* the letters let go: Home's spacing, every node warm, and the density blends from the mark to the orb over the
     * release (`blend`) — the letters loosen as the line grows out, rather than dissolving at once */
    const release = () => {
      const orb = densityFrom(sourceCanvas('orb', '', w / h))
      intro.orb = orb; intro.mix = { cols: orb.cols, rows: orb.rows, data: new Float32Array(orb.data.length) }
      sim.density = intro.mix
      sim.setParams(HOME)
      sim.full = false; sim.heat.fill(1); sim.hot = sim.x.length
    }
    const blend = (u) => { const a = intro.mark.data, b = intro.orb.data, m = intro.mix.data; for (let i = 0; i < m.length; i++) m[i] = a[i] + (b[i] - a[i]) * u }
    const paint = (now) => {
      const g = canvas.getContext('2d'), ink = getComputedStyle(canvas).color
      const wave = waveAt(now)
      g.clearRect(0, 0, w, h)
      if (!intro) { sim.draw(g, w, h, { ink, width: 1, wave }); return }
      const L = intro.layer.getContext('2d')
      L.globalCompositeOperation = 'source-over'; L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, intro.layer.width, intro.layer.height)
      L.setTransform(dpr, 0, 0, dpr, 0, 0); sim.draw(L, w, h, { ink: intro.bright, width: 1, wave })
      /* the whole line in Home's ink once the letters let go, fading up; the letters in the logo's ink, at the breath */
      if (intro.out > 0) { g.globalAlpha = intro.out; sim.draw(g, w, h, { ink, width: 1, wave }); g.globalAlpha = 1 }
      L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'destination-in'; L.drawImage(intro.mask, 0, 0)
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0)
      g.globalAlpha = intro.ink * (1 - intro.out); g.drawImage(intro.layer, 0, 0)
      g.restore()
    }
    /* the line steps while it grows or anything is warm; it is drawn every frame, for the wave */
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      let steps = !sim.full ? 2 : sim.hot > 0 ? 1 : 0
      if (intro) {
        if (!intro.t0) { intro.t0 = now; hideLoaderApp({ minMs: 0 }) }
        const t = now - intro.t0
        if (t < MARK_MS) steps = 4
        else if (t < MARK_MS + REST_MS) {
          /* it keeps filling the letters' far corners through the first breath, then holds */
          if (!intro.rest && t > MARK_MS + BREATH_MS) { intro.rest = true; sim.setParams({ growth: 0 }) }
          intro.ink = 0.7 + 0.3 * Math.cos((2 * Math.PI * (t - MARK_MS)) / BREATH_MS)
          if (!intro.shown && t > MARK_MS + UI_AT) { intro.shown = true; showPage(true) }
        } else {
          if (!intro.free) { intro.free = true; intro.ink = 1; release() }
          const u = Math.min(1, (t - MARK_MS - REST_MS) / RELEASE_MS)
          blend(u); intro.out = u
          if (u >= 1) { sim.density = intro.orb; intro = null; endIntro(); page().forEach((c) => { c.style.transition = '' }) }
        }
      }
      if (ptr && !intro) {
        /* low-passed — the raw one twitches; at 0.1 the push trailed the cursor by ~10 frames, which read as lag (plan 45
         * 1.3, user 2026-10-31: *"maybe a little laggy??"* — frames measured clean at DPR 2, p95 16.8 ms), so 0.35 */
        const to = sm ? { x: sm.x + (ptr.x - sm.x) * 0.35, y: sm.y + (ptr.y - sm.y) * 0.35 } : { x: ptr.x, y: ptr.y }
        /* the push is the pointer's own speed — a resting pointer is no force, a slow drift a light brush, a sweep a shove */
        const speed = sm ? Math.hypot(to.x - sm.x, to.y - sm.y) : 0
        if (ptr.down || speed > 0.3) { sim.poke(to.x, to.y, ptr.down, ptr.down ? 1 : Math.min(1, speed / 6)); steps = Math.max(steps, 1) }
        sm = to
      } else sm = null
      for (let k = 0; k < steps; k++) sim.step()
      paint(now)
    }
    /* A RESIZE KEEPS THE LINE (plan 45 4.2 — `\` resized the box and reseeded it): the line re-centres in the new frame,
     * the orb is re-drawn at the new aspect, the budget follows the area, and a bigger frame wakes the line to grow on */
    const resize = () => {
      const r = box.getBoundingClientRect()
      if (!sim || (Math.round(r.width) === Math.round(w) && Math.round(r.height) === Math.round(h))) return
      const ow = w, oh = h
      fit()
      const dx = (w - ow) / 2, dy = (h - oh) / 2
      for (let i = 0; i < sim.x.length; i++) { sim.x[i] += dx; sim.y[i] += dy }
      sim.w = w; sim.h = h
      sim.setParams({ cap: Math.round(w * h / 90) })
      if (intro) masks()
      if (!LOGO && !intro) sim.density = densityFrom(sourceCanvas('orb', '', w / h))
      if (w > ow || h > oh) { sim.full = false; sim.heat.fill(0.5); sim.hot = sim.x.length }
    }
    start().then((ok) => { if (ok) raf = requestAnimationFrame(frame) })
    const ro = new ResizeObserver(resize)
    ro.observe(box)
    /* the stage sits behind the page, so the pointer is read on the window; a press on a control is the control's */
    const at = (e) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null
    }
    /* the sign-in column covers the line; the pointer over it is the column's */
    const onMove = (e) => { const p = e.target.closest?.('aside') ? null : at(e); ptr = p && { ...p, down: ptr?.down ?? false } }
    const onDown = (e) => { if (e.target.closest?.('button, a, input, textarea, select, [role="menu"], aside')) return; const p = at(e); if (p) ptr = { ...p, down: true } }
    const onUp = () => { if (ptr) ptr = { ...ptr, down: false } }
    const onLeave = () => { ptr = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)
    return () => {
      run++; cancelAnimationFrame(raf); ro.disconnect()
      if (intro) page().forEach((c) => { c.style.transition = ''; c.style.opacity = '' })
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 block text-fg-48" />
}
