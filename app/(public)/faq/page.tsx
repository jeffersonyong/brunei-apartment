import Link from 'next/link'
import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { readFaqFacts } from '@/lib/db/faq-facts'
import { listFaqs } from '@/lib/db/faqs'
import { contact } from '@/lib/domain/contact'
import { faqsByTopic, type FaqFacts, type FaqTopicGroup } from '@/lib/domain/faq'

import { ClosingBand, closingBandSecondaryClassName } from '../_components/closing-band'
import { FaqDisclosures, faqItemFrom } from '../_components/faq-disclosures'
import { OpenFaqFromHash } from '../_components/open-faq-from-hash'

export const metadata: Metadata = {
  title: 'FAQs — Palm Villa',
  description:
    'Day passes, stays, paying, changing a booking and arriving at Palm Villa — the questions guests ask most, answered.',
}

/**
 * The FAQs, every one of them (capabilities A10 and F9).
 *
 * **Staff write the questions; settings write the figures.** The questions and
 * answers are rows staff manage from Admin → Website FAQs, and an answer's
 * `{live figures}` are filled in from Property settings.
 *
 * **Cached, and revalidated by the saves** (17 September 2026) — the treatment
 * `/` already has (§8.3), off these same two reads. This was `force-dynamic`
 * for the reason `/stay` has it: a rate somebody changed a second ago is the
 * rate the next visitor is quoted. But the two pages are not alike. `/stay`
 * must be dynamic because availability changes with every booking made
 * anywhere, and no action can enumerate the paths that go stale. Everything
 * here changes only when a staff member saves a form, and every one of those
 * saves revalidates this path: the FAQ actions, the pricing, day-pass and
 * bank-account saves, and the unit registry, which decides which types have
 * their rates quoted at all. The hourly floor is the backstop, not the
 * mechanism.
 *
 * Under the five fixed topics, in the order staff put them, each question
 * closed until it is opened (`FaqDisclosures`). A topic with nothing in it is
 * left out rather than shown empty.
 */
export const revalidate = 3600

/**
 * The questions and the figures they quote, or neither.
 *
 * The safety net `/` has carried since it was cached, added here on 18
 * September 2026 for the reason the night before made concrete. **This page is
 * prerendered, so the _build_ performs this read** — and a build that runs
 * while the code and the database disagree used to throw here and abort the
 * whole deployment, because one page that cannot be built takes every page
 * with it. That disagreement is not exotic: it is the few minutes between a
 * migration reaching production and the deploy that needs it, which is every
 * migration that touches what this page reads. It happened on the extras
 * migration (capability F13) and cost a deploy.
 *
 * Both reads are caught together because an answer is a question plus the
 * figures it names: with no figures there is nothing to render a question
 * into, so half an answer is not a state worth having.
 */
async function readFaqPage(): Promise<{
  groups: readonly FaqTopicGroup[]
  facts: FaqFacts | null
}> {
  try {
    const [faqs, facts] = await Promise.all([listFaqs(), readFaqFacts()])

    return { groups: faqsByTopic(faqs), facts }
  } catch (error) {
    console.error('The FAQs page could not read its questions and figures; showing none.', error)

    return { groups: [], facts: null }
  }
}

export default async function FaqPage() {
  const { groups, facts } = await readFaqPage()

  return (
    <>
      <section aria-labelledby="faq-heading" className="bg-card px-xl py-3xl">
        <div className="mx-auto w-full max-w-[720px]">
          <p className="micro-label text-accent-foreground">Before you book</p>
          <h1
            id="faq-heading"
            className="mt-md font-display text-display-md text-foreground sm:text-display-lg"
          >
            FAQs
          </h1>
          <p className="mt-md max-w-[56ch] text-body-lg text-copy">
            What guests ask most often. If yours is not here, call or message us — the numbers are
            at the foot of every page.
          </p>

          {/* Only when the read failed. A property whose staff have simply not
              written any questions yet gets the paragraph above, which already
              says what to do about it, and the band below. */}
          {facts === null ? (
            <p className="mt-2xl border-t border-divider pt-xl text-body-lg text-copy">
              We could not load the questions just now. Message us and a person will answer.
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.topic.id}
                aria-labelledby={`topic-${group.topic.id}`}
                className="mt-2xl border-t border-divider pt-xl"
              >
                <h2 id={`topic-${group.topic.id}`} className="text-display-xs text-foreground">
                  {group.topic.title}
                </h2>

                <FaqDisclosures
                  className="mt-lg"
                  items={group.faqs.map((faq) => faqItemFrom(faq, facts))}
                />
              </section>
            ))
          )}
        </div>
      </section>

      <OpenFaqFromHash />

      {/* The page's one dark moment, and it earns it by being the end of a
          long read: somebody who got this far either wants to book or wants a
          person. */}
      <ClosingBand
        id="faq-cta-heading"
        title="Still not sure?"
        width="reading"
        actions={
          <>
            <Button asChild variant="inverted" className="w-full sm:w-auto">
              <a href={contact.whatsappUrl} target="_blank" rel="noreferrer">
                Message us on WhatsApp
              </a>
            </Button>
            <Button asChild variant="ghost" className={closingBandSecondaryClassName}>
              <Link href="/find-booking">Find your booking</Link>
            </Button>
          </>
        }
      >
        Message us and a person will answer. Or if you already have a booking, open it again.
      </ClosingBand>
    </>
  )
}
