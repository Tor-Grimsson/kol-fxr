import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

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
  plugins: [react(), svgr(), tailwindcss(), devFavicon],
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
      '/media': { target: 'https://media.kolkrabbi.io', changeOrigin: true, rewrite: (p) => p.replace(/^\/media/, '') },
    },
  },
  preview: {
    proxy: {
      '/media': { target: 'https://media.kolkrabbi.io', changeOrigin: true, rewrite: (p) => p.replace(/^\/media/, '') },
    },
  },
})
