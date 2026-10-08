import type { BookingStatus } from './booking-state'
import { addDays, formatStayDate, type StayDate } from './dates'
import { extrasFromLines, type BookingLine } from './lines'
import { turnoverStageOf, type LastStayFacts, type OccupancyStatus } from './unit-status'

/**
 * The guests on their way, for the cleaner (capability C4, Jason's team,
 * 8 October 2026).
 *
 * The departures list says what to do now. This says what is coming, so a
 * cleaner can get a unit ready ahead of its guest instead of finding out at the
 * gate. It is a heads-up and nothing else: no card on it has a button.
 *
 * ── Who is on it ──────────────────────────────────────────────────────────
 *
 * Short stays starting today and over the next three days, either confirmed or
 * with their transfer being checked — the second marked as not confirmed yet.
 * **Never a hold.** Nothing expires an unpaid booking, so a hold can sit for
 * weeks on a unit nobody is coming to, and a cleaner who prepared for it would
 * be preparing for a guest who never paid (Jeff, 8 October 2026). A day pass
 * has no unit to prepare, and a lease is the tenant's.
 *
 * ── What "ready" can honestly mean ────────────────────────────────────────
 *
 * The units board knows the turnover facts for **today** only (`unit_state()`'s
 * last stay, 20260925000100 §3). For a guest arriving today that is the whole
 * answer, and it is the gate's own rule: the last guest has left and the unit
 * was marked ready. For a guest two days out it is a forecast, so the card says
 * how far it goes — ready now, and nobody is booked in first — and otherwise
 * names whoever is in the way. Readiness never holds a check-in back (N53).
 */

export const ARRIVALS_AHEAD_DAYS = 3

/** In the order the card's wording assumes: confirmed, then still being checked. */
export const ARRIVING_STATUSES = [
  'confirmed',
  'awaiting_payment_verification',
] as const satisfies readonly BookingStatus[]

export type ArrivingStatus = (typeof ARRIVING_STATUSES)[number]

/** The days the list covers, both ends included. */
export function arrivalWindowOf(today: StayDate): { from: StayDate; to: StayDate } {
  return { from: today, to: addDays(today, ARRIVALS_AHEAD_DAYS) }
}

/** What the units board knows about one unit today, as the readiness needs it. */
export interface UnitFactsForArrival {
  outOfService: boolean
  /** Null on any day but today, and in a unit no guest has yet arrived in. */
  lastStay: LastStayFacts | null
  turnoverTrackedSince: StayDate
  /**
   * The occupancy covering today, if any — on a changeover day, the arriving
   * guest's own.
   */
  covering: {
    bookingReference: string | null
    status: OccupancyStatus
    end: StayDate | null
  } | null
  /** The next stay to start after today, whoever's it is. */
  nextStart: StayDate | null
}

export type ArrivalReadiness =
  | { kind: 'ready' }
  | { kind: 'out_of_service' }
  /** A guest is checked in, and leaves (or was due to) on `until`. */
  | { kind: 'guest_in'; until: StayDate }
  /** The last guest has gone and the unit is not marked ready. */
  | { kind: 'turnover' }
  /** Somebody else's booking has the unit today. Null only on an open-ended lease. */
  | { kind: 'booked_before'; until: StayDate | null }
  /** Somebody else's stay starts after today and before this arrival. */
  | { kind: 'stay_before'; from: StayDate }

/**
 * Whether the unit will be ready for this guest, so far as today's facts can
 * say. First match wins.
 *
 * The first three are what the unit is doing now, and they are the whole
 * answer for a guest arriving today. A guest arriving later can also be beaten
 * to the unit by another booking — one covering today, or one starting before
 * them — which today's turnover facts cannot see past.
 */
export function arrivalReadinessOf(
  arrival: { reference: string; date: StayDate },
  unit: UnitFactsForArrival,
  today: StayDate,
): ArrivalReadiness {
  if (unit.outOfService) {
    return { kind: 'out_of_service' }
  }

  // Asked before the turnover, which has nothing to say about a stay that has
  // not ended (unitNotReadyOf in unit-status.ts makes the same point).
  if (unit.lastStay?.status === 'checked_in') {
    return { kind: 'guest_in', until: unit.lastStay.end }
  }

  if (turnoverStageOf(unit.lastStay, unit.turnoverTrackedSince) !== null) {
    return { kind: 'turnover' }
  }

  // ISO dates compare correctly as strings.
  if (arrival.date <= today) {
    return { kind: 'ready' }
  }

  const covering = unit.covering

  // An early departure's occupancy keeps covering its unused nights
  // (architecture.md §5.2), but nobody is in the unit and the turnover above
  // has already been asked about — so a completed one is not in the way.
  if (
    covering !== null &&
    covering.status !== 'completed' &&
    covering.bookingReference !== arrival.reference
  ) {
    return { kind: 'booked_before', until: covering.end }
  }

  if (unit.nextStart !== null && unit.nextStart < arrival.date) {
    return { kind: 'stay_before', from: unit.nextStart }
  }

  return { kind: 'ready' }
}

/** The line the card prints under the arrival. */
export function readinessSentence(
  readiness: ArrivalReadiness,
  arrivalDate: StayDate,
  today: StayDate,
): string {
  switch (readiness.kind) {
    case 'ready':
      return arrivalDate <= today
        ? 'Ready for them.'
        : 'Ready now, and nobody is booked in before them.'
    case 'out_of_service':
      return 'Out of service — ask the office.'
    case 'guest_in':
      return readiness.until < today
        ? `Another guest is still in it — they were due out ${formatStayDate(readiness.until)}.`
        : `Another guest is in it until ${dayWord(readiness.until, today)}.`
    case 'turnover':
      return 'Being turned over — not marked ready yet.'
    case 'booked_before':
      return readiness.until === null
        ? 'Another booking has it first.'
        : `Another booking has it until ${dayWord(readiness.until, today)}.`
    case 'stay_before':
      return `Another stay starts ${dayWord(readiness.from, today)}, before this one.`
  }
}

/** "Today", "Tomorrow", or the date — the heading over a day's arrivals. */
export function arrivalDayLabel(date: StayDate, today: StayDate): string {
  const word = dayWord(date, today)

  return word.charAt(0).toUpperCase() + word.slice(1)
}

function dayWord(date: StayDate, today: StayDate): string {
  if (date === today) {
    return 'today'
  }

  if (date === addDays(today, 1)) {
    return 'tomorrow'
  }

  return formatStayDate(date)
}

/** What the cleaner prepares beyond the unit itself. */
export interface HousekeepingNeeds {
  /** By the name the guest bought them under; quantities of one name added up. */
  extras: readonly { name: string; quantity: number }[]
  /** Hours before the usual check-in time the guest was sold. Zero for none. */
  earlyCheckInHours: number
}

/**
 * The lines a cleaner acts on, and nothing they carry about money.
 *
 * A phone on this screen is left in rooms, so a price never reaches it — the
 * names and quantities are picked out here rather than the lines being passed
 * through.
 */
export function housekeepingNeedsOf(lines: readonly BookingLine[]): HousekeepingNeeds {
  const extras: { name: string; quantity: number }[] = []

  for (const entry of lines) {
    if (entry.type !== 'extra') {
      continue
    }

    const index = extras.findIndex((extra) => extra.name === entry.description)

    if (index === -1) {
      extras.push({ name: entry.description, quantity: entry.quantity })
    } else {
      const existing = extras[index]!
      extras[index] = { name: existing.name, quantity: existing.quantity + entry.quantity }
    }
  }

  return { extras, earlyCheckInHours: extrasFromLines(lines).earlyCheckInHours }
}

/** Soonest first, then by door, numeric-aware so 3B-2 comes before 3B-10. */
export function compareArrivalsAhead(
  a: { arrival: StayDate; unitRef: string },
  b: { arrival: StayDate; unitRef: string },
): number {
  if (a.arrival !== b.arrival) {
    return a.arrival < b.arrival ? -1 : 1
  }

  return a.unitRef.localeCompare(b.unitRef, 'en', { numeric: true })
}
