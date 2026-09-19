import type { Route } from 'next'
import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CHECK_IN_SIGN_OFF, CHECK_IN_STEPS } from '@/lib/domain/check-in'

import { CallFoodProviderButton, FoodNoticeText } from '../../_components/food'
import { LocationMap, OpenInMapsButton, PropertyAddress } from '../../_components/location'

/** The 720px column less the card's own padding and hairline. */
const MAP_SIZES = '(min-width: 752px) 690px, 100vw'

/**
 * What a confirmed stay does at the Security Counter (Jeff, 19 September
 * 2026). The same list the confirmation email sends, from the same module.
 *
 * The step markers are "How it works"'s hairline tiles at card scale: a count,
 * not a colour.
 */
export function CheckInCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <h2 className="micro-label text-muted-foreground">Check-in instructions</h2>
      <ol className="mt-md space-y-sm">
        {CHECK_IN_STEPS.map((step, index) => (
          <li key={step} className="flex gap-md">
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-caption text-foreground tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-[2px] text-body-md text-foreground">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-lg text-body-sm text-muted-foreground">{CHECK_IN_SIGN_OFF}</p>
    </Card>
  )
}

/**
 * What there is to eat (Jeff, 19 September 2026), for anyone confirmed: the
 * menu is at the poolside tables, so a day pass is told too. The number to
 * call, and the flyer's page when there is a flyer.
 */
export function FoodCard({
  notice,
  hasMenu,
  className,
}: {
  notice: { body: string; phone: string }
  hasMenu: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <h2 className="micro-label text-muted-foreground">Food</h2>
      <FoodNoticeText notice={notice} className="mt-md" />
      {notice.phone !== '' || hasMenu ? (
        <div className="mt-md flex flex-col gap-sm sm:flex-row">
          {notice.phone === '' ? null : (
            <CallFoodProviderButton phone={notice.phone} className="w-full sm:w-auto" />
          )}
          {hasMenu ? (
            <Button asChild variant="tertiary" className="w-full sm:w-auto">
              <Link href={'/food' as Route}>
                <UtensilsCrossed aria-hidden />
                See the food menu
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  )
}

/** Where the building is, for anyone confirmed: a day pass drives here too. */
export function GettingHereCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <h2 className="micro-label text-muted-foreground">Getting here</h2>
      <div className="mt-md flex flex-col gap-md sm:flex-row sm:items-end sm:justify-between">
        <PropertyAddress />
        <OpenInMapsButton className="w-full sm:w-auto" />
      </div>
      <LocationMap sizes={MAP_SIZES} className="mt-md rounded-md" />
    </Card>
  )
}
