import { sumCents, type Cents } from './money'

/**
 * Booking lines.
 *
 * prd.md §8: "Pricing is a line-item calculation, never a single stored price.
 * Every booking produces itemised BookingLine records that sum to a total."
 *
 * The engine therefore returns lines, and the total is always derived by
 * summing them. Nothing stores a total that was not built this way, which is
 * what makes a price explainable to a guest disputing it.
 */

export type BookingLineType =
  | 'accommodation'
  | 'extra_person'
  /**
   * One of the configured extras (capability F13). Which one is on
   * `BookingLine.extraId` — it replaced the fixed `sofa_bed` type when the set
   * stopped being fixed, and 20261003000100 migrated every existing sofa-bed
   * line onto it.
   */
  | 'extra'
  | 'early_check_in'
  | 'late_check_out'
  | 'day_pass'
  | 'day_pass_bundle'
  /**
   * The one line that is negative. A staff discount is expressed as a line
   * rather than as a subtraction on the total, so prd.md §8's "the total is
   * the sum of the lines" survives it and a receipt still explains itself.
   * Built by `resolveDiscount` in ./discount.ts, which is the only place the
   * amount is decided.
   */
  | 'discount'

export interface BookingLine {
  type: BookingLineType
  /** Human-readable, shown to staff and guests verbatim. */
  description: string
  quantity: number
  unitPrice: Cents
  /** Always `quantity * unitPrice`; stored so a line is self-contained. */
  amount: Cents
  /**
   * Which configured extra this line bought — set on `extra` lines and on no
   * other. The description is still what a receipt prints; this is what the
   * database counts against stock, which is why it survives a rename.
   */
  extraId?: string
}

/** Builds a line, deriving the amount so it can never disagree with its parts. */
export function line(
  type: BookingLineType,
  description: string,
  quantity: number,
  unitPrice: Cents,
): BookingLine {
  return { type, description, quantity, unitPrice, amount: quantity * unitPrice }
}

/**
 * Builds the one line type that names a row elsewhere.
 *
 * Separate from `line()` so the pairing the database enforces — an `extra`
 * line has an `extraId`, nothing else does — cannot be got wrong by passing
 * one argument too few.
 */
export function extraLine(
  extraId: string,
  description: string,
  quantity: number,
  unitPrice: Cents,
): BookingLine {
  return {
    type: 'extra',
    description,
    quantity,
    unitPrice,
    amount: quantity * unitPrice,
    extraId,
  }
}

/** Sums lines to a booking total. */
export function totalOf(lines: readonly BookingLine[]): Cents {
  return sumCents(lines.map((entry) => entry.amount))
}

/**
 * The priced extras a booking bought, read back off its lines.
 *
 * The extras and the early/late hours are not columns on `booking` — they
 * exist only as `booking_line` quantities, so an amend form has nowhere else
 * to read them from when it prefills. Deriving them here rather than in the
 * form keeps the mapping in the module that owns line shape, next to `line()`
 * which wrote them.
 *
 * `extra_person` is deliberately absent: its quantity is people × nights, a
 * product of the party size and the range rather than something a form
 * collects. It is recomputed from those inputs, never read back.
 */
export interface BookingExtras {
  /** Quantity per configured extra id. Absent means none were bought. */
  extras: Readonly<Record<string, number>>
  earlyCheckInHours: number
  lateCheckOutHours: number
}

export function extrasFromLines(lines: readonly BookingLine[]): BookingExtras {
  const quantityOf = (type: BookingLineType): number =>
    lines.find((entry) => entry.type === type)?.quantity ?? 0

  // Summed rather than found: one extra should produce one line, but a booking
  // assembled by hand or amended oddly could carry two, and a prefill that
  // showed the first of them would quietly halve the order.
  const extras: Record<string, number> = {}

  for (const entry of lines) {
    if (entry.type === 'extra' && entry.extraId) {
      extras[entry.extraId] = (extras[entry.extraId] ?? 0) + entry.quantity
    }
  }

  return {
    extras,
    earlyCheckInHours: quantityOf('early_check_in'),
    lateCheckOutHours: quantityOf('late_check_out'),
  }
}
