// Library entry — the embeddable editor package (@kolkrabbi/design-editor): the full editor.
// The standalone app boots from main.jsx instead; this file is ONLY the npm/library surface.
//
// Since the cut (deconstruction T5, 2026-09-27) it is the core (./core.jsx) plus every layer pack
// plus the two chromes built from them. Same exports as before, so a host on the root entry
// sees no change; a host that wants less imports `@kolkrabbi/design-editor/core` and the packs
// it needs.
import './packs'
import LabsView, { LABS_DRAFT_KEY } from './editor/labs/LabsView'
import MobileView from './editor/mobile/MobileView'

export * from './core'
export { default } from './core'

/**
 * The alternate CHROMES over the same engine — exported because they are
 * built FROM the editor's internals, not on top of its component
 * (2026-09-03, found on kol-fxr's step-3 adoption: `LabsView` reaches 41
 * module paths inside the engine, `compose/state` six times over). A host
 * that kept them local got two copies of every context and
 * `useComposeState must be inside <ComposeStateProvider>` from the package's
 * own provider — a context object is identity-compared, so the second copy
 * can never satisfy the first. One package, every chrome; the host is a router.
 *
 *   LabsView    — the labs / randomiser mode: one loop under a params rail
 *   MobileView  — the touch chrome
 *
 * Both are built from the packs, so they live here and not in ./core.jsx
 * (OutputView, which needs none, moved there).
 */
export { LabsView, LABS_DRAFT_KEY, MobileView }
