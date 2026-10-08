import { balanceOf } from './balance'
import type { BookingStatus } from './booking-state'
import type { StayDate } from './dates'
import type { Cents } from './money'
import type { BookingStream } from './stream'

/**
 * Paying the rest of a stay by transfer before arriving (capability A12,
 * Jason's team, 8 October 2026; open-questions.md N61).
 *
 * A guest who chose "Just the deposit" was told the stay is settled on
 * arrival, and had no way to send it earlier: nothing on their page took a
 * second transfer, and a second slip replaced the deposit's. Now, from the
 * moment they have told us about the deposit until the day before they arrive,
 * their page offers the rest — the whole of what is still owed, never part of
 * it, so this is the stated policy (a stay is paid in full) happening sooner
 * and not [N16](open-questions.md).
 *
 * **On the day itself it is paid at the gate**, where the guard takes it
 * (D6): a transfer sent that morning would still be waiting to be checked when
 * the car arrives, and the gate would have to send the guest to the office.
 *
 * This mirrors `submit_public_balance_transfer()`'s guards, which are what
 * decide. The page and the confirmation email render on it; the write never
 * trusts it.
 */

export type RestTransferOffer =
  /** The page offers a transfer of `amount`, the whole of what is owed. */
  | { kind: 'offer'; amount: Cents }
  /** A transfer for the stay is already waiting to be checked. */
  | { kind: 'pending' }
  /** Owed, and too late to transfer: it is paid on arrival. */
  | { kind: 'on_arrival'; amount: Cents }
  /** Nothing to say about the rest. */
  | { kind: 'none' }

export interface RestTransferFacts {
  stream: BookingStream
  status: BookingStatus
  /**
   * A deposit row exists: the guest told us they sent it, or the desk took
   * one. A stay with nothing securing it has nothing "rest" can follow.
   */
  hasDeposit: boolean
  total: Cents
  /** Verified payments only — a promised transfer counts for nothing (B13). */
  paid: Cents
  /** The first night, or null where the booking has no stay. */
  checkIn: StayDate | null
  /** A transfer for the stay is waiting to be checked. */
  hasPendingStayTransfer: boolean
}

/** From "I have made the transfer" until the guest is through the gate. */
const OFFERED_FROM: readonly BookingStatus[] = ['awaiting_payment_verification', 'confirmed']

export function restTransferOfferOf(facts: RestTransferFacts, today: StayDate): RestTransferOffer {
  if (
    facts.stream !== 'short_stay' ||
    facts.checkIn === null ||
    !facts.hasDeposit ||
    !OFFERED_FROM.includes(facts.status)
  ) {
    return { kind: 'none' }
  }

  if (facts.hasPendingStayTransfer) {
    return { kind: 'pending' }
  }

  const { outstanding } = balanceOf(facts.total, facts.paid)

  if (outstanding <= 0) {
    return { kind: 'none' }
  }

  // ISO dates compare correctly as strings.
  return facts.checkIn > today
    ? { kind: 'offer', amount: outstanding }
    : { kind: 'on_arrival', amount: outstanding }
}
