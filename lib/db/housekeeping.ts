import type { StayDate } from '@/lib/domain/dates'
import type { InspectionOutcome } from '@/lib/domain/inspection'
import {
  compareTurnovers,
  nextGuestArrivesToday,
  turnoverStepOf,
  type TurnoverStep,
} from '@/lib/domain/turnover'
import type { UnitStatus } from '@/lib/domain/unit-status'

import { listHousekeepingNotesFor } from './notes'
import { lastStayFactsOf, listUnitStates, type UnitLastStay, type UnitState } from './units'

/**
 * The housekeeping phone screen's read (capabilities C1, C2, C3).
 *
 * ── The same source as the board ──────────────────────────────────────────
 *
 * Not a query of its own. The list is `listUnitStates()` narrowed to the units
 * with a turnover step, so a unit is on the cleaner's phone exactly when the
 * units board shows it occupied by a guest due out, awaiting inspection, or
 * cleaning. A second query answering "which units need housekeeping" would be
 * the first thing to disagree with the board, and the board is what the office
 * looks at when it asks the cleaner why 3B-04 is not ready.
 *
 * ── What reaches the phone ────────────────────────────────────────────────
 *
 * A phone left in a unit shows every field on `Turnover`, so it carries what a
 * cleaner needs and nothing else: the door, whose stay it was and its
 * reference, the step, whether somebody arrives today, the unit's standing
 * note and the office's notes **for housekeeping** (D-7, open-questions.md
 * N18). No phone number, email, access token, price or deposit, and never an
 * internal note — that audience is filtered out in the query that reads notes,
 * not here.
 */

export interface TurnoverNote {
  id: string
  body: string
  /** ISO timestamp, formatted at the edge. */
  at: string
}

export interface Turnover {
  unitId: string
  unitRef: string
  unitStatus: UnitStatus
  step: TurnoverStep
  bookingId: string
  reference: string
  guestName: string
  /** The stay's last day as booked. */
  departure: StayDate
  inspectionOutcome: InspectionOutcome | null
  nextGuestArrivesToday: boolean
  /** The unit's standing note ("the shower door sticks"), or null. */
  unitNote: string | null
  /** The office's notes for housekeeping on this stay, newest first. */
  housekeepingNotes: readonly TurnoverNote[]
}

/** Every unit with a turnover under way today, in the order a cleaner works them. */
export async function listTurnovers(today: StayDate): Promise<readonly Turnover[]> {
  const units = await listUnitStates(today)

  const waiting = units.flatMap((unit) => {
    const step = turnoverStepOf(
      { lastStay: lastStayFactsOf(unit.lastStay), turnoverTrackedSince: unit.turnoverTrackedSince },
      today,
    )

    return step !== null && unit.lastStay !== null ? [{ unit, step, lastStay: unit.lastStay }] : []
  })

  const notes = await listHousekeepingNotesFor(waiting.map(({ lastStay }) => lastStay.bookingId))

  return waiting
    .map(({ unit, step, lastStay }) =>
      toTurnover(unit, step, lastStay, notes.get(lastStay.bookingId) ?? [], today),
    )
    .sort(compareTurnovers)
}

/**
 * One stay's turnover, read fresh — for the actions, which decide again before
 * they write rather than trusting a list that may be a few minutes old.
 */
export async function getTurnover(bookingId: string, today: StayDate): Promise<Turnover | null> {
  const turnovers = await listTurnovers(today)

  return turnovers.find((turnover) => turnover.bookingId === bookingId) ?? null
}

function toTurnover(
  unit: UnitState,
  step: TurnoverStep,
  lastStay: UnitLastStay,
  notes: readonly { id: string; body: string; at: string }[],
  today: StayDate,
): Turnover {
  return {
    unitId: unit.id,
    unitRef: unit.ref,
    unitStatus: unit.status,
    step,
    bookingId: lastStay.bookingId,
    reference: lastStay.reference,
    guestName: lastStay.guestName,
    departure: lastStay.end,
    inspectionOutcome: lastStay.inspection?.outcome ?? null,
    nextGuestArrivesToday: nextGuestArrivesToday(unit.covering, today),
    unitNote: unit.notes,
    housekeepingNotes: notes.map(({ id, body, at }) => ({ id, body, at })),
  }
}
