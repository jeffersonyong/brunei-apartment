import type { Permission } from '@/lib/auth/permissions'

import type { StayDate } from './dates'
import { turnoverStageOf, type LastStayFacts, type OccupancyStatus } from './unit-status'

/**
 * What housekeeping does next with a unit (capabilities C1, C2, C3).
 *
 * The cleaner's phone lists every unit with a turnover under way, and each
 * card has one thing to do about it. That thing is decided here from the same
 * facts the units board reads — `unit_state()`'s last stay — so the phone and
 * the board cannot disagree about which units are waiting: a unit shows
 * *awaiting inspection* on the board exactly when it asks to be inspected here.
 *
 * ── The three steps, and who takes each ───────────────────────────────────
 *
 * | Step | When | Permission |
 * |---|---|---|
 * | `guest_leaving` | still checked in, and due out today or overdue | `booking.check_out` |
 * | `inspect` | checked out, nobody has inspected | `inspection.record` |
 * | `mark_ready` | inspected, not yet marked ready | `unit.manage` |
 *
 * Each step answers to the permission of the act, not to the screen, which is
 * how the portal's actions work too. Housekeeping holds all three (prd.md §4);
 * a role an administrator builds with fewer sees the card and a sentence saying
 * who takes the step, rather than a button that refuses.
 *
 * **Due out today or overdue, and never earlier [A].** A checked-in guest whose
 * stay runs past today is not on the cleaner's list, so "Guest has left" cannot
 * check out somebody who is only out for the day. A guest who really has left
 * early is checked out at the desk, which can ask them.
 *
 * Coverage here is mandatory: this is what a cleaner is told to do next.
 */

export type TurnoverStep = 'guest_leaving' | 'inspect' | 'mark_ready'

/** In the order a turnover moves through them. */
export const TURNOVER_STEPS = [
  'guest_leaving',
  'inspect',
  'mark_ready',
] as const satisfies readonly TurnoverStep[]

export const TURNOVER_STEP_PERMISSION: Readonly<Record<TurnoverStep, Permission>> = {
  guest_leaving: 'booking.check_out',
  inspect: 'inspection.record',
  mark_ready: 'unit.manage',
}

export interface TurnoverFacts {
  lastStay: LastStayFacts | null
  turnoverTrackedSince: StayDate
}

/**
 * Whether a guest still checked in is due out: their last day as booked is
 * today, or has passed.
 *
 * The one rule both field screens use for "this guest is leaving" — the
 * cleaner's "Guest has left" and the gate's check-out (N54) — so the two
 * phones cannot disagree about who is going. A guest whose stay runs past
 * today is, as far as either can tell, only out for the day.
 */
export function isDueOut(lastDay: StayDate, today: StayDate): boolean {
  // ISO dates compare correctly as strings.
  return lastDay <= today
}

/** The step this unit is waiting on today, or null when it is waiting on nobody. */
export function turnoverStepOf(facts: TurnoverFacts, today: StayDate): TurnoverStep | null {
  const { lastStay } = facts

  if (lastStay === null) {
    return null
  }

  if (lastStay.status === 'checked_in') {
    return isDueOut(lastStay.end, today) ? 'guest_leaving' : null
  }

  switch (turnoverStageOf(lastStay, facts.turnoverTrackedSince)) {
    case 'awaiting_inspection':
      return 'inspect'
    case 'cleaning':
      return 'mark_ready'
    default:
      return null
  }
}

/**
 * Whether somebody is arriving in this unit today — the fact that makes a
 * turnover urgent.
 *
 * The covering occupancy on a changeover day is the next guest's, because the
 * last guest's stay ended this morning. A guest already checked in is not
 * "arriving", and a lease has no booking reference and no arrival to hurry for.
 */
export function nextGuestArrivesToday(
  covering: {
    start: StayDate
    status: OccupancyStatus
    bookingReference: string | null
  } | null,
  today: StayDate,
): boolean {
  return (
    covering !== null &&
    covering.bookingReference !== null &&
    covering.start === today &&
    covering.status !== 'checked_in' &&
    covering.status !== 'completed'
  )
}

/**
 * The order a cleaner works the list in: a unit somebody arrives in today
 * first, then by door. Numeric-aware, so 3B-2 comes before 3B-10.
 */
export function compareTurnovers(
  a: { unitRef: string; nextGuestArrivesToday: boolean },
  b: { unitRef: string; nextGuestArrivesToday: boolean },
): number {
  if (a.nextGuestArrivesToday !== b.nextGuestArrivesToday) {
    return a.nextGuestArrivesToday ? -1 : 1
  }

  return a.unitRef.localeCompare(b.unitRef, 'en', { numeric: true })
}

/**
 * The refusals only the phone produces — the list moved under the cleaner.
 * Refusals from the database (an inspection already recorded, a unit already
 * marked ready) arrive as sentences from lib/db.
 */
export type TurnoverRefusal = 'not_found' | 'not_due_out' | 'already_left'

export function turnoverRefusalSentence(code: TurnoverRefusal): string {
  switch (code) {
    case 'not_found':
      return 'That stay is no longer on the list, so nothing was recorded. Refresh to see what is left to do.'
    case 'not_due_out':
      return 'This guest is not due to leave today, so nothing was recorded. If they have gone early, tell the office.'
    case 'already_left':
      return 'This guest has already been checked out.'
  }
}
