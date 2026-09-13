import type { BookingStatus } from '@/lib/domain/booking-state'
import type { StayDate } from '@/lib/domain/dates'
import { gateVerdictOf, type GateVerdict } from '@/lib/domain/gate'
import type { BookingStream } from '@/lib/domain/stream'
import { dataClient } from '@/lib/supabase/data'

import { listDepositsForBookings, type Deposit } from './deposits'
import { currentPropertyId } from './property'
import { readAllRows } from './rows'

/**
 * The gate's reads (capabilities D1, D2, D4).
 *
 * ── What reaches the phone, and what does not ─────────────────────────────
 *
 * The whole list is handed to the browser once so the guard can filter it by
 * plate or name with no second request on a weak signal (register C3). That
 * makes every field on `GateBooking` something a phone left on the guardhouse
 * desk shows. So it carries what a guard needs to recognise a car and decide —
 * reference, name, unit, plates, headcount — and a verdict already decided on
 * the server. **No phone number, email, access token, price or deposit
 * figure**: the guard does not take money, and the verdict is the only thing
 * the money facts were for.
 *
 * ── Which bookings are "expected" ─────────────────────────────────────────
 *
 * Not the dashboard's `confirmed and arriving today`, which is the desk's
 * question. The gate also has to see the car it must turn away, so a stay
 * joins the list when it is **open and covers today** — arriving today, due
 * yesterday and still coming, or held on a transfer nobody has checked
 * (prd.md §12 requirement 6) — or when the guest is **checked in**, whose car
 * comes and goes all stay. A day pass joins on its pass date (N40, answered
 * 13 September 2026). A booking starting on a later day is not expected; the
 * search finds it, and the verdict sends it to the office.
 *
 * The list is bounded by the building — one open stay per unit per day, plus
 * the day's passes — and is still read through `readAllRows`, because an
 * unchunked read is how a list silently stops at a thousand rows
 * (architecture.md §5.1).
 */

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
}

export interface GateList {
  /** Stays open over today and not yet checked in, by unit. */
  expected: readonly GateBooking[]
  /** Today's day passes. */
  dayPasses: readonly GateBooking[]
  /** Guests checked in, whose cars come and go. */
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
  unit_ref: string | null
  check_in: StayDate | null
  check_out: StayDate | null
  pass_date: StayDate | null
  pass_headcount: number | null
}

const GATE_COLUMNS =
  'id, reference, status, stream, guest_name, vehicles, no_vehicle, total_cents, ' +
  'security_deposit_cents, paid_cents, unit_ref, check_in, check_out, pass_date, pass_headcount'

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
export async function listGateBookings(today: StayDate): Promise<GateList> {
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
          .in('status', [...OPEN_STATUSES])
          .order('reference')
          .range(from, to),
      { label: "today's day passes" },
    ),
  ])

  const rows = await withVerdicts([...stays, ...passes], today)

  return {
    expected: rows.filter((row) => row.stream !== 'day_pass' && row.status !== 'checked_in'),
    dayPasses: rows.filter((row) => row.stream === 'day_pass'),
    inResidence: rows.filter((row) => row.stream !== 'day_pass' && row.status === 'checked_in'),
  }
}

/**
 * Open bookings matching a plate, a name or a reference, whatever day they
 * start — for the car that is not on today's list.
 */
export async function searchGateBookings(
  term: string,
  today: StayDate,
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

  const found = await withVerdicts(rows as unknown as GateRow[], today)
  const byId = new Map(found.map((row) => [row.id, row]))

  // The search's own order — nearest arrival first — not the read's.
  return ids.flatMap((id) => {
    const row = byId.get(id)

    return row ? [row] : []
  })
}

/** One booking as the gate sees it, read fresh — for the check-in action. */
export async function getGateBooking(id: string, today: StayDate): Promise<GateBooking | null> {
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

  const [row] = await withVerdicts([data as unknown as GateRow], today)

  return row ?? null
}

/** Decides each row's verdict on the server, with one deposit read for all of them. */
async function withVerdicts(
  rows: readonly GateRow[],
  today: StayDate,
): Promise<readonly GateBooking[]> {
  const deposits = await listDepositsForBookings(
    rows.filter((row) => row.security_deposit_cents > 0).map((row) => row.id),
  )

  return rows.map((row) => toGateBooking(row, deposits.get(row.id) ?? null, today))
}

function toGateBooking(row: GateRow, deposit: Deposit | null, today: StayDate): GateBooking {
  const isPass = row.stream === 'day_pass'
  const arrival = isPass ? row.pass_date : row.check_in
  const collected = deposit !== null && deposit.collectedAt !== null

  return {
    id: row.id,
    reference: row.reference,
    stream: row.stream,
    status: row.status,
    guestName: row.guest_name,
    unitRef: row.unit_ref,
    arrival,
    departure: isPass ? null : row.check_out,
    headcount: isPass ? row.pass_headcount : null,
    vehicles: row.vehicles,
    noVehicle: row.no_vehicle,
    verdict: gateVerdictOf({
      status: row.status,
      stream: row.stream,
      arrival,
      today,
      deposit: {
        quoted: row.security_deposit_cents,
        held: collected ? deposit.amount : 0,
        collected,
        promised: deposit !== null && deposit.promisedAt !== null && !collected,
      },
      total: row.total_cents,
      paid: row.paid_cents,
    }),
  }
}
