/* path-math — RE-EXPORTED from @kolkrabbi/kol-component since 2026-09-03
 * (editor-panels-the-held-specs B2). The geometry moved to the DS with
 * `PathNodeOverlay` so the overlay and this engine share one implementation;
 * nothing here computes anything. Peer floor: kol-component >= 0.197.0. */
export {
  pathD, pathBounds, shiftNode, normalizePath, scalePathNodes, normalizePathRings,
  rotatePathNodes, dist, nearestSegmentT, splitSegment, smoothNode,
} from '@kolkrabbi/kol-component'
