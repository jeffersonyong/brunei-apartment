import { transition, type BookingStatus } from '@/lib/domain/booking-state'
import { formatStayDate } from '@/lib/domain/dates'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * Admitting a day pass (N40, N54): the gate's move for a visitor who paid
 * ahead, and the desk's for one who paid at the office.
 *
 * ── Admitting closes the pass ─────────────────────────────────────────────
 *
 * A pass has no unit to leave, so nothing would ever close it later — which
 * is why N40 kept passes off the guard's buttons until now. `admit` moves it
 * `confirmed → completed`, a ticket torn at the door. The gate keeps an
 * admitted pass on today's list (./gate.ts), so the car that comes back after
 * lunch is still recognised.
 *
 * ── Where each rule is decided ────────────────────────────────────────────
 *
 * The status pair is derived here by `transition()` (architecture.md §5.3).
 * `admit_day_pass()` applies it under the booking's row lock after the three
 * checks only it can make at that moment: that the booking is a pass, that
 * today is its date in the property's timezone, and that verified payments
 * cover the total. Every refusal is a value with a sentence, because none of
 * them is a fault — a pass for tomorrow, or one admitted a moment ago by
 * somebody else, is a message on screen.
 */

export type AdmitRefusalCode =
  | 'not_found'
  | 'not_a_day_pass'
  | 'status_changed'
  | 'not_today'
  | 'owed'
  | 'illegal_transition'
  | 'terminal_state'

export interface AdmitDayPassInput {
  bookingId: string
  actorId: string | null
}

export type AdmitDayPassResult =
  | { ok: true; status: BookingStatus }
  | { ok: false; error: { code: AdmitRefusalCode; message: string } }

interface AdmitRefusal {
  ok: false
  error: string
  pass_date?: string
}

export async function admitDayPass(input: AdmitDayPassInput): Promise<AdmitDayPassResult> {
  const propertyId = await currentPropertyId()

  const { data: booking, error: readError } = await dataClient()
    .from('booking')
    .select('status')
    .eq('property_id', propertyId)
    .eq('id', input.bookingId)
    .maybeSingle()

  if (readError) {
    throw new Error(`Could not read booking ${input.bookingId}: ${readError.message}`)
  }

  if (!booking) {
    return { ok: false, error: { code: 'not_found', message: 'That booking no longer exists.' } }
  }

  const current = booking as { status: BookingStatus }
  const next = transition(current.status, 'admit')

  if (!next.ok) {
    return { ok: false, error: next.error }
  }

  const { data, error } = await dataClient().rpc('admit_day_pass', {
    p_property_id: propertyId,
    p_booking_id: input.bookingId,
    p_from_status: current.status,
    p_to_status: next.status,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not admit the day pass: ${error.message}`)
  }

  const result = data as { ok: true; status: BookingStatus } | AdmitRefusal

  if (!result.ok) {
    return { ok: false, error: describeAdmitRefusal(result) }
  }

  return { ok: true, status: result.status }
}

/** The desk's sentences. The gate says its own, without figures (lib/domain/gate.ts). */
function describeAdmitRefusal(result: AdmitRefusal): { code: AdmitRefusalCode; message: string } {
  switch (result.error) {
    case 'not_a_day_pass':
      return {
        code: result.error,
        message: 'This booking is a stay. A stay is checked in, not admitted.',
      }
    case 'status_changed':
      return {
        code: result.error,
        message:
          'Someone else moved this booking while you were working on it. Reload and try again.',
      }
    case 'not_today':
      return {
        code: result.error,
        message:
          typeof result.pass_date === 'string'
            ? `This day pass is for ${formatStayDate(result.pass_date)}, and can only be admitted on that day.`
            : 'This day pass is for another day, and can only be admitted on its own day.',
      }
    case 'owed':
      return {
        code: result.error,
        message: 'This day pass is not paid in full. Take the rest from the booking, then admit it.',
      }
    default:
      return { code: 'not_found', message: 'That booking no longer exists.' }
  }
}
