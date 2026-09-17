import { formatCents } from './money'
import type { PropertySettings } from './settings'

/**
 * The figures the front page quotes, taken from what capability F3 edits
 * (17 September 2026).
 *
 * The rates on the landing page used to be typed into the content module. They
 * were right on the day they were written and drifted the moment somebody
 * changed a rate in Property settings — the front page advertising one figure
 * while `/stay` quoted another, which is the version a guest would rightly hold
 * us to. Everything with a number in it now comes from here.
 *
 * Pure: settings in, display strings out. The same sellable-type filter
 * `/stay` and the FAQs apply is applied here too, so the page cannot advertise
 * a unit type the building has no units of — the 2-bedroom, until N1 is
 * answered and somebody types the units in.
 */
export interface LandingUnitType {
  /** What the card's photograph hangs off (capability F7). */
  slug: string
  name: string
  /** `BND 200`, for the card foot. */
  fromRate: string
}

export interface LandingFigures {
  unitTypes: readonly LandingUnitType[]
  /** `BND 200` — the cheapest sellable type, or null when nothing is sellable. */
  fromNightlyRate: string | null
  /** `BND 5` — the cheapest a person can enter for, for the headline. */
  dayPassFrom: string | null
  /** `From BND 5 per person · family bundles from BND 20`, or null. */
  dayPassLine: string | null
  /** `BND 100 refundable security deposit · bookings open up to 60 days ahead.` */
  stayFinePrint: string
  /** `The BBQ area is not included in the day pass.`, or null when none is. */
  dayPassFinePrint: string | null
}

/** `BND 200`, not `BND 200.00`: marketing copy, where the cents are noise. */
function marketingAmount(cents: number): string {
  const formatted = formatCents(cents)

  return `BND ${formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted}`
}

/** The cheapest of a list, or null when it is empty. */
function lowest(amounts: readonly number[]): number | null {
  return amounts.length > 0 ? Math.min(...amounts) : null
}

export function landingFiguresFrom(
  settings: PropertySettings,
  sellableUnitTypeSlugs: ReadonlySet<string>,
): LandingFigures {
  const unitTypes = settings.unitTypes
    .filter((unitType) => sellableUnitTypeSlugs.has(unitType.slug))
    .map((unitType) => ({
      slug: unitType.slug,
      name: unitType.name,
      fromRate: marketingAmount(unitType.baseRateCents),
    }))

  const cheapestNight = lowest(
    settings.unitTypes
      .filter((unitType) => sellableUnitTypeSlugs.has(unitType.slug))
      .map((unitType) => unitType.baseRateCents),
  )

  // A band priced at nothing is the under-age exemption, not the cheapest way
  // in: "from BND 0" would read as a free day out.
  const cheapestBand = lowest(
    settings.bands.map((band) => band.priceCents).filter((price) => price > 0),
  )
  const cheapestBundle = lowest(settings.bundles.map((bundle) => bundle.priceCents))

  const excluded = settings.facilities
    .filter((facility) => !facility.includedInDayPass)
    .map((facility) => facility.name)

  return {
    unitTypes,
    fromNightlyRate: cheapestNight === null ? null : marketingAmount(cheapestNight),
    dayPassFrom: cheapestBand === null ? null : marketingAmount(cheapestBand),
    dayPassLine: dayPassLineFrom(cheapestBand, cheapestBundle),
    stayFinePrint:
      `${marketingAmount(settings.policy.securityDepositCents)} refundable security deposit · ` +
      `bookings open up to ${settings.policy.maxAdvanceBookingDays} days ahead.`,
    // Listed rather than made into a sentence: the names are whatever staff
    // typed, so "The Sauna and the BBQ area is not included" is one rename away
    // in either direction.
    dayPassFinePrint:
      excluded.length > 0 ? `Not included in the day pass: ${excluded.join(', ')}.` : null,
  }
}

/**
 * The price line, with the bundle clause only when bundles exist. Staff can
 * delete every bundle in Property settings, and "family bundles from" with
 * nothing after it is worse than no clause at all.
 */
function dayPassLineFrom(
  cheapestBand: number | null,
  cheapestBundle: number | null,
): string | null {
  if (cheapestBand === null) {
    return cheapestBundle === null ? null : `Family bundles from ${marketingAmount(cheapestBundle)}`
  }

  const perPerson = `From ${marketingAmount(cheapestBand)} per person`

  return cheapestBundle === null
    ? perPerson
    : `${perPerson} · family bundles from ${marketingAmount(cheapestBundle)}`
}
