import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * A field screen before today's list arrives (design.md §Skeletons, §Field).
 *
 * The same order the screens load in: the title, the day, the search, then the
 * row cards — each with its full-width action at the foot, at touch height, so
 * the arriving cards land where these stood. On a mid-range phone on poor
 * signal this is what the guard looks at for a second or two, and a blank
 * screen under the header reads as a screen that did not open.
 */
export function FieldListSkeleton({
  title,
  label = title,
  search = false,
  cards = 3,
}: {
  /** The screen's heading, printed as itself. Omit where it is the record's own name. */
  title?: string
  label?: string
  search?: boolean
  cards?: number
}) {
  return (
    <div role="status">
      <span className="sr-only">Loading {label ?? 'screen'}…</span>
      {title ? (
        <h1 className="text-display-sm text-foreground">{title}</h1>
      ) : (
        <Skeleton className="h-7 w-40" />
      )}
      <Skeleton className="mt-xs h-4 w-32" />

      {search ? <Skeleton className="mt-lg h-touch w-full" /> : null}

      <Skeleton className="mt-2xl h-5 w-28" />
      <ul className="mt-md grid gap-md" aria-hidden>
        {Array.from({ length: cards }, (_, index) => (
          <li key={index}>
            <Card>
              <div className="flex items-start justify-between gap-md">
                <div className="grid gap-xs">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="mt-md h-4 w-2/3" />
              <Skeleton className="mt-lg h-touch w-full" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
