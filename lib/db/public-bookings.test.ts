import { afterEach, describe, expect, test } from 'vitest'

import { hashPublicKey } from '@/lib/auth/access-token'
import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { bnd } from '@/lib/domain/money'
import { PUBLIC_LIMITS } from '@/lib/domain/public-booking'
import { dataClient } from '@/lib/supabase/data'

import { createWalkInBooking, getBookingById } from './bookings'
import { listDayPassHeadroom } from './day-passes'
import { listPendingDeposits, verifyDeposit } from './deposits'
import { currentPropertyId } from './property'
import { listDocumentsForBooking } from './documents'
import {
  attachPublicDocument,
  createPublicDayPassBooking,
  createPublicStayBooking,
  getBookingByAccessToken,
  notePublicAttempt,
  submitPublicBalanceTransfer,
  submitPublicTransfer,
  type CreatePublicDayPassInput,
  type CreatePublicStayInput,
} from './public-bookings'
import { listPaymentsForBooking } from './payments'
import { TEST_PNG, bookingInput, TEST_IDENTITY } from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The writes a customer makes for themselves (capabilities A1–A4).
 *
 * Two of these are concurrency tests, and they are the point of the file. G1
 * is already proved for units in no-double-booking.test.ts, but the public
 * stay path adds something that file does not cover: the writer picks the unit
 * *itself*, walking candidates until one is accepted. That loop could quietly
 * turn a lost race into a second booking on the same door, so it is fired at
 * every unit of a type at once and asked to produce exactly one booking per
 * door and no more.
 *
 * The day-pass check has no constraint behind it at all — a headcount against
 * a ceiling is a property of every row on a date, which no exclusion
 * constraint can express — so the advisory lock in
 * `create_public_day_pass_booking()` is the whole control, and this is its
 * evidence.
 *
 * ── How to see the day-pass one fail ───────────────────────────────────────
 *
 *   npm run db:start
 *   Edit create_public_day_pass_booking() in
 *     supabase/migrations/20260913000100_public_bookings_and_day_passes.sql,
 *     removing the `perform pg_advisory_xact_lock(...)` line.
 *   npm run db:reset
 *   npx vitest run --project integration lib/db/public-bookings.test.ts
 *
 * Several bookings then read the same headroom and all pass the check, so the
 * facility is oversold and the winner count exceeds the capacity.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CHECK_IN = '2026-10-05'
const CHECK_OUT = '2026-10-08'
const PASS_DATE = '2026-10-05'

function stayInput(overrides: Partial<CreatePublicStayInput> = {}): CreatePublicStayInput {
  return {
    identity: TEST_IDENTITY,
    unitTypeSlug: 'four-bedroom',
    range: { start: CHECK_IN, end: CHECK_OUT },
    guestName: 'Public Guest',
    guestPhone: '+673 700 0001',
    guestEmail: 'guest@example.test',
    vehicles: ['PV 1'],
    noVehicle: false,
    chargeableGuests: 2,
    exemptGuests: 0,
    total: bnd(750),
    securityDeposit: bnd(100),
    lines: [
      {
        type: 'accommodation',
        description: '4-bedroom × 3 nights',
        quantity: 3,
        unitPrice: bnd(250),
        amount: bnd(750),
      },
    ],
    ...overrides,
  }
}

function dayPassInput(overrides: Partial<CreatePublicDayPassInput> = {}): CreatePublicDayPassInput {
  return {
    identity: TEST_IDENTITY,
    date: PASS_DATE,
    party: [{ bandId: 'adult', label: 'Adult', count: 1 }],
    headcount: 1,
    chargeableGuests: 1,
    exemptGuests: 0,
    guestName: 'Pass Guest',
    guestPhone: '+673 700 0002',
    guestEmail: null,
    vehicles: [],
    noVehicle: true,
    total: bnd(10),
    lines: [
      {
        type: 'day_pass',
        description: 'Adult × 1',
        quantity: 1,
        unitPrice: bnd(10),
        amount: bnd(10),
      },
    ],
    ...overrides,
  }
}

/**
 * Sets a capacity on the pool and puts it back afterwards.
 *
 * The settings tables are not cleared between tests — they are configuration
 * rather than transactional data — so a test that changes one has to restore
 * it or every later test runs against a building somebody quietly resized.
 */
async function withPoolCapacity(capacity: number | null): Promise<void> {
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

afterEach(async () => {
  await withPoolCapacity(null)
})

describe('holding a unit from the public site', () => {
  test('creates a held booking with no payment and no deposit against it', async () => {
    const created = await createPublicStayBooking(stayInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const booking = await getBookingById(created.data.bookingId)

    expect(booking?.status).toBe('held')
    expect(booking?.stream).toBe('short_stay')
    // Nothing has been paid and nothing is being held: the customer has made a
    // booking, not a payment (prd.md §9.3). The money is asked for next.
    expect(booking?.paid).toBe(0)
    expect(booking?.securityDeposit).toBe(bnd(100))
    expect(await listPendingDeposits()).toHaveLength(0)
  })

  test('records the email, which no booking has ever carried before', async () => {
    const created = await createPublicStayBooking(stayInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const booking = await getBookingById(created.data.bookingId)

    expect(booking?.guestEmail).toBe('guest@example.test')
  })

  test('the held unit is no longer available to the desk', async () => {
    // The whole reason the booking is `held` rather than `draft`: its occupancy
    // row counts against the exclusion constraint, so a walk-in cannot be sold
    // the same door for the same nights.
    const created = await createPublicStayBooking(
      stayInput({ unitTypeSlug: 'semi-detached', guestPhone: '+673 700 0003' }),
    )

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const clash = await createWalkInBooking(
      await bookingInput({
        unitRef: created.data.unitRef as string,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
      }),
    )

    expect(clash.ok).toBe(false)

    if (clash.ok) return

    expect(clash.error.code).toBe('unit_unavailable')
  })

  test('assigns the lowest free door, and steps past one that is taken', async () => {
    // N9 [A]: staff assign units, so the customer names a type and the system
    // picks. Lowest ref first makes it predictable rather than arbitrary.
    const first = await createPublicStayBooking(stayInput({ unitTypeSlug: 'four-bedroom' }))

    expect(first.ok).toBe(true)

    if (!first.ok) return

    const second = await createPublicStayBooking(
      stayInput({ unitTypeSlug: 'four-bedroom', guestPhone: '+673 700 0004' }),
    )

    expect(second.ok).toBe(true)

    if (!second.ok) return

    expect(first.data.unitRef).toBeDefined()
    expect(second.data.unitRef).toBeDefined()
    expect(second.data.unitRef).not.toBe(first.data.unitRef)
    expect([first.data.unitRef, second.data.unitRef].sort()).toEqual(
      [first.data.unitRef, second.data.unitRef].sort(),
    )
  })

  test('refuses when every unit of the type is taken, and leaves no guest behind', async () => {
    // The 2-bedroom type exists and has zero units until N1 is answered, which
    // makes it the honest way to ask for a type with nothing free.
    const refused = await createPublicStayBooking(
      stayInput({ unitTypeSlug: 'two-bedroom', guestName: 'Rolled Back' }),
    )

    expect(refused.ok).toBe(false)

    if (refused.ok) return

    expect(refused.error.code).toBe('unit_unavailable')

    const { data } = await dataClient().from('guest').select('name').eq('name', 'Rolled Back')

    expect(data).toEqual([])
  })

  test('lets exactly one booking take each door when eight arrive at once', async () => {
    // Six semi-detached units are seeded, so six of the eight should win — each
    // on a different door — and two should be refused. The candidate loop is
    // what makes a lost race into a different room; the exclusion constraint is
    // what makes it a refusal once there are no rooms left.
    const attempts = Array.from({ length: 8 }, (_unused, index) =>
      stayInput({
        unitTypeSlug: 'semi-detached',
        guestName: `Racer ${index + 1}`,
        guestPhone: `+673 800 ${String(index).padStart(4, '0')}`,
      }),
    )

    const results = await Promise.all(attempts.map((input) => createPublicStayBooking(input)))

    const winners = results.filter((result) => result.ok)
    const losers = results.filter((result) => !result.ok)

    expect(winners).toHaveLength(6)
    expect(losers).toHaveLength(2)

    // The part a single-winner test would not catch: two bookings on one door.
    const doors = winners.map((result) => (result.ok ? result.data.unitRef : null))

    expect(new Set(doors).size).toBe(6)
  })
})

describe('the cap on unpaid bookings per phone', () => {
  test('refuses once a number is holding its limit, and says so', async () => {
    const phone = '+673 900 0001'

    for (let index = 0; index < PUBLIC_LIMITS.openBookingsPerPhone; index += 1) {
      const created = await createPublicStayBooking(
        stayInput({ unitTypeSlug: 'three-bedroom', guestPhone: phone }),
      )

      expect(created.ok).toBe(true)
    }

    const refused = await createPublicStayBooking(
      stayInput({ unitTypeSlug: 'three-bedroom', guestPhone: phone }),
    )

    expect(refused.ok).toBe(false)

    if (refused.ok) return

    expect(refused.error.code).toBe('too_many_open_bookings')
  })

  test('counts only the bookings a customer made themselves', async () => {
    // A desk taking four advance bookings for one regular is doing its job.
    // The cap keys on `created_by is null`, which is what tells the two apart.
    const phone = '+673 900 0002'

    for (let index = 0; index < 4; index += 1) {
      const walkIn = await createWalkInBooking(
        await bookingInput({
          unitRef: `3B-${String(index + 20).padStart(2, '0')}`,
          checkIn: CHECK_IN,
          checkOut: CHECK_OUT,
          guestPhone: phone,
        }),
      )

      expect(walkIn.ok).toBe(true)
    }

    const created = await createPublicStayBooking(
      stayInput({ unitTypeSlug: 'three-bedroom', guestPhone: phone }),
    )

    expect(created.ok).toBe(true)
  })
})

describe('selling a day pass', () => {
  test('creates a held booking with a date and a headcount, and no unit', async () => {
    const created = await createPublicDayPassBooking(dayPassInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const booking = await getBookingById(created.data.bookingId)

    expect(booking?.stream).toBe('day_pass')
    expect(booking?.status).toBe('held')
    // prd.md §6.1: a day pass occupies no unit. Its date lives on the pass.
    expect(booking?.stay).toBeNull()
    expect(booking?.dayPass).toEqual({ date: PASS_DATE, headcount: 1 })
    expect(booking?.securityDeposit).toBe(0)
  })

  test('counts against the headroom for its date and no other', async () => {
    await createPublicDayPassBooking(dayPassInput({ headcount: 4, party: [] }))

    const headroom = await listDayPassHeadroom({ from: PASS_DATE, to: '2026-10-06' })

    expect(headroom[0]).toMatchObject({ date: PASS_DATE, taken: 4 })
    expect(headroom[1]).toMatchObject({ date: '2026-10-06', taken: 0 })
  })

  test('is unlimited while no capacity has been agreed', async () => {
    // prd.md C2: every capacity ships null, so this is the path production
    // actually runs until the owner types a number.
    const created = await createPublicDayPassBooking(dayPassInput({ headcount: 500, party: [] }))

    expect(created.ok).toBe(true)

    const headroom = await listDayPassHeadroom({ from: PASS_DATE, to: PASS_DATE })

    expect(headroom[0]?.capacity).toBeNull()
  })

  test('refuses a party that will not fit, and says how many places are left', async () => {
    await withPoolCapacity(5)
    await createPublicDayPassBooking(dayPassInput({ headcount: 3, party: [] }))

    const refused = await createPublicDayPassBooking(
      dayPassInput({ headcount: 3, party: [], guestPhone: '+673 700 0009' }),
    )

    expect(refused.ok).toBe(false)

    if (refused.ok) return

    expect(refused.error.code).toBe('capacity_exceeded')
    expect(refused.error.remaining).toBe(2)
  })

  test('admits exactly the capacity when eight buyers arrive at once', async () => {
    // No constraint can express this rule, so the advisory lock is the whole
    // control. Eight parties of one against a ceiling of three.
    await withPoolCapacity(3)

    const attempts = Array.from({ length: 8 }, (_unused, index) =>
      dayPassInput({
        guestName: `Swimmer ${index + 1}`,
        guestPhone: `+673 850 ${String(index).padStart(4, '0')}`,
      }),
    )

    const results = await Promise.all(attempts.map((input) => createPublicDayPassBooking(input)))

    expect(results.filter((result) => result.ok)).toHaveLength(3)
    expect(results.filter((result) => !result.ok)).toHaveLength(5)

    const headroom = await listDayPassHeadroom({ from: PASS_DATE, to: PASS_DATE })

    expect(headroom[0]?.taken).toBe(3)
  })

  test('a cancelled pass gives its places back', async () => {
    await withPoolCapacity(2)

    const created = await createPublicDayPassBooking(dayPassInput({ headcount: 2, party: [] }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const full = await createPublicDayPassBooking(
      dayPassInput({ headcount: 1, party: [], guestPhone: '+673 700 0011' }),
    )

    expect(full.ok).toBe(false)

    // The same status rule the exclusion constraint uses: cancelled releases.
    const { error } = await dataClient()
      .from('booking')
      .update({ status: 'cancelled' })
      .eq('id', created.data.bookingId)

    expect(error).toBeNull()

    const afterCancel = await createPublicDayPassBooking(
      dayPassInput({ headcount: 1, party: [], guestPhone: '+673 700 0012' }),
    )

    expect(afterCancel.ok).toBe(true)
  })
})

describe('the private link', () => {
  test('finds the booking it was minted for', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const found = await getBookingByAccessToken(created.data.accessToken)

    expect(found?.id).toBe(created.data.bookingId)
    expect(found?.accessToken).toBe(created.data.accessToken)
  })

  test('finds nothing for a token of the wrong shape, without querying', async () => {
    expect(await getBookingByAccessToken('nope')).toBeNull()
    expect(await getBookingByAccessToken('')).toBeNull()
  })

  test('finds nothing for a well-formed token nobody holds', async () => {
    expect(await getBookingByAccessToken('AAAAAAAAAAAAAAAAAAAAAA')).toBeNull()
  })
})

describe('saying the transfer has been made', () => {
  test('raises a pending deposit for a stay, and no payment', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const submitted = await submitPublicTransfer(created.data.accessToken)

    expect(submitted.ok).toBe(true)

    if (!submitted.ok) return

    expect(submitted.data.raised).toBe('deposit')
    expect(submitted.data.amount).toBe(bnd(100))

    const booking = await getBookingById(created.data.bookingId)

    expect(booking?.status).toBe('awaiting_payment_verification')

    // The invariant prd.md §9.1 spends a paragraph on: the deposit is not a
    // payment, so the stay is still owed in full and nothing reads as short.
    expect(booking?.paid).toBe(0)

    const pending = await listPendingDeposits()

    expect(pending).toHaveLength(1)
    expect(pending[0]?.amount).toBe(bnd(100))
    expect(pending[0]?.collectedAt).toBeNull()
    expect(pending[0]?.promisedAt).not.toBeNull()
    expect(pending[0]?.stage).toBe('awaiting_verification')
  })

  test('raises both rows when the customer settles the stay up front', async () => {
    // The second of the two cases the client named on 10 September 2026: "the
    // deposit only, or the full amount with the deposit". One transfer, two
    // rows, because a refundable liability and revenue are different money.
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const submitted = await submitPublicTransfer(created.data.accessToken, 'everything')

    expect(submitted.ok).toBe(true)

    if (!submitted.ok) return

    expect(submitted.data.raised).toBe('deposit_and_payment')
    // What the customer sends in one go: the deposit plus the stay.
    expect(submitted.data.amount).toBe(bnd(100) + bnd(750))

    const pending = await listPendingDeposits()

    expect(pending).toHaveLength(1)
    expect(pending[0]?.amount).toBe(bnd(100))

    const { data } = await dataClient()
      .from('payment')
      .select('expected_amount_cents, amount_cents, status')
      .eq('booking_id', created.data.bookingId)

    expect(data).toHaveLength(1)
    expect(data?.[0]).toMatchObject({
      expected_amount_cents: bnd(750),
      amount_cents: null,
      status: 'pending_verification',
    })

    // Still nothing paid: both rows are promises until somebody looks.
    const booking = await getBookingById(created.data.bookingId)

    expect(booking?.paid).toBe(0)
  })

  test('a day pass ignores the choice, because there is nothing to defer', async () => {
    // The form never offers it; a hand-written request could still send it.
    const created = await createPublicDayPassBooking(dayPassInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const submitted = await submitPublicTransfer(created.data.accessToken, 'everything')

    expect(submitted.ok).toBe(true)

    if (!submitted.ok) return

    expect(submitted.data.raised).toBe('payment')
    expect(submitted.data.amount).toBe(bnd(10))
    expect(await listPendingDeposits()).toHaveLength(0)
  })

  test('raises a payment for a day pass, because there is no unit to secure', async () => {
    const created = await createPublicDayPassBooking(dayPassInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const submitted = await submitPublicTransfer(created.data.accessToken)

    expect(submitted.ok).toBe(true)

    if (!submitted.ok) return

    expect(submitted.data.raised).toBe('payment')
    expect(submitted.data.amount).toBe(bnd(10))
    expect(await listPendingDeposits()).toHaveLength(0)
  })

  test('a promised deposit is not on the held ledger', async () => {
    // E1 answers what the property owes back right now. Money nobody has seen
    // is not part of that answer.
    const { listHeldDeposits } = await import('./deposits')

    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await submitPublicTransfer(created.data.accessToken)

    expect(await listHeldDeposits()).toHaveLength(0)
    expect(await listPendingDeposits()).toHaveLength(1)
  })

  test('refuses a second press, rather than raising a second row', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await submitPublicTransfer(created.data.accessToken)

    const again = await submitPublicTransfer(created.data.accessToken)

    expect(again.ok).toBe(false)

    if (again.ok) return

    expect(again.error.code).toBe('status_changed')
    expect(await listPendingDeposits()).toHaveLength(1)
  })

  test('two simultaneous presses raise one row between them', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const [first, second] = await Promise.all([
      submitPublicTransfer(created.data.accessToken),
      submitPublicTransfer(created.data.accessToken),
    ])

    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1)
    expect(await listPendingDeposits()).toHaveLength(1)
  })

  test('says nothing useful about a token nobody holds', async () => {
    const submitted = await submitPublicTransfer('AAAAAAAAAAAAAAAAAAAAAA')

    expect(submitted.ok).toBe(false)

    if (submitted.ok) return

    expect(submitted.error.code).toBe('not_found')
  })
})

describe('the attempt counter', () => {
  test('allows up to the limit and refuses past it', async () => {
    const keyHash = hashPublicKey('203.0.113.50')

    for (let index = 0; index < 3; index += 1) {
      expect(
        await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 3600, limit: 3 }),
      ).toBe(true)
    }

    expect(
      await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 3600, limit: 3 }),
    ).toBe(false)
  })

  test('counts each caller separately', async () => {
    const one = hashPublicKey('203.0.113.51')
    const two = hashPublicKey('203.0.113.52')

    await notePublicAttempt({ kind: 'booking:ip', keyHash: one, windowSeconds: 3600, limit: 1 })

    expect(
      await notePublicAttempt({ kind: 'booking:ip', keyHash: two, windowSeconds: 3600, limit: 1 }),
    ).toBe(true)
  })

  test('counts each kind separately', async () => {
    // Booking and pressing "I have transferred" are different acts with
    // different limits, and one must not exhaust the other.
    const keyHash = hashPublicKey('203.0.113.53')

    await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 3600, limit: 1 })

    expect(
      await notePublicAttempt({ kind: 'submit:ip', keyHash, windowSeconds: 3600, limit: 1 }),
    ).toBe(true)
  })

  test('starts again in the next window', async () => {
    // A one-second window, so the boundary is reachable in a test. The counter
    // keys on the floor of now/window, so the next second is a new row.
    const keyHash = hashPublicKey('203.0.113.54')

    expect(
      await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 1, limit: 1 }),
    ).toBe(true)
    expect(
      await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 1, limit: 1 }),
    ).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(
      await notePublicAttempt({ kind: 'booking:ip', keyHash, windowSeconds: 1, limit: 1 }),
    ).toBe(true)
  })
})

/* ── What the customer sends us (capabilities A6, A7) ─────────────────────── */

/**
 * The upload path, from the token inwards.
 *
 * What these prove is the half `documents.test.ts` cannot: that the right rows
 * are found from a token alone. The filing rule is the interesting one, and it
 * is prd.md §10.3's — a customer who settles everything up front makes ONE
 * transfer against TWO rows, so one screenshot has to reach both or one of the
 * two accounting packs is assembled without its evidence.
 */
describe('a file the customer sends through their own link', () => {
  test('files an identity document against the booking', async () => {
    // Arrange
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    // Act
    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'identity',
      bytes: TEST_PNG,
      filename: 'ic.png',
    })

    // Assert
    expect(result.ok).toBe(true)

    const held = await listDocumentsForBooking(created.data.bookingId, 'identity')

    expect(held).toHaveLength(1)
    // Nobody performed it, which is what every public write records.
    expect(held[0]?.uploadedBy).toBeNull()
  })

  test('files one slip against the deposit for the ordinary online stay', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await submitPublicTransfer(created.data.accessToken)

    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'transfer.png',
    })

    expect(result.ok).toBe(true)

    const slips = await listDocumentsForBooking(created.data.bookingId, 'payment_slip')

    expect(slips).toHaveLength(1)
    expect(slips[0]?.depositId).not.toBeNull()
    expect(slips[0]?.paymentId).toBeNull()
  })

  test('files the same slip against both rows when the stay was settled up front', async () => {
    // One transfer, two rows, and they stay two (prd.md §10.3). Each carries
    // its own seven-year clock and its own pack, so they cannot share one row.
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await submitPublicTransfer(created.data.accessToken, 'everything')

    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'transfer.png',
    })

    expect(result.ok).toBe(true)

    const slips = await listDocumentsForBooking(created.data.bookingId, 'payment_slip')

    expect(slips).toHaveLength(2)
    expect(slips.filter((slip) => slip.depositId !== null)).toHaveLength(1)
    expect(slips.filter((slip) => slip.paymentId !== null)).toHaveLength(1)
  })

  test('files one slip against the payment for a day pass, which has no deposit', async () => {
    const created = await createPublicDayPassBooking(dayPassInput())

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await submitPublicTransfer(created.data.accessToken)

    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'transfer.png',
    })

    expect(result.ok).toBe(true)

    const slips = await listDocumentsForBooking(created.data.bookingId, 'payment_slip')

    expect(slips).toHaveLength(1)
    expect(slips[0]?.paymentId).not.toBeNull()
    expect(slips[0]?.depositId).toBeNull()
  })

  test('refuses a slip before the customer has said they transferred', async () => {
    // There is no deposit and no payment row yet, so there is nothing for the
    // slip to be evidence OF. A sequence to explain, not an error to log.
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'early.png',
    })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('nothing_to_evidence')
  })

  test('refuses a token nobody holds', async () => {
    const result = await attachPublicDocument({
      token: 'AAAAAAAAAAAAAAAAAAAAAA',
      kind: 'identity',
      bytes: TEST_PNG,
      filename: 'ic.png',
    })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('not_found')
  })

  test('refuses once the booking is closed', async () => {
    // A cancelled booking is not a place to file new records, and a link that
    // outlives its booking should stop doing anything.
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await dataClient()
      .from('booking')
      .update({ status: 'cancelled' })
      .eq('id', created.data.bookingId)

    const result = await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'identity',
      bytes: TEST_PNG,
      filename: 'ic.png',
    })

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('booking_closed')
  })

  test('a second identity document replaces the first, rather than piling up', async () => {
    const created = await createPublicStayBooking(stayInput({ unitTypeSlug: 'three-bedroom' }))

    expect(created.ok).toBe(true)

    if (!created.ok) return

    await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'identity',
      bytes: TEST_PNG,
      filename: 'dark.png',
    })

    await attachPublicDocument({
      token: created.data.accessToken,
      kind: 'identity',
      bytes: TEST_PNG,
      filename: 'better.png',
    })

    const held = await listDocumentsForBooking(created.data.bookingId, 'identity')

    expect(held).toHaveLength(1)
    expect(held[0]?.filename).toBe('better.png')
  })
})

/**
 * A guest who sent only the deposit transferring the rest ahead (capability
 * A12, supabase/migrations/20261008000300), and the slip for each transfer
 * landing on that transfer alone.
 *
 * Dated from today, because the rule that matters most is a date: the rest is
 * offered until the day before arrival, and paid at the gate on the day.
 */
describe('paying the rest ahead', () => {
  const ARRIVAL = addDays(todayInBrunei(), 10)
  const STAY_TOTAL = bnd(750)

  async function givenDepositOnlyStay(
    overrides: Partial<CreatePublicStayInput> = {},
  ): Promise<{ token: string; bookingId: string }> {
    const created = await createPublicStayBooking(
      stayInput({
        unitTypeSlug: 'three-bedroom',
        range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
        ...overrides,
      }),
    )

    if (!created.ok) {
      throw new Error(`Test setup could not book: ${created.error.message}`)
    }

    const submitted = await submitPublicTransfer(created.data.accessToken, 'deposit_only')

    if (!submitted.ok) {
      throw new Error(`Test setup could not submit the deposit: ${submitted.error.message}`)
    }

    return { token: created.data.accessToken, bookingId: created.data.bookingId }
  }

  async function verifyTheDeposit(bookingId: string): Promise<void> {
    const deposit = (await listPendingDeposits()).find((row) => row.bookingId === bookingId)

    if (!deposit) {
      throw new Error('Test setup expected a promised deposit.')
    }

    const verified = await verifyDeposit({
      depositId: deposit.id,
      observedAmount: bnd(100),
      match: 'reference',
      actorId: null,
    })

    if (!verified.ok) {
      throw new Error(`Test setup could not verify the deposit: ${verified.error.message}`)
    }
  }

  test('raises the whole stay as a transfer to check, and tells the office', async () => {
    const { token, bookingId } = await givenDepositOnlyStay()

    const result = await submitPublicBalanceTransfer(token, STAY_TOTAL)

    expect(result.ok && result.data.amount).toBe(STAY_TOTAL)

    const payments = await listPaymentsForBooking(bookingId)

    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({
      method: 'bank_transfer',
      status: 'pending_verification',
      expected: STAY_TOTAL,
    })

    const events = await auditEventsFor(bookingId)

    expect(
      events.find((event) => event.action === 'booking.balance_submitted')?.after,
    ).toMatchObject({ amount_cents: STAY_TOTAL })
    // The booking's status is the deposit's business, not this transfer's.
    expect((await getBookingById(bookingId))?.status).toBe('awaiting_payment_verification')
  })

  test('is offered once the deposit has confirmed the booking too', async () => {
    const { token, bookingId } = await givenDepositOnlyStay()
    await verifyTheDeposit(bookingId)

    expect((await submitPublicBalanceTransfer(token, STAY_TOTAL)).ok).toBe(true)
  })

  test('refuses a second press while the first is waiting to be checked', async () => {
    const { token } = await givenDepositOnlyStay()
    await submitPublicBalanceTransfer(token, STAY_TOTAL)

    const again = await submitPublicBalanceTransfer(token, STAY_TOTAL)

    expect(!again.ok && again.error.code).toBe('already_pending')
  })

  test('refuses a figure that is no longer what is owed', async () => {
    const { token, bookingId } = await givenDepositOnlyStay()

    const result = await submitPublicBalanceTransfer(token, bnd(500))

    expect(!result.ok && result.error.code).toBe('changed')
    expect(await listPaymentsForBooking(bookingId)).toHaveLength(0)
  })

  test('on the day of arrival it is paid at the gate instead', async () => {
    const today = todayInBrunei()
    const { token } = await givenDepositOnlyStay({
      range: { start: today, end: addDays(today, 3) },
    })

    const result = await submitPublicBalanceTransfer(token, STAY_TOTAL)

    expect(!result.ok && result.error.code).toBe('arrival_day')
  })

  test('is not offered before the deposit is announced, or for a guest who sent everything', async () => {
    const held = await createPublicStayBooking(
      stayInput({
        unitTypeSlug: 'three-bedroom',
        range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
      }),
    )

    if (!held.ok) throw new Error(held.error.message)

    const early = await submitPublicBalanceTransfer(held.data.accessToken, STAY_TOTAL)

    expect(!early.ok && early.error.code).toBe('not_offered')

    await submitPublicTransfer(held.data.accessToken, 'everything')

    const already = await submitPublicBalanceTransfer(held.data.accessToken, STAY_TOTAL)

    expect(!already.ok && already.error.code).toBe('already_pending')
  })

  test('is not offered on a day pass, which is paid in one transfer', async () => {
    const pass = await createPublicDayPassBooking(
      dayPassInput({ date: addDays(todayInBrunei(), 5) }),
    )

    if (!pass.ok) throw new Error(pass.error.message)

    await submitPublicTransfer(pass.data.accessToken)

    const result = await submitPublicBalanceTransfer(pass.data.accessToken, bnd(10))

    expect(!result.ok && result.error.code).toBe('not_offered')
  })

  test('the slip for the rest lands on the rest alone, and the deposit keeps its own', async () => {
    const { token, bookingId } = await givenDepositOnlyStay()

    await attachPublicDocument({
      token,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'deposit.png',
      target: 'first',
    })
    await submitPublicBalanceTransfer(token, STAY_TOTAL)

    const [rest] = await listPaymentsForBooking(bookingId)

    if (!rest) throw new Error('Test setup expected the transfer for the rest.')

    const sent = await attachPublicDocument({
      token,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'rest.png',
      target: `payment:${rest.id}`,
    })

    expect(sent.ok).toBe(true)

    const slips = await listDocumentsForBooking(bookingId, 'payment_slip')

    expect(slips).toHaveLength(2)
    expect(slips.filter((slip) => slip.depositId !== null)).toHaveLength(1)
    expect(slips.filter((slip) => slip.paymentId === rest.id)).toHaveLength(1)

    // A better photograph of the rest replaces that one, and only that one.
    const depositSlip = slips.find((slip) => slip.depositId !== null)

    await attachPublicDocument({
      token,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'rest-again.png',
      target: `payment:${rest.id}`,
    })

    const after = await listDocumentsForBooking(bookingId, 'payment_slip')

    expect(after).toHaveLength(2)
    expect(after.find((slip) => slip.depositId !== null)?.id).toBe(depositSlip?.id)
  })

  test('takes no slip for a transfer already checked against the bank', async () => {
    const { token, bookingId } = await givenDepositOnlyStay()
    await verifyTheDeposit(bookingId)

    const result = await attachPublicDocument({
      token,
      kind: 'payment_slip',
      bytes: TEST_PNG,
      filename: 'late.png',
      target: 'first',
    })

    expect(!result.ok && result.error.code).toBe('transfer_checked')
  })
})

/**
 * The ID a booking made online now has to carry (capability A7,
 * supabase/migrations/20261008000400). What matters is that the two arrive
 * together or not at all: a booking with no ID, or an ID with no booking,
 * is the one outcome the wrapper exists to make impossible.
 */
describe('the ID a public booking arrives with', () => {
  const ARRIVAL = addDays(todayInBrunei(), 20)

  async function identityObjectCount(): Promise<number> {
    const { data, error } = await dataClient()
      .storage.from('identity-docs')
      .list(await currentPropertyId(), { limit: 1000 })

    if (error) {
      throw new Error(`Could not list the stored IDs: ${error.message}`)
    }

    return (data ?? []).length
  }

  async function guestsWithPhone(phone: string): Promise<number> {
    const { count, error } = await dataClient()
      .from('guest')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)

    if (error) {
      throw new Error(error.message)
    }

    return count ?? 0
  }

  test('a stay is filed with one ID, sent by the guest, kept a year past check-out', async () => {
    const created = await createPublicStayBooking(
      stayInput({
        unitTypeSlug: 'three-bedroom',
        range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
      }),
    )

    if (!created.ok) throw new Error(created.error.message)

    const held = await listDocumentsForBooking(created.data.bookingId, 'identity')

    expect(held).toHaveLength(1)
    expect(held[0]?.uploadedBy).toBeNull()
    // Twelve months after check-out, at midnight in Brunei — the instant, so the
    // test does not depend on the timezone the database prints it in.
    const checkOut = addDays(ARRIVAL, 3)
    const yearOn = `${Number(checkOut.slice(0, 4)) + 1}${checkOut.slice(4)}T00:00:00+08:00`

    expect(new Date(held[0]!.retainUntil).getTime()).toBe(new Date(yearOn).getTime())
  })

  test('so is a day pass', async () => {
    const created = await createPublicDayPassBooking(
      dayPassInput({ date: addDays(todayInBrunei(), 6) }),
    )

    if (!created.ok) throw new Error(created.error.message)

    expect(await listDocumentsForBooking(created.data.bookingId, 'identity')).toHaveLength(1)
  })

  test('a file that is not an image or a PDF books nothing and stores nothing', async () => {
    const before = await identityObjectCount()

    const created = await createPublicStayBooking(
      stayInput({
        unitTypeSlug: 'three-bedroom',
        range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
        guestPhone: '+673 700 0901',
        identity: { bytes: new TextEncoder().encode('not a picture at all'), filename: 'ic.txt' },
      }),
    )

    expect(!created.ok && created.error.code).toBe('identity_unreadable')
    expect(await guestsWithPhone('+673 700 0901')).toBe(0)
    expect(await identityObjectCount()).toBe(before)
  })

  test('an ID the database refuses takes the booking with it, and its file', async () => {
    // With no retention period for IDs, attach_document refuses every one —
    // the misconfiguration that would otherwise leave bookings with no ID.
    const propertyId = await currentPropertyId()
    const before = await identityObjectCount()
    const { data: kept } = await dataClient()
      .from('document_retention')
      .select('months')
      .eq('property_id', propertyId)
      .eq('kind', 'identity')
      .single()

    await dataClient()
      .from('document_retention')
      .delete()
      .eq('property_id', propertyId)
      .eq('kind', 'identity')

    try {
      const created = await createPublicStayBooking(
        stayInput({
          unitTypeSlug: 'three-bedroom',
          range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
          guestPhone: '+673 700 0902',
        }),
      )

      expect(!created.ok && created.error.code).toBe('identity_refused')
      expect(await guestsWithPhone('+673 700 0902')).toBe(0)
      expect(await identityObjectCount()).toBe(before)
    } finally {
      await dataClient()
        .from('document_retention')
        .insert({ property_id: propertyId, kind: 'identity', months: kept?.months ?? 12 })
    }
  })

  test('a booking refused for its dates leaves no ID behind', async () => {
    // The seed's two-bedroom has no units, so nothing of that type is ever free.
    const before = await identityObjectCount()
    const refused = await createPublicStayBooking(
      stayInput({
        unitTypeSlug: 'two-bedroom',
        range: { start: ARRIVAL, end: addDays(ARRIVAL, 3) },
        guestPhone: '+673 700 0903',
      }),
    )

    expect(!refused.ok && refused.error.code).toBe('unit_unavailable')
    expect(await guestsWithPhone('+673 700 0903')).toBe(0)
    expect(await identityObjectCount()).toBe(before)
  })
})
