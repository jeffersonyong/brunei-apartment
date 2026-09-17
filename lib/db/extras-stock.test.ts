import { beforeEach, describe, expect, test } from 'vitest'

import { extrasInUse, listBookingExtras, updateBookingExtra } from './booking-extras'
import { createWalkInBooking } from './bookings'
import { cancelBooking } from './close-booking'
import { currentPropertyId } from './property'
import { dataClient } from '@/lib/supabase/data'
import { bookingInput, givenBooking } from './test/factory'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CAPABILITY F13 — an extra cannot be in two rooms on the same night.
 *
 * The rule that did not exist before 17 September 2026. `property.sofa_bed
 * _stock` was checked in exactly one place — `priceStay`, against a single
 * booking's own quantity — so two bookings could each take two of two sofa
 * beds on the same night and nothing objected. Stock was a form limit, never
 * an availability rule.
 *
 * It is enforced by `booking_line_extra_within_stock`, a deferred constraint
 * trigger holding one advisory lock per property. **Not** by a GiST exclusion
 * constraint, which is what guards a unit: "three sofa beds" is a SUM over
 * every overlapping booking, and no constraint that reads two rows at a time
 * can see it. architecture.md records the divergence; this file is the
 * evidence that the guarantee survived it.
 *
 * ── How to see it fail ─────────────────────────────────────────────────────
 *
 * A concurrency test nobody has watched fail proves nothing, so verify it
 * against a database with the trigger removed:
 *
 *   npm run db:reset
 *   docker exec -i supabase_db_palm-villa-app psql -U postgres -d postgres \
 *     -c 'drop trigger booking_line_extra_within_stock on booking_line;'
 *   npx vitest run --project integration lib/db/extras-stock.test.ts
 *
 * The first test reports several winners instead of one, because nothing is
 * left to refuse the losers. `npm run db:reset` restores it.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CHECK_IN = '2026-11-10'
const CHECK_OUT = '2026-11-13'

/** The seeded sofa bed, which is the property's only extra out of the box. */
async function sofaBed() {
  const extras = await listBookingExtras()
  const found = extras.find((extra) => extra.slug === 'sofa-bed')

  if (!found) {
    throw new Error('The seeded sofa-bed extra is missing.')
  }

  return found
}

/**
 * Sets the shelf count directly.
 *
 * The one place these tests go around a writer, deliberately:
 * `updateBookingExtra` refuses a count below what live bookings hold, which is
 * the very state half of these tests need to arrange.
 */
async function setStock(extraId: string, stock: number | null): Promise<void> {
  const propertyId = await currentPropertyId()

  const { error } = await dataClient()
    .from('booking_extra')
    .update({ stock })
    .eq('property_id', propertyId)
    .eq('id', extraId)

  if (error) {
    throw new Error(`Could not set the stock: ${error.message}`)
  }
}

describe('the stock trigger', () => {
  beforeEach(async () => {
    const extra = await sofaBed()

    await setStock(extra.id, 2)
  })

  test('lets exactly two of eight simultaneous bookings take the last two beds', async () => {
    const extra = await sofaBed()

    // Each on its own unit, so the exclusion constraint is not what refuses
    // them — the only thing they contend for is the sofa beds.
    const attempts = await Promise.all(
      ['3B-01', '3B-02', '3B-03', '3B-04', '4B-01', '4B-02', '4B-03', '4B-04'].map((ref, index) =>
        bookingInput({
          unitRef: ref,
          checkIn: CHECK_IN,
          checkOut: CHECK_OUT,
          guestName: `Racer ${index + 1}`,
          extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 1 }],
        }),
      ),
    )

    const results = await Promise.all(attempts.map((input) => createWalkInBooking(input)))

    expect(results.filter((result) => result.ok)).toHaveLength(2)
    expect(results.filter((result) => !result.ok)).toHaveLength(6)
  })

  test('refuses the booking that would take one more than there are', async () => {
    const extra = await sofaBed()

    await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })

    const result = await createWalkInBooking(
      await bookingInput({
        unitRef: '3B-02',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 1 }],
      }),
    )

    expect(result.ok).toBe(false)
  })

  test('leaves nothing behind when a booking loses on an extra', async () => {
    const extra = await sofaBed()

    await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })

    const before = await extrasInUse({ checkIn: CHECK_IN, checkOut: CHECK_OUT })

    await createWalkInBooking(
      await bookingInput({
        unitRef: '3B-02',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        guestName: 'Loser',
        extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 1 }],
      }),
    )

    // The whole transaction unwound — no half-built booking, no guest row with
    // a unit held behind it.
    const after = await extrasInUse({ checkIn: CHECK_IN, checkOut: CHECK_OUT })

    expect(after[extra.id]).toBe(before[extra.id])
  })

  test('a stay that does not overlap is free to take the same beds', async () => {
    const extra = await sofaBed()

    await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })

    // Starts the day the first one leaves. Half-open, exactly as a unit is.
    const result = await createWalkInBooking(
      await bookingInput({
        unitRef: '3B-02',
        checkIn: CHECK_OUT,
        checkOut: '2026-11-15',
        extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
      }),
    )

    expect(result.ok).toBe(true)
  })

  test('cancelling a booking puts its beds back', async () => {
    const extra = await sofaBed()

    const held = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })

    await cancelBooking({
      bookingId: held.id,
      reason: 'Testing that the beds come back',
      depositOutcome: 'keep',
      actorId: null,
    })

    const result = await createWalkInBooking(
      await bookingInput({
        unitRef: '3B-02',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
      }),
    )

    expect(result.ok).toBe(true)
  })

  test('an uncounted extra constrains nothing, however many are asked for', async () => {
    const extra = await sofaBed()

    await setStock(extra.id, null)

    const result = await createWalkInBooking(
      await bookingInput({
        unitRef: '3B-01',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 99 }],
      }),
    )

    expect(result.ok).toBe(true)
  })
})

describe('extrasInUse', () => {
  test('reports the busiest night of a range, not the total across it', async () => {
    const extra = await sofaBed()

    await setStock(extra.id, null)

    await givenBooking({
      unitRef: '3B-01',
      checkIn: '2026-11-20',
      checkOut: '2026-11-22',
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })
    await givenBooking({
      unitRef: '3B-02',
      checkIn: '2026-11-21',
      checkOut: '2026-11-23',
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 3 }],
    })

    // Two on the 20th, five on the 21st, three on the 22nd. The peak is what a
    // booking has to fit under, not the sum.
    const peak = await extrasInUse({ checkIn: '2026-11-20', checkOut: '2026-11-23' })

    expect(peak[extra.id]).toBe(5)
  })

  test('leaves a booking out of its own count, so an amendment is not its own rival', async () => {
    const extra = await sofaBed()

    await setStock(extra.id, null)

    const booking = await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 2 }],
    })

    const withoutItself = await extrasInUse({
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      excludeBookingId: booking.id,
    })

    expect(withoutItself[extra.id]).toBeUndefined()
  })
})

describe('updateBookingExtra', () => {
  test('refuses a count below what live bookings already hold', async () => {
    const extra = await sofaBed()

    await setStock(extra.id, 4)

    await givenBooking({
      unitRef: '3B-01',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      extras: [{ extraId: extra.id, name: 'Sofa bed', quantity: 3 }],
    })

    const current = await sofaBed()

    const result = await updateBookingExtra({
      extraId: current.id,
      draft: {
        slug: current.slug,
        name: current.name,
        description: current.description,
        feeCents: current.fee,
        stock: 1,
        bookable: true,
      },
      expectedUpdatedAt: current.updatedAt,
      actorId: '00000000-0000-0000-0000-000000000000',
    })

    // A figure that said one while three are in rooms this week would make
    // every later booking price against a lie.
    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('stock_below_committed')
  })
})
