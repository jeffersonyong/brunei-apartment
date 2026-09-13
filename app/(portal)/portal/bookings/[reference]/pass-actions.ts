'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById } from '@/lib/db/bookings'
import { admitDayPass } from '@/lib/db/day-pass-admission'

/**
 * Admitting a day pass from the desk (N54).
 *
 * The gate admits most passes. This is for the visitor who was sent to the
 * office — to pay the rest, or because the guard's list was out of date — and
 * is standing at the counter. The gate's own action is
 * app/(field)/field/arrivals/actions.ts, under the same `day_pass.admit` and
 * through the same `admitDayPass()`, so a pass is admitted one way wherever it
 * happens and cannot be admitted twice.
 */

export interface PassActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
}

const schema = z.object({
  bookingId: z.string().uuid(),
})

export async function admitAction(
  _previous: PassActionState,
  formData: FormData,
): Promise<PassActionState> {
  // architecture.md §4: every mutation passes the permission check first.
  const actor = await requirePermission('day_pass.admit')

  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'This day pass could not be admitted. Reload the screen.' }
  }

  // Read before the write, so the revalidation below has a reference to name.
  const booking = await getBookingById(parsed.data.bookingId)

  if (!booking) {
    return { status: 'error', message: 'That booking no longer exists.' }
  }

  const result = await admitDayPass({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidateStayScreens(booking.reference, null)

  return { status: 'done' }
}
