// invite — mint one sign-up link straight into D1 (plan 43 § 2.4). The first account has no one to invite it, so this is
// how it starts; after that, a signed-in user mints links from /account. `pnpm api:invite` (remote) · `pnpm api:invite:local`.
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
const local = process.argv.includes('--local')
const token = randomBytes(18).toString('base64url')
const now = Date.now()
const sql = `INSERT INTO invites (token, created_at, expires_at) VALUES ('${token}', ${now}, ${now + 7 * 24 * 60 * 60 * 1000});`
execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', 'kol-fxr', local ? '--local' : '--remote', '--command', sql, '--config', 'api/wrangler.toml'], { stdio: 'inherit' })
const origin = local ? 'http://localhost:5173' : 'https://fxr.kolkrabbi.io'
console.log(`\n${origin}/join?invite=${token}\n(one use, 7 days)`)
