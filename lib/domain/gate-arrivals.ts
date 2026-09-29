import { MAX_EXTRA_GUESTS } from './extra-guests'
import type { GateVerdict } from './gate'
import type { BookingStream } from './stream'

/**
 * Counting guests in at the gate (capability D8, Jason's team, 29 September
 * 2026).
 *
 * A booking's code can be scanned again and again, and the gate used to
 * record only the first Admit or Check in — after which the card counted
 * nobody, so a forwarded screenshot of a 20-person pass could bring in any
 * number of later groups unnoticed. Now every group that comes through is
 * counted against the booking: the first in the Check in or Admit dialog, and
 * every one after it with Record arrivals — the one button that counts people
 * in, and whose box also corrects a mis-tap (Jeff, 29 September 2026, after
 * trying it: a separate Extra and Correct did the same thing twice).
 *
 * **The count records who actually came through, and may go past the
 * booking** (Jeff, 29 September 2026). **The app never turns anyone away**:
 * whether extras are refused is gate policy for the guard to apply, not a rule
 * this screen enforces. More than booked is settled at the gate only on a pass
 * being admitted now, for a guard who takes cash — the extras are named by age
 * band, the pass is priced again, and the difference is taken before they are
 * admitted. Every other time the office is told.
 *
 * What it does not do, said plainly to the team: it counts first arrivals,
 * not who is inside — a guest who drives out and back in is not counted
 * again, so the guard asks.
 *
 * The count is stored beside the booking (`booking_arrival`), and every change
 * to it is an event in the booking's history, so a correction is visible.
 * `record_gate_arrivals()` is the authority; this is the arithmetic and the
 * words the screen and the actions share.
 */

export interface GateArrivals {
  /** Everybody the booking is for — a stay's counted and exempt guests, or a pass's headcount. */
  booked: number
  /** Everybody counted through the gate so far. */
  arrived: number
  /** Booked and not counted yet. */
  toCome: number
  /** Counted beyond the booking. */
  over: number
}

export function gateArrivalsOf(booked: number, arrived: number): GateArrivals {
  return {
    booked,
    arrived,
    toCome: Math.max(booked - arrived, 0),
    over: Math.max(arrived - booked, 0),
  }
}

/** "15 of 20 arrived · 5 to come", "20 of 20 arrived", or "23 arrived · 3 more than booked". */
export function gateArrivalsLine(arrivals: GateArrivals): string {
  const { booked, arrived, toCome, over } = arrivals

  if (over > 0) {
    return `${arrived} arrived · ${over} more than booked`
  }

  const of = `${arrived} of ${booked} arrived`

  return toCome > 0 ? `${of} · ${toCome} to come` : of
}

/**
 * Which counter a card offers:
 *
 * - `first` — the count is taken in the Check in or Admit dialog itself.
 * - `more` — Record arrivals, full width, while anyone booked is still to
 *   come.
 * - `all_in` — everyone booked is in, so Record arrivals shrinks to a small
 *   button beside the count: a car with more people than the booking is for
 *   is the exception, and every card in residence would otherwise carry a
 *   full-width button all stay.
 *
 * Null when there is nothing to count against: a card the office has to deal
 * with first, a closed booking — even one with a count, reached by its QR code
 * or by search — and a booking let in without one.
 */
export type ArrivalsControl = 'first' | 'more' | 'all_in'

export function arrivalsControlOf(
  verdict: GateVerdict,
  arrivals: GateArrivals | null,
): ArrivalsControl | null {
  switch (verdict.kind) {
    case 'check_in':
    case 'admit':
      return 'first'
    case 'in_residence':
    case 'leaving':
    case 'admitted':
      if (arrivals === null) {
        return null
      }

      return arrivals.toCome > 0 ? 'more' : 'all_in'
    case 'office':
    case 'closed':
      return null
  }
}

/** What the counter opens on: the whole party, everyone still to come, or one more. */
export function defaultArrivalsCount(
  control: ArrivalsControl,
  booked: number,
  arrivals: GateArrivals | null,
): number {
  switch (control) {
    case 'first':
      return booked
    case 'more':
      return arrivals?.toCome ?? booked
    case 'all_in':
      return 1
  }
}

/**
 * What the toast says once a count is in: the count, and — when it went past
 * the booking — whether the office was told. A report that failed is said, so
 * the guard picks up the phone instead of assuming the bell rang.
 */
export function countedSentence(
  arrivals: GateArrivals,
  reported: { extra: number; told: boolean } | null,
): string {
  const line = gateArrivalsLine(arrivals)

  if (reported === null || reported.extra === 0) {
    return line
  }

  return reported.told
    ? `${line} — the office is told`
    : `${line} — the office could not be told, so call them`
}

/**
 * The sum the guard would otherwise do in his head, said as he types (Jeff,
 * 29 September 2026: "how many more are here now?" left him unsure whether he
 * was counting the car or giving a new total). Record arrivals counts the car
 * in front of him and shows what that makes; a correction says what the count
 * goes from and to.
 */
export function arrivalsSumLine(kind: 'more' | 'correct', before: number, count: number): string {
  if (kind === 'more') {
    return `${before} in already + ${count} now = ${before + count} in all`
  }

  return count === before
    ? 'That is the count already.'
    : `The count goes from ${before} to ${count}.`
}

/**
 * What a counter says when the count goes past the booking: always the whole
 * overage against the booking, and then what the office hears of it.
 *
 * The two are different numbers, and saying only the second — who the office
 * has not been told about yet — read as the overage itself: a count of four
 * against two, with one already reported, said "1 more than booked" (Jeff, 29
 * September 2026). Null while the count is within the booking.
 */
export function overBookingNotice(arrivals: GateArrivals, alreadyTold: number): string | null {
  if (arrivals.over === 0) {
    return null
  }

  const over = `That is ${arrivals.over} more than booked (for ${arrivals.booked}).`
  const toTell = extrasToReport(arrivals.arrived, arrivals.booked, alreadyTold)

  if (toTell === 0) {
    return `${over} The office already knows.`
  }

  return toTell === arrivals.over
    ? `${over} The office is told, and sorts out any extra charge.`
    : `${over} The office already knows about ${arrivals.over - toTell}, and is told about ${toTell} more.`
}

/** How a count is entered: the first one, more on top, or a correction of the total. */
export type ArrivalsCountKind = 'first' | 'more' | 'correct'

/**
 * What the counter accepts. There is somebody at the car, so a count of new
 * arrivals is at least one; a correction may go down to none — an office
 * check-in counts everyone, and the guard may truthfully say nobody has come
 * through the gate yet. The ceiling is input validation, as `MAX_EXTRA_GUESTS`
 * is on a report: fifty beyond whatever the booking or the count already
 * holds, never a statement about how many a car can carry.
 */
export function arrivalsCountRange(
  kind: ArrivalsCountKind,
  booked: number,
  arrivals: GateArrivals | null,
): { min: number; max: number } {
  switch (kind) {
    case 'first':
      return { min: 1, max: booked + MAX_EXTRA_GUESTS }
    case 'more':
      return { min: 1, max: (arrivals?.toCome ?? booked) + MAX_EXTRA_GUESTS }
    case 'correct':
      return { min: 0, max: Math.max(booked, arrivals?.arrived ?? 0) + MAX_EXTRA_GUESTS }
  }
}

export type ArrivalsChange = { kind: 'more'; count: number } | { kind: 'correct'; count: number }

/** The new total a count asks for, from the count the guard saw. */
export function arrivalsTargetOf(change: ArrivalsChange, expected: number): number {
  return change.kind === 'more' ? expected + change.count : change.count
}

/**
 * How many people beyond the booking the office has not been told about yet.
 *
 * `alreadyTold` is what the card's *office has been told* line already says
 * (`extraGuestsAwaitingOffice`), so the same three people are never reported
 * twice — after a correction down and a recount, or after a report the guard
 * made before the count existed.
 */
export function extrasToReport(after: number, booked: number, alreadyTold: number): number {
  return Math.max(after - booked - alreadyTold, 0)
}

/**
 * Who settles more people than booked at the first count.
 *
 * `settle` — the guard names the extras by age band, the pass is priced again
 * and he takes the difference, then admits them all: a pass being admitted
 * now (its own day, open, paid), with no transfer waiting to be checked, for a
 * guard who takes cash and whose phone was sent the rates.
 *
 * `tell_office` — everything else: a stay, whose party the office changes; a
 * guard without cash; a pass with a transfer waiting, which may already be in
 * the bank. Check-in and admission are never held up for it.
 */
export type FirstCountExtrasRoute = 'settle' | 'tell_office'

export interface FirstCountExtrasFacts {
  stream: BookingStream
  verdict: GateVerdict
  takesCash: boolean
  /** Nothing owed and no transfer waiting (`!GateBooking.moneyUnsettled`). */
  moneySettled: boolean
  /** The phone was sent the pass rates (`GateContext.passPricing`). */
  hasRates: boolean
}

export function firstCountExtrasRouteOf(facts: FirstCountExtrasFacts): FirstCountExtrasRoute {
  const settles =
    facts.stream === 'day_pass' &&
    facts.verdict.kind === 'admit' &&
    facts.takesCash &&
    facts.moneySettled &&
    facts.hasRates

  return settles ? 'settle' : 'tell_office'
}

/** Whether the extras named by band are exactly the extras counted. */
export function extrasNamedMatch(added: Readonly<Record<string, number>>, extras: number): boolean {
  const counts = Object.values(added)

  return (
    counts.every((count) => Number.isInteger(count) && count >= 0) &&
    counts.reduce((sum, count) => sum + count, 0) === extras
  )
}

/**
 * Why `record_gate_arrivals()` refused, a booking that vanished, and a count
 * outside `arrivalsCountRange` — which the counter refuses first, and the
 * server again.
 */
export type ArrivalsRefusalCode =
  'changed' | 'not_in' | 'not_today' | 'closed' | 'unchanged' | 'not_found' | 'out_of_range'

/** The guard's sentence when a count is refused — every one says what to do next. */
export function arrivalsRefusalSentence(code: ArrivalsRefusalCode, now?: GateArrivals): string {
  switch (code) {
    case 'changed':
      return now
        ? `The count changed a moment ago — now ${gateArrivalsLine(now)}. Refresh the list and look again.`
        : 'The count changed a moment ago. Refresh the list and look again.'
    case 'not_in':
      return 'Nobody has been let in on this booking yet. Refresh the list and look again.'
    case 'not_today':
      return 'This day pass is for another day. Call the office.'
    case 'closed':
      return 'This booking is closed. Call the office.'
    case 'unchanged':
      return 'That is the count already. Nothing to change.'
    case 'not_found':
      return 'That booking no longer exists. Refresh the list.'
    case 'out_of_range':
      return 'That number is more than the gate can record in one go. Count them again.'
  }
}

/**
 * Somebody else checked them in or admitted them first — the office, or a
 * second phone. Their count stands, so the guard is shown it and pointed at
 * the correction inside Record arrivals, rather than told there is nothing
 * more to do while the number he typed goes nowhere.
 */
export function alreadyCountedSentence(
  move: 'check_in' | 'admit',
  arrivals: GateArrivals | null,
): string {
  const already = move === 'check_in' ? 'Already checked in' : 'Already admitted'

  return arrivals
    ? `${already} — ${gateArrivalsLine(arrivals)}. If that is wrong, correct it with Record arrivals.`
    : `${already}. Nothing more to do.`
}
