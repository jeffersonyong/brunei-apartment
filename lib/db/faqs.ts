import {
  faqWriteMessage,
  isFaqTopicId,
  slugFromQuestion,
  type Faq,
  type FaqDraft,
} from '@/lib/domain/faq'
import { dataClient } from '@/lib/supabase/data'

import { currentPropertyId } from './property'

/**
 * The FAQs on the public site (capabilities A10 and F9).
 *
 * Thin over the writers in 20260928000100, which hold every rule that spans
 * rows — six on the front page at most, one place per position in a topic, an
 * address nothing else uses — under one lock per property. What this adds is
 * the address itself, derived from the question here because only
 * lib/domain/faq.ts knows how, and the refusal codes turned into sentences.
 *
 * **It checks no permissions** (architecture.md §4). `requirePermission()` is
 * the first line of every server action that calls this, and the drafts it is
 * given have already been through `checkFaqDraft()`.
 */

/**
 * Far more FAQs than any page would hold. A bound rather than paging: every
 * reader wants the whole list, and a property writes a few dozen.
 */
const READ_LIMIT = 500

export interface FaqWriteError {
  code: string
  message: string
}

export type FaqWriteResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: FaqWriteError }

interface RpcRefusal {
  ok: false
  error: string
}

interface FaqRow {
  id: string
  slug: string
  topic: string
  question: string
  answer: string
  featured: boolean
  sort_order: number
  updated_at: string
  updated_by: string | null
}

const FAQ_COLUMNS =
  'id, slug, topic, question, answer, featured, sort_order, updated_at, updated_by'

function toFaq(row: FaqRow): Faq | null {
  // The topic check makes an unknown topic impossible. Were one to appear, a
  // FAQ with nowhere to be shown is left off rather than filed under a guess.
  if (!isFaqTopicId(row.topic)) {
    return null
  }

  return {
    id: row.id,
    slug: row.slug,
    topic: row.topic,
    question: row.question,
    answer: row.answer,
    featured: row.featured,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }
}

function refused(code: string): { ok: false; error: FaqWriteError } {
  return { ok: false, error: { code, message: faqWriteMessage(code) } }
}

/* ── Reading ──────────────────────────────────────────────────────────────── */

/** Every FAQ, in topic and page order. */
export async function listFaqs(): Promise<readonly Faq[]> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient()
    .from('faq')
    .select(FAQ_COLUMNS)
    .eq('property_id', propertyId)
    .order('topic')
    .order('sort_order')
    .limit(READ_LIMIT)

  if (error) {
    throw new Error(`Could not read the FAQs: ${error.message}`)
  }

  return (data as FaqRow[]).flatMap((row) => toFaq(row) ?? [])
}

/* ── Writing ──────────────────────────────────────────────────────────────── */

/** A new FAQ, at the end of its topic. */
export async function addFaq(input: {
  draft: FaqDraft
  featured: boolean
  actorId: string
}): Promise<FaqWriteResult<{ id: string; slug: string }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('add_faq', {
    p_property_id: propertyId,
    p_topic: input.draft.topic,
    p_slug: slugFromQuestion(input.draft.question),
    p_question: input.draft.question,
    p_answer: input.draft.answer,
    p_featured: input.featured,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not add the FAQ: ${error.message}`)
  }

  const result = data as { ok: true; id: string; slug: string } | RpcRefusal

  return result.ok ? { ok: true, id: result.id, slug: result.slug } : refused(result.error)
}

/**
 * A FAQ rewritten from the editor. Refused as `stale` when somebody else saved
 * it after `expectedUpdatedAt`, which is the FAQ as the editor was opened on.
 */
export async function updateFaq(input: {
  faqId: string
  draft: FaqDraft
  featured: boolean
  expectedUpdatedAt: string
  actorId: string
}): Promise<FaqWriteResult<{ changed: boolean }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('update_faq', {
    p_property_id: propertyId,
    p_faq_id: input.faqId,
    p_topic: input.draft.topic,
    p_question: input.draft.question,
    p_answer: input.draft.answer,
    p_featured: input.featured,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not save the FAQ: ${error.message}`)
  }

  const result = data as { ok: true; changed: boolean } | RpcRefusal

  return result.ok ? { ok: true, changed: result.changed } : refused(result.error)
}

/** On or off the front page, from the list. */
export async function setFaqFeatured(input: {
  faqId: string
  featured: boolean
  actorId: string
}): Promise<FaqWriteResult<{ changed: boolean }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('set_faq_featured', {
    p_property_id: propertyId,
    p_faq_id: input.faqId,
    p_featured: input.featured,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not change the front page: ${error.message}`)
  }

  const result = data as { ok: true; changed: boolean } | RpcRefusal

  return result.ok ? { ok: true, changed: result.changed } : refused(result.error)
}

/** One place up or down within its topic. */
export async function moveFaq(input: {
  faqId: string
  direction: 'up' | 'down'
  actorId: string
}): Promise<FaqWriteResult<{ changed: boolean }>> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('move_faq', {
    p_property_id: propertyId,
    p_faq_id: input.faqId,
    p_direction: input.direction,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not move the FAQ: ${error.message}`)
  }

  const result = data as { ok: true; changed: boolean } | RpcRefusal

  return result.ok ? { ok: true, changed: result.changed } : refused(result.error)
}

/** Takes a FAQ off the site. What it said stays in the audit trail. */
export async function removeFaq(input: {
  faqId: string
  actorId: string
}): Promise<FaqWriteResult> {
  const propertyId = await currentPropertyId()

  const { data, error } = await dataClient().rpc('remove_faq', {
    p_property_id: propertyId,
    p_faq_id: input.faqId,
    p_actor_id: input.actorId,
  })

  if (error) {
    throw new Error(`Could not remove the FAQ: ${error.message}`)
  }

  const result = data as { ok: true } | RpcRefusal

  return result.ok ? { ok: true } : refused(result.error)
}
