import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/**
 * A public page before its data arrives (design.md §Skeletons), in the
 * customer surface's own measure: the eyebrow and the headline band, then the
 * body.
 *
 * The eyebrow and the headline are printed as themselves where the page's
 * headline is fixed. That band is what a customer recognises the page by, and
 * it keeps the Fraunces headline in place, so the page does not visibly change
 * type when it arrives. A headline that depends on the booking ("Almost
 * done", "You're booked") is a bar instead.
 *
 * Two bodies, matching the two kinds of page:
 * - `booking`: the wide booking form, a card of choices beside a 360px
 *   summary, as /stay and /day-pass lay it out.
 * - `document`: a 720px column of reading, as the FAQ, the privacy policy and
 *   a customer's own booking page are.
 */
export function PublicPageSkeleton({
  eyebrow,
  title,
  label = title ?? 'page',
  body,
}: {
  eyebrow: string
  /** The page's fixed headline. Omit where the headline depends on the record. */
  title?: string
  label?: string
  body: 'booking' | 'document'
}) {
  const isBooking = body === 'booking'
  const measure = isBooking ? 'max-w-[1120px]' : 'max-w-[720px]'

  return (
    <div role="status">
      <span className="sr-only">Loading {label}…</span>

      <section className={cn('bg-card px-xl pt-3xl', isBooking ? 'pb-xl' : 'pb-lg')}>
        <div className={cn('mx-auto w-full', measure)}>
          <p className="micro-label text-accent-foreground">{eyebrow}</p>
          {title ? (
            <h1 className="mt-md font-display text-display-md text-foreground sm:text-display-lg">
              {title}
            </h1>
          ) : (
            <Skeleton className="mt-md h-10 w-64" />
          )}
          <Skeleton className="mt-md h-5 w-[min(460px,85%)]" />
        </div>
      </section>

      {isBooking ? (
        <div className="border-t border-divider bg-card px-xl pt-xl pb-3xl">
          <div className="mx-auto grid w-full max-w-[1120px] gap-xl lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <Skeleton className="h-3 w-24" />
              <div className="mt-md flex flex-wrap gap-sm">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-16 grow basis-48" />
                ))}
              </div>
              <Skeleton className="mt-xl h-3 w-28" />
              <Skeleton className="mt-md h-[320px] w-full rounded-lg" />
            </Card>
            <Card className="lg:self-start">
              <Skeleton className="h-3 w-20" />
              <div className="mt-md grid gap-sm">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="mt-xl h-control w-full" />
            </Card>
          </div>
        </div>
      ) : (
        <div className="bg-card px-xl pb-3xl">
          <div className="mx-auto grid w-full max-w-[720px] gap-md border-t border-divider pt-xl">
            {['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3'].map(
              (width, index) => (
                <Skeleton key={index} className={cn('h-4', width)} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  )
}
