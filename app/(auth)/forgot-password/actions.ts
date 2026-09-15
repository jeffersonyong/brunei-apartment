'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'

import { clientIpFrom, hashPublicKey } from '@/lib/auth/access-token'
import {
  canSendPasswordResets,
  configuredPasswordResetTransport,
  deliverPasswordReset,
} from '@/lib/db/password-reset'
import { notePublicAttempt } from '@/lib/db/public-bookings'
import { PASSWORD_RESET_LIMITS } from '@/lib/domain/password-reset'
import { HOUR_IN_SECONDS } from '@/lib/domain/public-booking'
import { env } from '@/lib/env'

/**
 * Asking for a link to set a new password (capability F8).
 *
 * The one staff action with no session behind it besides signing in, so
 * architecture.md §4a's gate applies — Zod at the boundary, a honeypot refused
 * silently, a counter on the caller's address — and one rule sits over all of
 * it: **the reply is the same whoever the address belongs to.** An answer that
 * differed for an address with an account would turn this page into a list of
 * who works here. That is also why the email itself goes out in `after()`: a
 * reply that took a second longer for a real account would say the same thing
 * a different sentence would.
 *
 * **Inert until this deployment can send** (open question N42). The page says
 * so, and this checks again rather than trusting the page, so a request that
 * reaches it anyway mints nothing — minting a link cancels the previous one,
 * so even an unsent one is a change.
 */

const requestSchema = z.object({
  email: z.email('Enter the email you sign in with.'),
  /** The honeypot. A person never sees it, so a value means a script. */
  website: z.string().default(''),
})

export interface ForgotPasswordState {
  status: 'idle' | 'error' | 'sent' | 'unavailable'
  message?: string
  fieldErrors?: Record<string, string>
  /** The address as typed, so the confirmation can name it back. */
  email?: string
}

export async function requestPasswordResetAction(
  _previous: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  if (!canSendPasswordResets()) {
    return { status: 'unavailable' }
  }

  const parsed = requestSchema.safeParse({
    email: formData.get('email') ?? '',
    website: formData.get('website') ?? '',
  })

  if (!parsed.success) {
    return { status: 'error', fieldErrors: { email: 'Enter the email you sign in with.' } }
  }

  const { email, website } = parsed.data

  // The same reply as a real request: naming the check tells a script what to
  // change.
  if (website.trim() !== '') {
    return { status: 'sent', email }
  }

  const ip = clientIpFrom(await headers())

  if (ip) {
    // Fails open, the counters' default. The limit that protects the person
    // being emailed keys on their address and fails closed, inside
    // deliverPasswordReset, so a database hiccup here cannot turn this into a
    // way to fill somebody's inbox.
    const allowed = await notePublicAttempt({
      kind: 'reset:ip',
      keyHash: hashPublicKey(ip),
      windowSeconds: HOUR_IN_SECONDS,
      limit: PASSWORD_RESET_LIMITS.requestsPerIpPerHour,
    })

    if (!allowed) {
      return {
        status: 'error',
        message:
          'That is a lot of requests from this device. Wait a while and try again, or ask an administrator to reset your password.',
      }
    }
  }

  after(async () => {
    try {
      const outcome = await deliverPasswordReset({
        email,
        origin: env.staffOrigin,
        transport: configuredPasswordResetTransport(),
      })

      // Never the address: a Vercel log is not an access-controlled surface.
      if (outcome.status === 'failed') {
        console.error(`Password reset email not sent: ${outcome.failure}`)
      }
    } catch (error) {
      console.error('Password reset email not sent.', error)
    }
  })

  return { status: 'sent', email }
}
