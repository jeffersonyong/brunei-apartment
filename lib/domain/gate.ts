import { balanceOf, canSettle } from './balance'
import type { PropertyConfig } from './config'
import { isTerminal, type BookingStatus } from './booking-state'
import { formatStayDate, type StayDate } from './dates'
import { depositSecuresBooking, depositShortfallOf } from './deposit'
import type { Cents } from './money'
import type { BookingStream } from './stream'
import { isDueOut } from './turnover'
import { plateKey } from './vehicle'

/**
 * What the guard does with each booking at the gate (capabilities D1–D6).
 *
 * The guard is the front desk (N54, answered by Jason on 14 September 2026):
 * he hands the keys over, takes them back, admits day visitors and takes the
 * cash a guest still owes, and he cannot make a booking — he calls the office.
 * So the screen answers one question per booking, what happens next and who
 * does it, and says why in a sentence.
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
 * ── Cash ──────────────────────────────────────────────────────────────────
 *
 * What the gate may take is `gateCashDueOf`, from the same facts. It is only
 * ever shown to a reader who holds `payment.record_cash`, and lib/db/gate.ts
 * only reads it for one.
 *
 * The SQL is the authority for what is enforced — `check_in_booking()`,
 * `admit_day_pass()`, `transition_booking()` and the money functions — and
 * this is the courtesy that keeps the guard from pressing a button that will
 * refuse him. Who does what is Jason's [C]; the rest is [A] in prd.md §12.
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

/**
 * What the gate may take in cash for a booking (capability D6, N54).
 *
 * The guard is handed pending cash, and the card decides what it is for so he
 * never has to tell a deposit from a payment. These are the portal's rules at
 * the barrier, not new ones:
 *
 * - **The deposit first**, because it is what secures a booking (prd.md §9.1).
 *   One not taken, or only promised, is taken whole — cash against a standing
 *   promise fulfils it, in `record_booking_deposit()`. One that arrived short is
 *   topped up by what is missing.
 * - **Then the stay**, for whatever is owed on it. A guest already checked in
 *   still owes it, and pays before being checked out: a checked-out booking
 *   takes no payment at all.
 * - **Never while a transfer waits to be checked.** It may already be in the
 *   bank, and a payment cannot be withdrawn once recorded — the booking's Money
 *   card refuses the same way. A deposit is still taken while a transfer for the
 *   *stay* waits, because cash for the deposit settles a different row.
 * - **Nothing for an early arrival or a pass for another day**, which are the
 *   office's, and nothing for a closed booking.
 */
export type GateCashDue =
  /** The whole deposit. `promised` says the guest claimed to have transferred it. */
  | { kind: 'deposit'; amount: Cents; promised: boolean }
  /** What is missing off a deposit that arrived short. */
  | { kind: 'deposit_shortfall'; amount: Cents }
  /** What is still owed on the stay. */
  | { kind: 'stay'; amount: Cents }
  /** What is still owed on a day pass. */
  | { kind: 'pass'; amount: Cents }

/** What each kind of cash is called beside its figure. */
export const GATE_CASH_LABELS: Readonly<Record<GateCashDue['kind'], string>> = {
  deposit: 'Security deposit',
  deposit_shortfall: 'Rest of the deposit',
  stay: 'The stay',
  pass: 'Day pass',
}

export function gateCashDueOf(facts: GateFacts): GateCashDue | null {
  if (isTerminal(facts.status)) {
    return null
  }

  const balance = balanceOf(facts.total, facts.paid)

  if (facts.stream === 'day_pass') {
    // A pass checked in the old way is in use, and one for another day is the
    // office's.
    if (facts.status === 'checked_in' || facts.arrival !== facts.today || facts.transferPending) {
      return null
    }

    return canSettle(balance) ? { kind: 'pass', amount: balance.outstanding } : null
  }

  if (facts.status !== 'checked_in') {
    // ISO dates compare as strings.
    if (facts.arrival === null || facts.arrival > facts.today) {
      return null
    }

    if (!depositSecuresBooking(facts.deposit)) {
      return facts.deposit.collected
        ? {
            kind: 'deposit_shortfall',
            amount: depositShortfallOf(facts.deposit.quoted, facts.deposit.held, true),
          }
        : { kind: 'deposit', amount: facts.deposit.quoted, promised: facts.deposit.promised }
    }
  }

  if (facts.transferPending) {
    return null
  }

  return canSettle(balance) ? { kind: 'stay', amount: balance.outstanding } : null
}

/**
 * Whether anything about a booking's money is not settled yet — the card the
 * guard should be careful with (Jason's team, 19 September 2026).
 *
 * A deposit not held in full (not taken, promised by a transfer nobody has
 * checked, or short), anything still owed on the stay or the pass, or a
 * transfer waiting to be checked. Jason's example is the ordinary one: BND 100
 * down online and the rest to pay at the gate.
 *
 * **Decided from the booking alone**, like the verdict. The colour is the one
 * thing about money every reader at the gate is shown, including a phone
 * signed in without `payment.record_cash`, which never receives a figure.
 *
 * A closed booking is never unsettled here: it takes no more money, at the
 * gate or anywhere, so there is nothing for the guard to be careful about. An
 * overpaid booking is not either — that is a refund, and the office's.
 */
export function gateMoneyUnsettledOf(facts: GateFacts): boolean {
  if (isTerminal(facts.status)) {
    return false
  }

  if (facts.stream !== 'day_pass' && !depositSecuresBooking(facts.deposit)) {
    return true
  }

  return facts.transferPending || balanceOf(facts.total, facts.paid).state === 'outstanding'
}

/**
 * Whether the guard may add visitors he counted to a day pass himself, and
 * take the difference in cash (Jeff, 19 September 2026): a pass on its own day
 * that is paid and ready to admit, or still to pay at the gate — the passes he
 * could already take cash for. An admitted pass is closed and takes no more
 * money, and one waiting on a transfer is the office's; for those the guard
 * tells the office instead.
 */
export function mayAddVisitorsAtGate(verdict: GateVerdict): boolean {
  return verdict.kind === 'admit' || (verdict.kind === 'office' && verdict.reason === 'pass_unpaid')
}

/**
 * Whether the cash a guard confirmed is still the cash owed, asked again just
 * before it is recorded.
 *
 * The guard against taking the same money twice. A guard who presses again
 * after an answer was lost on one bar of signal finds it already recorded, and
 * one looking at a card a colleague has since settled is told it moved. The
 * database refuses a second deposit or an overshooting top-up on its own; it
 * records a second stay payment happily once a reason is typed, which is why
 * this is asked first rather than left to the amount rule.
 */
export function gateCashStalenessOf(
  opened: { kind: GateCashDue['kind']; amount: Cents },
  now: GateCashDue | null,
): 'already_recorded' | 'changed' | null {
  if (now === null) {
    return 'already_recorded'
  }

  if (now.kind === opened.kind) {
    if (now.amount === opened.amount) {
      return null
    }

    return now.amount < opened.amount ? 'already_recorded' : 'changed'
  }

  // A deposit taken moves the card on to the stay, and nothing moves it back.
  const tookTheDeposit =
    (opened.kind === 'deposit' || opened.kind === 'deposit_shortfall') && now.kind === 'stay'

  return tookTheDeposit ? 'already_recorded' : 'changed'
}

/** What the gate knows about the property, for the party line and the pass prices. */
export interface GateContext {
  /** Guests at or under this age are not counted towards a stay (prd.md §8.2). */
  exemptAgeMax: number
  /**
   * The rates, for a reader who may add visitors to a pass and take the cash
   * for them (`day_pass.admit` and `payment.record_cash`). Null for anybody
   * else, so their phone carries no prices.
   */
  passPricing: PropertyConfig | null
}

export function gateContextOf(config: PropertyConfig, mayAddToPasses: boolean): GateContext {
  return {
    exemptAgeMax: config.paxExemptAgeMax,
    passPricing: mayAddToPasses ? config : null,
  }
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
  /**
   * Whether the reader may take cash **and** this card has cash due. The
   * sentence then says what is missing and leaves what to do to the money
   * beside it, instead of sending the guard to the office.
   */
  takesCash: boolean
}

/**
 * The guard's sentence under the badge: what to do, and why, in plain words.
 * Never a figure — what is owed is shown beside it, to whoever may take it.
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

      return checkInSentence(verdict.stay, options.takesCash)
    case 'leaving':
      return leavingSentence(verdict, dates.departure, options)
    case 'admit':
      return 'Day pass is paid for today. Check the number of people against the pass.'
    case 'admitted':
      return 'Admitted today. They may come and go.'
    case 'office':
      return officeSentence(verdict.reason, dates.arrival, options.takesCash)
    case 'in_residence':
      return 'Already checked in.'
    case 'closed':
      return 'This booking is closed. Call the office.'
  }
}

function checkInSentence(stay: StayMoney, takesCash: boolean): string {
  switch (stay) {
    case 'paid':
      return 'Deposit is in and the stay is paid.'
    case 'owed':
      return takesCash
        ? 'Deposit is in. The stay is not paid yet.'
        : 'Deposit is in. The office takes payment for the stay.'
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
      return options.takesCash
        ? `${due} Take the stay payment before they leave. ${keys}`
        : `${due} The stay is not paid. Call the office before they leave.`
    case 'awaiting_transfer':
      return `${due} ${keys} A transfer for the stay is still waiting to be checked.`
  }
}

function officeSentence(
  reason: OfficeReason,
  arrival: StayDate | null,
  takesCash: boolean,
): string {
  // What is missing, and — unless the guard can take it himself — who to call.
  const unlessTaken = (fact: string): string => (takesCash ? fact : `${fact} Call the office.`)

  switch (reason) {
    case 'not_confirmed':
      return 'This booking is not confirmed yet. Call the office.'
    case 'deposit_promised':
      return unlessTaken(
        takesCash
          ? 'They say the deposit was sent by bank transfer, and nobody has checked it.'
          : 'The deposit transfer has not been checked.',
      )
    case 'deposit_not_in':
      return unlessTaken('No deposit has been taken yet.')
    case 'deposit_short':
      return unlessTaken('Only part of the deposit is in.')
    case 'early':
      return arrival
        ? `Booked from ${formatStayDate(arrival)}. Call the office.`
        : 'This booking starts on a later day. Call the office.'
    case 'stay_unpaid':
      return unlessTaken('Nothing has been paid for this stay yet.')
    case 'transfer_pending':
      return 'A transfer for this booking is waiting to be checked. Call the office.'
    case 'pass_unpaid':
      return unlessTaken('Day pass is not paid yet.')
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
    case 'already_recorded':
      return 'Already recorded. Refresh the list before taking any more money.'
    case 'changed':
      return 'What is owed changed a moment ago. Refresh the list and look again.'
    case 'booking_closed':
      return 'This booking is closed, so no money can be taken against it. Call the office.'
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
