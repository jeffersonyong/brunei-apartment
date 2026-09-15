import { hashPublicKey } from '@/lib/auth/access-token'
import {
  buildBookingEmail,
  type BookingEmailKind,
  type BookingEmailRefusal,
} from '@/lib/domain/booking-email'
import { contact } from '@/lib/domain/contact'
import { entryCodeShownFor, entryUrl } from '@/lib/domain/entry-qr'
import { bookingUrl, findBookingUrl } from '@/lib/domain/origin'
import { DAY_IN_SECONDS, PUBLIC_LIMITS } from '@/lib/domain/public-booking'
import { renderBookingEmail } from '@/lib/email/render'
import { sendEmail, type EmailAttachment, type SendFailureClass } from '@/lib/email/send'
import { env } from '@/lib/env'
import { entryQrPng } from '@/lib/qr/entry-qr'

import { recordAuditEvent } from './audit'
import { getBookingById } from './bookings'
import { getEntryToken } from './entry-qr'
import { notePublicAttempt } from './public-bookings'
import { readPropertySettings } from './settings'

/**
 * The two customer emails, assembled and sent (capability A8).
 *
 * `lib/db/packs.ts`'s seat: it reads the committed facts, hands them to the
 * pure model, has the medium's renderer draw them, does the side effect, and
 * files what happened. The side effect is a POST rather than a Storage upload,
 * which is the only difference between the two modules.
 *
 * ── Split in two on purpose ───────────────────────────────────────────────
 *
 * `buildBookingEmailMessage` stops short of the network, so the assembly —
 * every figure, every sentence, against a real booking in a real database —
 * is covered by an ordinary integration test. `deliverBookingEmail` is that
 * plus one POST and one audit row. The repo mocks nothing, and this is how
 * that stays true with a third party in the path.
 *
 * ── What is recorded, and what is not ─────────────────────────────────────
 *
 * An `email.sent` or `email.failed` row means the product *tried*. Three
 * things are deliberately silent:
 *
 *   - **A booking with no address.** Nothing happened. The desk can see the
 *     absence on the booking itself, and a row per walk-in forever would bury
 *     the rows that matter.
 *   - **A booking that moved on.** The email described a moment that has
 *     passed; the move itself is already in the trail.
 *   - **A deployment with no mail service configured** — a local run, a
 *     preview, anywhere without a verified sending domain. That is one fact about
 *     the environment, not a fact about each booking, and writing it against
 *     every booking would be the same row several hundred times.
 *
 * The recipient's **domain** is recorded and never the address itself:
 * `audit_event` is append-only by trigger, so nothing written there can be
 * redacted later, and `gmail.com` is enough to spot a pattern.
 */

export type BookingEmailSkip = BookingEmailRefusal | 'booking_missing' | 'not_configured'

export type BookingEmailOutcome =
  | { status: 'sent'; providerId: string }
  | { status: 'skipped'; reason: BookingEmailSkip }
  | { status: 'failed'; failure: SendFailureClass | 'rate_limited' }

export interface BookingEmailMessage {
  to: string
  subject: string
  html: string
  text: string
  /** The entry QR code on a confirmed email, shown inline and forwardable. Empty otherwise. */
  attachments: readonly EmailAttachment[]
}

export type BuildBookingEmailMessageResult =
  { ok: true; message: BookingEmailMessage } | { ok: false; reason: BookingEmailSkip }

/**
 * Everything except the send. No network, so a test can assert the whole
 * assembly against a booking the application actually produced.
 *
 * `staffOrigin` is where the entry code points (lib/domain/entry-qr.ts): the
 * staff host, because that is where a guard's session lives.
 */
export async function buildBookingEmailMessage(input: {
  kind: BookingEmailKind
  bookingId: string
  origin: string
  staffOrigin: string
}): Promise<BuildBookingEmailMessageResult> {
  const booking = await getBookingById(input.bookingId)

  if (!booking) {
    return { ok: false, reason: 'booking_missing' }
  }

  // Only the confirmation carries the code, so only it reads the token. The
  // database issued it in the same write that confirmed the booking.
  const codeUrl =
    input.kind === 'booking_confirmed' && entryCodeShownFor(booking.status)
      ? entryUrl(input.staffOrigin, await getEntryToken(booking.id))
      : null

  const settings = await readPropertySettings()
  const unitTypeName =
    booking.stay === null
      ? null
      : (settings.unitTypes.find((type) => type.slug === booking.stay?.unitTypeId)?.name ?? null)

  const built = buildBookingEmail({
    kind: input.kind,
    booking,
    property: {
      name: settings.name,
      checkInTime: settings.policy.checkInTime,
      checkOutTime: settings.policy.checkOutTime,
      bankAccounts: settings.bankAccounts,
      unitTypeName,
    },
    contact,
    bookingUrl: bookingUrl(input.origin, booking.accessToken),
    findBookingUrl: findBookingUrl(input.origin),
    hasEntryCode: codeUrl !== null,
  })

  if (!built.ok) {
    return { ok: false, reason: built.reason }
  }

  const rendered = renderBookingEmail(built.model)
  const code = built.model.entryCode

  // Inline and forwardable at once: the HTML shows it by `cid:`, and the same
  // file is an ordinary attachment a guest can send on to whoever is driving.
  // The PNG is the same bytes for the same URL, so a retry under the one
  // idempotency key sends the same body.
  const attachments: EmailAttachment[] =
    code !== null && codeUrl !== null
      ? [
          {
            filename: code.filename,
            content: (await entryQrPng(codeUrl)).toString('base64'),
            contentType: 'image/png',
            contentId: code.contentId,
          },
        ]
      : []

  return {
    ok: true,
    message: {
      // Non-null by construction: the model refuses `no_address` before this.
      to: booking.guestEmail ?? '',
      subject: built.model.subject,
      html: rendered.html,
      text: rendered.text,
      attachments,
    },
  }
}

export async function deliverBookingEmail(input: {
  kind: BookingEmailKind
  bookingId: string
}): Promise<BookingEmailOutcome> {
  const apiKey = env.resendApiKey

  if (apiKey === null) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  const built = await buildBookingEmailMessage({
    ...input,
    origin: env.siteOrigin,
    staffOrigin: env.staffOrigin,
  })

  if (!built.ok) {
    return { status: 'skipped', reason: built.reason }
  }

  const allowed = await notePublicAttempt({
    kind: 'email:booking',
    keyHash: hashPublicKey(built.message.to),
    windowSeconds: DAY_IN_SECONDS,
    limit: PUBLIC_LIMITS.emailsPerAddressPerDay,
    // The one counter in the product that fails closed — see notePublicAttempt.
    onError: 'deny',
  })

  if (!allowed) {
    await record(input, 'email.failed', { failure: 'rate_limited', status: null })

    return { status: 'failed', failure: 'rate_limited' }
  }

  const result = await sendEmail(apiKey, env.emailFrom, {
    ...built.message,
    idempotencyKey: `pv.${input.kind}.${input.bookingId}`,
  })

  if (!result.ok) {
    await record(input, 'email.failed', {
      failure: result.failure.class,
      status: result.failure.status,
    })

    return { status: 'failed', failure: result.failure.class }
  }

  await record(input, 'email.sent', {
    provider_id: result.providerId,
    domain: domainOf(built.message.to),
  })

  return { status: 'sent', providerId: result.providerId }
}

function record(
  input: { kind: BookingEmailKind; bookingId: string },
  action: 'email.sent' | 'email.failed',
  extra: Record<string, unknown>,
): Promise<void> {
  return recordAuditEvent({
    // Nobody pressed a button — the system sent it, and the history renders an
    // actorless event as the system, which is the truth (lib/db/packs.ts).
    actorId: null,
    action,
    entityType: 'booking',
    entityId: input.bookingId,
    after: { kind: input.kind, ...extra },
  })
}

/**
 * The half of an address that is safe to keep for ever. Shared with the staff
 * password reset email (lib/db/password-reset.ts), which files the same fact.
 */
export function domainOf(address: string): string | null {
  const at = address.lastIndexOf('@')

  return at === -1 ? null : address.slice(at + 1).toLowerCase()
}
