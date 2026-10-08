import { describe, expect, test } from 'vitest'

import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { bnd } from '@/lib/domain/money'
import { dataClient } from '@/lib/supabase/data'

import { listArrivals, recordGateArrivals } from './arrivals'
import { admitDayPass } from './day-pass-admission'
import { checkInBooking } from './deposits'
import { recordCashPayment } from './payments'
import { createPublicDayPassBooking } from './public-bookings'
import {
  givenBooking,
  givenCheckedInBooking,
  givenDepartedBooking,
  givenStaffAccount,
  TEST_IDENTITY,
} from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * Counting guests in at the gate (capability D8), against the real database.
 *
 * `record_gate_arrivals()` is the authority for what may be counted, and the
 * two writers that let a booking in — `check_in_booking()` and
 * `admit_day_pass()` — take the first count in the same transaction as the
 * status. Every change is an event, so a correction shows in the history.
 *
 * Dated by the clock rather than a fixed day, because the database reads it:
 * a pass is admitted, and counted, only on its own date in Brunei.
 */

const TODAY = todayInBrunei()
const LATER = addDays(TODAY, 3)

/** A stay for three counted guests and one small one — four through the gate. */
const STAY = {
  unitRef: '3B-01',
  checkIn: TODAY,
  checkOut: LATER,
  chargeableGuests: 3,
  exemptGuests: 1,
} as const

/** A BND 20 pass for two, sold online and paid in cash at the desk, for today. */
async function paidPassToday(guestPhone: string): Promise<string> {
  const created = await createPublicDayPassBooking({
    identity: TEST_IDENTITY,
    date: TODAY,
    party: [{ bandId: 'adult', label: 'Adult', count: 2 }],
    headcount: 2,
    chargeableGuests: 2,
    exemptGuests: 0,
    guestName: 'Arrivals Pass Guest',
    guestPhone,
    guestEmail: null,
    vehicles: ['BAR 1010'],
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
  })

  if (!created.ok) {
    throw new Error(`Test setup could not sell the day pass: ${created.error.message}`)
  }

  const cash = await recordCashPayment({
    bookingId: created.data.bookingId,
    amount: bnd(20),
    amountOverrideReason: null,
    actorId: null,
  })

  if (!cash.ok) {
    throw new Error(`Test setup could not take the cash: ${cash.error.message}`)
  }

  return created.data.bookingId
}

async function arrivedOn(bookingId: string): Promise<number | undefined> {
  return (await listArrivals([bookingId])).get(bookingId)
}

describe('checking a stay in counts who came through', () => {
  test('the gate’s count is recorded beside the status, and named in the history', async () => {
    const booking = await givenBooking(STAY)
    const actorId = await givenStaffAccount()

    const result = await checkInBooking({ bookingId: booking.id, actorId, arrived: 3 })

    expect(result.ok).toBe(true)
    expect(await arrivedOn(booking.id)).toBe(3)

    const checkIn = (await auditEventsFor(booking.id)).find((e) => e.action === 'booking.check_in')

    expect(checkIn?.actorId).toBe(actorId)
    expect(checkIn?.after).toMatchObject({ status: 'checked_in', arrived: 3, booked: 4 })
  })

  test('with no count — the office’s check-in — the whole party counts as arrived', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    expect(await arrivedOn(booking.id)).toBe(4)
  })

  test('a count below nothing is refused outright', async () => {
    const booking = await givenBooking(STAY)

    await expect(
      checkInBooking({ bookingId: booking.id, actorId: null, arrived: -1 }),
    ).rejects.toThrow()
    expect(await arrivedOn(booking.id)).toBeUndefined()
  })
})

describe('admitting a pass counts who came through', () => {
  test('the gate’s count is recorded, and the answer keeps its shape', async () => {
    const bookingId = await paidPassToday('+673 710 0701')

    expect(await admitDayPass({ bookingId, actorId: null, arrived: 1 })).toEqual({
      ok: true,
      status: 'completed',
    })
    expect(await arrivedOn(bookingId)).toBe(1)

    const admit = (await auditEventsFor(bookingId)).find((e) => e.action === 'booking.admit')

    expect(admit?.after).toMatchObject({ arrived: 1, booked: 2, headcount: 2 })
  })

  test('with no count — the desk’s admission — the whole pass counts as arrived', async () => {
    const bookingId = await paidPassToday('+673 710 0702')

    await admitDayPass({ bookingId, actorId: null })

    expect(await arrivedOn(bookingId)).toBe(2)
  })
})

describe('recording more arrivals, and correcting a count', () => {
  test('more people through is the new total, with both sides in the history', async () => {
    const booking = await givenBooking(STAY)
    const actorId = await givenStaffAccount()

    await checkInBooking({ bookingId: booking.id, actorId: null, arrived: 2 })

    expect(
      await recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 2,
        arrived: 4,
        corrected: false,
        actorId,
      }),
    ).toEqual({ ok: true, arrived: 4, booked: 4 })
    expect(await arrivedOn(booking.id)).toBe(4)

    const recorded = (await auditEventsFor(booking.id)).find(
      (e) => e.action === 'booking.arrivals_recorded',
    )

    expect(recorded?.actorId).toBe(actorId)
    expect(recorded?.before).toEqual({ arrived: 2 })
    expect(recorded?.after).toEqual({ arrived: 4, booked: 4 })
  })

  test('a correction is the same write, and the history says it was one', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    const result = await recordGateArrivals({
      bookingId: booking.id,
      expectedArrived: 4,
      arrived: 0,
      corrected: true,
      actorId: null,
    })

    expect(result).toEqual({ ok: true, arrived: 0, booked: 4 })

    const recorded = (await auditEventsFor(booking.id)).find(
      (e) => e.action === 'booking.arrivals_recorded',
    )

    expect(recorded?.after).toEqual({ arrived: 0, booked: 4, corrected: true })
  })

  test('the count may go past the booking — it records who actually came through', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    expect(
      await recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 4,
        arrived: 7,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: true, arrived: 7, booked: 4 })
  })

  test('a count that moved since the guard saw it is refused, with the count as it stands', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    const result = await recordGateArrivals({
      bookingId: booking.id,
      expectedArrived: 2,
      arrived: 5,
      corrected: false,
      actorId: null,
    })

    expect(result).toEqual({ ok: false, error: { code: 'changed', arrived: 4, booked: 4 } })
    expect(await arrivedOn(booking.id)).toBe(4)
    expect(
      (await auditEventsFor(booking.id)).some((e) => e.action === 'booking.arrivals_recorded'),
    ).toBe(false)
  })

  test('the same number again writes nothing', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    expect(
      await recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 4,
        arrived: 4,
        corrected: true,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'unchanged', arrived: 4, booked: 4 } })
  })

  test('an admitted pass counts later groups on its own day', async () => {
    const bookingId = await paidPassToday('+673 710 0703')

    await admitDayPass({ bookingId, actorId: null, arrived: 1 })

    expect(
      await recordGateArrivals({
        bookingId,
        expectedArrived: 1,
        arrived: 2,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: true, arrived: 2, booked: 2 })
  })

  test('a count below nothing is refused outright', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    await expect(
      recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 4,
        arrived: -1,
        corrected: true,
        actorId: null,
      }),
    ).rejects.toThrow()
  })
})

describe('what cannot be counted', () => {
  test('a stay not checked in yet', async () => {
    const booking = await givenBooking(STAY)

    expect(
      await recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 0,
        arrived: 2,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'not_in' } })
  })

  test('a stay already checked out', async () => {
    const { booking } = await givenDepartedBooking(STAY)

    expect(
      await recordGateArrivals({
        bookingId: booking.id,
        expectedArrived: 4,
        arrived: 5,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'closed' } })
  })

  test('a pass not admitted yet', async () => {
    const bookingId = await paidPassToday('+673 710 0704')

    expect(
      await recordGateArrivals({
        bookingId,
        expectedArrived: 0,
        arrived: 1,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'not_in' } })
  })

  test('an admitted pass once its day is over', async () => {
    const bookingId = await paidPassToday('+673 710 0705')

    await admitDayPass({ bookingId, actorId: null })

    // The day ending, which only the clock can do: the pass's date moves back.
    const { error } = await dataClient()
      .from('day_pass')
      .update({ pass_date: addDays(TODAY, -1) })
      .eq('booking_id', bookingId)

    expect(error).toBeNull()
    expect(
      await recordGateArrivals({
        bookingId,
        expectedArrived: 2,
        arrived: 3,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'not_today' } })
  })

  test('a booking that does not exist', async () => {
    expect(
      await recordGateArrivals({
        bookingId: '00000000-0000-4000-8000-000000000000',
        expectedArrived: 0,
        arrived: 1,
        corrected: false,
        actorId: null,
      }),
    ).toEqual({ ok: false, error: { code: 'not_found' } })
  })
})

describe('listArrivals', () => {
  test('reads every count in one go, and leaves out a booking never let in', async () => {
    const { booking: inside } = await givenCheckedInBooking(STAY)
    const waiting = await givenBooking({ ...STAY, unitRef: '3B-02' })

    const arrivals = await listArrivals([inside.id, waiting.id])

    expect(arrivals.get(inside.id)).toBe(4)
    expect(arrivals.has(waiting.id)).toBe(false)
  })

  test('reads nothing for no bookings', async () => {
    expect((await listArrivals([])).size).toBe(0)
  })
})
