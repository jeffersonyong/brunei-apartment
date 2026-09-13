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
 * ── A stay ────────────────────────────────────────────────────────────────
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
 * - **Who checks the guest in is not decided here.** The verdict says a stay
 *   is ready to be checked in; whether the person holding the phone may do it
 *   is their permission. Since N54 the keys are taken to be at the counter, so
 *   the desk checks stays in and a guard without `booking.check_in` is told the
 *   office will — the sentence changes with the reader, the verdict does not.
 *
 * ── A day pass (N40, revised by N54) ──────────────────────────────────────
 *
 * - **A paid pass is admitted on its own date, and admitting closes it.** A
 *   pass has no unit to leave, so nothing would ever close it later; `admit`
 *   moves it `confirmed → completed`, a ticket torn at the door.
 * - **Paid means paid in full.** The gate is the one place a visitor who paid
 *   ahead meets staff, and admitting closes the booking, so a pass confirmed on
 *   a transfer that came in short goes to the office rather than in.
 * - **Any other day goes to the office**, before or after. A pass admits one.
 * - **An admitted pass stays on the list as admitted**, because day visitors
 *   go out for lunch and come back.
 *
 * All of these are [A] in prd.md §12, Jeff's of 13 and 26 September 2026. The
 * SQL is the authority for what is enforced — `check_in_booking()` and
 * `admit_day_pass()` — and this is the courtesy that keeps a guard from
 * pressing a button that will refuse them.
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
  /** Verified payments against the booking; a promised transfer counts for nothing. */
  paid: Cents
}

export type OfficeReason =
  | 'not_confirmed'
  | 'deposit_not_in'
  | 'deposit_promised'
  | 'deposit_short'
  | 'early'
  | 'pass_unpaid'
  | 'pass_other_day'

export type GateVerdict =
  /** A stay ready to be checked in, by whoever may. */
  | { kind: 'check_in'; stayOwed: boolean }
  /** A day pass ready to be admitted. */
  | { kind: 'admit' }
  /** A day pass already admitted today. */
  | { kind: 'admitted' }
  | { kind: 'office'; reason: OfficeReason }
  | { kind: 'in_residence' }
  | { kind: 'closed' }

/** What the guard does, first match wins. */
export function gateVerdictOf(facts: GateFacts): GateVerdict {
  if (facts.stream === 'day_pass') {
    return passVerdictOf(facts)
  }

  if (isTerminal(facts.status)) {
    return { kind: 'closed' }
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

/** The same question for a day pass, which quotes no deposit and has no unit. */
function passVerdictOf(facts: GateFacts): GateVerdict {
  const isItsDay = facts.arrival === facts.today

  // Admitting closes a pass, so a completed pass on its own date is one in use
  // today. `checked_in` is the desk's check-in from before passes were
  // admitted: the same fact, recorded the old way.
  if (facts.status === 'completed' || facts.status === 'checked_in') {
    return isItsDay ? { kind: 'admitted' } : { kind: 'closed' }
  }

  if (isTerminal(facts.status)) {
    return { kind: 'closed' }
  }

  if (facts.status !== 'confirmed') {
    return { kind: 'office', reason: 'pass_unpaid' }
  }

  if (!isItsDay) {
    return { kind: 'office', reason: 'pass_other_day' }
  }

  // Unlike a stay's balance, this one stops the car: admitting closes the
  // booking, and nobody meets a day visitor again to collect what is owed.
  if (balanceOf(facts.total, facts.paid).state === 'outstanding') {
    return { kind: 'office', reason: 'pass_unpaid' }
  }

  return { kind: 'admit' }
}

function depositReasonOf(deposit: GateDepositFacts): OfficeReason {
  if (deposit.collected) {
    return 'deposit_short'
  }

  return deposit.promised ? 'deposit_promised' : 'deposit_not_in'
}

export interface GateSentenceOptions {
  /** Whether the reader may check a stay in (`booking.check_in`). */
  mayCheckIn: boolean
}

/**
 * The guard's sentence under the badge. Plain words, no figures: the guard
 * does not take money and must not be asked to quote a sum at a car window.
 */
export function gateVerdictSentence(
  verdict: GateVerdict,
  arrival: StayDate | null,
  options: GateSentenceOptions,
): string {
  switch (verdict.kind) {
    case 'check_in':
      if (!options.mayCheckIn) {
        // The desk checks the guest in and settles the stay in the same
        // conversation (N54), so what is owed is the office's to say.
        return 'All in order. They check in at the office.'
      }

      return verdict.stayOwed
        ? 'Deposit is in. The stay is paid at the office.'
        : 'Deposit is in and the stay is paid.'
    case 'admit':
      return 'Day pass is paid for today. Check the number of people against the pass.'
    case 'admitted':
      return 'Admitted today. They may come and go.'
    case 'office':
      return officeSentence(verdict.reason, arrival)
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
    case 'pass_unpaid':
      return 'Day pass is not paid yet. Send them to the office.'
    case 'pass_other_day':
      return arrival
        ? `Day pass is for ${formatStayDate(arrival)}. Send them to the office.`
        : 'This day pass is for another day. Send them to the office.'
  }
}

export interface GateRefusalOptions {
  /** The booking was checked in by somebody else a moment ago. */
  alreadyIn?: boolean
  /** The pass was admitted by somebody else a moment ago. */
  alreadyAdmitted?: boolean
}

/**
 * The guard's sentence when a check-in or an admission is refused after the
 * tap — the list was a few minutes old, or somebody at the desk moved the
 * booking first.
 *
 * Every sentence tells the guard what to do next, because "an error occurred"
 * at a barrier with a queue behind the car is no instruction at all.
 */
export function gateRefusalSentence(code: string, options: GateRefusalOptions = {}): string {
  if (options.alreadyIn) {
    return 'Already checked in. Nothing more to do.'
  }

  if (options.alreadyAdmitted) {
    return 'Already admitted. Nothing more to do.'
  }

  switch (code) {
    case 'deposit_not_secured':
      return 'The deposit is not in. Send them to the office.'
    case 'not_today':
      return 'This day pass is for another day. Send them to the office.'
    case 'owed':
      return 'Day pass is not paid yet. Send them to the office.'
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
