import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { dataClient } from '@/lib/supabase/data'

import {
  isPrivacyPolicyPublished,
  listPrivacyPolicyVersions,
  publishPrivacyPolicy,
  readPrivacyPolicyDraft,
  readPublishedPrivacyPolicy,
  savePrivacyPolicyDraft,
} from './privacy-policy'
import { currentPropertyId } from './property'
import { givenStaffAccount } from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * The privacy policy against the real database (capability F10).
 *
 * What only the writers know: the stale check, that publishing saves the draft
 * and appends a version rather than replacing one, that publishing the same
 * text twice writes nothing, and that every publish lands in the audit trail.
 *
 * **The draft is one row per property**, and the local site may be holding
 * one somebody is writing by hand. So the row is set aside before the tests
 * and put back after them, and the only versions deleted are the ones these
 * tests publish — each starts `Integration privacy policy`.
 */

const PREFIX = 'Integration privacy policy'

interface DraftRow {
  property_id: string
  draft: string
  updated_at: string
  updated_by: string | null
}

let actorId: string
let propertyId: string
let setAside: DraftRow | null = null

beforeAll(async () => {
  propertyId = await currentPropertyId()
  actorId = await givenStaffAccount()

  const { data, error } = await dataClient()
    .from('privacy_policy')
    .select('property_id, draft, updated_at, updated_by')
    .eq('property_id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not set the draft aside: ${error.message}`)
  }

  setAside = data as DraftRow | null
})

beforeEach(async () => {
  await clearDraft()
})

afterEach(async () => {
  const { error } = await dataClient()
    .from('privacy_policy_version')
    .delete()
    .like('body', `${PREFIX}%`)

  if (error) {
    throw new Error(`Could not clear the test versions: ${error.message}`)
  }
})

afterAll(async () => {
  await clearDraft()

  if (setAside) {
    const { error } = await dataClient().from('privacy_policy').insert(setAside)

    if (error) {
      throw new Error(`Could not put the draft back: ${error.message}`)
    }
  }
})

async function clearDraft(): Promise<void> {
  const { error } = await dataClient().from('privacy_policy').delete().eq('property_id', propertyId)

  if (error) {
    throw new Error(`Could not clear the draft: ${error.message}`)
  }
}

function policy(words: string): string {
  return `${PREFIX}\n## ${words}\nSome words.`
}

async function savedAt(): Promise<string | null> {
  return (await readPrivacyPolicyDraft()).updatedAt
}

describe('savePrivacyPolicyDraft', () => {
  test('reads an empty draft when nothing has been saved', async () => {
    expect(await readPrivacyPolicyDraft()).toEqual({ text: '', updatedAt: null, updatedBy: null })
  })

  test('saves a draft and reads it back, with who saved it', async () => {
    const result = await savePrivacyPolicyDraft({
      text: policy('Saved'),
      expectedUpdatedAt: null,
      actorId,
    })

    expect(result).toMatchObject({ ok: true, changed: true })

    const draft = await readPrivacyPolicyDraft()

    expect(draft.text).toBe(policy('Saved'))
    expect(draft.updatedBy).toBe(actorId)
  })

  test('a save that changes nothing writes nothing', async () => {
    await savePrivacyPolicyDraft({ text: policy('Same'), expectedUpdatedAt: null, actorId })
    const before = await savedAt()

    const result = await savePrivacyPolicyDraft({
      text: policy('Same'),
      expectedUpdatedAt: before,
      actorId,
    })

    expect(result).toMatchObject({ ok: true, changed: false })
    expect(await savedAt()).toBe(before)
  })

  test('refuses a save over a draft somebody else saved since the editor opened', async () => {
    await savePrivacyPolicyDraft({ text: policy('Theirs'), expectedUpdatedAt: null, actorId })
    const opened = await savedAt()
    await savePrivacyPolicyDraft({
      text: policy('Theirs again'),
      expectedUpdatedAt: opened,
      actorId,
    })

    const fromNothing = await savePrivacyPolicyDraft({
      text: policy('Mine'),
      expectedUpdatedAt: null,
      actorId,
    })
    const fromOld = await savePrivacyPolicyDraft({
      text: policy('Mine'),
      expectedUpdatedAt: opened,
      actorId,
    })

    expect(fromNothing).toMatchObject({ ok: false, error: { code: 'stale' } })
    expect(fromOld).toMatchObject({ ok: false, error: { code: 'stale' } })
    expect((await readPrivacyPolicyDraft()).text).toBe(policy('Theirs again'))
  })
})

describe('publishPrivacyPolicy', () => {
  test('puts the text on the website, saves it as the draft, and records who published it', async () => {
    const hadOne = await isPrivacyPolicyPublished()

    const result = await publishPrivacyPolicy({
      text: policy('First'),
      expectedUpdatedAt: null,
      actorId,
    })

    if (!result.ok) {
      throw new Error(`Publish refused: ${result.error.code}`)
    }

    expect(result.changed).toBe(true)
    expect(await readPublishedPrivacyPolicy()).toMatchObject({
      id: result.versionId,
      body: policy('First'),
      publishedBy: actorId,
    })
    expect(await isPrivacyPolicyPublished()).toBe(true)
    expect((await readPrivacyPolicyDraft()).text).toBe(policy('First'))

    const events = await auditEventsFor(result.versionId)

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      action: 'privacy_policy.published',
      actorId,
      after: { name: 'Privacy policy', characters: policy('First').length, first: !hadOne },
    })
  })

  test('publishing what the website already shows writes nothing', async () => {
    const first = await publishPrivacyPolicy({
      text: policy('Once'),
      expectedUpdatedAt: null,
      actorId,
    })
    const again = await publishPrivacyPolicy({
      text: policy('Once'),
      expectedUpdatedAt: await savedAt(),
      actorId,
    })

    if (!first.ok || !again.ok) {
      throw new Error('Publish refused')
    }

    expect(again.changed).toBe(false)
    expect(again.versionId).toBe(first.versionId)
    expect(await auditEventsFor(first.versionId)).toHaveLength(1)
  })

  test('a new version replaces the old on the website, and the old is kept', async () => {
    const older = await publishPrivacyPolicy({
      text: policy('Older'),
      expectedUpdatedAt: null,
      actorId,
    })
    const newer = await publishPrivacyPolicy({
      text: policy('Newer'),
      expectedUpdatedAt: await savedAt(),
      actorId,
    })

    if (!older.ok || !newer.ok) {
      throw new Error('Publish refused')
    }

    expect((await readPublishedPrivacyPolicy())?.id).toBe(newer.versionId)

    const listed = (await listPrivacyPolicyVersions()).map((version) => version.id)

    expect(listed.indexOf(newer.versionId)).toBeLessThan(listed.indexOf(older.versionId))
    expect(listed).toContain(older.versionId)

    const [event] = await auditEventsFor(newer.versionId)

    expect(event?.before).toMatchObject({ version_id: older.versionId })
    expect(event?.after).toMatchObject({ first: false })
  })

  test('refuses an empty policy, and one with a template gap left in', async () => {
    const empty = await publishPrivacyPolicy({ text: '  \n', expectedUpdatedAt: null, actorId })
    const gap = await publishPrivacyPolicy({
      text: `${PREFIX}\nEmail: [Fill in: an email]`,
      expectedUpdatedAt: null,
      actorId,
    })

    expect(empty).toMatchObject({ ok: false, error: { code: 'empty' } })
    expect(gap).toMatchObject({ ok: false, error: { code: 'unfilled' } })
    expect(await readPrivacyPolicyDraft()).toMatchObject({ text: '', updatedAt: null })
  })

  test('refuses to publish over a draft somebody else saved since the editor opened', async () => {
    await savePrivacyPolicyDraft({ text: policy('Theirs'), expectedUpdatedAt: null, actorId })

    const result = await publishPrivacyPolicy({
      text: policy('Mine'),
      expectedUpdatedAt: null,
      actorId,
    })

    expect(result).toMatchObject({ ok: false, error: { code: 'stale' } })
    expect((await readPublishedPrivacyPolicy())?.body).not.toBe(policy('Mine'))
  })
})
