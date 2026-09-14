import { faqFactsFrom, type FaqFacts } from '@/lib/domain/faq'

import { getUnits } from './inventory'
import { readPropertySettings } from './settings'

/**
 * The live figures a FAQ answer can quote, read now (capability F9).
 *
 * One reader for the three places an answer is rendered — the FAQs page, the
 * landing page and the portal's preview — so all three fill `{nightly rates}`
 * in from the same list. A type the building has no serviceable units of cannot
 * be booked, so no answer quotes a rate for it: the filter `/stay` applies to
 * the types it offers.
 */
export async function readFaqFacts(): Promise<FaqFacts> {
  const [settings, units] = await Promise.all([readPropertySettings(), getUnits()])

  const sellable = new Set(
    units.filter((unit) => unit.outOfServiceSince === null).map((unit) => unit.unitTypeId),
  )

  return faqFactsFrom(settings, sellable)
}
