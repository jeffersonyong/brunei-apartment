import { describe, expect, test } from 'vitest'

import { palmVillaConfig } from '../config'
import { resolveDiscount } from '../discount'
import { extraLine, line, totalOf, type BookingLine } from '../lines'
import { bnd } from '../money'
import { repriceDayPassParty, repriceStayParty, type StayPartyChange } from './party-change'
import { extraPersonLine } from './stay'

/**
 * Changing a stay's party (Jason's team, 19 September 2026).
 *
 * Mandatory coverage (architecture.md §2): this moves what a guest owes. The
 * figures are worked from prd.md §8.2 by hand — BND 7 per guest above the unit
 * type's maximum, per night — rather than read back off the implementation.
 */

const THREE_BEDROOM = { name: 'Three-bedroom', maxPax: 8 }
const RATES = { paxPolicy: 'surcharge_threshold', extraPersonPerNight: bnd(7) } as const

/** Three nights in a three-bedroom as it was sold, at a rate since changed. */
const ACCOMMODATION = line('accommodation', 'Three-bedroom — 3 nights', 3, bnd(250))
const SOFA_BED = extraLine('sofa-bed', 'Sofa bed', 1, bnd(20))
const LATE = line('late_check_out', 'Late check-out — 2 hours', 2, bnd(15))

function change(overrides: Partial<StayPartyChange> = {}): StayPartyChange {
  return {
    lines: [ACCOMMODATION, SOFA_BED, LATE],
    unitType: THREE_BEDROOM,
    nights: 3,
    party: { chargeableGuests: 8, exemptGuests: 0 },
    discount: null,
    ...overrides,
  }
}

function priced(input: StayPartyChange) {
  const result = repriceStayParty(input, RATES)

  if (!result.ok) {
    throw new Error(`expected a price, got ${result.error.message}`)
  }

  return result
}

describe('repriceStayParty', () => {
  test('charges every guest above the maximum for every night of the stay', () => {
    // Two above eight, three nights: 2 × 3 × 7 = BND 42.
    const result = priced(change({ party: { chargeableGuests: 10, exemptGuests: 1 } }))

    expect(result.lines).toEqual([ACCOMMODATION, extraPersonLine(8, 2, 3, bnd(7)), SOFA_BED, LATE])
    expect(result.total).toBe(bnd(750 + 42 + 20 + 30))
  })

  test('a party still within the maximum costs nothing more', () => {
    const before = change({ party: { chargeableGuests: 4, exemptGuests: 0 } })
    const result = priced({ ...before, party: { chargeableGuests: 8, exemptGuests: 2 } })

    expect(result.lines).toEqual(before.lines)
    expect(result.total).toBe(totalOf(before.lines))
  })

  test('a smaller party drops the extra-person line it no longer owes', () => {
    const sold = [ACCOMMODATION, extraPersonLine(8, 2, 3, bnd(7)), SOFA_BED, LATE]
    const result = priced(change({ lines: sold, party: { chargeableGuests: 9, exemptGuests: 0 } }))

    expect(result.lines).toEqual([ACCOMMODATION, extraPersonLine(8, 1, 3, bnd(7)), SOFA_BED, LATE])
    expect(result.total).toBe(totalOf(sold) - bnd(21))

    expect(
      priced(change({ lines: sold, party: { chargeableGuests: 6, exemptGuests: 0 } })).lines,
    ).toEqual([ACCOMMODATION, SOFA_BED, LATE])
  })

  test('keeps every other line as it was sold — a party change is not a reprice of the nights', () => {
    // The accommodation was sold at BND 250 a night. Whatever the rate is now,
    // a guest mid-stay is not charged a new price for the nights they booked.
    const result = priced(change({ party: { chargeableGuests: 9, exemptGuests: 0 } }))

    expect(result.lines.filter((entry) => entry.type !== 'extra_person')).toEqual([
      ACCOMMODATION,
      SOFA_BED,
      LATE,
    ])
  })

  test('the extra-person line is charged at the rate in force now', () => {
    const result = repriceStayParty(change({ party: { chargeableGuests: 9, exemptGuests: 0 } }), {
      ...RATES,
      extraPersonPerNight: bnd(10),
    })

    expect(result.ok && result.lines[1]).toEqual(extraPersonLine(8, 1, 3, bnd(10)))
  })

  test('a percentage discount is taken again off the new subtotal, and stays last', () => {
    const discount = { kind: 'percent', value: 10, reason: 'Returning guest' } as const
    const sold: BookingLine[] = [ACCOMMODATION, SOFA_BED, LATE]
    const soldDiscount = resolveDiscount(totalOf(sold), discount)

    if (!soldDiscount.ok) {
      throw new Error('fixture discount did not resolve')
    }

    const result = priced(
      change({
        lines: [...sold, soldDiscount.line],
        discount,
        party: { chargeableGuests: 10, exemptGuests: 0 },
      }),
    )

    const subtotal = bnd(750 + 42 + 20 + 30)

    expect(result.lines.at(-1)?.type).toBe('discount')
    expect(result.lines.at(-1)?.amount).toBe(-Math.round(subtotal / 10))
    expect(result.total).toBe(subtotal - Math.round(subtotal / 10))
  })

  test('a fixed discount the smaller booking is no longer worth is refused, not clipped', () => {
    // Sold at BND 842 with BND 820 off; eight guests make it BND 800.
    const discount = { kind: 'amount', value: bnd(820), reason: 'Owner’s friend' } as const
    const sold = [ACCOMMODATION, extraPersonLine(8, 2, 3, bnd(7)), SOFA_BED, LATE]
    const soldDiscount = resolveDiscount(totalOf(sold), discount)

    if (!soldDiscount.ok) {
      throw new Error('fixture discount did not resolve')
    }

    const result = repriceStayParty(
      change({
        lines: [...sold, soldDiscount.line],
        discount,
        party: { chargeableGuests: 8, exemptGuests: 0 },
      }),
      RATES,
    )

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('invalid_discount')
  })

  test('refuses a party above the maximum where the maximum is a ceiling', () => {
    const result = repriceStayParty(change({ party: { chargeableGuests: 9, exemptGuests: 0 } }), {
      ...RATES,
      paxPolicy: 'hard_cap',
    })

    expect(!result.ok && result.error.code).toBe('exceeds_max_pax')
  })

  test('refuses a party with nobody counted', () => {
    const result = repriceStayParty(
      change({ party: { chargeableGuests: 0, exemptGuests: 2 } }),
      RATES,
    )

    expect(!result.ok && result.error.code).toBe('no_guests')
  })

  test('agrees with the engine for a stay priced whole', () => {
    // The fixture config's three-bedroom is the same unit type: a party
    // changed on a freshly priced booking lands where pricing it whole would.
    const unitType = palmVillaConfig.unitTypes.find((type) => type.id === 'three-bedroom')!
    const nights = 2
    const accommodation = line(
      'accommodation',
      `${unitType.name} — 2 nights`,
      nights,
      unitType.baseRatePerNight,
    )

    const result = priced({
      lines: [accommodation],
      unitType,
      nights,
      party: { chargeableGuests: unitType.maxPax + 3, exemptGuests: 0 },
      discount: null,
    })

    expect(result.total).toBe(
      nights * unitType.baseRatePerNight + 3 * nights * palmVillaConfig.extraPersonPerNight,
    )
  })
})

describe('repriceDayPassParty', () => {
  test('prices the new party whole, bundles first — two adults and a child become a family of five', () => {
    // 2A + 1C sold at the BND 20 bundle. One adult and one child more make
    // 3A + 2C: the 2 + 2 bundle (25) and an adult (10) — BND 35, so the
    // guard takes BND 15.
    const result = repriceDayPassParty({ adult: 3, child: 2 }, palmVillaConfig)

    expect(result.ok && result.total).toBe(bnd(35))
    expect(result.ok && result.headcount).toBe(5)
    expect(result.ok && result.party).toEqual({ chargeableGuests: 5, exemptGuests: 0 })
  })

  test('counts a free band in the headcount but not as a chargeable guest', () => {
    const result = repriceDayPassParty({ adult: 2, infant: 1 }, palmVillaConfig)

    expect(result.ok && result.headcount).toBe(3)
    expect(result.ok && result.party).toEqual({ chargeableGuests: 2, exemptGuests: 1 })
    expect(result.ok && result.total).toBe(bnd(20))
  })

  test('keeps the bands in the order they are configured, with their labels', () => {
    const result = repriceDayPassParty({ adult: 1, child: 1 }, palmVillaConfig)

    expect(result.ok && result.snapshot).toEqual([
      { bandId: 'child', label: 'Child', count: 1 },
      { bandId: 'adult', label: 'Adult', count: 1 },
    ])
  })

  test('refuses a pass for nobody, in words a person can act on', () => {
    const result = repriceDayPassParty({ adult: 0 }, palmVillaConfig)

    expect(result).toEqual({ ok: false, message: 'Add at least one guest.' })
  })

  test('refuses a band that is no longer offered', () => {
    const result = repriceDayPassParty({ senior: 1 }, palmVillaConfig)

    expect(result.ok).toBe(false)
  })
})
