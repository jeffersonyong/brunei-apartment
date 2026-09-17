import { describe, expect, it } from 'vitest'

import { describeAgeBand, palmVillaConfig, type DayPassAgeBand } from './config'

function band(minAge: number, maxAgeExclusive: number | null): DayPassAgeBand {
  return { id: 'band', label: 'Band', minAge, maxAgeExclusive, pricePerPerson: 0 }
}

/**
 * What the day-pass form tells a parent about which band their child is in.
 *
 * The bound that matters is the exclusive one: `maxAgeExclusive: 12` must not
 * be described as "1–12", because the adult band starts at exactly 12 and a
 * form that puts a twelve-year-old in both is a form that quotes the wrong
 * price to somebody.
 */
describe('describeAgeBand', () => {
  it('reads the exclusive upper bound as the last age in the band', () => {
    expect(describeAgeBand(band(1, 12))).toBe('Ages 1–11')
  })

  it('describes the open-ended top band by where it starts', () => {
    expect(describeAgeBand(band(12, null))).toBe('12 and over')
  })

  it('says "Under 1" rather than "Ages 0–0" for the infant band', () => {
    expect(describeAgeBand(band(0, 1))).toBe('Under 1')
  })

  it('describes any band starting at birth as "Under n"', () => {
    expect(describeAgeBand(band(0, 5))).toBe('Under 5')
  })

  it('describes a one-year band as a single age', () => {
    expect(describeAgeBand(band(3, 4))).toBe('Age 3')
  })

  it('describes an unbounded single band as covering everyone', () => {
    expect(describeAgeBand(band(0, null))).toBe('All ages')
  })

  /**
   * The seeded bands are what a customer meets on day one, and N3 records the
   * confirmed rule they encode: 1 to 11 is BND 5, 12 and above is BND 10.
   */
  it('describes the seeded bands the way N3 states them', () => {
    expect(palmVillaConfig.dayPassAgeBands.map(describeAgeBand)).toEqual([
      'Under 1',
      'Ages 1–11',
      '12 and over',
    ])
  })

  /** Every seeded band describes itself; none falls through to a blank. */
  it('leaves no band undescribed', () => {
    for (const seeded of palmVillaConfig.dayPassAgeBands) {
      expect(describeAgeBand(seeded)).not.toBe('')
    }
  })
})
