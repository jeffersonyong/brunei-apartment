import { formatCents } from './money'
import type { PropertySettings } from './settings'

/**
 * The questions a customer asks before they book, as staff write them
 * (capabilities A10 and F9).
 *
 * The FAQ was copy in code until 14 September 2026, when Jeff asked for staff
 * to manage it: the questions change as the business does, and each change
 * would otherwise be a developer deploy — the argument capability F7 already
 * won for the photographs. What it must not lose is the rule the page was
 * built on: **no figure is typed into an answer.** Every rate, time, facility
 * and bank account has been a settings row since capability F3, and an answer
 * that quotes last month's deposit beside a booking form quoting this month's
 * is the drift F3 exists to prevent.
 *
 * So an answer is plain text that may ask for a **live figure** by name —
 * `{security deposit}` — and the figure is filled in from settings when the
 * page renders. A figure nothing can fill in is refused when the answer is
 * saved (`checkFaqDraft`), so the public site can never show a raw `{…}`, and
 * an amount typed in by hand is pointed out (`typedMoneyFigures`) rather than
 * refused, because "BND 100" in a sentence is sometimes exactly what was meant.
 *
 * **A question the business cannot answer is left out** (Jeff, 14 September
 * 2026). The page used to ask eight such questions with a "to confirm" marker
 * beside each; with staff able to add an answer the day it is agreed, a marker
 * on a public page is a gap somebody can close from the portal instead.
 */

/**
 * The topics, fixed and in the order the FAQs page reads.
 *
 * Fixed rather than staff-managed (Jeff, 14 September 2026): they rarely
 * change, and a screen for renaming five headings is configuration nobody
 * would use. The ids mirror the `faq.topic` check in the migration.
 */
export const FAQ_TOPICS = [
  { id: 'day-passes', title: 'Day passes' },
  { id: 'staying', title: 'Staying with us' },
  { id: 'paying', title: 'Paying' },
  { id: 'changing-and-arriving', title: 'Changing, cancelling and arriving' },
  { id: 'anything-else', title: 'Anything else' },
] as const

export type FaqTopic = (typeof FAQ_TOPICS)[number]
export type FaqTopicId = FaqTopic['id']

const TOPIC_IDS: ReadonlySet<string> = new Set(FAQ_TOPICS.map((topic) => topic.id))

export function isFaqTopicId(value: string): value is FaqTopicId {
  return TOPIC_IDS.has(value)
}

/**
 * How many FAQs the landing page shows. Staff choose which; the database
 * refuses a seventh (`too_many_featured`), so the choice is always one the
 * page can honour.
 */
export const MAX_FEATURED_FAQS = 6

/** Mirrors the `faq.question` check. A question is a line, not a paragraph. */
export const MAX_QUESTION_LENGTH = 200

/** Mirrors the `faq.answer` check. Long enough for any answer worth reading. */
export const MAX_ANSWER_LENGTH = 2000

/** Mirrors the `faq.slug` check. */
const MAX_SLUG_LENGTH = 80

export interface Faq {
  id: string
  /**
   * The answer's address on the FAQs page — `/faq#how-do-we-pay`. Staff send
   * people to a single answer over WhatsApp, so it is derived from the
   * question once, when the FAQ is added, and a reworded question keeps it.
   */
  slug: string
  topic: FaqTopicId
  question: string
  /** As staff wrote it: one paragraph per line, figures still in braces. */
  answer: string
  /** Shown on the landing page as well as the FAQs page. */
  featured: boolean
  /** The order within its topic. Relative, so gaps mean nothing. */
  sortOrder: number
  updatedAt: string
  /** Null for the FAQs a property is seeded with, which nobody wrote. */
  updatedBy: string | null
}

/* ── The live figures ─────────────────────────────────────────────────────── */

/**
 * The live figures an answer may quote.
 *
 * Formatted strings rather than raw values, so an answer is a sentence and
 * never arithmetic — and so a cents integer cannot reach the page by being
 * interpolated somewhere nobody looked. Plain data, so a server page can hand
 * it to the portal's editor for its preview.
 */
export interface FaqFacts {
  /** `HH:MM`, as the confirmation email states them. */
  checkInTime: string
  checkOutTime: string
  securityDeposit: string
  extraPersonPerNight: string
  exemptAgeMax: number
  sofaBedFee: string
  lateCheckOutPerHour: string
  advanceDays: number
  includedFacilities: readonly string[]
  excludedFacilities: readonly string[]
  dayPassBands: readonly { label: string; price: string }[]
  dayPassBundles: readonly { label: string; price: string }[]
  bankAccounts: readonly { bankName: string; accountNumber: string }[]
  /** Sellable types only — a type with no units is not on sale. */
  unitTypes: readonly { name: string; fromRate: string; maxPax: number; carParks: number }[]
}

/**
 * The live figures, projected from what capability F3 edits.
 *
 * Pure — settings in, formatted strings out. `sellableUnitTypeSlugs` is what
 * keeps an answer from quoting a rate for a unit type nobody can book, which is
 * the same filter `/stay` applies to its own list.
 */
export function faqFactsFrom(
  settings: PropertySettings,
  sellableUnitTypeSlugs: ReadonlySet<string>,
): FaqFacts {
  const { policy } = settings

  return {
    checkInTime: policy.checkInTime,
    checkOutTime: policy.checkOutTime,
    securityDeposit: `BND ${formatCents(policy.securityDepositCents)}`,
    extraPersonPerNight: `BND ${formatCents(policy.extraPersonPerNightCents)}`,
    exemptAgeMax: policy.paxExemptAgeMax,
    sofaBedFee: `BND ${formatCents(policy.sofaBedFeeCents)}`,
    lateCheckOutPerHour: `BND ${formatCents(policy.lateCheckOutPerHourCents)}`,
    advanceDays: policy.maxAdvanceBookingDays,
    includedFacilities: settings.facilities
      .filter((facility) => facility.includedInDayPass)
      .map((facility) => facility.name),
    excludedFacilities: settings.facilities
      .filter((facility) => !facility.includedInDayPass)
      .map((facility) => facility.name),
    dayPassBands: settings.bands.map((band) => ({
      label: band.label,
      price: `BND ${formatCents(band.priceCents)}`,
    })),
    dayPassBundles: settings.bundles.map((bundle) => ({
      label: bundle.label,
      price: `BND ${formatCents(bundle.priceCents)}`,
    })),
    bankAccounts: settings.bankAccounts.map((account) => ({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
    })),
    unitTypes: settings.unitTypes
      .filter((type) => sellableUnitTypeSlugs.has(type.slug))
      .map((type) => ({
        name: type.name,
        fromRate: `BND ${formatCents(type.baseRateCents)}`,
        maxPax: type.maxPax,
        carParks: type.carParks,
      })),
  }
}

export interface FaqFigure {
  /** What staff write between the braces. Lower case, words and hyphens. */
  key: string
  /** What the "Insert live figure" menu calls it. */
  label: string
  render: (facts: FaqFacts) => string
}

/**
 * A list figure, or what to say when the list is empty.
 *
 * Every figure renders *something*: a facility list emptied in Property
 * settings must not leave "A day pass covers ." on a public page.
 */
function listed(items: readonly string[], empty: string, separator = ' · '): string {
  return items.length > 0 ? items.join(separator) : empty
}

/**
 * Every figure an answer can ask for.
 *
 * What the old hand-written answers quoted, one entry each, so any of them can
 * be written again by staff. A new figure is a line here — the answers that use
 * it need no change anywhere else.
 */
export const FAQ_FIGURES: readonly FaqFigure[] = [
  { key: 'check-in time', label: 'Check-in time', render: (facts) => facts.checkInTime },
  { key: 'check-out time', label: 'Check-out time', render: (facts) => facts.checkOutTime },
  {
    key: 'security deposit',
    label: 'Security deposit',
    render: (facts) => facts.securityDeposit,
  },
  {
    key: 'extra guest charge',
    label: 'Extra guest charge, per person per night',
    render: (facts) => facts.extraPersonPerNight,
  },
  {
    key: 'free child age',
    label: 'Age up to which a child is not counted',
    render: (facts) => String(facts.exemptAgeMax),
  },
  { key: 'sofa bed charge', label: 'Sofa bed charge', render: (facts) => facts.sofaBedFee },
  {
    key: 'late check-out charge',
    label: 'Late check-out charge, per hour',
    render: (facts) => facts.lateCheckOutPerHour,
  },
  {
    key: 'booking window',
    label: 'How far ahead guests can book',
    render: (facts) => `${facts.advanceDays} days`,
  },
  {
    key: 'day-pass facilities',
    label: 'Facilities a day pass covers',
    render: (facts) => listed(facts.includedFacilities, 'the facilities shown when you book'),
  },
  {
    key: 'facilities not in the day pass',
    label: 'Facilities a day pass does not cover',
    render: (facts) => listed(facts.excludedFacilities, 'nothing'),
  },
  {
    key: 'day-pass prices',
    label: 'Day-pass prices',
    render: (facts) =>
      listed(
        facts.dayPassBands.map((band) => `${band.label} — ${band.price}`),
        'shown when you book',
      ),
  },
  {
    key: 'family bundles',
    label: 'Family bundles',
    render: (facts) =>
      listed(
        facts.dayPassBundles.map((bundle) => `${bundle.label} — ${bundle.price}`),
        'none at the moment',
      ),
  },
  {
    key: 'bank accounts',
    label: 'Bank accounts',
    render: (facts) =>
      listed(
        facts.bankAccounts.map((account) => `${account.bankName} ${account.accountNumber}`),
        'the account shown on your booking page',
        ' or ',
      ),
  },
  {
    key: 'nightly rates',
    label: 'Nightly rates, per apartment type',
    render: (facts) =>
      listed(
        facts.unitTypes.map((type) => `${type.name} — from ${type.fromRate} a night`),
        'shown when you pick your dates',
      ),
  },
  {
    key: 'guest limits',
    label: 'Guests per apartment type',
    render: (facts) =>
      listed(
        facts.unitTypes.map((type) => `${type.name} — up to ${type.maxPax}`),
        'shown when you book',
      ),
  },
  {
    key: 'parking spaces',
    label: 'Parking spaces per apartment type',
    render: (facts) =>
      listed(
        facts.unitTypes.map((type) => `${type.name} — ${type.carParks} spaces`),
        'shown when you book',
      ),
  },
]

const FIGURES_BY_KEY: ReadonlyMap<string, FaqFigure> = new Map(
  FAQ_FIGURES.map((figure) => [figure.key, figure]),
)

/** `{anything but braces}`. Empty braces are not a figure, just two characters. */
const FIGURE_PATTERN = /\{([^{}]+)\}/g

/** How a figure is looked up: however it was capitalised or spaced. */
function figureKey(written: string): string {
  return written.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** The text of `{key}` as staff should write it. */
export function figureToken(figure: FaqFigure): string {
  return `{${figure.key}}`
}

/**
 * An answer as the site shows it: one paragraph per non-blank line, every
 * figure filled in.
 *
 * A figure it does not know is left as it was written. `checkFaqDraft` makes
 * that unreachable for anything saved through the portal; this is only what a
 * figure removed from `FAQ_FIGURES` after an answer used it would look like,
 * and a visible `{…}` is the honest version of that mistake.
 */
export function renderFaqAnswer(answer: string, facts: FaqFacts): string[] {
  return answer
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(FIGURE_PATTERN, (token, written: string) => {
          const figure = FIGURES_BY_KEY.get(figureKey(written))

          return figure ? figure.render(facts) : token
        })
        .trim(),
    )
    .filter((line) => line !== '')
}

/** The figures an answer asks for that nothing can fill in, once each. */
export function unknownFigures(answer: string): string[] {
  const unknown = new Set<string>()

  for (const match of answer.matchAll(FIGURE_PATTERN)) {
    const key = figureKey(match[1] ?? '')

    if (!FIGURES_BY_KEY.has(key)) {
      unknown.add(key)
    }
  }

  return [...unknown]
}

/**
 * Amounts typed into an answer rather than inserted as figures.
 *
 * Not a refusal: the portal points them out, because a typed "BND 100" is the
 * one that goes stale when the deposit changes.
 */
export function typedMoneyFigures(answer: string): string[] {
  return [...answer.replace(FIGURE_PATTERN, '').matchAll(/\bBND\s*\d[\d,]*(?:\.\d+)?/gi)].map(
    (match) => match[0],
  )
}

/* ── Checking what staff wrote ────────────────────────────────────────────── */

export interface FaqDraft {
  topic: FaqTopicId
  question: string
  answer: string
}

export type FaqDraftField = keyof FaqDraft

export type FaqDraftCheck =
  { ok: true; value: FaqDraft } | { ok: false; errors: Partial<Record<FaqDraftField, string>> }

/** One line, single-spaced — what a question is on the page. */
function tidyQuestion(question: string): string {
  return question.replace(/\s+/g, ' ').trim()
}

/** Lines trimmed, at most one blank line between paragraphs, no ragged ends. */
function tidyAnswer(answer: string): string {
  return answer
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * A draft, checked and tidied, or a sentence for each field it fails on.
 *
 * The database repeats the length and topic checks; the figure check is only
 * here, because only this module knows the figures.
 */
export function checkFaqDraft(input: {
  topic: string
  question: string
  answer: string
}): FaqDraftCheck {
  const errors: Partial<Record<FaqDraftField, string>> = {}
  const question = tidyQuestion(input.question)
  const answer = tidyAnswer(input.answer)

  if (!isFaqTopicId(input.topic)) {
    errors.topic = 'Choose a topic.'
  }

  if (question === '') {
    errors.question = 'Write the question.'
  } else if (question.length > MAX_QUESTION_LENGTH) {
    errors.question = `Keep the question under ${MAX_QUESTION_LENGTH} characters.`
  }

  const unknown = unknownFigures(answer)

  if (answer === '') {
    errors.answer = 'Write the answer.'
  } else if (answer.length > MAX_ANSWER_LENGTH) {
    errors.answer = `Keep the answer under ${MAX_ANSWER_LENGTH} characters.`
  } else if (unknown.length > 0) {
    const named = unknown.map((key) => `{${key}}`).join(', ')

    errors.answer = `The website cannot fill in ${named}. Choose it from "Insert live figure", or write it out in words.`
  }

  if (Object.keys(errors).length > 0 || !isFaqTopicId(input.topic)) {
    return { ok: false, errors }
  }

  return { ok: true, value: { topic: input.topic, question, answer } }
}

/**
 * The address a new FAQ gets on the FAQs page, from its question.
 *
 * The database makes it unique by adding `-2`, `-3`; this only makes it
 * readable. Cut at a word boundary, so a long question does not end mid-word.
 */
export function slugFromQuestion(question: string): string {
  const slug = question
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length <= MAX_SLUG_LENGTH) {
    return slug === '' ? 'question' : slug
  }

  // One character past the limit, so a word ending exactly at it is kept whole.
  const cut = slug.slice(0, MAX_SLUG_LENGTH + 1)
  const lastBreak = cut.lastIndexOf('-')

  // A question with no break inside the limit is one long word: cut at the limit.
  return lastBreak > 0 ? cut.slice(0, lastBreak).replace(/-+$/, '') : slug.slice(0, MAX_SLUG_LENGTH)
}

/* ── Reading them back ────────────────────────────────────────────────────── */

export interface FaqTopicGroup {
  topic: FaqTopic
  faqs: readonly Faq[]
}

function byOrder(a: Faq, b: Faq): number {
  return a.sortOrder - b.sortOrder || a.question.localeCompare(b.question)
}

/** The FAQs under their topics, in page order, with empty topics left out. */
export function faqsByTopic(faqs: readonly Faq[]): FaqTopicGroup[] {
  return FAQ_TOPICS.map((topic) => ({
    topic,
    faqs: [...faqs.filter((faq) => faq.topic === topic.id)].sort(byOrder),
  })).filter((group) => group.faqs.length > 0)
}

/**
 * What the landing page shows: the featured FAQs, in the order the FAQs page
 * reads them, at most `MAX_FEATURED_FAQS`. The cap is enforced on write too;
 * slicing here means a database that somehow holds more still renders a page
 * of the size it was designed for.
 */
export function frontPageFaqs(faqs: readonly Faq[]): Faq[] {
  return faqsByTopic(faqs.filter((faq) => faq.featured))
    .flatMap((group) => group.faqs)
    .slice(0, MAX_FEATURED_FAQS)
}

/* ── What a refused write says ────────────────────────────────────────────── */

const WRITE_MESSAGES: Readonly<Record<string, string>> = {
  not_found: 'That FAQ is no longer there. Somebody may have removed it.',
  stale:
    'Somebody changed this FAQ while you had it open. Close this, and open it again to see their version.',
  too_many_featured: `The front page already shows ${MAX_FEATURED_FAQS} FAQs. Take one off it first.`,
  topic_invalid: 'Choose a topic.',
  question_invalid: `Write the question, in under ${MAX_QUESTION_LENGTH} characters.`,
  answer_invalid: `Write the answer, in under ${MAX_ANSWER_LENGTH} characters.`,
  slug_invalid: 'That question could not be given an address on the website.',
  direction_invalid: 'That FAQ could not be moved.',
}

/** A refusal code from the database, in a sentence for the screen. */
export function faqWriteMessage(code: string): string {
  return WRITE_MESSAGES[code] ?? 'That FAQ could not be saved. Try again.'
}
