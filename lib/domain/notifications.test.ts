import { describe, expect, test } from 'vitest'

import { KNOWN_AUDIT_ACTIONS } from './audit-label'
import {
  MAX_NOTIFICATIONS,
  NOTIFICATION_KINDS,
  formatUnreadCount,
  notificationActionsFor,
  toNotification,
  unreadCount,
  type NotificationEvent,
} from './notifications'
import type { Permission } from '@/lib/auth/permissions'

/**
 * The portal's notifications: which events reach whom, and how each reads.
 *
 * They are read off the audit trail rather than written separately, so what is
 * worth testing is the choice of events, the permission each needs, the
 * sentence each becomes, and the unread count.
 */

function event(overrides: Partial<NotificationEvent> = {}): NotificationEvent {
  return {
    id: 'evt-1',
    action: 'booking.created_public',
    entityType: 'booking',
    subjectLabel: 'PV-1001',
    after: { stream: 'short_stay', reference: 'PV-1001' },
    at: '2026-09-16T02:00:00Z',
    ...overrides,
  }
}

const every = new Set<Permission>(['booking.view', 'payment.verify'])

describe('which events are notifications', () => {
  test('are all verbs the product actually writes', () => {
    for (const kind of NOTIFICATION_KINDS) {
      expect(KNOWN_AUDIT_ACTIONS).toContain(kind.action)
    }
  })

  test('go only to somebody who can act on them', () => {
    expect(notificationActionsFor(new Set<Permission>(['booking.view']))).toEqual([
      'booking.created_public',
      'email.failed',
    ])
    expect(notificationActionsFor(new Set<Permission>(['payment.verify']))).toEqual([
      'booking.submit_payment',
    ])
    expect(notificationActionsFor(new Set<Permission>())).toEqual([])
  })

  test('are listed a screenful at a time', () => {
    expect(MAX_NOTIFICATIONS).toBeGreaterThan(0)
  })
})

describe('how a notification reads', () => {
  test('names an online booking by what was sold, and opens the booking', () => {
    expect(toNotification(event(), 'Siti Rahman', every)).toEqual({
      id: 'evt-1',
      kind: 'booking',
      title: 'New online booking — short stay',
      detail: 'PV-1001 · Siti Rahman',
      href: '/bookings/PV-1001',
      at: '2026-09-16T02:00:00Z',
    })

    expect(toNotification(event({ after: { stream: 'day_pass' } }), null, every)?.title).toBe(
      'New online booking — day pass',
    )
  })

  test('sends a payment to the verification queue, with the amount when there is one', () => {
    const payment = toNotification(
      event({ action: 'booking.submit_payment', after: { amount_cents: 44200 } }),
      'Siti Rahman',
      every,
    )

    expect(payment).toMatchObject({
      kind: 'payment',
      title: 'Payment to verify',
      detail: 'PV-1001 · Siti Rahman · BND 442.00',
      href: '/payments',
    })

    expect(
      toNotification(event({ action: 'booking.submit_payment', after: {} }), null, every)?.detail,
    ).toBe('PV-1001')
  })

  test('says which email a guest may not have, and opens the booking', () => {
    expect(
      toNotification(
        event({
          action: 'email.failed',
          after: { kind: 'booking_confirmed', failure: 'rejected' },
        }),
        'Siti Rahman',
        every,
      ),
    ).toMatchObject({
      kind: 'email',
      title: 'Confirmation email could not be sent',
      detail: 'PV-1001 · Siti Rahman',
      href: '/bookings/PV-1001',
    })
  })

  test('drops what the reader may not see, and what is not about a booking', () => {
    expect(toNotification(event(), null, new Set<Permission>(['payment.verify']))).toBeNull()
    expect(toNotification(event({ entityType: 'staff_user' }), null, every)).toBeNull()
    expect(toNotification(event({ action: 'booking.cancel' }), null, every)).toBeNull()
  })

  test('falls back to the payload when the booking is gone', () => {
    expect(toNotification(event({ subjectLabel: null }), null, every)).toMatchObject({
      detail: 'PV-1001',
      href: '/bookings/PV-1001',
    })
    expect(
      toNotification(event({ subjectLabel: null, after: { stream: 'day_pass' } }), null, every),
    ).toMatchObject({ detail: 'A booking since removed', href: null })
  })
})

describe('the unread count', () => {
  const items = [
    { at: '2026-09-16T03:00:00Z' },
    { at: '2026-09-16T02:00:00Z' },
    { at: '2026-09-16T01:00:00Z' },
  ]

  test('counts what arrived after the bell was last opened', () => {
    expect(unreadCount(items, '2026-09-16T01:30:00Z')).toBe(2)
    expect(unreadCount(items, '2026-09-16T03:00:00Z')).toBe(0)
  })

  test('counts everything for somebody who has never opened it', () => {
    expect(unreadCount(items, null)).toBe(3)
  })

  test('is shown briefly, and never as zero', () => {
    expect(formatUnreadCount(0)).toBeNull()
    expect(formatUnreadCount(4)).toBe('4')
    expect(formatUnreadCount(9)).toBe('9')
    expect(formatUnreadCount(10)).toBe('9+')
  })
})
