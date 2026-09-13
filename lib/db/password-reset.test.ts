import { randomUUID } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, test } from 'vitest'

import type { OutgoingEmail, SendResult } from '@/lib/email/send'
import { env } from '@/lib/env'
import { PASSWORD_RESET_LIMITS, tokenFromFragment } from '@/lib/domain/password-reset'
import { dataClient } from '@/lib/supabase/data'

import { deliverPasswordReset, type PasswordResetTransport } from './password-reset'

/**
 * A staff member asking for a reset link (capability F8), against the real
 * auth server and the real counters.
 *
 * The send is faked — a transport that records the message — and everything
 * up to it is real. What only the auth server can answer is whether the link
 * in the email actually signs its owner in, and whether a request that should
 * not send leaves an earlier link alone: GoTrue cancels the previous link every
 * time it mints one, so minting "just in case" is itself a change.
 *
 * Subjects are throwaway accounts. The events here have no actor — nobody was
 * signed in — so none of them pins its subject, and each is deleted afterwards.
 */

const ORIGIN = 'https://palmvilla.test'

const createdUserIds: string[] = []

afterEach(async () => {
  for (const userId of createdUserIds.splice(0)) {
    await dataClient().auth.admin.deleteUser(userId)
  }
})

async function givenStaff(options: { disabled?: boolean } = {}): Promise<{
  id: string
  email: string
}> {
  const email = `reset-${randomUUID()}@example.test`
  const { data, error } = await dataClient().auth.admin.createUser({
    email,
    password: 'test-password',
    email_confirm: true,
  })

  if (error || !data.user) {
    throw new Error(`Test setup could not create a staff account: ${error?.message}`)
  }

  createdUserIds.push(data.user.id)

  if (options.disabled) {
    const { error: banError } = await dataClient().auth.admin.updateUserById(data.user.id, {
      ban_duration: '1h',
    })

    if (banError) {
      throw new Error(`Test setup could not disable the account: ${banError.message}`)
    }
  }

  return { id: data.user.id, email }
}

function recordingTransport(result: SendResult = { ok: true, providerId: 'test-provider' }): {
  transport: PasswordResetTransport
  sent: OutgoingEmail[]
} {
  const sent: OutgoingEmail[] = []

  return {
    sent,
    transport: {
      apiKey: 'test-key',
      from: 'Palm Villa <staff@palmvilla.test>',
      send: async (_apiKey, _from, message) => {
        sent.push(message)

        return result
      },
    },
  }
}

/** The token in an email's plain-text body, as the reset page would read it. */
function tokenIn(message: OutgoingEmail): string | null {
  const link = /https:\/\/palmvilla\.test\/reset-password(#\S+)/.exec(message.text)

  return link?.[1] ? tokenFromFragment(link[1]) : null
}

async function verifies(tokenHash: string): Promise<boolean> {
  const anonymous = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await anonymous.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHash,
  })

  return !error && data.session !== null
}

async function eventsFor(userId: string) {
  const { data, error } = await dataClient()
    .from('audit_event')
    .select('action, actor_id, entity_type, after')
    .eq('entity_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return data
}

describe('deliverPasswordReset', () => {
  test('emails an active account a link that signs its owner in, and records the send', async () => {
    const staff = await givenStaff()
    const { transport, sent } = recordingTransport()

    const outcome = await deliverPasswordReset({ email: staff.email, origin: ORIGIN, transport })

    expect(outcome).toEqual({ status: 'sent', providerId: 'test-provider' })
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe(staff.email)

    const token = sent[0] ? tokenIn(sent[0]) : null

    expect(token, 'no reset link in the email').not.toBeNull()
    expect(await verifies(token ?? '')).toBe(true)

    expect(await eventsFor(staff.id)).toEqual([
      {
        action: 'email.sent',
        actor_id: null,
        entity_type: 'staff_user',
        after: { kind: 'password_reset', provider_id: 'test-provider', domain: 'example.test' },
      },
    ])
  })

  test('matches the address however it was typed', async () => {
    const staff = await givenStaff()
    const { transport, sent } = recordingTransport()

    const outcome = await deliverPasswordReset({
      email: `  ${staff.email.toUpperCase()} `,
      origin: ORIGIN,
      transport,
    })

    expect(outcome.status).toBe('sent')
    expect(sent[0]?.to).toBe(staff.email)
  })

  test('mints nothing when this deployment cannot send, so an earlier link still works', async () => {
    const staff = await givenStaff()
    const { data: earlier, error } = await dataClient().auth.admin.generateLink({
      type: 'recovery',
      email: staff.email,
    })

    if (error) {
      throw new Error(error.message)
    }

    const outcome = await deliverPasswordReset({
      email: staff.email,
      origin: ORIGIN,
      transport: null,
    })

    expect(outcome).toEqual({ status: 'skipped', reason: 'not_configured' })
    expect(await verifies(earlier.properties.hashed_token)).toBe(true)
    expect(await eventsFor(staff.id)).toEqual([])
  })

  test('sends nothing for an address with no account', async () => {
    const { transport, sent } = recordingTransport()

    const outcome = await deliverPasswordReset({
      email: `nobody-${randomUUID()}@example.test`,
      origin: ORIGIN,
      transport,
    })

    expect(outcome).toEqual({ status: 'skipped', reason: 'no_account' })
    expect(sent).toHaveLength(0)
  })

  test('sends nothing to a disabled account', async () => {
    const staff = await givenStaff({ disabled: true })
    const { transport, sent } = recordingTransport()

    const outcome = await deliverPasswordReset({ email: staff.email, origin: ORIGIN, transport })

    expect(outcome).toEqual({ status: 'skipped', reason: 'disabled' })
    expect(sent).toHaveLength(0)
    expect(await eventsFor(staff.id)).toEqual([])
  })

  test('records a send that failed, with why', async () => {
    const staff = await givenStaff()
    const { transport } = recordingTransport({
      ok: false,
      failure: { class: 'rejected', status: 422, code: null },
    })

    const outcome = await deliverPasswordReset({ email: staff.email, origin: ORIGIN, transport })

    expect(outcome).toEqual({ status: 'failed', failure: 'rejected' })
    expect(await eventsFor(staff.id)).toEqual([
      {
        action: 'email.failed',
        actor_id: null,
        entity_type: 'staff_user',
        after: { kind: 'password_reset', failure: 'rejected', status: 422 },
      },
    ])
  })

  test('stops emailing one address once its hourly allowance is spent', async () => {
    const staff = await givenStaff()
    const { transport, sent } = recordingTransport()
    const allowance = PASSWORD_RESET_LIMITS.emailsPerAddressPerHour

    for (let request = 0; request < allowance; request += 1) {
      const outcome = await deliverPasswordReset({ email: staff.email, origin: ORIGIN, transport })

      expect(outcome.status).toBe('sent')
    }

    const refused = await deliverPasswordReset({ email: staff.email, origin: ORIGIN, transport })

    expect(refused).toEqual({ status: 'skipped', reason: 'rate_limited' })
    expect(sent).toHaveLength(allowance)
  })
})
