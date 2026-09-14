import type { BookingStatus } from '@/lib/domain/booking-state'
import type { StayDate } from '@/lib/domain/dates'
import { gateVerdictOf, type GateFacts, type GateVerdict } from '@/lib/domain/gate'
import type { BookingStream } from '@/lib/domain/stream'
import { unitNotReadyOf } from '@/lib/domain/unit-status'
import { dataClient } from '@/lib/supabase/data'

import { listDepositsForBookings, type Deposit } from './deposits'
import { listBookingIdsAwaitingTransfer } from './payments'
import { currentPropertyId } from './property'
import { readAllRows } from './rows'
import { lastStayFactsOf, listUnitStates } from './units'

/**
 * The gate's reads (capabilities D1–D5).
 *
 * ── What reaches the phone, and what does not ─────────────────────────────
 *
 * The whole list is handed to the browser once so the guard can filter it by
 * plate or name with no second request on a weak signal (register C3). That
 * makes every field on `GateBooking` something a phone left on the guardhouse
 * desk shows. So it carries what a guard needs to recognise a car and decide —
 * reference, name, unit, plates, headcount, whether the unit is ready — and a
 * verdict already decided on the server. **No phone number, email, access
 * token, price or deposit figure.**
 *
 * ── Which bookings are on the list ────────────────────────────────────────
 *
 * Not the dashboard's `confirmed and arriving today`, which is the office's
 * question. The gate also has to see the car it must turn away, so a stay
 * joins the list when it is **open and covers today** — arriving today, due
 * yesterday and still coming, or held on a transfer nobody has checked
 * (prd.md §12 requirement 6) — or when the guest is **checked in**: *leaving*
 * once their last day is today or has passed, because the keys come back to
 * the gate (N54), and *in residence* before that, with a car that comes and
 * goes. A day pass joins on its pass date (N40) and stays once it is admitted,
 * which closes it: day visitors go out and come back. A booking starting on a
 * later day is not on the list; the search finds it, and the verdict sends it
 * to the office.
 *
 * The list is bounded by the building — one open stay per unit per day, plus
 * the day's passes — and is still read through `readAllRows`, because an
 * unchunked read is how a list silently stops at a thousand rows
 * (architecture.md §5.1).
 */

export interface GateReadOptions {
  /**
   * Read the units' turnovers, to say a stay's unit is not ready yet. The list
   * does; an action reading one booking again before it writes does not.
   */
  withReadiness: boolean
}

export interface GateBooking {
  id: string
  reference: string
  stream: BookingStream
  status: BookingStatus
  guestName: string
  /** Null for a day pass, which occupies no unit. */
  unitRef: string | null
  /** The first day of the stay, or the day the pass admits them. */
  arrival: StayDate | null
  /** The day the stay ends. Null for a day pass. */
  departure: StayDate | null
  /** Bodies a day pass admits. Null for a stay. */
  headcount: number | null
  vehicles: readonly string[]
  noVehicle: boolean
  verdict: GateVerdict
  /**
   * The unit this guest is arriving in is not ready: its last guest has not
   * checked out, or the turnover after them is unfinished. Said, never enforced
   * (N53). False for a pass, for a guest already in, and whenever readiness was
   * not read.
   */
  unitNotReady: boolean
}

export interface GateList {
  /** Stays open over today and not yet checked in, by unit. */
  expected: readonly GateBooking[]
  /** Guests checked in whose last day is today or has passed: the keys come back. */
  leaving: readonly GateBooking[]
  /** Today's day passes. */
  dayPasses: readonly GateBooking[]
  /** Guests checked in and not due out, whose cars come and go. */
  inResidence: readonly GateBooking[]
}

interface GateRow {
  id: string
  reference: string
  status: BookingStatus
  stream: BookingStream
  guest_name: string
  vehicles: string[]
  no_vehicle: boolean
  total_cents: number
  security_deposit_cents: number
  paid_cents: number
  unit_id: string | null
  unit_ref: string | null
  check_in: StayDate | null
  check_out: StayDate | null
  pass_date: StayDate | null
  pass_headcount: number | null
}

const GATE_COLUMNS =
  'id, reference, status, stream, guest_name, vehicles, no_vehicle, total_cents, ' +
  'security_deposit_cents, paid_cents, unit_id, unit_ref, check_in, check_out, pass_date, ' +
  'pass_headcount'

/** A booking with somewhere left to go. The closed four never reach a gate. */
const OPEN_STATUSES: readonly BookingStatus[] = [
  'draft',
  'held',
  'awaiting_payment_verification',
  'confirmed',
  'checked_in',
]

/** The most a search returns: a guard scrolls a phone, not a register. */
const SEARCH_LIMIT = 20

/** Long enough for any name or plate, short enough that nobody pastes a page. */
const MAX_SEARCH_LENGTH = 60

/** Everyone the gate should expect today, sorted into what the guard does. */
export async function listGateBookings(
  today: StayDate,
  options: GateReadOptions,
): Promise<GateList> {
  const propertyId = await currentPropertyId()
  const db = dataClient()
  const waiting = OPEN_STATUSES.filter((status) => status !== 'checked_in').join(',')

  const [stays, passes] = await Promise.all([
    readAllRows<GateRow>(
      (from, to) =>
        db
          .from('booking_summary')
          .select(GATE_COLUMNS)
          .eq('property_id', propertyId)
          .not('unit_id', 'is', null)
          .or(
            `status.eq.checked_in,and(status.in.(${waiting}),check_in.lte.${today},check_out.gt.${today})`,
          )
          .order('unit_ref')
          .range(from, to),
      { label: 'the stays expected at the gate' },
    ),
    readAllRows<GateRow>(
      (from, to) =>
        db
          .from('booking_summary')
          .select(GATE_COLUMNS)
          .eq('property_id', propertyId)
          .eq('stream', 'day_pass')
          .eq('pass_date', today)
          // `completed` too: admitting closes a pass, and a visitor who went
          // out for lunch is still today's visitor when the car comes back.
          .in('status', [...OPEN_STATUSES, 'completed'])
          .order('reference')
          .range(from, to),
      { label: "today's day passes" },
    ),
  ])

  const rows = await withVerdicts([...stays, ...passes], today, options)

  return {
    expected: rows.filter((row) => row.stream !== 'day_pass' && row.status !== 'checked_in'),
    leaving: rows.filter((row) => row.verdict.kind === 'leaving'),
    dayPasses: rows.filter((row) => row.stream === 'day_pass'),
    inResidence: rows.filter((row) => row.verdict.kind === 'in_residence'),
  }
}

/**
 * Open bookings matching a plate, a name or a reference, whatever day they
 * start — for the car that is not on today's list.
 */
export async function searchGateBookings(
  term: string,
  today: StayDate,
  options: GateReadOptions,
): Promise<readonly GateBooking[]> {
  const cleaned = term.trim().slice(0, MAX_SEARCH_LENGTH)

  if (cleaned.length === 0) {
    return []
  }

  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('gate_booking_search', {
    p_property_id: propertyId,
    p_term: cleaned,
    p_limit: SEARCH_LIMIT,
  })

  if (error) {
    throw new Error(`Could not search bookings at the gate: ${error.message}`)
  }

  const ids = (data as { booking_id: string }[]).map((row) => row.booking_id)

  if (ids.length === 0) {
    return []
  }

  const { data: rows, error: readError } = await dataClient()
    .from('booking_summary')
    .select(GATE_COLUMNS)
    .eq('property_id', propertyId)
    .in('id', ids)

  if (readError) {
    throw new Error(`Could not read the bookings the gate search found: ${readError.message}`)
  }

  const found = await withVerdicts(rows as unknown as GateRow[], today, options)
  const byId = new Map(found.map((row) => [row.id, row]))

  // The search's own order — nearest arrival first — not the read's.
  return ids.flatMap((id) => {
    const row = byId.get(id)

    return row ? [row] : []
  })
}

/** One booking as the gate sees it, read fresh — for the actions. */
export async function getGateBooking(
  id: string,
  today: StayDate,
  options: GateReadOptions,
): Promise<GateBooking | null> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('booking_summary')
    .select(GATE_COLUMNS)
    .eq('property_id', propertyId)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read booking ${id} for the gate: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const [row] = await withVerdicts([data as unknown as GateRow], today, options)

  return row ?? null
}

/**
 * Decides each row's verdict on the server. The deposits, the transfers still
 * waiting and — when asked — the units' turnovers are one read each for the
 * whole set, never one per row.
 */
async function withVerdicts(
  rows: readonly GateRow[],
  today: StayDate,
  options: GateReadOptions,
): Promise<readonly GateBooking[]> {
  const arriving = rows.filter((row) => isArrivingBy(row, today))

  const [deposits, awaitingTransfer, notReady] = await Promise.all([
    listDepositsForBookings(
      rows.filter((row) => row.security_deposit_cents > 0).map((row) => row.id),
    ),
    listBookingIdsAwaitingTransfer(rows.map((row) => row.id)),
    options.withReadiness && arriving.length > 0
      ? unitsNotReady(today)
      : Promise.resolve<ReadonlySet<string>>(new Set()),
  ])

  return rows.map((row) => {
    const facts = gateFactsOf(
      row,
      deposits.get(row.id) ?? null,
      awaitingTransfer.has(row.id),
      today,
    )

    return {
      id: row.id,
      reference: row.reference,
      stream: row.stream,
      status: row.status,
      guestName: row.guest_name,
      unitRef: row.unit_ref,
      arrival: facts.arrival,
      departure: facts.departure,
      headcount: row.stream === 'day_pass' ? row.pass_headcount : null,
      vehicles: row.vehicles,
      noVehicle: row.no_vehicle,
      verdict: gateVerdictOf(facts),
      unitNotReady: isArrivingBy(row, today) && row.unit_id !== null && notReady.has(row.unit_id),
    }
  })
}

/** A stay not yet checked in whose first day is today or has passed. */
function isArrivingBy(row: GateRow, today: StayDate): boolean {
  return (
    row.stream !== 'day_pass' &&
    row.status !== 'checked_in' &&
    row.check_in !== null &&
    row.check_in <= today
  )
}

/**
 * The units a guest cannot walk straight into today — the last guest still in,
 * or the turnover after them unfinished. One read of the building, the same
 * facts the units board and the cleaner's phone use.
 */
async function unitsNotReady(today: StayDate): Promise<ReadonlySet<string>> {
  const units = await listUnitStates(today)

  return new Set(
    units
      .filter((unit) => unitNotReadyOf(lastStayFactsOf(unit.lastStay), unit.turnoverTrackedSince))
      .map((unit) => unit.id),
  )
}

/** The one place a booking's gate facts are assembled, so every reader agrees. */
function gateFactsOf(
  row: GateRow,
  deposit: Deposit | null,
  transferPending: boolean,
  today: StayDate,
): GateFacts {
  const isPass = row.stream === 'day_pass'
  const collected = deposit !== null && deposit.collectedAt !== null

  return {
    status: row.status,
    stream: row.stream,
    arrival: isPass ? row.pass_date : row.check_in,
    departure: isPass ? null : row.check_out,
    today,
    deposit: {
      quoted: row.security_deposit_cents,
      held: collected ? deposit.amount : 0,
      collected,
      promised: deposit !== null && deposit.promisedAt !== null && !collected,
    },
    total: row.total_cents,
    paid: row.paid_cents,
    transferPending,
  }
}
