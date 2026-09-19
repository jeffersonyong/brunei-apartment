'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { revalidateStayScreens } from '@/app/revalidate-stay-screens'
import { requirePermission } from '@/lib/auth/require-permission'
import { getBookingById, type Booking } from '@/lib/db/bookings'
import { changeBookingParty, listDayPassParties } from '@/lib/db/party'
import { getPropertyConfig } from '@/lib/db/property-config'
import { isTerminal } from '@/lib/domain/booking-state'
import type { PropertyConfig } from '@/lib/domain/config'
import type { DayPassPartyLine } from '@/lib/domain/day-pass-capacity'
import { nightsBetween } from '@/lib/domain/dates'
import { countsOf } from '@/lib/domain/extra-guests'
import { repriceDayPassParty, repriceStayParty } from '@/lib/domain/pricing/party-change'

/**
 * Changing how many people a booking is for, from the booking itself (Jason's
 * team, 19 September 2026).
 *
 * The guard reports more people than were booked; a family says two are not
 * coming after all. This is the office's answer: a party changed on a stay —
 * checked in or not — or on a day pass, repriced and saved, with the
 * difference left as the balance. More people and the guest owes it, and the
 * gate card shows it as cash to take; fewer and the Money card says the
 * booking is overpaid, which the office settles with the guest outside the
 * system (prd.md §9.6).
 *
 * Under `booking.amend`, because it is an amendment — one that also reaches a
 * checked-in stay, where the full amendment screen stops (N12). The price is
 * the server's, as everywhere: repriced here from what the booking holds, and
 * never taken from the screen.
 */

export interface ChangePartyState {
  status: 'idle' | 'error' | 'done'
  message?: string
}

const count = z.coerce.number().int().min(0).max(50)

const schema = z.object({
  bookingId: z.string().uuid(),
  /** Passed back as the opaque string it arrived as — see amend/actions.ts. */
  expectedUpdatedAt: z.string().min(1),
  reason: z.string().trim().max(280).optional(),
})

const staySchema = z.object({
  chargeableGuests: count.min(1, 'A booking needs at least one guest.'),
  exemptGuests: count,
})

export async function changePartyAction(
  _previous: ChangePartyState,
  formData: FormData,
): Promise<ChangePartyState> {
  const actor = await requirePermission('booking.amend')
  const parsed = schema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return { status: 'error', message: 'This booking could not be changed. Reload the screen.' }
  }

  const [booking, config] = await Promise.all([
    getBookingById(parsed.data.bookingId),
    getPropertyConfig(),
  ])

  if (!booking) {
    return { status: 'error', message: 'That booking no longer exists.' }
  }

  if (isTerminal(booking.status)) {
    return {
      status: 'error',
      message: 'This booking is closed, so its party can no longer be changed.',
    }
  }

  // The form was priced against this version of the booking. If it has moved
  // since, the figures on screen are about a booking that no longer exists.
  if (booking.updatedAt !== parsed.data.expectedUpdatedAt) {
    return {
      status: 'error',
      message: 'Someone else changed this booking a moment ago. Reload and try again.',
    }
  }

  const priced = booking.dayPass
    ? passChange((await listDayPassParties([booking.id])).get(booking.id) ?? [], config, formData)
    : stayChange(booking, config, formData)

  if (!priced.ok) {
    return { status: 'error', message: priced.message }
  }

  const result = await changeBookingParty({
    bookingId: booking.id,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt,
    ...priced.change,
    reason: parsed.data.reason || null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  revalidateStayScreens(booking.reference, booking.stay?.unitRef ?? null)
  revalidatePath('/payments')

  return { status: 'done' }
}

type Priced =
  | {
      ok: true
      change: Pick<Parameters<typeof changeBookingParty>[0], 'party' | 'total' | 'lines' | 'pass'>
    }
  | { ok: false; message: string }

function stayChange(booking: Booking, config: PropertyConfig, formData: FormData): Priced {
  const party = staySchema.safeParse(Object.fromEntries(formData))
  const unitType = config.unitTypes.find((type) => type.id === booking.stay?.unitTypeId)

  if (!party.success) {
    return { ok: false, message: party.error.issues[0]?.message ?? 'Enter how many guests.' }
  }

  if (!booking.stay || !unitType) {
    return { ok: false, message: 'This booking has no stay to change. Reload the screen.' }
  }

  if (
    party.data.chargeableGuests === booking.chargeableGuests &&
    party.data.exemptGuests === booking.exemptGuests
  ) {
    return { ok: false, message: 'Nothing has changed. Change a number, or close this.' }
  }

  const repriced = repriceStayParty(
    {
      lines: booking.lines,
      unitType,
      nights: nightsBetween(booking.stay.range.start, booking.stay.range.end),
      party: party.data,
      discount: booking.discount,
    },
    config,
  )

  if (!repriced.ok) {
    return { ok: false, message: repriced.error.message }
  }

  return {
    ok: true,
    change: { party: party.data, total: repriced.total, lines: repriced.lines, pass: null },
  }
}

function passChange(
  sold: readonly DayPassPartyLine[],
  config: PropertyConfig,
  formData: FormData,
): Priced {
  const counts: Record<string, number> = {}

  for (const band of config.dayPassAgeBands) {
    const value = count.safeParse(formData.get(`band-${band.id}`) ?? 0)

    if (!value.success) {
      return { ok: false, message: `Enter how many for ${band.label}.` }
    }

    counts[band.id] = value.data
  }

  const repriced = repriceDayPassParty(counts, config)

  if (!repriced.ok) {
    return { ok: false, message: repriced.message }
  }

  if (sameCounts(counts, countsOf(sold))) {
    return { ok: false, message: 'Nothing has changed. Change a number, or close this.' }
  }

  return {
    ok: true,
    change: {
      party: repriced.party,
      total: repriced.total,
      lines: repriced.lines,
      pass: { party: repriced.snapshot, headcount: repriced.headcount },
    },
  }
}

/** The same party, whatever bands are written as zero. */
function sameCounts(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  return [...keys].every((key) => (a[key] ?? 0) === (b[key] ?? 0))
}
