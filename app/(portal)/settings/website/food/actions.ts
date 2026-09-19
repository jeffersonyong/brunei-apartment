'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth/require-permission'
import { saveFoodNotice } from '@/lib/db/food-notice'
import { checkFoodNoticeDraft, type FoodNoticeField } from '@/lib/domain/food-notice'

/**
 * Saving what guests are told about food (Jeff, 19 September 2026).
 *
 * **The permission is checked before anything is read** — `site_image.manage`,
 * the flyer's own, because the notice is the flyer's caption and the two are
 * edited on one tab. The text is then checked in lib/domain/food-notice.ts,
 * and save_food_notice() repeats the checks for a request that did not come
 * through here.
 *
 * The flyer is placed, replaced and removed through the Photos tab's actions,
 * which already revalidate the food page.
 */

export interface FoodNoticeActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  fieldErrors?: Partial<Record<FoodNoticeField, string>>
  /** False when the save found nothing to change. */
  changed?: boolean
  /** The notice's new version, for the next save's stale check. */
  updatedAt?: string | null
}

const UNREADABLE: FoodNoticeActionState = {
  status: 'error',
  message: 'That form could not be read. Reload the page and try again.',
}

// `expectedUpdatedAt` is empty for a notice that has never been saved.
const noticeSchema = z.object({
  body: z.string(),
  phone: z.string(),
  expectedUpdatedAt: z.string(),
})

export async function saveFoodNoticeAction(
  _previous: FoodNoticeActionState,
  formData: FormData,
): Promise<FoodNoticeActionState> {
  const actor = await requirePermission('site_image.manage')
  const parsed = noticeSchema.safeParse({
    body: formData.get('body'),
    phone: formData.get('phone'),
    expectedUpdatedAt: formData.get('expectedUpdatedAt'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkFoodNoticeDraft(parsed.data)

  if (!checked.ok) {
    return { status: 'error', fieldErrors: checked.errors }
  }

  const result = await saveFoodNotice({
    ...checked.value,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt || null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  // The booking page and the email read the notice as they render, so the
  // food page and this screen are the only two held in a cache.
  if (result.changed) {
    revalidatePath('/food')
    revalidatePath('/settings/website')
  }

  return { status: 'done', changed: result.changed, updatedAt: result.updatedAt }
}
