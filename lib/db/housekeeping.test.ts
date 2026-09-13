import { describe, expect, test } from 'vitest'

import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { dataClient } from '@/lib/supabase/data'

import { getTurnover, listTurnovers } from './housekeeping'
import { recordInspection } from './inspections'
import { addBookingNote } from './notes'
import {
  givenBooking,
  givenCheckedInBooking,
  givenDepartedBooking,
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
