import { describe, expect, test } from 'vitest'

import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { dataClient } from '@/lib/supabase/data'

import { listBookingExtras } from './booking-extras'
import { getTurnover, listDeparturesBoard, listTurnovers } from './housekeeping'
import { recordInspection } from './inspections'
import { addBookingNote } from './notes'
import {
  givenBooking,
  givenBookingInState,
  givenCheckedInBooking,
  givenDepartedBooking,
  givenTransferBooking,
  unitIdByRef,
} from './test/factory'
import { markUnitReady, setUnitNotes } from './units'

/**
 * The cleaner's list against the real database (capabilities C1–C3).
 *
 * "Today" is the real day in Brunei, for the reason lib/db/turnover.test.ts
 * gives: the list is built from `unit_state()`'s last stay, which is a fact
 * about today only.
 */

const TODAY = todayInBrunei()

const INTERNAL_NOTE = 'Disputed the parking charge. Not for housekeeping.'
const HOUSEKEEPING_NOTE = 'Extra towels in the hall cupboard.'
const UNIT_NOTE = 'The balcony door sticks.'

async function givenLeavingGuestWithNotes() {
  const { booking } = await givenCheckedInBooking({
    unitRef: '3B-01',
    checkIn: addDays(TODAY, -2),
    checkOut: TODAY,
    guestName: 'Leaving Guest',
    guestPhone: '+673 712 3456',
  })

  await addBookingNote({
    bookingId: booking.id,
    audience: 'housekeeping',
    body: HOUSEKEEPING_NOTE,
    authorId: null,
  })
  await addBookingNote({
    bookingId: booking.id,
    audience: 'internal',
    body: INTERNAL_NOTE,
    authorId: null,
  })
  await setUnitNotes({ unitId: await unitIdByRef('3B-01'), notes: UNIT_NOTE, actorId: null })

  return booking
}

describe("the cleaner's list", () => {
  test('a guest due out today is waiting to be seen off, with what the office wrote for housekeeping', async () => {
    const booking = await givenLeavingGuestWithNotes()

    const row = await getTurnover(booking.id, TODAY)

    expect(row?.step).toBe('guest_leaving')
    expect(row?.unitStatus).toBe('occupied')
    expect(row?.guestName).toBe('Leaving Guest')
    expect(row?.unitNote).toBe(UNIT_NOTE)
    expect(row?.housekeepingNotes.map((note) => note.body)).toEqual([HOUSEKEEPING_NOTE])
  })

  test('nothing on the list is for the office only — no internal note, no phone number', async () => {
    const booking = await givenLeavingGuestWithNotes()

    const rows = await listTurnovers(TODAY)
    const row = rows.find((candidate) => candidate.bookingId === booking.id)
    const serialised = JSON.stringify(rows)

    expect(serialised).not.toContain(INTERNAL_NOTE)
    expect(serialised).not.toContain('712 3456')
    // The row's whole shape, pinned: a field added to it reaches a phone left
    // in a unit, so adding one should mean changing this line on purpose.
    expect(Object.keys(row ?? {}).sort()).toEqual(
      [
        'bookingId',
        'departure',
        'guestName',
        'housekeepingNotes',
        'inspectionOutcome',
        'nextGuestArrivesToday',
        'reference',
        'step',
        'unitId',
        'unitNote',
        'unitRef',
        'unitStatus',
      ].sort(),
    )
  })

  test('a guest whose stay runs past today is not on the list', async () => {
    const { booking } = await givenCheckedInBooking({
      unitRef: '3B-02',
      checkIn: addDays(TODAY, -1),
      checkOut: addDays(TODAY, 2),
    })

    expect(await getTurnover(booking.id, TODAY)).toBeNull()
  })

  test('a checked-out stay asks to be inspected, then marked ready, then leaves the list', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-03',
      checkIn: addDays(TODAY, -2),
      checkOut: TODAY,
    })

    expect(await getTurnover(booking.id, TODAY)).toMatchObject({
      step: 'inspect',
      unitStatus: 'awaiting_inspection',
      inspectionOutcome: null,
    })

    const inspected = await recordInspection({
      bookingId: booking.id,
      outcome: 'issues_found',
      notes: 'Shower screen cracked.',
      actorId: null,
    })

    expect(inspected.ok).toBe(true)
    expect(await getTurnover(booking.id, TODAY)).toMatchObject({
      step: 'mark_ready',
      unitStatus: 'cleaning',
      inspectionOutcome: 'issues_found',
    })

    await markUnitReady({ bookingId: booking.id, actorId: null })

    expect(await getTurnover(booking.id, TODAY)).toBeNull()
  })

  test('a guest who left early is on the list to inspect, though their dates run on', async () => {
    const { booking } = await givenDepartedBooking({
      unitRef: '3B-04',
      checkIn: addDays(TODAY, -1),
      checkOut: addDays(TODAY, 2),
    })

    expect((await getTurnover(booking.id, TODAY))?.step).toBe('inspect')
  })

  test('a unit somebody arrives in today comes first', async () => {
    await givenDepartedBooking({ unitRef: '3B-05', checkIn: addDays(TODAY, -2), checkOut: TODAY })
    await givenDepartedBooking({ unitRef: '3B-06', checkIn: addDays(TODAY, -2), checkOut: TODAY })
    await givenBooking({ unitRef: '3B-06', checkIn: TODAY, checkOut: addDays(TODAY, 2) })

    const rows = (await listTurnovers(TODAY)).filter((row) =>
      ['3B-05', '3B-06'].includes(row.unitRef),
    )

    expect(rows.map((row) => row.unitRef)).toEqual(['3B-06', '3B-05'])
    expect(rows.map((row) => row.nextGuestArrivesToday)).toEqual([true, false])
  })
})

/**
 * The guests on their way (capability C4): the list a cleaner reads to get a
 * unit ready ahead of its guest. The rules for who is on it and what "ready"
 * means are lib/domain/arrivals-ahead.ts's; what only the database can prove is
 * that the read finds exactly those bookings and hands the phone nothing more.
 */
describe('the guests on their way', () => {
  async function sofaBed() {
    const found = (await listBookingExtras()).find((extra) => extra.slug === 'sofa-bed')

    if (!found) {
      throw new Error('The seeded sofa-bed extra is missing.')
    }

    return found
  }

  test('lists stays from today to three days ahead, confirmed or being checked, and nothing else', async () => {
    const extra = await sofaBed()
    const arrivingToday = await givenBooking({
      unitRef: '3B-01',
      checkIn: TODAY,
      checkOut: addDays(TODAY, 2),
    })
    const { booking: beingChecked } = await givenTransferBooking({
      unitRef: '3B-02',
      checkIn: addDays(TODAY, 1),
      checkOut: addDays(TODAY, 2),
    })
    const withSofaBed = await givenBooking({
      unitRef: '3B-03',
      checkIn: addDays(TODAY, 2),
      checkOut: addDays(TODAY, 4),
      chargeableGuests: 3,
      exemptGuests: 1,
      extras: [{ extraId: extra.id, name: extra.name, quantity: 1 }],
    })
    const lastDayOfWindow = await givenBooking({
      unitRef: '3B-04',
      checkIn: addDays(TODAY, 3),
      checkOut: addDays(TODAY, 5),
    })
    // Off the list: a day too far, an unpaid hold, a guest already in.
    await givenBooking({
      unitRef: '3B-05',
      checkIn: addDays(TODAY, 4),
      checkOut: addDays(TODAY, 6),
    })
    await givenBookingInState(
      { unitRef: '3B-06', checkIn: addDays(TODAY, 1), checkOut: addDays(TODAY, 3) },
      ['hold'],
    )
    await givenCheckedInBooking({
      unitRef: '3B-07',
      checkIn: addDays(TODAY, -1),
      checkOut: addDays(TODAY, 1),
    })

    const { arrivals } = await listDeparturesBoard(TODAY)

    expect(arrivals.map((arrival) => arrival.reference)).toEqual([
      arrivingToday.reference,
      beingChecked.reference,
      withSofaBed.reference,
      lastDayOfWindow.reference,
    ])
    expect(arrivals.find((arrival) => arrival.reference === withSofaBed.reference)).toMatchObject({
      unitRef: '3B-03',
      arrival: addDays(TODAY, 2),
      nights: 2,
      guests: 4,
      confirmed: true,
      needs: { extras: [{ name: extra.name, quantity: 1 }], earlyCheckInHours: 0 },
    })
    expect(
      arrivals.find((arrival) => arrival.reference === beingChecked.reference)?.confirmed,
    ).toBe(false)
  })

  test('says when the unit is still somebody else’s, from the same facts the board reads', async () => {
    await givenCheckedInBooking({
      unitRef: '3B-01',
      checkIn: addDays(TODAY, -1),
      checkOut: addDays(TODAY, 1),
    })
    const next = await givenBooking({
      unitRef: '3B-01',
      checkIn: addDays(TODAY, 1),
      checkOut: addDays(TODAY, 3),
    })

    const { arrivals } = await listDeparturesBoard(TODAY)
    const arrival = arrivals.find((candidate) => candidate.reference === next.reference)

    expect(arrival?.unitStatus).toBe('occupied')
    expect(arrival?.readiness).toEqual({ kind: 'guest_in', until: addDays(TODAY, 1) })
  })

  test('carries nothing a phone left in a unit should not — no name, no number, no price', async () => {
    const extra = await sofaBed()
    await givenBooking({
      unitRef: '3B-01',
      checkIn: addDays(TODAY, 1),
      checkOut: addDays(TODAY, 3),
      guestName: 'Arriving Guest',
      guestPhone: '+673 798 7654',
      extras: [{ extraId: extra.id, name: extra.name, quantity: 1 }],
    })

    const { arrivals } = await listDeparturesBoard(TODAY)
    const serialised = JSON.stringify(arrivals)

    expect(serialised).not.toContain('Arriving Guest')
    expect(serialised).not.toContain('798 7654')
    expect(serialised).not.toMatch(/unitPrice|amount|total|Cents/i)
    // The card's whole shape, pinned for the reason the departures row's is.
    expect(Object.keys(arrivals[0] ?? {}).sort()).toEqual(
      [
        'arrival',
        'confirmed',
        'guests',
        'needs',
        'nights',
        'readiness',
        'reference',
        'unitRef',
        'unitStatus',
      ].sort(),
    )
  })

  test('hands back the same departures the list on its own does', async () => {
    await givenLeavingGuestWithNotes()

    const board = await listDeparturesBoard(TODAY)

    expect(board.turnovers).toEqual(await listTurnovers(TODAY))
  })
})

describe('the seeded Housekeeping role', () => {
  test('holds every permission a turnover needs', async () => {
    const { data, error } = await dataClient()
      .from('role_permission')
      .select('permission, staff_role!inner(slug)')
      .eq('staff_role.slug', 'housekeeping')

    if (error) {
      throw new Error(error.message)
    }

    const held = new Set((data as unknown as { permission: string }[]).map((row) => row.permission))

    for (const permission of ['booking.check_out', 'inspection.record', 'unit.manage']) {
      expect(held.has(permission)).toBe(true)
    }
  })
})
