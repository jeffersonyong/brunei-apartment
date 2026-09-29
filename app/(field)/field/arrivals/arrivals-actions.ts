'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { recordGateArrivals } from '@/lib/db/arrivals'
import { getGateBooking, type GateReadOptions } from '@/lib/db/gate'
import { todayInBrunei } from '@/lib/domain/dates'
import { MAX_EXTRA_GUESTS_REMARK_LENGTH } from '@/lib/domain/extra-guests'
import {
  arrivalsControlOf,
  arrivalsCountRange,
  arrivalsRefusalSentence,
  arrivalsTargetOf,
  countedSentence,
  gateArrivalsOf,
} from '@/lib/domain/gate-arrivals'

import { reportCountedExtras } from './office-report'

/**
 * Counting people through the gate after the first group (capability D8):
 * **Record arrivals** while anyone booked is still to come, the small
 * **Extra** once everyone booked is in, and **Correct** for a mis-tap. The
 * three are one write, `record_gate_arrivals()`, and each shows in the
 * booking's history.
 *
 * **The count the guard saw goes with it**, and nothing is written if it has
 * moved since — a second phone counted the same car, or a press was repeated
 * after an answer was lost on one bar of signal. It is the guard
 * `gateCashStalenessOf` gives cash, and the refusal names the count as it now
 * stands.
 *
 * **More than booked is told to the office**, never settled here: a stay's
 * party is the office's to change, and a pass is closed once admitted, so it
 * takes no more money at the gate. Nobody is turned away by the app.
 *
 * Who may count is who lets this kind of booking in — `booking.check_in` for
 * a stay, `day_pass.admit` for a pass — and the stream the dialog posted must
 * be the booking's, so one permission cannot count the other's bookings.
 */

export interface ArrivalsState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** For the toast. */
  done?: { guestName: string; corrected: boolean; detail: string }
}

const schema = z.object({
  bookingId: z.string().uuid(),
  stream: z.enum(['short_stay', 'day_pass', 'tenancy']),
  /** More people through, or the total put right. */
  kind: z.enum(['more', 'correct']),
  count: z.coerce.number().int().min(0),
  /** The count the card showed when the dialog opened. */
  expectedArrived: z.coerce.number().int().min(0),
  remark: z.string().trim().max(MAX_EXTRA_GUESTS_REMARK_LENGTH).default(''),
})

/** A count: the booking alone, with no turnovers or figures. */
const READ: GateReadOptions = { withReadiness: false, withCash: false }

export async function recordArrivalsAtGateAction(
  _previous: ArrivalsState,
  formData: FormData,
): Promise<ArrivalsState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'Say how many.' }
  }

  const input = parsed.data
  const actor = await requirePermission(
    input.stream === 'day_pass' ? 'day_pass.admit' : 'booking.check_in',
  )
  const booking = await getGateBooking(input.bookingId, todayInBrunei(), READ)

  if (!booking || booking.stream !== input.stream) {
    return { status: 'error', message: arrivalsRefusalSentence('not_found') }
  }

  const control = arrivalsControlOf(booking.verdict, booking.arrivals)

  if (booking.arrivals === null || control === null || control === 'first') {
    return {
      status: 'error',
      message: arrivalsRefusalSentence(booking.verdict.kind === 'closed' ? 'closed' : 'not_in'),
    }
  }

  // Asked here as well as under the lock, so a stale card is told what the
  // count is now without a write being attempted.
  if (booking.arrivals.arrived !== input.expectedArrived) {
    return { status: 'error', message: arrivalsRefusalSentence('changed', booking.arrivals) }
  }

  const range = arrivalsCountRange(input.kind, booking.partySize, booking.arrivals)

  if (input.count < range.min) {
    return { status: 'error', message: 'Say how many.' }
  }

  if (input.count > range.max) {
    return { status: 'error', message: arrivalsRefusalSentence('out_of_range') }
  }

  const target = arrivalsTargetOf({ kind: input.kind, count: input.count }, input.expectedArrived)
  const result = await recordGateArrivals({
    bookingId: booking.id,
    expectedArrived: input.expectedArrived,
    arrived: target,
    corrected: input.kind === 'correct',
    actorId: actor.userId,
  })

  if (!result.ok) {
    const { error } = result

    return {
      status: 'error',
      message:
        error.code === 'changed' || error.code === 'unchanged'
          ? arrivalsRefusalSentence(error.code, gateArrivalsOf(error.booked, error.arrived))
          : arrivalsRefusalSentence(error.code),
    }
  }

  const reported = await reportCountedExtras(booking, target, input.remark, actor.userId)

  revalidateStayScreens(booking.reference, booking.unitRef)

  return {
    status: 'done',
    done: {
      guestName: booking.guestName,
      corrected: input.kind === 'correct',
      detail: countedSentence(gateArrivalsOf(result.booked, result.arrived), reported),
    },
  }
}
