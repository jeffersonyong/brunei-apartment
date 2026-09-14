import { describe, expect, test } from 'vitest'

import { palmVillaConfig } from '../config'
import { bnd } from '../money'
import { bandForAge, partyFromAges, priceDayPass } from './day-pass'

/**
 * Day-pass pricing tests.
 *
 * The confirmed rates from prd.md §8.1 are asserted as facts, and since
 * 14 September 2026 so is how bundles combine (N4, C9). The one behaviour still
 * governed by an open question — the price under age 1, N3 — is asserted as
 * *the current provisional reading*, labelled as such, so that when Jason
 * answers, the failing test names the decision rather than a mystery
 * regression.
 */

describe('confirmed rates (prd.md §8.1 [C])', () => {
  test('an adult alone is BND 10', () => {
    const result = priceDayPass({ adult: 1 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(10))
  })

  test('a child alone is BND 5', () => {
    const result = priceDayPass({ child: 1 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(5))
  })

  test('2 adults + 1 child takes the BND 20 bundle, not BND 25 per person', () => {
    const result = priceDayPass({ adult: 2, child: 1 }, palmVillaConfig)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.total).toBe(bnd(20))
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]).toMatchObject({ type: 'day_pass_bundle', quantity: 1 })
  })

  test('2 adults + 2 children takes the BND 25 bundle, not BND 30 per person', () => {
    const result = priceDayPass({ adult: 2, child: 2 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(25))
  })
})

describe('the §8.1 [A] promise: never above the cheapest applicable combination', () => {
  test('a bundle is never applied when per-person is cheaper', () => {
    // 2 adults alone = 20 per person, which equals the 2+1 bundle price — but
    // the bundle needs a child, so it cannot apply. Guards against a bundle
    // being matched loosely.
    const result = priceDayPass({ adult: 2 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(20))
    expect(result.ok && result.lines[0]?.type).toBe('day_pass')
  })

  test('the price never exceeds straight per-person pricing, across many shapes', () => {
    const perPerson = (adults: number, children: number) => bnd(10) * adults + bnd(5) * children

    for (let adults = 0; adults <= 6; adults += 1) {
      for (let children = 0; children <= 6; children += 1) {
        if (adults + children === 0) continue

        const result = priceDayPass({ adult: adults, child: children }, palmVillaConfig)

        expect(result.ok).toBe(true)
        if (!result.ok) return

        expect(result.total).toBeLessThanOrEqual(perPerson(adults, children))
      }
    }
  })
})

describe('bundles repeat, and whoever is left over pays per person (N4, C9 [C])', () => {
  // Jason, 14 September 2026: the two bundles are the only ones, a booking
  // takes as many as it fits, and anyone beyond them pays per head.

  test("2 adults + 3 children = one 2+2 bundle plus a child (30), Jason's own example", () => {
    const result = priceDayPass({ adult: 2, child: 3 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(30))
  })

  test('4 adults + 2 children = two 2+1 bundles (40), not a bundle plus two adults (45)', () => {
    // C9 as it was put to him: the bundle applies twice.
    const result = priceDayPass({ adult: 4, child: 2 }, palmVillaConfig)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.total).toBe(bnd(40))
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]).toMatchObject({ quantity: 2, unitPrice: bnd(20) })
  })

  test('4 adults + 4 children = two 2+2 bundles (50), not per-person (60)', () => {
    const result = priceDayPass({ adult: 4, child: 4 }, palmVillaConfig)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.total).toBe(bnd(50))
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]).toMatchObject({ quantity: 2, unitPrice: bnd(25) })
  })

  test('1 adult + 2 children fits no bundle and pays per person (20)', () => {
    // Read from his rule rather than stated: every bundle needs two adults.
    const result = priceDayPass({ adult: 1, child: 2 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(20))
  })

  test('4 adults + 3 children mixes the two bundles (45)', () => {
    // One 2+2 (25) + one 2+1 (20) = 45, against 55 per person.
    const result = priceDayPass({ adult: 4, child: 3 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(45))
  })
})

describe('TODO(client) prd.md §18 N3 — provisional age bands', () => {
  test.each([
    [0, 'infant'],
    [1, 'child'],
    [11, 'child'],
    [12, 'adult'],
    [40, 'adult'],
  ])('age %i falls in the provisional %s band', (age, expected) => {
    expect(bandForAge(age, palmVillaConfig)?.id).toBe(expected)
  })

  test('bands do not overlap, so every age has exactly one band', () => {
    for (let age = 0; age <= 100; age += 1) {
      const matches = palmVillaConfig.dayPassAgeBands.filter(
        (band) =>
          age >= band.minAge && (band.maxAgeExclusive === null || age < band.maxAgeExclusive),
      )

      expect(matches).toHaveLength(1)
    }
  })

  test('under-1 is provisionally free and produces no line', () => {
    const result = priceDayPass({ infant: 2, adult: 1 }, palmVillaConfig)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.total).toBe(bnd(10))
    expect(result.lines).toHaveLength(1)
  })
})

describe('partyFromAges', () => {
  test('counts ages into bands', () => {
    expect(partyFromAges([35, 33, 8, 4, 0], palmVillaConfig)).toEqual({
      adult: 2,
      child: 2,
      infant: 1,
    })
  })

  test('a family of ages prices through the bundle', () => {
    const result = priceDayPass(partyFromAges([35, 33, 8], palmVillaConfig), palmVillaConfig)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.total).toBe(bnd(20))
  })
})

describe('validation', () => {
  test('refuses an empty party', () => {
    const result = priceDayPass({}, palmVillaConfig)

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('no_guests')
  })

  test('refuses an unknown band', () => {
    const result = priceDayPass({ teenager: 2 }, palmVillaConfig)

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('unknown_age_band')
  })

  test('refuses a negative headcount', () => {
    const result = priceDayPass({ adult: -1 }, palmVillaConfig)

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('negative_quantity')
  })
})
