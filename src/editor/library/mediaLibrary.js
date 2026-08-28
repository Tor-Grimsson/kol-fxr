import { createMediaClient, KOL_BUCKETS, isImageType, isVideoType, formatSize } from '@kolkrabbi/kol-media-client'

/**
 * mediaLibrary — the Kolkrabbi CDN, as a thin facade over
 * `@kolkrabbi/kol-media-client` (0.2.0, pinned exact — 0.x carries no semver
 * contract).
 *
 * This file used to hand-roll the client: its own `listMedia`, `mediaUrl`,
 * `proxied`, type guards and `formatSize`, ported from kol-labs-single. All
 * six were the package's surface function-for-function, including the
 * `r2.kolkrabbi.io` host we patched by hand on 2026-08-27 — a fork of
 * something already published, and one that could only ever see ONE bucket.
 * Adopted 2026-08-28 (kol-mirror was already on it; kol-r2b2 too).
 *
 * THREE STORES, ONE LISTING API. `admin.kolkrabbi.io/api/list?bucket=<id>` is
 * public, CORS `*`, and one shape across both providers:
 *
 *   r2      r2.kolkrabbi.io    R2, kol-media     ~430 files
 *   b2      b2.kolkrabbi.io    B2, website      ~3400 files
 *   b2vault b2v.kolkrabbi.io   B2, vault        ~4100 files
 *
 * The hand-rolled version knew only `r2`, so ~7,500 files were unreachable
 * from this app. The table is duplicated in kol-mirror
 * (`src/hooks/useMediaLibrary.js`) and belongs in the package — filed as
 * `MediaClientBucketTable`, and it comes out of here on the return.
 *
 * ALL THREE ARE CANVAS-SAFE TODAY. Every filter, the effect chain and every
 * export path call `getImageData`, which throws on a canvas tainted by a
 * cross-origin load that carried no CORS header. B2 gets its headers from
 * kol-r2b2's `workers/cdn-proxy/`; R2 got a real bucket policy on 2026-08-27
 * (`allowed_origins: *`, `Range` allowed so video seeking and byte-range reads
 * preflight cleanly). Verified from here: `access-control-allow-origin: *` on
 * `r2.kolkrabbi.io`.
 *
 * THE `/media/` PROXY STAYS, for now. It is no longer load-bearing, but the
 * header is on the RESPONSE, not the object: anything already in a user's
 * cache from a pre-policy load stays non-CORS until evicted, and
 * `getImageData` still throws on it. `crossOrigin="anonymous"` is the fix and
 * has to ship BEFORE the proxy comes off (it partitions the cache, forcing a
 * refetch instead of reusing the tainted entry). Sequence agreed with
 * kol-r2b2: attribute first behind the proxy, then one surface direct, then
 * the rest, then delete the rewrites in `vite.config.js` + `vercel.json`.
 * Keeping the proxy is also defensible — it survives a host change.
 *
 * WRITES DO NOT BELONG HERE (kol-r2b2 ARCHITECTURE §2/§4). The package ships
 * `uploadToLibrary`, but it POSTs to a consumer-side proxy holding the shared
 * `ADMIN_PASSWORD`, which a browser app cannot hold. Per-app tokens or signed
 * upload URLs are kol-r2b2's call and are not built. Until then this app is
 * READ-ONLY and writes go through the `bucket-r2` CLI or a human.
 */

/* The table is the PACKAGE's now (kol-media-client 0.3.0, `MediaClientBucketTable`
 * — filed from here, co-signed by kol-mirror). `buckets: true` takes
 * `KOL_BUCKETS` as shipped; fxr overrides nothing, so adoption was a deletion.
 * Which store needs the same-origin hop is an infrastructure fact owned by
 * kol-r2b2, and it now lives in one place with the CORS reasoning beside it. */
export const BUCKET_OPTIONS = Object.values(KOL_BUCKETS).map((b) => ({ value: b.id, label: b.label }))
export const DEFAULT_BUCKET = 'r2'

/* The client is rebuilt rather than mutated, because `proxyPath` is fixed at
 * construction. `<DesignEditor mediaProxyBase>` sets it once at mount (see
 * ../../index.jsx), so "rebuild on set" IS per-mount for the single-editor
 * case and behaves exactly as the old module-global for any other.
 *
 * `proxied` is a prefix SWAP, not a URL join — the base must keep its trailing
 * slash or the href is silently malformed. */
let PROXY_BASE = '/media/'
let client = createMediaClient({ buckets: true, proxyPath: PROXY_BASE })

export const setMediaProxyBase = (base) => {
  PROXY_BASE = base
  client = createMediaClient({ buckets: true, proxyPath: PROXY_BASE })
}

export { isImageType, isVideoType, formatSize }

/** Public URL for a key on its bucket's own host. */
export const mediaUrl = (key, bucket = DEFAULT_BUCKET) => client.mediaUrl(key, bucket)

/** Rewrite a public CDN URL to the same-origin proxy path. */
export const proxied = (url) => client.proxied(url)

/** A canvas-safe URL for a key. `proxied` reads the bucket's own `proxy` flag
 *  since 0.3.0 — a CORS-clean host passes straight through — so this no longer
 *  branches on the table itself. */
export const mediaSrc = (key, bucket = DEFAULT_BUCKET) => client.proxied(client.mediaUrl(key, bucket))

/** Does this bucket still need the same-origin hop? */
export const bucketNeedsProxy = (bucket = DEFAULT_BUCKET) => KOL_BUCKETS[bucket]?.proxy !== false

/* List objects, optionally under a folder prefix. Throws on a non-OK response
 * so callers can show an error. */
export const listMedia = (prefix = '', { signal, bucket = DEFAULT_BUCKET } = {}) =>
  client.listMedia(prefix, { signal, bucket })
