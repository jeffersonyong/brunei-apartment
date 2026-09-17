import { describe, expect, it } from 'vitest'

import {
  formatVehicles,
  hasVehicleAnswer,
  normaliseVehicleRegistration,
  normaliseVehicleRegistrations,
  vehiclesBeyondParking,
} from './vehicle'

/**
 * These pin the one property the gate lookup depends on: two people typing the
 * same plate differently produce the same stored string. prd.md §12.5 makes
 * plate lookup the primary arrival path, and it is an equality match on an
 * indexed column — so a normalisation that lets `baa 1234` and `BAA1234` apart
 * is a guard who cannot find a booking that is right there.
 */
describe('normaliseVehicleRegistration', () => {
  it('upper-cases and trims', () => {
    expect(normaliseVehicleRegistration('  baa 1234 ')).toBe('BAA 1234')
  })

  it('collapses internal whitespace, so spacing is not part of the plate', () => {
    expect(normaliseVehicleRegistration('BAA   1234')).toBe('BAA 1234')
  })

  it('treats a blank entry as no vehicle rather than an unnamed one', () => {
    expect(normaliseVehicleRegistration('   ')).toBeNull()
    expect(normaliseVehicleRegistration('')).toBeNull()
  })
})

describe('normaliseVehicleRegistrations', () => {
  it('keeps the order they were given in', () => {
    expect(normaliseVehicleRegistrations(['bb 9', 'aa 1'])).toEqual(['BB 9', 'AA 1'])
  })

  it('drops the empty rows a repeated field leaves behind', () => {
    expect(normaliseVehicleRegistrations(['BAA1234', '', '  '])).toEqual(['BAA1234'])
  })

  it('de-duplicates after normalising, not before', () => {
    // The unique constraint on (booking, registration) would otherwise refuse
    // the whole write because one car was typed twice, two ways.
    expect(normaliseVehicleRegistrations(['baa 1234', 'BAA  1234'])).toEqual(['BAA 1234'])
  })

  it('is empty for no input', () => {
    expect(normaliseVehicleRegistrations([])).toEqual([])
  })
})

describe('hasVehicleAnswer', () => {
  it('accepts plates', () => {
    expect(hasVehicleAnswer(['BAA1234'], false)).toBe(true)
  })

  it('accepts the deliberate exception', () => {
    expect(hasVehicleAnswer([], true)).toBe(true)
  })

  it('refuses silence — the case prd.md §13 [C] does not allow', () => {
    expect(hasVehicleAnswer([], false)).toBe(false)
  })
})

describe('formatVehicles', () => {
  it('joins several onto one line', () => {
    expect(formatVehicles(['BAA1234', 'BB5678'])).toBe('BAA1234 · BB5678')
  })

  it('returns null for none, so the caller decides what absence looks like', () => {
    expect(formatVehicles([])).toBeNull()
  })
})

/**
 * The parking allowance as the forms show it (Jeff, 17 September 2026).
 *
 * Every case here is about *not* over-reporting: the empty row a form always
 * shows, the empty rows it grows by, and the same plate typed twice. A warning
 * that fires on a row nobody filled in teaches staff to ignore the warning,
 * which is worse than not having one.
 */
describe('vehiclesBeyondParking', () => {
  it('counts nothing while the plates fit the allowance', () => {
    expect(vehiclesBeyondParking(['BAA 1234', 'BAB 5678'], 2)).toBe(0)
  })

  it('counts the cars past the allowance', () => {
    expect(vehiclesBeyondParking(['BAA 1234', 'BAB 5678', 'BAC 9012'], 2)).toBe(1)
  })

  it('ignores the empty row every form starts with', () => {
    expect(vehiclesBeyondParking([''], 0)).toBe(0)
  })

  it('ignores empty rows a form has grown by', () => {
    expect(vehiclesBeyondParking(['BAA 1234', '', '  '], 1)).toBe(0)
  })

  it('counts a plate typed into two rows once, as it is stored', () => {
    expect(vehiclesBeyondParking(['BAA 1234', 'baa  1234'], 1)).toBe(0)
  })

  it('treats a unit type with no spaces as allowing none', () => {
    expect(vehiclesBeyondParking(['BAA 1234'], 0)).toBe(1)
  })

  it('never reports a negative overflow when the guest brings fewer cars', () => {
    expect(vehiclesBeyondParking([], 4)).toBe(0)
  })

  /** A nonsensical allowance is a settings problem, not a reason to crash. */
  it('reads a negative allowance as none', () => {
    expect(vehiclesBeyondParking(['BAA 1234'], -2)).toBe(1)
  })
})
