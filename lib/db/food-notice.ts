import { foodNoticeWriteMessage } from '@/lib/domain/food-notice'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'
import { listCurrentSiteImages, type SiteImage } from './site-images'

/**
 * What guests are told about food (Jeff, 19 September 2026).
 *
 * Thin over `save_food_notice()` (20261006000200), which holds the stale check
 * and the audit event under one lock per property. The flyer is a photograph
 * in the `food-menu` place, read through the photographs' own module.
 *
 * **It checks no permissions** (architecture.md §4). `requirePermission()` is
 * the first line of the server action that saves it, and the text has already
 * been through lib/domain/food-notice.ts. The readers are public: every
 * confirmed guest is shown the notice.
 */

export interface FoodNotice {
  body: string
  phone: string
  /** Null when nothing has ever been saved. The editor sends it back as-is. */
  updatedAt: string | null
}

export interface FoodNoticeWriteError {
  code: string
  message: string
}

export type FoodNoticeWriteResult =
  | { ok: true; changed: boolean; updatedAt: string | null }
  | { ok: false; error: FoodNoticeWriteError }

/** The notice, or an empty one — which shows nothing — when there is no row. */
export async function readFoodNotice(): Promise<FoodNotice> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('food_notice')
    .select('body, phone, updated_at')
    .eq('property_id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not read the food notice: ${error.message}`)
  }

  const row = data as { body: string; phone: string; updated_at: string } | null

  return row
    ? { body: row.body, phone: row.phone, updatedAt: row.updated_at }
    : { body: '', phone: '', updatedAt: null }
}

/** The menu flyer on the site now, or null when none has been put up. */
export async function readFoodMenuImage(): Promise<SiteImage | null> {
  const images = await listCurrentSiteImages()

  return (
    images.find(
      (image) => image.placement.kind === 'slot' && image.placement.slot === 'food-menu',
    ) ?? null
  )
}

/**
 * Saves the notice. Refused as `stale` when somebody else saved it after
 * `expectedUpdatedAt`, which is the notice as the editor was opened on.
 */
export async function saveFoodNotice(input: {
  body: string
  phone: string
  expectedUpdatedAt: string | null
  actorId: string
}): Promise<FoodNoticeWriteResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('save_food_notice', {
    p_property_id: propertyId,
    p_body: input.body,
    p_phone: input.phone,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not save the food notice: ${error.message}`)
  }

  const result = data as
    { ok: true; changed: boolean; updated_at: string | null } | { ok: false; error: string }

  return result.ok
    ? { ok: true, changed: result.changed, updatedAt: result.updated_at }
    : { ok: false, error: { code: result.error, message: foodNoticeWriteMessage(result.error) } }
}
