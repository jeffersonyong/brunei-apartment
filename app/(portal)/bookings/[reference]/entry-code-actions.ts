'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById } from '@/lib/db/bookings'
import { reissueEntryToken, type ReissueEntryTokenError } from '@/lib/db/entry-qr'

/**
 * Replacing a booking's entry QR code (capability D3; architecture.md §7).
 *
 * For the code that has leaked or been forwarded somewhere it should not be.
 * It answers to `booking.amend` — the desk and Admin, who can already change
 * the booking itself (Jeff, 15 September 2026). The old code stops opening the
 * booking in the same write, and the history names who replaced it.
 */

export interface EntryCodeActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
}

const schema = z.object({
  bookingId: z.string().uuid(),
})

const REFUSALS: Readonly<Record<ReissueEntryTokenError, string>> = {
  not_found: 'That booking no longer exists.',
  not_confirmed: 'This booking is not confirmed yet, so it has no code to replace.',
  booking_closed: 'This booking is closed, so there is no code to replace.',
  token_collision: 'A new code could not be made. Try again.',
}

export async function replaceEntryCodeAction(
  _previous: EntryCodeActionState,
  formData: FormData,
): Promise<EntryCodeActionState> {
  // architecture.md §4: every mutation passes the permission check first.
  const actor = await requirePermission('booking.amend')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'The code could not be replaced. Reload the screen.' }
  }

  // Read first, so the revalidation below has a reference to name.
  const booking = await getBookingById(parsed.data.bookingId)

  if (!booking) {
    return { status: 'error', message: REFUSALS.not_found }
  }

  const result = await reissueEntryToken({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    return { status: 'error', message: REFUSALS[result.error] }
  }

  revalidatePath(`/bookings/${booking.reference}`)

  return { status: 'done' }
}
