// icons — the identity set is the DS's (kol-icons `identity/fxr/`, IdentitySetFromPackage 2026-10-28); this only copies it in.
// A new or changed mark is drawn in kol-ds-ui with /app-icon and arrives on the next bump.
import { cpSync, mkdirSync } from 'node:fs'
const ID = 'fxr'
const SET = `node_modules/@kolkrabbi/kol-icons/src/kol-icon-set-identity/${ID}`
for (const d of ['public/touch-icons', 'public/favicon', 'public/og']) mkdirSync(d, { recursive: true })
for (const f of ['apple-touch-icon-dark.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) cpSync(`${SET}/${f}`, `public/touch-icons/${f}`)
cpSync(`${SET}/${ID}-tile.svg`, 'public/touch-icons/apple-touch-icon-dark.svg') // the manifest's SVG icon
cpSync(`${SET}/${ID}-favicon.svg`, 'public/favicon/favicon.svg')
cpSync(`${SET}/og.png`, `public/og/${ID}.png`)
