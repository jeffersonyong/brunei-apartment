'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { requirePermission } from '@/lib/auth/require-permission'
import { transitionBooking } from '@/lib/db/bookings'
import { admitDayPass } from '@/lib/db/day-pass-admission'
import { checkInBooking } from '@/lib/db/deposits'
import { getGateBooking, type GateReadOptions } from '@/lib/db/gate'
import { todayInBrunei } from '@/lib/domain/dates'
import {
  gateRefusalSentence,
  gateVerdictSentence,
  type GateSentenceOptions,
} from '@/lib/domain/gate'

/**
 * The gate's three moves: checking a stay in, checking it out, and admitting a
 * day pass (capabilities D3 and D5, and a pass's half of D1).
 *
 * Each is the office's own writer under the office's own permission —
 * `checkInBooking()` under `booking.check_in`, the `check_out` transition under
 * `booking.check_out`, `admitDayPass()` under `day_pass.admit` — so the gate
 * can do exactly what the office can do at that moment and nothing more, and
 * the booking's history records who did it (prd.md §12 requirement 3:
 * authority comes from the staff session). The guard holds all three: he is
 * the front desk, and hands the keys over and takes them back (N54, answered
 * by Jason on 14 September 2026).
 *
 * ── The verdict is decided again, here ────────────────────────────────────
 *
 * The list on the phone may be a few minutes old, and a hidden button is not a
 * rule. So the booking is read fresh and `gateVerdictOf()` asked again before
 * the write: an early arrival, a guest not due out or a pass for another day
 * is refused here as firmly as on screen, and a booking the office has since
 * cancelled is refused rather than walked in. What only the database can
 * settle — the deposit, the pass's date in the property's timezone, what is
 * owed — is decided last of all, under the row lock, by the SQL itself.
 *
 * Every refusal is a sentence that tells the guard what to do next.
 */

export interface GateActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** Named in the toast: "Siti Aminah is checked in". */
  guestName?: string
}

const schema = z.object({
  bookingId: z.string().uuid(),
})

/** An action reads its one booking again before it writes, and needs no turnovers for that. */
const READ_FOR_A_WRITE: GateReadOptions = { withReadiness: false }

function sentenceOptionsOf(permissions: ReadonlySet<Permission>): GateSentenceOptions {
  return {
    mayCheckIn: hasPermission(permissions, 'booking.check_in'),
    mayCheckOut: hasPermission(permissions, 'booking.check_out'),
  }
}

export async function checkInAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('booking.check_in')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_WRITE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.stream !== 'day_pass' && booking.status === 'checked_in') {
    return { status: 'error', message: gateRefusalSentence('status_changed', { alreadyIn: true }) }
  }

  if (booking.verdict.kind !== 'check_in') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await checkInBooking({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // Somebody else may have checked them in a moment ago, which is done
    // rather than failed — so look before choosing the sentence.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_WRITE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, { alreadyIn: now?.status === 'checked_in' }),
    }
  }

  revalidateStayScreens(booking.reference, booking.unitRef)

  return { status: 'done', guestName: booking.guestName }
}

/**
 * Checking a stay out when the keys come back (capability D5, N54).
 *
 * Only for a guest due out today or overdue — the rule the cleaner's "Guest
 * has left" uses — because the gate cannot tell a guest leaving from one out
 * for dinner, and a check-out cannot be undone. It is the same ordinary
 * transition the office's Check out and the cleaner's button make: nothing
 * else moves when a guest leaves.
 */
export async function checkOutAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('booking.check_out')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_WRITE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.stream !== 'day_pass' && booking.status === 'completed') {
    return { status: 'error', message: gateRefusalSentence('status_changed', { alreadyOut: true }) }
  }

  if (booking.verdict.kind === 'in_residence') {
    return { status: 'error', message: gateRefusalSentence('not_due_out') }
  }

  if (booking.verdict.kind !== 'leaving') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await transitionBooking(booking.id, 'check_out', actor.userId)

  if (!result.ok) {
    // The cleaner or the office may have checked them out a moment ago.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_WRITE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, { alreadyOut: now?.status === 'completed' }),
    }
  }

  revalidateStayScreens(booking.reference, booking.unitRef)

  return { status: 'done', guestName: booking.guestName }
}

export async function admitAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('day_pass.admit')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_WRITE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.verdict.kind === 'admitted') {
    return {
      status: 'error',
      message: gateRefusalSentence('status_changed', { alreadyAdmitted: true }),
    }
  }

  if (booking.verdict.kind !== 'admit') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await admitDayPass({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // The office, or a second phone, may have admitted it a moment ago.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_WRITE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, {
        alreadyAdmitted: now?.verdict.kind === 'admitted',
      }),
    }
  }

  revalidateStayScreens(booking.reference, null)

  return { status: 'done', guestName: booking.guestName }
}
