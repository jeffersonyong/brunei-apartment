import type { Metadata } from 'next'

import { readFaqFacts } from '@/lib/db/faq-facts'
import { listFaqs } from '@/lib/db/faqs'
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
import { Hero } from './_components/hero'
import { HowBookingWorks } from './_components/how-booking-works'
import { SocialStrip } from './_components/social-strip'
import { LongTermSection } from './_components/long-term-section'
import { StaysSection } from './_components/stays-section'

export const metadata: Metadata = {
  title: 'Palm Villa — day passes and stays in Bandar Seri Begawan',
  description:
    'Facility day passes for the swimming pool, water park and indoor children’s playground, plus apartment stays from BND 180 a night at Palm Villa, Bandar Seri Begawan.',
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
  const [images, faqs] = await Promise.all([readLandingImages(), readLandingFaqs()])

  return (
    <>
      <Hero image={images.hero} />
      <DayPassSection images={images.facilities} />
      <StaysSection images={images.unitTypes} />
      <LongTermSection />
      <HowBookingWorks />
      <SocialStrip images={images.feed} />
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
async function readLandingFaqs(): Promise<FaqItem[]> {
  try {
    const [faqs, facts] = await Promise.all([listFaqs(), readFaqFacts()])

    return frontPageFaqs(faqs).map((faq) => faqItemFrom(faq, facts))
  } catch (error) {
    console.error('The landing page could not read its FAQs; leaving the section out.', error)

    return []
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
