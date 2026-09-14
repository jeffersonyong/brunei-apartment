import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { FaqDisclosures, type FaqItem } from './faq-disclosures'

/**
 * The landing page's FAQs: the few staff chose, and the way to the rest
 * (capability F9).
 *
 * The heading and the way through sit in a column beside the questions from
 * `lg` up, and above them on a phone — the landing grid's own two-column rhythm
 * rather than a centred block. "See all FAQs" is `tertiary`: this band sells
 * nothing, and the page's lagoon fill belongs to booking.
 *
 * Rendered only when staff have put something on the front page; a section
 * heading over nothing would be a gap in the page.
 */
export function FaqSection({ items }: { items: readonly FaqItem[] }) {
  return (
    <section
      aria-labelledby="faq-section-heading"
      className="border-t border-divider bg-card px-xl py-3xl"
    >
      {/* Three cells, placed twice. On a phone they stack as heading, questions,
          then the way to the rest — "see more" belongs after what it is more
          of. From `lg` the heading and the button share the left column and
          the questions take the right, spanning both rows. */}
      <div className="mx-auto grid w-full max-w-[1120px] gap-xl lg:grid-cols-[1fr_2fr] lg:grid-rows-[auto_1fr] lg:gap-x-2xl">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="micro-label text-accent-foreground">Before you book</p>
          <h2
            id="faq-section-heading"
            className="mt-md font-display text-display-md text-foreground sm:text-display-lg"
          >
            FAQs
          </h2>
          <p className="mt-md max-w-[40ch] text-body-lg text-copy">
            The questions guests ask most. Everything else is on the FAQs page.
          </p>
        </div>

        <FaqDisclosures
          items={items}
          anchored={false}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
        />

        <div className="lg:col-start-1 lg:row-start-2">
          <Button asChild variant="tertiary">
            <Link href="/faq">See all FAQs</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
