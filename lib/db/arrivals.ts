import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * How many people have come through the gate on each booking (capability D8).
 *
 * The count lives beside the booking in `booking_arrival`, one row from the
 * moment a booking is checked in or admitted — `check_in_booking()` and
 * `admit_day_pass()` take the first count, the whole party when none is given
 * — and `record_gate_arrivals()` changes it afterwards: more people through,
 * or a mis-tap corrected. Each change is an event in the booking's history.
 * Why a table of its own rather than a column on `booking` is in the
 * migration (20261007000100): a booking column would re-queue the accounting
 * pack and trip the office's open forms on every count.
 */

/**
 * The count for each booking, keyed by booking — one read for the whole set,
 * never one per booking. A booking not let in yet is absent.
 */
export async function listArrivals(
  bookingIds: readonly string[],
): Promise<ReadonlyMap<string, number>> {
  if (bookingIds.length === 0) {
    return new Map()
  }

  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('booking_arrival')
    .select('booking_id, arrived')
    .eq('property_id', propertyId)
    .in('booking_id', [...bookingIds])

  if (error) {
    throw new Error(`Could not read who has come through the gate: ${error.message}`)
  }

  return new Map(
    (data as { booking_id: string; arrived: number }[]).map((row) => [row.booking_id, row.arrived]),
  )
}

export interface RecordGateArrivalsInput {
  bookingId: string
  /** The count the guard was shown when he opened the dialog. */
  expectedArrived: number
  /** The new total. */
  arrived: number
  /** A mis-tap put right rather than more people through — only the history says so. */
  corrected: boolean
  actorId: string | null
}

/** Refusals that hand back the count as it stands, so the guard can be shown it. */
export type ArrivalsCountRefusal = {
  code: 'changed' | 'unchanged'
  arrived: number
  booked: number
}

export type RecordGateArrivalsResult =
  | { ok: true; arrived: number; booked: number }
  | {
      ok: false
      error: ArrivalsCountRefusal | { code: 'not_found' | 'not_in' | 'not_today' | 'closed' }
    }

interface RpcResult {
  ok: boolean
  error?: 'not_found' | 'not_in' | 'not_today' | 'closed' | 'changed' | 'unchanged'
  arrived?: number
  booked?: number
}

/**
 * Sets the count on a booking already let in. Refused as a value — never
 * thrown — when the count moved since the guard saw it, when it is already
 * that number, or when the booking cannot be counted: not let in yet, closed,
 * or a pass on another day. A count below nothing is a programming error and
 * throws.
 */
export async function recordGateArrivals(
  input: RecordGateArrivalsInput,
): Promise<RecordGateArrivalsResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('record_gate_arrivals', {
    p_property_id: propertyId,
    p_booking_id: input.bookingId,
    p_expected_arrived: input.expectedArrived,
    p_arrived: input.arrived,
    p_corrected: input.corrected,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not record who came through the gate: ${error.message}`)
  }

  const result = data as RpcResult

  if (result.ok) {
    return { ok: true, arrived: result.arrived ?? input.arrived, booked: result.booked ?? 0 }
  }

  switch (result.error) {
    case 'changed':
    case 'unchanged':
      return {
        ok: false,
        error: { code: result.error, arrived: result.arrived ?? 0, booked: result.booked ?? 0 },
      }
    case 'not_found':
    case 'not_in':
    case 'not_today':
    case 'closed':
      return { ok: false, error: { code: result.error } }
    default:
      throw new Error(`record_gate_arrivals answered with an unknown refusal: ${result.error}`)
  }
}
