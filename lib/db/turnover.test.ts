import { describe, expect, test } from 'vitest'

import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { dataClient } from '@/lib/supabase/data'

import { listAuditEvents } from './audit'
import { findAvailableUnits, transitionBooking } from './bookings'
import { recordInspection } from './inspections'
import { currentPropertyId } from './property'
import {
  givenBooking,
  givenCheckedInBooking,
  givenDayPassBooking,
  givenDepartedBooking,
  unitIdByRef,
} from './test/factory'
import { getUnitStateByRef, markUnitReady } from './units'

/**
 * A unit's turnover against the real database (capabilities B8, C2, C3;
 * 20260925000100).
 *
 * "Today" is the real day in Brunei rather than the fixed date the gate's tests
 * use, because `unit_state()` returns a unit's last stay only when it is asked
 * about today — a guest checked in now says nothing about another date. A run
 * that straddles midnight in Brunei can therefore fail; run it again.
 *
 * Two of these exist because of a specific hazard rather than a feature, and
 * say so: the last-day regression, where the board called an occupied unit
 * available, and D-3, where marking a unit ready must change nothing a sale
 * depends on.
 */

const TODAY = todayInBrunei()

async function unitNamed(ref: string) {
  const unit = await getUnitStateByRef(ref)

  if (!unit) {
    throw new Error(`No unit ${ref}.`)
  }

  return unit
}

async function inspect(bookingId: string): Promise<string> {
  const result = await recordInspection({ bookingId, outcome: 'clean', notes: null, actorId: null })

  if (!result.ok) {
    throw new Error(`Test setup could not record an inspection: ${result.error.message}`)
  }

  return result.inspectionId
}

async function setTrackedSince(date: string): Promise<void> {
  const { error } = await dataClient()
    .from('property')
    .update({ turnover_tracked_since: date })
    .eq('id', await currentPropertyId())

  if (error) {
    throw new Error(`Could not set the turnover tracking date: ${error.message}`)
  }
}

describe("the units board on a guest's last day", () => {
  test('a guest still checked in on the day they leave keeps the unit occupied, by name', async () => {
    // The regression: a stay covers [start, end), so on its last day nothing
    // covered the unit and the board called it available with the guest in it.
    await givenCheckedInBooking({
      unitRef: '3B-01',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
      guestName: 'Leaving Today',
    })

    const unit = await unitNamed('3B-01')

    expect(unit.status).toBe('occupied')
    expect(unit.occupant?.name).toBe('Leaving Today')
    expect(unit.occupant?.end).toBe(TODAY)
  })

  test('a guest staying past their last day keeps the unit occupied', async () => {
    await givenCheckedInBooking({
      unitRef: '3B-02',
      checkIn: addDays(TODAY, -3),
      checkOut: addDays(TODAY, -1),
    })

    expect((await unitNamed('3B-02')).status).toBe('occupied')
  })

  test('the last stay is a fact about today only', async () => {
    await givenCheckedInBooking({ unitRef: '3B-03', checkIn: addDays(TODAY, -2), checkOut: TODAY })

    const tomorrow = await getUnitStateByRef('3B-03', addDays(TODAY, 1))

    expect(tomorrow?.lastStay).toBeNull()
    expect(tomorrow?.status).toBe('available')
  })
})

describe('a turnover, from check-out to ready', () => {
  test('check-out, inspection and ready walk the unit from occupied to available', async () => {
    const { booking } = await givenCheckedInBooking({
      unitRef: '3B-04',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })

    expect((await unitNamed('3B-04')).status).toBe('occupied')

    const checkedOut = await transitionBooking(booking.id, 'check_out', null)

    expect(checkedOut.ok).toBe(true)
    expect((await unitNamed('3B-04')).status).toBe('awaiting_inspection')

    await inspect(booking.id)

    expect((await unitNamed('3B-04')).status).toBe('cleaning')

    const ready = await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(ready).toEqual({ ok: true, unitRef: '3B-04' })

    const unit = await unitNamed('3B-04')

    expect(unit.status).toBe('available')
    expect(unit.lastStay?.readyAt).not.toBeNull()
  })

  test('marking a unit ready changes nothing about what can be sold (D-3)', async () => {
    // An early departure: check-out never shortens the stay, so its remaining
    // nights stay held — before the unit is marked ready and after.
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-05',
      checkIn: addDays(TODAY, -1),
      checkOut: addDays(TODAY, 3),
    })
    const range = { start: TODAY, end: addDays(TODAY, 2) }
    const unitId = await unitIdByRef('3B-05')

    const before = await findAvailableUnits({ range })

    expect(before.some((unit) => unit.id === unitId)).toBe(false)
    expect((await unitNamed('3B-05')).status).toBe('awaiting_inspection')

    await inspect(booking.id)
    await markUnitReady({ bookingId: booking.id, actorId: null })

    const after = await findAvailableUnits({ range })

    expect(after).toEqual(before)
    // The board calls it available all the same — the divergence D-3 accepts.
    expect((await unitNamed('3B-05')).status).toBe('available')
  })

  test('on a changeover day the turnover outranks the booking arriving in the unit', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-06',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })
    await givenBooking({ unitRef: '3B-06', checkIn: TODAY, checkOut: addDays(TODAY, 2) })

    expect((await unitNamed('3B-06')).status).toBe('awaiting_inspection')

    await inspect(booking.id)
    await markUnitReady({ bookingId: booking.id, actorId: null })

    expect((await unitNamed('3B-06')).status).toBe('booked')
  })

  test('a stay that quoted no deposit is turned over the same way', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-07',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
      securityDeposit: 0,
    })

    await inspect(booking.id)

    expect(await markUnitReady({ bookingId: booking.id, actorId: null })).toEqual({
      ok: true,
      unitRef: '3B-07',
    })
  })

  test('a stay that ended before turnovers were kept is not waiting for anybody', async () => {
    const { data, error } = await dataClient()
      .from('property')
      .select('turnover_tracked_since')
      .eq('id', await currentPropertyId())
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const original = (data as { turnover_tracked_since: string }).turnover_tracked_since

    await givenDepartedBooking({ unitRef: '3B-08', checkIn: addDays(TODAY, -2), checkOut: TODAY })

    expect((await unitNamed('3B-08')).status).toBe('awaiting_inspection')

    try {
      await setTrackedSince(addDays(TODAY, 1))

      expect((await unitNamed('3B-08')).status).toBe('available')
    } finally {
      await setTrackedSince(original)
    }
  })

  test("marking ready is in the unit's history, naming the stay it followed", async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-09',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })
    const inspectionId = await inspect(booking.id)

    await markUnitReady({ bookingId: booking.id, actorId: null })

    const events = await listAuditEvents('unit', await unitIdByRef('3B-09'))
    const marked = events.find((event) => event.action === 'unit.marked_ready')

    expect(marked?.after).toMatchObject({
      booking_reference: booking.reference,
      inspection_id: inspectionId,
      outcome: 'clean',
      unit_ref: '3B-09',
    })
  })
})

describe('mark_unit_ready refuses', () => {
  test('a booking that does not exist', async () => {
    const result = await markUnitReady({ bookingId: crypto.randomUUID(), actorId: null })

    expect(result.ok ? null : result.error.code).toBe('not_found')
  })

  test('a guest who has not checked out', async () => {
    const { booking } = await givenCheckedInBooking({
      unitRef: '3B-10',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })

    const result = await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(result.ok ? null : result.error.code).toBe('booking_not_completed')
  })

  test('a booking that occupies no unit', async () => {
    const pass = await givenDayPassBooking()
    // Nothing closes a day pass in the product yet (N40), so the finished state
    // is written directly — the discipline givenBookingInState keeps.
    const { error } = await dataClient()
      .from('booking')
      .update({ status: 'completed' })
      .eq('id', pass.id)

    if (error) {
      throw new Error(error.message)
    }

    const result = await markUnitReady({ bookingId: pass.id, actorId: null })

    expect(result.ok ? null : result.error.code).toBe('no_occupancy')
  })

  test('a unit nobody has inspected — ready follows an inspection, never replaces one', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-11',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })

    const result = await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(result.ok ? null : result.error.code).toBe('not_inspected')
    expect((await unitNamed('3B-11')).status).toBe('awaiting_inspection')
  })

  test('a second mark — it is written once', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-12',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })
    await inspect(booking.id)
    await markUnitReady({ bookingId: booking.id, actorId: null })

    const again = await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(again.ok ? null : again.error.code).toBe('already_ready')
  })

  test('a stay whose next guest has already checked in', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-13',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })
    await inspect(booking.id)
    await givenCheckedInBooking({ unitRef: '3B-13', checkIn: TODAY, checkOut: addDays(TODAY, 2) })

    const result = await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(result.ok ? null : result.error.code).toBe('superseded')
    expect((await unitNamed('3B-13')).status).toBe('occupied')
  })
})
