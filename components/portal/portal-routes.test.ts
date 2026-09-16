import { describe, expect, test } from 'vitest'

import { activeHref, breadcrumbTrail, navGroups } from './portal-routes'

describe('activeHref', () => {
  test('matches a listed route exactly', () => {
    expect(activeHref('/payments')).toBe('/payments')
  })

  test('prefers the longest match so a child route does not light up its parent', () => {
    expect(activeHref('/bookings/new')).toBe('/bookings/new')
    expect(activeHref('/payments/cash')).toBe('/payments/cash')
    expect(activeHref('/settings/property')).toBe('/settings/property')
    expect(activeHref('/settings/audit')).toBe('/settings/audit')
    // Reports and the cash-up are siblings in the nav and nested in the URL.
    expect(activeHref('/reports/cash-up')).toBe('/reports/cash-up')
  })

  test('keeps a deeper unlisted route on its nearest listed ancestor', () => {
    expect(activeHref('/bookings/abc123')).toBe('/bookings')
    // One day of the cash-up lights the cash-up, not Reports above it.
    expect(activeHref('/reports/cash-up/2026-09-06')).toBe('/reports/cash-up')
  })

  test('matches whole segments, so a sibling sharing a prefix does not match', () => {
    expect(activeHref('/bookings-report')).toBeNull()
    expect(activeHref('/payments-history')).toBeNull()
  })

  test('matches the portal root only exactly, since every route is beneath it', () => {
    expect(activeHref('/dashboard')).toBe('/dashboard')
    expect(activeHref('/reports')).toBe('/reports')
  })

  test('returns null outside the portal', () => {
    expect(activeHref('/field')).toBeNull()
    expect(activeHref('/')).toBeNull()
  })
})

describe('breadcrumbTrail', () => {
  test('is the root alone on the overview screen', () => {
    expect(breadcrumbTrail('/dashboard')).toEqual([{ label: 'Portal' }])
  })

  test('reads Portal / group / screen, with the group unlinked', () => {
    expect(breadcrumbTrail('/settings/audit')).toEqual([
      { label: 'Portal', href: '/dashboard' },
      { label: 'Admin' },
      { label: 'Audit log' },
    ])
  })

  test('a day of the cash-up is crumbed under the screen it belongs to', () => {
    expect(breadcrumbTrail('/reports/cash-up/2026-09-06')).toEqual([
      { label: 'Portal', href: '/dashboard' },
      { label: 'Finance' },
      { label: 'Daily cash-up' },
    ])
  })

  test('names Others as the group for the account screen', () => {
    expect(breadcrumbTrail('/account')).toEqual([
      { label: 'Portal', href: '/dashboard' },
      { label: 'Others' },
      { label: 'Settings' },
    ])
  })

  test('keeps Settings out of Admin, and out of the admin screens’ URL', () => {
    const admin = navGroups.find((group) => group.label === 'Admin')

    expect(admin?.items.map((item) => item.href)).not.toContain('/account')
    // The admin screens share `/settings/`, and that prefix is not a
    // screen of its own — so nothing lights up there as if it were their parent.
    expect(activeHref('/settings')).toBeNull()
  })

  test('closes the nav on Others, so the catch-all does not sit mid-list', () => {
    expect(navGroups.at(-1)?.label).toBe('Others')
  })

  test('ends Others with the ways out of the portal, which never light up or crumb', () => {
    const others = navGroups.at(-1)

    expect(others?.items.map((item) => item.label)).toEqual(['Settings'])
    expect(others && 'exits' in others ? others.exits.map((item) => item.label) : []).toEqual([
      'Public site',
      'Field screens',
    ])
    expect(activeHref('/field')).toBeNull()
    expect(breadcrumbTrail('/field')).toEqual([{ label: 'Portal' }])
  })

  test('names the specific screen rather than its parent', () => {
    expect(breadcrumbTrail('/bookings/new')).toEqual([
      { label: 'Portal', href: '/dashboard' },
      { label: 'Bookings' },
      { label: 'New booking' },
    ])
  })

  test('files website settings under Admin, beside the rest of the configuration', () => {
    expect(activeHref('/settings/website')).toBe('/settings/website')
    expect(breadcrumbTrail('/settings/website')).toEqual([
      { label: 'Portal', href: '/dashboard' },
      { label: 'Admin' },
      { label: 'Website settings' },
    ])
    expect(navGroups.map((group) => group.label)).not.toContain('Website')
  })

  test('falls back to the root crumb rather than guessing labels from the URL', () => {
    expect(breadcrumbTrail('/nothing-here')).toEqual([{ label: 'Portal' }])
  })

  test('marks only the last crumb as the current page by leaving it unlinked', () => {
    const trail = breadcrumbTrail('/payments/cash')

    expect(trail.at(-1)?.href).toBeUndefined()
    expect(trail[0]?.href).toBe('/dashboard')
  })
})
