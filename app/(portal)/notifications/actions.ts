'use server'

import { getActor } from '@/lib/auth/require-permission'
import { markNotificationsSeen } from '@/lib/db/notifications'

/**
 * Opening the bell marks everything it shows seen, up to the newest item.
 *
 * Gated on a session rather than a permission, like renaming yourself: where
 * you have read up to is your own business. The account written is always
 * the session's, never one the browser names.
 */

export type MarkSeenResult = { ok: true; seenAt: string } | { ok: false }

export async function markNotificationsSeenAction(upTo: string): Promise<MarkSeenResult> {
  const actor = await getActor()
  // The browser's value, so it is checked before it reaches the database;
  // the database also clamps it to its own clock.
  const instant = typeof upTo === 'string' ? Date.parse(upTo) : Number.NaN

  if (!actor || Number.isNaN(instant)) {
    return { ok: false }
  }

  try {
    return {
      ok: true,
      seenAt: await markNotificationsSeen(actor.userId, new Date(instant).toISOString()),
    }
  } catch (error) {
    console.error('Could not record that the notifications were opened', error)

    return { ok: false }
  }
}
