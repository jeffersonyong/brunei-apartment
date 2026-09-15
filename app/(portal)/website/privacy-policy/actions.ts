'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth/require-permission'
import { publishPrivacyPolicy, savePrivacyPolicyDraft } from '@/lib/db/privacy-policy'
import {
  checkPrivacyPolicyDraft,
  checkPrivacyPolicyForPublishing,
} from '@/lib/domain/privacy-policy'

/**
 * Saving and publishing the website's privacy policy (capability F10).
 *
 * **The permission is checked before anything is read** — one string,
 * `privacy_policy.manage`, for both (architecture.md §4). The text is then
 * checked in lib/domain/privacy-policy.ts, and the database repeats the length,
 * empty and unfilled-gap checks for a request that did not come through here.
 *
 * A save revalidates this screen only: a draft is not on the website. A
 * publish revalidates every page's layout, because the footer on every public
 * page links to the policy once there is one.
 */

export interface PrivacyPolicyActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  /** False when the save or publish found nothing to change. */
  changed?: boolean
}

const UNREADABLE: PrivacyPolicyActionState = {
  status: 'error',
  message: 'That form could not be read. Reload the page and try again.',
}

const SCREEN = '/website/privacy-policy'

// `expectedUpdatedAt` is empty for a draft that has never been saved.
const policySchema = z.object({ text: z.string(), expectedUpdatedAt: z.string() })

function policyFields(formData: FormData) {
  return {
    text: formData.get('text'),
    expectedUpdatedAt: formData.get('expectedUpdatedAt'),
  }
}

export async function savePrivacyPolicyDraftAction(
  _previous: PrivacyPolicyActionState,
  formData: FormData,
): Promise<PrivacyPolicyActionState> {
  const actor = await requirePermission('privacy_policy.manage')
  const parsed = policySchema.safeParse(policyFields(formData))

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkPrivacyPolicyDraft(parsed.data.text)

  if (!checked.ok) {
    return { status: 'error', message: checked.error }
  }

  const result = await savePrivacyPolicyDraft({
    text: checked.value,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt || null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  if (result.changed) {
    revalidatePath(SCREEN)
  }

  return { status: 'done', changed: result.changed }
}

export async function publishPrivacyPolicyAction(
  _previous: PrivacyPolicyActionState,
  formData: FormData,
): Promise<PrivacyPolicyActionState> {
  const actor = await requirePermission('privacy_policy.manage')
  const parsed = policySchema.safeParse(policyFields(formData))

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkPrivacyPolicyForPublishing(parsed.data.text)

  if (!checked.ok) {
    return { status: 'error', message: checked.error }
  }

  const result = await publishPrivacyPolicy({
    text: checked.value,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt || null,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return { status: 'error', message: result.error.message }
  }

  // The draft may have been saved even when the website already showed this.
  revalidatePath(SCREEN)

  if (result.changed) {
    revalidatePath('/', 'layout')
  }

  return { status: 'done', changed: result.changed }
}
