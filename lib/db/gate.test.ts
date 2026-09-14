import { describe, expect, test } from 'vitest'

import { addDays, todayInBrunei } from '@/lib/domain/dates'
import { gateCashStalenessOf } from '@/lib/domain/gate'
import { bnd, type Cents } from '@/lib/domain/money'
import { dataClient } from '@/lib/supabase/data'

import { createWalkInBooking, transitionBooking } from './bookings'
import { admitDayPass } from './day-pass-admission'
import {
  checkInBooking,
  getDepositByBookingId,
  recordBookingDeposit,
  topUpBookingDeposit,
  verifyDeposit,
} from './deposits'
import {
  getGateBooking,
  listGateBookings,
  searchGateBookings,
  type GateBooking,
  type GateReadOptions,
} from './gate'
import { recordInspection } from './inspections'
import { listPaymentsForBooking, recordCashPayment } from './payments'
import { currentPropertyId } from './property'
import { createPublicDayPassBooking, type CreatePublicDayPassInput } from './public-bookings'
import {
  bookingInput,
  givenBooking,
  givenBookingInState,
  givenCheckedInBooking,
  givenConfirmedTransferBooking,
  givenDepartedBooking,
  givenStaffAccount,
  givenTransferBooking,
} from './test/factory'
import { markUnitReady } from './units'

/**
 * The gate's reads against the real database (capabilities D1–D6), and its one
 * write of its own: admitting a day pass (N54). Checking in and out, and the
 * cash the gate takes, are the office's own writers, exercised here for what
 * the gate reads back — beside the booking the office holds for the gate to
 * collect (B17), whose writer refuses any day but today.
 *
 * "Today" is passed in rather than read from the clock for the reads, so they
 * describe a fixed day and cannot drift into a different answer at midnight in
 * Brunei. The day sits inside the public day-pass window the other public tests
 * use. Three things are the exception, because the database reads the clock
 * itself: `admit_day_pass()` checks today in the property's own timezone,
 * `unit_state()` reports a unit's last stay only for the real today, and
 * `create_walk_in_booking()` holds a booking for the gate only when it starts
 * today — so those tests date their bookings by the same clock.
 */

const TODAY = '2026-10-05'
const YESTERDAY = addDays(TODAY, -1)
const TOMORROW = addDays(TODAY, 1)
const LATER = addDays(TODAY, 3)

/** How the gate is read unless a test is about readiness or cash. */
const PLAIN: GateReadOptions = { withReadiness: false, withCash: false }

/** Read as the guard's list is: with the units' turnovers. */
const READINESS: GateReadOptions = { withReadiness: true, withCash: false }

/** Read for a reader who holds `payment.record_cash`. */
const CASH: GateReadOptions = { withReadiness: false, withCash: true }

function references(rows: readonly GateBooking[]): string[] {
  return rows.map((row) => row.reference)
}

function everyone(list: Awaited<ReturnType<typeof listGateBookings>>): string[] {
  return [...list.expected, ...list.leaving, ...list.dayPasses, ...list.inResidence].map(
    (row) => row.reference,
  )
}

function dayPassOn(date: string, overrides: Partial<CreatePublicDayPassInput> = {}) {
  return createPublicDayPassBooking({
    date,
    party: [{ bandId: 'adult', label: 'Adult', count: 2 }],
    headcount: 2,
    chargeableGuests: 2,
    exemptGuests: 0,
    guestName: 'Gate Pass Guest',
    guestPhone: '+673 710 0001',
    guestEmail: null,
    vehicles: ['BAP 4242'],
    noVehicle: false,
    total: bnd(20),
    lines: [
      {
        type: 'day_pass',
        description: 'Adult × 2',
        quantity: 2,
        unitPrice: bnd(10),
        amount: bnd(20),
      },
    ],
    ...overrides,
  })
}

/**
 * A BND 20 pass sold online and then paid in cash at the desk, which confirms
 * it — through the product's own writers, so what a test admits is the row
 * the product makes. `paid` short of the total is recorded with a reason, as
 * the desk would have to give one.
 */
async function paidPassOn(
  date: string,
  guestPhone: string,
  paid: Cents = bnd(20),
): Promise<{ bookingId: string; reference: string }> {
  const created = await dayPassOn(date, { guestPhone })

  if (!created.ok) {
    throw new Error(`Test setup could not sell the day pass: ${created.error.message}`)
  }

  const cash = await recordCashPayment({
    bookingId: created.data.bookingId,
    amount: paid,
    amountOverrideReason: paid === bnd(20) ? null : 'Test: part of the pass paid at the desk',
    actorId: null,
  })

  if (!cash.ok) {
    throw new Error(`Test setup could not take the cash: ${cash.error.message}`)
  }

  return { bookingId: created.data.bookingId, reference: created.data.reference }
}

describe("today's list at the gate", () => {
  test('a secured, paid stay arriving today is expected and may be checked in', async () => {
    const booking = await givenBooking({ unitRef: '3B-01', checkIn: TODAY, checkOut: LATER })

    const list = await listGateBookings(TODAY, PLAIN)
    const row = list.expected.find((candidate) => candidate.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'check_in', stay: 'paid' })
    expect(row?.unitRef).toBe('3B-01')
    expect(row?.arrival).toBe(TODAY)
  })

  test('a guest who paid only the deposit is still let in, with the stay said to be owed', async () => {
    const booking = await givenBooking({
      unitRef: '3B-02',
      checkIn: TODAY,
      checkOut: LATER,
      payStayNow: false,
    })

    const row = (await listGateBookings(TODAY, PLAIN)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'check_in', stay: 'owed' })
  })

  test('a stay held on a transfer nobody has checked is listed, and the guard is told the deposit is what is missing', async () => {
    const { booking } = await givenTransferBooking({
      unitRef: '3B-03',
      checkIn: TODAY,
      checkOut: LATER,
    })

    const row = (await listGateBookings(TODAY, PLAIN)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'office', reason: 'deposit_promised' })
  })

  test('a stay whose deposit is in, with its transfer for the stay still unchecked, is let in and says so', async () => {
    const { booking } = await givenConfirmedTransferBooking({
      unitRef: '3B-08',
      checkIn: TODAY,
      checkOut: LATER,
    })

    const row = (await listGateBookings(TODAY, PLAIN)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict).toEqual({ kind: 'check_in', stay: 'awaiting_transfer' })
  })

  test('a guest due yesterday who has not arrived is still expected', async () => {
    const booking = await givenBooking({ unitRef: '3B-04', checkIn: YESTERDAY, checkOut: LATER })

    const row = (await listGateBookings(TODAY, PLAIN)).expected.find((r) => r.id === booking.id)

    expect(row?.verdict.kind).toBe('check_in')
  })

  test('a guest checked in whose stay runs on is in residence, apart from arrivals and leavers', async () => {
    const staying = await givenCheckedInBooking({
      unitRef: '3B-05',
      checkIn: YESTERDAY,
      checkOut: TOMORROW,
    })

    const list = await listGateBookings(TODAY, PLAIN)
    const row = list.inResidence.find((candidate) => candidate.id === staying.booking.id)

    expect(row?.verdict).toEqual({ kind: 'in_residence' })
    expect(references(list.expected)).not.toContain(staying.booking.reference)
    expect(references(list.leaving)).not.toContain(staying.booking.reference)
  })

  test('a booking starting tomorrow is not expected today', async () => {
    const booking = await givenBooking({ unitRef: '3B-07', checkIn: TOMORROW, checkOut: LATER })

    expect(everyone(await listGateBookings(TODAY, PLAIN))).not.toContain(booking.reference)
  })

  test('closed bookings never reach the gate', async () => {
    const cancelled = await givenBookingInState(
      { unitRef: '3B-09', checkIn: TODAY, checkOut: LATER },
      ['pay_in_full', 'cancel'],
    )
    const noShow = await givenBookingInState(
      { unitRef: '3B-11', checkIn: TODAY, checkOut: LATER },
      ['pay_in_full', 'mark_no_show'],
    )

    const listed = everyone(await listGateBookings(TODAY, PLAIN))

    expect(listed).not.toContain(cancelled.reference)
    expect(listed).not.toContain(noShow.reference)
  })

  test("today's day pass is listed on its own, and sent to the office until it is paid", async () => {
    const today = await dayPassOn(TODAY)
    const otherDay = await dayPassOn(TOMORROW, { guestPhone: '+673 710 0002' })

    expect(today.ok && otherDay.ok).toBe(true)

    if (!today.ok || !otherDay.ok) return

    const list = await listGateBookings(TODAY, PLAIN)
    const row = list.dayPasses.find((candidate) => candidate.id === today.data.bookingId)

    expect(row?.verdict).toEqual({ kind: 'office', reason: 'pass_unpaid' })
    expect(row?.headcount).toBe(2)
    expect(row?.unitRef).toBeNull()
    expect(everyone(list)).not.toContain(otherDay.data.reference)
    expect(references(list.expected)).not.toContain(today.data.reference)
  })

  test('a row carries nothing a phone on the guardhouse desk should show, and no figure unless the read was for a reader who may take the money', async () => {
    await givenBooking({
      unitRef: '3B-10',
      checkIn: TODAY,
      checkOut: LATER,
      guestPhone: '+673 812 3456',
      // The stay is owed, so there is a figure a careless read could leak.
      payStayNow: false,
    })

    const [row] = (await listGateBookings(TODAY, PLAIN)).expected

    expect(row).toBeDefined()
    expect(row?.cash).toBeNull()
    expect(Object.keys(row ?? {}).sort()).toEqual(
      [
        'arrival',
        'cash',
        'departure',
        'guestName',
        'headcount',
        'id',
        'noVehicle',
        'reference',
        'status',
        'stream',
        'unitNotReady',
        'unitRef',
        'vehicles',
        'verdict',
      ].sort(),
    )
    expect(JSON.stringify(row)).not.toContain('812')
  })
})

describe('guests leaving by the gate (N54: the keys come back to the guard)', () => {
  test('a guest whose last day is today is leaving, and one who should have left yesterday is overdue', async () => {
    const dueToday = await givenCheckedInBooking({
      unitRef: '3B-05',
      checkIn: YESTERDAY,
      checkOut: TODAY,
    })
    const overdue = await givenCheckedInBooking({
      unitRef: '3B-06',
      checkIn: addDays(TODAY, -3),
      checkOut: YESTERDAY,
    })

    const list = await listGateBookings(TODAY, PLAIN)
    const byId = new Map(list.leaving.map((row) => [row.id, row]))

    expect(byId.get(dueToday.booking.id)?.verdict).toEqual({
      kind: 'leaving',
      stay: 'paid',
      overdue: false,
    })
    expect(byId.get(overdue.booking.id)?.verdict).toEqual({
      kind: 'leaving',
      stay: 'paid',
      overdue: true,
    })
    expect(references(list.inResidence)).not.toContain(dueToday.booking.reference)
  })

  test('a guest leaving with the stay still owed is said to owe it', async () => {
    const leaving = await givenCheckedInBooking({
      unitRef: '3B-12',
      checkIn: YESTERDAY,
      checkOut: TODAY,
      payStayNow: false,
    })

    const row = (await listGateBookings(TODAY, PLAIN)).leaving.find(
      (candidate) => candidate.id === leaving.booking.id,
    )

    expect(row?.verdict).toEqual({ kind: 'leaving', stay: 'owed', overdue: false })
  })

  test('once checked out, a guest has left the list and reads as closed', async () => {
    const leaving = await givenCheckedInBooking({
      unitRef: '3B-13',
      checkIn: YESTERDAY,
      checkOut: TODAY,
    })

    expect(await transitionBooking(leaving.booking.id, 'check_out', null)).toEqual({
      ok: true,
      status: 'completed',
    })

    const row = await getGateBooking(leaving.booking.id, TODAY, PLAIN)

    expect(row?.status).toBe('completed')
    expect(row?.verdict).toEqual({ kind: 'closed' })
    expect(everyone(await listGateBookings(TODAY, PLAIN))).not.toContain(leaving.booking.reference)
  })
})

describe('whether the unit is ready for the guest arriving (N53)', () => {
  const today = todayInBrunei()

  test('a unit whose last guest left today and nobody has inspected is not ready — said only when asked', async () => {
    await givenDepartedBooking({
      unitRef: '3B-18',
      checkIn: addDays(today, -2),
      checkOut: today,
    })
    const arriving = await givenBooking({
      unitRef: '3B-18',
      checkIn: today,
      checkOut: addDays(today, 2),
    })

    const asked = await listGateBookings(today, READINESS)
    const notAsked = await listGateBookings(today, PLAIN)

    expect(asked.expected.find((row) => row.id === arriving.id)?.unitNotReady).toBe(true)
    expect(notAsked.expected.find((row) => row.id === arriving.id)?.unitNotReady).toBe(false)
  })

  test('once it is inspected and marked ready, the unit is ready', async () => {
    const departed = await givenDepartedBooking({
      unitRef: '3B-19',
      checkIn: addDays(today, -2),
      checkOut: today,
    })
    const arriving = await givenBooking({
      unitRef: '3B-19',
      checkIn: today,
      checkOut: addDays(today, 2),
    })

    const inspected = await recordInspection({
      bookingId: departed.booking.id,
      outcome: 'clean',
      notes: null,
      actorId: null,
    })
    const ready = await markUnitReady({ bookingId: departed.booking.id, actorId: null })

    expect(inspected.ok && ready.ok).toBe(true)

    const row = (await listGateBookings(today, READINESS)).expected.find(
      (candidate) => candidate.id === arriving.id,
    )

    expect(row?.unitNotReady).toBe(false)
  })

  test('a unit whose last guest has not checked out is not ready', async () => {
    await givenCheckedInBooking({
      unitRef: '3B-20',
      checkIn: addDays(today, -2),
      checkOut: today,
    })
    const arriving = await givenBooking({
      unitRef: '3B-20',
      checkIn: today,
      checkOut: addDays(today, 2),
    })

    const row = (await listGateBookings(today, READINESS)).expected.find(
      (candidate) => candidate.id === arriving.id,
    )

    expect(row?.unitNotReady).toBe(true)
  })
})

describe('searching beyond today', () => {
  test('finds tomorrow’s car by plate however the guard spaced it, and sends it to the office', async () => {
    const booking = await givenBooking({
      unitRef: '3B-11',
      checkIn: TOMORROW,
      checkOut: LATER,
      vehicles: ['BAB 5678'],
    })

    for (const term of ['bab5678', 'BAB 5678', 'b-5678']) {
      const found = await searchGateBookings(term, TODAY, PLAIN)

      expect(references(found), term).toContain(booking.reference)
    }

    const [row] = await searchGateBookings('bab5678', TODAY, PLAIN)

    expect(row?.verdict).toEqual({ kind: 'office', reason: 'early' })
  })

  test('finds a booking by part of the name or the reference', async () => {
    const booking = await givenBooking({
      unitRef: '3B-12',
      checkIn: TOMORROW,
      checkOut: LATER,
      guestName: 'Hajah Norhayati',
    })
    const digits = booking.reference.replace(/\D/g, '')

    expect(references(await searchGateBookings('norhay', TODAY, PLAIN))).toContain(
      booking.reference,
    )
    expect(references(await searchGateBookings(digits, TODAY, PLAIN))).toContain(booking.reference)
  })

  test('never finds a closed booking', async () => {
    const cancelled = await givenBookingInState(
      { unitRef: '3B-13', checkIn: TOMORROW, checkOut: LATER, vehicles: ['BAC 1357'] },
      ['pay_in_full', 'cancel'],
    )

    expect(references(await searchGateBookings('BAC1357', TODAY, PLAIN))).not.toContain(
      cancelled.reference,
    )
  })

  test('takes a wildcard character literally', async () => {
    await givenBooking({ unitRef: '3B-14', checkIn: TOMORROW, checkOut: LATER })

    expect(await searchGateBookings('%', TODAY, PLAIN)).toEqual([])
    expect(await searchGateBookings('_', TODAY, PLAIN)).toEqual([])
  })

  test('an empty term searches nothing', async () => {
    await givenBooking({ unitRef: '3B-15', checkIn: TOMORROW, checkOut: LATER })

    expect(await searchGateBookings('   ', TODAY, PLAIN)).toEqual([])
  })
})

describe('one booking, read fresh for the actions', () => {
  test('carries the same verdict the list does', async () => {
    const booking = await givenBooking({ unitRef: '3B-16', checkIn: TODAY, checkOut: LATER })

    expect((await getGateBooking(booking.id, TODAY, PLAIN))?.verdict).toEqual({
      kind: 'check_in',
      stay: 'paid',
    })
  })

  test('is null for a booking that does not exist', async () => {
    expect(await getGateBooking('00000000-0000-4000-8000-000000000000', TODAY, PLAIN)).toBeNull()
  })
})

describe('admitting a day pass (N54)', () => {
  const today = todayInBrunei()

  test('a paid pass for today is admitted, which closes it, and it stays on the list as admitted', async () => {
    const pass = await paidPassOn(today, '+673 710 0101')

    expect(await admitDayPass({ bookingId: pass.bookingId, actorId: null })).toEqual({
      ok: true,
      status: 'completed',
    })

    const row = (await listGateBookings(today, PLAIN)).dayPasses.find(
      (r) => r.id === pass.bookingId,
    )

    expect(row?.status).toBe('completed')
    expect(row?.verdict).toEqual({ kind: 'admitted' })
  })

  test('the booking’s history names who admitted it, the day and the headcount', async () => {
    const pass = await paidPassOn(today, '+673 710 0102')
    const actorId = await givenStaffAccount()

    await admitDayPass({ bookingId: pass.bookingId, actorId })

    const { data, error } = await dataClient()
      .from('audit_event')
      .select('actor_id, after')
      .eq('entity_id', pass.bookingId)
      .eq('action', 'booking.admit')

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.actor_id).toBe(actorId)
    expect(data?.[0]?.after).toMatchObject({ status: 'completed', pass_date: today, headcount: 2 })
  })

  test('a pass for another day is refused, and stays confirmed', async () => {
    const pass = await paidPassOn(addDays(today, 1), '+673 710 0103')

    const result = await admitDayPass({ bookingId: pass.bookingId, actorId: null })

    expect(!result.ok && result.error.code).toBe('not_today')
    expect((await getGateBooking(pass.bookingId, today, PLAIN))?.status).toBe('confirmed')
  })

  test('a pass confirmed with money still owed is refused', async () => {
    const pass = await paidPassOn(today, '+673 710 0104', bnd(10))

    const result = await admitDayPass({ bookingId: pass.bookingId, actorId: null })

    expect(!result.ok && result.error.code).toBe('owed')
  })

  test('a pass nobody has paid for cannot be admitted', async () => {
    const created = await dayPassOn(today, { guestPhone: '+673 710 0105' })

    if (!created.ok) throw new Error(created.error.message)

    const result = await admitDayPass({ bookingId: created.data.bookingId, actorId: null })

    expect(!result.ok && result.error.code).toBe('illegal_transition')
  })

  test('a pass cannot be admitted twice', async () => {
    const pass = await paidPassOn(today, '+673 710 0106')

    await admitDayPass({ bookingId: pass.bookingId, actorId: null })
    const again = await admitDayPass({ bookingId: pass.bookingId, actorId: null })

    expect(!again.ok && again.error.code).toBe('terminal_state')
  })

  test('a stay is never admitted', async () => {
    const booking = await givenBooking({
      unitRef: '3B-17',
      checkIn: today,
      checkOut: addDays(today, 2),
    })

    const result = await admitDayPass({ bookingId: booking.id, actorId: null })

    expect(!result.ok && result.error.code).toBe('not_a_day_pass')
  })

  test('a day pass is never checked in', async () => {
    const pass = await paidPassOn(today, '+673 710 0107')

    const result = await checkInBooking({ bookingId: pass.bookingId, actorId: null })

    expect(!result.ok && result.error.code).toBe('not_a_stay')
  })

  test('the generic transition writer refuses to admit, so neither rule can be walked around', async () => {
    const pass = await paidPassOn(today, '+673 710 0108')

    const { data, error } = await dataClient().rpc('transition_booking', {
      p_property_id: await currentPropertyId(),
      p_booking_id: pass.bookingId,
      p_from_status: 'confirmed',
      p_to_status: 'completed',
      p_event: 'admit',
      p_actor_id: null,
      p_reason: null,
    })

    expect(error).toBeNull()
    expect(data).toEqual({ ok: false, error: 'admits_through_admit_day_pass' })
  })
})

describe('the cash the gate may take (D6, N54)', () => {
  test('is worked out only when the read asks for it, so a phone that may not take money is sent no figure', async () => {
    const booking = await givenBooking({
      unitRef: '3B-21',
      checkIn: TODAY,
      checkOut: LATER,
      payStayNow: false,
    })

    // Three nights at the fixture's BND 200.
    const owed = { kind: 'stay', amount: bnd(600) }

    expect((await getGateBooking(booking.id, TODAY, PLAIN))?.cash).toBeNull()
    expect((await getGateBooking(booking.id, TODAY, CASH))?.cash).toEqual(owed)
    expect(
      (await listGateBookings(TODAY, CASH)).expected.find((row) => row.id === booking.id)?.cash,
    ).toEqual(owed)
  })

  test('a deposit promised by a transfer nobody checked is taken whole in cash, which fulfils the promise and confirms the booking', async () => {
    const booking = await givenBooking({
      unitRef: '3B-22',
      checkIn: TODAY,
      checkOut: LATER,
      paymentMethod: 'bank_transfer',
      payStayNow: false,
    })

    expect((await getGateBooking(booking.id, TODAY, CASH))?.cash).toEqual({
      kind: 'deposit',
      amount: bnd(100),
      promised: true,
    })

    const taken = await recordBookingDeposit({
      bookingId: booking.id,
      method: 'cash',
      actorId: null,
    })

    expect(taken.ok && taken.confirmedNow).toBe(true)

    const after = await getGateBooking(booking.id, TODAY, CASH)

    expect(after?.status).toBe('confirmed')
    expect(after?.cash).toEqual({ kind: 'stay', amount: bnd(600) })
    // A second press on the deposit's dialog is refused before anything is written.
    expect(gateCashStalenessOf({ kind: 'deposit', amount: bnd(100) }, after?.cash ?? null)).toBe(
      'already_recorded',
    )
  })

  test('a deposit that arrived short is topped up by what is missing, and nothing more is offered for it', async () => {
    const booking = await givenBooking({
      unitRef: '3B-23',
      checkIn: TODAY,
      checkOut: LATER,
      paymentMethod: 'bank_transfer',
      payStayNow: false,
    })
    const deposit = await getDepositByBookingId(booking.id)

    if (!deposit) throw new Error('Test setup expected a promised deposit.')

    const verified = await verifyDeposit({
      depositId: deposit.id,
      observedAmount: bnd(60),
      match: 'reference',
      overrideReason: 'Test: the guest sent part of the deposit',
      actorId: null,
    })

    expect(verified.ok).toBe(true)
    expect((await getGateBooking(booking.id, TODAY, CASH))?.cash).toEqual({
      kind: 'deposit_shortfall',
      amount: bnd(40),
    })

    const topUp = { bookingId: booking.id, amount: bnd(40), method: 'cash', actorId: null } as const
    const first = await topUpBookingDeposit(topUp)

    expect(first.ok && first.confirmedNow).toBe(true)

    const after = await getGateBooking(booking.id, TODAY, CASH)

    expect(after?.cash).toEqual({ kind: 'stay', amount: bnd(600) })
    expect(
      gateCashStalenessOf({ kind: 'deposit_shortfall', amount: bnd(40) }, after?.cash ?? null),
    ).toBe('already_recorded')
    // And the database refuses a second top-up of a deposit that is whole.
    expect((await topUpBookingDeposit(topUp)).ok).toBe(false)
  })

  test('the stay is taken once, and a second full payment is not taken without a reason — so the gate looks before it writes', async () => {
    const booking = await givenBooking({
      unitRef: '3B-24',
      checkIn: TODAY,
      checkOut: LATER,
      payStayNow: false,
    })
    const payment = {
      bookingId: booking.id,
      amount: bnd(600),
      amountOverrideReason: null,
      actorId: null,
    }

    expect((await recordCashPayment(payment)).ok).toBe(true)

    const after = await getGateBooking(booking.id, TODAY, CASH)

    expect(after?.verdict).toEqual({ kind: 'check_in', stay: 'paid' })
    expect(after?.cash).toBeNull()
    expect(gateCashStalenessOf({ kind: 'stay', amount: bnd(600) }, after?.cash ?? null)).toBe(
      'already_recorded',
    )

    // What a second press would meet without the gate's own check: the desk's
    // writer asks only for a reason, and a reason is easy to type.
    const again = await recordCashPayment(payment)

    expect(!again.ok && again.error.code).toBe('reason_required')
  })

  test('nothing is taken for the stay while a transfer for it waits to be checked', async () => {
    const { booking } = await givenConfirmedTransferBooking({
      unitRef: '3B-25',
      checkIn: TODAY,
      checkOut: LATER,
    })

    const row = await getGateBooking(booking.id, TODAY, CASH)

    expect(row?.verdict).toEqual({ kind: 'check_in', stay: 'awaiting_transfer' })
    expect(row?.cash).toBeNull()
  })

  test('a guest checked in pays the stay before the keys come back, because a checked-out stay takes nothing', async () => {
    const leaving = await givenCheckedInBooking({
      unitRef: '3B-26',
      checkIn: YESTERDAY,
      checkOut: TODAY,
      payStayNow: false,
    })

    expect((await getGateBooking(leaving.booking.id, TODAY, CASH))?.cash).toEqual({
      kind: 'stay',
      amount: bnd(200),
    })
    expect((await transitionBooking(leaving.booking.id, 'check_out', null)).ok).toBe(true)
    expect((await getGateBooking(leaving.booking.id, TODAY, CASH))?.cash).toBeNull()

    const late = await recordCashPayment({
      bookingId: leaving.booking.id,
      amount: bnd(200),
      amountOverrideReason: null,
      actorId: null,
    })

    expect(late.ok).toBe(false)
  })

  test('a day pass is paid at the gate, and then admitted', async () => {
    const today = todayInBrunei()
    const created = await dayPassOn(today, { guestPhone: '+673 710 0201' })

    if (!created.ok) throw new Error(created.error.message)

    const { bookingId } = created.data

    expect((await getGateBooking(bookingId, today, CASH))?.cash).toEqual({
      kind: 'pass',
      amount: bnd(20),
    })

    const paid = await recordCashPayment({
      bookingId,
      amount: bnd(20),
      amountOverrideReason: null,
      actorId: null,
    })

    expect(paid.ok && paid.confirmedNow).toBe(true)

    const row = await getGateBooking(bookingId, today, CASH)

    expect(row?.verdict).toEqual({ kind: 'admit' })
    expect(row?.cash).toBeNull()
    expect(await admitDayPass({ bookingId, actorId: null })).toEqual({
      ok: true,
      status: 'completed',
    })
  })
})

describe('a booking held for the gate to collect (B17, N54)', () => {
  const today = todayInBrunei()

  test('holds the unit with nothing taken; the guard takes the deposit, then the stay, then checks the guest in', async () => {
    const booking = await givenBooking({
      unitRef: '3B-27',
      checkIn: today,
      checkOut: addDays(today, 2),
      paymentMethod: 'at_gate',
    })

    expect(booking.status).toBe('held')
    expect(await listPaymentsForBooking(booking.id)).toEqual([])
    expect(await getDepositByBookingId(booking.id)).toBeNull()

    // Held against nothing, it still holds: nobody else can take the unit.
    const rival = await createWalkInBooking(
      await bookingInput({ unitRef: '3B-27', checkIn: today, checkOut: addDays(today, 1) }),
    )

    expect(!rival.ok && rival.error.code).toBe('unit_unavailable')

    const arriving = await getGateBooking(booking.id, today, CASH)

    expect(arriving?.verdict).toEqual({ kind: 'office', reason: 'deposit_not_in' })
    expect(arriving?.cash).toEqual({ kind: 'deposit', amount: bnd(100), promised: false })

    const deposit = await recordBookingDeposit({
      bookingId: booking.id,
      method: 'cash',
      actorId: null,
    })

    expect(deposit.ok && deposit.confirmedNow).toBe(true)

    const secured = await getGateBooking(booking.id, today, CASH)

    expect(secured?.status).toBe('confirmed')
    expect(secured?.verdict).toEqual({ kind: 'check_in', stay: 'owed' })
    // Two nights at the fixture's BND 200.
    expect(secured?.cash).toEqual({ kind: 'stay', amount: bnd(400) })

    const stay = await recordCashPayment({
      bookingId: booking.id,
      amount: bnd(400),
      amountOverrideReason: null,
      actorId: null,
    })

    expect(stay.ok).toBe(true)

    const paid = await getGateBooking(booking.id, today, CASH)

    expect(paid?.verdict).toEqual({ kind: 'check_in', stay: 'paid' })
    expect(paid?.cash).toBeNull()
    expect((await checkInBooking({ bookingId: booking.id, actorId: null })).ok).toBe(true)
  })

  test('its history says nothing was taken when it was made', async () => {
    const booking = await givenBooking({
      unitRef: '3B-28',
      checkIn: today,
      checkOut: addDays(today, 1),
      paymentMethod: 'at_gate',
    })

    const { data, error } = await dataClient()
      .from('audit_event')
      .select('after')
      .eq('entity_id', booking.id)
      .eq('action', 'booking.created_walk_in')

    expect(error).toBeNull()
    expect(data?.[0]?.after).toMatchObject({
      status: 'held',
      payment_method: 'at_gate',
      paying: 'nothing_now',
    })
  })

  test('is refused for a stay that does not start today', async () => {
    await expect(
      givenBooking({
        unitRef: '3B-29',
        checkIn: addDays(today, 1),
        checkOut: addDays(today, 3),
        paymentMethod: 'at_gate',
      }),
    ).rejects.toThrow(/must start today/)
  })

  test('is refused beside a waived deposit', async () => {
    await expect(
      givenBooking({
        unitRef: '3B-30',
        checkIn: today,
        checkOut: addDays(today, 1),
        paymentMethod: 'at_gate',
        depositWaiverReason: 'Test: extending a stay',
      }),
    ).rejects.toThrow(/cannot waive its deposit/)
  })
})

describe('who works the gate (N11, N54)', () => {
  async function slugsHolding(permission: string): Promise<string[]> {
    const { data, error } = await dataClient()
      .from('role_permission')
      .select('staff_role!inner(slug)')
      .eq('permission', permission)

    if (error) {
      throw new Error(error.message)
    }

    return (data as unknown as { staff_role: { slug: string } }[])
      .map((row) => row.staff_role.slug)
      .sort()
  }

  test('the guard checks stays in, because he hands over the keys — and so do the office and Admin', async () => {
    expect(await slugsHolding('booking.check_in')).toEqual(['admin', 'front-office', 'security'])
  })

  test('the guard checks guests out when the keys come back, and housekeeping still can', async () => {
    expect(await slugsHolding('booking.check_out')).toEqual([
      'admin',
      'front-office',
      'housekeeping',
      'security',
    ])
  })

  test('the guard, the office and Admin admit day passes', async () => {
    expect(await slugsHolding('day_pass.admit')).toEqual(['admin', 'front-office', 'security'])
  })

  test('the guard still cannot make or edit a booking — he calls the office', async () => {
    expect(await slugsHolding('booking.create')).not.toContain('security')
    expect(await slugsHolding('booking.amend')).not.toContain('security')
  })

  test('the guard records the cash he is handed, as the office and Admin do', async () => {
    expect(await slugsHolding('payment.record_cash')).toEqual(['admin', 'front-office', 'security'])
  })

  test('the guard never verifies a transfer', async () => {
    expect(await slugsHolding('payment.verify')).not.toContain('security')
  })
})
