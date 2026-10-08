'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { readSearch } from '@/components/portal/list-params'
import { requirePermission } from '@/lib/auth/require-permission'
import { deleteBookingListView, saveBookingListView } from '@/lib/db/booking-list-views'
import { BOOKING_STATUSES } from '@/lib/domain/booking-state'
import { tidyViewName } from '@/lib/domain/booking-list-view'
import { BOOKING_STREAMS } from '@/lib/domain/stream'

/**
 * Saving and deleting the team's views on All bookings (capability B19).
 *
 * Both answer to `booking.view` — the permission that shows the list — because
 * anyone who can see the list may save a view or delete one (Jeff, 8 October
 * 2026). The filter arrives as the dialog posts it and is checked here against
 * the statuses and types that exist, and the search is put through the same
 * `readSearch` the page applies, so a view can only hold a filter the page
 * would itself have applied.
 */

export interface ViewActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
}

const UNREADABLE: ViewActionState = {
  status: 'error',
  message: 'That form could not be read. Reload the page and try again.',
}

/** Values from one of the canonical lists, and nothing else. */
function oneOf(canonical: readonly string[]) {
  return z.array(z.string()).refine((values) => values.every((value) => canonical.includes(value)))
}

const saveSchema = z.object({
  name: z.string(),
  statuses: oneOf(BOOKING_STATUSES),
  streams: oneOf(BOOKING_STREAMS),
  search: z.string(),
  moneyOwed: z.enum(['true', 'false']),
})

const deleteSchema = z.object({ viewId: z.uuid() })

export async function saveBookingViewAction(
  _previous: ViewActionState,
  formData: FormData,
): Promise<ViewActionState> {
  const actor = await requirePermission('booking.view')
  const parsed = saveSchema.safeParse({
    name: formData.get('name'),
    statuses: formData.getAll('status'),
    streams: formData.getAll('stream'),
    search: formData.get('search') ?? '',
    moneyOwed: formData.get('moneyOwed'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await saveBookingListView({
    name: tidyViewName(parsed.data.name),
    filter: {
      statuses: BOOKING_STATUSES.filter((status) => parsed.data.statuses.includes(status)),
      streams: BOOKING_STREAMS.filter((stream) => parsed.data.streams.includes(stream)),
      search: readSearch(parsed.data.search),
      moneyOwed: parsed.data.moneyOwed === 'true',
    },
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidatePath('/bookings')

  return { status: 'done' }
}

export async function deleteBookingViewAction(
  _previous: ViewActionState,
  formData: FormData,
): Promise<ViewActionState> {
  await requirePermission('booking.view')
  const parsed = deleteSchema.safeParse({ viewId: formData.get('viewId') })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await deleteBookingListView(parsed.data.viewId)

  revalidatePath('/bookings')

  // Somebody else deleting it first is the outcome that was asked for, so it
  // closes the dialog like a success — with the list now showing why.
  if (!result.ok && result.error.code !== 'not_found') {
    return { status: 'error', message: result.error.message }
  }

  return { status: 'done' }
}
