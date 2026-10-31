// node src/loops/math/pendulum.check.mjs — the pendulum wave's maths (plan 51 1.1)
import { orderParam } from './pendulum.js'
const TAU = Math.PI * 2
const phases = (N, n0, u) => Array.from({ length: N }, (_, k) => { const c = (n0 + k) * u; return TAU * (c - Math.floor(c)) })
const groups = (ph) => { const reps = []; for (const f of ph) if (!reps.some((r) => { const d = Math.abs(r - f) % TAU; return Math.min(d, TAU - d) < 0.0087 })) reps.push(f); return reps.length }
let fail = 0
const ok = (c, m) => { if (!c) { fail++; console.error('✗', m) } }
const N = 100, n0 = 30
ok(phases(N, n0, 0).every((f, k) => Math.abs(f - phases(N, n0, 1)[k]) < 1e-9 || Math.abs(Math.abs(f - phases(N, n0, 1)[k]) - TAU) < 1e-9), 'u = 0 and u = 1 identical')
for (const q of [2, 3, 5]) ok(groups(phases(N, n0, 1 / q)) === q, `u = 1/${q} → ${q} groups (got ${groups(phases(N, n0, 1 / q))})`)
ok(Math.abs(orderParam(N, n0, 0) - 1) < 1e-9, 'R(0) = 1')
ok(Math.abs(orderParam(N, n0, 0.5)) < 0.02, `R(1/2) ≈ 0 (got ${orderParam(N, n0, 0.5).toFixed(3)})`)
if (fail) process.exit(1)
console.log('pendulum ok — seamless, 2·3·5 groups, R(0)=1')
