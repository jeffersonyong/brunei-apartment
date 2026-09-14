import type { BookingStatus } from './booking-state'
import type { StayDate } from './dates'

/**
 * What state a unit is in, on a given day (capability B8).
 *
 * ── Why this is a derivation and not a column ──────────────────────────────
 *
 * architecture.md §5.1 left `unit.status` out of the schema on purpose: "an
 * unread status column that availability silently ignores is worse than none."
 * All of prd.md §6.4's lifecycle is recorded somewhere already — an occupied
 * unit is a unit whose last stay is `checked_in`, a unit awaiting inspection is
 * one whose last stay ended with no inspection against it — and storing the
 * answer as well would be storing a second copy of a fact, and the copy would
 * drift.
 *
 * So only the facts are stored: `out_of_service` (a column pair on the unit),
 * the lease behind `leased_long_term` (an occupancy row with no booking), and
 * the inspection and its readiness behind `awaiting_inspection` and `cleaning`
 * (20260925000100). Every status is computed here.
 *
 * ── Why the rules are here and not in SQL ─────────────────────────────────
 *
 * `unit_state()` returns facts; this function turns them into a status. That
 * split is the same one architecture.md §5.3 makes for the booking state
 * machine — "no code path assigns a status without going through it" — and it
 * exists for the same reason: a `case` expression in plpgsql plus a union type
 * here would be two copies of one set of rules, and the screen and the
 * database would eventually disagree about what a unit is doing.
 *
 * ── Two of these are for the board alone ──────────────────────────────────
 *
 * `awaiting_inspection` and `cleaning` say what housekeeping has left to do.
 * They decide nothing about selling: availability, the exclusion constraint and
 * check-in never read them (D-3, Jeff, 13 September 2026 — open-questions.md
 * N53 asks Jason whether they should). A unit marked ready after an early
 * departure therefore reads `available` here while its unused nights stay
 * unsellable, because check-out never shortens a stay (architecture.md §5.2).
 *
 * Coverage here is mandatory (architecture.md §2).
 */

export type UnitStatus =
  | 'available'
  | 'held'
  | 'booked'
  | 'occupied'
  | 'awaiting_inspection'
  | 'cleaning'
  | 'leased_long_term'
  | 'out_of_service'

/**
 * The statuses in reading order: the lifecycle first, then the two facts a
 * person puts on a unit. This is the order the filter panel and the stat strip
 * render them in.
 */
export const UNIT_STATUSES = [
  'available',
  'held',
  'booked',
  'occupied',
  'awaiting_inspection',
  'cleaning',
  'leased_long_term',
  'out_of_service',
] as const satisfies readonly UnitStatus[]

/** How each status is named on screen. Singular: a badge labels one unit. */
export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'Available',
  held: 'Held',
  booked: 'Booked',
  occupied: 'Occupied',
  awaiting_inspection: 'Awaiting inspection',
  cleaning: 'Cleaning',
  leased_long_term: 'Leased',
  out_of_service: 'Out of service',
}

/**
 * The status of an occupancy row.
 *
 * A booking's occupancy mirrors its booking (20260829000200's trigger). A lease
 * has no booking and carries `leased`, which is deliberately absent from
 * `BookingStatus`: it is not a state any booking can be in, and the trigger
 * that mirrors booking statuses cannot produce it.
 */
export type OccupancyStatus = BookingStatus | 'leased'

/**
 * The most recent stay a guest actually arrived for — `unit_state()`'s
 * `last_stay`, which it reports for today only.
 */
export interface LastStayFacts {
  status: 'checked_in' | 'completed'
  /**
   * The stay's last day **as booked**. An early check-out does not move it
   * (transition_booking() changes the status and nothing else), and an
   * overstay has already passed it.
   */
  end: StayDate
  inspected: boolean
  ready: boolean
}

export interface UnitStateFacts {
  /** Null unless someone has taken the unit out of service. */
  outOfServiceSince: StayDate | null
  /**
   * The one occupancy covering the day in question, if any.
   *
   * At most one, by construction rather than by convention: the
   * `no_overlapping_occupancy` exclusion constraint forbids two unreleased
   * occupancies over the same unit and the same day (capability G1).
   */
  covering: { status: OccupancyStatus } | null
  /** Null on any day but today, and in a unit no guest has yet arrived in. */
  lastStay: LastStayFacts | null
  /**
   * The day the building started keeping turnovers. A stay that ended before it
   * is not waiting for anybody — see 20260925000100 §2.
   */
  turnoverTrackedSince: StayDate
}

/**
 * Where a finished stay's turnover has got to, or null when there is none to
 * speak of: the guest has not left, the unit has been marked ready, or the stay
 * ended before turnovers were kept.
 *
 * Shared with lib/domain/turnover.ts, which asks the same question to decide
 * what the cleaner does next — two copies of "is this unit still being turned
 * over" would be the first two to disagree.
 */
export function turnoverStageOf(
  lastStay: LastStayFacts | null,
  turnoverTrackedSince: StayDate,
): 'awaiting_inspection' | 'cleaning' | null {
  if (lastStay === null || lastStay.status !== 'completed' || lastStay.ready) {
    return null
  }

  // ISO dates compare correctly as strings.
  if (lastStay.end < turnoverTrackedSince) {
    return null
  }

  return lastStay.inspected ? 'cleaning' : 'awaiting_inspection'
}

/**
 * Whether a unit is not ready for the guest arriving in it: its last guest has
 * not checked out, or has and the turnover is unfinished.
 *
 * Said on the gate's card and never enforced (N53). The guard hands over the
 * keys (N54) with no units board beside him, so he is told, and whether an
 * unready unit should stop a check-in is Jason's question. `turnoverStageOf`
 * alone would call a unit whose last guest is still in it ready — that stay
 * has no turnover yet — which is why the checked-in case is asked first.
 */
export function unitNotReadyOf(
  lastStay: LastStayFacts | null,
  turnoverTrackedSince: StayDate,
): boolean {
  if (lastStay === null) {
    return false
  }

  return (
    lastStay.status === 'checked_in' || turnoverStageOf(lastStay, turnoverTrackedSince) !== null
  )
}

/**
 * What the unit is doing, first match wins.
 *
 * 1. **Out of service** outranks everything, including a guest, because it is a
 *    statement about the unit itself rather than about who is in it — and
 *    because `set_unit_out_of_service()` refuses to create that combination in
 *    the first place, so seeing it means something has gone wrong and the more
 *    alarming label is the useful one.
 * 2. **A guest still checked in** makes the unit occupied whatever the dates
 *    say. The covering occupancy alone missed the guest on the day they leave
 *    (a stay covers `[start, end)`) and the guest who stays past it, and called
 *    both units available.
 * 3. **A turnover in progress** outranks whatever covers the day — including
 *    the next guest's booking on a changeover day [A]. The next guest is on
 *    their way either way; what the board has to say is that the unit is not
 *    yet clean.
 * 4. Otherwise, **the covering occupancy**, as before.
 */
export function deriveUnitStatus(facts: UnitStateFacts): UnitStatus {
  if (facts.outOfServiceSince !== null) {
    return 'out_of_service'
  }

  if (facts.lastStay?.status === 'checked_in') {
    return 'occupied'
  }

  const turnover = turnoverStageOf(facts.lastStay, facts.turnoverTrackedSince)

  if (turnover !== null) {
    return turnover
  }

  if (facts.covering === null) {
    return 'available'
  }

  switch (facts.covering.status) {
    case 'leased':
      return 'leased_long_term'
    case 'checked_in':
      return 'occupied'
    case 'confirmed':
      return 'booked'
    // `draft` sits with the held states rather than with available: a draft
    // occupancy still holds its slot in the exclusion constraint, so calling
    // the unit available here would put this board and available_units() into
    // disagreement about the same row.
    case 'draft':
    case 'held':
    case 'awaiting_payment_verification':
      return 'held'
    // A `completed` occupancy still covering the day is an early departure
    // whose turnover is finished — marked ready — or predates turnovers being
    // kept. Available on the board, and still unsellable for the nights the
    // guest did not use: that divergence is D-3's, recorded in architecture.md
    // §5.2, and N53 asks Jason about it.
    //
    // `no_show`, `expired` and `cancelled` release their unit, so unit_state()
    // filters them out and they reach here only by mistake.
    default:
      return 'available'
  }
}

/** True when the value is one of the eight — for reading a URL parameter. */
export function isUnitStatus(value: string): value is UnitStatus {
  return (UNIT_STATUSES as readonly string[]).includes(value)
}

/**
 * The stat strip's figures.
 *
 * Every status appears, including the ones at zero: a tile that vanishes when
 * its count reaches zero makes the strip's width jump as the day goes on, and
 * "nothing is out of service" is information worth showing.
 */
export function countByStatus(
  statuses: readonly UnitStatus[],
): Readonly<Record<UnitStatus, number>> {
  const counts = Object.fromEntries(UNIT_STATUSES.map((status) => [status, 0])) as Record<
    UnitStatus,
    number
  >

  for (const status of statuses) {
    counts[status] += 1
  }

  return counts
}
