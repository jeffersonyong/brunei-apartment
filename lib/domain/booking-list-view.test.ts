import { describe, expect, test } from 'vitest'

import {
  activeViewId,
  filterFromStored,
  isEmptyFilter,
  MAX_BOOKING_LIST_VIEWS,
  MAX_VIEW_NAME_LENGTH,
  sameFilter,
  tidyViewName,
  viewHref,
  type ViewFilter,
} from './booking-list-view'

/**
 * The team's saved views on All bookings (capability B19).
 *
 * The part worth care is reading a stored view back: it was saved by a person
 * on an older version of the app, and whatever it holds must turn into a
 * filter the page can apply rather than a page that will not render.
 */

const NONE: ViewFilter = { statuses: [], streams: [], search: null, moneyOwed: false }

const needsChasing: ViewFilter = {
  statuses: ['held', 'awaiting_payment_verification', 'checked_in'],
  streams: [],
  search: null,
  moneyOwed: false,
}

describe('the limits', () => {
  test('a row of views, not a filing cabinet', () => {
    expect(MAX_BOOKING_LIST_VIEWS).toBe(12)
    expect(MAX_VIEW_NAME_LENGTH).toBe(40)
  })
})

describe('filterFromStored', () => {
  test('reads a stored view in the order the filter row shows them', () => {
    expect(
      filterFromStored({
        statuses: ['checked_in', 'awaiting_payment_verification', 'held'],
        streams: ['short_stay'],
        search: 'Lim',
        moneyOwed: true,
      }),
    ).toEqual({
      statuses: ['held', 'awaiting_payment_verification', 'checked_in'],
      streams: ['short_stay'],
      search: 'Lim',
      moneyOwed: true,
    })
  })

  test('drops a status or a stream that no longer exists, and never throws', () => {
    expect(
      filterFromStored({
        statuses: ['vanished', 'confirmed', 'confirmed'],
        streams: ['submarine', 'day_pass'],
        search: '   ',
        moneyOwed: false,
      }),
    ).toEqual({ statuses: ['confirmed'], streams: ['day_pass'], search: null, moneyOwed: false })
  })
})

describe('isEmptyFilter and sameFilter', () => {
  test('a filter with nothing in it is All bookings', () => {
    expect(isEmptyFilter(NONE)).toBe(true)
    expect(isEmptyFilter({ ...NONE, moneyOwed: true })).toBe(false)
    expect(isEmptyFilter({ ...NONE, search: 'PV-4821' })).toBe(false)
  })

  test('the order things were chosen in is not part of a filter, nor the case of a search', () => {
    expect(
      sameFilter(needsChasing, {
        ...needsChasing,
        statuses: ['checked_in', 'held', 'awaiting_payment_verification'],
      }),
    ).toBe(true)
    expect(sameFilter({ ...NONE, search: 'lim' }, { ...NONE, search: 'LIM' })).toBe(true)
  })

  test('any one difference is a different filter', () => {
    expect(sameFilter(needsChasing, { ...needsChasing, moneyOwed: true })).toBe(false)
    expect(sameFilter(needsChasing, { ...needsChasing, statuses: ['held'] })).toBe(false)
    expect(sameFilter(needsChasing, { ...needsChasing, streams: ['short_stay'] })).toBe(false)
  })
})

describe('viewHref', () => {
  test('writes the params the way the filter row does, so an opened view looks chosen', () => {
    expect(
      viewHref({
        statuses: ['held', 'checked_in'],
        streams: ['short_stay'],
        search: 'Lim',
        moneyOwed: true,
      }),
    ).toBe('/bookings?q=Lim&status=held&status=checked_in&stream=short_stay&owed=1')
  })

  test('the empty filter is the bare list', () => {
    expect(viewHref(NONE)).toBe('/bookings')
  })
})

describe('activeViewId', () => {
  const views = [
    { id: 'chase', name: 'Needs chasing', filter: needsChasing },
    { id: 'owed', name: 'Owed', filter: { ...NONE, moneyOwed: true } },
  ]

  test('nothing applied is All bookings', () => {
    expect(activeViewId(views, NONE, false)).toBe('all')
  })

  test('the view whose filter is exactly what is applied', () => {
    expect(activeViewId(views, { ...NONE, moneyOwed: true }, false)).toBe('owed')
  })

  test('dates on top of a view mean the list is no longer that view', () => {
    expect(activeViewId(views, needsChasing, true)).toBeNull()
    expect(activeViewId(views, NONE, true)).toBeNull()
  })

  test('a filter no view matches has no active view', () => {
    expect(activeViewId(views, { ...NONE, statuses: ['confirmed'] }, false)).toBeNull()
  })
})

describe('tidyViewName', () => {
  test('trims and folds runs of spaces, as the database does before it compares', () => {
    expect(tidyViewName('  Needs   chasing ')).toBe('Needs chasing')
  })
})
