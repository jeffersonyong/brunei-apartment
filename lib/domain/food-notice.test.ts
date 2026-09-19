import { describe, expect, test } from 'vitest'

import {
  MAX_FOOD_NOTICE_LENGTH,
  MAX_FOOD_PHONE_LENGTH,
  checkFoodNoticeDraft,
  foodNoticeParagraphs,
  foodNoticeWriteMessage,
  isFoodNoticeShown,
  telHref,
} from './food-notice'

/**
 * What staff may write about food, and how it is read back out.
 *
 * The text reaches every confirmed guest's email unreviewed, so what it may
 * hold is decided here, once, for the screen and the database alike.
 */

describe('checking a draft', () => {
  test('tidies the text: trims it, drops trailing spaces and runs of blank lines', () => {
    const result = checkFoodNoticeDraft({
      body: '  No restaurant here.   \r\n\r\n\r\n\r\nFree delivery over BND 20.  ',
      phone: '  +673 333 5410 ',
    })

    expect(result).toEqual({
      ok: true,
      value: { body: 'No restaurant here.\n\nFree delivery over BND 20.', phone: '+673 333 5410' },
    })
  })

  test('an empty notice is allowed, and is how the notice is switched off', () => {
    expect(checkFoodNoticeDraft({ body: '   ', phone: '' })).toEqual({
      ok: true,
      value: { body: '', phone: '' },
    })
  })

  test('refuses a notice longer than the limit', () => {
    const result = checkFoodNoticeDraft({
      body: 'a'.repeat(MAX_FOOD_NOTICE_LENGTH + 1),
      phone: '',
    })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.body).toContain(`${MAX_FOOD_NOTICE_LENGTH}`)
  })

  test('refuses a number with letters in it, and a number too long to be one', () => {
    const letters = checkFoodNoticeDraft({ body: 'Menu at the pool.', phone: 'call 3335410' })
    const long = checkFoodNoticeDraft({
      body: 'Menu at the pool.',
      phone: '1'.repeat(MAX_FOOD_PHONE_LENGTH + 1),
    })

    expect(!letters.ok && letters.errors.phone).toBeTruthy()
    expect(!long.ok && long.errors.phone).toBeTruthy()
  })

  test('accepts the spacing, brackets and dashes numbers are written with', () => {
    expect(checkFoodNoticeDraft({ body: 'Menu.', phone: '+673 (333) 54-10' }).ok).toBe(true)
  })

  test('refuses a number with no notice to put it in', () => {
    const result = checkFoodNoticeDraft({ body: '', phone: '+673 333 5410' })

    expect(!result.ok && result.errors.body).toBeTruthy()
  })
})

describe('reading it back', () => {
  test('is shown only when there is something to say', () => {
    expect(isFoodNoticeShown({ body: '' })).toBe(false)
    expect(isFoodNoticeShown({ body: 'Menu at the pool.' })).toBe(true)
  })

  test('splits into paragraphs on line breaks, leaving the blank lines out', () => {
    expect(foodNoticeParagraphs('No restaurant.\n\nMenu at the pool.\nFree delivery.')).toEqual([
      'No restaurant.',
      'Menu at the pool.',
      'Free delivery.',
    ])
  })

  test('dials the number with its punctuation taken out', () => {
    expect(telHref('+673 (333) 54-10')).toBe('tel:+6733335410')
  })

  test('says what a refusal means, and has a fallback for one it does not know', () => {
    expect(foodNoticeWriteMessage('stale')).toContain('Somebody else')
    expect(foodNoticeWriteMessage('something_new')).toContain('could not be saved')
  })
})
