/**
 * stillUpload — an uploaded IMAGE becomes a data URL the file carries (plan 26 § 13).
 *
 * The editor parked uploads as a `blob:` URL + the bytes in this browser's IndexedDB (clipStore), so a
 * saved file held a dead URL: it reopened with no picture after a reload and never on another device.
 * Labs read the raw file as a data URL — a 12 MB photo straight into localStorage and the D1 row.
 * One path now, both chromes: decoded, downscaled to `max` on the long side, re-encoded webp. A
 * photo is ~200–500 KB in the file and travels with it. Video stays on the clip store.
 *
 * ponytail: data URLs ride the localStorage library (≈5–10 MB quota) — a few dozen photos, not
 * hundreds. The upgrade is an asset store (an app-owned R2 bucket behind the Worker), a user ruling.
 * GIFs and SVGs pass through untouched (a re-encode would freeze the one and raster the other).
 */
export const STILL_MAX = 2048

const readAsDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(r.result)
  r.onerror = () => rej(r.error)
  r.readAsDataURL(blob)
})

export async function stillToDataUrl(file, max = STILL_MAX) {
  if (/image\/(gif|svg\+xml)/.test(file.type)) return readAsDataUrl(file)
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(bmp.width * k))
    c.height = Math.max(1, Math.round(bmp.height * k))
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close?.()
    return c.toDataURL('image/webp', 0.85)
  } catch {
    return readAsDataUrl(file)   /* undecodable here — keep it as it came */
  }
}
