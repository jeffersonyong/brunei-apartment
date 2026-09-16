import { NextResponse } from 'next/server'

import { getActor } from '@/lib/auth/require-permission'
import { readNotificationFeed } from '@/lib/db/notifications'

/**
 * The bell's feed: the reader's newest notifications and how many are new.
 *
 * A route handler rather than a server action because the bell polls it:
 * actions are dispatched one at a time, and a read on a timer should not
 * queue behind somebody's save. It is a portal path (lib/auth/surfaces.ts), so
 * proxy.ts has already refused a caller with no session; this re-reads the
 * actor because the feed is chosen by their permissions.
 *
 * Never cached: the point of the feed is that it is current.
 */

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  const actor = await getActor()

  if (!actor) {
    return NextResponse.json({ error: 'Signed out' }, { status: 401 })
  }

  try {
    const feed = await readNotificationFeed(actor.userId, actor.permissions)

    return NextResponse.json(feed, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('The notification feed could not be read', error)

    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}
