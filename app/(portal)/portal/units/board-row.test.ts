import { describe, expect, test } from 'vitest'

import type { UnitLastStay, UnitOccupant, UnitState } from '@/lib/db/units'

import { nextStayStartOf, turnoverStayOf } from './board-row'

/**
 * Whose name the units board prints beside a turnover.
 *
 * The case this exists for is the changeover day: the guest who left is the
 * one the unit is waiting on, and the guest arriving must not be printed as if
 * they were.
 */

const departed: UnitLastStay = {
  occupancyId: 'o-1',
  bookingId: 'b-1',
  reference: 'PV-4821',
  guestName: 'Guest Who Left',
  status: 'completed',
  start: '2026-09-23',
  end: '2026-09-25',
  inspection: null,
  readyAt: null,
}

const arriving: UnitOccupant = {
  occupancyId: 'o-2',
  status: 'confirmed',
  name: 'Guest Arriving',
  start: '2026-09-25',
  end: '2026-09-27',
  bookingReference: 'PV-4830',
}

function unit(
  overrides: Partial<UnitState>,
): Pick<UnitState, 'status' | 'lastStay' | 'covering' | 'nextStart'> {
  return { status: 'available', lastStay: null, covering: null, nextStart: null, ...overrides }
}

describe('turnoverStayOf', () => {
  test.each(['awaiting_inspection', 'cleaning'] as const)(
    'a unit that is %s is about the stay that left',
    (status) => {
      expect(turnoverStayOf(unit({ status, lastStay: departed }))).toBe(departed)
    },
  )

  test('a unit marked ready is about whatever covers the day again', () => {
    const ready = { ...departed, readyAt: '2026-09-25T06:00:00Z' }

    expect(
      turnoverStayOf(unit({ status: 'booked', lastStay: ready, covering: arriving })),
    ).toBeNull()
  })

  test('an occupied unit is about its occupant, not a turnover', () => {
    expect(
      turnoverStayOf(unit({ status: 'occupied', lastStay: { ...departed, status: 'checked_in' } })),
    ).toBeNull()
  })
})

describe('nextStayStartOf', () => {
  test('on a changeover day, the next stay is the booking arriving today', () => {
    const changeover = unit({
      status: 'awaiting_inspection',
      lastStay: departed,
      covering: arriving,
    })

    expect(nextStayStartOf(changeover)).toBe('2026-09-25')
  })

  test('with nobody arriving today, it is the next stay after today', () => {
    const quiet = unit({ status: 'cleaning', lastStay: departed, nextStart: '2026-09-30' })

    expect(nextStayStartOf(quiet)).toBe('2026-09-30')
  })

  test('outside a turnover it is the ordinary next start', () => {
    expect(nextStayStartOf(unit({ status: 'available', nextStart: '2026-10-01' }))).toBe(
      '2026-10-01',
    )
  })

  test('a lease covering the day is not a next stay', () => {
    const lease: UnitOccupant = { ...arriving, status: 'leased', bookingReference: null }

    expect(
      nextStayStartOf(unit({ status: 'awaiting_inspection', lastStay: departed, covering: lease })),
    ).toBeNull()
  })
})
