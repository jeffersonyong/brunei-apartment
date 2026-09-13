'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { hasPermission } from '@/lib/auth/permissions'
import { requirePermission } from '@/lib/auth/require-permission'
import { admitDayPass } from '@/lib/db/day-pass-admission'
import { checkInBooking } from '@/lib/db/deposits'
import { getGateBooking } from '@/lib/db/gate'
import { todayInBrunei } from '@/lib/domain/dates'
import { gateRefusalSentence, gateVerdictSentence } from '@/lib/domain/gate'

/**
 * The gate's two moves: admitting a day pass, and checking a stay in
 * (capability D3's check-in, without the QR).
 *
 * Each is the desk's own writer under the desk's own permission —
 * `admitDayPass()` under `day_pass.admit`, `checkInBooking()` under
 * `booking.check_in` — so the gate can do exactly what the desk can do at
 * that moment and nothing more, and the booking's history records who let the
 * guest in (prd.md §12 requirement 3: authority comes from the staff session).
 * Since N54 the guard holds the first and not the second: the keys are at the
 * counter, so a stay is checked in there.
 *
 * ── The verdict is decided again, here ────────────────────────────────────
 *
 * The list on the phone may be a few minutes old, and a hidden button is not a
 * rule. So the booking is read fresh and `gateVerdictOf()` asked again before
 * the write: an early arrival or a pass for another day is refused here as
 * firmly as on screen, and a booking the office has since cancelled is refused
 * rather than walked in. What only the database can settle — the deposit, the
 * pass's date in the property's timezone, what is owed — is decided last of
 * all, under the row lock, by the SQL function itself.
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
  const booking = await getGateBooking(parsed.data.bookingId, today)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.verdict.kind === 'in_residence') {
    return { status: 'error', message: gateRefusalSentence('status_changed', { alreadyIn: true }) }
  }

  if (booking.verdict.kind !== 'check_in') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking.arrival, { mayCheckIn: true }),
    }
  }

  const result = await checkInBooking({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // Somebody at the desk may have checked them in a moment ago, which is
    // done rather than failed — so look before choosing the sentence.
    const now = await getGateBooking(booking.id, today)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, {
        alreadyIn: now?.verdict.kind === 'in_residence',
      }),
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
  const booking = await getGateBooking(parsed.data.bookingId, today)

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
      message: gateVerdictSentence(booking.verdict, booking.arrival, {
        mayCheckIn: hasPermission(actor.permissions, 'booking.check_in'),
      }),
    }
  }

  const result = await admitDayPass({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // The desk, or a second phone, may have admitted it a moment ago.
    const now = await getGateBooking(booking.id, today)

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
