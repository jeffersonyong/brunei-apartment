import { slugFromName, type CheckedExtra, type PropertyExtra } from '@/lib/domain/extras'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * The extras a stay can add (capability F13).
 *
 * Thin over the writers in 20261003000100, which hold every rule that spans
 * rows — one address per property, one place per position, a stock figure that
 * cannot be dropped below what is already sold — under one lock per property.
 * What this adds is the address itself, derived here because only
 * lib/domain/extras.ts knows how, and the refusal codes turned into sentences.
 *
 * **It checks no permissions** (architecture.md §4). `requirePermission()` is
 * the first line of every server action that calls this, and the drafts it is
 * given have already been through `checkExtraDraft()`.
 */

/** Far more extras than any property configures. A bound, not paging. */
const READ_LIMIT = 200

export interface ExtraWriteError {
  code: string
  message: string
}

export type ExtraWriteResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: ExtraWriteError }

interface RpcRefusal {
  ok: false
  error: string
  committed?: number
}

interface ExtraRow {
  id: string
  slug: string
  name: string
  description: string | null
  fee_cents: number
  stock: number | null
  bookable: boolean
  sort_order: number
  retired_at: string | null
  updated_at: string
}

const EXTRA_COLUMNS =
  'id, slug, name, description, fee_cents, stock, bookable, sort_order, retired_at, updated_at'

function toExtra(row: ExtraRow): PropertyExtra {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    fee: row.fee_cents,
    stock: row.stock,
    bookable: row.bookable,
    sortOrder: row.sort_order,
    retiredAt: row.retired_at,
    updatedAt: row.updated_at,
  }
}

/**
 * A refusal a member of staff can act on.
 *
 * `stock_below_committed` is the one that carries a number, because "you
 * cannot say two" is useless without "four are in rooms this week".
 */
function extraWriteMessage(code: string, committed?: number): string {
  switch (code) {
    case 'actor_required':
      return 'Sign in again — the change was not saved.'
    case 'not_found':
      return 'That extra is no longer there. Reload the page.'
    case 'stale':
      return 'Somebody else changed this extra while you had it open. Reload and try again.'
    case 'name_invalid':
      return 'Give the extra a name of 60 characters or fewer.'
    case 'description_invalid':
      return 'Keep the description to 200 characters or fewer.'
    case 'fee_invalid':
      return 'Enter the price in BND.'
    case 'slug_invalid':
      return 'The name needs at least one letter or number.'
    case 'stock_invalid':
      return 'Enter a whole number, or leave it blank.'
    case 'stock_below_committed':
      return committed === undefined
        ? 'Bookings already hold more than that.'
        : `Bookings already hold ${committed}. Take that many or more, or amend the bookings first.`
    case 'direction_invalid':
      return 'That move did not make sense. Reload the page.'
    default:
      return 'The change could not be saved.'
  }
}

function refused(code: string, committed?: number): { ok: false; error: ExtraWriteError } {
  return { ok: false, error: { code, message: extraWriteMessage(code, committed) } }
}

/* ── Reading ──────────────────────────────────────────────────────────────── */

/**
 * Every extra, in list order, retired ones last.
 *
 * Retired rows are included because the settings screen shows them under their
 * own heading so they can be restored, and because repricing an amendment must
 * find the fee an extra was sold at even after it came off the form.
 */
export async function listBookingExtras(): Promise<readonly PropertyExtra[]> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('booking_extra')
    .select(EXTRA_COLUMNS)
    .eq('property_id', propertyId)
    .order('retired_at', { ascending: true, nullsFirst: true })
    .order('sort_order')
    .limit(READ_LIMIT)

  if (error) {
    throw new Error(`Could not read the extras: ${error.message}`)
  }

  return (data as ExtraRow[]).map(toExtra)
}

/**
 * How many of each extra are held on the busiest night of a range.
 *
 * The same function the database's own rule uses, so what a booking form
 * promises and what the insert allows are one calculation rather than two that
 * agree today. `excludeBookingId` is the booking being amended — its own beds
 * are not competition for itself.
 *
 * Keyed by extra id; an extra nobody is holding is absent, which callers read
 * as zero.
 */
export async function extrasInUse(input: {
  checkIn: string
  checkOut: string
  excludeBookingId?: string | null
}): Promise<Readonly<Record<string, number>>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('extras_in_use', {
    p_property_id: propertyId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_exclude_booking_id: input.excludeBookingId ?? null,
  })

  if (error) {
    throw new Error(`Could not check what the extras are holding: ${error.message}`)
  }

  const rows = (data ?? []) as { extra_id: string; peak: number }[]

  return Object.fromEntries(rows.map((row) => [row.extra_id, row.peak]))
}

/**
 * The refusal the stock trigger raises, turned into a sentence — or null if
 * this error was something else.
 *
 * `booking_line_extra_within_stock` is deferred, so it fires as the
 * transaction commits rather than inside the booking RPC. That means no
 * plpgsql exception handler ever sees it and it reaches us as a Postgres error
 * on the call itself. The message carries the extra's name and how many are
 * left, which is the only version of this a guest or a clerk can act on.
 */
export function extraUnavailableMessage(message: string): string | null {
  const match = /extra_unavailable:([^:]*):(\d+)/.exec(message)

  if (!match) {
    return null
  }

  const name = (match[1] ?? '').trim()
  const left = Number(match[2])

  const thing = name === '' ? 'extra' : name.toLowerCase()

  return left === 0
    ? `Every ${thing} is taken for those nights.`
    : `Only ${left} ${thing} ${left === 1 ? 'is' : 'are'} free for those nights.`
}

/* ── Writing ──────────────────────────────────────────────────────────────── */

/** A new extra, at the end of the list. */
export async function addBookingExtra(input: {
  draft: CheckedExtra
  actorId: string
}): Promise<ExtraWriteResult<{ id: string; slug: string }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('add_booking_extra', {
    p_property_id: propertyId,
    p_slug: slugFromName(input.draft.name),
    p_name: input.draft.name,
    p_description: input.draft.description,
    p_fee_cents: input.draft.feeCents,
    p_stock: input.draft.stock,
    p_bookable: input.draft.bookable,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not add the extra: ${error.message}`)
  }

  const result = data as { ok: true; id: string; slug: string } | RpcRefusal

  return result.ok ? { ok: true, id: result.id, slug: result.slug } : refused(result.error)
}

/**
 * An extra rewritten from the editor. Refused as `stale` when somebody else
 * saved it after `expectedUpdatedAt`, and as `stock_below_committed` when the
 * new count is under what live bookings already hold.
 */
export async function updateBookingExtra(input: {
  extraId: string
  draft: CheckedExtra
  expectedUpdatedAt: string
  actorId: string
}): Promise<ExtraWriteResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('update_booking_extra', {
    p_property_id: propertyId,
    p_extra_id: input.extraId,
    p_name: input.draft.name,
    p_description: input.draft.description,
    p_fee_cents: input.draft.feeCents,
    p_stock: input.draft.stock,
    p_bookable: input.draft.bookable,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not save the extra: ${error.message}`)
  }

  const result = data as { ok: true } | RpcRefusal

  return result.ok ? { ok: true } : refused(result.error, result.committed)
}

/** One place up or down in the booking form's list. */
export async function moveBookingExtra(input: {
  extraId: string
  direction: 'up' | 'down'
  actorId: string
}): Promise<ExtraWriteResult<{ moved: boolean }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('move_booking_extra', {
    p_property_id: propertyId,
    p_extra_id: input.extraId,
    p_direction: input.direction,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not reorder the extras: ${error.message}`)
  }

  const result = data as { ok: true; moved: boolean } | RpcRefusal

  return result.ok ? { ok: true, moved: result.moved } : refused(result.error)
}

/**
 * Removal, which sets `retired_at` and never deletes. Bookings that already
 * hold one keep it, on the receipt and in the count.
 */
export async function retireBookingExtra(input: {
  extraId: string
  actorId: string
}): Promise<ExtraWriteResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('retire_booking_extra', {
    p_property_id: propertyId,
    p_extra_id: input.extraId,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not remove the extra: ${error.message}`)
  }

  const result = data as { ok: true } | RpcRefusal

  return result.ok ? { ok: true } : refused(result.error)
}

/** Put back, at the end of the list and not on the booking form until asked. */
export async function restoreBookingExtra(input: {
  extraId: string
  actorId: string
}): Promise<ExtraWriteResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('restore_booking_extra', {
    p_property_id: propertyId,
    p_extra_id: input.extraId,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not restore the extra: ${error.message}`)
  }

  const result = data as { ok: true } | RpcRefusal

  return result.ok ? { ok: true } : refused(result.error)
}
