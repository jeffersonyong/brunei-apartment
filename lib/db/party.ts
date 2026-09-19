import type { DayPassPartyLine } from '@/lib/domain/day-pass-capacity'
import type { BookingLine } from '@/lib/domain/lines'
import type { Cents } from '@/lib/domain/money'
import type { StayParty } from '@/lib/domain/pricing/stay'
import { dataClient } from '@/lib/supabase/data'

import { extraUnavailableMessage } from './booking-extras'
import { currentPropertyId } from './property'

/**
 * How many people a booking is for, after it was sold (Jason's team,
 * 19 September 2026): the office changing the party, the gate adding the
 * visitors it counted to a day pass, and the guard telling the office that
 * more people arrived than a booking is for.
 *
 * The writes are supabase/migrations/20261005000100 — `change_booking_party()`
 * and `report_extra_guests()`. Pricing is the caller's, from lib/domain: the
 * functions take the line set exactly as `amend_booking()` does.
 */

export interface ChangeBookingPartyInput {
  bookingId: string
  /** The `updated_at` read before pricing, as the opaque string it arrived as. */
  expectedUpdatedAt: string
  party: StayParty
  total: Cents
  lines: readonly BookingLine[]
  /** A day pass's bands and headcount. Null for a stay. */
  pass: { party: readonly DayPassPartyLine[]; headcount: number } | null
  reason: string | null
  actorId: string | null
}

export type ChangeBookingPartyErrorCode =
  'not_found' | 'changed' | 'booking_closed' | 'capacity_exceeded' | 'extra_unavailable'

export interface ChangeBookingPartyError {
  code: ChangeBookingPartyErrorCode
  /** Written for a staff member at the office; the gate words its own. */
  message: string
}

export type ChangeBookingPartyResult = { ok: true } | { ok: false; error: ChangeBookingPartyError }

export async function changeBookingParty(
  input: ChangeBookingPartyInput,
): Promise<ChangeBookingPartyResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('change_booking_party', {
    p_property_id: propertyId,
    p_booking_id: input.bookingId,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_chargeable_guests: input.party.chargeableGuests,
    p_exempt_guests: input.party.exemptGuests,
    p_total_cents: input.total,
    p_lines: input.lines,
    p_pass_party: input.pass?.party ?? null,
    p_pass_headcount: input.pass?.headcount ?? null,
    p_reason: input.reason,
    p_actor_id: input.actorId,
  })

  if (error) {
    // The stock trigger is deferred, so it answers at commit as an error
    // rather than a result — see `amendBooking`. A party change re-inserts
    // the extras it already held, so this is the rare case of a night already
    // oversold by somebody else.
    const takenAlready = extraUnavailableMessage(error.message)

    if (takenAlready) {
      return { ok: false, error: { code: 'extra_unavailable', message: takenAlready } }
    }

    throw new Error(`Could not change the party: ${error.message}`)
  }

  const result = data as
    | { ok: true }
    | {
        ok: false
        error: Exclude<ChangeBookingPartyErrorCode, 'extra_unavailable'>
        remaining?: number
      }

  if (result.ok) {
    return { ok: true }
  }

  return { ok: false, error: { code: result.error, message: messageOf(result) } }
}

function messageOf(result: {
  error: Exclude<ChangeBookingPartyErrorCode, 'extra_unavailable'>
  remaining?: number
}): string {
  switch (result.error) {
    case 'not_found':
      return 'That booking no longer exists.'
    case 'changed':
      return 'Someone else changed this booking while you were working on it. Reload and retry.'
    case 'booking_closed':
      return 'This booking is closed, so its party can no longer be changed. Settle anything owed from the deposit.'
    case 'capacity_exceeded':
      return result.remaining === 0 || result.remaining === undefined
        ? 'The facilities are full for that day, so nobody more can be added.'
        : `Only ${result.remaining} more ${result.remaining === 1 ? 'place is' : 'places are'} left that day.`
  }
}

export interface ReportExtraGuestsInput {
  bookingId: string
  /** How many more people arrived than the booking is for. */
  extra: number
  /** The note the office reads. */
  body: string
  /** What the guard took for them, when he added them to a pass himself. */
  addedCents: Cents | null
  actorId: string | null
}

/** The guard's word to the office: a note on the booking, and the event the bell reads. */
export async function reportExtraGuests(
  input: ReportExtraGuestsInput,
): Promise<{ ok: true } | { ok: false; error: 'not_found' }> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('report_extra_guests', {
    p_property_id: propertyId,
    p_booking_id: input.bookingId,
    p_extra: input.extra,
    p_body: input.body,
    p_added_cents: input.addedCents,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not record the extra guests: ${error.message}`)
  }

  const result = data as { ok: true } | { ok: false; error: 'not_found' }

  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

/**
 * The bands each day pass was sold for, keyed by booking — one read for the
 * whole set, never one per pass. A booking with no pass row is absent.
 */
export async function listDayPassParties(
  bookingIds: readonly string[],
): Promise<ReadonlyMap<string, readonly DayPassPartyLine[]>> {
  if (bookingIds.length === 0) {
    return new Map()
  }

  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('day_pass')
    .select('booking_id, party')
    .eq('property_id', propertyId)
    .in('booking_id', [...bookingIds])

  if (error) {
    throw new Error(`Could not read the day passes' parties: ${error.message}`)
  }

  return new Map(
    (data as { booking_id: string; party: DayPassPartyLine[] }[]).map((row) => [
      row.booking_id,
      row.party,
    ]),
  )
}
