import { BOOKING_STATUSES, type BookingStatus } from './booking-state'
import { BOOKING_STREAMS, type BookingStream } from './stream'

/**
 * The team's saved views on All bookings (capability B19, Jason's team,
 * 8 October 2026; open-questions.md N60).
 *
 * A view is a named set of the list's filters, kept for the whole property so
 * everybody sees the same row of them — Jason's "everything that still needs
 * chasing" is one click for the desk too, not a bookmark in his own browser.
 * Anyone who can see the list may save one or delete one (Jeff, 8 October).
 *
 * ── What a view holds, and what it never does ─────────────────────────────
 *
 * Status, type, the search and "Money owed". **Never dates**: "1–7 October"
 * saved as a view is wrong a week later, so a view is the kind of bookings and
 * the days are picked each time. The table has no column for them.
 *
 * ── Reading one back ──────────────────────────────────────────────────────
 *
 * A view was saved by a person, possibly on an older version of the app, and
 * the bookings page renders every view on every load. So a stored view is read
 * leniently and never throws: a status the state machine has since retired
 * simply drops out of the views that named it. The same set-not-list rule the
 * page applies to the URL (`readChoices`) puts what is left in the order the
 * filter row shows.
 */

/** A row of chips is a menu. Mirrored by `save_booking_list_view()`. */
export const MAX_BOOKING_LIST_VIEWS = 12

/** Long enough to say what it is; short enough to sit in a row. Mirrored by the table's check. */
export const MAX_VIEW_NAME_LENGTH = 40

/** The list's filters that a view can hold. */
export interface ViewFilter {
  statuses: readonly BookingStatus[]
  streams: readonly BookingStream[]
  search: string | null
  moneyOwed: boolean
}

export interface BookingListView {
  id: string
  name: string
  filter: ViewFilter
}

/** What a view looks like in storage, before it is trusted. */
export interface StoredViewFilter {
  statuses: readonly string[]
  streams: readonly string[]
  search: string | null
  moneyOwed: boolean
}

/** A stored view as a filter the page can apply, whatever it holds. */
export function filterFromStored(stored: StoredViewFilter): ViewFilter {
  const statuses = new Set(stored.statuses)
  const streams = new Set(stored.streams)
  const search = stored.search?.trim() ?? ''

  return {
    statuses: BOOKING_STATUSES.filter((status) => statuses.has(status)),
    streams: BOOKING_STREAMS.filter((stream) => streams.has(stream)),
    search: search.length > 0 ? search : null,
    moneyOwed: stored.moneyOwed,
  }
}

/** A filter with nothing in it is All bookings, which needs no view. */
export function isEmptyFilter(filter: ViewFilter): boolean {
  return (
    filter.statuses.length === 0 &&
    filter.streams.length === 0 &&
    filter.search === null &&
    !filter.moneyOwed
  )
}

/**
 * Whether two filters show the same bookings: the statuses and types as sets,
 * and the search without regard to case, which is how the list matches it.
 */
export function sameFilter(a: ViewFilter, b: ViewFilter): boolean {
  return (
    sameSet(a.statuses, b.statuses) &&
    sameSet(a.streams, b.streams) &&
    (a.search ?? '').toLowerCase() === (b.search ?? '').toLowerCase() &&
    a.moneyOwed === b.moneyOwed
  )
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const left = new Set(a)
  const right = new Set(b)

  return left.size === right.size && [...left].every((entry) => right.has(entry))
}

/** The URL param "Money owed" is carried in. */
export const MONEY_OWED_PARAM = 'owed'

/**
 * Where a view opens: the list with its filters in the URL, params in the
 * order the filter row writes them (`BookingsFilters.apply`) and each list in
 * canonical order. Choosing the same filters by hand can order the statuses
 * differently in the address; the page reads either into the same filter, so
 * the view still shows as current.
 */
/** The list's own address, with or without a query — typed as the route it is. */
export type BookingsListHref = '/bookings' | `/bookings?${string}`

export function viewHref(filter: ViewFilter): BookingsListHref {
  const params = new URLSearchParams()

  if (filter.search) {
    params.set('q', filter.search)
  }

  for (const status of BOOKING_STATUSES.filter((entry) => filter.statuses.includes(entry))) {
    params.append('status', status)
  }

  for (const stream of BOOKING_STREAMS.filter((entry) => filter.streams.includes(entry))) {
    params.append('stream', stream)
  }

  if (filter.moneyOwed) {
    params.set(MONEY_OWED_PARAM, '1')
  }

  const query = params.toString()

  return query ? `/bookings?${query}` : '/bookings'
}

/**
 * Which view the list is showing: `'all'` for no filter at all, a view's id
 * when the filters are exactly that view's, otherwise none.
 *
 * Dates on top of a view mean the list is no longer the view — a view never
 * holds dates — so nothing is shown as current, and the row does not claim a
 * list it is not showing.
 */
export function activeViewId(
  views: readonly BookingListView[],
  applied: ViewFilter,
  hasDates: boolean,
): string | null {
  if (hasDates) {
    return null
  }

  if (isEmptyFilter(applied)) {
    return 'all'
  }

  return views.find((view) => sameFilter(view.filter, applied))?.id ?? null
}

/** A name as the database stores and compares it: trimmed, spaces folded. */
export function tidyViewName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}
