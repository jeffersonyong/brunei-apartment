import {
  arrivalReadinessOf,
  arrivalWindowOf,
  ARRIVING_STATUSES,
  compareArrivalsAhead,
  housekeepingNeedsOf,
  type ArrivalReadiness,
  type HousekeepingNeeds,
} from '@/lib/domain/arrivals-ahead'
import { nightsBetween, type StayDate } from '@/lib/domain/dates'
import type { InspectionOutcome } from '@/lib/domain/inspection'
import type { BookingLine } from '@/lib/domain/lines'
import { dataClient } from '@/lib/supabase/data'
import {
  compareTurnovers,
  nextGuestArrivesToday,
  turnoverStepOf,
  type TurnoverStep,
} from '@/lib/domain/turnover'
import type { UnitStatus } from '@/lib/domain/unit-status'

import { listHousekeepingNotesFor } from './notes'
import { currentPropertyId } from './property'
import { readAllRows } from './rows'
import { lastStayFactsOf, listUnitStates, type UnitLastStay, type UnitState } from './units'

/**
 * The housekeeping phone screen's read (capabilities C1, C2, C3, and C4's
 * guests on their way).
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

/**
 * A guest on their way, as the cleaner's phone shows them (capability C4).
 *
 * Read-only, and shaped for a phone left in a unit like `Turnover` is: the
 * door, when, how many, what to set up, and whether the unit will be ready.
 * **No name, no phone and no price** — the reference is there so the cleaner
 * can ask the office about a booking without reading anybody's details off it.
 */
export interface ArrivalAhead {
  reference: string
  unitRef: string
  /** The unit's status on the board today, which may be somebody else's stay. */
  unitStatus: UnitStatus
  arrival: StayDate
  nights: number
  /** Everyone on the booking, of any age. */
  guests: number
  /** False while the transfer is still being checked. */
  confirmed: boolean
  needs: HousekeepingNeeds
  readiness: ArrivalReadiness
}

/** The whole Departures screen: what to do now, and who is coming. */
export interface DeparturesBoard {
  turnovers: readonly Turnover[]
  arrivals: readonly ArrivalAhead[]
}

/**
 * Both halves of the cleaner's screen from one read of the units board.
 *
 * `unit_state()` is the expensive read, and both halves need it — the
 * turnovers for their steps, the arrivals for whether their unit will be
 * ready — so it is read once and shared rather than once per half.
 */
export async function listDeparturesBoard(today: StayDate): Promise<DeparturesBoard> {
  const [units, arriving] = await Promise.all([listUnitStates(today), readArrivalsAhead(today)])

  return {
    turnovers: await turnoversFrom(units, today),
    arrivals: arrivalsFrom(arriving, units, today),
  }
}

/** Every unit with a turnover under way today, in the order a cleaner works them. */
export async function listTurnovers(today: StayDate): Promise<readonly Turnover[]> {
  return turnoversFrom(await listUnitStates(today), today)
}

async function turnoversFrom(
  units: readonly UnitState[],
  today: StayDate,
): Promise<readonly Turnover[]> {
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

// ── The guests on their way (capability C4) ─────────────────────────────────

/**
 * Only what the card needs. The guest's name, phone and the booking's money
 * are never selected, so they cannot reach the phone by a later mistake in the
 * mapping. The lines are read for their extras and are reduced to names and
 * quantities before anything leaves this module.
 */
const ARRIVAL_COLUMNS =
  'reference, status, unit_id, check_in, check_out, chargeable_guests, exempt_guests, lines'

interface ArrivalRow {
  reference: string
  status: string
  unit_id: string | null
  check_in: StayDate | null
  check_out: StayDate | null
  chargeable_guests: number
  exempt_guests: number
  lines: BookingLine[]
}

/** Short stays starting in the window, confirmed or with their transfer being checked. */
async function readArrivalsAhead(today: StayDate): Promise<readonly ArrivalRow[]> {
  const propertyId = await currentPropertyId()
  const window = arrivalWindowOf(today)

  return readAllRows<ArrivalRow>(
    (from, to) =>
      dataClient()
        .from('booking_summary')
        .select(ARRIVAL_COLUMNS)
        .eq('property_id', propertyId)
        .eq('stream', 'short_stay')
        .in('status', [...ARRIVING_STATUSES])
        .gte('check_in', window.from)
        .lte('check_in', window.to)
        .order('check_in')
        .order('reference')
        .range(from, to),
    { label: 'the guests arriving in the next few days' },
  )
}

function arrivalsFrom(
  rows: readonly ArrivalRow[],
  units: readonly UnitState[],
  today: StayDate,
): readonly ArrivalAhead[] {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]))

  return rows
    .flatMap((row) => {
      const unit = row.unit_id === null ? undefined : unitsById.get(row.unit_id)

      // A stay always has both, and a unit the board does not list is one
      // retired since; neither has a door to send a cleaner to.
      return unit && row.check_in && row.check_out
        ? [toArrivalAhead(row, unit, row.check_in, row.check_out, today)]
        : []
    })
    .sort((a, b) =>
      compareArrivalsAhead(
        { arrival: a.arrival, unitRef: a.unitRef },
        { arrival: b.arrival, unitRef: b.unitRef },
      ),
    )
}

function toArrivalAhead(
  row: ArrivalRow,
  unit: UnitState,
  checkIn: StayDate,
  checkOut: StayDate,
  today: StayDate,
): ArrivalAhead {
  const readiness = arrivalReadinessOf(
    { reference: row.reference, date: checkIn },
    {
      outOfService: unit.outOfService !== null,
      lastStay: lastStayFactsOf(unit.lastStay),
      turnoverTrackedSince: unit.turnoverTrackedSince,
      covering: unit.covering
        ? {
            bookingReference: unit.covering.bookingReference,
            status: unit.covering.status,
            end: unit.covering.end,
          }
        : null,
      nextStart: unit.nextStart,
    },
    today,
  )

  return {
    reference: row.reference,
    unitRef: unit.ref,
    unitStatus: unit.status,
    arrival: checkIn,
    nights: nightsBetween(checkIn, checkOut),
    guests: row.chargeable_guests + row.exempt_guests,
    confirmed: row.status === 'confirmed',
    needs: housekeepingNeedsOf(row.lines),
    readiness,
  }
}
