import { describe, expect, test } from 'vitest'

import {
  PERMISSIONS,
  hasPermission,
  permissionsToRecordMoneySeen,
  toPermissionSet,
} from './permissions'

describe('toPermissionSet', () => {
  test('unions rows from several roles into one set', () => {
    // Arrange — Front Office + Finance rows, overlapping on payment.verify.
    const rows = ['booking.create', 'payment.verify', 'payment.verify', 'deposit.approve_release']

    // Act
    const set = toPermissionSet(rows)

    // Assert
    expect(set.size).toBe(3)
    expect(hasPermission(set, 'booking.create')).toBe(true)
    expect(hasPermission(set, 'deposit.approve_release')).toBe(true)
  })

  test('drops strings outside the closed vocabulary', () => {
    // A permission this build cannot check is a permission it does not grant.
    const set = toPermissionSet(['booking.create', 'checkin.record', 'booking.*', ''])

    expect(set.size).toBe(1)
    expect(hasPermission(set, 'booking.create')).toBe(true)
  })

  test('returns an empty set for a user with no roles', () => {
    const set = toPermissionSet([])

    expect(set.size).toBe(0)
    expect(hasPermission(set, 'config.manage')).toBe(false)
  })

  test('accepts every string in the canonical list', () => {
    // Pins the vocabulary here against the CHECK constraint's copy (000400):
    // if a string is added to one list and not the other, this stops agreeing
    // with the seeded roles long before a screen does.
    const set = toPermissionSet([...PERMISSIONS])

    // 21 since `booking.check_in` and `booking.check_out` (20260924000100, N11);
    // 22 since `day_pass.admit` (20260926000100, N54) — the guard taking cash
    // (20260927000200) granted a string that already existed; 23 since
    // `faq.manage` (20260928000100, F9); 24 since `privacy_policy.manage`
    // (20260930000100, F10).
    expect(set.size).toBe(24)
  })
})

describe('hasPermission', () => {
  test('holding one permission grants nothing else', () => {
    const set = toPermissionSet(['booking.view'])

    expect(hasPermission(set, 'booking.view')).toBe(true)
    expect(hasPermission(set, 'booking.create')).toBe(false)
    expect(hasPermission(set, 'document.view_identity')).toBe(false)
  })
})

describe('permissionsToRecordMoneySeen', () => {
  test('cash counted in hand takes recording cash, and nothing more', () => {
    expect(permissionsToRecordMoneySeen('cash')).toEqual(['payment.record_cash'])
  })

  test('a transfer written down as already arrived also takes verifying payments (N54)', () => {
    expect(permissionsToRecordMoneySeen('bank_transfer')).toEqual([
      'payment.record_cash',
      'payment.verify',
    ])
  })

  test('the guard takes cash and cannot say a transfer landed; the office can do both', () => {
    // supabase/seed.sql's grants.
    const guard = toPermissionSet([
      'booking.view',
      'booking.check_in',
      'booking.check_out',
      'day_pass.admit',
      'payment.record_cash',
    ])
    const office = toPermissionSet(['booking.view', 'payment.verify', 'payment.record_cash'])
    const mayRecord = (
      held: ReturnType<typeof toPermissionSet>,
      method: 'cash' | 'bank_transfer',
    ): boolean =>
      permissionsToRecordMoneySeen(method).every((permission) => hasPermission(held, permission))

    expect(mayRecord(guard, 'cash')).toBe(true)
    expect(mayRecord(guard, 'bank_transfer')).toBe(false)
    expect(mayRecord(office, 'cash')).toBe(true)
    expect(mayRecord(office, 'bank_transfer')).toBe(true)
  })
})
