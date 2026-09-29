import { describe, expect, test } from 'vitest'

import {
  formatMonthShort,
  formatYearPage,
  isYearOutOfBounds,
  isYearPageOutOfBounds,
  monthsOfYear,
  offersYearJump,
  YEARS_PER_PAGE,
  yearOf,
  yearPageStartFor,
  yearsOnPage,
} from './calendar-year'

describe('yearOf', () => {
  test('takes the year a month falls in', () => {
    expect(yearOf('2026-09')).toBe(2026)
  })
})

describe('the year page', () => {
  test('opens two years before the year in view, so the past stays in reach', () => {
    expect(yearPageStartFor(2026)).toBe(2024)
  })

  test('holds twelve years, in order', () => {
    const years = yearsOnPage(2024)

    expect(years).toHaveLength(YEARS_PER_PAGE)
    expect(years[0]).toBe(2024)
    expect(years.at(-1)).toBe(2035)
  })

  test('is headed by its first and last year', () => {
    expect(formatYearPage(2024)).toBe('2024 – 2035')
  })
})

describe('monthsOfYear', () => {
  test('is January to December of that year', () => {
    const months = monthsOfYear(2027)

    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2027-01')
    expect(months.at(-1)).toBe('2027-12')
  })
})

describe('formatMonthShort', () => {
  test('uses the short names the rest of the product writes dates with', () => {
    expect(formatMonthShort('2026-01')).toBe('Jan')
    // en-GB spells September's short form with four letters: "29 Sept 2026".
    expect(formatMonthShort('2026-09')).toBe('Sept')
  })
})

describe('isYearOutOfBounds', () => {
  test('is never true without bounds', () => {
    expect(isYearOutOfBounds(1990, {})).toBe(false)
    expect(isYearOutOfBounds(2090, {})).toBe(false)
  })

  test('keeps a year with even one selectable day', () => {
    // A lease ending no earlier than 31 December 2026 can still end in 2026.
    expect(isYearOutOfBounds(2026, { min: '2026-12-31' })).toBe(false)
    expect(isYearOutOfBounds(2026, { max: '2026-01-01' })).toBe(false)
  })

  test('retires a year wholly before the first day or after the last', () => {
    expect(isYearOutOfBounds(2025, { min: '2026-01-01' })).toBe(true)
    expect(isYearOutOfBounds(2027, { max: '2026-12-31' })).toBe(true)
  })
})

describe('isYearPageOutOfBounds', () => {
  test('is true only when no year on the page can be chosen', () => {
    // A banking date is never in the future: the page after today's holds
    // nothing, the page holding today does.
    const bounds = { max: '2026-09-29' }

    expect(isYearPageOutOfBounds(2036, bounds)).toBe(true)
    expect(isYearPageOutOfBounds(2024, bounds)).toBe(false)
    expect(isYearPageOutOfBounds(2012, bounds)).toBe(false)
  })

  test('looks at both ends', () => {
    const bounds = { min: '2026-09-30' }

    expect(isYearPageOutOfBounds(2012, bounds)).toBe(true)
    // 2015–2026: only the last year reaches the window, and that is enough.
    expect(isYearPageOutOfBounds(2015, bounds)).toBe(false)
  })
})

describe('offersYearJump', () => {
  test('is offered on an open window — the filters, a lease start', () => {
    expect(offersYearJump({})).toBe(true)
  })

  test('is offered when only one end is bounded — a lease end, a banking date', () => {
    expect(offersYearJump({ min: '2026-09-30' })).toBe(true)
    expect(offersYearJump({ max: '2026-09-29' })).toBe(true)
  })

  test('is not offered inside the booking window, where a year view would be all grey', () => {
    expect(offersYearJump({ min: '2026-09-29', max: '2026-11-30' })).toBe(false)
  })

  test('is offered once the window runs past a year', () => {
    expect(offersYearJump({ min: '2026-01-01', max: '2027-01-01' })).toBe(false)
    expect(offersYearJump({ min: '2026-01-01', max: '2027-01-03' })).toBe(true)
  })
})
