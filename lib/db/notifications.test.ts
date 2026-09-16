import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import type { Permission } from '@/lib/auth/permissions'
import { dataClient } from '@/lib/supabase/data'

import type { Booking } from './bookings'
import {
  markNotificationsSeen,
  readNotificationFeed,
  readNotificationsSeenAt,
} from './notifications'
import { currentPropertyId } from './property'
import { givenBooking, givenStaffAccount } from './test/factory'

/**
 * The bell's feed against the real database.
 *
 * What only the database can show: that the feed is read off the audit trail
 * with the reader's own events left out, that the fortnight window holds, and that "seen" is clamped and never moves
 * backwards.
 *
 * The events are written straight into the trail for a booking made here —
 * the trail is append-only, and the setup never clears it, so each assertion
 * looks only at this booking's reference.
 */

const EVERYTHING = new Set<Permission>(['booking.view', 'payment.verify'])
const DAY_MS = 86_400_000

let readerId: string
let propertyId: string

beforeAll(async () => {
  readerId = await givenStaffAccount()
  propertyId = await currentPropertyId()
})

afterEach(async () => {
  await dataClient().from('notification_read').delete().eq('user_id', readerId)
})

async function givenEvent(
  booking: Booking,
  action: string,
  options: { actorId?: string | null; at?: Date; after?: Record<string, unknown> } = {},
): Promise<void> {
  const { error } = await dataClient()
    .from('audit_event')
    .insert({
      property_id: propertyId,
      actor_id: options.actorId ?? null,
      action,
      entity_type: 'booking',
      entity_id: booking.id,
      before: null,
      after: options.after ?? {},
      at: (options.at ?? new Date()).toISOString(),
    })

  if (error) {
    throw new Error(`Test setup could not write an audit event: ${error.message}`)
  }
}

function forBooking<T extends { detail: string }>(items: readonly T[], booking: Booking): T[] {
  return items.filter((item) => item.detail.startsWith(booking.reference))
}

describe('the notification feed', () => {
  test('lists the three kinds, newest first, with whose booking each is', async () => {
    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: '2031-03-01',
      checkOut: '2031-03-03',
    })
    const base = Date.now() - 60_000

    await givenEvent(booking, 'booking.created_public', {
      at: new Date(base),
      after: { stream: 'short_stay' },
    })
    await givenEvent(booking, 'booking.submit_payment', {
      actorId: crypto.randomUUID(),
      at: new Date(base + 1_000),
      after: { amount_cents: 10_000 },
    })
    await givenEvent(booking, 'email.failed', {
      at: new Date(base + 2_000),
      after: { kind: 'booking_confirmed', failure: 'rejected' },
    })

    const feed = await readNotificationFeed(readerId, EVERYTHING)
    const mine = forBooking(feed.items, booking)

    expect(mine.map((item) => item.title)).toEqual([
      'Confirmation email could not be sent',
      'Payment to verify',
      'New online booking — short stay',
    ])
    expect(mine[1]?.detail).toBe(`${booking.reference} · ${booking.guestName} · BND 100.00`)
    expect(feed.seenAt).toBeNull()
    expect(feed.unread).toBe(feed.items.length)
  })

  test('leaves out what the reader did, what is too old, and what they may not act on', async () => {
    const booking = await givenBooking({
      unitRef: '3B-02',
      checkIn: '2031-04-01',
      checkOut: '2031-04-03',
    })

    await givenEvent(booking, 'booking.submit_payment', { actorId: readerId })
    await givenEvent(booking, 'booking.created_public', {
      at: new Date(Date.now() - 15 * DAY_MS),
    })
    await givenEvent(booking, 'booking.submit_payment', { actorId: crypto.randomUUID() })

    expect(
      forBooking((await readNotificationFeed(readerId, EVERYTHING)).items, booking),
    ).toHaveLength(1)
    expect(
      forBooking(
        (await readNotificationFeed(readerId, new Set<Permission>(['booking.view']))).items,
        booking,
      ),
    ).toHaveLength(0)
  })

  test('counts only what arrived after the bell was last opened', async () => {
    const booking = await givenBooking({
      unitRef: '3B-03',
      checkIn: '2031-05-01',
      checkOut: '2031-05-03',
    })
    const earlier = new Date(Date.now() - 120_000)

    await givenEvent(booking, 'booking.created_public', { at: earlier })
    await markNotificationsSeen(readerId, earlier.toISOString())
    await givenEvent(booking, 'booking.submit_payment', { actorId: crypto.randomUUID() })

    const feed = await readNotificationFeed(readerId, EVERYTHING)

    expect(new Date(feed.seenAt ?? 0).getTime()).toBe(earlier.getTime())
    expect(forBooking(feed.items, booking)).toHaveLength(2)
    expect(feed.unread).toBeGreaterThanOrEqual(1)
    expect(feed.unread).toBeLessThan(feed.items.length)
  })

  test('refuses an id that is not a staff account id', async () => {
    await expect(readNotificationFeed('x),actor_id.is.null', EVERYTHING)).rejects.toThrow()
  })
})

describe('marking notifications seen', () => {
  test('never moves backwards, and never past the database clock', async () => {
    const now = Date.now()

    const first = await markNotificationsSeen(readerId, new Date(now - 60_000).toISOString())
    const back = await markNotificationsSeen(readerId, new Date(now - 3_600_000).toISOString())

    expect(back).toBe(first)

    const future = await markNotificationsSeen(readerId, new Date(now + 3_600_000).toISOString())

    expect(new Date(future).getTime()).toBeLessThan(now + 60_000)
    expect(await readNotificationsSeenAt(readerId)).toBe(future)
  })
})
