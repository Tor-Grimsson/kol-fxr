// Modulator — the kol-modulator port (plan 02-labs-mobile-and-vector step 2).
// One base loop (warped concentric rings, breath + drift); presets are param
// looks over it, in two authored categories per the hierarchy law.

import rings from './rings.js'

export const MODULATOR_LOOPS = [rings]

const P = (id, label, loop, params = {}, sub) => ({ id, label, loop, params, sub })

export const MODULATOR_PRESETS = [
  // Pulse — breath-led
  P('mod-pulse', 'Pulse', 'modulator-rings', {}, 'Pulse'),
  P('mod-pulse-deep', 'Pulse · deep', 'modulator-rings', { breathAmp: 25, separation: 24, rings: 4 }, 'Pulse'),
  P('mod-pulse-soft', 'Pulse · soft', 'modulator-rings', { intensity: 80, breathAmp: 6, rings: 2, weight: 3 }, 'Pulse'),
  // Weave — frequency-led
  P('mod-weave', 'Weave', 'modulator-rings', { frequency: 180, intensity: 120, rings: 5, separation: 8 }, 'Weave'),
  P('mod-weave-fine', 'Weave · fine', 'modulator-rings', { frequency: 200, intensity: 60, rings: 8, separation: 5, weight: 1 }, 'Weave'),
  P('mod-weave-drift', 'Weave · drift', 'modulator-rings', { drift: 4, frequency: 140, rings: 3 }, 'Weave'),
]
