import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LandingImage } from '@/lib/domain/landing-images'

import type { LandingFigures } from '@/lib/domain/landing-figures'

import { facilityCopy } from '../_content/landing'
import { SiteMedia } from './site-media'

/** A third of the container from `lg`, half from `md`, the full width below. */
const FACILITY_SIZES = '(min-width: 1024px) 363px, (min-width: 768px) 50vw, 100vw'

/**
 * What the day pass admits, card per facility.
 *
 * The cards were three hard-coded entries and a line of fine print naming what
 * the pass left out. Both are gone (Jeff, 17 September 2026). The list is now
 * whatever carries *Included in day pass* in Property settings, which is the
 * same answer `/day-pass` states before taking a booking — so ticking the gym
 * sells the gym here, and un-ticking the water park stops the front page
 * advertising a pass that no longer admits it. The [O] facilities are governed
 * by their tick, which is seeded off, rather than by a list in this file that
 * nobody would think to edit when the client answers.
 *
 * Nothing says what is *not* included. A page selling a pass that lists four
 * facilities a visitor will not get is arguing against itself; what they are
 * buying is the thing to say.
 *
 * Words are optional. `facilityCopy` carries a description and an icon for the
 * facilities we have written about, and a facility without an entry still gets
 * a card with its name and its photograph — the same rule the unit-type cards
 * follow, so a tick in the portal never produces a broken page.
 *
 * The grid is identical hairline cards — colour is not a card treatment
 * (design.md §Cards). The aqua moment here is the price line's text. Each
 * card's photograph is found by the facility's slug (capability F7), so a
 * rename in Property settings keeps it.
 */
export function DayPassSection({
  images,
  figures,
}: {
  images: Readonly<Record<string, LandingImage>>
  /** The day-pass prices, read from Property settings. Null when unreadable. */
  figures: LandingFigures | null
}) {
  const included = figures?.dayPassIncluded ?? []

  return (
    <section
      aria-labelledby="day-pass-heading"
      id="day-pass"
      className="scroll-mt-xl border-t border-divider bg-card px-xl py-3xl"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <p className="micro-label text-muted-foreground">Day pass</p>
        <h2
          id="day-pass-heading"
          className="mt-md max-w-[24ch] font-display text-display-md text-balance text-foreground sm:text-display-lg"
        >
          {figures?.dayPassFrom == null
            ? 'A full pool day'
            : `A full pool day, from ${figures.dayPassFrom}`}
        </h2>
        <p className="mt-md max-w-[52ch] text-body-lg text-copy">
          One pass covers everything below — pay per person, or take a family bundle.
        </p>

        {included.length === 0 ? null : (
          <ul className="mt-2xl grid gap-lg md:grid-cols-2 lg:grid-cols-3">
            {included.map((facility) => {
              const copy = facilityCopy[facility.slug]

              return (
                <li key={facility.slug}>
                  <Card className="h-full card-interactive hover:border-foreground/20">
                    <SiteMedia
                      image={images[facility.slug] ?? null}
                      sizes={FACILITY_SIZES}
                      label={copy?.imageLabel ?? `${facility.name} photo`}
                      icon={copy?.icon}
                    />
                    <h3 className="mt-lg text-display-xs text-foreground">{facility.name}</h3>
                    {copy ? (
                      <p className="mt-xs text-body-md text-copy">{copy.description}</p>
                    ) : null}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}

        <Card className="mt-lg flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-display-xs text-foreground">Day pass</p>
            {figures?.dayPassLine == null ? null : (
              <p className="mt-xs text-body-sm-strong text-accent-foreground">
                {figures.dayPassLine}
              </p>
            )}
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/day-pass">Book a day pass</Link>
          </Button>
        </Card>
      </div>
    </section>
  )
}
