import { balanceOf } from './balance'
import { isTerminal, type BookingStatus } from './booking-state'
import { formatStayDate, type StayDate } from './dates'
import { depositSecuresBooking } from './deposit'
import type { Cents } from './money'
import type { BookingStream } from './stream'
import { plateKey } from './vehicle'

/**
 * What the guard does with the car at the barrier (capabilities D1, D2, D4).
 *
 * prd.md §12 requirement 6: "The guard's screen displays payment status, so an
 * unpaid cash arrival is flagged and routed rather than waved through. The
 * guard does not confirm payment." So the screen never shows a figure and
 * never asks a guard to judge one. It answers one question per booking — let
 * them in, or send them to the office — and says why in a sentence.
 *
 * ── The rules, and whose they are ─────────────────────────────────────────
 *
 * - **A booking whose deposit is not held in full goes to the office.** That
 *   is `check_in_booking()`'s own refusal, read ahead of the tap so the button
 *   is never offered and then refused (prd.md §11, §12 as built).
 * - **Money still owed on the stay is said, not enforced.** A deposit-secured
 *   guest pays for the stay on arrival (prd.md §9.1), which is the ordinary
 *   case and not a reason to stop a car; the office settles it (§10.7).
 * - **An early arrival goes to the office; a late one is let in.** Arriving a
 *   day early may mean a different unit or an amendment, which is the desk's
 *   call (N31). A guest a day late still has a booking.
 * - **A day pass is seen, never checked in.** Nothing closes a checked-in pass,
 *   so the guard's list shows whether it is paid and stops there.
 *
 * All three decisions are Jeff's of 13 September 2026 and are [A] in prd.md
 * §12. The SQL is the authority for the one that is enforced; this is the
 * courtesy that keeps a guard from pressing a button that will refuse them.
 */

export interface GateDepositFacts {
  /** What the booking quotes. Zero is a real answer: waived, or nothing due. */
  quoted: Cents
  /** The deposit row's figure, or zero where there is no row. */
  held: Cents
  /** Whether that figure has been seen — counted in cash, or verified. */
  collected: boolean
  /** A transfer somebody said they sent, which nobody has verified yet. */
  promised: boolean
}

export interface GateFacts {
  status: BookingStatus
  stream: BookingStream
  /** The first day of the stay, or the day a pass admits them. */
  arrival: StayDate | null
  today: StayDate
  deposit: GateDepositFacts
  total: Cents
  /** Verified payments against the stay; a promised transfer counts for nothing. */
  paid: Cents
}

export type OfficeReason =
  'not_confirmed' | 'deposit_not_in' | 'deposit_promised' | 'deposit_short' | 'early'

export type GateVerdict =
  | { kind: 'check_in'; stayOwed: boolean }
  | { kind: 'office'; reason: OfficeReason }
  | { kind: 'day_pass'; paid: boolean }
  | { kind: 'in_residence' }
  | { kind: 'closed' }

/** What the guard does, first match wins. */
export function gateVerdictOf(facts: GateFacts): GateVerdict {
  if (isTerminal(facts.status)) {
    return { kind: 'closed' }
  }

  if (facts.stream === 'day_pass') {
    return {
      kind: 'day_pass',
      paid: facts.status === 'confirmed' || facts.status === 'checked_in',
    }
  }

  if (facts.status === 'checked_in') {
    return { kind: 'in_residence' }
  }

  // draft, held or awaiting verification: whatever is missing, the office has
  // not confirmed the booking, and that is the whole of what the guard needs.
  if (facts.status !== 'confirmed') {
    return { kind: 'office', reason: 'not_confirmed' }
  }

  // ISO dates compare as strings.
  if (facts.arrival !== null && facts.arrival > facts.today) {
    return { kind: 'office', reason: 'early' }
  }

  // Confirmed with the deposit not whole is rare — an amendment that repriced
  // it, or a booking confirmed before the deposit secured anything — and it is
  // exactly what check_in_booking() refuses.
  if (!depositSecuresBooking(facts.deposit)) {
    return { kind: 'office', reason: depositReasonOf(facts.deposit) }
  }

  return {
    kind: 'check_in',
    stayOwed: balanceOf(facts.total, facts.paid).state === 'outstanding',
  }
}

function depositReasonOf(deposit: GateDepositFacts): OfficeReason {
  if (deposit.collected) {
    return 'deposit_short'
  }

  return deposit.promised ? 'deposit_promised' : 'deposit_not_in'
}

/**
 * The guard's sentence under the badge. Plain words, no figures: the guard
 * does not take money and must not be asked to quote a sum at a car window.
 */
export function gateVerdictSentence(verdict: GateVerdict, arrival: StayDate | null): string {
  switch (verdict.kind) {
    case 'check_in':
      return verdict.stayOwed
        ? 'Deposit is in. The stay is paid at the office.'
        : 'Deposit is in and the stay is paid.'
    case 'office':
      return officeSentence(verdict.reason, arrival)
    case 'day_pass':
      return verdict.paid
        ? 'Day pass is paid.'
        : 'Day pass is not paid yet. Send them to the office.'
    case 'in_residence':
      return 'Already checked in.'
    case 'closed':
      return 'This booking is closed. Send them to the office.'
  }
}

function officeSentence(reason: OfficeReason, arrival: StayDate | null): string {
  switch (reason) {
    case 'not_confirmed':
      return 'The office has not confirmed this booking. Send them to the office.'
    case 'deposit_promised':
      return 'The deposit transfer has not been checked. Send them to the office.'
    case 'deposit_not_in':
      return 'No deposit has been taken. Send them to the office.'
    case 'deposit_short':
      return 'Only part of the deposit is in. Send them to the office.'
    case 'early':
      return arrival
        ? `Booked from ${formatStayDate(arrival)}. Send them to the office.`
        : 'This booking starts on a later day. Send them to the office.'
  }
}

/**
 * The guard's sentence when a check-in is refused after the tap — the list
 * was a few minutes old, or somebody at the desk moved the booking first.
 *
 * Every sentence tells the guard what to do next, because "an error occurred"
 * at a barrier with a queue behind the car is no instruction at all.
 */
export function gateRefusalSentence(code: string, options: { alreadyIn?: boolean } = {}): string {
  if (options.alreadyIn) {
    return 'Already checked in. Nothing more to do.'
  }

  switch (code) {
    case 'deposit_not_secured':
      return 'The deposit is not in. Send them to the office.'
    case 'not_found':
      return 'That booking no longer exists. Refresh the list.'
    default:
      return 'This booking changed a moment ago. Refresh the list and look again.'
  }
}

export interface GateSearchable {
  reference: string
  guestName: string
  vehicles: readonly string[]
}

/**
 * Whether a booking matches what the guard typed: part of a plate, part of the
 * guest's name, or part of the reference. An empty box matches everything.
 *
 * `gate_booking_search()` answers the same question for the bookings that are
 * not on today's list, with the same plate rule.
 */
export function matchesGateSearch(term: string, row: GateSearchable): boolean {
  const words = term.trim().toLowerCase()

  if (words.length === 0) {
    return true
  }

  if (row.guestName.toLowerCase().includes(words) || row.reference.toLowerCase().includes(words)) {
    return true
  }

  const key = plateKey(term)

  // A term with no letters or digits in it has no key, and an empty key would
  // be a substring of every plate.
  if (key.length === 0) {
    return false
  }

  return (
    plateKey(row.reference).includes(key) ||
    row.vehicles.some((registration) => plateKey(registration).includes(key))
  )
}
