import type { Permission } from '@/lib/auth/permissions'
import {
  MAX_NOTIFICATIONS,
  NOTIFICATION_WINDOW_DAYS,
  notificationActionsFor,
  toNotification,
  unreadCount,
  type PortalNotification,
} from '@/lib/domain/notifications'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * The portal's notifications, read off the audit trail (see
 * lib/domain/notifications.ts), and how far each person has read them
 * (20261001000100).
 *
 * **It checks no permissions of its own** (architecture.md §4) beyond choosing
 * the verbs: the caller hands over the reader's permissions, and the route
 * that calls this answers only to a signed-in member of staff.
 */

export interface NotificationFeed {
  items: readonly PortalNotification[]
  /** When the reader last opened the bell, or null if they never have. */
  seenAt: string | null
  unread: number
}

interface EventRow {
  id: string
  action: string
  entity_type: string
  subject_label: string | null
  after: Record<string, unknown> | null
  at: string
}

const DAY_MS = 86_400_000

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The newest notifications for one member of staff, and how many are new. */
export async function readNotificationFeed(
  userId: string,
  permissions: ReadonlySet<Permission>,
  now: Date = new Date(),
): Promise<NotificationFeed> {
  // The id is interpolated into filter grammar below, so it is checked
  // against the one shape it can have — the audit trail's rule.
  if (!UUID.test(userId)) {
    throw new Error('A notification feed needs a staff account id')
  }

  const actions = notificationActionsFor(permissions)
  const seenAt = await readNotificationsSeenAt(userId)

  if (actions.length === 0) {
    return { items: [], seenAt, unread: 0 }
  }

  const propertyId = await currentPropertyId()
  const since = new Date(now.getTime() - NOTIFICATION_WINDOW_DAYS * DAY_MS).toISOString()

  const { data, error } = await dataClient()
    .from('audit_event_summary')
    .select('id, action, entity_type, subject_label, after, at')
    .eq('property_id', propertyId)
    .in('action', actions)
    // Every notification is about a booking; a password reset email that
    // failed is filed on a staff account and is not one.
    .eq('entity_type', 'booking')
    .gte('at', since)
    // Nobody is told about what they did themselves. `neq` alone would drop
    // the events nobody performed — a guest's — since null <> x is not true.
    .or(`actor_id.is.null,actor_id.neq.${userId}`)
    .order('at', { ascending: false })
    .limit(MAX_NOTIFICATIONS)

  if (error) {
    throw new Error(`Could not read the notifications: ${error.message}`)
  }

  const rows = (data ?? []) as EventRow[]
  const guests = await guestNamesFor(
    propertyId,
    rows.map((row) => row.subject_label).filter((label): label is string => label !== null),
  )

  const items = rows
    .map((row) =>
      toNotification(
        {
          id: row.id,
          action: row.action,
          entityType: row.entity_type,
          subjectLabel: row.subject_label,
          after: row.after,
          at: row.at,
        },
        row.subject_label === null ? null : (guests.get(row.subject_label) ?? null),
        permissions,
      ),
    )
    .filter((item): item is PortalNotification => item !== null)

  return { items, seenAt, unread: unreadCount(items, seenAt) }
}

/** Whose each booking is, by reference — the line under each notification. */
async function guestNamesFor(
  propertyId: string,
  references: readonly string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(references)]

  if (unique.length === 0) {
    return new Map()
  }

  const { data, error } = await dataClient()
    .from('booking_summary')
    .select('reference, guest_name')
    .eq('property_id', propertyId)
    .in('reference', unique)

  if (error) {
    throw new Error(`Could not read the notifications' bookings: ${error.message}`)
  }

  const rows = (data ?? []) as { reference: string; guest_name: string | null }[]

  return new Map(
    rows
      .filter((row) => row.guest_name !== null && row.guest_name !== '')
      .map((row) => [row.reference, row.guest_name as string]),
  )
}

export async function readNotificationsSeenAt(userId: string): Promise<string | null> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('notification_read')
    .select('seen_at')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read when the notifications were last opened: ${error.message}`)
  }

  return (data as { seen_at: string } | null)?.seen_at ?? null
}

/**
 * Marks everything up to `upTo` — the newest notification the reader was
 * shown — as seen, and returns the position the database recorded. The
 * database clamps it to its own clock and never moves it backwards.
 */
export async function markNotificationsSeen(userId: string, upTo: string): Promise<string> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('mark_notifications_seen', {
    p_property_id: propertyId,
    p_user_id: userId,
    p_seen_at: upTo,
  })

  if (error || typeof data !== 'string') {
    throw new Error(
      `Could not record that the notifications were opened: ${error?.message ?? 'no time returned'}`,
    )
  }

  return data
}
