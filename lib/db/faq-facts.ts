import { faqFactsFrom, type FaqFacts } from '@/lib/domain/faq'
import { landingFiguresFrom, type LandingFigures } from '@/lib/domain/landing-figures'

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
  const { settings, sellable } = await readSellableSettings()

  return faqFactsFrom(settings, sellable)
}

/**
 * Everything the landing page quotes, from one pair of reads.
 *
 * The page renders both — the FAQs staff put on it, and the rates its sections
 * quote (17 September 2026) — and they come from the same settings and the same
 * sellable-type filter, so reading them twice would be two round trips for one
 * answer.
 */
export async function readLandingFacts(): Promise<{
  facts: FaqFacts
  figures: LandingFigures
}> {
  const { settings, sellable } = await readSellableSettings()

  return {
    facts: faqFactsFrom(settings, sellable),
    figures: landingFiguresFrom(settings, sellable),
  }
}

/** The settings, and which unit types the building can actually sell. */
async function readSellableSettings() {
  const [settings, units] = await Promise.all([readPropertySettings(), getUnits()])

  return {
    settings,
    sellable: new Set(
      units.filter((unit) => unit.outOfServiceSince === null).map((unit) => unit.unitTypeId),
    ),
  }
}
