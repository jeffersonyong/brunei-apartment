import type { Permission } from '@/lib/auth/permissions'

/**
 * The field screens a person can work, and where they land after signing in.
 *
 * Pure, like the rest of lib/auth's set logic: requirePermission() supplies
 * the permissions, and this decides what they mean for navigation, where a
 * unit test can reach it without a session.
 *
 * ── A job is a screen, reached by the permissions that act on it ──────────
 *
 * The gate answers to either of its two arrival moves, `booking.check_in` or
 * `day_pass.admit`. The guard holds both and checks guests out there too — he
 * is the front desk, and takes the keys back (N54, answered by Jason on
 * 14 September 2026) — but `booking.check_out` does not open the gate:
 * Housekeeping holds it, and would otherwise sign in to a chooser of two
 * screens instead of straight to the departures. Each card offers only the
 * moves its reader holds. A screen none of whose moves a person may make is a
 * screen they have no reason to open.
 *
 * The departures screen answers to `inspection.record` **[A]**. It has three
 * acts — seeing a guest off, inspecting, marking the unit ready — and the
 * inspection is the one only housekeeping does: the office and the guard also
 * check guests out, and would otherwise be handed a cleaning list they have
 * nobody to work. Each card still checks its own step's permission
 * (lib/domain/turnover.ts).
 *
 * ── Who lands where ───────────────────────────────────────────────────────
 *
 * Somebody whose whole job is a field job: every permission they hold is one
 * the field surface uses, and at least one field screen is built for them.
 * With exactly one screen they sign in straight to it — the guard to the gate,
 * the cleaner to the departures — because the chooser in between would be a
 * second round trip on the guardhouse's one bar of signal, to show a menu of
 * one (Jeff, 13 September 2026). With two they land on the chooser at
 * `/field`. The office, which can also work the gate, lands on the portal as
 * before: its day is the portal, and the gate is one link away.
 *
 * Decided from permissions rather than role slugs, because roles are data an
 * administrator edits (architecture.md §4) and a renamed or merged role must
 * not change where somebody lands.
 */

export interface FieldJob {
  id: 'arrivals' | 'departures'
  label: string
  href: '/field/arrivals' | '/field/departures'
  /** Holding any one of these opens the screen. */
  permissions: readonly Permission[]
}

export const FIELD_JOBS: readonly FieldJob[] = [
  {
    id: 'arrivals',
    // The Gate: it checks guests out as well as in (N54). The id and the route
    // keep their first name, which guards have bookmarked.
    label: 'Gate',
    href: '/field/arrivals',
    permissions: ['booking.check_in', 'day_pass.admit'],
  },
  {
    id: 'departures',
    label: 'Departures',
    href: '/field/departures',
    permissions: ['inspection.record'],
  },
]

/**
 * The permissions the field surface uses. Holding anything outside this set
 * — creating bookings, verifying money, configuration — means the portal is
 * where the person's work is.
 *
 * `payment.record_cash` is in it because the guard takes the cash a guest
 * still owes at the gate (N54). It opens no screen on its own: somebody with
 * nothing else to work in the field still lands on the portal, where cash is
 * recorded against a booking.
 */
const FIELD_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  'booking.view',
  'booking.check_in',
  'booking.check_out',
  'day_pass.admit',
  'inspection.record',
  'payment.record_cash',
  'unit.manage',
])

export const PORTAL_HOME = '/portal'
export const FIELD_HOME = '/field'

export type LandingPath = typeof PORTAL_HOME | typeof FIELD_HOME | FieldJob['href']

/** The field screens this person can work, in display order. */
export function fieldJobsFor(permissions: ReadonlySet<Permission>): readonly FieldJob[] {
  return FIELD_JOBS.filter((job) =>
    job.permissions.some((permission) => permissions.has(permission)),
  )
}

/** Whether this person may open one field screen, named by its id. */
export function mayWork(permissions: ReadonlySet<Permission>, id: FieldJob['id']): boolean {
  return fieldJobsFor(permissions).some((job) => job.id === id)
}

/**
 * Where a person lands when nothing asked for a particular page.
 *
 * Somebody holding no permissions at all lands on the portal, which tells
 * them they have no access — the field home would say the same thing with
 * less to go on.
 */
export function landingPathFor(permissions: ReadonlySet<Permission>): LandingPath {
  const jobs = fieldJobsFor(permissions)
  const worksOnlyInTheField =
    jobs.length > 0 && [...permissions].every((permission) => FIELD_PERMISSIONS.has(permission))

  if (!worksOnlyInTheField) {
    return PORTAL_HOME
  }

  const [onlyJob] = jobs

  return jobs.length === 1 && onlyJob ? onlyJob.href : FIELD_HOME
}
