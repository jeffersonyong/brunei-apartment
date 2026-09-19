/**
 * What guests are told about food (Jeff, 19 September 2026).
 *
 * There is no restaurant at Palm Villa. An outside provider leaves a menu at
 * the poolside tables and delivers, and guests are told so on their booking
 * page, in their confirmation email and on the food page. The provider can
 * change, so the words and the number are staff's to edit (Website settings →
 * Food), and the flyer is a photograph in the `food-menu` place.
 *
 * Pure: the screen, the server action and `save_food_notice()` all hold the
 * text to these rules, and an empty notice is how it is switched off.
 */

/** Mirrors the CHECKs on `food_notice` (migration 20261006000200). */
export const MAX_FOOD_NOTICE_LENGTH = 600
export const MAX_FOOD_PHONE_LENGTH = 30

/** Digits, and what numbers are written with: a leading plus, spaces, brackets, dashes. */
const PHONE_PATTERN = /^\+?[0-9() -]+$/

export interface FoodNoticeDraft {
  body: string
  phone: string
}

export type FoodNoticeField = keyof FoodNoticeDraft

export type FoodNoticeCheck =
  | { ok: true; value: FoodNoticeDraft }
  | { ok: false; errors: Partial<Record<FoodNoticeField, string>> }

/**
 * The draft as it will be saved, or what is wrong with it.
 *
 * Tidied first, so what is measured is what is stored: line endings made
 * one kind, each line's trailing spaces dropped, and a run of blank lines
 * folded to one, since a paragraph break is all a blank line can mean here.
 */
export function checkFoodNoticeDraft(input: FoodNoticeDraft): FoodNoticeCheck {
  const body = tidyBody(input.body)
  const phone = input.phone.trim()
  const errors: Partial<Record<FoodNoticeField, string>> = {}

  if (body.length > MAX_FOOD_NOTICE_LENGTH) {
    errors.body = `Keep the text under ${MAX_FOOD_NOTICE_LENGTH} characters.`
  } else if (body === '' && phone !== '') {
    errors.body = 'Write the text the number goes with, or clear the number too.'
  }

  if (phone.length > MAX_FOOD_PHONE_LENGTH) {
    errors.phone = `Keep the number under ${MAX_FOOD_PHONE_LENGTH} characters.`
  } else if (phone !== '' && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Write the number with digits only — spaces, brackets and a leading + are fine.'
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value: { body, phone } }
}

function tidyBody(body: string): string {
  return body
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Whether guests are told anything at all. */
export function isFoodNoticeShown(notice: { body: string }): boolean {
  return notice.body !== ''
}

/** The text a paragraph per line, blank lines left out. */
export function foodNoticeParagraphs(body: string): readonly string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

/** A number as a phone dials it: the plus and the digits. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/* ── What a refusal says ──────────────────────────────────────────────────── */

const MESSAGES = {
  too_long: `Keep the text under ${MAX_FOOD_NOTICE_LENGTH} characters.`,
  phone_invalid: 'Write the number with digits only — spaces, brackets and a leading + are fine.',
  stale:
    'Somebody else saved the food notice while you had it open. Copy anything you want to keep, then reload the page to see their version.',
  actor_required: 'Sign in again, then try that once more.',
} as const

/** A refusal code from the database, in a sentence for the screen. */
export function foodNoticeWriteMessage(code: string): string {
  return (
    (MESSAGES as Readonly<Record<string, string>>)[code] ??
    'The food notice could not be saved. Try again.'
  )
}
