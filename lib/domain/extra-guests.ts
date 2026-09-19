import type { DayPassPartyLine } from './day-pass-capacity'
import { formatCents, type Cents } from './money'

/**
 * More people at the gate than a booking is for (Jason's team, 19 September
 * 2026).
 *
 * A guest who does not want to pay the extra-person charge leaves people off
 * the booking, and the guard is the one who sees the car. He counts them and
 * says so; the office settles it. For a day pass he can settle it himself:
 * the visitors are added to the pass, priced as the pass was, and he takes
 * the difference in cash on the spot.
 *
 * What he says is written as a note on the booking, because that is where the
 * office reads everything else about a stay — so the wording here is the
 * note's, and it is the office reading it.
 */

/**
 * The most extra people one report may carry — the ceiling a band has on the
 * public form (`MAX_GUESTS_PER_BAND`), for the same reason: input validation,
 * not a statement about how many a car can hold.
 */
export const MAX_EXTRA_GUESTS = 50

/** The longest remark a guard may add, well inside a note's own limit. */
export const MAX_EXTRA_GUESTS_REMARK_LENGTH = 280

/** A pass as it was sold, as counts by band — what `priceDayPass` takes. */
export function countsOf(party: readonly DayPassPartyLine[]): Record<string, number> {
  return Object.fromEntries(party.map((line) => [line.bandId, line.count]))
}

/** The bands already sold plus the visitors counted at the gate. */
export function addToParty(
  party: Readonly<Record<string, number>>,
  added: Readonly<Record<string, number>>,
): Record<string, number> {
  const sum: Record<string, number> = { ...party }

  for (const [bandId, count] of Object.entries(added)) {
    sum[bandId] = (sum[bandId] ?? 0) + count
  }

  return sum
}

/** "Adult × 2, Child × 1" — the bands with anybody in them, in the order given. */
export function describeParty(bands: readonly { label: string; count: number }[]): string {
  return bands
    .filter((band) => band.count > 0)
    .map((band) => `${band.label} × ${band.count}`)
    .join(', ')
}

export interface ExtraGuestsNoteInput {
  /** How many more people than the booking is for. */
  extra: number
  /** How many it is for, everybody counted. */
  bookedFor: number
  /** Anything the guard typed. Trimmed; empty adds nothing. */
  remark: string
  /** Set when the guard added them to a pass himself and took the difference. */
  added?: { party: string; nowFor: number; taken: Cents }
}

/** The note the office reads on the booking. */
export function extraGuestsNote(input: ExtraGuestsNoteInput): string {
  const remark = input.remark.trim()
  const said = remark.length > 0 ? ` “${remark}”` : ''

  if (input.added) {
    const { party, nowFor, taken } = input.added

    const money = taken > 0 ? `BND ${formatCents(taken)} taken in cash.` : 'Nothing more to pay.'

    return `Added at the gate: ${party} (the pass is now for ${nowFor}). ${money}${said}`
  }

  const people = input.extra === 1 ? 'person' : 'people'

  return `Reported at the gate: ${input.extra} more ${people} arrived than the booking is for (booked for ${input.bookedFor}).${said}`
}

/** One of a booking's events, as the gate reads them to see what the office already knows. */
export interface PartyEvent {
  action: string
  after: Record<string, unknown> | null
}

/**
 * How many extra people the guards have reported that the office has not yet
 * acted on — so a second guard at the barrier sees it was said already, and
 * does not say it again.
 *
 * Summed over the reports since the party last changed: once the office
 * changes the party, what was reported before it is answered. A report the
 * guard settled himself (he added the visitors to a pass and took the cash)
 * is answered by his own change, so it never counts.
 *
 * `events` are in the order they happened.
 */
export function extraGuestsAwaitingOffice(events: readonly PartyEvent[]): number {
  let awaiting = 0

  for (const event of events) {
    if (event.action === 'booking.party_changed') {
      awaiting = 0
    } else if (
      event.action === 'booking.extra_guests_reported' &&
      typeof event.after?.added_cents !== 'number' &&
      typeof event.after?.extra === 'number'
    ) {
      awaiting += event.after.extra
    }
  }

  return awaiting
}
