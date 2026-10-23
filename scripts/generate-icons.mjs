/**
 * generate-icons — the home-screen PNGs and the share image, from ONE source:
 * `public/touch-icons/apple-touch-icon-dark.svg` (the favicon's mark, hand-placed in the KOL 24-box).
 * FXR (plans 11 + 25 + 36): white on #121215, the mark in the middle 60% of a square;
 * the maskable icon keeps it inside the safe circle (middle 50%); the OG image is the same
 * lettering at banner proportion. Touch the SVG, run this, commit all of it.
 *
 *   pnpm icons
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'

const GROUND = '#121215'
const INK = '#FFFFFF'
const SRC = 'public/touch-icons/apple-touch-icon-dark.svg'
const icon = readFileSync(SRC, 'utf8')
/* the mark = the inner of the one placed <g> in the source — what sits in the middle 60% */
const m = icon.match(/<g transform="translate\([^)]*\) scale\([^)]*\)" style="color:[^"]*">([\s\S]*?)<\/g>\s*<\/svg>/)
if (!m) throw new Error(`${SRC}: no placed lettering group`)
const mark = m[1]

const square = (scale, note) => `<svg width="180" height="180" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<!-- FXR app icon, dark: ${note} -->
<rect width="24" height="24" fill="${GROUND}"/>
<g transform="translate(${((1 - scale) * 12).toFixed(2)} ${((1 - scale) * 12).toFixed(2)}) scale(${scale})" style="color:${INK}">${mark}</g>
</svg>`
const banner = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<!-- FXR share image: the favicon's glitch-split mark, white on ${GROUND} — the dark touch icon at banner proportion. Source for fxr.png; the mark itself lives in touch-icons/apple-touch-icon-dark.svg. -->
<rect width="1200" height="630" fill="${GROUND}"/>
<svg x="450" y="165" width="300" height="300" viewBox="0 0 24 24" style="color:${INK}">${mark}</svg>
</svg>`

mkdirSync('public/og', { recursive: true })
const maskable = square(0.5, 'maskable — the lettering in the middle 50%, inside the safe circle')
writeFileSync('public/og/fxr.svg', banner)
const png = (svg, size, out) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(out)
await png(icon, 180, 'public/touch-icons/apple-touch-icon-dark.png')
await png(icon, 192, 'public/touch-icons/icon-192.png')
await png(icon, 512, 'public/touch-icons/icon-512.png')
await png(maskable, 512, 'public/touch-icons/icon-512-maskable.png')
await sharp(Buffer.from(banner), { density: 150 }).resize(1200, 630).png().toFile('public/og/fxr.png')
console.log('icons from touch-icons/apple-touch-icon-dark.svg: 180/192/512 + maskable 512 · og 1200×630')
