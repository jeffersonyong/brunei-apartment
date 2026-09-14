import { ChevronDown } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { renderFaqAnswer, type Faq, type FaqFacts } from '@/lib/domain/faq'

/** A question as the public site shows it: its address, and its answer filled in. */
export interface FaqItem {
  id: string
  question: string
  paragraphs: readonly string[]
}

export function faqItemFrom(faq: Faq, facts: FaqFacts): FaqItem {
  return { id: faq.slug, question: faq.question, paragraphs: renderFaqAnswer(faq.answer, facts) }
}

/**
 * Questions that open to show their answers (Jeff, 14 September 2026).
 *
 * The FAQ used to print every answer, on the grounds that a guest uses Ctrl-F
 * and a search engine indexes the answer. The native `<details>` keeps both:
 * browsers search inside a closed one and open it on a match, the answer is in
 * the markup a crawler reads, and it opens and closes with no script at all.
 * What it adds is a page a guest can scan by question, which a page of twenty
 * printed answers is not.
 *
 * One card, the answers ruled apart by hairlines — the construction the page
 * had. The question is ink over the answer's copy and the chevron is mute,
 * lifting to ink on hover, so the row reads as something to open without
 * becoming a button. Several can be open at once: comparing two answers is a
 * reasonable thing to want.
 *
 * `anchored` gives each question its address as an id, so `/faq#how-do-i-pay`
 * lands on it (and `OpenFaqFromHash` opens it). The landing page's copies are
 * not anchored, because the FAQs page is where an answer lives.
 */
export function FaqDisclosures({
  items,
  anchored = true,
  className,
}: {
  items: readonly FaqItem[]
  anchored?: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="divide-y divide-divider">
        {items.map((item) => (
          <details
            key={item.id}
            id={anchored ? item.id : undefined}
            className="group scroll-mt-3xl"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-lg rounded-md px-xs py-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
              <h3 className="text-body-md-strong text-foreground">{item.question}</h3>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-hover:text-foreground motion-reduce:transition-none"
              />
            </summary>
            <div className="px-xs pb-lg">
              {item.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-xs max-w-[64ch] text-body-md text-copy first:mt-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Card>
  )
}
