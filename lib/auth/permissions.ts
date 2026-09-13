/**
 * The permission vocabulary and the pure set logic over it.
 *
 * Pure and I/O-free on purpose: requirePermission() composes these with the
 * session and the database, but what "holding a permission" means is decided
 * here, where a unit test can reach it without a running stack.
 */

/**
 * The atomic permission strings (prd.md §4).
 *
 * Permissions, not roles, are the unit of enforcement. Roles are compositions
 * of these and are data rather than code, so a role change is an admin action
 * and never a deployment. The same closed list is enforced in the database by
 * the CHECK constraint on role_permission (migration 000400) — a new string
 * is a code change and a migration, together.
 */
export const PERMISSIONS = [
  'booking.view',
  'booking.create',
  'booking.amend',
  'booking.cancel',
  'booking.override_hold',
  /**
   * Discounting a booking, at creation or on an amendment.
   *
   * Deliberately not folded into `booking.create`. Every other permission here
   * gates an operational act; this one gates giving money away, and separating
   * it is what lets a manager withhold discretion from a role that otherwise
   * takes bookings all day.
   */
  'booking.discount',
  /**
   * Checking a guest in, at the gate or at the desk (capability D3's check-in,
   * without the QR).
   *
   * Its own string, and one of two rather than one for both moves (N11,
   * 13 September 2026). It used to borrow `booking.amend`, which kept Security
   * from checking anybody in and would have let a guard edit a booking had it
   * been granted. It handles no money: `check_in_booking()` refuses a booking
   * whose deposit is not held, so a guard can only let in a guest the office
   * has already secured. Security, Front Office and Admin.
   */
  'booking.check_in',
  /**
   * Checking a guest out — the cleaner's "the guest has left", or the desk's.
   *
   * Separate from `booking.check_in` so each role holds the move that is its
   * job: the guard never checks a guest out and the cleaner never checks one
   * in. Housekeeping, Front Office and Admin.
   */
  'booking.check_out',
  'payment.verify',
  'payment.record_cash',
  'inspection.record',
  'charge.create',
  'charge.waive',
  'deposit.approve_release',
  /**
   * Waiving the security deposit on a booking, at creation.
   *
   * Separate from `booking.create` for the reason `booking.discount` is: it
   * decides that money is not taken. The ordinary case is a stay continuing
   * another booking whose deposit is already held (prd.md §11, B15).
   */
  'deposit.waive',
  'unit.manage',
  'tenancy.manage',
  'config.manage',
  'report.view',
  'document.view_identity',
  /**
   * Adding, replacing, reframing and removing the photographs on the public
   * site (capability F7).
   *
   * Its own string rather than `config.manage`, which prd.md §4 reused twice
   * for screens an administrator opens a couple of times a year. This one is
   * different in who does it: whoever runs the Instagram account refreshes the
   * "Follow along" tiles, and `config.manage` would also hand them pricing,
   * roles and the audit log. Seeded to Admin; any other role is one tick in
   * Roles & staff.
   */
  'site_image.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(PERMISSIONS)

/**
 * Rows from role_permission, as a set — the union across a user's roles
 * (architecture.md §4).
 *
 * Unknown strings are dropped rather than kept or thrown on: the CHECK
 * constraint makes them near-impossible, but if one ever appears (a migration
 * ahead of a deploy, say) the safe reading is "a permission this build cannot
 * check is a permission this build does not grant".
 */
export function toPermissionSet(raw: readonly string[]): ReadonlySet<Permission> {
  return new Set(raw.filter((value): value is Permission => KNOWN_PERMISSIONS.has(value)))
}

export function hasPermission(
  permissions: ReadonlySet<Permission>,
  permission: Permission,
): boolean {
  return permissions.has(permission)
}
