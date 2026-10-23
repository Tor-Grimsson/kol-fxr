# FXR

A design compositor — frames, layers and vector tools, with generative, kinetic-type and effects layers on one engine.

**Live:** [fxr.kolkrabbi.io](https://fxr.kolkrabbi.io)

A React 19 + Vite + Tailwind 4 app. It consumes the published `@kolkrabbi/kol-*` design system from npm and publishes nothing itself.

## Run

| Command | What it does |
|---|---|
| `pnpm dev` | the app and its D1 Worker (`api/`) together — Sign in works |
| `pnpm dev:app` | the app alone — no API, the library stays local |
| `pnpm build` | the production build into `dist/` |
| `pnpm preview` | serve the built `dist/` |
| `pnpm icons` | regenerate the touch icons and share image from `public/touch-icons/apple-touch-icon-dark.svg` |
| `pnpm api:deploy` | deploy the Worker |

## Hosting

Media loads **same-origin** on purpose: the CDN sends no CORS headers, and a cross-origin image taints the canvas and breaks filters and export. `vercel.json` rewrites `/media/*` to the media bucket; any other host needs the same proxy. Fonts ship in `public/fonts/`.

## Docs

- `docs/` — the subject documentation (start at `docs/documentation/INDEX.md`).
- `.kol/llm-context/` — architecture and current state for agents.

## License

MIT — see [LICENSE](./LICENSE).
