import {
  filterFromStored,
  MAX_BOOKING_LIST_VIEWS,
  MAX_VIEW_NAME_LENGTH,
  type BookingListView,
  type ViewFilter,
} from '@/lib/domain/booking-list-view'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * The team's saved views on All bookings (capability B19).
 *
 * **It checks no permissions** (architecture.md §4): the server action calls
 * `requirePermission('booking.view')` first. Anyone who can see the list may
 * save or delete a view (Jeff, 8 October 2026), so that is the whole gate.
 *
 * Saving goes through `save_booking_list_view()` for the two rules that need
 * the other rows — the cap and the duplicate — under one lock. Deleting is a
 * plain delete: there is nothing to check, and nothing to record
 * (architecture.md §4, why views are not audited).
 */

export interface ViewWriteError {
  code: string
  message: string
}

export type ViewWriteResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: ViewWriteError }

interface ViewRow {
  id: string
  name: string
  statuses: string[] | null
  streams: string[] | null
  search: string | null
  money_owed: boolean
}

/** Every view, oldest first — the order the team saved them in. */
export async function listBookingListViews(): Promise<readonly BookingListView[]> {
  const { data, error } = await dataClient()
    .from('booking_list_view')
    .select('id, name, statuses, streams, search, money_owed')
    .eq('property_id', await currentPropertyId())
    .order('created_at')
    .order('id')
    // Bounded by the cap the save enforces; the limit is a backstop.
    .limit(MAX_BOOKING_LIST_VIEWS * 2)

  if (error) {
    throw new Error(`Could not read the saved views: ${error.message}`)
  }

  return ((data ?? []) as ViewRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    filter: filterFromStored({
      statuses: row.statuses ?? [],
      streams: row.streams ?? [],
      search: row.search,
      moneyOwed: row.money_owed,
    }),
  }))
}

export async function saveBookingListView(input: {
  name: string
  filter: ViewFilter
  actorId: string
}): Promise<ViewWriteResult<{ id: string }>> {
  const { data, error } = await dataClient().rpc('save_booking_list_view', {
    p_property_id: await currentPropertyId(),
    p_name: input.name,
    p_statuses: [...input.filter.statuses],
    p_streams: [...input.filter.streams],
    p_search: input.filter.search,
    p_money_owed: input.filter.moneyOwed,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not save the view: ${error.message}`)
  }

  const result = data as { ok: true; id: string } | { ok: false; error: string; name?: string }

  return result.ok ? { ok: true, id: result.id } : refused(result.error, result.name)
}

export async function deleteBookingListView(id: string): Promise<ViewWriteResult> {
  const { data, error } = await dataClient()
    .from('booking_list_view')
    .delete()
    .eq('property_id', await currentPropertyId())
    .eq('id', id)
    .select('id')

  if (error) {
    throw new Error(`Could not delete the view: ${error.message}`)
  }

  return (data ?? []).length > 0 ? { ok: true } : refused('not_found')
}

/** A refusal somebody can act on. */
function viewWriteMessage(code: string, existingName?: string): string {
  switch (code) {
    case 'actor_required':
      return 'Sign in again — the view was not saved.'
    case 'name_required':
      return 'Give the view a name.'
    case 'name_too_long':
      return `Keep the name to ${MAX_VIEW_NAME_LENGTH} characters or fewer.`
    case 'search_too_long':
      return 'That search is too long to save.'
    case 'nothing_to_save':
      return 'Choose a filter first — with none, this is All bookings.'
    case 'name_taken':
      return 'There is already a view with that name. Choose another.'
    case 'duplicate':
      return existingName
        ? `“${existingName}” already shows exactly these bookings.`
        : 'A view already shows exactly these bookings.'
    case 'too_many':
      return `There are already ${MAX_BOOKING_LIST_VIEWS} views. Delete one you no longer use first.`
    case 'not_found':
      return 'That view has already been deleted.'
    default:
      return 'The view could not be saved.'
  }
}

function refused(code: string, existingName?: string): { ok: false; error: ViewWriteError } {
  return { ok: false, error: { code, message: viewWriteMessage(code, existingName) } }
}
