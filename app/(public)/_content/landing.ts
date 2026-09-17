import { FerrisWheel, ToyBrick, Waves, type LucideIcon } from 'lucide-react'

/**
 * Landing-page content. Copy here is restricted to [C]-confirmed facts from
 * prd.md — no occupancy ("sleeps N"), bed-configuration, or age-band claims,
 * all of which carry open [O] items. Nothing here quotes a figure: every rate,
 * price and deposit on the page is read from Property settings at render
 * (`lib/domain/landing-figures.ts`), so the front page and the booking pages
 * cannot disagree.
 */

export interface Facility {
  /**
   * The `facility.slug` a photograph hangs off (capability F7). Derived once
   * and never moved by a rename, so the card keeps its photograph when the
   * facility is renamed in Property settings.
   */
  slug: string
  name: string
  description: string
  icon: LucideIcon
  imageLabel: string
}

/**
 * The words for a unit type. The name and the rate are **not** here: they come
 * from Property settings, so the front page cannot advertise a figure the
 * booking page disagrees with (`lib/domain/landing-figures.ts`, 17 September
 * 2026). A type with no entry still gets a card — name, photograph and rate —
 * so staff adding one in the portal never produces a broken page.
 */
export interface UnitTypeCopy {
  description: string
  imageLabel: string
}

export interface BookingStep {
  title: string
  description: string
}

/** The three facilities confirmed as included in the day pass (prd.md §7.2). */
export const facilities: Facility[] = [
  {
    slug: 'swimming-pool',
    name: 'Swimming pool',
    description: 'The centrepiece. Open all day on a single pass — swim as long as you like.',
    icon: Waves,
    imageLabel: 'Pool photo',
  },
  {
    slug: 'water-park',
    name: 'Water park',
    description: 'Slides and splash play for the kids, included in every day pass.',
    icon: FerrisWheel,
    imageLabel: 'Water park photo',
  },
  {
    slug: 'indoor-childrens-playground',
    name: 'Indoor children’s playground',
    description: 'Air-conditioned play space — somewhere to dry off without winding down.',
    icon: ToyBrick,
    imageLabel: 'Playground photo',
  },
]

/** A line and a photograph label per unit type, keyed by its slug. */
export const unitTypeCopy: Readonly<Record<string, UnitTypeCopy>> = {
  'two-bedroom': {
    description: 'The compact option for a night or a weekend.',
    imageLabel: '2-bedroom unit photo',
  },
  'three-bedroom': {
    description: 'Room for the whole family without anyone on the sofa.',
    imageLabel: '3-bedroom unit photo',
  },
  'four-bedroom': {
    description: 'The big apartment — space to spread out properly.',
    imageLabel: '4-bedroom unit photo',
  },
  'semi-detached': {
    description: 'Four rooms and the most space on the property.',
    imageLabel: 'Semi-detached house photo',
  },
}

/**
 * Written for the product as delivered, not for the current build — by the
 * time this page is public, booking is live. Each step maps to a capability in
 * scope-of-capabilities.md (A1/A2, A5/A6, A8), so nothing here over-promises.
 */
export const bookingSteps: BookingStep[] = [
  {
    title: 'Pick your day or dates',
    description: 'See what’s free and the full price — extra guests and all — before you commit.',
  },
  {
    title: 'Pay your way',
    description:
      'Transfer to BIBD or Baiduri with your booking reference, and upload the slip as you book. No card needed.',
  },
  {
    title: 'You’re confirmed',
    description:
      'Your confirmation arrives by email, with a link back to your booking. Quote your reference on arrival.',
  },
]

/**
 * Contact details, re-exported so every existing consumer is unchanged.
 *
 * They moved to `lib/domain/contact.ts` with capability A8: the confirmation
 * email's footer carries the three numbers, and `lib/domain` may not import
 * from `app/`.
 */
export { contact } from '@/lib/domain/contact'

/**
 * Display strings with no figure in them. Everything that quotes a number now
 * comes from Property settings — see `lib/domain/landing-figures.ts`.
 */
export const pricingCopy = {
  paymentMethods: 'Pay by bank transfer (BIBD / Baiduri) or cash.',
  /**
   * Capability A9, offered where somebody reading how booking works would
   * think of it. The prompt is a question rather than a label because the
   * people who need it do not know the page exists — they know they booked
   * and cannot find the link.
   */
  alreadyBooked: 'Already booked?',
  alreadyBookedLink: 'Find your booking.',
}
