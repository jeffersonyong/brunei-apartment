import type { BookingStatus } from './booking-state'
import { normaliseOrigin } from './origin'

/**
 * The entry QR code (capability A8's QR half, D3; prd.md §12, architecture.md §7).
 *
 * A confirmed booking carries a code that opens `/c/{token}`. The token is
 * issued by the database the moment the booking is confirmed, and it grants
 * nothing: what the page lets a reader do is decided by their staff session.
 * Everything here is pure — the rules a screen, an email and the scan page
 * must agree on.
 */

/** `booking.qr_token`'s CHECK constraint: 16 bytes in base64url. */
export const ENTRY_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/

export function isEntryToken(value: string): boolean {
  return ENTRY_TOKEN_PATTERN.test(value)
}

/**
 * Where the code points: the **staff** host.
 *
 * Staff sessions are host-only cookies on the portal host (architecture.md §3),
 * so a code on the site's host would show a signed-in guard the stranger's
 * summary instead of the check-in. A customer who scans their own code lands on
 * the portal host too, and sees only that summary.
 */
export function entryUrl(staffOrigin: string, token: string | null): string | null {
  if (token === null || !isEntryToken(token)) {
    return null
  }

  const base = normaliseOrigin(staffOrigin)

  return base === null ? null : `${base}/c/${token}`
}

/**
 * Whether a booking's code is shown and sent: while the guest can still come
 * through the gate on it. The token outlives that — a cancelled booking keeps
 * its token and the page says it is closed — but nobody is handed a code for a
 * booking they cannot use.
 */
export function entryCodeShownFor(status: BookingStatus): boolean {
  return status === 'confirmed' || status === 'checked_in'
}

/**
 * The downloaded image's name: the reference first, so a folder sorts by booking.
 *
 * It lands inside a `Content-Disposition` header, so anything that is not a
 * plain filename character is dropped. A reference is `PV-` and digits today,
 * written by the database; this keeps a future change to that shape from
 * becoming a header someone can break out of.
 */
export function entryQrFilename(reference: string): string {
  return `${reference.replace(/[^A-Za-z0-9_-]/g, '')}-entry-qr.png`
}

/**
 * The guest's name as a stranger holding the code sees it: the first name and
 * the next name's initial — "Siti A." — or a lone initial for a one-word name.
 *
 * Enough for a guest to recognise their own booking, and too little to learn
 * whose it is from a code photographed on somebody's dashboard.
 */
export function maskGuestName(name: string): string {
  const [first, second] = name.trim().split(/\s+/)

  if (!first) {
    return 'Guest'
  }

  if (!second) {
    return `${first.charAt(0).toUpperCase()}.`
  }

  return `${first} ${second.charAt(0).toUpperCase()}.`
}

/** Where the booking stands, in one sentence for anybody holding the code. */
export function entrySummarySentence(status: BookingStatus): string {
  switch (status) {
    case 'confirmed':
      return 'This booking is confirmed. Show this code at the gate.'
    case 'checked_in':
      return 'The guest is checked in.'
    case 'completed':
      return 'This booking has ended.'
    case 'cancelled':
    case 'expired':
    case 'no_show':
      return 'This booking is no longer live.'
    case 'draft':
    case 'held':
    case 'awaiting_payment_verification':
      return 'This booking is not confirmed yet.'
  }
}
