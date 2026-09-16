import { describe, expect, test } from 'vitest'

import type { Permission } from '@/lib/auth/permissions'

import { navGroups } from './portal-routes'
import {
  MIN_RECORD_SEARCH_LENGTH,
  SCREEN_PERMISSIONS,
  bookingHit,
  canOpenScreen,
  depositHit,
  matchScreens,
  paymentHit,
  unitHit,
} from './portal-search-results'

/**
 * The portal search (capability F12): which screens a term finds for whom,
 * and how each record reads as a result.
 */

const desk = new Set<Permission>(['booking.view', 'booking.create'])

describe('screens', () => {
  test('every screen in the nav says who may open it', () => {
    const hrefs = navGroups.flatMap((group) => group.items.map((item) => item.href))

    expect(Object.keys(SCREEN_PERMISSIONS).sort()).toEqual([...hrefs].sort())
  })

  test('are found by their name or their group, whatever the case', () => {
    expect(matchScreens('calendar', desk).map((hit) => hit.title)).toEqual(['Calendar'])
    expect(matchScreens('BOOK', desk).map((hit) => hit.title)).toEqual([
      'All bookings',
      'Calendar',
      'New booking',
    ])
  })

  test('are only the ones the reader can open', () => {
    expect(matchScreens('settings', desk).map((hit) => hit.title)).toEqual(['Settings'])
    expect(
      matchScreens('settings', new Set<Permission>(['faq.manage'])).map((hit) => hit.title),
    ).toEqual(['Website settings', 'Settings'])
  })

  test('opens website settings on any one of its permissions', () => {
    expect(canOpenScreen('/settings/website', new Set<Permission>(['faq.manage']))).toBe(true)
    expect(canOpenScreen('/settings/website', desk)).toBe(false)
    expect(canOpenScreen('/dashboard', new Set<Permission>())).toBe(true)
  })

  test('need no more than one letter, and nothing for a blank term', () => {
    expect(matchScreens('  ', desk)).toEqual([])
    expect(MIN_RECORD_SEARCH_LENGTH).toBeGreaterThan(1)
  })
})

describe('records', () => {
  test('a booking reads as its reference and guest, then its status and stay', () => {
    expect(
      bookingHit({
        reference: 'PV-1001',
        guestName: 'Siti Rahman',
        status: 'confirmed',
        stay: { unitRef: '3B-01', range: { start: '2026-09-14', end: '2026-09-16' } },
      }),
    ).toEqual({
      id: 'booking-PV-1001',
      reference: 'PV-1001',
      title: 'Siti Rahman',
      detail: 'Confirmed · 3B-01 · 14 → 16 Sept 2026',
      href: '/bookings/PV-1001',
    })

    expect(
      bookingHit({ reference: 'PV-1002', guestName: 'Ali', status: 'confirmed', stay: null })
        .detail,
    ).toBe('Confirmed · Day pass')
  })

  test('a payment opens the queue, and says what is waiting', () => {
    expect(
      paymentHit({
        id: 'p1',
        bookingReference: 'PV-1001',
        guestName: 'Siti Rahman',
        method: 'bank_transfer',
        due: 44200,
      }),
    ).toEqual({
      id: 'payment-p1',
      reference: 'PV-1001',
      title: 'Siti Rahman',
      detail: 'Bank transfer to verify · BND 442.00',
      href: '/payments?q=PV-1001',
    })
  })

  test('a deposit opens its own page', () => {
    expect(
      depositHit({
        id: 'd1',
        bookingReference: 'PV-1001',
        guestName: 'Siti Rahman',
        stage: 'secured',
        amount: 10000,
        stay: { unitRef: '3B-01' },
      }),
    ).toEqual({
      id: 'deposit-d1',
      reference: 'PV-1001',
      title: 'Siti Rahman',
      detail: 'Held before arrival · BND 100.00 · 3B-01',
      href: '/deposits/PV-1001',
    })
  })

  test('a unit reads as its type and state', () => {
    expect(
      unitHit({ ref: '3B-01', unitTypeName: 'Three bedroom', status: 'available' }),
    ).toMatchObject({
      id: 'unit-3B-01',
      reference: '3B-01',
      title: 'Three bedroom',
      href: '/units/3B-01',
    })
  })
})
