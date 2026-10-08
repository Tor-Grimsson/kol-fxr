/**
 * mergeRemote — reconcile the local library with the rows a hydrate returned (plan 07).
 *
 * Newest `updatedAt ?? savedAt` wins, both ways. A remote tombstone drops a local row only when
 * the tombstone is newer. Whatever local has that remote lacks, or has older, goes back up — so
 * a machine that saved offline reconciles on its next sign-in. Pure, so it has a check beside it.
 *
 * @param {Object} local   { preset: [...], palette: [...], pattern: [...], type: [...] }
 * @param {Array}  rows    [{ id, kind, name, spec, updatedAt, deleted }]
 * @returns {{ next, pushes }}  next = the merged library · pushes = [{ op:'put', kind, item }] to send up
 */
const stamp = (it) => it?.updatedAt ?? it?.savedAt ?? 0

export function mergeRemote(local, rows) {
  const next = {}
  const pushes = []
  const byKind = new Map()
  for (const r of rows || []) {
    if (!byKind.has(r.kind)) byKind.set(r.kind, new Map())
    byKind.get(r.kind).set(r.id, r)
  }
  const kinds = new Set([...Object.keys(local || {}), ...byKind.keys()])
  for (const kind of kinds) {
    const remote = byKind.get(kind) ?? new Map()
    const out = []
    for (const it of local?.[kind] ?? []) {
      const r = remote.get(it.id)
      if (!r) { out.push(it); pushes.push({ op: 'put', kind, item: it }); continue }
      if (r.deleted) { if (r.updatedAt > stamp(it)) continue; out.push(it); pushes.push({ op: 'put', kind, item: it }); continue }
      if (r.updatedAt > stamp(it)) out.push(r.spec)
      else { out.push(it); if (r.updatedAt < stamp(it)) pushes.push({ op: 'put', kind, item: it }) }
    }
    const seen = new Set(out.map((it) => it.id))
    for (const r of remote.values()) if (!r.deleted && !seen.has(r.id)) out.push(r.spec)
    next[kind] = out
  }
  return { next, pushes }
}
