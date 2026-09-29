import { addDays } from '@/lib/domain/dates'

import type { DayBounds } from './calendar-grid'
import { parseCalendarMonth, type CalendarMonth } from './calendar-month'

/**
 * The arithmetic behind the year jump — the footer's *Choose a year*, which
 * swaps the day grid for twelve years, then for the twelve months of the one
 * picked, and lands back on the day grid at the month picked after that.
 *
 * It exists for long-term leases (Jason's team, 29 September 2026): the month
 * arrows step one month, so an end date two years out was twenty-four clicks.
 * Pure and beside `calendar-month.ts` for the same reason that file is — where
 * a year's edges fall against a field's bounds is the part worth asserting.
 */

/** Three across and four down: the same footprint as the day grid it replaces. */
export const YEARS_PER_PAGE = 12

/**
 * How far back a page reaches before the year in view. A lease looks forward
 * and a report looks back, and two years behind with nine ahead serves both
 * without a first press of the arrow.
 */
const YEARS_SHOWN_BEFORE = 2

/**
 * A window this long, or shorter, is not offered the jump: the booking window
 * is 62 days, and a year view of it would be eleven grey years and one live
 * one. Longer than a year, and paging by month is the slow way round.
 */
const DAYS_IN_A_YEAR_OF_WINDOW = 366

export function yearOf(month: CalendarMonth): number {
  return Number(parseCalendarMonth(month).slice(0, 4))
}

/** The first year on the page that opens for a year in view. */
export function yearPageStartFor(year: number): number {
  return year - YEARS_SHOWN_BEFORE
}

export function yearsOnPage(start: number): readonly number[] {
  return Array.from({ length: YEARS_PER_PAGE }, (_, offset) => start + offset)
}

/** The page's heading, e.g. `2024 – 2035`. */
export function formatYearPage(start: number): string {
  return `${start} – ${start + YEARS_PER_PAGE - 1}`
}

export function monthsOfYear(year: number): readonly CalendarMonth[] {
  const prefix = String(year).padStart(4, '0')

  return Array.from({ length: 12 }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`)
}

/** A month cell's label, e.g. `Sept` — the short form `29 Sept 2026` already uses. */
export function formatMonthShort(month: CalendarMonth): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${parseCalendarMonth(month)}-01T00:00:00Z`),
  )
}

/**
 * True when no day of the year is selectable. ISO dates compare as strings, so
 * a year is out when its last day falls before the first bound or its first
 * day after the last — the day grid's rule, at a coarser grain.
 */
export function isYearOutOfBounds(year: number, { min, max }: DayBounds): boolean {
  const prefix = String(year).padStart(4, '0')

  return (
    (min !== undefined && `${prefix}-12-31` < min) || (max !== undefined && `${prefix}-01-01` > max)
  )
}

/** True when nothing on the page can be chosen — used to retire a page arrow. */
export function isYearPageOutOfBounds(start: number, bounds: DayBounds): boolean {
  return yearsOnPage(start).every((year) => isYearOutOfBounds(year, bounds))
}

/**
 * Whether a picker carries the jump at all: open at either end, or bounded
 * more than a year apart. That reaches the lease fields, the banking date and
 * every filter, and leaves out the pickers held to the booking window — the
 * public site's among them.
 */
export function offersYearJump({ min, max }: DayBounds): boolean {
  if (min === undefined || max === undefined) {
    return true
  }

  return max > addDays(min, DAYS_IN_A_YEAR_OF_WINDOW)
}
