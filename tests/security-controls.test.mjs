import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('schema contains durable security state and high-entropy invite code defaults', () => {
  const schema = read('prisma/schema.prisma')
  const migration = read('prisma/migrations/20260630000100_security_attempts_and_pending_credentials/migration.sql')

  assert.match(schema, /model SecurityAttempt/)
  assert.match(schema, /model PendingCredentialChange/)
  assert.match(schema, /gen_random_bytes\(8\)/)
  assert.match(migration, /CREATE TABLE "security_attempts"/)
  assert.match(migration, /CREATE TABLE "pending_credential_changes"/)
  assert.match(migration, /ALTER TABLE "circles" ALTER COLUMN "invite_code" SET DEFAULT encode\(gen_random_bytes\(8\), 'hex'\)/)
})

test('generic DB route blocks waitlist reads, relation selects, and invite-code lookup', () => {
  const route = read('app/api/db/route.ts')

  assert.match(route, /if \(table === 'waitlist'\) \{[\s\S]*operation === 'insert'[\s\S]*throw new DbRequestError\('Not allowed\.', 403\)/)
  assert.match(route, /const scalarFields: Record<DbRequest\['table'\], Set<string>>/)
  assert.match(route, /function parseSelect\(table: DbRequest\['table'\], columns\?: string\)/)
  assert.match(route, /assertAllowedColumn\(table, column, 'select column'\)/)
  assert.match(route, /buildWhere\(body\.table, body\.filters \|\| \[\]\)/)
  assert.match(route, /if \(where\.invite_code\) \{\s*throw new DbRequestError\('Not allowed\.', 403\)/)
  assert.match(route, /assertAllowedColumn\(table, column, 'select column'\)[\s\S]{0,80}select\[column\] = true/)
})

test('OTP and credential verification record failed attempts and lock out abuse', () => {
  const otp = read('lib/otp.ts')
  const auth = read('lib/auth.ts')

  assert.match(otp, /recordSecurityAttemptFailure/)
  assert.match(otp, /assertSecurityAttemptAllowed/)
  assert.match(otp, /reason: 'rate_limited'/)
  assert.match(auth, /recordSecurityAttemptFailure\('auth:credentials', email\)/)
  assert.match(auth, /assertSecurityAttemptAllowed\('auth:credentials', email\)/)
  assert.match(auth, /clearSecurityAttempts\('auth:credentials', email\)/)
})

test('signup stores pending credential changes instead of rewriting unverified passwords', () => {
  const signup = read('app/api/auth/signup/route.ts')
  const verifyEmail = read('app/api/auth/verify-email/route.ts')

  assert.match(signup, /pendingCredentialChange\.upsert/)
  assert.doesNotMatch(signup, /prisma\.user\.update/)
  assert.match(verifyEmail, /pendingCredentialChange\.findUnique/)
  assert.match(verifyEmail, /password_hash: pending\.password_hash/)
  assert.match(verifyEmail, /reason === 'rate_limited'/)
})

test('circle joins are throttled and do not return invite-code internals', () => {
  const join = read('app/api/circles/join/route.ts')
  const circlesPage = read('app/app/(app)/circles/page.tsx')

  assert.match(join, /recordSecurityAttemptFailure\('circle:join', key\)/)
  assert.match(join, /assertSecurityAttemptAllowed\('circle:join', key\)/)
  assert.match(join, /clearSecurityAttempts\('circle:join', key\)/)
  assert.match(join, /\^\[a-f0-9\]\{8,16\}\$/)
  assert.doesNotMatch(join, /invite_code: true/)
  assert.doesNotMatch(join, /created_by: true/)
  assert.match(circlesPage, /16-character invite code/)
  assert.match(circlesPage, /maxLength=\{16\}/)
})

test('Next.js is pinned to the patched 15.5 line', () => {
  const pkg = JSON.parse(read('package.json'))

  assert.equal(pkg.dependencies.next, '15.5.19')
})
