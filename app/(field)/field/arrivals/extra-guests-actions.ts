'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { scheduleAccountingPack } from '@/app/schedule-accounting-pack'
import { scheduleBookingConfirmedEmail } from '@/app/schedule-booking-email'
import { hasPermission } from '@/lib/auth/permissions'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById } from '@/lib/db/bookings'
import { getGateBooking, type GateBooking } from '@/lib/db/gate'
import { changeBookingParty, listDayPassParties, reportExtraGuests } from '@/lib/db/party'
import { recordCashPayment } from '@/lib/db/payments'
import { getPropertyConfig } from '@/lib/db/property-config'
import type { PropertyConfig } from '@/lib/domain/config'
import { todayInBrunei } from '@/lib/domain/dates'
import {
  addToParty,
  countsOf,
  describeParty,
  extraGuestsNote,
  MAX_EXTRA_GUESTS,
  MAX_EXTRA_GUESTS_REMARK_LENGTH,
} from '@/lib/domain/extra-guests'
import { gateRefusalSentence, mayAddVisitorsAtGate } from '@/lib/domain/gate'
import { formatCents, type Cents } from '@/lib/domain/money'
import { repriceDayPassParty } from '@/lib/domain/pricing/party-change'

/**
 * More people at the gate than a booking is for (Jason's team, 19 September
 * 2026).
 *
 * **A stay: the guard tells the office.** He says how many more, and it becomes
 * a note on the booking and a line in the office's bell. The office changes the
 * party (the booking's Change), and whatever that leaves owing comes back to
 * the card as cash to take.
 *
 * **A day pass: the guard settles it himself** (Jeff, the same day). He says
 * who the extra visitors are by age band, the pass is priced again for all of
 * them, and he takes the difference in cash — one dialog, recorded as the
 * office would record it: the party changed under the office's own writer and
 * the cash through the gate's. Admit is never hidden for it; whether he calls
 * the office first is theirs to agree, not the screen's to enforce.
 *
 * The two writes for a pass are not one transaction, on purpose. Each is the
 * product's existing writer with its own checks — capacity under the per-date
 * lock, the amount rule — and the order is chosen so a failure between them
 * leaves nothing wrong, only unfinished: the pass is for the new party and
 * owes the difference, the card says so in red, and the ordinary Take button
 * finishes it.
 */

export interface ExtraGuestsState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** For the toast. */
  done?: { guestName: string; taken: Cents | null; reported: number }
}

const count = z.coerce.number().int().min(0).max(MAX_EXTRA_GUESTS)

const reportSchema = z.object({
  bookingId: z.string().uuid(),
  stream: z.enum(['short_stay', 'day_pass', 'tenancy']),
  extra: count.min(1, 'Say how many more people arrived.'),
  remark: z.string().trim().max(MAX_EXTRA_GUESTS_REMARK_LENGTH).default(''),
})

const addSchema = z.object({
  bookingId: z.string().uuid(),
  /** What the dialog said to take, in cents. The server takes nothing else. */
  expectedTake: z.coerce.number().int().min(0),
  /**
   * How many the pass was for when the dialog opened. The figure alone cannot
   * tell a second press apart: one adult more costs BND 10 on the first press
   * and again on the second, so a press repeated after an answer was lost on
   * one bar of signal would add them twice. The headcount has moved by then.
   */
  expectedHeadcount: z.coerce.number().int().min(1),
  remark: z.string().trim().max(MAX_EXTRA_GUESTS_REMARK_LENGTH).default(''),
})

/** A report, not a move: it reads the booking, with no turnovers or figures. */
const READ = { withReadiness: false, withCash: false } as const

/** The guard tells the office how many more people arrived. */
export async function reportExtraGuestsAction(
  _previous: ExtraGuestsState,
  formData: FormData,
): Promise<ExtraGuestsState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Try again.' }
  }

  const input = parsed.data

  // The gate's own permission for this kind of booking: whoever checks a stay
  // in, or admits a pass, is whoever stands at the car counting people.
  const actor = await requirePermission(
    input.stream === 'day_pass' ? 'day_pass.admit' : 'booking.check_in',
  )
  const booking = await getGateBooking(input.bookingId, todayInBrunei(), READ)

  if (!booking || booking.stream !== input.stream) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (booking.verdict.kind === 'closed') {
    return { status: 'error', message: 'This booking is closed. Call the office.' }
  }

  const result = await reportExtraGuests({
    bookingId: booking.id,
    extra: input.extra,
    body: extraGuestsNote({
      extra: input.extra,
      bookedFor: bookedFor(booking),
      remark: input.remark,
    }),
    addedCents: null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  revalidateGate(booking)

  return {
    status: 'done',
    done: { guestName: booking.guestName, taken: null, reported: input.extra },
  }
}

/**
 * The guard adds the visitors he counted to a day pass and takes the
 * difference. Only for a pass on its own day that is open and has no transfer
 * waiting — the ones he could already take cash for.
 */
export async function addToPassAtGateAction(
  _previous: ExtraGuestsState,
  formData: FormData,
): Promise<ExtraGuestsState> {
  const actor = await requirePermission('day_pass.admit')

  if (!hasPermission(actor.permissions, 'payment.record_cash')) {
    return {
      status: 'error',
      message: 'Taking cash is not part of your job here. Tell the office instead.',
    }
  }

  const parsed = addSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'Try again.' }
  }

  const input = parsed.data
  const [gate, booking, config] = await Promise.all([
    getGateBooking(input.bookingId, todayInBrunei(), READ),
    getBookingById(input.bookingId),
    getPropertyConfig(),
  ])

  if (!gate || !booking || gate.stream !== 'day_pass') {
    return { status: 'error', message: gateRefusalSentence('not_found') }
  }

  if (!mayAddVisitorsAtGate(gate.verdict)) {
    return {
      status: 'error',
      message: 'This pass cannot take more visitors at the gate. Call the office.',
    }
  }

  const added = addedCounts(formData, config)
  const addedCount = Object.values(added).reduce((sum, value) => sum + value, 0)

  if (addedCount < 1) {
    return { status: 'error', message: 'Say who the extra visitors are.' }
  }

  if (booking.dayPass?.headcount !== input.expectedHeadcount) {
    return { status: 'error', message: gateRefusalSentence('already_recorded') }
  }

  const sold = (await listDayPassParties([booking.id])).get(booking.id) ?? []
  const repriced = repriceDayPassParty(addToParty(countsOf(sold), added), config)

  if (!repriced.ok) {
    return { status: 'error', message: repriced.message }
  }

  const take = repriced.total - booking.paid

  // The figure the guard is about to ask the visitor for is the one the
  // server works out, or nothing happens: the pass may have moved since the
  // list was read.
  if (take !== input.expectedTake || take < 0) {
    return { status: 'error', message: gateRefusalSentence('changed') }
  }

  const changed = await changeBookingParty({
    bookingId: booking.id,
    expectedUpdatedAt: booking.updatedAt,
    party: repriced.party,
    total: repriced.total,
    lines: repriced.lines,
    pass: { party: repriced.snapshot, headcount: repriced.headcount },
    reason: 'Visitors added at the gate',
    actorId: actor.userId,
  })

  if (!changed.ok) {
    return {
      status: 'error',
      message:
        changed.error.code === 'capacity_exceeded'
          ? `${changed.error.message} Call the office.`
          : gateRefusalSentence('changed'),
    }
  }

  const addedParty = describeParty(
    config.dayPassAgeBands.map((band) => ({ label: band.label, count: added[band.id] ?? 0 })),
  )

  if (take > 0) {
    const paid = await recordCashPayment({
      bookingId: booking.id,
      amount: take,
      amountOverrideReason: null,
      actorId: actor.userId,
    })

    if (!paid.ok) {
      // The pass is for the new party and owes the difference, which the card
      // now shows in red — so the guard finishes it the ordinary way.
      await noteForTheOffice({
        bookingId: booking.id,
        extra: addedCount,
        body: `Added at the gate: ${addedParty} (the pass is now for ${repriced.headcount}). The cash was not recorded.`,
        addedCents: null,
        actorId: actor.userId,
      })
      revalidateGate(gate)

      return {
        status: 'error',
        message: `The visitors were added, but the BND ${formatCents(take)} was not recorded. Take it with the Take button on the card.`,
      }
    }

    // Money reached the pass, so the accounting record is written now
    // (capability G5), as the gate's own cash does.
    scheduleAccountingPack(booking.id)

    if (paid.confirmedNow) {
      scheduleBookingConfirmedEmail(booking.id)
    }
  }

  // By now the party has changed and the cash is recorded. The note is the
  // office's account of it, and a note that failed to save must not reach the
  // guard as "that did not go through" — he would ask the visitor to pay again.
  await noteForTheOffice({
    bookingId: booking.id,
    extra: addedCount,
    body: extraGuestsNote({
      extra: addedCount,
      bookedFor: bookedFor(gate),
      remark: input.remark,
      added: { party: addedParty, nowFor: repriced.headcount, taken: take },
    }),
    addedCents: take,
    actorId: actor.userId,
  })

  revalidateGate(gate)
  revalidatePath('/payments')
  revalidatePath('/payments/cash')
  revalidatePath('/reports/cash-up')

  return {
    status: 'done',
    done: { guestName: gate.guestName, taken: take, reported: addedCount },
  }
}

/** The extra visitors by band, read against the bands on sale — nothing else is priced. */
function addedCounts(formData: FormData, config: PropertyConfig): Record<string, number> {
  const added: Record<string, number> = {}

  for (const band of config.dayPassAgeBands) {
    const value = count.safeParse(formData.get(`band-${band.id}`) ?? 0)

    added[band.id] = value.success ? value.data : 0
  }

  return added
}

/** Everybody the booking is for, as the guard counts them. */
function bookedFor(booking: GateBooking): number {
  return booking.party.kind === 'stay'
    ? booking.party.counted + booking.party.exempt
    : (booking.headcount ?? 0)
}

/**
 * The note after money has moved at the gate. Best-effort by design: the
 * party and the cash are already written, and the history carries both, so a
 * note that failed is logged rather than turned into a failure of what
 * succeeded.
 */
async function noteForTheOffice(input: Parameters<typeof reportExtraGuests>[0]): Promise<void> {
  try {
    await reportExtraGuests(input)
  } catch (error) {
    console.error('The gate note for the office could not be saved', error)
  }
}

function revalidateGate(booking: GateBooking): void {
  revalidateStayScreens(booking.reference, booking.unitRef)
}
