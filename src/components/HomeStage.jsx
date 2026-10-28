import { useEffect, useRef } from 'react'
import { Growth, densityFrom } from '../loops/growth/engine.js'
import { sourceCanvas } from '../loops/flow/growthLine.js'

/* THE SIGNED-OUT STAGE (plan 44 W3, user 2026-10-28: "a live generative stage") — the growing line filling the built-in
 * orb, full-bleed behind HubHome's signed-out page (`home.stage`). Its own small sim, not a loop layer: no transport, no
 * editor stack on the shell tier. It grows to its cap and then stops drawing; a resize starts it again. Ink is the theme's
 * meta fg, so it reads in light and dark. */
export default function HomeStage() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    let sim = null, raf = 0, w = 0, h = 0
    const start = () => {
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width); h = Math.max(1, r.height)
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
      /* the sim runs in CSS px, so the spacing reads the same on a phone as on a desk (frames A2 · B2) */
      sim = new Growth({ w, h, density: densityFrom(sourceCanvas('orb', '', w / h)), cap: Math.min(8000, Math.round(w * h / 130)) })
      sim.setParams({ minGap: 4, maxGap: 16, contrast: 1.4, growth: 8 })
      sim.seed()
    }
    const paint = () => {
      const g = canvas.getContext('2d')
      g.clearRect(0, 0, w, h)
      sim.draw(g, w, h, { ink: getComputedStyle(canvas).color, width: 1 })
    }
    /* grows until the cap, then the loop stops — a finished line costs nothing */
    const frame = () => {
      const growing = sim.x.length < sim.cap
      if (growing) { sim.step(); sim.step() }
      paint()
      raf = growing ? requestAnimationFrame(frame) : 0
    }
    const run = () => { cancelAnimationFrame(raf); start(); raf = requestAnimationFrame(frame) }
    run()
    const ro = new ResizeObserver(run)
    ro.observe(canvas)
    /* the ink follows a theme flip on a finished line too */
    const mo = new MutationObserver(() => { if (!raf) paint() })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect() }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="block w-full h-full text-fg-48" />
}
