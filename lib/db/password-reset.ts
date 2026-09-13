import { randomUUID } from 'node:crypto'

import { hashPublicKey } from '@/lib/auth/access-token'
import {
  buildPasswordResetEmail,
  PASSWORD_RESET_LIMITS,
  resetPasswordUrl,
} from '@/lib/domain/password-reset'
import { HOUR_IN_SECONDS } from '@/lib/domain/public-booking'
import { renderPasswordResetEmail } from '@/lib/email/render'
import { sendEmail, type SendFailureClass } from '@/lib/email/send'
import { env } from '@/lib/env'
import { dataClient } from '@/lib/supabase/data'

import { recordAuditEvent } from './audit'
import { domainOf } from './booking-emails'
import { notePublicAttempt } from './public-bookings'
import { isAccountDisabled } from './staff'

/**
 * Emailing a staff member a link to choose a new password (capability F8).
 *
 * **Sent through the product's own mail path, not Supabase's.** GoTrue's
 * mailer on a hosted project delivers only to the project's own team, a couple
 * an hour, until it is given separate SMTP credentials — and it would be a
 * second sender, a second template in a second design, and a second switch.
 * `auth.admin.generateLink` mints the link without sending anything, and the
 * Resend path the booking emails use carries it: one sender, one design, one
 * key that turns every email on (architecture.md §9).
 *
 * **Nothing is minted before it is needed.** GoTrue cancels an account's
 * previous link every time it mints one, so a request that cannot send must
 * stop before `generateLink`, or it would quietly kill a link somebody is about
 * to use.
 */

/** Where the email goes out, injected so the path up to the send is testable. */
export interface PasswordResetTransport {
  apiKey: string
  from: string
  send: typeof sendEmail
}

export type PasswordResetOutcome =
  | { status: 'sent'; providerId: string }
  | {
      status: 'skipped'
      reason: 'not_configured' | 'rate_limited' | 'no_account' | 'disabled'
    }
  | { status: 'failed'; failure: SendFailureClass }

/**
 * Whether this deployment can send a reset link — the switch behind "Forgot
 * password?" (open question N42). The Resend key is the whole of it, exactly as
 * for the booking emails: absent is a supported configuration, not a fault.
 */
export function canSendPasswordResets(): boolean {
  return env.resendApiKey !== null
}

export function configuredPasswordResetTransport(): PasswordResetTransport | null {
  const apiKey = env.resendApiKey

  return apiKey === null ? null : { apiKey, from: env.emailFrom, send: sendEmail }
}

/**
 * Sends the link, or decides not to. The caller learns nothing it may repeat
 * to the requester: every outcome here reads the same on the screen, and this
 * return value exists for the log and the tests.
 */
export async function deliverPasswordReset(input: {
  email: string
  origin: string
  transport: PasswordResetTransport | null
}): Promise<PasswordResetOutcome> {
  if (input.transport === null) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  // GoTrue stores addresses in lowercase, and the counter should not see two
  // allowances where there is one inbox.
  const email = input.email.trim().toLowerCase()

  // Counted before the account is looked up, so an address with no account
  // spends its allowance exactly as a real one does.
  const allowed = await notePublicAttempt({
    kind: 'email:password_reset',
    keyHash: hashPublicKey(email),
    windowSeconds: HOUR_IN_SECONDS,
    limit: PASSWORD_RESET_LIMITS.emailsPerAddressPerHour,
    // It protects the recipient, like the booking email's counter, so it fails
    // closed like that one (lib/db/public-bookings.ts).
    onError: 'deny',
  })

  if (!allowed) {
    return { status: 'skipped', reason: 'rate_limited' }
  }

  const { data, error } = await dataClient().auth.admin.generateLink({ type: 'recovery', email })

  if (error) {
    if (error.code === 'user_not_found') {
      return { status: 'skipped', reason: 'no_account' }
    }

    throw new Error(`Could not create a password reset link: ${error.message}`)
  }

  // An administrator disabled this account. GoTrue mints the link regardless
  // and refuses it on use, so the email would only be a dead end.
  if (isAccountDisabled(data.user)) {
    return { status: 'skipped', reason: 'disabled' }
  }

  const recipient = data.user.email ?? email
  const message = buildPasswordResetEmail({
    email: recipient,
    resetUrl: resetPasswordUrl(input.origin, data.properties.hashed_token),
  })
  const rendered = renderPasswordResetEmail(message)

  const result = await input.transport.send(input.transport.apiKey, input.transport.from, {
    to: recipient,
    subject: message.subject,
    html: rendered.html,
    text: rendered.text,
    // Per request, never per account. Each request mints a new link and
    // cancels the last, so a key shared across requests would have Resend
    // replay the first email — carrying the link the second one cancelled.
    idempotencyKey: `pv.password_reset.${randomUUID()}`,
  })

  if (!result.ok) {
    await record(data.user.id, 'email.failed', {
      failure: result.failure.class,
      status: result.failure.status,
    })

    return { status: 'failed', failure: result.failure.class }
  }

  await record(data.user.id, 'email.sent', {
    provider_id: result.providerId,
    domain: domainOf(recipient),
  })

  return { status: 'sent', providerId: result.providerId }
}

/**
 * Filed against the staff account, with no actor: nobody was signed in to ask,
 * and the history renders an actorless event as the system. The address itself
 * is never written — only its domain — because the trail is append-only and an
 * address cannot be redacted from it later.
 */
function record(
  userId: string,
  action: 'email.sent' | 'email.failed',
  extra: Record<string, unknown>,
): Promise<void> {
  return recordAuditEvent({
    actorId: null,
    action,
    entityType: 'staff_user',
    entityId: userId,
    after: { kind: 'password_reset', ...extra },
  })
}
