import { afterEach, describe, expect, test } from 'vitest'

import { line, totalOf } from '@/lib/domain/lines'
import { bnd } from '@/lib/domain/money'
import { dataClient } from '@/lib/supabase/data'

import { getBookingById } from './bookings'
import { cancelBooking } from './close-booking'
import { listBookingNotes } from './notes'
import { changeBookingParty, listDayPassParties, reportExtraGuests } from './party'
import { currentPropertyId } from './property'
import { createPublicDayPassBooking, type CreatePublicDayPassInput } from './public-bookings'
import { givenBooking, givenCheckedInBooking } from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * The party changed after a booking was sold, and the guard's report of more
 * people at the gate (Jason's team, 19 September 2026), against the real
 * database — supabase/migrations/20261005000100.
 *
 * The pricing is lib/domain's and tested there. What is worth proving here is
 * what only the database decides: that a checked-in stay can change and a
 * closed one cannot, that a stale screen is refused, that a pass growing into
 * a full day is refused under the lock, and that a report is a note and an
 * event together.
 */

const PASS_DATE = '2026-10-12'

/** A stay the factory can check in — its dates are the ones deposits.test.ts uses. */
const STAY = { unitRef: '3B-01', checkIn: '2026-11-02', checkOut: '2026-11-05' }

async function setPoolCapacity(capacity: number | null): Promise<void> {
  const propertyId = await currentPropertyId()

  const { error } = await dataClient()
    .from('facility')
    .update({ day_pass_capacity: capacity })
    .eq('property_id', propertyId)
    .eq('slug', 'swimming-pool')

  if (error) {
    throw new Error(`Could not set the pool capacity: ${error.message}`)
  }
}

// Configuration is not cleared between tests, so a resized pool is put back.
afterEach(async () => {
  await setPoolCapacity(null)
})

function passInput(overrides: Partial<CreatePublicDayPassInput> = {}): CreatePublicDayPassInput {
  return {
    date: PASS_DATE,
    party: [{ bandId: 'adult', label: 'Adult', count: 2 }],
    headcount: 2,
    chargeableGuests: 2,
    exemptGuests: 0,
    guestName: 'Pass Party',
    guestPhone: '+673 700 0301',
    guestEmail: 'party@example.test',
    vehicles: [],
    noVehicle: true,
    total: bnd(20),
    lines: [line('day_pass', 'Adult × 2', 2, bnd(10))],
    ...overrides,
  }
}

async function givenPass(overrides: Partial<CreatePublicDayPassInput> = {}) {
  const created = await createPublicDayPassBooking(passInput(overrides))

  if (!created.ok) {
    throw new Error(`Test setup could not sell a pass: ${created.error.message}`)
  }

  const booking = await getBookingById(created.data.bookingId)

  if (!booking) {
    throw new Error('Test setup lost the pass it sold.')
  }

  return booking
}

/** A stay's lines with the extra-person charge a party of `extra` above the maximum adds. */
function stayLines(nights: number, extra: number) {
  const lines = [line('accommodation', `${nights} nights`, nights, bnd(200))]

  if (extra > 0) {
    lines.push(line('extra_person', `Extra guests — ${extra} × ${nights}`, extra * nights, bnd(7)))
  }

  return { lines, total: totalOf(lines) }
}

describe('changeBookingParty — a stay', () => {
  test('changes the party and the lines of a guest already checked in, and records it', async () => {
    const { booking: sold } = await givenCheckedInBooking(STAY)
    // Read again: checking in moved `updated_at` past the copy the factory kept.
    const booking = (await getBookingById(sold.id))!
    const priced = stayLines(3, 2)

    const result = await changeBookingParty({
      bookingId: booking.id,
      expectedUpdatedAt: booking.updatedAt,
      party: { chargeableGuests: 10, exemptGuests: 1 },
      ...priced,
      pass: null,
      reason: 'Two more arrived at the gate',
      actorId: null,
    })

    expect(result).toEqual({ ok: true })

    const after = await getBookingById(booking.id)

    expect(after?.status).toBe('checked_in')
    expect(after?.chargeableGuests).toBe(10)
    expect(after?.exemptGuests).toBe(1)
    expect(after?.total).toBe(priced.total)
    expect(after?.lines.map((entry) => entry.type)).toEqual(['accommodation', 'extra_person'])

    const events = await auditEventsFor(booking.id)
    const changed = events.find((event) => event.action === 'booking.party_changed')

    expect(changed?.before).toMatchObject({ chargeable_guests: booking.chargeableGuests })
    expect(changed?.after).toMatchObject({
      chargeable_guests: 10,
      exempt_guests: 1,
      total_cents: priced.total,
      reason: 'Two more arrived at the gate',
    })
  })

  test('refuses a screen opened on a version of the booking that has since moved', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
    })

    const result = await changeBookingParty({
      bookingId: booking.id,
      expectedUpdatedAt: '2000-01-01T00:00:00+00:00',
      party: { chargeableGuests: 3, exemptGuests: 0 },
      ...stayLines(3, 0),
      pass: null,
      reason: null,
      actorId: null,
    })

    expect(!result.ok && result.error.code).toBe('changed')
    expect((await getBookingById(booking.id))?.chargeableGuests).toBe(booking.chargeableGuests)
  })

  test('refuses a closed booking, which takes no more money', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
    })
    await cancelBooking({
      bookingId: booking.id,
      actorId: null,
      reason: 'Guest cancelled by phone',
      depositOutcome: 'keep',
    })

    const fresh = await getBookingById(booking.id)

    const result = await changeBookingParty({
      bookingId: booking.id,
      expectedUpdatedAt: fresh!.updatedAt,
      party: { chargeableGuests: 3, exemptGuests: 0 },
      ...stayLines(3, 0),
      pass: null,
      reason: null,
      actorId: null,
    })

    expect(!result.ok && result.error.code).toBe('booking_closed')
  })
})

describe('changeBookingParty — a day pass', () => {
  test('writes the new bands, the headcount and the price', async () => {
    const pass = await givenPass()
    const party = [
      { bandId: 'child', label: 'Child', count: 1 },
      { bandId: 'adult', label: 'Adult', count: 2 },
    ]

    const result = await changeBookingParty({
      bookingId: pass.id,
      expectedUpdatedAt: pass.updatedAt,
      party: { chargeableGuests: 3, exemptGuests: 0 },
      lines: [line('day_pass_bundle', '2 adults + 1 child', 1, bnd(20))],
      total: bnd(20),
      pass: { party, headcount: 3 },
      reason: null,
      actorId: null,
    })

    expect(result).toEqual({ ok: true })

    const after = await getBookingById(pass.id)

    expect(after?.dayPass?.headcount).toBe(3)
    expect((await listDayPassParties([pass.id])).get(pass.id)).toEqual(party)
  })

  test('refuses to grow a pass past what is left of the day, and changes nothing', async () => {
    await setPoolCapacity(3)

    const pass = await givenPass()

    const result = await changeBookingParty({
      bookingId: pass.id,
      expectedUpdatedAt: pass.updatedAt,
      party: { chargeableGuests: 4, exemptGuests: 0 },
      lines: [line('day_pass', 'Adult × 4', 4, bnd(10))],
      total: bnd(40),
      pass: { party: [{ bandId: 'adult', label: 'Adult', count: 4 }], headcount: 4 },
      reason: null,
      actorId: null,
    })

    expect(!result.ok && result.error.code).toBe('capacity_exceeded')
    // Two of the three places are this pass's own, so one more fits.
    expect(!result.ok && result.error.message).toBe('Only 1 more place is left that day.')
    expect((await getBookingById(pass.id))?.dayPass?.headcount).toBe(2)
  })

  test('lets a pass shrink on a day that is full', async () => {
    await setPoolCapacity(2)

    const pass = await givenPass()

    const result = await changeBookingParty({
      bookingId: pass.id,
      expectedUpdatedAt: pass.updatedAt,
      party: { chargeableGuests: 1, exemptGuests: 0 },
      lines: [line('day_pass', 'Adult × 1', 1, bnd(10))],
      total: bnd(10),
      pass: { party: [{ bandId: 'adult', label: 'Adult', count: 1 }], headcount: 1 },
      reason: null,
      actorId: null,
    })

    expect(result).toEqual({ ok: true })
  })
})

describe('reportExtraGuests', () => {
  test('is an internal note on the booking and an event the office’s bell reads', async () => {
    const { booking } = await givenCheckedInBooking(STAY)

    const result = await reportExtraGuests({
      bookingId: booking.id,
      extra: 2,
      body: 'Reported at the gate: 2 more people arrived than the booking is for (booked for 4).',
      addedCents: null,
      actorId: null,
    })

    expect(result).toEqual({ ok: true })

    const notes = await listBookingNotes(booking.id)

    expect(notes).toHaveLength(1)
    expect(notes[0]?.audience).toBe('internal')
    expect(notes[0]?.body).toMatch(/^Reported at the gate: 2 more people/)

    const reported = (await auditEventsFor(booking.id)).find(
      (event) => event.action === 'booking.extra_guests_reported',
    )

    expect(reported?.after).toMatchObject({
      reference: booking.reference,
      extra: 2,
      note_id: notes[0]?.id,
    })
  })
})
