import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { THEME_BOOT_SCRIPT } from '@kolkrabbi/kol-framework/src/theme.js'

/* The no-flash theme boot — kol-framework's own snippet (0.28.0), inlined
   before the app script so the stored choice stamps data-theme pre-paint. */
const themeBoot = {
  name: 'kol-theme-boot',
  transformIndexHtml(html) {
    return html.replace(/<!-- kol-theme-boot[^>]*-->/, `<script>${THEME_BOOT_SCRIPT}</script>`)
  },
}

/* Dev-only favicon — a big yellow X so dev tabs are instantly tellable from
 * prod. `apply: 'serve'` keeps it out of every build. */
const devFavicon = {
  name: 'dev-favicon',
  apply: 'serve',
  transformIndexHtml(html) {
    const svg = encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M7 7 L25 25 M25 7 L7 25" stroke="#F2D24B" stroke-width="8" stroke-linecap="round"/></svg>',
    )
    return html.replace('</head>', `<link rel="icon" href="data:image/svg+xml,${svg}"></head>`)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss(), devFavicon, themeBoot],
  // Single react / react-dom copy — the published DS packages peer-depend on
  // React, and a duplicated copy crashes at runtime with a null dispatcher.
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  // kol-icons's Icon builds its registry via `import.meta.glob(...svg)`.
  // Globs only expand when Vite source-transforms a file — a pre-bundled
  // node_modules dep leaves them empty, so every kol-icons icon resolves to
  // "not found". Excluding it from dep-optimization makes Vite process the
  // package source directly (globs + ?raw both work), populating the registry.
  // NOT the other DS packages: kol-component pulls CJS deps (lowlight) that only
  // work pre-bundled. Stale-after-bump is handled by `vite --force` in the dev
  // script instead (2026-08-27 — the title face and the filter labels both
  // rendered the OLD package after a bump until the dep cache was rebuilt).
  optimizeDeps: {
    exclude: ['@kolkrabbi/kol-icons'],
  },
  // /media → the kol-media CDN, same-origin so photo filters can getImageData
  // without tainting the canvas (the CDN sends NO CORS headers; a cross-origin
  // load poisons every filtered/export path). Labs model (kol-labs-single).
  // Prod note: a static build needs an equivalent rewrite at the host, e.g.
  // vercel.json { "source": "/media/:path*", "destination": "https://media.kolkrabbi.io/:path*" }.
  server: {
    proxy: {
      '/media': { target: 'https://r2.kolkrabbi.io', changeOrigin: true, rewrite: (p) => p.replace(/^\/media/, '') },
    },
  },
  preview: {
    proxy: {
      '/media': { target: 'https://r2.kolkrabbi.io', changeOrigin: true, rewrite: (p) => p.replace(/^\/media/, '') },
    },
  },
})
