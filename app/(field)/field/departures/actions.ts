'use server'

import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById, transitionBooking } from '@/lib/db/bookings'
import { getTurnover } from '@/lib/db/housekeeping'
import { recordInspection } from '@/lib/db/inspections'
import { todayInBrunei } from '@/lib/domain/dates'
import {
  checkInspectionNotes,
  isInspectionOutcome,
  MAX_INSPECTION_NOTES_LENGTH,
  type InspectionOutcome,
} from '@/lib/domain/inspection'
import { turnoverRefusalSentence } from '@/lib/domain/turnover'

/**
 * Housekeeping's two writes from the phone (capabilities C1, C2).
 *
 * The third — marking the unit ready — is `markUnitReadyAction` beside the
 * unit's other actions (app/(portal)/portal/units/[ref]/actions.ts), shared with
 * the unit's page so there is one path for it. Photographs go through the
 * documents slice's `attachDocumentAction`, one request each, as they do from
 * the portal's inspection dialog.
 *
 * ── The step is decided again, here ───────────────────────────────────────
 *
 * The list on the phone may be a few minutes old and a hidden button is not a
 * rule, which is the gate's reasoning too (app/(field)/field/arrivals/actions.ts).
 * So "Guest has left" reads the turnover fresh and refuses a guest who is not
 * due out: the cleaner cannot check out somebody who is only out for the day.
 * The inspection needs no such check — `record_inspection()` already refuses a
 * stay that has not ended or has been inspected, and it is the same function
 * the portal calls.
 */

export interface TurnoverActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  fieldErrors?: Record<string, string>
  /**
   * The inspection this call just wrote, so the form can send the photographs
   * against it — see inspection-form.tsx.
   */
  inspectionId?: string
}

const bookingSchema = z.object({
  bookingId: z.string().uuid(),
})

/** "Guest has left" — checks the guest out, under `booking.check_out` (D-2). */
export async function guestHasLeftAction(
  _previous: TurnoverActionState,
  formData: FormData,
): Promise<TurnoverActionState> {
  const actor = await requirePermission('booking.check_out')
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: turnoverRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const turnover = await getTurnover(parsed.data.bookingId, today)

  if (turnover?.step !== 'guest_leaving') {
    return { status: 'error', message: await whyNotLeaving(parsed.data.bookingId) }
  }

  // The same ordinary transition the desk's Check out button makes
  // (app/(portal)/portal/bookings/[reference]/stay-actions.ts).
  const result = await transitionBooking(turnover.bookingId, 'check_out', actor.userId)

  if (!result.ok) {
    // The desk may have checked them out a moment ago — done rather than
    // failed, so look before choosing the sentence.
    const now = await getBookingById(turnover.bookingId)

    return {
      status: 'error',
      message:
        now?.status === 'completed'
          ? turnoverRefusalSentence('already_left')
          : result.error.message,
    }
  }

  revalidateStayScreens(turnover.reference, turnover.unitRef)

  return { status: 'done' }
}

async function whyNotLeaving(bookingId: string): Promise<string> {
  const booking = await getBookingById(bookingId)

  switch (booking?.status) {
    case 'completed':
      return turnoverRefusalSentence('already_left')
    case 'checked_in':
      return turnoverRefusalSentence('not_due_out')
    default:
      return turnoverRefusalSentence('not_found')
  }
}

const inspectionSchema = z.object({
  bookingId: z.string().uuid(),
  outcome: z.string().refine(isInspectionOutcome, 'Choose how the unit was found.'),
  notes: z
    .string()
    .trim()
    .max(
      MAX_INSPECTION_NOTES_LENGTH,
      `Keep the notes under ${MAX_INSPECTION_NOTES_LENGTH.toLocaleString('en-GB')} characters.`,
    )
    .default(''),
})

/** Records how the unit was found, under `inspection.record`. */
export async function recordFieldInspectionAction(
  _previous: TurnoverActionState,
  formData: FormData,
): Promise<TurnoverActionState> {
  const actor = await requirePermission('inspection.record')
  const parsed = inspectionSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}

    for (const issue of parsed.error.issues) {
      const field = issue.path[0]

      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }

    return { status: 'error', message: 'Check the highlighted fields.', fieldErrors }
  }

  const { bookingId, notes } = parsed.data
  const outcome = parsed.data.outcome as InspectionOutcome

  // The rule lives in lib/domain so this form and the portal's agree about
  // it, and the database refuses last.
  const check = checkInspectionNotes(outcome, notes)

  if (!check.ok) {
    return {
      status: 'error',
      message: check.error.message,
      fieldErrors: { notes: check.error.message },
    }
  }

  const booking = await getBookingById(bookingId)

  if (!booking) {
    return { status: 'error', message: turnoverRefusalSentence('not_found') }
  }

  const result = await recordInspection({
    bookingId: booking.id,
    outcome,
    notes: notes.length > 0 ? notes : null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidateStayScreens(booking.reference, booking.stay?.unitRef ?? null)

  return { status: 'done', inspectionId: result.inspectionId }
}
