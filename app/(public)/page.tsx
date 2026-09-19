import type { Metadata } from 'next'

import { readLandingFacts } from '@/lib/db/faq-facts'
import { listFaqs } from '@/lib/db/faqs'
import type { LandingFigures } from '@/lib/domain/landing-figures'
import { listCurrentSiteImages } from '@/lib/db/site-images'
import { frontPageFaqs } from '@/lib/domain/faq'
import {
  NO_LANDING_IMAGES,
  landingImagesFrom,
  type LandingImages,
} from '@/lib/domain/landing-images'

import { DayPassSection } from './_components/day-pass-section'
import { faqItemFrom, type FaqItem } from './_components/faq-disclosures'
import { FaqSection } from './_components/faq-section'
import { FinalCta } from './_components/final-cta'
import { GettingHereSection } from './_components/getting-here-section'
import { Hero } from './_components/hero'
import { HowBookingWorks } from './_components/how-booking-works'
import { SocialStrip } from './_components/social-strip'
import { LongTermSection } from './_components/long-term-section'
import { StaysSection } from './_components/stays-section'

/**
 * The description quotes the cheapest rate a guest can actually book, so it is
 * read at render rather than written down (17 September 2026). A failed read
 * describes the property without a figure: a search result with no price is a
 * smaller problem than one with the wrong price.
 */
export async function generateMetadata(): Promise<Metadata> {
  const figures = await readLandingFigures()
  const stays =
    figures?.fromNightlyRate === null || figures === null
      ? 'plus apartment stays'
      : `plus apartment stays from ${figures.fromNightlyRate} a night`

  return {
    title: 'Palm Villa — day passes and stays in Kuala Belait',
    description:
      'Facility day passes for the swimming pool, water park and indoor children’s ' +
      `playground, ${stays} at Palm Villa, Kuala Belait.`,
  }
}

/**
 * Static, and regenerated rather than rendered per visit (capability F7).
 *
 * `/stay`, `/day-pass` and `/faq` are `force-dynamic` because a rate somebody
 * changed a second ago has to be the rate the next visitor is quoted. A
 * photograph is not a price: every portal action that changes one calls
 * `revalidatePath('/')`, so a new photo is live on the next visit anyway, and
 * the most-visited page stays a cached file rather than a database round trip
 * per request. The hour is the backstop for the one change that does not go
 * through those actions — a facility deleted in Property settings, which takes
 * its photograph with it.
 *
 * **The FAQs quote live figures, and are held to the same arrangement**
 * (capability F9). Every FAQ action revalidates `/`, and so do the Property
 * settings saves a figure comes from — rates, day-pass prices, facilities and
 * bank accounts — so a changed deposit is on the front page on the next visit,
 * not an hour later.
 */
export const revalidate = 3600

export default async function PublicHomePage() {
  const [images, { faqs, figures }] = await Promise.all([readLandingImages(), readLandingContent()])

  return (
    <>
      <Hero image={images.hero} fromNightlyRate={figures?.fromNightlyRate ?? null} />
      <DayPassSection images={images.facilities} figures={figures} />
      <StaysSection images={images.unitTypes} figures={figures} />
      <LongTermSection />
      <HowBookingWorks figures={figures} />
      <SocialStrip images={images.feed} />
      <GettingHereSection />
      {faqs.length > 0 ? <FaqSection items={faqs} /> : null}
      <FinalCta />
    </>
  )
}

/**
 * The FAQs staff put on the front page, or none.
 *
 * Read the way the photographs are, for the same reason: the front page never
 * fails because a section could not be read. A failed read logs and leaves the
 * section out, and the FAQs page is still one link away in the footer.
 */
async function readLandingContent(): Promise<{
  faqs: FaqItem[]
  figures: LandingFigures | null
}> {
  try {
    const [faqs, { facts, figures }] = await Promise.all([listFaqs(), readLandingFacts()])

    return { faqs: frontPageFaqs(faqs).map((faq) => faqItemFrom(faq, facts)), figures }
  } catch (error) {
    console.error('The landing page could not read its FAQs and figures; leaving both out.', error)

    return { faqs: [], figures: null }
  }
}

/** The figures alone, for the description `generateMetadata` writes. */
async function readLandingFigures(): Promise<LandingFigures | null> {
  try {
    return (await readLandingFacts()).figures
  } catch (error) {
    console.error('The landing page could not read its figures for the page description.', error)

    return null
  }
}

/**
 * The photographs, or none.
 *
 * The front page never fails because its photographs could not be read — at
 * build time with no database, or during an outage — so a failed read logs and
 * renders every place as its placeholder. Logged rather than swallowed, because
 * a front page quietly showing grey boxes is exactly what nobody would notice.
 */
async function readLandingImages(): Promise<LandingImages> {
  try {
    return landingImagesFrom(await listCurrentSiteImages())
  } catch (error) {
    console.error('The landing page could not read its photographs; showing placeholders.', error)

    return NO_LANDING_IMAGES
  }
}
