import Link from 'next/link'

import {
  isEmptyFilter,
  sameFilter,
  viewHref,
  type BookingListView,
  type BookingsListHref,
  type ViewFilter,
} from '@/lib/domain/booking-list-view'
import { cn } from '@/lib/utils'

import { DeleteViewDialog } from './delete-view-dialog'
import { SaveViewDialog } from './save-view-dialog'

/**
 * The team's saved views, as a row above the filters (capability B19).
 *
 * The segmented construction `components/ui/tabs.tsx` uses — a muted track
 * with the current view lifted out of it as the "where am I" chip — but each
 * segment is a link, because a view is a URL like every filter on this screen:
 * it can be bookmarked, opened in a tab, and left with the back button. Server
 * rendered; only the two dialogs are islands.
 *
 * "All bookings" always leads, so the way back to the whole list is never a
 * search for the Clear button. Nothing is marked current when the list shows a
 * filter no view holds — the row does not claim a list it is not showing.
 *
 * The track scrolls sideways inside itself rather than wrapping: a track
 * broken over two lines stops reading as one control. Up to twelve views fit
 * at desktop width; on a phone the row scrolls.
 */

interface SavedViewsProps {
  views: readonly BookingListView[]
  /** `'all'`, a view's id, or null when the filters match no view. */
  activeId: string | null
  /** What the list is filtered by now, for Save view. */
  applied: ViewFilter
  /** Whether dates are on as well — a view never saves them. */
  hasDates: boolean
}

export function SavedViews({ views, activeId, applied, hasDates }: SavedViewsProps) {
  const activeView = views.find((view) => view.id === activeId) ?? null
  // Dates aside: with Stay date on, a view holding the other filters already
  // exists, and saving them again would only be refused as a duplicate.
  const alreadySaved = views.some((view) => sameFilter(view.filter, applied))
  const canSave = !isEmptyFilter(applied) && !alreadySaved

  return (
    <div className="mt-xl flex flex-wrap items-center gap-sm">
      <nav aria-label="Saved views" className="max-w-full overflow-x-auto">
        <ul className="inline-flex h-control items-stretch gap-xxs rounded-md bg-muted p-xxs">
          <li className="flex">
            <ViewLink href="/bookings" isCurrent={activeId === 'all'}>
              All bookings
            </ViewLink>
          </li>
          {views.map((view) => (
            <li key={view.id} className="flex">
              <ViewLink href={viewHref(view.filter)} isCurrent={view.id === activeId}>
                {view.name}
              </ViewLink>
            </li>
          ))}
        </ul>
      </nav>

      {canSave ? <SaveViewDialog filter={applied} hasDates={hasDates} /> : null}
      {activeView ? <DeleteViewDialog viewId={activeView.id} name={activeView.name} /> : null}
    </div>
  )
}

function ViewLink({
  href,
  isCurrent,
  children,
}: {
  href: BookingsListHref
  isCurrent: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'inline-flex items-center rounded-sm px-md text-body-sm whitespace-nowrap transition-colors outline-none',
        // Inset, because the row scrolls inside itself and would clip a ring
        // drawn outside the first and last segments.
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        isCurrent
          ? 'bg-tab-chip font-medium text-foreground shadow-lift'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}
