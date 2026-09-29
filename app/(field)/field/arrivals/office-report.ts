import type { GateBooking } from '@/lib/db/gate'
import { reportExtraGuests } from '@/lib/db/party'
import { extraGuestsNote, type ExtraGuestsNoteInput } from '@/lib/domain/extra-guests'
import { extrasToReport } from '@/lib/domain/gate-arrivals'
import type { Cents } from '@/lib/domain/money'

/**
 * The gate's word to the office about more people than a booking is for — a
 * note on the booking and a line in the office's bell (`report_extra_guests()`).
 *
 * A plain module rather than part of an actions file, because every export of
 * a `'use server'` file becomes an endpoint anybody can call.
 *
 * **Best effort, always.** It is only ever said after something that
 * succeeded — the guests counted in, the pass changed and the cash taken — and
 * a note that failed to save must not reach the guard as "that did not go
 * through": he would count them again, or ask the visitor to pay twice. So a
 * failure is logged and handed back as `false`, and the toast tells him to
 * call the office instead.
 */

export interface OfficeReport {
  bookingId: string
  note: ExtraGuestsNoteInput
  /** What the guard took for them, when he added them to a pass himself. */
  addedCents: Cents | null
  actorId: string
}

/** Says it. True when the office was told. */
export async function tellTheOffice(report: OfficeReport): Promise<boolean> {
  try {
    const result = await reportExtraGuests({
      bookingId: report.bookingId,
      extra: report.note.extra,
      body: extraGuestsNote(report.note),
      addedCents: report.addedCents,
      actorId: report.actorId,
    })

    if (!result.ok) {
      console.error('The gate note for the office found no booking', report.bookingId)
    }

    return result.ok
  } catch (error) {
    console.error('The gate note for the office could not be saved', error)

    return false
  }
}

/**
 * After a count: tells the office about anybody beyond the booking it has not
 * heard of yet, and says how that went. Null when there was nobody to report.
 */
export async function reportCountedExtras(
  booking: GateBooking,
  arrived: number,
  remark: string,
  actorId: string,
): Promise<{ extra: number; told: boolean } | null> {
  const extra = extrasToReport(arrived, booking.partySize, booking.extraReported)

  if (extra === 0) {
    return null
  }

  const told = await tellTheOffice({
    bookingId: booking.id,
    note: { extra, bookedFor: booking.partySize, remark },
    addedCents: null,
    actorId,
  })

  return { extra, told }
}
