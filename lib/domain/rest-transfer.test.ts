import { describe, expect, test } from 'vitest'

import { bnd } from './money'
import { restTransferOfferOf, type RestTransferFacts } from './rest-transfer'

/**
 * When a guest who sent only the deposit may transfer the rest of the stay
 * before arriving (capability A12, Jason's team, 8 October 2026).
 *
 * Mirrors `submit_public_balance_transfer()`'s guards, which are what actually
 * decide; this is what the page and the confirmation email render on, so a
 * wrong answer here is a guest invited to send money the database will refuse,
 * or not told they can.
 */

const TODAY = '2026-10-08'

const depositOnlyStay = (overrides: Partial<RestTransferFacts> = {}): RestTransferFacts => ({
  stream: 'short_stay',
  status: 'confirmed',
  hasDeposit: true,
  total: bnd(400),
  paid: 0,
  checkIn: '2026-10-10',
  hasPendingStayTransfer: false,
  ...overrides,
})

describe('restTransferOfferOf', () => {
  test('a confirmed stay secured by its deposit, arriving later, is offered the rest', () => {
    expect(restTransferOfferOf(depositOnlyStay(), TODAY)).toEqual({
      kind: 'offer',
      amount: bnd(400),
    })
  })

  test('so is one whose deposit is still being checked — the guest may send both close together', () => {
    expect(
      restTransferOfferOf(depositOnlyStay({ status: 'awaiting_payment_verification' }), TODAY),
    ).toEqual({ kind: 'offer', amount: bnd(400) })
  })

  test('the offer is what is still owed, after anything already verified', () => {
    expect(restTransferOfferOf(depositOnlyStay({ paid: bnd(150) }), TODAY)).toEqual({
      kind: 'offer',
      amount: bnd(250),
    })
  })

  test('a transfer for the stay already waiting to be checked is not offered again', () => {
    expect(
      restTransferOfferOf(depositOnlyStay({ hasPendingStayTransfer: true }), TODAY),
    ).toEqual({ kind: 'pending' })
  })

  test('on the day of arrival it is paid at the gate instead', () => {
    expect(restTransferOfferOf(depositOnlyStay({ checkIn: TODAY }), TODAY)).toEqual({
      kind: 'on_arrival',
      amount: bnd(400),
    })
  })

  test('nothing is offered when nothing is owed', () => {
    expect(restTransferOfferOf(depositOnlyStay({ paid: bnd(400) }), TODAY)).toEqual({
      kind: 'none',
    })
    expect(restTransferOfferOf(depositOnlyStay({ paid: bnd(500) }), TODAY)).toEqual({
      kind: 'none',
    })
  })

  test('only a stay with a deposit — a day pass and a stay quoting none are paid in one go', () => {
    expect(
      restTransferOfferOf(depositOnlyStay({ stream: 'day_pass', checkIn: null }), TODAY),
    ).toEqual({ kind: 'none' })
    expect(restTransferOfferOf(depositOnlyStay({ hasDeposit: false }), TODAY)).toEqual({
      kind: 'none',
    })
  })

  test('not before the guest has said they transferred, and not once they are in or gone', () => {
    for (const status of ['held', 'checked_in', 'completed', 'cancelled', 'no_show'] as const) {
      expect(restTransferOfferOf(depositOnlyStay({ status }), TODAY)).toEqual({ kind: 'none' })
    }
  })
})
