import { describe, expect, test } from 'vitest'

import type { SlipBox } from '@/lib/domain/slip-boxes'

import { NOTHING_MORE, slipBoxCopy, type SlipCopyFacts } from './upload-copy'

/**
 * What a slip box on the guest's page says (capabilities A6, A12).
 *
 * Named for the transfer it is evidence of, and reading as done once its slip
 * is in — except a deposit checked and found short, where the box asks for the
 * slip of the rest until one arrives after the check.
 */

const CHECKED_AT = '2026-10-09T10:00:00+00:00'

const box = (overrides: Partial<SlipBox> = {}): SlipBox => ({
  key: 'first',
  kind: 'first',
  covers: 'deposit',
  open: true,
  targets: [{ depositId: 'dep-1', paymentId: null }],
  onFileSince: null,
  ...overrides,
})

const facts = (overrides: Partial<SlipCopyFacts> = {}): SlipCopyFacts => ({
  stream: 'short_stay',
  shortfall: 0,
  depositCheckedAt: null,
  payments: [],
  ...overrides,
})

describe('slipBoxCopy', () => {
  test('the deposit sent alone is asked for by name', () => {
    expect(slipBoxCopy(box(), facts())).toEqual({
      title: 'Send us the transfer slip for your deposit',
      description: 'Your bank transfer slip will help us verify your transfer faster.',
      onFileSince: null,
    })
  })

  test('once its slip is in, the box drops the ask and says there is nothing more to do', () => {
    expect(slipBoxCopy(box({ onFileSince: '2026-10-09T09:00:00+00:00' }), facts())).toEqual({
      title: 'The transfer slip for your deposit',
      description: NOTHING_MORE,
      onFileSince: '2026-10-09T09:00:00+00:00',
    })
  })

  test('"everything now" on a stay names both halves of the one transfer', () => {
    expect(slipBoxCopy(box({ covers: 'deposit_and_payment' }), facts()).title).toBe(
      'Send us the transfer slip for your deposit and stay',
    )
  })

  test('a deposit-and-payment pair that is not a stay is left unnamed rather than misnamed', () => {
    expect(
      slipBoxCopy(box({ covers: 'deposit_and_payment' }), facts({ stream: 'tenancy' })).title,
    ).toBe('Send us your transfer slip')
  })

  test('a first transfer that is the whole booking keeps the plain words', () => {
    const dayPass = box({ covers: 'payment', targets: [{ depositId: null, paymentId: 'pay-1' }] })

    expect(slipBoxCopy(dayPass, facts({ stream: 'day_pass' })).title).toBe(
      'Send us your transfer slip',
    )
    expect(
      slipBoxCopy({ ...dayPass, onFileSince: CHECKED_AT }, facts({ stream: 'day_pass' })).title,
    ).toBe('Your transfer slip')
  })

  test('a later transfer is the stay, with the amount the guest sent', () => {
    const rest = box({ key: 'payment:pay-2', kind: 'rest', covers: 'payment' })

    expect(slipBoxCopy(rest, facts({ payments: [{ id: 'pay-2', expected: 40_000 }] }))).toEqual({
      title: 'Send us the transfer slip for your stay',
      description: 'The slip for the BND 400.00 you transferred for the stay.',
      onFileSince: null,
    })
  })

  test('a deposit found short asks for the slip of the rest, whatever came before the check', () => {
    const copy = slipBoxCopy(
      box({ onFileSince: '2026-10-09T09:00:00+00:00' }),
      facts({ shortfall: 5_000, depositCheckedAt: CHECKED_AT }),
    )

    expect(copy).toEqual({
      title: 'Send us the transfer slip for the rest of your deposit',
      description:
        'Once you have sent the BND 50.00 still outstanding, the slip will help us verify it faster.',
      onFileSince: null,
    })
  })

  test('a slip sent after the short deposit was checked is the slip of the rest, and reads as done', () => {
    const copy = slipBoxCopy(
      box({ onFileSince: '2026-10-09T11:30:00+00:00' }),
      facts({ shortfall: 5_000, depositCheckedAt: CHECKED_AT }),
    )

    expect(copy).toEqual({
      title: 'The transfer slip for the rest of your deposit',
      description: NOTHING_MORE,
      onFileSince: '2026-10-09T11:30:00+00:00',
    })
  })

  test('a shortfall is the deposit’s business — a box without the deposit ignores it', () => {
    const rest = box({ key: 'payment:pay-2', kind: 'rest', covers: 'payment' })

    expect(slipBoxCopy(rest, facts({ shortfall: 5_000 })).title).toBe(
      'Send us the transfer slip for your stay',
    )
  })
})
