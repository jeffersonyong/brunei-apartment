import { describe, expect, test } from 'vitest'

import { classify, isRetryable, resendBody, type SendFailureClass } from './send'

/**
 * Which answer from the mail service means try again.
 *
 * The whole of what is worth testing in the transport, and the reason the POST
 * around it is left untested: get this wrong in one direction and a guest
 * never receives their confirmation because a momentary 503 was treated as
 * final; get it wrong in the other and the product hammers a service that has
 * already refused the message.
 */

describe('classify', () => {
  const cases: ReadonlyArray<[number, string | null, SendFailureClass]> = [
    [429, 'rate_limit_exceeded', 'throttled'],
    [500, null, 'provider_down'],
    [502, null, 'provider_down'],
    [503, 'internal_server_error', 'provider_down'],
    [422, 'validation_error', 'rejected'],
    [401, 'missing_api_key', 'rejected'],
    [403, 'restricted_api_key', 'rejected'],
    [404, 'not_found', 'rejected'],
    [400, null, 'rejected'],
    [409, 'concurrent_idempotent_requests', 'in_flight'],
    [409, 'invalid_idempotent_request', 'rejected'],
    [409, null, 'rejected'],
  ]

  for (const [status, code, expected] of cases) {
    test(`${status}${code === null ? '' : ` ${code}`} is ${expected}`, () => {
      expect(classify(status, code)).toEqual({ class: expected, status, code })
    })
  }

  test('the two 409s are told apart by the code, which is the only body field read', () => {
    expect(classify(409, 'concurrent_idempotent_requests').class).toBe('in_flight')
    expect(classify(409, 'invalid_idempotent_request').class).toBe('rejected')
  })
})

describe('resendBody', () => {
  const message = {
    to: 'guest@example.test',
    subject: 'You are booked',
    html: '<p>Hi</p>',
    text: 'Hi',
    idempotencyKey: 'pv.booking_confirmed.0000',
  }

  test('sends the five fields, and no attachments key when there are none', () => {
    expect(resendBody('Palm Villa <noreply@bruneiapartment.com>', message)).toEqual({
      from: 'Palm Villa <noreply@bruneiapartment.com>',
      to: 'guest@example.test',
      subject: 'You are booked',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
  })

  test('names an inline attachment in Resend’s own field names', () => {
    const body = resendBody('from@example.test', {
      ...message,
      attachments: [
        {
          filename: 'PV-0042-entry-qr.png',
          content: 'iVBORw0KGgo=',
          contentType: 'image/png',
          contentId: 'entry-qr',
        },
      ],
    })

    expect(body.attachments).toEqual([
      {
        filename: 'PV-0042-entry-qr.png',
        content: 'iVBORw0KGgo=',
        content_type: 'image/png',
        content_id: 'entry-qr',
      },
    ])
  })

  test('leaves content_id off an attachment that is not shown inline', () => {
    const body = resendBody('from@example.test', {
      ...message,
      attachments: [{ filename: 'a.png', content: 'AA==', contentType: 'image/png' }],
    })

    expect(body.attachments).toEqual([
      { filename: 'a.png', content: 'AA==', content_type: 'image/png' },
    ])
  })

  test('never sends the idempotency key in the body — it is a header', () => {
    expect(JSON.stringify(resendBody('from@example.test', message))).not.toContain(
      message.idempotencyKey,
    )
  })
})

describe('isRetryable', () => {
  test('retries the failures that might not repeat', () => {
    for (const failure of ['unreachable', 'timed_out', 'throttled', 'provider_down'] as const) {
      expect(isRetryable(failure), failure).toBe(true)
    }
  })

  test('never retries a refusal, a duplicate in flight, or a missing key', () => {
    for (const failure of ['rejected', 'in_flight', 'unreadable', 'not_configured'] as const) {
      expect(isRetryable(failure), failure).toBe(false)
    }
  })
})
