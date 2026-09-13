import { describe, expect, test } from 'vitest'

import { MIN_PASSWORD_LENGTH } from './password-policy'
import { generateTempPassword } from './temp-password'

describe('generateTempPassword', () => {
  test('produces the xxxx-xxxx-xxxx handover shape', () => {
    const password = generateTempPassword()

    expect(password).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)
  })

  test('never contains look-alike characters', () => {
    // i/l/1 and o/0 are indistinguishable when read out loud or handwritten;
    // a temp password exists to be relayed, so they are excluded.
    for (let round = 0; round < 50; round += 1) {
      expect(generateTempPassword()).not.toMatch(/[ilo01]/)
    }
  })

  test('clears the minimum password length', () => {
    // The separators count toward it, as the auth server counts every character.
    expect(generateTempPassword().length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH)
  })

  test('two passwords differ', () => {
    // Not a randomness proof — a regression trip-wire for a frozen source.
    expect(generateTempPassword()).not.toBe(generateTempPassword())
  })
})
