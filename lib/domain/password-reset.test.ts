import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import {
  buildPasswordResetEmail,
  isRecoveryTokenHash,
  RESET_LINK_LIFETIME_MINUTES,
  resetPasswordUrl,
  tokenFromFragment,
} from './password-reset'

/**
 * Staff resetting their own password from an emailed link (capability F8).
 *
 * The rules worth pinning are about where the credential goes. The token rides
 * in the link's fragment, which a browser never sends to a server, so it cannot
 * land in an access log; and only the exact shape the auth server issues is
 * read back out of it, so nothing else reaches `verifyOtp`.
 */

/** The shape GoTrue issues: a sha224 in lowercase hex. */
const HASH = 'a'.repeat(28) + '0123456789abcdef0123456789ab'

describe('resetPasswordUrl', () => {
  test('carries the token in the fragment, never the query string', () => {
    const url = resetPasswordUrl('https://palmvilla.test', HASH)

    expect(url).toBe(`https://palmvilla.test/reset-password#token=${HASH}`)
    expect(new URL(url).search).toBe('')
  })
})

describe('isRecoveryTokenHash', () => {
  test('accepts the shape the auth server issues', () => {
    expect(HASH).toHaveLength(56)
    expect(isRecoveryTokenHash(HASH)).toBe(true)
  })

  test('refuses anything else', () => {
    expect(isRecoveryTokenHash('')).toBe(false)
    expect(isRecoveryTokenHash(HASH.slice(1))).toBe(false)
    expect(isRecoveryTokenHash(`${HASH}a`)).toBe(false)
    expect(isRecoveryTokenHash(HASH.toUpperCase())).toBe(false)
    expect(isRecoveryTokenHash(`${HASH.slice(1)}g`)).toBe(false)
  })
})

describe('tokenFromFragment', () => {
  test('reads the token from the fragment, with or without its hash sign', () => {
    expect(tokenFromFragment(`#token=${HASH}`)).toBe(HASH)
    expect(tokenFromFragment(`token=${HASH}`)).toBe(HASH)
    expect(tokenFromFragment(`#from=email&token=${HASH}`)).toBe(HASH)
  })

  test('is null for a fragment carrying no token of the right shape', () => {
    expect(tokenFromFragment('')).toBeNull()
    expect(tokenFromFragment('#')).toBeNull()
    expect(tokenFromFragment('#token=')).toBeNull()
    expect(tokenFromFragment('#token=not-a-token')).toBeNull()
  })
})

describe('buildPasswordResetEmail', () => {
  const email = buildPasswordResetEmail({
    email: 'mary@example.com',
    resetUrl: resetPasswordUrl('https://palmvilla.test', HASH),
  })

  test('names the account the reset is for', () => {
    expect(email.intro).toContain('mary@example.com')
  })

  test('points its one action at the link', () => {
    expect(email.action.url).toBe(`https://palmvilla.test/reset-password#token=${HASH}`)
  })

  test('says the link works once, for an hour, and that a newer one cancels it', () => {
    expect(email.action.note).toContain('once')
    expect(email.action.note).toContain('an hour')
    expect(email.action.note).toContain('cancels')
  })

  test('tells somebody who did not ask that nothing has changed', () => {
    expect(email.notes.join(' ')).toContain('has not changed')
  })
})

describe('RESET_LINK_LIFETIME_MINUTES', () => {
  test("is the auth server's own expiry in supabase/config.toml, since the email promises it", () => {
    const config = readFileSync(
      fileURLToPath(new URL('../../supabase/config.toml', import.meta.url)),
      'utf8',
    )
    const seconds = /^otp_expiry\s*=\s*(\d+)/m.exec(config)?.[1]

    expect(seconds, 'otp_expiry is missing from config.toml').toBeDefined()
    expect(Number(seconds) / 60).toBe(RESET_LINK_LIFETIME_MINUTES)
  })
})
