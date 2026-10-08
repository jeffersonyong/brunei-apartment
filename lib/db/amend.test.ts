import { describe, expect, test } from 'vitest'

import { extrasFromLines, line, totalOf } from '@/lib/domain/lines'
import { bnd } from '@/lib/domain/money'

import { listBookingExtras } from './booking-extras'
import { amendBooking, getBookingById, listBookings, transitionBooking } from './bookings'
import { cancelBooking } from './close-booking'
import { givenBooking, unitIdByRef } from './test/factory'
import { auditEventsFor, givenGuestNames } from './test/inspect'

/**
 * Amending and cancelling a booking, against the real database (capability B3).
 *
 * The cases that matter here are the refusals. An amendment moves an occupancy
 * row, which is the row the G1 exclusion constraint arbitrates, so the tests
 * worth having are the ones proving that a losing amendment changes nothing —
 * and that a booking extending its own stay is not treated as clashing with
 * itself, which is the failure mode a naive overlap check would produce.
 */

const CHECK_IN = '2026-09-14'
const CHECK_OUT = '2026-09-17'
const NIGHTLY_RATE = bnd(200)

/** Lines priced the way the factory prices them, for a given number of nights. */
function nightsOf(nights: number) {
  const lines = [line('accommodation', `${nights} nights`, nights, NIGHTLY_RATE)]

  return { lines, total: totalOf(lines) }
}

/** An amendment that changes nothing, as a base for the one field under test. */
async function unchangedAmendment(bookingId: string) {
  const booking = await getBookingById(bookingId)

  if (!booking) {
    throw new Error(`Test setup lost booking ${bookingId}.`)
  }

  if (!booking.stay) {
    throw new Error(`Booking ${booking.reference} has no occupancy to amend.`)
  }

  return {
    bookingId: booking.id,
    expectedUpdatedAt: booking.updatedAt,
    unitId: booking.stay.unitId,
    range: booking.stay.range,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    vehicles: booking.vehicles,
    noVehicle: booking.noVehicle,
    chargeableGuests: booking.chargeableGuests,
    exemptGuests: booking.exemptGuests,
    lines: booking.lines,
    total: booking.total,
    securityDeposit: booking.securityDeposit,
    // "Unchanged" includes the discount: resubmitting without it would be a
    // removal, and the amend path treats a null instruction as exactly that.
    discount: booking.discount,
    reason: null,
    actorId: null,
  }
}

describe('amendBooking', () => {
  test('reprices the stay and replaces the lines rather than patching them', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    const extended = nightsOf(4)
    const result = await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      range: { start: CHECK_IN, end: '2026-09-18' },
      ...extended,
    })

    expect(result.ok).toBe(true)

    const after = await getBookingById(booking.id)

    expect(after?.stay?.range).toEqual({ start: CHECK_IN, end: '2026-09-18' })
    expect(after?.total).toBe(bnd(800))
    // prd.md §8: the total is the sum of the lines, never a stored figure that
    // could disagree with them.
    expect(after?.lines).toHaveLength(1)
    expect(after?.lines[0]?.quantity).toBe(4)
  })

  test('lets a stay widen in the unit it already occupies', async () => {
    // The case a hand-rolled overlap check gets wrong: the booking's own
    // occupancy row covers the range it is asking about. A row does not
    // conflict with itself under the exclusion constraint, so this is legal by
    // construction — and the test exists because nothing else would notice if
    // someone added an application-level check that broke it.
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    const result = await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      range: { start: '2026-09-13', end: '2026-09-19' },
      ...nightsOf(6),
    })

    expect(result.ok).toBe(true)
    expect((await getBookingById(booking.id))?.stay?.range).toEqual({
      start: '2026-09-13',
      end: '2026-09-19',
    })
  })

  test('refuses an amendment into a neighbouring booking, changing nothing', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })
    await givenBooking({ unitRef: '3B-01', checkIn: CHECK_OUT, checkOut: '2026-09-20' })

    const result = await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      range: { start: CHECK_IN, end: '2026-09-19' },
      ...nightsOf(5),
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('unit_unavailable')

    // The whole transaction is taken back with the refused occupancy update:
    // the dates, the total and the lines are all as they were.
    const after = await getBookingById(booking.id)

    expect(after?.stay?.range).toEqual({ start: CHECK_IN, end: CHECK_OUT })
    expect(after?.total).toBe(bnd(600))
    expect(after?.lines[0]?.quantity).toBe(3)
  })

  test('moving a guest to another unit frees the one they left', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    const result = await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      unitId: await unitIdByRef('3B-02'),
    })

    expect(result.ok).toBe(true)
    expect((await getBookingById(booking.id))?.stay?.unitRef).toBe('3B-02')

    // The proof that the old unit is genuinely free: a second booking can take
    // the exact nights the first one vacated.
    const backfill = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    expect(backfill.stay?.unitRef).toBe('3B-01')
  })

  test('refuses a save made against a booking that moved underneath it', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    const stale = await unchangedAmendment(booking.id)

    // Someone else saves first. Two staff members with the same booking open is
    // the ordinary case, not the exotic one.
    await amendBooking({ ...(await unchangedAmendment(booking.id)), guestName: 'First Writer' })

    const result = await amendBooking({ ...stale, guestName: 'Second Writer' })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('changed')
    expect((await getBookingById(booking.id))?.guestName).toBe('First Writer')
  })

  test('corrects the guest without creating a second guest record', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      guestName: 'Ali bin Hasan',
    })

    await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      guestName: 'Ali bin Hassan',
      guestPhone: '+673 712 3456',
    })

    const after = await getBookingById(booking.id)

    expect(after?.guestName).toBe('Ali bin Hassan')
    expect(after?.guestPhone).toBe('+673 712 3456')
    expect(await givenGuestNames()).toEqual(['Ali bin Hassan'])
  })

  test('records the amendment as an event carrying both sides of the change', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      range: { start: CHECK_IN, end: '2026-09-18' },
      ...nightsOf(4),
      reason: 'Guest asked for one more night',
    })

    const events = await auditEventsFor(booking.id)

    expect(events.map((event) => event.action)).toEqual([
      'booking.created_walk_in',
      'booking.amended',
    ])
    expect(events[1]?.before).toMatchObject({ check_out: CHECK_OUT, total_cents: bnd(600) })
    expect(events[1]?.after).toMatchObject({
      check_out: '2026-09-18',
      total_cents: bnd(800),
      reason: 'Guest asked for one more night',
    })
  })

  test('omits the reason key entirely when none was given', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await amendBooking({ ...(await unchangedAmendment(booking.id)), guestName: 'Renamed' })

    const events = await auditEventsFor(booking.id)

    // Absent rather than null, so an amendment that never asked for a reason
    // does not read as one where the field was left blank.
    expect(events[1]?.after).not.toHaveProperty('reason')
  })

  test('reports a booking that no longer exists', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    const amendment = await unchangedAmendment(booking.id)

    const result = await amendBooking({
      ...amendment,
      bookingId: '00000000-0000-0000-0000-000000000000',
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('not_found')
  })
})

/**
 * A booking read back names the extras it sold (20261008000100).
 *
 * `booking_summary` once built its lines without the extra's id, so the edit
 * screen prefilled no extras and a save dropped them, and a write that handed
 * the lines straight back was refused outright. What matters is the round
 * trip: what the database hands a screen is what it will take back.
 */
describe('an extra on the booking', () => {
  async function sofaBed() {
    const found = (await listBookingExtras()).find((extra) => extra.slug === 'sofa-bed')

    if (!found) {
      throw new Error('The seeded sofa-bed extra is missing.')
    }

    return found
  }

  test('is read back with the id of the extra it sold, and only its line carries one', async () => {
    const extra = await sofaBed()
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: extra.name, quantity: 2 }],
    })

    const read = await getBookingById(booking.id)
    const extraLine = read?.lines.find((entry) => entry.type === 'extra')
    const accommodation = read?.lines.find((entry) => entry.type === 'accommodation')

    expect(extraLine?.extraId).toBe(extra.id)
    expect(accommodation).toBeDefined()
    expect(accommodation && 'extraId' in accommodation).toBe(false)
    // What the edit screen prefills from.
    expect(extrasFromLines(read?.lines ?? []).extras).toEqual({ [extra.id]: 2 })
  })

  test('survives an amendment that hands its lines straight back', async () => {
    const extra = await sofaBed()
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: extra.name, quantity: 1 }],
    })

    const result = await amendBooking({
      ...(await unchangedAmendment(booking.id)),
      guestName: 'Renamed Guest',
    })

    expect(result.ok).toBe(true)

    const after = await getBookingById(booking.id)
    const extraLine = after?.lines.find((entry) => entry.type === 'extra')

    expect(extraLine).toMatchObject({ extraId: extra.id, quantity: 1 })
  })
})

describe('cancelling a booking', () => {
  test('records why, alongside the statuses', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await cancelBooking({
      bookingId: booking.id,
      actorId: null,
      reason: 'Guest cancelled by phone',
      depositOutcome: 'keep',
    })

    const events = await auditEventsFor(booking.id)

    expect(events[1]?.after).toMatchObject({
      status: 'cancelled',
      reason: 'Guest cancelled by phone',
    })
  })

  test('leaves the reason out of transitions that never asked for one', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await transitionBooking(booking.id, 'check_in')

    const events = await auditEventsFor(booking.id)

    expect(events[1]?.after).not.toHaveProperty('reason')
  })

  test('releases the unit, and the cancelled booking stays on the record', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await cancelBooking({
      bookingId: booking.id,
      actorId: null,
      reason: 'Double booked by mistake',
      depositOutcome: 'keep',
    })

    const replacement = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    expect(replacement.stay?.unitRef).toBe('3B-01')
    // The cancellation is a state, not a deletion — a cancelled booking that
    // returns is a new booking, and both are still readable.
    expect((await listBookings()).bookings.map((entry) => entry.status).sort()).toEqual([
      'cancelled',
      'confirmed',
    ])
  })

  test('cannot cancel a guest who has already checked in', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
    })

    await transitionBooking(booking.id, 'check_in')

    const result = await cancelBooking({
      bookingId: booking.id,
      actorId: null,
      reason: 'Changed their mind',
      depositOutcome: 'keep',
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('illegal_transition')
  })
})
