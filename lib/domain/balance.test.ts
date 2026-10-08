import { describe, expect, test } from 'vitest'

import { balanceOf, canSettle, describeBalance, MONEY_OWED_STATUSES, owesMoney } from './balance'
import { bnd } from './money'

/**
 * The balance a booking carries.
 *
 * Small arithmetic, mandatory coverage: this figure decides what a clerk is
 * told a guest owes, and it is what a confirmation is matched against — so an
 * error here is a guest charged the wrong amount, not a display fault.
 */

describe('balanceOf', () => {
  test('a booking nobody has paid owes all of it', () => {
    // Arrange / Act
    const balance = balanceOf(bnd(400), 0)

    // Assert
    expect(balance).toEqual({
      total: bnd(400),
      paid: 0,
      outstanding: bnd(400),
      state: 'outstanding',
    })
  })

  test('the case this exists for: paid for one night, extended to two', () => {
    const balance = balanceOf(bnd(400), bnd(200))

    expect(balance.outstanding).toBe(bnd(200))
    expect(balance.state).toBe('outstanding')
  })

  test('a fully paid booking is settled, and owes nothing', () => {
    const balance = balanceOf(bnd(400), bnd(400))

    expect(balance.outstanding).toBe(0)
    expect(balance.state).toBe('settled')
  })

  test('paying more than the booking is worth reads as overpaid, not as settled', () => {
    // Negative, and named. An overpayment is a refund conversation — prd.md
    // §9.6 keeps money movement out of this system — so it must not quietly
    // collapse into "settled" and disappear.
    const balance = balanceOf(bnd(400), bnd(450))

    expect(balance.outstanding).toBe(-bnd(50))
    expect(balance.state).toBe('overpaid')
  })

  test('a comped booking with nothing paid is settled rather than outstanding', () => {
    // A 100% discount takes the total to zero, and zero owed is zero owed.
    expect(balanceOf(0, 0).state).toBe('settled')
  })
})

describe('describeBalance', () => {
  test.each([
    [bnd(1), 'outstanding'],
    [0, 'settled'],
    [-bnd(1), 'overpaid'],
  ])('%d cents reads as %s', (outstanding, expected) => {
    expect(describeBalance(outstanding)).toBe(expected)
  })
})

describe('canSettle', () => {
  test('a booking that owes something can take a payment', () => {
    expect(canSettle(balanceOf(bnd(400), bnd(200)))).toBe(true)
  })

  test('a settled booking cannot', () => {
    expect(canSettle(balanceOf(bnd(400), bnd(400)))).toBe(false)
  })

  test('an overpaid booking cannot — that is a refund, not a payment', () => {
    expect(canSettle(balanceOf(bnd(400), bnd(450)))).toBe(false)
  })
})

/**
 * "Money owed" on the bookings list (capability B19). A filter, so a wrong
 * answer is a booking the desk should be chasing that the list hides.
 */
describe('owesMoney', () => {
  test('is asked only of bookings still open — never one that has ended', () => {
    expect([...MONEY_OWED_STATUSES]).toEqual([
      'draft',
      'held',
      'awaiting_payment_verification',
      'confirmed',
      'checked_in',
    ])
  })

  test('a confirmed stay secured by its deposit still owes the stay', () => {
    expect(owesMoney({ status: 'confirmed', total: bnd(400), paid: 0 })).toBe(true)
  })

  test('an unpaid hold owes all of it', () => {
    expect(owesMoney({ status: 'held', total: bnd(400), paid: 0 })).toBe(true)
  })

  test('a settled or overpaid booking owes nothing', () => {
    expect(owesMoney({ status: 'checked_in', total: bnd(400), paid: bnd(400) })).toBe(false)
    expect(owesMoney({ status: 'confirmed', total: bnd(300), paid: bnd(400) })).toBe(false)
  })

  test('a booking that has ended is not chased here, whatever its balance says', () => {
    // A guest who left owing is handled outside the system (N57), and nothing
    // can be recorded against a closed booking, so it would sit on the list
    // with no way off it.
    for (const status of ['completed', 'cancelled', 'expired', 'no_show'] as const) {
      expect(owesMoney({ status, total: bnd(400), paid: 0 })).toBe(false)
    }
  })
})
