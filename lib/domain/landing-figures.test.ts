import { describe, expect, test } from 'vitest'

import { landingFiguresFrom } from './landing-figures'
import type { PropertySettings } from './settings'

/**
 * The front page's figures against what Property settings holds.
 *
 * What these guard is drift: every number on the landing page used to be typed
 * into the content module, so changing a rate in the portal left the front page
 * advertising the old one. The cases below are the ones that used to be wrong
 * on the page — a type nobody can book, a free infant band, and staff emptying
 * a list the copy assumed was never empty.
 */
const SETTINGS: PropertySettings = {
  propertyId: 'property-1',
  name: 'Palm Villa',
  timeZone: 'Asia/Brunei',
  currency: 'BND',
  settingsUpdatedAt: '2026-09-17T00:00:00.000Z',
  policy: {
    paxPolicy: 'surcharge_threshold',
    extraPersonPerNightCents: 700,
    paxExemptAgeMax: 3,
    earlyCheckInPerHourCents: 0,
    lateCheckOutPerHourCents: 1000,
    checkInTime: '15:00',
    checkOutTime: '12:00',
    securityDepositCents: 10000,
    maxAdvanceBookingDays: 60,
  },
  extras: [
    {
      id: 'e1',
      slug: 'sofa-bed',
      name: 'Sofa bed',
      description: 'Includes one pillow and one blanket.',
      fee: 1500,
      stock: null,
      bookable: true,
      sortOrder: 1,
      retiredAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  unitTypes: [
    {
      id: '1',
      slug: 'two-bedroom',
      name: '2-bedroom',
      baseRateCents: 18000,
      maxPax: 6,
      carParks: 1,
    },
    {
      id: '2',
      slug: 'three-bedroom',
      name: '3-bedroom',
      baseRateCents: 20000,
      maxPax: 8,
      carParks: 2,
    },
  ],
  bands: [
    { id: 'a', label: 'Adult', minAge: 12, maxAgeExclusive: null, priceCents: 500 },
    { id: 'i', label: 'Infant', minAge: 0, maxAgeExclusive: 1, priceCents: 0 },
  ],
  bundles: [
    { id: 'b1', label: '2 adults + 1 child', priceCents: 2000, sortOrder: 0, lines: [] },
    { id: 'b2', label: '2 adults + 2 children', priceCents: 2500, sortOrder: 1, lines: [] },
  ],
  facilities: [
    {
      id: 'f1',
      slug: 'swimming-pool',
      name: 'Swimming pool',
      includedInDayPass: true,
      dayPassCapacity: null,
      shownOnSite: true,
      sortOrder: 0,
    },
    {
      id: 'f2',
      slug: 'bbq-area',
      name: 'BBQ area',
      includedInDayPass: false,
      dayPassCapacity: null,
      shownOnSite: true,
      sortOrder: 1,
    },
  ],
  retention: [],
  bankAccounts: [],
}

const BOTH_SELLABLE = new Set(['two-bedroom', 'three-bedroom'])

describe('the front page figures', () => {
  test('a unit type with no units is never advertised', () => {
    // Arrange
    const sellable = new Set(['three-bedroom'])

    // Act
    const figures = landingFiguresFrom(SETTINGS, sellable)

    // Assert
    expect(figures.unitTypes.map((type) => type.slug)).toEqual(['three-bedroom'])
  })

  test('the "from" rate is the cheapest type a guest can actually book', () => {
    // Arrange
    const sellable = new Set(['three-bedroom'])

    // Act & Assert — not the 2-bedroom's BND 180, which nobody can book
    expect(landingFiguresFrom(SETTINGS, sellable).fromNightlyRate).toBe('BND 200')
    expect(landingFiguresFrom(SETTINGS, BOTH_SELLABLE).fromNightlyRate).toBe('BND 180')
  })

  test('nothing sellable quotes no rate rather than a wrong one', () => {
    // Act
    const figures = landingFiguresFrom(SETTINGS, new Set())

    // Assert
    expect(figures.fromNightlyRate).toBeNull()
    expect(figures.unitTypes).toEqual([])
  })

  test('rates are quoted in whole BND, the way marketing copy reads', () => {
    // Act
    const figures = landingFiguresFrom(SETTINGS, BOTH_SELLABLE)

    // Assert
    expect(figures.unitTypes[0]?.fromRate).toBe('BND 180')
  })

  test('an odd rate keeps its cents', () => {
    // Arrange
    const [, threeBedroom] = SETTINGS.unitTypes
    const settings = { ...SETTINGS, unitTypes: [{ ...threeBedroom!, baseRateCents: 20550 }] }

    // Act & Assert
    expect(landingFiguresFrom(settings, BOTH_SELLABLE).unitTypes[0]?.fromRate).toBe('BND 205.50')
  })

  test('the free infant band is not the price the day pass starts at', () => {
    // Act
    const figures = landingFiguresFrom(SETTINGS, BOTH_SELLABLE)

    // Assert
    expect(figures.dayPassLine).toBe('From BND 5 per person · family bundles from BND 20')
  })

  test('the bundle clause disappears when staff delete every bundle', () => {
    // Arrange
    const settings = { ...SETTINGS, bundles: [] }

    // Act & Assert
    expect(landingFiguresFrom(settings, BOTH_SELLABLE).dayPassLine).toBe('From BND 5 per person')
  })

  test('the deposit and the booking window come from the policy', () => {
    // Act
    const figures = landingFiguresFrom(SETTINGS, BOTH_SELLABLE)

    // Assert
    expect(figures.stayFinePrint).toBe(
      'BND 100 refundable security deposit · bookings open up to 60 days ahead.',
    )
  })

  test('the day pass lists what it admits, and never what it does not', () => {
    // Act
    const figures = landingFiguresFrom(SETTINGS, BOTH_SELLABLE)

    // Assert
    expect(figures.dayPassIncluded).toEqual([{ slug: 'swimming-pool', name: 'Swimming pool' }])
  })

  /**
   * The tick in Property settings is the whole rule. A facility the client has
   * not settled is seeded un-ticked, so the front page advertises it the day
   * somebody ticks it and not a moment before.
   */
  test('a facility ticked into the day pass joins the list', () => {
    // Arrange
    const withBbq = {
      ...SETTINGS,
      facilities: SETTINGS.facilities.map((facility) => ({
        ...facility,
        includedInDayPass: true,
      })),
    }

    // Act
    const figures = landingFiguresFrom(withBbq, BOTH_SELLABLE)

    // Assert
    expect(figures.dayPassIncluded.map((facility) => facility.name)).toEqual([
      'Swimming pool',
      'BBQ area',
    ])
  })

  /**
   * The Photos tab's switch hides a card and nothing else: the facility is
   * still admitted, so it stays off this list only, not off /day-pass.
   */
  test('a facility switched off on the Photos tab loses its card', () => {
    // Arrange
    const poolHidden = {
      ...SETTINGS,
      facilities: SETTINGS.facilities.map((facility) => ({
        ...facility,
        includedInDayPass: true,
        shownOnSite: facility.slug !== 'swimming-pool',
      })),
    }

    // Act
    const figures = landingFiguresFrom(poolHidden, BOTH_SELLABLE)

    // Assert
    expect(figures.dayPassIncluded.map((facility) => facility.name)).toEqual(['BBQ area'])
  })

  test('a day pass admitting nothing lists nothing, rather than every facility', () => {
    // Arrange
    const noneIncluded = {
      ...SETTINGS,
      facilities: SETTINGS.facilities.map((facility) => ({
        ...facility,
        includedInDayPass: false,
      })),
    }

    // Act
    const figures = landingFiguresFrom(noneIncluded, BOTH_SELLABLE)

    // Assert
    expect(figures.dayPassIncluded).toEqual([])
  })
})
