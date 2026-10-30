# Point MESH_DEFAULT at kol-3d/ — R2 meshes/ moved

**Staged:** 2026-10-30 · from a kol-website session
**Change:** one line

---

## The problem, in one case
On 2026-10-30 the R2 `kol-media` folder `meshes/` was renamed to `kol-3d/`, on the user's instruction, as part of the bucket reorganisation. `src/loops/gl/catalog.js:26` still reads `https://r2.kolkrabbi.io/meshes/stanford-bunny.obj`, which now returns 404, so the GL loops' default mesh fails to load.

## The fix
`src/loops/gl/catalog.js:26`: `MESH_DEFAULT = 'https://r2.kolkrabbi.io/kol-3d/stanford-bunny.obj'`. Then grep `docs/documentation/06-camera-motion/` for `meshes/` and update the docs the same way.

## Rejected alternative
Keeping a copy at `meshes/`. The user asked for the folder to be renamed, not duplicated.

## Definition of done
- [ ] the default mesh loads from `kol-3d/` (network 200)
- [ ] no `r2.kolkrabbi.io/meshes/` left in `src/` or `docs/`

---

## Resolution — 2026-10-30
`src/loops/gl/catalog.js:26` now reads `https://r2.kolkrabbi.io/kol-3d/stanford-bunny.obj` (HEAD 200). Grep: no `r2.kolkrabbi.io/meshes/` left in `src/` or `docs/`.
