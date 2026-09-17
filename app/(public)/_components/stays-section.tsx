import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { LandingImage } from '@/lib/domain/landing-images'

import type { LandingFigures } from '@/lib/domain/landing-figures'

import { unitTypeCopy } from '../_content/landing'
import { SiteMedia } from './site-media'

/** A quarter of the container from `lg`, half from `md`, the full width below. */
const UNIT_TYPE_SIZES = '(min-width: 1024px) 268px, (min-width: 768px) 50vw, 100vw'

/**
 * "From" rates only — the grid is a scannable teaser, so each card carries
 * just the photo, name, one line and the rate. The open [O] items that used to
 * render per card are policy questions rather than per-unit facts, and now sit
 * once on /stay.
 *
 * Cards link to /stay, which is also where the section CTA goes; in Phase 2
 * they become per-unit routes on the existing `slug` — the same slug each
 * card's photograph is found by (capability F7).
 */
export function StaysSection({
  images,
  figures,
}: {
  images: Readonly<Record<string, LandingImage>>
  /**
   * The types on sale and their rates, read from Property settings. Null when
   * the read failed: the section still renders, without the figures, rather
   * than quoting a rate nobody can stand behind.
   */
  figures: LandingFigures | null
}) {
  const unitTypes = figures?.unitTypes ?? []

  return (
    <section
      aria-labelledby="stays-heading"
      id="stays"
      className="scroll-mt-xl border-t border-divider bg-card px-xl py-3xl"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <p className="micro-label text-muted-foreground">Short stays</p>
        <h2
          id="stays-heading"
          className="mt-md max-w-[26ch] font-display text-display-md text-balance text-foreground sm:text-display-lg"
        >
          {figures?.fromNightlyRate == null
            ? 'Whole units, by the night'
            : `Whole units, from ${figures.fromNightlyRate} a night`}
        </h2>
        <p className="mt-md max-w-[52ch] text-body-lg text-copy">
          The whole place to yourselves — apartments and a semi-detached house.
        </p>

        <ul className="mt-2xl grid gap-lg md:grid-cols-2 lg:grid-cols-4">
          {unitTypes.map((unit) => {
            const copy = unitTypeCopy[unit.slug]

            return (
              <li key={unit.slug}>
                <Link
                  href="/stay"
                  aria-label={`${unit.name} — from ${unit.fromRate} a night`}
                  className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Card className="flex h-full card-interactive flex-col hover:border-foreground/20">
                    <SiteMedia
                      image={images[unit.slug] ?? null}
                      sizes={UNIT_TYPE_SIZES}
                      label={copy?.imageLabel ?? `${unit.name} photo`}
                    />
                    <h3 className="mt-lg text-display-xs text-foreground">{unit.name}</h3>
                    {/* A type staff added in Property settings has no line written
                      for it, and a card with a name, a photograph and a rate is
                      complete without one. */}
                    {copy ? (
                      <p className="mt-xs text-body-sm text-copy">{copy.description}</p>
                    ) : null}
                    {/* Pushed to the card foot so rates line up across the row
                      regardless of description length. */}
                    <p className="mt-auto pt-lg micro-label text-muted-foreground">from</p>
                    <p className="mt-xxs text-display-xs text-foreground tabular-nums">
                      {unit.fromRate}
                      <span className="ml-xs text-caption font-normal text-muted-foreground">
                        / night
                      </span>
                    </p>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-xl flex flex-wrap items-center gap-lg">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/stay">Book a short stay</Link>
          </Button>
        </div>

        {figures === null ? null : (
          <p className="mt-lg text-caption text-muted-foreground">{figures.stayFinePrint}</p>
        )}
      </div>
    </section>
  )
}
