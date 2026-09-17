import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import {
  AUTH_SEGMENTS,
  crossHostRedirect,
  ENTRY_SEGMENT,
  FIELD_SEGMENT,
  isEntryPath,
  isGatedPath,
  isStaffPath,
  OPERATIONS_REGISTER_ROOTS,
  PORTAL_SEGMENTS,
} from './surfaces'

/** A route group's top-level URL segments, as the file system has them. */
function routeSegments(group: string): string[] {
  return readdirSync(join(process.cwd(), 'app', group), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort()
}

describe('the staff segments match the route folders', () => {
  // The list is the whole of the split, so a screen added without its segment
  // would be served ungated on the customer's host. This is what notices.
  test('every portal and print folder is a portal segment, and nothing else is', () => {
    const folders = [...new Set([...routeSegments('(portal)'), ...routeSegments('(print)')])].sort()

    expect(folders).toEqual([...PORTAL_SEGMENTS].sort())
  })

  test('the field, auth and entry groups hold exactly their segments', () => {
    expect(routeSegments('(field)')).toEqual([FIELD_SEGMENT])
    expect(routeSegments('(auth)')).toEqual([...AUTH_SEGMENTS].sort())
    expect(routeSegments('(entry)')).toEqual([ENTRY_SEGMENT])
  })

  test('the entry code page is on the staff host, and open to anyone', () => {
    const token = '/c/Ab3xY9-_ZqRs7TuVwX2Kd0'

    expect(isEntryPath(token)).toBe(true)
    expect(isStaffPath(token)).toBe(true)
    expect(isGatedPath(token)).toBe(false)
    expect(isEntryPath('/cancel')).toBe(false)
    expect(isEntryPath('/booking/abc')).toBe(false)
    expect(OPERATIONS_REGISTER_ROOTS).toContain('/c')
    expect(
      crossHostRedirect(
        { host: 'bruneiapartment.com', pathname: token, search: '' },
        { site: 'https://bruneiapartment.com', staff: 'https://portal.bruneiapartment.com' },
      ),
    ).toBe(`https://portal.bruneiapartment.com${token}`)
  })

  test('no public folder is a staff path', () => {
    for (const segment of routeSegments('(public)')) {
      expect(isStaffPath(`/${segment}`), segment).toBe(false)
    }
  })
})

describe('isGatedPath and isStaffPath', () => {
  test('match whole first segments, with sub-paths and queries', () => {
    expect(isGatedPath('/bookings/PV-0042')).toBe(true)
    expect(isGatedPath('/dashboard?tab=today')).toBe(true)
    expect(isGatedPath('/field')).toBe(true)
    expect(isGatedPath('/bookings-report')).toBe(false)
    expect(isGatedPath('/booking/abc')).toBe(false)
  })

  test('sign-in and recovery are staff paths without being gated', () => {
    expect(isStaffPath('/login')).toBe(true)
    expect(isStaffPath('/reset-password/new')).toBe(true)
    expect(isGatedPath('/login')).toBe(false)
    expect(isGatedPath('/forgot-password')).toBe(false)
  })

  test('refuse anything that is not an in-app path', () => {
    expect(isStaffPath('/')).toBe(false)
    expect(isStaffPath('')).toBe(false)
    expect(isStaffPath('bookings')).toBe(false)
    expect(isStaffPath('//bookings')).toBe(false)
  })

  test('the monochrome register covers the gated screens and sign-in only', () => {
    expect(OPERATIONS_REGISTER_ROOTS).toContain('/dashboard')
    expect(OPERATIONS_REGISTER_ROOTS).toContain('/field')
    expect(OPERATIONS_REGISTER_ROOTS).toContain('/login')
    expect(OPERATIONS_REGISTER_ROOTS).not.toContain('/forgot-password')
  })
})

describe('crossHostRedirect', () => {
  const split = {
    site: 'https://bruneiapartment.com',
    staff: 'https://portal.bruneiapartment.com',
  }
  const at = (host: string, pathname: string, search = '') => ({ host, pathname, search })

  test('serves everything in place when no split is configured', () => {
    expect(crossHostRedirect(at('localhost:3000', '/bookings'), null)).toBeNull()
    expect(crossHostRedirect(at('localhost:3000', '/'), null)).toBeNull()
  })

  test('sends staff paths on the site host to the portal host, query intact', () => {
    expect(
      crossHostRedirect(at('bruneiapartment.com', '/bookings/new', '?unit=3B-01'), split),
    ).toBe('https://portal.bruneiapartment.com/bookings/new?unit=3B-01')
    expect(crossHostRedirect(at('bruneiapartment.com', '/forgot-password'), split)).toBe(
      'https://portal.bruneiapartment.com/forgot-password',
    )
  })

  test('leaves the site host its own pages', () => {
    expect(crossHostRedirect(at('bruneiapartment.com', '/'), split)).toBeNull()
    expect(crossHostRedirect(at('bruneiapartment.com', '/booking/abc'), split)).toBeNull()
  })

  test('the portal host starts at the dashboard and sends public pages back', () => {
    expect(crossHostRedirect(at('portal.bruneiapartment.com', '/'), split)).toBe(
      'https://portal.bruneiapartment.com/dashboard',
    )
    expect(crossHostRedirect(at('portal.bruneiapartment.com', '/stay', '?nights=2'), split)).toBe(
      'https://bruneiapartment.com/stay?nights=2',
    )
    expect(crossHostRedirect(at('portal.bruneiapartment.com', '/payments'), split)).toBeNull()
    expect(crossHostRedirect(at('portal.bruneiapartment.com', '/login'), split)).toBeNull()
  })

  test('each host answers /robots.txt itself, so the staff rules are the staff host’s own', () => {
    // The staff host's robots.txt asks not to be indexed. Sent to the site's
    // copy, a crawler would read "Allow: /" and index the portal — the exact
    // opposite of what the file it was refused says.
    expect(crossHostRedirect(at('portal.bruneiapartment.com', '/robots.txt'), split)).toBeNull()
    expect(crossHostRedirect(at('bruneiapartment.com', '/robots.txt'), split)).toBeNull()
  })

  test('never redirects a request on any other host', () => {
    expect(crossHostRedirect(at('palm-villa.vercel.app', '/bookings'), split)).toBeNull()
    expect(crossHostRedirect(at('palm-villa.vercel.app', '/stay'), split)).toBeNull()
  })

  test('only ever targets a configured origin, whatever the path', () => {
    const target = crossHostRedirect(at('portal.bruneiapartment.com', '//evil.example/x'), split)

    expect(target).not.toBeNull()
    expect(new URL(target!).host).toBe('bruneiapartment.com')
  })
})
