'use server'

import { refresh, revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth/require-permission'
import {
  addFaq,
  moveFaq,
  removeFaq,
  setFaqFeatured,
  updateFaq,
  type FaqWriteError,
} from '@/lib/db/faqs'
import { checkFaqDraft, type FaqDraftField } from '@/lib/domain/faq'

/**
 * Adding, editing, reordering and removing the website's FAQs, and choosing
 * the front page's (capability F9).
 *
 * **The permission is checked before anything is read** — one string,
 * `faq.manage`, for every action, so there is nothing to look up first
 * (architecture.md §4). The draft is then checked in lib/domain/faq.ts, which
 * is the only place that knows which `{live figures}` exist; the database
 * repeats the length and topic checks for a request that did not come through
 * here.
 *
 * Every change revalidates three paths: this screen, the FAQs page, and the
 * landing page, which is static and would otherwise keep its old FAQs until
 * its hourly regeneration.
 */

export interface FaqActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  fieldErrors?: Partial<Record<FaqDraftField, string>>
}

const UNREADABLE: FaqActionState = {
  status: 'error',
  message: 'That form could not be read. Reload the page and try again.',
}

const flag = z.enum(['true', 'false'])

const draftSchema = z.object({
  topic: z.string(),
  question: z.string(),
  answer: z.string(),
  featured: flag,
})

const editSchema = draftSchema.extend({
  faqId: z.uuid(),
  expectedUpdatedAt: z.string().min(1),
})

const featuredSchema = z.object({ faqId: z.uuid(), featured: flag })
const moveSchema = z.object({ faqId: z.uuid(), direction: z.enum(['up', 'down']) })
const removeSchema = z.object({ faqId: z.uuid() })

function draftFields(formData: FormData) {
  return {
    topic: formData.get('topic'),
    question: formData.get('question'),
    answer: formData.get('answer'),
    featured: formData.get('featured'),
  }
}

export async function addFaqAction(
  _previous: FaqActionState,
  formData: FormData,
): Promise<FaqActionState> {
  const actor = await requirePermission('faq.manage')
  const parsed = draftSchema.safeParse(draftFields(formData))

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkFaqDraft(parsed.data)

  if (!checked.ok) {
    return { status: 'error', fieldErrors: checked.errors }
  }

  const result = await addFaq({
    draft: checked.value,
    featured: parsed.data.featured === 'true',
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateFaqs()

  return { status: 'done' }
}

export async function updateFaqAction(
  _previous: FaqActionState,
  formData: FormData,
): Promise<FaqActionState> {
  const actor = await requirePermission('faq.manage')
  const parsed = editSchema.safeParse({
    ...draftFields(formData),
    faqId: formData.get('faqId'),
    expectedUpdatedAt: formData.get('expectedUpdatedAt'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkFaqDraft(parsed.data)

  if (!checked.ok) {
    return { status: 'error', fieldErrors: checked.errors }
  }

  const result = await updateFaq({
    faqId: parsed.data.faqId,
    draft: checked.value,
    featured: parsed.data.featured === 'true',
    expectedUpdatedAt: parsed.data.expectedUpdatedAt,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  if (result.changed) {
    revalidateFaqs()
  }

  return { status: 'done' }
}

export async function setFaqFeaturedAction(
  _previous: FaqActionState,
  formData: FormData,
): Promise<FaqActionState> {
  const actor = await requirePermission('faq.manage')
  const parsed = featuredSchema.safeParse({
    faqId: formData.get('faqId'),
    featured: formData.get('featured'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await setFaqFeatured({
    faqId: parsed.data.faqId,
    featured: parsed.data.featured === 'true',
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  if (result.changed) {
    revalidateFaqs()
  } else {
    // Nothing was written, so nothing else is stale, but this screen may be:
    // "unchanged" also means someone else made the same change while it was
    // open. `refresh()` re-renders this screen alone in the response.
    refresh()
  }

  return { status: 'done' }
}

export async function moveFaqAction(
  _previous: FaqActionState,
  formData: FormData,
): Promise<FaqActionState> {
  const actor = await requirePermission('faq.manage')
  const parsed = moveSchema.safeParse({
    faqId: formData.get('faqId'),
    direction: formData.get('direction'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await moveFaq({ ...parsed.data, actorId: actor.userId })

  if (!result.ok) {
    return refused(result.error)
  }

  if (result.changed) {
    revalidateFaqs()
  } else {
    // Nothing was written, so nothing else is stale, but this screen may be:
    // "unchanged" also means someone else made the same change while it was
    // open. `refresh()` re-renders this screen alone in the response.
    refresh()
  }

  return { status: 'done' }
}

export async function removeFaqAction(
  _previous: FaqActionState,
  formData: FormData,
): Promise<FaqActionState> {
  const actor = await requirePermission('faq.manage')
  const parsed = removeSchema.safeParse({ faqId: formData.get('faqId') })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await removeFaq({ faqId: parsed.data.faqId, actorId: actor.userId })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateFaqs()

  return { status: 'done' }
}

/** A refusal belongs under the field it is about, where the editor has one. */
const FIELD_FOR_CODE: Readonly<Record<string, FaqDraftField>> = {
  topic_invalid: 'topic',
  question_invalid: 'question',
  slug_invalid: 'question',
  answer_invalid: 'answer',
}

function refused(error: FaqWriteError): FaqActionState {
  const field = FIELD_FOR_CODE[error.code]

  return field
    ? { status: 'error', fieldErrors: { [field]: error.message } }
    : { status: 'error', message: error.message }
}

function revalidateFaqs(): void {
  revalidatePath('/')
  revalidatePath('/faq')
  revalidatePath('/settings/website')
}
