/**
 * mediaPick — a file picked from the rail's Media library (plan 15 § 4) on its way to a chrome.
 *
 * The rail is the shell's; the layer it becomes is a chrome's. A pick is PUBLISHED here: a mounted
 * chrome takes it at once (labs → the photo layer on the stage, the editor → a new photo layer), and
 * a chrome that mounts after (the pick was made on a shell page, which then navigates to the editor)
 * takes the one PENDING. Module state, in the idiom of `railExtras` and `morphStore`.
 */
let pending = null
const subs = new Set()

/** `{ url, srcType }` — `url` already proxied, `srcType` 'image' | 'video' */
export function pickMedia(detail) {
  pending = detail
  subs.forEach((cb) => cb(detail))
}
/** the pick nobody took yet, once */
export function takeMediaPick() { const p = pending; pending = null; return p }
export function onMediaPick(cb) { subs.add(cb); return () => subs.delete(cb) }
/** a chrome's one call: the pending pick now, every later pick as it lands; `apply` must be stable */
export function consumeMediaPicks(apply) {
  const p = takeMediaPick(); if (p) apply(p)
  return onMediaPick((d) => { pending = null; apply(d) })
}
