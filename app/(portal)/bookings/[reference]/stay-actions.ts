'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById, transitionBooking } from '@/lib/db/bookings'
import { checkInBooking } from '@/lib/db/deposits'
import type { Cents } from '@/lib/domain/money'

/**
 * Arriving and leaving.
 *
 * `check_in` and `check_out` have been in the state machine since the first
 * slice and were reachable only from a test. They became actions with the
 * deposit slice, because the unit is inspected after departure and neither
 * moment had anywhere to happen until a booking could actually move.
 *
 * ── Neither collects money ────────────────────────────────────────────────
 *
 * The security deposit is taken when the booking is made — at the counter,
 * or by the transfer a customer promises online — because it is what secures
 * the booking (prd.md §9.1, capability B16). Check-in used to be the place it
 * was collected, and that was the spreadsheet's habit carried over: a guest
 * without the deposit in did not really have a booking. So check-in now takes
 * nothing, and `check_in_booking()` refuses a booking whose quoted deposit is
 * not in the safe. The dialog says so before the click (stay-buttons.tsx) and
 * this reports the refusal after it, in the same words, for the clerk who
 * opened the dialog a second before a colleague verified the transfer.
 *
 * ── Two permissions, one per move ─────────────────────────────────────────
 *
 * `booking.check_in` and `booking.check_out` (open-questions.md N11). Both
 * moves used to borrow `booking.amend`, which would have handed a guard the
 * power to change a booking's dates had it been granted to them. The guard is
 * the front desk and holds both, because he hands the keys over and takes them
 * back (N54, answered by Jason on 14 September 2026). The cleaner checks a
 * guest out when the unit is found empty, and Front Office and Admin hold both
 * so the office can do either from here.
 *
 * The gate's own check-in and check-out are app/(field)/field/arrivals/actions.ts,
 * under the same permissions and through the same writers.
 *
 * Check-out moves the booking and nothing else, so it is an ordinary
 * transition. The deposit stays held: what releases it is an inspection and an
 * approval, days later and by other people (prd.md §11).
 */

export interface StayActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /**
   * What is held against the stay the guest just walked into, so the toast
   * can say the true thing — "BND 100.00 held" — and nothing at all against a
   * booking that quoted none.
   */
  held?: { amount: Cents } | null
}

const stayActionSchema = z.object({
  bookingId: z.string().uuid(),
})

export async function checkInAction(
  _previous: StayActionState,
  formData: FormData,
): Promise<StayActionState> {
  // architecture.md §4: every mutation passes the permission check first.
  const actor = await requirePermission('booking.check_in')

  const parsed = stayActionSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'This booking could not be checked in. Reload the screen.' }
  }

  const { bookingId } = parsed.data

  // Read before the write, so a booking that has already gone is reported as
  // that rather than as a failed transition — and so the revalidation below
  // has a reference and a unit to name.
  const booking = await getBookingById(bookingId)

  if (!booking) {
    return { status: 'error', message: 'That booking no longer exists.' }
  }

  const result = await checkInBooking({ bookingId, actorId: actor.userId })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidateStayScreens(booking.reference, booking.stay?.unitRef ?? null)

  return {
    status: 'done',
    held: result.depositId ? { amount: result.amount } : null,
  }
}

export async function checkOutAction(
  _previous: StayActionState,
  formData: FormData,
): Promise<StayActionState> {
  const actor = await requirePermission('booking.check_out')

  const parsed = stayActionSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'This booking could not be checked out. Reload the screen.' }
  }

  const booking = await getBookingById(parsed.data.bookingId)

  if (!booking) {
    return { status: 'error', message: 'That booking no longer exists.' }
  }

  // An ordinary transition — no new write path was needed, because nothing
  // else moves when a guest leaves.
  const result = await transitionBooking(booking.id, 'check_out', actor.userId)

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidateStayScreens(booking.reference, booking.stay?.unitRef ?? null)

  return { status: 'done' }
}
