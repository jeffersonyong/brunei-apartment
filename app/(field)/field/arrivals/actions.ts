'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { scheduleAccountingPack } from '@/app/schedule-accounting-pack'
import { scheduleBookingConfirmedEmail } from '@/app/schedule-booking-email'
import { hasPermission, type Permission } from '@/lib/auth/permissions'
import { requirePermission } from '@/lib/auth/require-permission'
import { transitionBooking } from '@/lib/db/bookings'
import { admitDayPass } from '@/lib/db/day-pass-admission'
import { checkInBooking, recordBookingDeposit, topUpBookingDeposit } from '@/lib/db/deposits'
import { getGateBooking, type GateBooking, type GateReadOptions } from '@/lib/db/gate'
import { recordCashPayment } from '@/lib/db/payments'
import { todayInBrunei } from '@/lib/domain/dates'
import {
  gateCashStalenessOf,
  gateRefusalSentence,
  gateVerdictSentence,
  type GateCashDue,
  type GateSentenceOptions,
} from '@/lib/domain/gate'
import { centsFromInput, type Cents } from '@/lib/domain/money'

/**
 * The gate's moves: checking a stay in, checking it out, admitting a day pass,
 * and taking the cash a guest still owes (capabilities D3, D5, D6, and a pass's
 * half of D1).
 *
 * Each is the office's own writer under the office's own permission —
 * `checkInBooking()` under `booking.check_in`, the `check_out` transition under
 * `booking.check_out`, `admitDayPass()` under `day_pass.admit`, and the desk's
 * money functions under `payment.record_cash` — so the gate can do exactly what
 * the office can do at that moment and nothing more, and the booking's history
 * records who did it (prd.md §12 requirement 3: authority comes from the staff
 * session). The guard holds all of them: he is the front desk, hands the keys
 * over, takes them back and is handed pending cash (N54, answered by Jason on
 * 14 September 2026).
 *
 * ── The verdict is decided again, here ────────────────────────────────────
 *
 * The list on the phone may be a few minutes old, and a hidden button is not a
 * rule. So the booking is read fresh and `gateVerdictOf()` asked again before
 * the write: an early arrival, a guest not due out or a pass for another day
 * is refused here as firmly as on screen, and a booking the office has since
 * cancelled is refused rather than walked in. What only the database can
 * settle — the deposit, the pass's date in the property's timezone, what is
 * owed — is decided last of all, under the row lock, by the SQL itself.
 *
 * Every refusal is a sentence that tells the guard what to do next.
 */

export interface GateActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** Named in the toast: "Siti Aminah is checked in". */
  guestName?: string
}

const schema = z.object({
  bookingId: z.string().uuid(),
})

/** A move reads its one booking again before it writes, and needs no turnovers or figures for it. */
const READ_FOR_A_MOVE: GateReadOptions = { withReadiness: false, withCash: false }

/** Taking cash reads what is owed again, which is the whole point of reading. */
const READ_FOR_CASH: GateReadOptions = { withReadiness: false, withCash: true }

function sentenceOptionsOf(permissions: ReadonlySet<Permission>): GateSentenceOptions {
  return {
    mayCheckIn: hasPermission(permissions, 'booking.check_in'),
    mayCheckOut: hasPermission(permissions, 'booking.check_out'),
    // A refusal is read without figures, so it never offers the cash.
    takesCash: false,
  }
}

export async function checkInAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('booking.check_in')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_MOVE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.stream !== 'day_pass' && booking.status === 'checked_in') {
    return { status: 'error', message: gateRefusalSentence('status_changed', { alreadyIn: true }) }
  }

  if (booking.verdict.kind !== 'check_in') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await checkInBooking({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // Somebody else may have checked them in a moment ago, which is done
    // rather than failed — so look before choosing the sentence.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_MOVE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, { alreadyIn: now?.status === 'checked_in' }),
    }
  }

  revalidateStayScreens(booking.reference, booking.unitRef)

  return { status: 'done', guestName: booking.guestName }
}

/**
 * Checking a stay out when the keys come back (capability D5, N54).
 *
 * Only for a guest due out today or overdue — the rule the cleaner's "Guest
 * has left" uses — because the gate cannot tell a guest leaving from one out
 * for dinner, and a check-out cannot be undone. It is the same ordinary
 * transition the office's Check out and the cleaner's button make: nothing
 * else moves when a guest leaves.
 */
export async function checkOutAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('booking.check_out')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_MOVE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.stream !== 'day_pass' && booking.status === 'completed') {
    return { status: 'error', message: gateRefusalSentence('status_changed', { alreadyOut: true }) }
  }

  if (booking.verdict.kind === 'in_residence') {
    return { status: 'error', message: gateRefusalSentence('not_due_out') }
  }

  if (booking.verdict.kind !== 'leaving') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await transitionBooking(booking.id, 'check_out', actor.userId)

  if (!result.ok) {
    // The cleaner or the office may have checked them out a moment ago.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_MOVE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, { alreadyOut: now?.status === 'completed' }),
    }
  }

  revalidateStayScreens(booking.reference, booking.unitRef)

  return { status: 'done', guestName: booking.guestName }
}

export async function admitAtGateAction(
  _previous: GateActionState,
  formData: FormData,
): Promise<GateActionState> {
  const actor = await requirePermission('day_pass.admit')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  const today = todayInBrunei()
  const booking = await getGateBooking(parsed.data.bookingId, today, READ_FOR_A_MOVE)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.verdict.kind === 'admitted') {
    return {
      status: 'error',
      message: gateRefusalSentence('status_changed', { alreadyAdmitted: true }),
    }
  }

  if (booking.verdict.kind !== 'admit') {
    return {
      status: 'error',
      message: gateVerdictSentence(booking.verdict, booking, sentenceOptionsOf(actor.permissions)),
    }
  }

  const result = await admitDayPass({ bookingId: booking.id, actorId: actor.userId })

  if (!result.ok) {
    // The office, or a second phone, may have admitted it a moment ago.
    const now = await getGateBooking(booking.id, today, READ_FOR_A_MOVE)

    return {
      status: 'error',
      message: gateRefusalSentence(result.error.code, {
        alreadyAdmitted: now?.verdict.kind === 'admitted',
      }),
    }
  }

  revalidateStayScreens(booking.reference, null)

  return { status: 'done', guestName: booking.guestName }
}

/* ── Taking cash ──────────────────────────────────────────────────────────── */

const cashSchema = z.object({
  bookingId: z.string().uuid(),
  kind: z.enum(['deposit', 'deposit_shortfall', 'stay', 'pass']),
  /** What the card said was owed when the guard opened the dialog. */
  owedCents: z.coerce.number().int().positive(),
  /** A stay only: the notes actually handed over, as typed. */
  amount: z.string().trim().default(''),
  amountOverrideReason: z.string().trim().max(280).default(''),
})

export interface GateCashState {
  status: 'idle' | 'error' | 'done'
  message?: string
  fieldErrors?: Record<string, string>
  taken?: {
    guestName: string
    amount: Cents
    /** This cash is what confirmed the booking. */
    confirmed: boolean
  }
  /** Echoed back so a refusal does not empty the form. */
  submitted?: { amount: string; amountOverrideReason: string }
}

/**
 * Taking the cash a guest still owes, at the gate (capability D6, N54).
 *
 * **The card said what the money was for, and the server says it again.** The
 * dialog posts the kind and the figure the guard was shown. The booking is read
 * fresh, and if what is owed is no longer what he confirmed, nothing is written
 * (`gateCashStalenessOf`). That is the guard against the same notes being
 * recorded twice — a second press after an answer was lost on one bar of
 * signal, or two phones on one car. The amount rule cannot be that guard: it
 * records a stay payment of any size once a reason is typed.
 *
 * **Then the desk's own writer, under the same permission.** A deposit is
 * `recordBookingDeposit` in cash, which also fulfils a transfer promised and
 * never sent; the rest of a short one is `topUpBookingDeposit` in cash; the stay
 * and a day pass are `recordCashPayment`. The side effects are theirs too: the
 * confirmation email when this is what confirmed the booking, and the accounting
 * pack when money reached the stay.
 */
export async function takeCashAtGateAction(
  _previous: GateCashState,
  formData: FormData,
): Promise<GateCashState> {
  const actor = await requirePermission('payment.record_cash')
  const parsed = cashSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: gateRefusalSentence('changed') }
  }

  const input = parsed.data
  const today = todayInBrunei()
  const booking = await getGateBooking(input.bookingId, today, READ_FOR_CASH)

  if (!booking) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.verdict.kind === 'closed') {
    return { status: 'error', message: gateRefusalSentence('booking_closed') }
  }

  const stale = gateCashStalenessOf({ kind: input.kind, amount: input.owedCents }, booking.cash)

  if (stale !== null || booking.cash === null) {
    return { status: 'error', message: gateRefusalSentence(stale ?? 'already_recorded') }
  }

  const taken = await takeCash(booking, booking.cash, input, actor.userId, today)

  if (taken.status !== 'done') {
    return taken
  }

  revalidateStayScreens(booking.reference, booking.unitRef)
  revalidatePath('/portal/payments')
  revalidatePath('/portal/payments/cash')
  revalidatePath('/portal/reports/cash-up')

  return taken
}

/** The one write, by what the re-read booking says the cash is for. */
async function takeCash(
  booking: GateBooking,
  due: GateCashDue,
  input: z.infer<typeof cashSchema>,
  actorId: string,
  today: string,
): Promise<GateCashState> {
  const submitted = { amount: input.amount, amountOverrideReason: input.amountOverrideReason }

  switch (due.kind) {
    case 'deposit': {
      const result = await recordBookingDeposit({
        bookingId: booking.id,
        method: 'cash',
        actorId,
      })

      if (!result.ok) {
        return { status: 'error', message: cashRefusalOf(result.error.code) }
      }

      return done(booking, result.amount, result.confirmedNow)
    }
    case 'deposit_shortfall': {
      const result = await topUpBookingDeposit({
        bookingId: booking.id,
        amount: due.amount,
        method: 'cash',
        actorId,
      })

      if (!result.ok) {
        return { status: 'error', message: cashRefusalOf(result.error.code) }
      }

      return done(booking, due.amount, result.confirmedNow)
    }
    case 'stay':
    case 'pass': {
      // A pass is taken whole; a stay is whatever the guest handed over, which
      // is usually what is owed and occasionally is not.
      const amount = due.kind === 'stay' ? centsFromInput(input.amount) : due.amount

      if (amount === null || amount <= 0) {
        return {
          status: 'error',
          message: 'Enter the amount taken, like 200.00.',
          fieldErrors: { amount: 'Enter an amount like 200.00.' },
          submitted,
        }
      }

      const result = await recordCashPayment({
        bookingId: booking.id,
        amount,
        amountOverrideReason: input.amountOverrideReason || null,
        actorId,
      })

      if (!result.ok) {
        if (result.error.code === 'reason_required') {
          // Look again before asking why: a press that meets a balance
          // somebody settled a moment ago must not be handed a reason box to
          // type its way into recording the money twice.
          const now = await getGateBooking(booking.id, today, READ_FOR_CASH)
          const moved = gateCashStalenessOf(due, now?.cash ?? null)

          if (moved !== null) {
            return { status: 'error', message: gateRefusalSentence(moved) }
          }

          return {
            status: 'error',
            message: 'This is not what is owed. Say why, and it is recorded with it.',
            fieldErrors: { amountOverrideReason: 'This is not what is owed. Say why.' },
            submitted,
          }
        }

        return { status: 'error', message: cashRefusalOf(result.error.code), submitted }
      }

      // Money reached the stay, so the accounting record is written now
      // (capability G5), as the desk's cash does.
      scheduleAccountingPack(booking.id)

      return done(booking, amount, result.confirmedNow)
    }
  }
}

function done(booking: GateBooking, amount: Cents, confirmed: boolean): GateCashState {
  // The guest hears once, when the booking actually becomes confirmed — which
  // for a booking paid at the gate is when the guard takes the deposit.
  if (confirmed) {
    scheduleBookingConfirmedEmail(booking.id)
  }

  return { status: 'done', taken: { guestName: booking.guestName, amount, confirmed } }
}

/** A money function's refusal, in the guard's words. */
function cashRefusalOf(code: string): string {
  switch (code) {
    case 'already_recorded':
    case 'nothing_short':
    case 'exceeds_shortfall':
      return gateRefusalSentence('already_recorded')
    case 'booking_closed':
      return gateRefusalSentence('booking_closed')
    case 'not_found':
    case 'booking_not_found':
      return gateRefusalSentence('not_found')
    default:
      return gateRefusalSentence('changed')
  }
}
