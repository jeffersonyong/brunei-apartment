import { describe, expect, test } from 'vitest'

import { PERMISSIONS, type Permission } from '@/lib/auth/permissions'

import { heldPermissionGroups, PERMISSION_GROUPS, PERMISSION_LABELS } from './permission-labels'

/**
 * The roles matrix renders a permission only when a group lists it, while the
 * labels are exhaustive by type. A string added to the vocabulary and left out
 * of every group would be impossible to grant from the screen, with nothing
 * failing — which is what `site_image.manage` (capability F7) would have been.
 */
describe('PERMISSION_GROUPS', () => {
  test('lists every permission exactly once', () => {
    const grouped = PERMISSION_GROUPS.flatMap((group) => group.permissions)

    expect([...grouped].sort()).toEqual([...PERMISSIONS].sort())
    expect(new Set(grouped).size, 'a permission is listed in two groups').toBe(grouped.length)
  })

  test('every permission has a label in staff language', () => {
    for (const permission of PERMISSIONS) {
      expect(PERMISSION_LABELS[permission]).toBeTruthy()
    }
  })
})

/**
 * What the Settings screen reads back to somebody about their own access: the
 * matrix's groups, narrowed to what they hold.
 */
describe('heldPermissionGroups', () => {
  test('keeps only what is held, in the matrix order, and drops empty groups', () => {
    const held = new Set<Permission>([
      'report.view',
      'payment.verify',
      'booking.create',
      'booking.view',
    ])

    expect(heldPermissionGroups(held)).toEqual([
      { label: 'Bookings', permissions: ['booking.view', 'booking.create'] },
      { label: 'Payments & charges', permissions: ['payment.verify'] },
      { label: 'Administration', permissions: ['report.view'] },
    ])
  })

  test('is empty for somebody who holds nothing', () => {
    expect(heldPermissionGroups(new Set())).toEqual([])
  })
})
