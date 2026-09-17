import type { Cents } from './money'

/**
 * The extras a short stay can add (capability F13).
 *
 * prd.md §8.2: an extra is a flat fee per stay, quantity × fee, nights
 * ignored. The sofa bed's BND 28 already worked that way; making the set
 * configurable did not change how one is priced, only how many there can be.
 *
 * Pure. Everything here is shape, tidying and validation — the stock rule that
 * spans bookings cannot live in a pure module, because it is a question about
 * every other booking in the building. It is enforced by the database trigger
 * `booking_line_extra_within_stock` (20261003000100) and previewed by
 * `remainingOf` below, which is given the count rather than fetching it.
 */

/** Mirrors the `name` check on `booking_extra`. */
export const MAX_EXTRA_NAME_LENGTH = 60

/** Mirrors the `description` check on `booking_extra`. */
export const MAX_EXTRA_DESCRIPTION_LENGTH = 200

/**
 * As far above any real fee as the form should let somebody go by mistyping.
 * Not a business rule — a typo guard, so `2800` entered in cents rather than
 * dollars is refused rather than quoted.
 */
export const MAX_EXTRA_FEE = 100_000 as Cents

/** Same job for the shelf count: nobody owns ten thousand karaoke sets. */
export const MAX_EXTRA_STOCK = 9_999

export interface PropertyExtra {
  id: string
  /**
   * Stable across a rename. The FAQ figure vocabulary addresses the sofa bed
   * through `sofa-bed`, so renaming the row must not empty an answer on the
   * public site.
   */
  slug: string
  name: string
  /** The line under the counter on the booking form. */
  description: string | null
  /** Flat, per stay. */
  fee: Cents
  /**
   * How many the property owns, or `null` for "nobody has counted them, do not
   * constrain" — the meaning `property.sofa_bed_stock` carried, kept because
   * open-questions.md N8 is still open.
   */
  stock: number | null
  /** Whether the booking forms offer it. */
  bookable: boolean
  sortOrder: number
  /** Removed. Kept because live bookings still hold it — see the migration. */
  retiredAt: string | null
  /** The editor's optimistic-concurrency token. */
  updatedAt: string
}

/** What a booking asked for: how many of which extra. */
export interface ExtraSelection {
  extraId: string
  quantity: number
}

/**
 * The address an extra keeps for life, derived from its name exactly once.
 *
 * Deliberately the same shape as `slugFromQuestion` in ./faq.ts, and checked
 * by the same pattern in the database. Returns `''` for a name with nothing
 * sluggable in it, which the writers refuse rather than guess at.
 */
export function slugFromName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** Collapses runs of whitespace, the way the database's `booking_extra_tidy` does. */
export function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** What the portal's editor collects, before it is anything the database sees. */
export interface ExtraDraft {
  name: string
  description: string
  /** BND as typed, e.g. `28` or `28.50`. Parsed here, never by the form. */
  fee: string
  /** Blank means "not counted" — see `PropertyExtra.stock`. */
  stock: string
  bookable: boolean
}

export interface ExtraProblem {
  field: 'name' | 'description' | 'fee' | 'stock'
  message: string
}

export interface CheckedExtra {
  slug: string
  name: string
  description: string | null
  feeCents: number
  stock: number | null
  bookable: boolean
}

export type ExtraCheckResult =
  { ok: true; value: CheckedExtra } | { ok: false; problems: readonly ExtraProblem[] }

/**
 * Parses BND as a member of staff types it — `28`, `28.5`, `28.50`, ` 28 ` —
 * into integer cents. Returns null for anything else, including a third
 * decimal place, which is money that does not exist here.
 */
function centsFromInput(raw: string): number | null {
  const text = raw
    .trim()
    .replace(/^BND\s*/i, '')
    .replace(/,/g, '')

  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null
  }

  const [whole, fraction = ''] = text.split('.')

  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

/**
 * Everything that must be true before an extra reaches the database.
 *
 * Every rule here is also a constraint or a refusal in 20261003000100 — this
 * is the copy that produces a sentence, not the copy that produces the
 * guarantee. The one rule it cannot check is stock against live bookings; the
 * writer refuses that, because only it can see them.
 */
export function checkExtraDraft(draft: ExtraDraft): ExtraCheckResult {
  const problems: ExtraProblem[] = []

  const name = tidy(draft.name)
  const description = tidy(draft.description)

  if (name === '') {
    problems.push({ field: 'name', message: 'Give the extra a name.' })
  } else if (name.length > MAX_EXTRA_NAME_LENGTH) {
    problems.push({
      field: 'name',
      message: `Keep the name to ${MAX_EXTRA_NAME_LENGTH} characters or fewer.`,
    })
  }

  const slug = slugFromName(name)

  // A name of nothing but punctuation passes the length check and leaves no
  // address behind it. Refused here rather than in the writer so the message
  // names the field.
  if (name !== '' && slug === '') {
    problems.push({ field: 'name', message: 'The name needs at least one letter or number.' })
  }

  if (description.length > MAX_EXTRA_DESCRIPTION_LENGTH) {
    problems.push({
      field: 'description',
      message: `Keep the description to ${MAX_EXTRA_DESCRIPTION_LENGTH} characters or fewer.`,
    })
  }

  const feeCents = centsFromInput(draft.fee)

  if (feeCents === null) {
    problems.push({ field: 'fee', message: 'Enter the price in BND, like 28 or 28.50.' })
  } else if (feeCents > MAX_EXTRA_FEE) {
    problems.push({ field: 'fee', message: 'That price looks wrong. Enter it in BND, not cents.' })
  }

  const stockText = draft.stock.trim()
  let stock: number | null = null

  if (stockText !== '') {
    if (!/^\d+$/.test(stockText)) {
      problems.push({ field: 'stock', message: 'Enter a whole number, or leave it blank.' })
    } else if (Number(stockText) > MAX_EXTRA_STOCK) {
      problems.push({ field: 'stock', message: 'That is more than anybody owns.' })
    } else {
      stock = Number(stockText)
    }
  }

  if (problems.length > 0) {
    return { ok: false, problems }
  }

  return {
    ok: true,
    value: {
      slug,
      name,
      description: description === '' ? null : description,
      feeCents: feeCents as number,
      stock,
      bookable: draft.bookable,
    },
  }
}

/**
 * How many of an extra a booking may still take, given how many are already
 * held across the nights it wants.
 *
 * `null` means "no limit" and is the honest answer for an uncounted extra —
 * the form shows no remainder rather than inventing one. The count comes from
 * `extras_in_use`, which is the same function the database's own rule uses, so
 * what the form promises and what the insert allows are one calculation.
 */
export function remainingOf(extra: PropertyExtra, inUse: number): number | null {
  if (extra.stock === null) {
    return null
  }

  return Math.max(extra.stock - inUse, 0)
}

/** The extras a booking form should offer: on sale, and not removed. */
export function bookableExtras(extras: readonly PropertyExtra[]): readonly PropertyExtra[] {
  return extras
    .filter((extra) => extra.bookable && extra.retiredAt === null)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** By id, for the pricing engine and for reading a booking's lines back. */
export function extraById(extras: readonly PropertyExtra[], id: string): PropertyExtra | undefined {
  return extras.find((extra) => extra.id === id)
}

/**
 * The extra a FAQ figure names, or nothing.
 *
 * By slug rather than by name, so `{sofa bed charge}` keeps resolving after
 * staff rename the row. A retired extra still answers: the question "what does
 * a sofa bed cost" has an answer right up until somebody deletes the sentence.
 */
export function extraBySlug(
  extras: readonly PropertyExtra[],
  slug: string,
): PropertyExtra | undefined {
  return extras.find((extra) => extra.slug === slug)
}

/* ── The form encoding ────────────────────────────────────────────────────── */

/**
 * The form field an extra's counter posts under.
 *
 * Here rather than in the component because the server action that reads it
 * back cannot import a `'use client'` module, and a convention written down
 * twice is a convention waiting to drift. The prefix keeps a configured extra
 * from colliding with a field name a form already owns.
 */
export function extraFieldName(extraId: string): string {
  return `extra:${extraId}`
}

/**
 * The selections a submitted form carries.
 *
 * Deliberately not a Zod schema: the field names are not known until the
 * extras are read, so the shape is discovered rather than declared. Anything
 * that is not a non-negative whole number is dropped rather than guessed at —
 * the engine refuses a negative quantity anyway, and a mangled field should
 * not be able to change a price.
 *
 * Takes the lookup rather than a FormData so it is pure and testable; the
 * actions pass `(name) => form.get(name)`.
 */
export function extraSelectionsFrom(
  valueOf: (field: string) => FormDataEntryValue | null,
  extras: readonly PropertyExtra[],
): readonly ExtraSelection[] {
  return extras.flatMap((extra) => {
    const raw = valueOf(extraFieldName(extra.id))

    if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) {
      return []
    }

    const quantity = Number(raw.trim())

    return quantity > 0 ? [{ extraId: extra.id, quantity }] : []
  })
}
