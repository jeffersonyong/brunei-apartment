import { describe, expect, test } from 'vitest'

import { isEntryToken } from '@/lib/domain/entry-qr'

import { checkInBooking } from './deposits'
import { findBookingIdByEntryToken, getEntryToken, reissueEntryToken } from './entry-qr'
import { testActorId } from './test/auth'
import {
  givenBooking,
  givenCheckedInBooking,
  givenConfirmedTransferBooking,
  givenDepartedBooking,
  givenTransferBooking,
} from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The entry code (capability A8's QR half, D3; migration 20260929000100).
 *
 * The code is issued by a trigger rather than by any of the paths that
 * confirm a booking, so what needs a database to prove is exactly that: the
 * ordinary confirm paths get a code without asking for one, a booking that is
 * not confirmed has none, a later move never replaces it, and replacing it on
 * purpose kills the old one and says who did it.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const STAY = { checkIn: '2026-11-02', checkOut: '2026-11-05' }

async function eventsNamed(bookingId: string, action: string) {
  return (await auditEventsFor(bookingId)).filter((event) => event.action === action)
}

async function tokenOf(bookingId: string): Promise<string> {
  const token = await getEntryToken(bookingId)

  if (token === null) {
    throw new Error('Expected the booking to have an entry code.')
  }

  return token
}

describe('a code is issued when a booking is confirmed', () => {
  test('a walk-in paid at the desk is confirmed with a code', async () => {
    const booking = await givenBooking({ unitRef: '3B-01', ...STAY })

    expect(isEntryToken(await tokenOf(booking.id))).toBe(true)
  })

  test('issuing it adds nothing to the trail, which still opens with the booking', async () => {
    const booking = await givenBooking({ unitRef: '3B-02', ...STAY })
    const actions = (await auditEventsFor(booking.id)).map((event) => event.action)

    expect(actions[0]).toBe('booking.created_walk_in')
    expect(actions.filter((action) => action.startsWith('booking.qr_'))).toEqual([])
  })

  test('a transfer nobody has checked yet leaves the booking without one', async () => {
    const { booking } = await givenTransferBooking({ unitRef: '3B-03', ...STAY })

    await expect(getEntryToken(booking.id)).resolves.toBeNull()
  })

  test('verifying the deposit that confirms the booking issues it', async () => {
    const { booking } = await givenConfirmedTransferBooking({ unitRef: '3B-04', ...STAY })

    expect(isEntryToken(await tokenOf(booking.id))).toBe(true)
  })

  test('two bookings never share a code', async () => {
    const first = await givenBooking({ unitRef: '3B-05', ...STAY })
    const second = await givenBooking({ unitRef: '3B-06', ...STAY })

    expect(await tokenOf(first.id)).not.toBe(await tokenOf(second.id))
  })

  test('checking the guest in keeps the code they were confirmed with', async () => {
    const booking = await givenBooking({ unitRef: '3B-07', ...STAY })
    const before = await tokenOf(booking.id)

    const checkedIn = await checkInBooking({ bookingId: booking.id, actorId: null })

    expect(checkedIn.ok).toBe(true)
    await expect(getEntryToken(booking.id)).resolves.toBe(before)
  })
})

describe('finding a booking by its code', () => {
  test('finds the booking the code belongs to', async () => {
    const booking = await givenBooking({ unitRef: '3B-01', ...STAY })

    await expect(findBookingIdByEntryToken(await tokenOf(booking.id))).resolves.toBe(booking.id)
  })

  test('a malformed code and an unknown one find nothing alike', async () => {
    await expect(findBookingIdByEntryToken('PV-0042')).resolves.toBeNull()
    await expect(findBookingIdByEntryToken("x' or '1'='1")).resolves.toBeNull()
    await expect(findBookingIdByEntryToken('Ab3xY9-_ZqRs7TuVwX2Kd0')).resolves.toBeNull()
  })
})

describe('replacing a code', () => {
  test('issues a new one, kills the old one, and names who did it', async () => {
    const booking = await givenBooking({ unitRef: '3B-01', ...STAY })
    const old = await tokenOf(booking.id)
    const actorId = await testActorId()

    const result = await reissueEntryToken({ bookingId: booking.id, actorId })

    expect(result.ok).toBe(true)

    if (!result.ok) {
      return
    }

    expect(isEntryToken(result.token)).toBe(true)
    expect(result.token).not.toBe(old)
    await expect(getEntryToken(booking.id)).resolves.toBe(result.token)
    await expect(findBookingIdByEntryToken(old)).resolves.toBeNull()
    await expect(findBookingIdByEntryToken(result.token)).resolves.toBe(booking.id)

    const replaced = await eventsNamed(booking.id, 'booking.qr_reissued')

    expect(replaced).toHaveLength(1)
    expect(replaced[0]?.actorId).toBe(actorId)
    // A live credential is not copied into the append-only trail.
    expect(JSON.stringify(replaced[0])).not.toContain(result.token)
    expect(JSON.stringify(replaced[0])).not.toContain(old)
  })

  test('still works for a guest already checked in', async () => {
    const { booking } = await givenCheckedInBooking({ unitRef: '3B-02', ...STAY })

    await expect(
      reissueEntryToken({ bookingId: booking.id, actorId: await testActorId() }),
    ).resolves.toMatchObject({ ok: true })
  })

  test('refuses a booking that was never confirmed, since it has no code', async () => {
    const { booking } = await givenTransferBooking({ unitRef: '3B-03', ...STAY })

    await expect(
      reissueEntryToken({ bookingId: booking.id, actorId: await testActorId() }),
    ).resolves.toEqual({ ok: false, error: 'not_confirmed' })
  })

  test('refuses a booking that has ended, and leaves its code as it was', async () => {
    const { booking } = await givenDepartedBooking({ unitRef: '3B-04', ...STAY })
    const old = await tokenOf(booking.id)

    await expect(
      reissueEntryToken({ bookingId: booking.id, actorId: await testActorId() }),
    ).resolves.toEqual({ ok: false, error: 'booking_closed' })
    await expect(getEntryToken(booking.id)).resolves.toBe(old)
  })

  test('refuses a booking that does not exist', async () => {
    await expect(
      reissueEntryToken({
        bookingId: '00000000-0000-0000-0000-000000000000',
        actorId: await testActorId(),
      }),
    ).resolves.toEqual({ ok: false, error: 'not_found' })
  })
})
