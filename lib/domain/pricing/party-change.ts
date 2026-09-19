import type { PropertyConfig, UnitTypeConfig } from '../config'
import {
  DAY_PASS_PARTY_MESSAGES,
  partyFromCounts,
  type DayPassPartyLine,
} from '../day-pass-capacity'
import { resolveDiscount, type Discount } from '../discount'
import { totalOf, type BookingLine } from '../lines'
import type { Cents } from '../money'
import { priceDayPass } from './day-pass'
import { extraPersonLine, type StayParty, type StayPricingError } from './stay'

/**
 * Changing how many people a stay is for, after it was sold (Jason's team,
 * 19 September 2026).
 *
 * Guests turn up with more people than they booked — sometimes to avoid the
 * extra-person charge — or with fewer. The guard counts them at the gate and
 * tells the office, and the office changes the party. That can happen after
 * the guard has checked them in, which the amendment screen refuses (§9.6,
 * N12): it reprices the whole stay and the engine will not price a check-in
 * date in the past.
 *
 * So this reprices the **party and nothing else**. Every line the stay was
 * sold with is kept as it was sold — the nights, the extras, the late
 * check-out — and only the two lines the party decides are worked out again:
 *
 * - **the extra-person line**, every guest above the unit type's maximum for
 *   **every night of the booking** (Jeff, 19 September 2026: the extra guests
 *   usually arrived with the party, and the office catches up the next
 *   morning, so charging from "today" would miss the first night). It is
 *   charged at the rate in force now, as an amendment's is;
 * - **the discount**, taken again off the new subtotal, because a percentage
 *   of a different subtotal is a different figure. A fixed discount the
 *   smaller booking is no longer worth is refused rather than clipped: that is
 *   a decision for whoever gave it.
 *
 * The consequence is a new total, and the difference is simply what the
 * balance says — owed by the guest when more came, owed to the guest when
 * fewer did, which the Money card already calls "Overpaid by" and leaves to a
 * person (prd.md §9.6).
 */

export interface StayPartyChange {
  /** The booking's lines as they are stored. */
  lines: readonly BookingLine[]
  unitType: Pick<UnitTypeConfig, 'name' | 'maxPax'>
  /** Nights in the booking as it stands. */
  nights: number
  /** The party it is changing to. */
  party: StayParty
  /** The booking's discount instruction, which the stored line was resolved from. */
  discount: Discount | null
}

export type StayPartyChangeResult =
  { ok: true; lines: readonly BookingLine[]; total: Cents } | { ok: false; error: StayPricingError }

export function repriceStayParty(
  change: StayPartyChange,
  config: Pick<PropertyConfig, 'paxPolicy' | 'extraPersonPerNight'>,
): StayPartyChangeResult {
  const { unitType, nights, party } = change

  if (party.chargeableGuests < 1) {
    return fail('no_guests', 'A booking needs at least one guest above the exempt age.')
  }

  const guestsAboveMax = Math.max(0, party.chargeableGuests - unitType.maxPax)

  if (config.paxPolicy === 'hard_cap' && guestsAboveMax > 0) {
    return fail(
      'exceeds_max_pax',
      `${unitType.name} takes up to ${unitType.maxPax} guests; this party is ${party.chargeableGuests}.`,
    )
  }

  const kept = change.lines.filter(
    (entry) => entry.type !== 'extra_person' && entry.type !== 'discount',
  )

  // Where the engine puts it: straight after the nights, so the receipt reads
  // the way a booking priced whole does.
  const after = kept.findIndex((entry) => entry.type === 'accommodation') + 1
  const lines =
    guestsAboveMax > 0
      ? [
          ...kept.slice(0, after),
          extraPersonLine(unitType.maxPax, guestsAboveMax, nights, config.extraPersonPerNight),
          ...kept.slice(after),
        ]
      : kept

  if (!change.discount) {
    return { ok: true, lines, total: totalOf(lines) }
  }

  const discounted = resolveDiscount(totalOf(lines), change.discount)

  if (!discounted.ok) {
    return fail('invalid_discount', discounted.error.message)
  }

  const withDiscount = [...lines, discounted.line]

  return { ok: true, lines: withDiscount, total: totalOf(withDiscount) }
}

function fail(code: StayPricingError['code'], message: string): StayPartyChangeResult {
  return { ok: false, error: { code, message } }
}

/**
 * A day pass's party changed — by the office, or by the guard adding the
 * visitors he counted at the gate.
 *
 * A pass has no lines but its party's, so it is simply priced again, whole,
 * through the engine that sold it: bundles as many times as they fit, and the
 * cheapest arrangement (prd.md §8.3, C9). What it returns is everything
 * `change_booking_party()` writes — the bands as a snapshot with their labels,
 * the headcount capacity counts, and the two figures the booking carries.
 */
export type DayPassPartyChangeResult =
  | {
      ok: true
      snapshot: readonly DayPassPartyLine[]
      headcount: number
      party: StayParty
      lines: readonly BookingLine[]
      total: Cents
    }
  | { ok: false; message: string }

export function repriceDayPassParty(
  counts: Readonly<Record<string, number>>,
  config: PropertyConfig,
): DayPassPartyChangeResult {
  const party = partyFromCounts(counts, config)

  if (!party.ok) {
    return { ok: false, message: DAY_PASS_PARTY_MESSAGES[party.error] }
  }

  const quote = priceDayPass(party.party, config)

  if (!quote.ok) {
    return { ok: false, message: quote.error.message }
  }

  return {
    ok: true,
    snapshot: party.snapshot,
    headcount: party.headcount,
    party: { chargeableGuests: party.chargeableGuests, exemptGuests: party.exemptGuests },
    lines: quote.lines,
    total: quote.total,
  }
}
