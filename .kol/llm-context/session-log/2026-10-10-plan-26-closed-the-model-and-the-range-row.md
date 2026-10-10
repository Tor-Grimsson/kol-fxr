# Session: Plan 26 closed — the model in the 3D scene, the range row

**Date:** 2026-10-10
**Agent:** kol-fxr (local, MBP)
**Summary:** The two items left open after plan 26's build, finished: a model file in the 3D scene (the Stanford Bunny, uploaded to R2), a Lighting section, filters on GL loops (ASCII on the spinning model, live), and the Modulation editor's range row. Plan 26 has nothing open.

## Changes Made

### Files Added
- `src/editor/labs/ModelSource.jsx` — the Model section: From library (R2, `.obj/.glb/.gltf/.stl`) · Upload
- R2 `kol-media/meshes/stanford-bunny.obj` — Stanford 3D Scanning Repository (Turk & Levoy 1994), free use with credit; the repo's README kept at `_tmp/2026-10-10-plan-26-verify/common-3d-test-models-README.md`

### Files Modified
- `loops/gl/PrimitiveEngine.js` — `mesh` geometry: OBJ · GLB · STL loaded, merged, normals welded when absent, centred, scaled to 1.7; repaints when it lands; key / fill / rim / ambient on the engine, `placeLights(u)` with Light orbit
- `loops/gl/catalog.js` + `primitivePresets.js` + `host.js` — Model primitive, `meshSrc/meshType` (hidden), Lighting section, the Model statue preset; host passes mesh + light
- `compose/LayerRenderer.jsx` — engine loops carry canvas + pixi stages: the GL frame copied to a read-back source, the chain drawn to an output canvas first in the DOM (export snapshots it), the GL canvas on top at opacity 0 for the orbit drag
- `shell/MenuTop.jsx` — the Effects menu reaches GL loops (no GL-engine stage on them)
- `labs/LabsParams.jsx` — generator Post-processing on the Style tab (the canvas tier); the Model section on Generate
- `params/ModulationEditor.jsx` — the range fields share the row
- `params/controlSize.js` — the label-column measure coalesced (a cancel-and-requeue never ran while the transport played)

## Current State

### Working
- Walked on `vite preview`, dark + light, 0 console errors: Model statue loads the bunny from R2, smooth-shaded; Key angle / Rim / Ambient relight it; ASCII from Post-processing sits on the spinning model, live; the range row ends inside the rail; label columns re-measure on every tab while playing.

### Known Issues
- The label-column measure runs up to 5× a second while the transport plays (a reflow each) — throttled, not free.

## Next Steps
- None from plan 26.
