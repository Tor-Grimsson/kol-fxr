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
  // THE RAW-SOURCE KOL PACKAGES ARE NOT PRE-BUNDLED. They publish JSX, and two
  // things in them break under the dep optimizer: kol-icons builds its registry
  // via `import.meta.glob(...svg)`, which only expands when Vite source-transforms
  // the file (pre-bundled, every icon resolves to "not found"); and since
  // kol-component 0.240.0 `PdfPage.jsx` does `import('pdfjs-dist/…?url')`, which
  // the optimizer reads as a literal filename and fails the whole dev start
  // (found 2026-10-07 on this repo's bump: `vite --force` died in
  // "dependency optimization"). Excluded, they ride the plugin pipeline like
  // app source. Their CJS deps then skip the optimizer's interop, so those are
  // pre-bundled by name — the same shape kol-website runs on 0.240.0.
  // Stale-after-bump is handled by `vite --force` in the dev script
  // (2026-08-27 — the title face and the filter labels both rendered the OLD
  // package after a bump until the dep cache was rebuilt).
  optimizeDeps: {
    exclude: [
      '@kolkrabbi/kol-icons',
      '@kolkrabbi/kol-component',
      '@kolkrabbi/kol-framework',
      '@kolkrabbi/kol-brand',
      '@kolkrabbi/kol-shell',
      '@kolkrabbi/kol-theme',
    ],
    include: [
      '@kolkrabbi/kol-component > react-syntax-highlighter',
      '@kolkrabbi/kol-component > embla-carousel-react',
    ],
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
