import { describe, expect, test } from 'vitest'

import { parseSlipBoxKey, slipBoxesOf, type SlipFacts } from './slip-boxes'

/**
 * Which transfer a guest's slip is evidence of (capabilities A6 and A12).
 *
 * The bug this replaces: a slip was filed against every transfer on the
 * booking, and a guest's second upload replaced their first — so the slip for
 * the rest of the stay overwrote the deposit's. Each transfer the guest told us
 * about now has a box of its own, and a slip goes only to the money still
 * waiting to be checked in that box.
 */

// Timestamps as PostgREST hands them over: compared as strings, never parsed.
const PROMISED = '2026-10-08T09:15:02.123456+00:00'
const LATER = '2026-10-08T14:40:11.654321+00:00'

const pendingDeposit = {
  id: 'dep-1',
  method: 'bank_transfer' as const,
  promisedAt: PROMISED,
  collectedAt: null,
  shortfall: 0,
}

const facts = (overrides: Partial<SlipFacts> = {}): SlipFacts => ({
  deposit: pendingDeposit,
  payments: [],
  slips: [],
  ...overrides,
})

describe('slipBoxesOf', () => {
  test('a deposit sent alone is one box, filed against the deposit', () => {
    const boxes = slipBoxesOf(facts())

    expect(boxes).toEqual([
      {
        key: 'first',
        kind: 'first',
        covers: 'deposit',
        open: true,
        targets: [{ depositId: 'dep-1', paymentId: null }],
        onFileSince: null,
      },
    ])
  })

  test('"everything now" is one transfer for two rows, so one box filed against both', () => {
    const boxes = slipBoxesOf(
      facts({
        payments: [
          {
            id: 'pay-1',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: PROMISED,
          },
        ],
      }),
    )

    expect(boxes).toHaveLength(1)
    expect(boxes[0]?.covers).toBe('deposit_and_payment')
    expect(boxes[0]?.targets).toEqual([
      { depositId: 'dep-1', paymentId: null },
      { depositId: null, paymentId: 'pay-1' },
    ])
  })

  test('the rest, sent later, is a box of its own — its slip never touches the deposit', () => {
    const boxes = slipBoxesOf(
      facts({
        payments: [
          {
            id: 'pay-2',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: LATER,
          },
        ],
        slips: [{ depositId: 'dep-1', paymentId: null, uploadedAt: '2026-10-08T09:20:00+00:00' }],
      }),
    )

    expect(boxes.map((box) => box.key)).toEqual(['first', 'payment:pay-2'])
    expect(boxes[0]).toMatchObject({
      covers: 'deposit',
      targets: [{ depositId: 'dep-1', paymentId: null }],
      onFileSince: '2026-10-08T09:20:00+00:00',
    })
    expect(boxes[1]).toMatchObject({
      kind: 'rest',
      covers: 'payment',
      open: true,
      targets: [{ depositId: null, paymentId: 'pay-2' }],
      onFileSince: null,
    })
  })

  test('money already checked takes no slip, and a box with nothing left to check is closed', () => {
    const boxes = slipBoxesOf(
      facts({
        deposit: { ...pendingDeposit, collectedAt: '2026-10-08T10:00:00+00:00' },
        payments: [
          {
            id: 'pay-2',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: LATER,
          },
        ],
      }),
    )

    expect(boxes[0]).toMatchObject({ key: 'first', open: false, targets: [] })
    expect(boxes[1]).toMatchObject({ key: 'payment:pay-2', open: true })
  })

  test('a deposit checked and found short stays open for the slip of the rest of it', () => {
    const boxes = slipBoxesOf(
      facts({
        deposit: { ...pendingDeposit, collectedAt: '2026-10-08T10:00:00+00:00', shortfall: 5_000 },
      }),
    )

    expect(boxes[0]).toMatchObject({
      key: 'first',
      open: true,
      targets: [{ depositId: 'dep-1', paymentId: null }],
    })
  })

  test('half of "everything now" checked leaves the slip for the half still waiting', () => {
    const boxes = slipBoxesOf(
      facts({
        payments: [
          { id: 'pay-1', method: 'bank_transfer', status: 'verified', createdAt: PROMISED },
        ],
      }),
    )

    expect(boxes[0]?.targets).toEqual([{ depositId: 'dep-1', paymentId: null }])
  })

  test('cash has no slip: a deposit taken in cash is no box, and nor is a cash payment', () => {
    const boxes = slipBoxesOf(
      facts({
        deposit: {
          id: 'dep-1',
          method: 'cash',
          promisedAt: null,
          collectedAt: PROMISED,
          shortfall: 0,
        },
        payments: [
          { id: 'pay-c', method: 'cash', status: 'verified', createdAt: PROMISED },
          {
            id: 'pay-2',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: LATER,
          },
        ],
      }),
    )

    expect(boxes.map((box) => box.key)).toEqual(['first'])
    expect(boxes[0]?.covers).toBe('payment')
    expect(boxes[0]?.targets).toEqual([{ depositId: null, paymentId: 'pay-2' }])
  })

  test('a day pass, with no deposit, has its one transfer as the first box', () => {
    const boxes = slipBoxesOf(
      facts({
        deposit: null,
        payments: [
          {
            id: 'pay-1',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: LATER,
          },
        ],
      }),
    )

    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toMatchObject({
      key: 'first',
      covers: 'payment',
      targets: [{ depositId: null, paymentId: 'pay-1' }],
    })
  })

  test('nothing transferred yet is no box at all', () => {
    expect(slipBoxesOf(facts({ deposit: null }))).toEqual([])
  })

  test('the newest slip on a box is the one it reports', () => {
    const boxes = slipBoxesOf(
      facts({
        payments: [
          {
            id: 'pay-1',
            method: 'bank_transfer',
            status: 'pending_verification',
            createdAt: PROMISED,
          },
        ],
        slips: [
          { depositId: 'dep-1', paymentId: null, uploadedAt: '2026-10-08T09:20:00+00:00' },
          { depositId: null, paymentId: 'pay-1', uploadedAt: '2026-10-08T11:00:00+00:00' },
        ],
      }),
    )

    expect(boxes[0]?.onFileSince).toBe('2026-10-08T11:00:00+00:00')
  })
})

describe('parseSlipBoxKey', () => {
  test('reads the two shapes a box key takes, and nothing else', () => {
    expect(parseSlipBoxKey('first')).toBe('first')
    expect(parseSlipBoxKey('payment:6f1c2c7e-4a7a-4c33-9a5b-0f7f0c1e2d3a')).toBe(
      'payment:6f1c2c7e-4a7a-4c33-9a5b-0f7f0c1e2d3a',
    )
    expect(parseSlipBoxKey('payment:not-a-uuid')).toBeNull()
    expect(parseSlipBoxKey('deposit:anything')).toBeNull()
    expect(parseSlipBoxKey('')).toBeNull()
  })
})
