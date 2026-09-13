import type { Permission } from '@/lib/auth/permissions'

/**
 * The field screens a person can work, and where they land after signing in.
 *
 * Pure, like the rest of lib/auth's set logic: requirePermission() supplies
 * the permissions, and this decides what they mean for navigation, where a
 * unit test can reach it without a session.
 *
 * ── A job is a screen, reached by the permission that acts on it ──────────
 *
 * The gate screen exists to check guests in, so it answers to
 * `booking.check_in` rather than to `booking.view` — a screen whose one
 * action a person may not take is a screen they have no reason to open.
 *
 * The departures screen answers to `inspection.record` **[A]**. It has three
 * acts — seeing a guest off, inspecting, marking the unit ready — and the
 * inspection is the one only housekeeping does: the desk also checks guests
 * out and also manages units, and would otherwise be handed a cleaning list
 * it has nobody to work. Each card still checks its own step's permission
 * (lib/domain/turnover.ts).
 *
 * ── Who lands on the phone screens ────────────────────────────────────────
 *
 * Somebody whose whole job is a field job: every permission they hold is one
 * the field surface uses, and at least one field screen is built for them. A
 * guard (booking.view + booking.check_in) signs in straight to the gate. The
 * desk, which also holds check-in, lands on the portal as before — its day is
 * the portal, and the gate screen is one link away.
 *
 * Decided from permissions rather than role slugs, because roles are data an
 * administrator edits (architecture.md §4) and a renamed or merged role must
 * not change where somebody lands.
 */

export interface FieldJob {
  id: 'arrivals' | 'departures'
  label: string
  href: '/field/arrivals' | '/field/departures'
  permission: Permission
}

export const FIELD_JOBS: readonly FieldJob[] = [
  { id: 'arrivals', label: 'Arrivals', href: '/field/arrivals', permission: 'booking.check_in' },
  {
    id: 'departures',
    label: 'Departures',
    href: '/field/departures',
    permission: 'inspection.record',
  },
]

/**
 * The permissions the field surface uses. Holding anything outside this set
 * — creating bookings, verifying money, configuration — means the portal is
 * where the person's work is.
 */
const FIELD_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  'booking.view',
  'booking.check_in',
  'booking.check_out',
  'inspection.record',
  'unit.manage',
])

export const PORTAL_HOME = '/portal'
export const FIELD_HOME = '/field'

/** The field screens this person can work, in display order. */
export function fieldJobsFor(permissions: ReadonlySet<Permission>): readonly FieldJob[] {
  return FIELD_JOBS.filter((job) => permissions.has(job.permission))
}

/**
 * Where a person lands when nothing asked for a particular page.
 *
 * Somebody holding no permissions at all lands on the portal, which tells
 * them they have no access — the field home would say the same thing with
 * less to go on.
 */
export function landingPathFor(
  permissions: ReadonlySet<Permission>,
): typeof PORTAL_HOME | typeof FIELD_HOME {
  const worksOnlyInTheField =
    fieldJobsFor(permissions).length > 0 &&
    [...permissions].every((permission) => FIELD_PERMISSIONS.has(permission))

  return worksOnlyInTheField ? FIELD_HOME : PORTAL_HOME
}
