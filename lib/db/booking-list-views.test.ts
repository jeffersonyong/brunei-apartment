import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import { MAX_BOOKING_LIST_VIEWS, type ViewFilter } from '@/lib/domain/booking-list-view'
import { line, totalOf } from '@/lib/domain/lines'
import { bnd } from '@/lib/domain/money'
import { dataClient } from '@/lib/supabase/data'

import {
  deleteBookingListView,
  listBookingListViews,
  saveBookingListView,
} from './booking-list-views'
import { amendBooking, countBookingsByStream, getBookingById, listBookings } from './bookings'
import { cancelBooking } from './close-booking'
import { currentPropertyId } from './property'
import { givenBooking, givenDepartedBooking, givenStaffAccount } from './test/factory'

/**
 * The team's saved views and the "Money owed" filter, against the real
 * database (capability B19, supabase/migrations/20261008000200).
 *
 * The views table is not cleared between tests — it is configuration, not a
 * booking — so every view here is named with a prefix and removed afterwards,
 * the way the FAQ tests keep theirs.
 */

const PREFIX = 'Integration view'

const NONE: ViewFilter = { statuses: [], streams: [], search: null, moneyOwed: false }

let actorId: string

beforeAll(async () => {
  await forgetTestViews()
  actorId = await givenStaffAccount()
})

afterEach(async () => {
  await forgetTestViews()
})

async function forgetTestViews(): Promise<void> {
  const { error } = await dataClient().from('booking_list_view').delete().like('name', `${PREFIX}%`)

  if (error) {
    throw new Error(`Could not clear the test views: ${error.message}`)
  }
}

async function save(name: string, filter: ViewFilter) {
  return saveBookingListView({ name: `${PREFIX} ${name}`, filter, actorId })
}

describe('saving a view', () => {
  test('is listed for everybody, read back as the filter it was saved with', async () => {
    const saved = await save('needs chasing', {
      ...NONE,
      statuses: ['checked_in', 'held', 'awaiting_payment_verification'],
    })

    expect(saved.ok).toBe(true)

    const view = (await listBookingListViews()).find(
      (candidate) => candidate.name === `${PREFIX} needs chasing`,
    )

    expect(view?.filter).toEqual({
      ...NONE,
      statuses: ['held', 'awaiting_payment_verification', 'checked_in'],
    })
  })

  test('refuses a name already taken, whatever its case', async () => {
    await save('Unpaid', { ...NONE, moneyOwed: true })

    const again = await save('UNPAID', { ...NONE, statuses: ['held'] })

    expect(!again.ok && again.error.code).toBe('name_taken')
  })

  test('refuses the same filters under a second name, and names the view that has them', async () => {
    await save('In the building', { ...NONE, statuses: ['checked_in', 'confirmed'] })

    const again = await save('Who is here', { ...NONE, statuses: ['confirmed', 'checked_in'] })

    expect(!again.ok && again.error.code).toBe('duplicate')
    expect(!again.ok && again.error.message).toContain(`${PREFIX} In the building`)
  })

  test('refuses a view that filters nothing — that is All bookings', async () => {
    const empty = await save('nothing', NONE)

    expect(!empty.ok && empty.error.code).toBe('nothing_to_save')
  })

  test(`stops at ${MAX_BOOKING_LIST_VIEWS} views`, async () => {
    const existing = (await listBookingListViews()).length

    for (let index = existing; index < MAX_BOOKING_LIST_VIEWS; index += 1) {
      const filled = await save(`filler ${index}`, { ...NONE, search: `term ${index}` })

      expect(filled.ok).toBe(true)
    }

    const oneTooMany = await save('one too many', { ...NONE, search: 'one more' })

    expect(!oneTooMany.ok && oneTooMany.error.code).toBe('too_many')
  })

  test('a stored status that no longer exists drops out rather than breaking the list', async () => {
    const { error } = await dataClient()
      .from('booking_list_view')
      .insert({
        property_id: await currentPropertyId(),
        name: `${PREFIX} from an older app`,
        statuses: ['vanished', 'confirmed'],
      })

    if (error) {
      throw new Error(error.message)
    }

    const view = (await listBookingListViews()).find(
      (candidate) => candidate.name === `${PREFIX} from an older app`,
    )

    expect(view?.filter.statuses).toEqual(['confirmed'])
  })
})

describe('deleting a view', () => {
  test('takes it off the list for everybody', async () => {
    const saved = await save('to delete', { ...NONE, moneyOwed: true })

    if (!saved.ok) {
      throw new Error(saved.error.message)
    }

    expect(await deleteBookingListView(saved.id)).toEqual({ ok: true })
    expect((await listBookingListViews()).some((view) => view.id === saved.id)).toBe(false)
  })

  test('says so when somebody else deleted it first', async () => {
    const result = await deleteBookingListView('00000000-0000-0000-0000-000000000000')

    expect(!result.ok && result.error.code).toBe('not_found')
  })
})

describe('the Money owed filter', () => {
  const STAY = { checkIn: '2026-11-02', checkOut: '2026-11-05' }

  test('finds the stay secured by its deposit, and leaves out what is settled or ended', async () => {
    const depositOnly = await givenBooking({ unitRef: '3B-01', ...STAY, payStayNow: false })
    await givenBooking({ unitRef: '3B-02', ...STAY })
    const cancelled = await givenBooking({ unitRef: '3B-03', ...STAY, payStayNow: false })
    await cancelBooking({
      bookingId: cancelled.id,
      actorId: null,
      reason: 'Guest changed plans',
      depositOutcome: 'keep',
    })
    // Departed owing: nothing more can be recorded against it (N57).
    await givenDepartedBooking({
      unitRef: '3B-04',
      checkIn: '2026-10-01',
      checkOut: '2026-10-03',
      payStayNow: false,
    })
    const overpaid = await givenBooking({ unitRef: '3B-05', ...STAY })
    await shortenToOneNight(overpaid.id)

    const { bookings, total } = await listBookings({ moneyOwed: true })

    expect(bookings.map((booking) => booking.reference)).toEqual([depositOnly.reference])
    expect(total).toBe(1)

    const counts = await countBookingsByStream({ moneyOwed: true })

    expect(counts.short_stay).toBe(1)
  })

  test('combines with a status filter rather than widening it', async () => {
    await givenBooking({ unitRef: '3B-01', ...STAY, payStayNow: false })

    expect((await listBookings({ moneyOwed: true, statuses: ['cancelled'] })).total).toBe(0)
    expect((await listBookings({ moneyOwed: true, statuses: ['confirmed'] })).total).toBe(1)
  })
})

/** Shrinks a paid three-night stay to one night, leaving it overpaid. */
async function shortenToOneNight(bookingId: string): Promise<void> {
  const booking = await getBookingById(bookingId)

  if (!booking?.stay) {
    throw new Error('Test setup lost the stay it was shortening.')
  }

  const lines = [line('accommodation', '1 night', 1, bnd(200))]
  const result = await amendBooking({
    bookingId: booking.id,
    expectedUpdatedAt: booking.updatedAt,
    unitId: booking.stay.unitId,
    range: { start: booking.stay.range.start, end: '2026-11-03' },
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    vehicles: booking.vehicles,
    noVehicle: booking.noVehicle,
    chargeableGuests: booking.chargeableGuests,
    exemptGuests: booking.exemptGuests,
    lines,
    total: totalOf(lines),
    securityDeposit: booking.securityDeposit,
    discount: booking.discount,
    reason: 'Leaving early',
    actorId: null,
  })

  if (!result.ok) {
    throw new Error(`Test setup could not shorten the stay: ${result.error.message}`)
  }
}
