import type { UnitLastStay, UnitState } from '@/lib/db/units'
import type { StayDate } from '@/lib/domain/dates'

/**
 * Who and when, for one row of the units board (capability B8).
 *
 * ── During a turnover, the row is about the stay that left ────────────────
 *
 * A unit awaiting inspection or being cleaned is waiting on the stay that just
 * ended, not on whatever covers the day. On a changeover day the next guest's
 * booking already covers it, and printing that guest's name beside "Awaiting
 * inspection" reads as though the guest arriving were the one waiting to be
 * inspected — on the screen the desk opens to answer who is arriving. So the
 * Who cell names the stay being turned over, and the Until cell says when the
 * next stay begins, including a booking that begins today.
 *
 * Kept apart from the page so the rule has a test; the page only draws it.
 */

type BoardUnit = Pick<UnitState, 'status' | 'lastStay' | 'covering' | 'nextStart'>

/** The stay a turnover is about, or null when the unit is not mid-turnover. */
export function turnoverStayOf(unit: Pick<UnitState, 'status' | 'lastStay'>): UnitLastStay | null {
  return unit.status === 'awaiting_inspection' || unit.status === 'cleaning' ? unit.lastStay : null
}

/**
 * When the next stay begins, for the Until cell of a unit mid-turnover.
 *
 * `nextStart` counts only stays beginning after today, so on a changeover day
 * the booking arriving today is the covering occupancy instead. A lease has no
 * booking and is not "a stay" here.
 */
export function nextStayStartOf(unit: BoardUnit): StayDate | null {
  if (turnoverStayOf(unit) !== null && unit.covering?.bookingReference) {
    return unit.covering.start
  }

  return unit.nextStart
}
