// node src/filters/sweeps.check.mjs — every sweep shape × travel closes at u = 1, and the origin moves the band (plan 26 § 5)
const m = await import('./sweeps.js')
for (const travel of ['forward', 'reverse', 'pingpong']) for (const shape of ['linear', 'radial', 'wave', 'angular', 'noise']) {
  const sw = m.makeSweep(shape, { travel, speed: 2, cx: 0.3, cy: 0.7 })
  const a = m.evalSweeps(m.sweepStates({ sweeps: [sw] }, 0), 0.4, 0.6).bright
  const b = m.evalSweeps(m.sweepStates({ sweeps: [sw] }, 1), 0.4, 0.6).bright
  if (Math.abs(a - b) > 1e-9) throw new Error(`seam: ${shape}/${travel} ${a} vs ${b}`)
}
const f = m.evalSweeps(m.sweepStates({ sweeps: [m.makeSweep('radial', { cx: 0.2, cy: 0.2, width: 0.2 })] }, 0), 0.2, 0.2).bright
const g = m.evalSweeps(m.sweepStates({ sweeps: [m.makeSweep('radial', { cx: 0.2, cy: 0.2, width: 0.2 })] }, 0), 0.8, 0.8).bright
if (!(f > g)) throw new Error('origin: radial band should sit at its origin at u=0')
console.log('sweeps ok')
