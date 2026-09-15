/**
 * Which paths belong to the staff side, and which host serves them
 * (architecture.md §3).
 *
 * The customer site and the staff side are one application on two hosts —
 * `bruneiapartment.com` and `portal.bruneiapartment.com` — and a staff screen
 * sits at the top level of its host (`/bookings`, `/field`, `/login`), with no
 * `/portal` prefix to tell the two apart. So the split is this list, and every
 * reader of it takes it from here: the session gate and the host redirects in
 * proxy.ts, the sign-in `?next=` check (next-path.ts) and the monochrome
 * register's first-paint script (lib/theme.ts). surfaces.test.ts reads the
 * route folders and fails when a screen is added without its segment.
 */

/** The portal's top-level segments: `app/(portal)` and `app/(print)`. */
export const PORTAL_SEGMENTS = [
  'dashboard',
  'account',
  'bookings',
  'deposits',
  'documents',
  'export',
  'payments',
  'reports',
  'settings',
  'units',
  'website',
] as const

/** The field screens: `app/(field)`. */
export const FIELD_SEGMENT = 'field'

/** Sign-in and password recovery: `app/(auth)`. On the staff host, but open to anyone signed out. */
export const AUTH_SEGMENTS = ['login', 'forgot-password', 'reset-password'] as const

const GATED = new Set<string>([...PORTAL_SEGMENTS, FIELD_SEGMENT])
const STAFF = new Set<string>([...GATED, ...AUTH_SEGMENTS])

/**
 * A path's first segment, or null when it is not an in-app path at all.
 *
 * Splits on `?` as well as `/` because the sign-in `next` target arrives with
 * its query string. `//evil.example` yields an empty segment, which no list
 * holds — the scheme-relative case refuses itself.
 */
function firstSegment(path: string): string | null {
  if (!path.startsWith('/')) {
    return null
  }

  return path.slice(1).split(/[/?]/, 1)[0] ?? ''
}

/** Requires a signed-in staff member: the portal and the field screens. */
export function isGatedPath(path: string): boolean {
  const segment = firstSegment(path)

  return segment !== null && GATED.has(segment)
}

/** Served by the staff host: the gated screens plus sign-in and recovery. */
export function isStaffPath(path: string): boolean {
  const segment = firstSegment(path)

  return segment !== null && STAFF.has(segment)
}

/**
 * The roots that take the monochrome operations register on first paint.
 * `/login` fronts the operations surfaces and takes their register; the
 * recovery screens never did, and still do not.
 */
export const OPERATIONS_REGISTER_ROOTS: readonly string[] = [...GATED, 'login'].map(
  (segment) => `/${segment}`,
)

/** The two origins, when this deployment serves the site and the staff side on different hosts. */
export interface HostSplit {
  site: string
  staff: string
}

/** Where a signed-in staff member starts, and where the staff host's `/` sends them. */
const STAFF_HOST_HOME = '/dashboard'

/**
 * Where a request belongs, if it arrived on the wrong host — or null to serve it.
 *
 * The redirect target is always one of the two **configured** origins with the
 * request's own path appended, never anything built from the `Host` header: the
 * header decides only *whether* to redirect. With no split configured
 * (localhost, a preview on `*.vercel.app`) every path is served on one host,
 * and so is any request arriving on a host that is neither of the two.
 */
export function crossHostRedirect(
  request: { host: string; pathname: string; search: string },
  split: HostSplit | null,
): string | null {
  if (split === null) {
    return null
  }

  const { host, pathname, search } = request

  if (host === new URL(split.site).host) {
    return isStaffPath(pathname) ? `${split.staff}${pathname}${search}` : null
  }

  if (host !== new URL(split.staff).host) {
    return null
  }

  if (pathname === '/') {
    return `${split.staff}${STAFF_HOST_HOME}`
  }

  return isStaffPath(pathname) ? null : `${split.site}${pathname}${search}`
}
