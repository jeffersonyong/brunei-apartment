import type { Cents } from './money'
import type { PaymentMethod, PaymentStatus } from './payment'

/**
 * Which transfer a guest's slip is evidence of (capabilities A6 and A12).
 *
 * ── The bug this replaces ─────────────────────────────────────────────────
 *
 * A slip from the guest's page was filed against every transfer on the
 * booking, and a guest's second upload replaced their own first. While a
 * booking only ever had one transfer that was the same thing. Once a guest can
 * send the rest of the stay as a second transfer (A12), it meant the slip for
 * the rest overwrote the deposit's — the evidence a clerk matches the deposit
 * against, gone.
 *
 * ── One box per transfer the guest made ───────────────────────────────────
 *
 * - **The first** is what "I have made the transfer" told us about: the
 *   deposit, and with it the stay payment when the guest chose "everything
 *   now" — one transfer for two rows, so one slip filed against both, as
 *   before. With no deposit by transfer (a day pass, a stay quoting none) it
 *   is the booking's earliest transfer.
 * - **Every other transfer is a box of its own** — in practice the rest of the
 *   stay, sent later.
 *
 * The "everything now" pair is told apart from a later payment by its
 * timestamp: `submit_public_payment()` and the desk's booking form write the
 * deposit's `promised_at` and the payment's `created_at` from one `now()` in
 * one transaction, and nothing written later can match it. **Compared as the
 * strings PostgREST returns, never through `Date`**, which would drop the
 * microseconds that make the match exact. A third writer of a deposit-and-
 * payment pair would need to keep that true, or this needs a marker column.
 *
 * ── Only money still waiting to be checked ────────────────────────────────
 *
 * A slip is filed only against rows nobody has verified yet. Once a clerk has
 * matched money against the bank, the evidence they matched it with is the
 * record; a forwarded link replacing it afterwards would rewrite the
 * accounting pack. So a box closes when everything in it is checked, and the
 * page stops offering it.
 *
 * **One exception: a deposit that arrived short** (capability B16). It is
 * checked, and still waiting for the rest of itself — the page asks the guest
 * to send it — and its top-up has no row of its own, so the deposit's box
 * stays open for that slip. A deposit holds one slip, so the guest's top-up
 * slip replaces their own first one there, as it always has; a slip a member
 * of staff filed is never touched.
 */

export type SlipBoxKey = 'first' | `payment:${string}`

export interface SlipFacts {
  deposit: {
    id: string
    method: PaymentMethod
    promisedAt: string | null
    collectedAt: string | null
    /** What a checked deposit is still short of its quote. Zero otherwise. */
    shortfall: Cents
  } | null
  /** Oldest first, as `listPaymentsForBooking` returns them. */
  payments: readonly {
    id: string
    method: PaymentMethod
    status: PaymentStatus
    createdAt: string
  }[]
  /** The booking's live slips, any uploader. */
  slips: readonly { depositId: string | null; paymentId: string | null; uploadedAt: string }[]
}

export interface SlipTarget {
  depositId: string | null
  paymentId: string | null
}

export interface SlipBox {
  key: SlipBoxKey
  /** The transfer "I have made the transfer" announced, or one sent after it. */
  kind: 'first' | 'rest'
  /** Whether anything in it is still waiting to be checked. */
  open: boolean
  /** Where a new slip goes: the rows still waiting, and only those. */
  targets: readonly SlipTarget[]
  /** When the newest slip on any of its rows arrived, or null. */
  onFileSince: string | null
}

interface BoxRow extends SlipTarget {
  waiting: boolean
}

export function slipBoxesOf(facts: SlipFacts): readonly SlipBox[] {
  const transfers = facts.payments.filter((payment) => payment.method === 'bank_transfer')
  const deposit =
    facts.deposit !== null &&
    facts.deposit.method === 'bank_transfer' &&
    facts.deposit.promisedAt !== null
      ? facts.deposit
      : null

  const depositRow: BoxRow[] = deposit
    ? [
        {
          depositId: deposit.id,
          paymentId: null,
          waiting: deposit.collectedAt === null || deposit.shortfall > 0,
        },
      ]
    : []
  const withTheDeposit = deposit
    ? transfers.filter((payment) => payment.createdAt === deposit.promisedAt)
    : transfers.slice(0, 1)
  const later = transfers.filter((payment) => !withTheDeposit.includes(payment))

  const paymentRow = (payment: SlipFacts['payments'][number]): BoxRow => ({
    depositId: null,
    paymentId: payment.id,
    waiting: payment.status === 'pending_verification',
  })

  const firstRows = [...depositRow, ...withTheDeposit.map(paymentRow)]
  const boxes: SlipBox[] = []

  if (firstRows.length > 0) {
    boxes.push(boxOf('first', 'first', firstRows, facts.slips))
  }

  for (const payment of later) {
    boxes.push(boxOf(`payment:${payment.id}`, 'rest', [paymentRow(payment)], facts.slips))
  }

  return boxes
}

function boxOf(
  key: SlipBoxKey,
  kind: SlipBox['kind'],
  rows: readonly BoxRow[],
  slips: SlipFacts['slips'],
): SlipBox {
  const waiting = rows.filter((row) => row.waiting)
  const onFile = slips
    .filter((slip) =>
      rows.some(
        (row) =>
          (row.depositId !== null && slip.depositId === row.depositId) ||
          (row.paymentId !== null && slip.paymentId === row.paymentId),
      ),
    )
    .map((slip) => slip.uploadedAt)
    // ISO timestamps from one source sort correctly as strings.
    .sort()

  return {
    key,
    kind,
    open: waiting.length > 0,
    targets: waiting.map(({ depositId, paymentId }) => ({ depositId, paymentId })),
    onFileSince: onFile.at(-1) ?? null,
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A box key from a form, or null when it is not one of the two shapes. */
export function parseSlipBoxKey(value: string): SlipBoxKey | null {
  if (value === 'first') {
    return 'first'
  }

  const [prefix, id] = value.split(':')

  return prefix === 'payment' && id !== undefined && UUID.test(id) && value === `payment:${id}`
    ? `payment:${id}`
    : null
}
