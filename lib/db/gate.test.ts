import { describe, expect, test } from 'vitest'

import { addDays } from '@/lib/domain/dates'
import { bnd } from '@/lib/domain/money'
import { dataClient } from '@/lib/supabase/data'

import { getGateBooking, listGateBookings, searchGateBookings, type GateBooking } from './gate'
import { createPublicDayPassBooking, type CreatePublicDayPassInput } from './public-bookings'
import {
  givenBooking,
  givenBookingInState,
  givenCheckedInBooking,
  givenTransferBooking,
} from './test/factory'

/**
 * The gate's reads against the real database (capabilities D1, D2, D4).
 *
 * "Today" is passed in rather than read from the clock, so these describe a
 * fixed day and cannot drift into a different answer at midnight in Brunei.
 * The day sits inside the public day-pass window the other public tests use.
 */

const TODAY = '2026-10-05'
const YESTERDAY = addDays(TODAY, -1)
const TOMORROW = addDays(TODAY, 1)
const LATER = addDays(TODAY, 3)

function references(rows: readonly GateBooking[]): string[] {
  return rows.map((row) => row.reference)
}

function everyone(list: Awaited<ReturnType<typeof listGateBookings>>): string[] {
  return [...list.expected, ...list.dayPasses, ...list.inResidence].map((row) => row.reference)
}

function dayPassOn(date: string, overrides: Partial<CreatePublicDayPassInput> = {}) {
  return createPublicDayPassBooking({
    date,
    party: [{ bandId: 'adult', label: 'Adult', count: 2 }],
    headcount: 2,
    chargeableGuests: 2,
    exemptGuests: 0,
    guestName: 'Gate Pass Guest',
    guestPhone: '+673 710 0001',
    guestEmail: null,
    vehicles: ['BAP 4242'],
    noVehicle: false,
    total: bnd(20),
    lines: [
      {
        type: 'day_pass',
        description: 'Adult × 2',
        quantity: 2,
        unitPrice: bnd(10),
        amount: bnd(20),
      },
    ],
    ...overrides,
  })
}

describe("today's list at the gate", () => {
  test('a secured, paid stay arriving today is expected and may be checked in', async () => {
    const booking = await givenBooking({ unitRef: '3B-01', checkIn: TODAY, checkOut: LATER })

    const list = await listGateBookings(TODAY)
    const row = list.expected.find((candidate) => candidate.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'check_in', stayOwed: false })
    expect(row?.unitRef).toBe('3B-01')
    expect(row?.arrival).toBe(TODAY)
  })

  test('a guest who paid only the deposit is still let in, with the stay said to be owed', async () => {
    const booking = await givenBooking({
      unitRef: '3B-02',
      checkIn: TODAY,
      checkOut: LATER,
      payStayNow: false,
    })

    const row = (await listGateBookings(TODAY)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'check_in', stayOwed: true })
  })

  test('a stay held on a transfer nobody has checked is listed, and sent to the office', async () => {
    const { booking } = await givenTransferBooking({
      unitRef: '3B-03',
      checkIn: TODAY,
      checkOut: LATER,
    })

    const row = (await listGateBookings(TODAY)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'office', reason: 'not_confirmed' })
  })

  test('a guest due yesterday who has not arrived is still expected', async () => {
    const booking = await givenBooking({ unitRef: '3B-04', checkIn: YESTERDAY, checkOut: LATER })

    const row = (await listGateBookings(TODAY)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict.kind).toBe('check_in')
  })

  test('guests already checked in are listed apart — including one who has overstayed', async () => {
    const staying = await givenCheckedInBooking({
      unitRef: '3B-05',
      checkIn: YESTERDAY,
      checkOut: TOMORROW,
    })
    const overstaying = await givenCheckedInBooking({
      unitRef: '3B-06',
      checkIn: addDays(TODAY, -3),
      checkOut: YESTERDAY,
    })

    const list = await listGateBookings(TODAY)

    expect(references(list.inResidence)).toEqual(
      expect.arrayContaining([staying.booking.reference, overstaying.booking.reference]),
    )
    expect(references(list.expected)).not.toContain(staying.booking.reference)
    expect(list.inResidence.every((row) => row.verdict.kind === 'in_residence')).toBe(true)
  })

  test('a booking starting tomorrow is not expected today', async () => {
    const booking = await givenBooking({ unitRef: '3B-07', checkIn: TOMORROW, checkOut: LATER })

    expect(everyone(await listGateBookings(TODAY))).not.toContain(booking.reference)
  })

  test('closed bookings never reach the gate', async () => {
    const cancelled = await givenBookingInState(
      { unitRef: '3B-08', checkIn: TODAY, checkOut: LATER },
      ['pay_in_full', 'cancel'],
    )
    const noShow = await givenBookingInState(
      { unitRef: '3B-09', checkIn: TODAY, checkOut: LATER },
      ['pay_in_full', 'mark_no_show'],
    )

    const listed = everyone(await listGateBookings(TODAY))

    expect(listed).not.toContain(cancelled.reference)
    expect(listed).not.toContain(noShow.reference)
  })

  test("today's day pass is listed on its own, unpaid until the transfer is verified", async () => {
    const today = await dayPassOn(TODAY)
    const otherDay = await dayPassOn(TOMORROW, { guestPhone: '+673 710 0002' })

    expect(today.ok && otherDay.ok).toBe(true)

    if (!today.ok || !otherDay.ok) return

    const list = await listGateBookings(TODAY)
    const row = list.dayPasses.find((candidate) => candidate.id === today.data.bookingId)

    expect(row?.verdict).toEqual({ kind: 'day_pass', paid: false })
    expect(row?.headcount).toBe(2)
    expect(row?.unitRef).toBeNull()
    expect(everyone(list)).not.toContain(otherDay.data.reference)
    expect(references(list.expected)).not.toContain(today.data.reference)
  })

  test('a row carries nothing a phone on the guardhouse desk should show', async () => {
    await givenBooking({
      unitRef: '3B-10',
      checkIn: TODAY,
      checkOut: LATER,
      guestPhone: '+673 812 3456',
    })

    const [row] = (await listGateBookings(TODAY)).expected

    expect(row).toBeDefined()
    expect(Object.keys(row ?? {}).sort()).toEqual(
      [
        'arrival',
        'departure',
        'guestName',
        'headcount',
        'id',
        'noVehicle',
        'reference',
        'status',
        'stream',
        'unitRef',
        'vehicles',
        'verdict',
      ].sort(),
    )
    expect(JSON.stringify(row)).not.toContain('812')
  })
})

describe('searching beyond today', () => {
  test('finds tomorrow’s car by plate however the guard spaced it, and sends it to the office', async () => {
    const booking = await givenBooking({
      unitRef: '3B-11',
      checkIn: TOMORROW,
      checkOut: LATER,
      vehicles: ['BAB 5678'],
    })

    for (const term of ['bab5678', 'BAB 5678', 'b-5678']) {
      const found = await searchGateBookings(term, TODAY)

      expect(references(found), term).toContain(booking.reference)
    }

    const [row] = await searchGateBookings('bab5678', TODAY)

    expect(row?.verdict).toEqual({ kind: 'office', reason: 'early' })
  })

  test('finds a booking by part of the name or the reference', async () => {
    const booking = await givenBooking({
      unitRef: '3B-12',
      checkIn: TOMORROW,
      checkOut: LATER,
      guestName: 'Hajah Norhayati',
    })
    const digits = booking.reference.replace(/\D/g, '')

    expect(references(await searchGateBookings('norhay', TODAY))).toContain(booking.reference)
    expect(references(await searchGateBookings(digits, TODAY))).toContain(booking.reference)
  })

  test('never finds a closed booking', async () => {
    const cancelled = await givenBookingInState(
      { unitRef: '3B-13', checkIn: TOMORROW, checkOut: LATER, vehicles: ['BAC 1357'] },
      ['pay_in_full', 'cancel'],
    )

    expect(references(await searchGateBookings('BAC1357', TODAY))).not.toContain(
      cancelled.reference,
    )
  })

  test('takes a wildcard character literally', async () => {
    await givenBooking({ unitRef: '3B-14', checkIn: TOMORROW, checkOut: LATER })

    expect(await searchGateBookings('%', TODAY)).toEqual([])
    expect(await searchGateBookings('_', TODAY)).toEqual([])
  })

  test('an empty term searches nothing', async () => {
    await givenBooking({ unitRef: '3B-15', checkIn: TOMORROW, checkOut: LATER })

    expect(await searchGateBookings('   ', TODAY)).toEqual([])
  })
})

describe('one booking, read fresh for the check-in', () => {
  test('carries the same verdict the list does', async () => {
    const booking = await givenBooking({ unitRef: '3B-16', checkIn: TODAY, checkOut: LATER })

    expect((await getGateBooking(booking.id, TODAY))?.verdict).toEqual({
      kind: 'check_in',
      stayOwed: false,
    })
  })

  test('is null for a booking that does not exist', async () => {
    expect(await getGateBooking('00000000-0000-4000-8000-000000000000', TODAY)).toBeNull()
  })
})

describe('who may check guests in and out (N11)', () => {
  async function slugsHolding(permission: string): Promise<string[]> {
    const { data, error } = await dataClient()
      .from('role_permission')
      .select('staff_role!inner(slug)')
      .eq('permission', permission)

    if (error) {
      throw new Error(error.message)
    }

    return (data as unknown as { staff_role: { slug: string } }[])
      .map((row) => row.staff_role.slug)
      .sort()
  }

  test('the guard, the desk and Admin check guests in', async () => {
    expect(await slugsHolding('booking.check_in')).toEqual(['admin', 'front-office', 'security'])
  })

  test('housekeeping, the desk and Admin check guests out', async () => {
    expect(await slugsHolding('booking.check_out')).toEqual([
      'admin',
      'front-office',
      'housekeeping',
    ])
  })

  test('the guard still cannot edit a booking', async () => {
    expect(await slugsHolding('booking.amend')).not.toContain('security')
  })
})
