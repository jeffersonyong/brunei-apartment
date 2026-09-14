import { balanceOf } from './balance'
import { isTerminal, type BookingStatus } from './booking-state'
import { formatStayDate, type StayDate } from './dates'
import { depositSecuresBooking } from './deposit'
import type { Cents } from './money'
import type { BookingStream } from './stream'
import { isDueOut } from './turnover'
import { plateKey } from './vehicle'

/**
 * What the guard does with each booking at the gate (capabilities D1–D5).
 *
 * The guard is the front desk (N54, answered by Jason on 14 September 2026):
 * he hands the keys over, takes them back and admits day visitors, and he
 * cannot make a booking — he calls the office. So the screen answers one
 * question per booking, what happens next and who does it, and says why in a
 * sentence.
 *
 * The verdict is decided from the booking's facts alone. What the person
 * holding the phone may do about it is their permission, which changes the
 * sentence and the buttons and never the verdict.
 *
 * ── A stay, first match wins ──────────────────────────────────────────────
 *
 * 1. **Closed** bookings have no move left.
 * 2. **A guest checked in** is *leaving* once their last day as booked is today
 *    or has passed — the rule the cleaner's list uses (`isDueOut`) — and *in
 *    residence* before that. A guest going before their last day is checked
 *    out by the office: the gate cannot tell leaving from out for dinner, and a
 *    check-out cannot be undone.
 * 3. **An early arrival** goes to the office. Arriving a day early may mean a
 *    different unit or an amendment (N31); a guest a day late is let in.
 * 4. **A deposit not held in full** is named before anything else about the
 *    booking — not taken, promised by a transfer nobody has checked, or short
 *    — because it is the thing that secures a booking (prd.md §9.1, §11) and
 *    what `check_in_booking()` refuses.
 * 5. **A booking still unconfirmed** with its deposit in is waiting on a
 *    transfer somebody has to check, or on the stay itself.
 * 6. Otherwise it is **checked in**, and whether the stay is paid is said
 *    beside it. Money owed on the stay does not stop the car: a deposit-secured
 *    guest pays for the stay on arrival (prd.md §9.1).
 *
 * ── A day pass (N40, N54) ─────────────────────────────────────────────────
 *
 * - **A paid pass is admitted on its own date, and admitting closes it.** An
 *   admitted pass stays on the list for the day, because visitors go out and
 *   come back.
 * - **Any other day goes to the office**, before or after.
 * - **Paid means paid in full.** Admitting closes the booking, and nobody meets
 *   a day visitor again to collect what is owed.
 *
 * The SQL is the authority for what is enforced — `check_in_booking()`,
 * `admit_day_pass()` and `transition_booking()` — and this is the courtesy
 * that keeps the guard from pressing a button that will refuse him. Who does
 * what is Jason's [C]; the rest is [A] in prd.md §12.
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
  /** The stay's last day as booked. Null for a day pass. */
  departure: StayDate | null
  today: StayDate
  deposit: GateDepositFacts
  total: Cents
  /** Verified payments against the booking; a promised transfer counts for nothing. */
  paid: Cents
  /**
   * A bank transfer against the booking that nobody has checked yet. It may
   * already be in the bank, which is why a booking waiting on one is the
   * office's until somebody has looked.
   */
  transferPending: boolean
}

/** Where the money for a stay stands, in the words the gate needs. */
export type StayMoney = 'paid' | 'owed' | 'awaiting_transfer'

export type OfficeReason =
  | 'not_confirmed'
  | 'deposit_not_in'
  | 'deposit_promised'
  | 'deposit_short'
  | 'early'
  | 'stay_unpaid'
  | 'transfer_pending'
  | 'pass_unpaid'
  | 'pass_other_day'

export type GateVerdict =
  /** A stay ready to be checked in, by whoever may. */
  | { kind: 'check_in'; stay: StayMoney }
  /** A guest checked in whose last day is today, or has passed. */
  | { kind: 'leaving'; stay: StayMoney; overdue: boolean }
  /** A guest checked in who is not due out yet. */
  | { kind: 'in_residence' }
  /** A day pass ready to be admitted. */
  | { kind: 'admit' }
  /** A day pass already admitted today. */
  | { kind: 'admitted' }
  | { kind: 'office'; reason: OfficeReason }
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
    const { departure, today } = facts

    // ISO dates compare as strings.
    return departure !== null && isDueOut(departure, today)
      ? { kind: 'leaving', stay: stayMoneyOf(facts), overdue: departure < today }
      : { kind: 'in_residence' }
  }

  if (facts.arrival !== null && facts.arrival > facts.today) {
    return { kind: 'office', reason: 'early' }
  }

  if (!depositSecuresBooking(facts.deposit)) {
    return { kind: 'office', reason: depositReasonOf(facts.deposit) }
  }

  // Draft, held or awaiting verification, with the deposit in.
  if (facts.status !== 'confirmed') {
    return { kind: 'office', reason: unconfirmedReasonOf(facts) }
  }

  return { kind: 'check_in', stay: stayMoneyOf(facts) }
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

  if (!isItsDay) {
    return { kind: 'office', reason: 'pass_other_day' }
  }

  // Unlike a stay's balance, this one stops the car: admitting closes the
  // booking, and nobody meets a day visitor again to collect what is owed.
  const unpaid =
    facts.status !== 'confirmed' || balanceOf(facts.total, facts.paid).state === 'outstanding'

  if (unpaid) {
    return { kind: 'office', reason: facts.transferPending ? 'transfer_pending' : 'pass_unpaid' }
  }

  return { kind: 'admit' }
}

function depositReasonOf(deposit: GateDepositFacts): OfficeReason {
  if (deposit.collected) {
    return 'deposit_short'
  }

  return deposit.promised ? 'deposit_promised' : 'deposit_not_in'
}

function unconfirmedReasonOf(facts: GateFacts): OfficeReason {
  if (facts.transferPending) {
    return 'transfer_pending'
  }

  return balanceOf(facts.total, facts.paid).state === 'outstanding'
    ? 'stay_unpaid'
    : 'not_confirmed'
}

function stayMoneyOf(facts: GateFacts): StayMoney {
  if (balanceOf(facts.total, facts.paid).state !== 'outstanding') {
    return 'paid'
  }

  return facts.transferPending ? 'awaiting_transfer' : 'owed'
}

/** The two days a sentence may name. A `GateBooking` is one. */
export interface GateDates {
  arrival: StayDate | null
  departure: StayDate | null
}

export interface GateSentenceOptions {
  /** Whether the reader may check a stay in (`booking.check_in`). */
  mayCheckIn: boolean
  /** Whether the reader may check a stay out (`booking.check_out`). */
  mayCheckOut: boolean
}

/**
 * The guard's sentence under the badge: what to do, and why, in plain words
 * and without a figure.
 */
export function gateVerdictSentence(
  verdict: GateVerdict,
  dates: GateDates,
  options: GateSentenceOptions,
): string {
  switch (verdict.kind) {
    case 'check_in':
      if (!options.mayCheckIn) {
        return 'All in order. Call the office to check them in.'
      }

      return checkInSentence(verdict.stay)
    case 'leaving':
      return leavingSentence(verdict, dates.departure, options)
    case 'admit':
      return 'Day pass is paid for today. Check the number of people against the pass.'
    case 'admitted':
      return 'Admitted today. They may come and go.'
    case 'office':
      return officeSentence(verdict.reason, dates.arrival)
    case 'in_residence':
      return 'Already checked in.'
    case 'closed':
      return 'This booking is closed. Call the office.'
  }
}

function checkInSentence(stay: StayMoney): string {
  switch (stay) {
    case 'paid':
      return 'Deposit is in and the stay is paid.'
    case 'owed':
      return 'Deposit is in. The office takes payment for the stay.'
    case 'awaiting_transfer':
      return 'Deposit is in. A transfer for the stay is waiting to be checked.'
  }
}

function leavingSentence(
  verdict: Extract<GateVerdict, { kind: 'leaving' }>,
  departure: StayDate | null,
  options: GateSentenceOptions,
): string {
  const due =
    verdict.overdue && departure !== null
      ? `Was due out ${formatStayDate(departure)}.`
      : 'Due out today.'
  const keys = options.mayCheckOut
    ? 'Check them out when they hand back the keys.'
    : 'Call the office when they hand back the keys.'

  switch (verdict.stay) {
    case 'paid':
      return `${due} ${keys}`
    case 'owed':
      // A checked-out booking takes no more payments, so this is the last
      // moment the stay's money can be recorded against it.
      return `${due} The stay is not paid. Call the office before they leave.`
    case 'awaiting_transfer':
      return `${due} ${keys} A transfer for the stay is still waiting to be checked.`
  }
}

function officeSentence(reason: OfficeReason, arrival: StayDate | null): string {
  switch (reason) {
    case 'not_confirmed':
      return 'This booking is not confirmed yet. Call the office.'
    case 'deposit_promised':
      return 'The deposit transfer has not been checked. Call the office.'
    case 'deposit_not_in':
      return 'No deposit has been taken. Call the office.'
    case 'deposit_short':
      return 'Only part of the deposit is in. Call the office.'
    case 'early':
      return arrival
        ? `Booked from ${formatStayDate(arrival)}. Call the office.`
        : 'This booking starts on a later day. Call the office.'
    case 'stay_unpaid':
      return 'Nothing has been paid for this stay yet. Call the office.'
    case 'transfer_pending':
      return 'A transfer for this booking is waiting to be checked. Call the office.'
    case 'pass_unpaid':
      return 'Day pass is not paid yet. Call the office.'
    case 'pass_other_day':
      return arrival
        ? `Day pass is for ${formatStayDate(arrival)}. Call the office.`
        : 'This day pass is for another day. Call the office.'
  }
}

export interface GateRefusalOptions {
  /** The booking was checked in by somebody else a moment ago. */
  alreadyIn?: boolean
  /** The pass was admitted by somebody else a moment ago. */
  alreadyAdmitted?: boolean
  /** The guest was checked out by somebody else a moment ago. */
  alreadyOut?: boolean
}

/**
 * The guard's sentence when a move is refused after the tap — the list was a
 * few minutes old, or somebody else moved the booking first.
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

  if (options.alreadyOut) {
    return 'Already checked out. Nothing more to do.'
  }

  switch (code) {
    case 'deposit_not_secured':
      return 'The deposit is not in. Call the office.'
    case 'not_today':
      return 'This day pass is for another day. Call the office.'
    case 'owed':
      return 'Day pass is not paid yet. Call the office.'
    case 'not_due_out':
      return 'They are not due to leave today. Call the office.'
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
