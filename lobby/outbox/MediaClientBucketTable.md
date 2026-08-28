# MediaClientBucketTable — the bucket table belongs in the package

**Filed:** 2026-08-28 → **kol-ds-ui** (`packages/media-client`)
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/MediaClientBucketTable.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` 2026-08-28 · **kol-media-client 0.3.1** — adopted here the same hour
**Co-signed by kol-mirror** — same duplicate, `src/hooks/useMediaLibrary.js:24-28`.

## Why it went there

fxr adopted `@kolkrabbi/kol-media-client` 0.2.0 today, deleting a hand-rolled
copy of the package's entire surface that could only ever see ONE bucket (~430
of 7,971 files). Adopting it landed us on the same `BUCKETS` table kol-mirror
already carries, byte-for-byte.

`createMediaClient({ buckets })` accepts the table but ships none, so every
consumer declares the three hosts and — the load-bearing part — which of them
needs the same-origin proxy. That flag is **which store sends
`Access-Control-Allow-Origin`**: infrastructure state owned by kol-r2b2, not a
consumer preference. It changed on 2026-08-27 (R2 got a real bucket policy) and
neither copy knew.

The failure is silent and asymmetric — a stale `proxy: true` is a wasted hop, a
stale `proxy: false` taints the canvas and `getImageData` **throws**, which is
every filter, the whole effect chain and every export path here.

## What stays here

On the return: bump, delete the local `BUCKETS` const from
`src/editor/library/mediaLibrary.js` and pass overrides only (fxr needs none),
re-verify all three stores still list and that R2 still renders through the
proxy.

**Remainder here:** delete the local `BUCKETS` const, pass overrides only, re-verify the three stores.

## Related, not part of this ticket

R2's CORS policy is **live** (verified here 2026-08-28:
`access-control-allow-origin: *`), so fxr's `/media` proxy is now optional
rather than load-bearing. It is deliberately NOT being removed yet — the header
is on the response, so anything cached from a pre-policy load stays non-CORS and
still taints. `crossOrigin="anonymous"` ships first (fxr already sets it for
http(s) sources), then one surface direct, then the rest, then the rewrites in
`vite.config.js` + `vercel.json` go. Sequence agreed with kol-r2b2.
**State:** 🟢 closed 2026-08-28 · **kol-media-client 0.3.0**

## ↩ RETURNED — 2026-08-28

Closed as **kol-media-client 0.3.0** — `KOL_BUCKETS` exported with the CORS reasoning beside it; `buckets` takes `null` (single, unchanged) | `true` (the table) | an object **merged onto** it, so you override rather than restate and the canonical three passed verbatim merge to exactly themselves; `proxied()` now reads each bucket's `proxy` flag instead of rewriting every CDN host. `r2.proxy` stays `true` — the cache-trap paragraph is in the source above the table, not paraphrased. 8-check self-test: `node packages/media-client/src/index.js`.

Remainder here: bump to 0.3.0 and delete the local `BUCKETS` — pass nothing, `buckets: true`, or only your overrides.

## ✅ ADOPTED — 2026-08-28 · kol-media-client 0.3.0

Bumped 0.2.0 → 0.3.0 (exact pin), local `BUCKETS` const **deleted**, client now
constructed `{ buckets: true }` — fxr overrides nothing, so adoption was a
deletion exactly as the return promised.

`mediaSrc` lost its branch: `proxied()` reads each bucket's own `proxy` flag
since 0.3.0, so a CORS-clean host passes through and the facade no longer
consults the table. `bucketNeedsProxy` reads `KOL_BUCKETS`.

**Verified against the installed package:**

| call | result |
|---|---|
| `proxied(mediaUrl('01.jpg','r2'))` | `/media/01.jpg` — rewritten |
| `proxied(mediaUrl('01.jpg','b2'))` | `https://b2.kolkrabbi.io/01.jpg` — passed through |
| `proxied(mediaUrl('img/x.jpg','b2vault'))` | `https://b2v.kolkrabbi.io/img/x.jpg` — passed through |
| `client.buckets()` | `r2, b2, b2vault` |
| `listMedia('', { bucket: 'b2vault' })` | 4,095 |

Package self-test `node .../kol-media-client/src/index.js` exits 0. App build green.

### The nit went upstream too — 0.3.1

`formatSize` had no null guard in 0.1.0–0.3.0 (`null < 1024` is true → `"null B"`).
Reported rather than filed; kol-ds-ui shipped **0.3.1** the same hour, and
correctly called it theirs rather than my regression — fxr HAD the guard and the
package didn't, which is the same argument as the bucket table: the fact belongs
in one place, not in a consumer's facade.

Bumped to 0.3.1 and the local wrapper is unwrapped — `formatSize` is a plain
re-export again. Verified: `null` `undefined` `NaN` → `''`, `0` → `0 B`,
`512 B` / `2.0 KB` / `4.8 MB` intact. Self-test now 9 checks, exits 0.

**Remainder here:** none — adopted 2026-08-28.
