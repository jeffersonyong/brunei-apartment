'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { scheduleAccountingPack } from '@/app/schedule-accounting-pack'
import { scheduleBookingConfirmedEmail } from '@/app/schedule-booking-email'
import { hasPermission } from '@/lib/auth/permissions'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById } from '@/lib/db/bookings'
import { admitDayPass } from '@/lib/db/day-pass-admission'
import { getGateBooking, type GateReadOptions } from '@/lib/db/gate'
import { changeBookingParty, listDayPassParties } from '@/lib/db/party'
import { recordCashPayment } from '@/lib/db/payments'
import { getPropertyConfig } from '@/lib/db/property-config'
import type { PropertyConfig } from '@/lib/domain/config'
import { todayInBrunei } from '@/lib/domain/dates'
import {
  addToParty,
  countsOf,
  describeParty,
  MAX_EXTRA_GUESTS,
  MAX_EXTRA_GUESTS_REMARK_LENGTH,
} from '@/lib/domain/extra-guests'
import { gateRefusalSentence } from '@/lib/domain/gate'
import {
  alreadyCountedSentence,
  arrivalsCountRange,
  arrivalsRefusalSentence,
  extrasNamedMatch,
  firstCountExtrasRouteOf,
} from '@/lib/domain/gate-arrivals'
import { formatCents, type Cents } from '@/lib/domain/money'
import { repriceDayPassParty } from '@/lib/domain/pricing/party-change'

import { tellTheOffice } from './office-report'

/**
 * More visitors at the car than a day pass is for, settled at the gate as
 * they are admitted (capability D8; Jeff, 19 and 29 September 2026).
 *
 * The Admit dialog asks how many are here now. When that is more than the
 * pass is for, and the pass is one the guard can settle — its own day, open,
 * paid, no transfer waiting, and a guard who takes cash — he names the extra
 * visitors by age band, the pass is priced again for all of them, he takes the
 * difference, and everybody is admitted. Anything else over a booking is told
 * to the office (./office-report.ts); so is this, if he chooses — the app never
 * turns anyone away.
 *
 * ── Three writers, in order, and where a failure lands ────────────────────
 *
 * The party, then the cash, then the admission — each the product's existing
 * writer with its own checks: capacity under the per-date lock, the amount
 * rule, and the pass paid in full on its own day. They are deliberately not
 * one transaction. The order is chosen so a failure between them leaves the
 * pass unfinished, never wrong:
 *
 * 1. **The party is refused** — the day is full, or the pass moved — and
 *    nothing is written. The guard is told how many places are left, and may
 *    admit fewer or tell the office instead.
 * 2. **The cash is not recorded.** The pass is for the new party and owes the
 *    difference: its card is red with the ordinary Take button, nobody is
 *    admitted, and the next Admit opens on the new party.
 * 3. **The admission is refused.** The party and the cash are done, so the
 *    pass is paid and its card offers Admit again. If a second phone admitted
 *    it in between, that phone recorded its own count, and the guard is sent to
 *    Record arrivals for the rest.
 *
 * Once the party has moved, the office is told what happened whatever the
 * cash and the admission answered — best effort, because a note that failed
 * to save must never reach the guard as "that did not go through", or he
 * would ask the visitor to pay again. Both writers throw on a failed call as
 * well as refusing, so each is caught, and a throw lands exactly where a
 * refusal does.
 *
 * A press repeated after an answer was lost on one bar of signal is refused
 * on the headcount the dialog opened on: the figure alone repeats — one adult
 * more costs the same on a second press — and the headcount has moved by then.
 */

export interface ExtraGuestsState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** For the toast. */
  done?: { guestName: string; taken: Cents; admitted: number; extra: number }
}

const count = z.coerce.number().int().min(0).max(MAX_EXTRA_GUESTS)

const schema = z.object({
  bookingId: z.string().uuid(),
  /** How many are here now — the pass's party and the extras together. */
  arrived: z.coerce.number().int().min(1),
  /** What the dialog said to take, in cents. The server takes nothing else. */
  expectedTake: z.coerce.number().int().min(0),
  /** How many the pass was for when the dialog opened. */
  expectedHeadcount: z.coerce.number().int().min(1),
  remark: z.string().trim().max(MAX_EXTRA_GUESTS_REMARK_LENGTH).default(''),
})

/** A move: the booking alone, with no turnovers or figures. */
const READ: GateReadOptions = { withReadiness: false, withCash: false }

export async function admitWithExtrasAtGateAction(
  _previous: ExtraGuestsState,
  formData: FormData,
): Promise<ExtraGuestsState> {
  const actor = await requirePermission('day_pass.admit')

  if (!hasPermission(actor.permissions, 'payment.record_cash')) {
    return {
      status: 'error',
      message: 'Taking cash is not part of your job here. Tell the office instead.',
    }
  }

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'Say how many are here now, and who the extras are.' }
  }

  const input = parsed.data
  const today = todayInBrunei()
  const [gate, booking, config] = await Promise.all([
    getGateBooking(input.bookingId, today, READ),
    getBookingById(input.bookingId),
    getPropertyConfig(),
  ])

  if (!gate || !booking || !booking.dayPass || gate.stream !== 'day_pass') {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (gate.verdict.kind === 'admitted') {
    return { status: 'error', message: alreadyCountedSentence('admit', gate.arrivals) }
  }

  const route = firstCountExtrasRouteOf({
    stream: gate.stream,
    verdict: gate.verdict,
    takesCash: true,
    moneySettled: !gate.moneyUnsettled,
    hasRates: true,
  })

  if (route !== 'settle') {
    return {
      status: 'error',
      message: 'This pass cannot take more visitors at the gate. Tell the office instead.',
    }
  }

  if (booking.dayPass.headcount !== input.expectedHeadcount) {
    return { status: 'error', message: gateRefusalSentence('already_recorded') }
  }

  if (input.arrived > arrivalsCountRange('first', gate.partySize, null).max) {
    return { status: 'error', message: arrivalsRefusalSentence('out_of_range') }
  }

  const extras = input.arrived - booking.dayPass.headcount
  const added = addedCounts(formData, config)

  if (extras < 1) {
    return {
      status: 'error',
      message: 'Nobody more than the pass is for. Refresh the list and admit them.',
    }
  }

  if (!extrasNamedMatch(added, extras)) {
    return {
      status: 'error',
      message: `Say who the ${extras} extra ${extras === 1 ? 'visitor is' : 'visitors are'}, by age.`,
    }
  }

  const sold = (await listDayPassParties([booking.id])).get(booking.id) ?? []
  const repriced = repriceDayPassParty(addToParty(countsOf(sold), added), config)

  if (!repriced.ok) {
    return { status: 'error', message: repriced.message }
  }

  const take = repriced.total - booking.paid

  // The figure the guard is about to ask the visitor for is the one the
  // server works out, or nothing happens: the pass may have moved since the
  // list was read.
  if (take !== input.expectedTake || take < 0) {
    return { status: 'error', message: gateRefusalSentence('changed') }
  }

  // 1. The party.
  const changed = await changeBookingParty({
    bookingId: booking.id,
    expectedUpdatedAt: booking.updatedAt,
    party: repriced.party,
    total: repriced.total,
    lines: repriced.lines,
    pass: { party: repriced.snapshot, headcount: repriced.headcount },
    reason: 'Visitors added at the gate',
    actorId: actor.userId,
  })

  if (!changed.ok) {
    return {
      status: 'error',
      message:
        changed.error.code === 'capacity_exceeded'
          ? `${changed.error.message} Admit fewer, or tell the office instead.`
          : gateRefusalSentence('changed'),
    }
  }

  const addedParty = describeParty(
    config.dayPassAgeBands.map((band) => ({ label: band.label, count: added[band.id] ?? 0 })),
  )
  const officeNote = { extra: extras, bookedFor: booking.dayPass.headcount, remark: input.remark }

  revalidateGate(gate.reference)

  // 2. The cash.
  if (take > 0 && !(await tookTheCash(booking.id, take, actor.userId))) {
    // The extras are in the party now, so the office has nothing to act on —
    // `added_cents` says so, or the card would read "told" beside a party
    // that already holds them. What is missing is the money, which the red
    // card and its Take button finish.
    await tellTheOffice({
      bookingId: booking.id,
      note: {
        ...officeNote,
        added: { party: addedParty, nowFor: repriced.headcount, taken: null },
      },
      addedCents: 0,
      actorId: actor.userId,
    })

    return {
      status: 'error',
      message: `The visitors were added, but the BND ${formatCents(take)} was not recorded. Take it with the Take button, then Admit.`,
    }
  }

  // 3. The admission.
  const admitted = await admittedThem(booking.id, input.arrived, actor.userId)

  await tellTheOffice({
    bookingId: booking.id,
    note: { ...officeNote, added: { party: addedParty, nowFor: repriced.headcount, taken: take } },
    addedCents: take,
    actorId: actor.userId,
  })

  if (!admitted) {
    const now = await getGateBooking(booking.id, today, READ)
    const paid = take > 0 ? ` and BND ${formatCents(take)} taken` : ''

    return {
      status: 'error',
      message:
        now?.verdict.kind === 'admitted'
          ? `The visitors were added${paid}, but somebody else admitted the pass a moment ago. Count the rest in with Record arrivals.`
          : `The visitors were added${paid}, but the pass was not admitted. Press Admit.`,
    }
  }

  return {
    status: 'done',
    done: { guestName: gate.guestName, taken: take, admitted: input.arrived, extra: extras },
  }
}

/** Step 2. A refusal and a throw land in the same place: the money is owed. */
async function tookTheCash(bookingId: string, take: Cents, actorId: string): Promise<boolean> {
  try {
    const paid = await recordCashPayment({
      bookingId,
      amount: take,
      amountOverrideReason: null,
      actorId,
    })

    if (!paid.ok) {
      return false
    }

    // Money reached the pass, so the accounting record is written now
    // (capability G5), as the gate's own cash does.
    scheduleAccountingPack(bookingId)

    if (paid.confirmedNow) {
      scheduleBookingConfirmedEmail(bookingId)
    }

    revalidatePath('/payments')
    revalidatePath('/payments/cash')
    revalidatePath('/reports/cash-up')

    return true
  } catch (error) {
    console.error('The gate could not record the cash for visitors added to a pass', error)

    return false
  }
}

/** Step 3. A refusal and a throw land in the same place: the pass is paid and not admitted. */
async function admittedThem(bookingId: string, arrived: number, actorId: string): Promise<boolean> {
  try {
    return (await admitDayPass({ bookingId, actorId, arrived })).ok
  } catch (error) {
    console.error('The gate could not admit a pass after adding visitors to it', error)

    return false
  }
}

/** The extra visitors by band, read against the bands on sale — nothing else is priced. */
function addedCounts(formData: FormData, config: PropertyConfig): Record<string, number> {
  const added: Record<string, number> = {}

  for (const band of config.dayPassAgeBands) {
    const value = count.safeParse(formData.get(`band-${band.id}`) ?? 0)

    added[band.id] = value.success ? value.data : 0
  }

  return added
}

function revalidateGate(reference: string): void {
  // A pass occupies no unit.
  revalidateStayScreens(reference, null)
}
