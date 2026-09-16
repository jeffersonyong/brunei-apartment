import type { Permission } from '@/lib/auth/permissions'

import { describeAuditEvent } from './audit-label'
import { formatCents } from './money'

/**
 * The portal's notifications: the few events somebody at the desk should hear
 * about without going to look.
 *
 * **They are read off the audit trail, not written separately.** Every one of
 * these is already an append-only event (architecture.md §4), so a second
 * table of the same facts would be a copy that could disagree with the
 * original. What is stored is only how far each person has read (see
 * lib/db/notifications.ts).
 *
 * Three, deliberately, and each names the permission that lets somebody act
 * on it, so nobody is told about work they cannot do:
 *
 * - a booking a guest made on the website — somebody new is coming;
 * - a payment waiting to be checked — the verification queue has grown;
 * - a booking email that failed — the guest may be waiting for something.
 *
 * Hold expiry is not among them because holds do not expire (open question
 * N7), so the event never happens. Nobody is told about something they did
 * themselves; the reader filters on the actor.
 */

export type NotificationKind = 'booking' | 'payment' | 'email'

export const NOTIFICATION_KINDS = [
  { action: 'booking.created_public', kind: 'booking', permission: 'booking.view' },
  { action: 'booking.submit_payment', kind: 'payment', permission: 'payment.verify' },
  { action: 'email.failed', kind: 'email', permission: 'booking.view' },
] as const satisfies readonly {
  action: string
  kind: NotificationKind
  permission: Permission
}[]

/** How many the bell lists: the newest, over the last fortnight. */
export const MAX_NOTIFICATIONS = 20

/** How far back the bell looks. Older news is in the audit log. */
export const NOTIFICATION_WINDOW_DAYS = 14

/** The most the badge counts before it says "9+". */
const MAX_BADGE_COUNT = 9

/** An audit event as the reader hands it over. */
export interface NotificationEvent {
  id: string
  action: string
  entityType: string
  /** The booking's reference, or null when the booking has since been removed. */
  subjectLabel: string | null
  after: Record<string, unknown> | null
  at: string
}

export interface PortalNotification {
  id: string
  kind: NotificationKind
  title: string
  /** The booking's reference, then whose it is, then any amount. */
  detail: string
  /** Where it opens, or null when there is nothing left to open. */
  href: string | null
  at: string
}

/** The verbs somebody holding `permissions` is notified of, in a stable order. */
export function notificationActionsFor(permissions: ReadonlySet<Permission>): string[] {
  return NOTIFICATION_KINDS.filter((kind) => permissions.has(kind.permission)).map(
    (kind) => kind.action,
  )
}

/**
 * One event as the bell shows it, or null when it is not a notification for
 * this reader — a verb that is not one, a subject that is not a booking (a
 * password reset email fails against a staff account), or a permission the
 * reader does not hold.
 */
export function toNotification(
  event: NotificationEvent,
  guestName: string | null,
  permissions: ReadonlySet<Permission>,
): PortalNotification | null {
  const kind = NOTIFICATION_KINDS.find((candidate) => candidate.action === event.action)

  if (!kind || event.entityType !== 'booking' || !permissions.has(kind.permission)) {
    return null
  }

  // The payload carries the reference on a public booking, so a booking that
  // has since been removed can still be named.
  const payloadReference = typeof event.after?.reference === 'string' ? event.after.reference : null
  const reference = event.subjectLabel ?? payloadReference
  const amount = kind.kind === 'payment' ? amountOf(event.after) : null
  const detail =
    reference === null
      ? 'A booking since removed'
      : [reference, guestName, amount].filter((part) => part !== null && part !== '').join(' · ')

  return {
    id: event.id,
    kind: kind.kind,
    title: titleOf(kind.kind, event),
    detail,
    href: hrefOf(kind.kind, reference),
    at: event.at,
  }
}

function titleOf(kind: NotificationKind, event: NotificationEvent): string {
  switch (kind) {
    case 'booking':
      return event.after?.stream === 'day_pass'
        ? 'New online booking — day pass'
        : 'New online booking — short stay'
    case 'payment':
      return 'Payment to verify'
    case 'email':
      // The audit log's own sentence, without the reason: the booking's
      // history has it, and a bell line has room for one clause.
      return describeAuditEvent({ action: event.action, before: null, after: event.after }).split(
        ' — ',
      )[0] as string
  }
}

function hrefOf(kind: NotificationKind, reference: string | null): string | null {
  // The queue, not the booking: verifying is done there, beside the others.
  if (kind === 'payment') {
    return '/payments'
  }

  return reference === null ? null : `/bookings/${reference}`
}

function amountOf(after: Record<string, unknown> | null): string | null {
  const cents = after?.amount_cents

  return typeof cents === 'number' && Number.isInteger(cents) && cents > 0
    ? `BND ${formatCents(cents)}`
    : null
}

/** How many arrived after `seenAt`; everything, for somebody who has never looked. */
export function unreadCount(items: readonly { at: string }[], seenAt: string | null): number {
  if (seenAt === null) {
    return items.length
  }

  const seen = new Date(seenAt).getTime()

  return items.filter((item) => new Date(item.at).getTime() > seen).length
}

/** The badge's text, or null when there is nothing to show. */
export function formatUnreadCount(count: number): string | null {
  if (count <= 0) {
    return null
  }

  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count)
}
