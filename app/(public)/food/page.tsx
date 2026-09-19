import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { readFoodMenuImage, readFoodNotice } from '@/lib/db/food-notice'
import { isFoodNoticeShown } from '@/lib/domain/food-notice'

import { CallFoodProviderButton, FoodNoticeText } from '../_components/food'

export const metadata: Metadata = {
  title: 'Food — Palm Villa',
  // Reached from a confirmation and a booking page, not from a search: the
  // flyer is another business's, and its prices are theirs to advertise.
  robots: { index: false, follow: false },
}

/**
 * The food page (Jeff, 19 September 2026): the notice and the provider's menu
 * flyer, shown whole. The confirmation email and a confirmed booking link
 * here, so the flyer is one tap away without riding in every email.
 *
 * Read as it renders, like the booking page: staff change the provider from
 * Website settings → Food, and the next visit should show the new one. An
 * empty notice is the notice switched off, and then there is no page.
 */
export const dynamic = 'force-dynamic'

/** The flyer's width in the 640px column, and the full width below it. */
const FLYER_SIZES = '(min-width: 688px) 640px, 100vw'

export default async function FoodPage() {
  const [notice, flyer] = await Promise.all([readFoodNotice(), readFoodMenuImage()])

  if (!isFoodNoticeShown(notice)) {
    notFound()
  }

  return (
    <section aria-labelledby="food-heading" className="bg-card px-xl py-3xl">
      <div className="mx-auto w-full max-w-[640px]">
        <p className="micro-label text-accent-foreground">Palm Villa</p>
        <h1
          id="food-heading"
          className="mt-md font-display text-display-md text-foreground sm:text-display-lg"
        >
          Food
        </h1>

        <FoodNoticeText notice={notice} className="mt-lg" />

        {notice.phone === '' ? null : (
          <CallFoodProviderButton phone={notice.phone} className="mt-xl w-full sm:w-auto" />
        )}

        {flyer ? (
          <figure className="mt-2xl">
            {/* The full-size file, for pinching in on a phone: a menu is read
                line by line, and the page's column is narrower than it. The
                size is a printed page's; the real one takes over on load. */}
            <a
              href={flyer.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Image
                src={flyer.url}
                alt={flyer.altText}
                width={1200}
                height={1697}
                sizes={FLYER_SIZES}
                className="h-auto w-full"
              />
            </a>
            <figcaption className="mt-sm text-caption text-muted-foreground">
              Tap the menu to open it full size.
            </figcaption>
          </figure>
        ) : null}
      </div>
    </section>
  )
}
