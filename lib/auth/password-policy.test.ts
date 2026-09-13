import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { MIN_PASSWORD_LENGTH } from './password-policy'

/**
 * The app checks a new password's length before the auth server does, so a
 * staff member gets a sentence beside the field rather than GoTrue's error —
 * and the two checks are only both honest while they agree. GoTrue's number
 * lives in supabase/config.toml, so this reads it instead of trusting a comment
 * saying "mirrors" to stay true.
 */
describe('MIN_PASSWORD_LENGTH', () => {
  test("matches the auth server's minimum in supabase/config.toml", () => {
    const config = readFileSync(
      fileURLToPath(new URL('../../supabase/config.toml', import.meta.url)),
      'utf8',
    )
    const configured = /^minimum_password_length\s*=\s*(\d+)/m.exec(config)?.[1]

    expect(configured, 'minimum_password_length is missing from config.toml').toBeDefined()
    expect(Number(configured)).toBe(MIN_PASSWORD_LENGTH)
  })

  test('is eight characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
  })
})
