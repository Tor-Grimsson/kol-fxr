/* The one list of globals the expression compilers shadow (audit G3, 2026-10-09 — `editor/params/
 * expr.js` and `loops/math/mathfn.js` each carried this verbatim, with the same ponytail note).
 *
 * Dangerous globals shadowed as never-passed parameters (bound to undefined) so an expression
 * string — possibly arriving in a loaded / shared settings .json — can't reach the network, DOM,
 * or storage. `eval` and `import` are reserved words in strict code and cannot be shadowed; the
 * Math scope each PRELUDE exposes stays intact.
 *
 * ponytail: scope-shadowing, not a real sandbox (constructor chains still escape); upgrade path =
 * SES / worker isolation — one place to do it now. */
export const SHADOWED_GLOBALS = [
  'globalThis', 'window', 'self', 'document', 'fetch', 'XMLHttpRequest',
  'localStorage', 'sessionStorage', 'indexedDB', 'navigator', 'location',
  'top', 'parent', 'frames', 'opener', 'Function', 'WebSocket', 'Worker',
  'importScripts',
]
