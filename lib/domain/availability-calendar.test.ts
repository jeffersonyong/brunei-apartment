import { describe, expect, test } from 'vitest'

import {
  firstBlockedNight,
  freeOn,
  nightlyExtraUse,
  nightlyFreeCounts,
  occupiesUnit,
  peakExtraUse,
  publicBookingWindow,
  unitsByType,
  type CalendarOccupancyRange,
  type CalendarUnit,
  type ExtraHolding,
} from './availability-calendar'

/**
 * The count behind the public calendar (capability A1).
 *
 * What these tests are really protecting is agreement with the exclusion
 * constraint. Every case below has a mirror in the database — the same status
 * rule, the same half-open nights, the same treatment of a lease with no end —
 * and a night drawn as free that the constraint then refuses is the one
 * failure a customer experiences as the site lying to them.
 */

const WINDOW = { start: '2026-09-10', end: '2026-09-15' }

function units(overrides: Partial<CalendarUnit>[] = []): CalendarUnit[] {
  const base: CalendarUnit[] = [
    { id: 'u1', unitTypeSlug: 'three-bedroom', serviceable: true },
    { id: 'u2', unitTypeSlug: 'three-bedroom', serviceable: true },
    { id: 'u3', unitTypeSlug: 'four-bedroom', serviceable: true },
  ]

  return overrides.length === 0
    ? base
    : base.map((unit, index) => ({ ...unit, ...(overrides[index] ?? {}) }))
}

function occupancy(overrides: Partial<CalendarOccupancyRange> = {}): CalendarOccupancyRange {
  return {
    unitId: 'u1',
    start: '2026-09-11',
    end: '2026-09-13',
    status: 'confirmed',
    ...overrides,
  }
}

describe('which statuses hold a unit', () => {
  test.each([
    ['held', true],
    ['awaiting_payment_verification', true],
    ['confirmed', true],
    ['checked_in', true],
    ['completed', true],
    ['leased', true],
    ['draft', true],
    ['expired', false],
    ['cancelled', false],
    // A guest who never came releases the rest of their nights (prd.md §9.5).
    ['no_show', false],
  ])('%s occupies the unit: %s', (status, expected) => {
    expect(occupiesUnit(status)).toBe(expected)
  })

  test('a held night is taken, which is the whole point of the public flow', () => {
    // A public booking is created `held` and nothing expires it (N7). If this
    // read called a held night free, two customers would be quoted the same
    // room and the second would be refused after filling in the form.
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [occupancy({ status: 'held' })],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(1)
  })
})

describe('counting free units per night', () => {
  test('an empty building offers every unit on every night', () => {
    const counts = nightlyFreeCounts({ window: WINDOW, units: units(), occupancies: [] })

    expect(freeOn(counts, '2026-09-10', 'three-bedroom')).toBe(2)
    expect(freeOn(counts, '2026-09-14', 'four-bedroom')).toBe(1)
  })

  test('a stay takes its nights and leaves the check-out day free', () => {
    // Half-open, exactly as `daterange(start, end, '[)')` is: [11, 13) takes
    // the 11th and the 12th, and the 13th is available for the next guest.
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [occupancy({ start: '2026-09-11', end: '2026-09-13' })],
    })

    expect(freeOn(counts, '2026-09-10', 'three-bedroom')).toBe(2)
    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(1)
    expect(freeOn(counts, '2026-09-12', 'three-bedroom')).toBe(1)
    expect(freeOn(counts, '2026-09-13', 'three-bedroom')).toBe(2)
  })

  test('an expired or cancelled booking releases its nights', () => {
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [
        occupancy({ status: 'cancelled' }),
        occupancy({ unitId: 'u2', status: 'expired' }),
      ],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(2)
  })

  test('a lease with no end date occupies every night from its start', () => {
    // N19: `daterange(start, null)` is unbounded above, and a plain
    // `end > night` comparison is null rather than true for such a row — the
    // trap that made available_units() report a leased unit as free once.
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [occupancy({ start: '2026-09-12', end: null, status: 'leased' })],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(2)
    expect(freeOn(counts, '2026-09-12', 'three-bedroom')).toBe(1)
    expect(freeOn(counts, '2026-09-14', 'three-bedroom')).toBe(1)
  })

  test('a unit out of service is in neither figure', () => {
    // Not free and not taken: it is not inventory at all. That differs from the
    // occupancy report, which keeps it in the denominator so a building that
    // broke down does not read as fuller than one that did not.
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units([{}, { serviceable: false }]),
      occupancies: [],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(1)
  })

  test('an occupancy stretching past both ends of the window is clipped, not dropped', () => {
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [occupancy({ start: '2026-08-01', end: '2026-10-01' })],
    })

    expect(freeOn(counts, '2026-09-10', 'three-bedroom')).toBe(1)
    expect(freeOn(counts, '2026-09-14', 'three-bedroom')).toBe(1)
  })

  test('an occupancy that misses the window entirely changes nothing', () => {
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units(),
      occupancies: [occupancy({ start: '2026-08-01', end: '2026-08-05' })],
    })

    expect(freeOn(counts, '2026-09-10', 'three-bedroom')).toBe(2)
  })

  test('an occupancy on a unit nobody counts is ignored', () => {
    // A stay on an out-of-service unit — the completed booking that was in the
    // room before it broke. Counting it would take a free night off a type
    // whose figure never included that unit in the first place.
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: units([{}, { serviceable: false }]),
      occupancies: [occupancy({ unitId: 'u2' })],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(1)
  })

  test('never reports a negative count', () => {
    const counts = nightlyFreeCounts({
      window: WINDOW,
      units: [{ id: 'u1', unitTypeSlug: 'three-bedroom', serviceable: true }],
      occupancies: [occupancy(), occupancy({ unitId: 'u1' })],
    })

    expect(freeOn(counts, '2026-09-11', 'three-bedroom')).toBe(0)
  })

  test('a type with no units is absent rather than zero-filled', () => {
    const counts = nightlyFreeCounts({ window: WINDOW, units: units(), occupancies: [] })

    // The 2-bedroom type exists in config and has no units until N1 is
    // answered. `freeOn` answers zero for it, which is what the screen needs.
    expect(freeOn(counts, '2026-09-11', 'two-bedroom')).toBe(0)
  })
})

describe('unitsByType', () => {
  test('counts serviceable units only', () => {
    expect(unitsByType(units([{}, { serviceable: false }]))).toEqual(
      new Map([
        ['three-bedroom', 1],
        ['four-bedroom', 1],
      ]),
    )
  })
})

describe('the first night that blocks a range', () => {
  const counts = nightlyFreeCounts({
    window: WINDOW,
    units: [{ id: 'u1', unitTypeSlug: 'three-bedroom', serviceable: true }],
    occupancies: [occupancy({ start: '2026-09-12', end: '2026-09-13' })],
  })

  test('names the night, so the screen can say which one', () => {
    expect(
      firstBlockedNight({ start: '2026-09-10', end: '2026-09-14' }, 'three-bedroom', counts),
    ).toBe('2026-09-12')
  })

  test('is null when every night has something free', () => {
    expect(
      firstBlockedNight({ start: '2026-09-10', end: '2026-09-12' }, 'three-bedroom', counts),
    ).toBeNull()
  })

  test('ignores the check-out day, which nobody sleeps in', () => {
    // A stay ending on the 12th does not need the 12th.
    expect(
      firstBlockedNight({ start: '2026-09-10', end: '2026-09-12' }, 'three-bedroom', counts),
    ).toBeNull()
  })

  test('is null for a range with no nights in it', () => {
    expect(
      firstBlockedNight({ start: '2026-09-12', end: '2026-09-12' }, 'three-bedroom', counts),
    ).toBeNull()
  })
})

describe('the window a public calendar may show', () => {
  test('runs from today to one day past the furthest bookable night', () => {
    // 62 days is the seeded advance window (prd.md §9.1 [C], two months). The
    // window is half-open, so the end is the day after the last night anybody
    // can book — a guest booking to the edge checks out on it.
    expect(publicBookingWindow('2026-09-10', 62)).toEqual({
      start: '2026-09-10',
      end: '2026-11-12',
    })
  })

  test('always offers at least tonight, even on a nonsense setting', () => {
    expect(publicBookingWindow('2026-09-10', 0)).toEqual({
      start: '2026-09-10',
      end: '2026-09-12',
    })
  })
})

/**
 * The extras a booking holds, per night (capability F13).
 *
 * The browser's copy of `extras_in_use`. These tests pin the two things that
 * make it agree with the database: the same half-open boundary a unit uses, so
 * back-to-back stays do not compete for the same sofa bed, and the same list of
 * statuses that release one.
 */
describe('nightlyExtraUse', () => {
  const window = { start: '2026-11-01', end: '2026-11-08' }

  function holding(overrides: Partial<ExtraHolding> = {}): ExtraHolding {
    return {
      extraId: 'sofa-bed',
      quantity: 1,
      start: '2026-11-02',
      end: '2026-11-04',
      status: 'confirmed',
      ...overrides,
    }
  }

  function on(nightly: ReadonlyMap<string, ReadonlyMap<string, number>>, night: string): number {
    return nightly.get(night)?.get('sofa-bed') ?? 0
  }

  test('holds an extra on every night of the stay but the last date', () => {
    const nightly = nightlyExtraUse({ window, holdings: [holding()] })

    expect(on(nightly, '2026-11-01')).toBe(0)
    expect(on(nightly, '2026-11-02')).toBe(1)
    expect(on(nightly, '2026-11-03')).toBe(1)
    // Half-open: the guest leaves on the 4th, so the bed is free that night.
    expect(on(nightly, '2026-11-04')).toBe(0)
  })

  test('back-to-back stays never compete for the same one', () => {
    const nightly = nightlyExtraUse({
      window,
      holdings: [
        holding({ start: '2026-11-02', end: '2026-11-04' }),
        holding({ start: '2026-11-04', end: '2026-11-06' }),
      ],
    })

    expect(on(nightly, '2026-11-03')).toBe(1)
    expect(on(nightly, '2026-11-04')).toBe(1)
    expect(on(nightly, '2026-11-05')).toBe(1)
  })

  test('adds up what overlapping stays hold on the same night', () => {
    const nightly = nightlyExtraUse({
      window,
      holdings: [
        holding({ quantity: 2, start: '2026-11-02', end: '2026-11-05' }),
        holding({ quantity: 1, start: '2026-11-03', end: '2026-11-06' }),
      ],
    })

    expect(on(nightly, '2026-11-02')).toBe(2)
    expect(on(nightly, '2026-11-03')).toBe(3)
    expect(on(nightly, '2026-11-05')).toBe(1)
  })

  test.each(['expired', 'cancelled', 'no_show'])('%s releases what it held', (status) => {
    const nightly = nightlyExtraUse({ window, holdings: [holding({ status })] })

    expect(on(nightly, '2026-11-02')).toBe(0)
  })

  test('a guest who has checked out early still holds it, exactly as they hold the unit', () => {
    // One booking never holds a room but not the bed in it. Changing this
    // would give two different answers about the same night.
    const nightly = nightlyExtraUse({ window, holdings: [holding({ status: 'completed' })] })

    expect(on(nightly, '2026-11-02')).toBe(1)
  })

  test('clips an open-ended lease to the window rather than running past it', () => {
    const nightly = nightlyExtraUse({
      window,
      holdings: [holding({ start: '2026-10-01', end: null })],
    })

    expect(on(nightly, '2026-11-01')).toBe(1)
    expect(on(nightly, '2026-11-07')).toBe(1)
  })

  test('ignores a stay that misses the window entirely', () => {
    const nightly = nightlyExtraUse({
      window,
      holdings: [holding({ start: '2026-12-01', end: '2026-12-03' })],
    })

    expect(nightly.size).toBe(0)
  })
})

describe('peakExtraUse', () => {
  const nightly = nightlyExtraUse({
    window: { start: '2026-11-01', end: '2026-11-08' },
    holdings: [
      {
        extraId: 'sofa-bed',
        quantity: 3,
        start: '2026-11-03',
        end: '2026-11-04',
        status: 'confirmed',
      },
      {
        extraId: 'sofa-bed',
        quantity: 1,
        start: '2026-11-01',
        end: '2026-11-07',
        status: 'confirmed',
      },
    ],
  })

  test('is the busiest night of the range, not the average or the last', () => {
    // Three out on the Tuesday is what stops a fourth being sold for a stay
    // that merely covers the Tuesday.
    expect(peakExtraUse(nightly, { start: '2026-11-01', end: '2026-11-07' })['sofa-bed']).toBe(4)
  })

  test('a range that misses the busy night sees only what its own nights hold', () => {
    expect(peakExtraUse(nightly, { start: '2026-11-05', end: '2026-11-07' })['sofa-bed']).toBe(1)
  })

  test('reports nothing for an extra nobody is holding', () => {
    expect(
      peakExtraUse(nightly, { start: '2026-11-01', end: '2026-11-07' })['karaoke'],
    ).toBeUndefined()
  })
})
