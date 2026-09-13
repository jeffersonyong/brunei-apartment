'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { checkInBooking } from '@/lib/db/deposits'
import { getGateBooking } from '@/lib/db/gate'
import { todayInBrunei } from '@/lib/domain/dates'
import { gateRefusalSentence, gateVerdictSentence } from '@/lib/domain/gate'

/**
 * Checking a guest in at the gate (capability D3's check-in, without the QR).
 *
 * The same `checkInBooking()` the desk's button calls, under the same
 * `booking.check_in` — so the guard can do exactly what the desk can do at
 * that moment and nothing more, and the booking's history records who let the
 * guest in (prd.md §12 requirement 3: authority comes from the staff session).
 *
 * ── The verdict is decided again, here ────────────────────────────────────
 *
 * The list on the phone may be a few minutes old, and a hidden button is not a
 * rule. So the booking is read fresh and `gateVerdictOf()` asked again before
 * the write: an early arrival is refused here as firmly as on screen, and a
 * booking the office has since cancelled is refused rather than walked in.
 * The deposit is decided last of all, under the row lock, by
 * `check_in_booking()` itself.
 *
 * Every refusal is a sentence that tells the guard what to do next.
 */

export interface GateCheckInState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** Named in the toast: "Siti Aminah is checked in". */
  guestName?: string
}

const schema = z.object({
  bookingId: z.string().uuid(),
})

export async function checkInAtGateAction(
  _previous: GateCheckInState,
  formData: FormData,
): Promise<GateCheckInState> {
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
    return { status: 'error', message: gateVerdictSentence(booking.verdict, booking.arrival) }
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
