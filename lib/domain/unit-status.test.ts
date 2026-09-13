import { describe, expect, test } from 'vitest'

import {
  countByStatus,
  deriveUnitStatus,
  isUnitStatus,
  turnoverStageOf,
  UNIT_STATUSES,
  UNIT_STATUS_LABELS,
  type LastStayFacts,
  type OccupancyStatus,
  type UnitStateFacts,
  type UnitStatus,
} from './unit-status'

/**
 * What a unit is doing, from the facts recorded about it.
 *
 * Mandatory coverage: this is the whole of capability B8's answer. Getting it
 * wrong does not misdraw a badge — it tells a clerk a unit is free when
 * somebody is asleep in it, or that it is clean when nobody has been in since
 * the last guest left.
 */

const TODAY = '2026-09-25'
const TRACKED = '2026-09-01'

const facts = (overrides: Partial<UnitStateFacts> = {}): UnitStateFacts => ({
  outOfServiceSince: null,
  covering: null,
  lastStay: null,
  turnoverTrackedSince: TRACKED,
  ...overrides,
})

const covering = (status: OccupancyStatus) => facts({ covering: { status } })

const stay = (overrides: Partial<LastStayFacts> = {}): LastStayFacts => ({
  status: 'completed',
  end: TODAY,
  inspected: false,
  ready: false,
  ...overrides,
})

describe('deriveUnitStatus — what covers the day', () => {
  test('a unit nothing covers is available', () => {
    // Arrange / Act
    const status = deriveUnitStatus(facts())

    // Assert
    expect(status).toBe('available')
  })

  test('a checked-in guest makes the unit occupied', () => {
    expect(deriveUnitStatus(covering('checked_in'))).toBe('occupied')
  })

  test('a confirmed booking makes it booked', () => {
    expect(deriveUnitStatus(covering('confirmed'))).toBe('booked')
  })

  test('a lease makes it leased long-term', () => {
    expect(deriveUnitStatus(covering('leased'))).toBe('leased_long_term')
  })

  test.each<OccupancyStatus>(['held', 'awaiting_payment_verification'])(
    'a %s occupancy holds the unit',
    (status) => {
      expect(deriveUnitStatus(covering(status))).toBe('held')
    },
  )

  test('a draft occupancy reads as held, not as available', () => {
    // A draft occupancy still holds its slot in the exclusion constraint. If
    // this said "available", the board and available_units() would disagree
    // about the same row — and the board would be the one that was wrong.
    expect(deriveUnitStatus(covering('draft'))).toBe('held')
  })

  test.each<OccupancyStatus>(['expired', 'cancelled', 'no_show'])(
    'a %s occupancy never reaches here, and reads as available if it does',
    (status) => {
      // unit_state() filters these out with the same predicate the exclusion
      // constraint uses. Belt and braces: a released occupancy releases its
      // unit on both sides of the boundary.
      expect(deriveUnitStatus(covering(status))).toBe('available')
    },
  )
})

describe('deriveUnitStatus — the guest who has not left', () => {
  test('a guest still checked in on the day they leave keeps the unit occupied', () => {
    // The regression this slice fixed: a stay covers [start, end), so on its
    // last day nothing covers the unit, and the board used to call it free
    // while the guest was packing.
    const status = deriveUnitStatus(
      facts({ covering: null, lastStay: stay({ status: 'checked_in', end: TODAY }) }),
    )

    expect(status).toBe('occupied')
  })

  test('a guest staying past their last day keeps the unit occupied', () => {
    const status = deriveUnitStatus(
      facts({ covering: null, lastStay: stay({ status: 'checked_in', end: '2026-09-23' }) }),
    )

    expect(status).toBe('occupied')
  })

  test('a guest still in on a changeover day outranks the next booking', () => {
    const status = deriveUnitStatus(
      facts({
        covering: { status: 'confirmed' },
        lastStay: stay({ status: 'checked_in', end: TODAY }),
      }),
    )

    expect(status).toBe('occupied')
  })
})

describe('deriveUnitStatus — the turnover', () => {
  test('a unit the guest has left and nobody has inspected is awaiting inspection', () => {
    expect(deriveUnitStatus(facts({ lastStay: stay() }))).toBe('awaiting_inspection')
  })

  test('an inspected unit not yet marked ready is being cleaned', () => {
    expect(deriveUnitStatus(facts({ lastStay: stay({ inspected: true }) }))).toBe('cleaning')
  })

  test('a unit marked ready reads from whatever covers the day', () => {
    expect(deriveUnitStatus(facts({ lastStay: stay({ inspected: true, ready: true }) }))).toBe(
      'available',
    )
  })

  test('an early departure awaits inspection though its occupancy still covers the day', () => {
    const status = deriveUnitStatus(
      facts({ covering: { status: 'completed' }, lastStay: stay({ end: '2026-09-28' }) }),
    )

    expect(status).toBe('awaiting_inspection')
  })

  test('an early departure marked ready reads available — the board-only divergence D-3 accepts', () => {
    // Its remaining nights are still unsellable, because check-out never
    // shortens a stay. This pins that the board says available anyway, which
    // is the decision recorded in architecture.md §5.2 and put to Jason as N53.
    const status = deriveUnitStatus(
      facts({
        covering: { status: 'completed' },
        lastStay: stay({ end: '2026-09-28', inspected: true, ready: true }),
      }),
    )

    expect(status).toBe('available')
  })

  test('on a changeover day, a unit not yet clean outranks the booking arriving in it [A]', () => {
    const status = deriveUnitStatus(
      facts({ covering: { status: 'confirmed' }, lastStay: stay({ inspected: true }) }),
    )

    expect(status).toBe('cleaning')
  })

  test('once marked ready, the changeover unit reads as the booking it is', () => {
    const status = deriveUnitStatus(
      facts({
        covering: { status: 'confirmed' },
        lastStay: stay({ inspected: true, ready: true }),
      }),
    )

    expect(status).toBe('booked')
  })

  test('a stay that ended before turnovers were kept is not waiting for anybody', () => {
    const status = deriveUnitStatus(facts({ lastStay: stay({ end: '2026-08-31' }) }))

    expect(status).toBe('available')
  })

  test('a stay that ended on the day tracking began is a turnover', () => {
    expect(deriveUnitStatus(facts({ lastStay: stay({ end: TRACKED }) }))).toBe(
      'awaiting_inspection',
    )
  })

  test('a turnover outranks a lease that begins in the unit', () => {
    const status = deriveUnitStatus(facts({ covering: { status: 'leased' }, lastStay: stay() }))

    expect(status).toBe('awaiting_inspection')
  })
})

describe('deriveUnitStatus — out of service', () => {
  test('out of service outranks a guest who is in the unit', () => {
    const status = deriveUnitStatus(
      facts({
        outOfServiceSince: '2026-09-04',
        covering: { status: 'checked_in' },
        lastStay: stay({ status: 'checked_in' }),
      }),
    )

    expect(status).toBe('out_of_service')
  })

  test('out of service outranks a lease', () => {
    const status = deriveUnitStatus(
      facts({ outOfServiceSince: '2026-09-04', covering: { status: 'leased' } }),
    )

    expect(status).toBe('out_of_service')
  })

  test('out of service outranks a turnover', () => {
    const status = deriveUnitStatus(facts({ outOfServiceSince: '2026-09-04', lastStay: stay() }))

    expect(status).toBe('out_of_service')
  })
})

describe('turnoverStageOf', () => {
  test('has nothing to say about a unit nobody has stayed in', () => {
    expect(turnoverStageOf(null, TRACKED)).toBeNull()
  })

  test('has nothing to say while the guest is still in', () => {
    expect(turnoverStageOf(stay({ status: 'checked_in' }), TRACKED)).toBeNull()
  })

  test('moves from awaiting inspection to cleaning to nothing', () => {
    expect(turnoverStageOf(stay(), TRACKED)).toBe('awaiting_inspection')
    expect(turnoverStageOf(stay({ inspected: true }), TRACKED)).toBe('cleaning')
    expect(turnoverStageOf(stay({ inspected: true, ready: true }), TRACKED)).toBeNull()
  })
})

describe('the status vocabulary', () => {
  test('every status has a label', () => {
    for (const status of UNIT_STATUSES) {
      expect(UNIT_STATUS_LABELS[status]).toBeTruthy()
    }
  })

  test('reads in lifecycle order, with the two stored facts last', () => {
    expect(UNIT_STATUSES).toEqual([
      'available',
      'held',
      'booked',
      'occupied',
      'awaiting_inspection',
      'cleaning',
      'leased_long_term',
      'out_of_service',
    ])
  })

  test('recognises its own statuses and rejects anything else', () => {
    expect(isUnitStatus('occupied')).toBe(true)
    expect(isUnitStatus('out_of_service')).toBe(true)
    expect(isUnitStatus('awaiting_inspection')).toBe(true)
    expect(isUnitStatus('cleaning')).toBe(true)
    expect(isUnitStatus('ready')).toBe(false)
    expect(isUnitStatus('')).toBe(false)
  })
})

describe('countByStatus', () => {
  test('counts what it is given', () => {
    const counts = countByStatus(['available', 'available', 'occupied', 'cleaning'])

    expect(counts.available).toBe(2)
    expect(counts.occupied).toBe(1)
    expect(counts.cleaning).toBe(1)
  })

  test('reports zero for a status nothing is in, rather than omitting it', () => {
    // A tile that disappears at zero makes the strip's width jump through the
    // day, and "nothing is out of service" is worth saying.
    const counts = countByStatus(['available'])

    expect(counts.out_of_service).toBe(0)
    expect(counts.awaiting_inspection).toBe(0)
    expect(Object.keys(counts).sort()).toEqual([...UNIT_STATUSES].sort())
  })

  test('an empty building is all zeroes, not an empty object', () => {
    const counts = countByStatus([])

    expect(Object.values(counts)).toEqual(UNIT_STATUSES.map(() => 0))
  })

  test('the totals add up to the units counted', () => {
    const statuses: UnitStatus[] = [
      'available',
      'held',
      'booked',
      'occupied',
      'awaiting_inspection',
      'available',
    ]
    const counts = countByStatus(statuses)

    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(statuses.length)
  })
})
