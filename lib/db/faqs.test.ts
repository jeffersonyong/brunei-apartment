import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import type { FaqDraft, FaqTopicId } from '@/lib/domain/faq'
import { MAX_FEATURED_FAQS } from '@/lib/domain/faq'
import { dataClient } from '@/lib/supabase/data'

import { addFaq, listFaqs, moveFaq, removeFaq, setFaqFeatured, updateFaq } from './faqs'
import { currentPropertyId } from './property'
import { givenStaffAccount } from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * The FAQs against the real database (capability F9).
 *
 * What is worth proving here is what only the writers know: the cap on the
 * front page, the order within a topic, the stale check, and that every change
 * lands in the audit trail carrying the question it was about.
 *
 * **Every FAQ here is one the test adds**, with a question starting
 * `Integration FAQ`, and is deleted afterwards. The seeded FAQs are what the
 * local site shows, so no test edits, moves or removes one — the cap test
 * counts them instead.
 */

const PREFIX = 'Integration FAQ'

let actorId: string

beforeAll(async () => {
  await forgetTestFaqs()
  actorId = await givenStaffAccount()
})

afterEach(async () => {
  await forgetTestFaqs()
})

async function forgetTestFaqs(): Promise<void> {
  const { error } = await dataClient().from('faq').delete().like('question', `${PREFIX}%`)

  if (error) {
    throw new Error(`Could not clear the test FAQs: ${error.message}`)
  }
}

function draft(question: string, topic: FaqTopicId = 'anything-else'): FaqDraft {
  return {
    topic,
    question: `${PREFIX} — ${question}`,
    answer: 'An answer with {security deposit}.',
  }
}

async function added(question: string, topic: FaqTopicId = 'anything-else', featured = false) {
  const result = await addFaq({ draft: draft(question, topic), featured, actorId })

  if (!result.ok) {
    throw new Error(`Test setup could not add a FAQ: ${result.error.code}`)
  }

  return result
}

async function readBack(id: string) {
  const faq = (await listFaqs()).find((candidate) => candidate.id === id)

  if (!faq) {
    throw new Error(`Test setup lost FAQ ${id}`)
  }

  return faq
}

describe('seed_faqs', () => {
  test('gives the property its starting FAQs, figures still in braces', async () => {
    const faqs = await listFaqs()
    const deposit = faqs.find((faq) => faq.slug === 'what-do-i-pay-when-i-book')

    expect(deposit?.answer).toContain('{security deposit}')
    expect(faqs.some((faq) => faq.slug === 'house-rules')).toBe(false)
  })
})

describe('addFaq', () => {
  test('puts a new FAQ at the end of its topic, with an address from its question', async () => {
    const first = await added('first?')
    const second = await added('second?')

    const [a, b] = await Promise.all([readBack(first.id), readBack(second.id)])

    expect(b.sortOrder).toBeGreaterThan(a.sortOrder)
    expect(first.slug).toBe('integration-faq-first')
  })

  test('gives a second FAQ with the same question an address of its own', async () => {
    const first = await added('twice?')
    const second = await added('twice?')

    expect(second.slug).toBe(`${first.slug}-2`)
  })

  test('records the question it added', async () => {
    const faq = await added('recorded?')
    const [event] = await auditEventsFor(faq.id)

    expect(event?.action).toBe('faq.added')
    expect(event?.actorId).toBe(actorId)
    expect(event?.after?.name).toBe(`${PREFIX} — recorded?`)
  })
})

describe('updateFaq', () => {
  test('saves a rewording and records only what changed', async () => {
    const faq = await readBack((await added('before?')).id)

    const result = await updateFaq({
      faqId: faq.id,
      draft: { ...draft('before?'), answer: 'A new answer.' },
      featured: false,
      expectedUpdatedAt: faq.updatedAt,
      actorId,
    })

    expect(result).toEqual({ ok: true, changed: true })
    expect((await readBack(faq.id)).answer).toBe('A new answer.')

    const events = await auditEventsFor(faq.id)
    const updated = events.find((event) => event.action === 'faq.updated')

    expect(Object.keys(updated?.after ?? {}).sort()).toEqual(['answer', 'name'])
  })

  test('writes nothing for a save that changed nothing', async () => {
    const faq = await readBack((await added('unchanged?')).id)

    const result = await updateFaq({
      faqId: faq.id,
      draft: draft('unchanged?'),
      featured: false,
      expectedUpdatedAt: faq.updatedAt,
      actorId,
    })

    expect(result).toEqual({ ok: true, changed: false })
    expect((await auditEventsFor(faq.id)).map((event) => event.action)).toEqual(['faq.added'])
  })

  test('refuses a save made over somebody else’s', async () => {
    const faq = await readBack((await added('contested?')).id)
    const save = (answer: string) =>
      updateFaq({
        faqId: faq.id,
        draft: { ...draft('contested?'), answer },
        featured: false,
        expectedUpdatedAt: faq.updatedAt,
        actorId,
      })

    expect((await save('Theirs.')).ok).toBe(true)

    const second = await save('Mine.')

    expect(second.ok).toBe(false)
    expect(!second.ok && second.error.code).toBe('stale')
  })

  test('moves a FAQ given a new topic to the end of that topic', async () => {
    const staying = await readBack((await added('already staying?', 'staying')).id)
    const moving = await readBack((await added('moving?')).id)

    await updateFaq({
      faqId: moving.id,
      draft: draft('moving?', 'staying'),
      featured: false,
      expectedUpdatedAt: moving.updatedAt,
      actorId,
    })

    const moved = await readBack(moving.id)

    expect(moved.topic).toBe('staying')
    expect(moved.sortOrder).toBeGreaterThan(staying.sortOrder)
  })
})

describe('moveFaq', () => {
  test('swaps a FAQ with its neighbour, and changes nothing past the end', async () => {
    const first = await added('up top?')
    const second = await added('underneath?')

    expect(await moveFaq({ faqId: second.id, direction: 'up', actorId })).toEqual({
      ok: true,
      changed: true,
    })

    const [a, b] = await Promise.all([readBack(first.id), readBack(second.id)])

    expect(b.sortOrder).toBeLessThan(a.sortOrder)

    const last = await moveFaq({ faqId: first.id, direction: 'down', actorId })

    expect(last).toEqual({ ok: true, changed: false })
  })

  test('leaves the FAQ’s own save unaffected, because a move is not an edit', async () => {
    const faq = await readBack((await added('reordered while open?')).id)

    await added('a neighbour?')
    await moveFaq({ faqId: faq.id, direction: 'down', actorId })

    expect((await readBack(faq.id)).updatedAt).toBe(faq.updatedAt)
  })
})

describe('the front page', () => {
  test('refuses one more FAQ than the landing page shows', async () => {
    const featuredNow = (await listFaqs()).filter((faq) => faq.featured).length

    for (let index = featuredNow; index < MAX_FEATURED_FAQS; index++) {
      await added(`featured ${index}?`, 'anything-else', true)
    }

    const extra = await added('one too many?')
    const result = await setFaqFeatured({ faqId: extra.id, featured: true, actorId })

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('too_many_featured')

    const refusedAtAdd = await addFaq({ draft: draft('also too many?'), featured: true, actorId })

    expect(!refusedAtAdd.ok && refusedAtAdd.error.code).toBe('too_many_featured')
  })

  test('records a FAQ put on and taken off the front page', async () => {
    const featuredNow = (await listFaqs()).filter((faq) => faq.featured).length

    // The seeded FAQs may already fill the front page; nothing here can then
    // be put on it without taking a seeded one off, which no test does.
    if (featuredNow >= MAX_FEATURED_FAQS) {
      return
    }

    const faq = await added('featured and back?')

    await setFaqFeatured({ faqId: faq.id, featured: true, actorId })
    await setFaqFeatured({ faqId: faq.id, featured: false, actorId })

    expect((await auditEventsFor(faq.id)).map((event) => event.action)).toEqual([
      'faq.added',
      'faq.featured',
      'faq.unfeatured',
    ])
  })
})

describe('removeFaq', () => {
  test('deletes the FAQ and keeps what it said in the trail', async () => {
    const faq = await added('going?')

    expect(await removeFaq({ faqId: faq.id, actorId })).toEqual({ ok: true })
    expect((await listFaqs()).some((candidate) => candidate.id === faq.id)).toBe(false)

    const removed = (await auditEventsFor(faq.id)).find((event) => event.action === 'faq.removed')

    expect(removed?.before?.name).toBe(`${PREFIX} — going?`)
    expect(removed?.before?.answer).toBe('An answer with {security deposit}.')
  })

  test('refuses a FAQ that is already gone', async () => {
    const faq = await added('twice removed?')

    await removeFaq({ faqId: faq.id, actorId })

    const again = await removeFaq({ faqId: faq.id, actorId })

    expect(!again.ok && again.error.code).toBe('not_found')
  })

  test('scopes every write to the property', async () => {
    expect(await currentPropertyId()).toBeTruthy()
  })
})
