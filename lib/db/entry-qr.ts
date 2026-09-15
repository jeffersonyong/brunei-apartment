import type { BookingStatus } from '@/lib/domain/booking-state'
import { entryCodeShownFor, entryUrl, isEntryToken } from '@/lib/domain/entry-qr'
import { env } from '@/lib/env'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * What a booking's code encodes, or null when none is shown for it — never
 * confirmed, already over, or a deployment with no origin to point it at. The
 * one answer the portal, the guest's page and both downloads read, so none of
 * them can show a code another refuses.
 *
 * **Never throws.** `env.staffOrigin` does when `SITE_ORIGIN` is unset, which
 * is right on the email path — a deployment that means to send should fail
 * loudly — but these callers are the booking screens themselves, and a missing
 * variable must cost the code, not the page.
 */
export async function getEntryCodeUrl(booking: {
  id: string
  status: BookingStatus
}): Promise<string | null> {
  const origin = entryCodeOrigin()

  if (origin === null || !entryCodeShownFor(booking.status)) {
    return null
  }

  return entryUrl(origin, await getEntryToken(booking.id))
}

/** The origin a code points at, or null where this deployment configures none. */
export function entryCodeOrigin(): string | null {
  try {
    return env.staffOrigin
  } catch {
    return null
  }
}

/**
 * The entry code's reads and its one write (capability A8's QR half, D3;
 * architecture.md §7).
 *
 * The token is **issued by the database** when a booking is first confirmed
 * (migration 20260929000100), so nothing here mints one on the ordinary path.
 * What is left is reading it, finding a booking by it, and replacing it.
 *
 * Read from `booking` rather than `booking_summary`: one column is not worth
 * rebuilding a view every other reader depends on, and the token is a
 * credential that only these callers should be selecting.
 */

/** A booking's entry token, or null when it has none — it has never been confirmed. */
export async function getEntryToken(bookingId: string): Promise<string | null> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('booking')
    .select('qr_token')
    .eq('property_id', propertyId)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read the entry code for booking ${bookingId}: ${error.message}`)
  }

  return (data as { qr_token: string | null } | null)?.qr_token ?? null
}

/**
 * The booking a scanned code belongs to.
 *
 * The shape is checked before the token reaches a query, and a malformed token
 * and an unknown one both come back null, so the page can give a guesser the
 * same answer for both.
 */
export async function findBookingIdByEntryToken(token: string): Promise<string | null> {
  if (!isEntryToken(token)) {
    return null
  }

  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('booking')
    .select('id')
    .eq('property_id', propertyId)
    .eq('qr_token', token)
    .maybeSingle()

  if (error) {
    // The token is a credential, so it is named in no message a log might keep.
    throw new Error(`Could not find the booking for an entry code: ${error.message}`)
  }

  return (data as { id: string } | null)?.id ?? null
}

export type ReissueEntryTokenError =
  /** No such booking on this property. */
  | 'not_found'
  /** Never confirmed, so it has no code to replace. */
  | 'not_confirmed'
  /** Finished, cancelled or expired: its code already opens a closed page. */
  | 'booking_closed'
  /** The generator repeated itself twice running. */
  | 'token_collision'

export type ReissueEntryTokenResult =
  { ok: true; token: string } | { ok: false; error: ReissueEntryTokenError }

/**
 * Replaces a booking's code: the old one stops opening anything in the same
 * statement, and the trail records who did it.
 *
 * Retried once on a collision, as `issueAccessToken` is: at 128 bits a second
 * collision means the generator is broken, and saying so beats a loop.
 */
export async function reissueEntryToken(input: {
  bookingId: string
  actorId: string
}): Promise<ReissueEntryTokenResult> {
  const propertyId = await currentPropertyId()

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await dataClient().rpc('reissue_booking_qr_token', {
      p_property_id: propertyId,
      p_booking_id: input.bookingId,
      p_actor_id: input.actorId,
    })

    if (error) {
      throw new Error(`Could not replace the entry code: ${error.message}`)
    }

    const result = data as { ok: boolean; error?: ReissueEntryTokenError; qr_token?: string }

    if (result.ok && result.qr_token) {
      return { ok: true, token: result.qr_token }
    }

    if (result.error !== 'token_collision') {
      return { ok: false, error: result.error ?? 'not_found' }
    }
  }

  return { ok: false, error: 'token_collision' }
}
