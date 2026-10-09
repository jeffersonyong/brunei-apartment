import { formatCents, type Cents } from '@/lib/domain/money'
import type { SlipBox } from '@/lib/domain/slip-boxes'
import type { BookingStream } from '@/lib/domain/stream'

/**
 * What the upload boxes on the guest's page say (capabilities A6, A7, A12).
 *
 * Beside the page rather than in it so every branch has a test: the boxes are
 * the guest's only word on whether we have their documents, and a wrong one
 * either sends them hunting for a file they already sent or tells them they
 * are done when they are not.
 */

/**
 * What an upload box says once its file is here and nothing more is wanted
 * from it — the IC's and every slip's alike, so "done" reads one way.
 */
export const NOTHING_MORE =
  'There is nothing more you need to do here. Only send another if the one you sent is hard to read.'

export interface SlipCopyFacts {
  stream: BookingStream
  /** What a checked deposit is still short of its quote. Zero otherwise. */
  shortfall: Cents
  /** When the deposit was checked against the bank, or null. */
  depositCheckedAt: string | null
  payments: readonly { id: string; expected: Cents }[]
}

export interface SlipBoxCopy {
  title: string
  description: string
  /** When the slip the box reports arrived — null while it is still asking. */
  onFileSince: string | null
}

/**
 * What each slip box says, named for the transfer it is evidence of.
 *
 * "Your transfer slip" was true and still left the guest to work out which
 * transfer: one who sent only the deposit, and the rest later, has two (Jeff,
 * 9 October 2026). So the deposit's box says it is the deposit's, and the
 * "everything now" box says it is both — the slip is of the one transfer that
 * paid them, even when the deposit half has been checked first. A first box
 * whose one transfer is the whole booking — a day pass, a stay quoting no
 * deposit — has nothing to tell apart, and keeps the plain words.
 *
 * Once a slip is in, the box drops the "Send us" and says there is nothing
 * more to do, as the IC's does.
 */
export function slipBoxCopy(box: SlipBox, facts: SlipCopyFacts): SlipBoxCopy {
  if (box.covers !== 'payment' && facts.shortfall > 0) {
    return shortDepositCopy(box, facts)
  }

  const paidFor = slipPaidFor(box, facts.stream)

  if (box.onFileSince) {
    return {
      title: paidFor ? `The transfer slip ${paidFor}` : 'Your transfer slip',
      description: NOTHING_MORE,
      onFileSince: box.onFileSince,
    }
  }

  return {
    title: paidFor ? `Send us the transfer slip ${paidFor}` : 'Send us your transfer slip',
    description: slipAsk(box, facts.payments),
    onFileSince: null,
  }
}

/**
 * A deposit checked and found short (capability B16): the callout above asks
 * for the rest of it, so the box asks for that transfer's slip.
 *
 * Only a slip that arrived after the check is the slip of the rest — one from
 * before it is the first transfer's, already matched against the bank, and
 * reporting it as done would tell the guest they had sent something they have
 * not. Once the rest's slip is in, the box reads as done like any other.
 */
function shortDepositCopy(box: SlipBox, facts: SlipCopyFacts): SlipBoxCopy {
  const sentSinceTheCheck =
    box.onFileSince !== null &&
    facts.depositCheckedAt !== null &&
    Date.parse(box.onFileSince) > Date.parse(facts.depositCheckedAt)

  if (sentSinceTheCheck) {
    return {
      title: 'The transfer slip for the rest of your deposit',
      description: NOTHING_MORE,
      onFileSince: box.onFileSince,
    }
  }

  return {
    title: 'Send us the transfer slip for the rest of your deposit',
    description: `Once you have sent the BND ${formatCents(facts.shortfall)} still outstanding, the slip will help us verify it faster.`,
    onFileSince: null,
  }
}

/**
 * "for your deposit", and the like — or null for a first box whose transfer is
 * the whole booking. Only a stay sends the stay with its deposit, so another
 * stream's pair is left unnamed rather than misnamed.
 */
function slipPaidFor(box: SlipBox, stream: BookingStream): string | null {
  if (box.kind === 'rest') {
    // Named for what it is rather than "the rest": a desk booking can carry a
    // transfer for the stay made before its deposit, which is not the rest of
    // anything (lib/domain/slip-boxes.ts).
    return 'for your stay'
  }

  if (box.covers === 'deposit') {
    return 'for your deposit'
  }

  return box.covers === 'deposit_and_payment' && stream === 'short_stay'
    ? 'for your deposit and stay'
    : null
}

/** Why a box with no slip yet is worth filling: the first transfer, or a later one. */
function slipAsk(box: SlipBox, payments: SlipCopyFacts['payments']): string {
  if (box.kind === 'first') {
    return 'Your bank transfer slip will help us verify your transfer faster.'
  }

  const payment = payments.find((candidate) => `payment:${candidate.id}` === box.key)

  return payment
    ? `The slip for the BND ${formatCents(payment.expected)} you transferred for the stay.`
    : 'The slip for the transfer you made for the stay.'
}
