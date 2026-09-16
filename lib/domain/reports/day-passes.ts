import type { DayHeadroom } from '../day-pass-capacity'
import type { StayDate } from '../dates'

/**
 * Day-pass volume against capacity (capability E5, prd.md §14).
 *
 * The facts come from `day_pass_headroom()` (lib/db/day-passes.ts), the same
 * function the public booking flow checks capacity with, so the report and
 * the limit a guest meets are one figure. Volume is **guests**, not passes:
 * a family of five fills five places at the pool, and capacity is counted in
 * people.
 *
 * Capacity is the setting as it stands today, applied to every day of the
 * period. There is no history of capacity settings to read instead, and a
 * report that said a past day was 90% full against a number nobody had set
 * then would be the only figure on the screen that is not a fact. The screen
 * says so beside the table.
 */

export interface DayPassDay {
  date: StayDate
  guests: number
  /** Null when no limit is set. */
  capacity: number | null
  /** Guests over capacity, or null when there is no limit (or the pass is closed). */
  share: number | null
}

export interface DayPassVolume {
  /** Only the days something was sold, oldest first. */
  days: readonly DayPassDay[]
  guests: number
  daysWithPasses: number
  daysInPeriod: number
  capacity: number | null
  /** The period's guests over capacity × every day of it, or null with no usable limit. */
  share: number | null
}

function shareOf(guests: number, places: number | null): number | null {
  return places === null || places <= 0 ? null : guests / places
}

export function dayPassVolume(headroom: readonly DayHeadroom[]): DayPassVolume {
  const ordered = [...headroom].sort((a, b) => a.date.localeCompare(b.date))
  const days = ordered
    .filter((entry) => entry.taken > 0)
    .map((entry): DayPassDay => ({
      date: entry.date,
      guests: entry.taken,
      capacity: entry.capacity,
      share: shareOf(entry.taken, entry.capacity),
    }))
  const guests = days.reduce((sum, entry) => sum + entry.guests, 0)
  // One setting applies to every day (see above), so any day carries it.
  const capacity = ordered[0]?.capacity ?? null

  return {
    days,
    guests,
    daysWithPasses: days.length,
    daysInPeriod: ordered.length,
    capacity,
    share: shareOf(guests, capacity === null ? null : capacity * ordered.length),
  }
}

export function formatDayPassCapacity(capacity: number | null): string {
  if (capacity === null) {
    return 'No limit set'
  }

  return capacity === 0 ? 'Closed' : String(capacity)
}
