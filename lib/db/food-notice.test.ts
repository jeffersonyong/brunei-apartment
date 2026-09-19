import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { dataClient } from '@/lib/supabase/data'

import { readFoodNotice, saveFoodNotice } from './food-notice'
import { currentPropertyId } from './property'
import { givenStaffAccount } from './test/factory'
import { auditEventsFor } from './test/inspect'

/**
 * The food notice against the real database (19 September 2026).
 *
 * What only the writer knows: the stale check, that a save changing nothing
 * writes nothing, that the table refuses what the screen would, and that every
 * change lands in the audit trail with both sides.
 *
 * **The notice is one row per property**, and the local site holds the seeded
 * one. So the row is set aside before the tests and put back after them.
 */

interface NoticeRow {
  property_id: string
  body: string
  phone: string
  updated_at: string
  updated_by: string | null
}

let actorId: string
let propertyId: string
let setAside: NoticeRow | null = null

beforeAll(async () => {
  propertyId = await currentPropertyId()
  actorId = await givenStaffAccount()

  const { data, error } = await dataClient()
    .from('food_notice')
    .select('property_id, body, phone, updated_at, updated_by')
    .eq('property_id', propertyId)
    .maybeSingle()

  if (error) {
    throw new Error(`Could not set the food notice aside: ${error.message}`)
  }

  setAside = data as NoticeRow | null
})

beforeEach(async () => {
  await clearNotice()
})

afterAll(async () => {
  await clearNotice()

  if (setAside) {
    const { error } = await dataClient().from('food_notice').insert(setAside)

    if (error) {
      throw new Error(`Could not put the food notice back: ${error.message}`)
    }
  }
})

async function clearNotice(): Promise<void> {
  const { error } = await dataClient().from('food_notice').delete().eq('property_id', propertyId)

  if (error) {
    throw new Error(`Could not clear the food notice: ${error.message}`)
  }
}

async function foodEvents() {
  return (await auditEventsFor(propertyId)).filter(
    (event) => event.action === 'food_notice.updated',
  )
}

describe('saveFoodNotice', () => {
  test('reads an empty notice, which shows nothing, when there is no row', async () => {
    expect(await readFoodNotice()).toEqual({ body: '', phone: '', updatedAt: null })
  })

  test('saves the notice and the number, and records both sides', async () => {
    const before = (await foodEvents()).length

    const result = await saveFoodNotice({
      body: 'No restaurant here.\nMenu at the pool.',
      phone: '+673 333 5410',
      expectedUpdatedAt: null,
      actorId,
    })

    expect(result).toMatchObject({ ok: true, changed: true })
    expect(await readFoodNotice()).toMatchObject({
      body: 'No restaurant here.\nMenu at the pool.',
      phone: '+673 333 5410',
    })

    const events = await foodEvents()

    expect(events).toHaveLength(before + 1)
    expect(events.at(-1)).toMatchObject({
      actorId,
      before: { body: '', phone: '' },
      after: { body: 'No restaurant here.\nMenu at the pool.', phone: '+673 333 5410' },
    })
  })

  test('a save that changes nothing writes nothing', async () => {
    await saveFoodNotice({ body: 'Menu.', phone: '', expectedUpdatedAt: null, actorId })
    const opened = (await readFoodNotice()).updatedAt
    const events = (await foodEvents()).length

    const result = await saveFoodNotice({
      body: 'Menu.',
      phone: '',
      expectedUpdatedAt: opened,
      actorId,
    })

    expect(result).toMatchObject({ ok: true, changed: false })
    expect(await foodEvents()).toHaveLength(events)
  })

  test('refuses a save over a notice somebody else saved since the editor opened', async () => {
    await saveFoodNotice({ body: 'Theirs.', phone: '', expectedUpdatedAt: null, actorId })
    const opened = (await readFoodNotice()).updatedAt
    await saveFoodNotice({ body: 'Theirs again.', phone: '', expectedUpdatedAt: opened, actorId })

    const overTheirs = await saveFoodNotice({
      body: 'Mine.',
      phone: '',
      expectedUpdatedAt: opened,
      actorId,
    })
    const fromNothing = await saveFoodNotice({
      body: 'Mine.',
      phone: '',
      expectedUpdatedAt: null,
      actorId,
    })

    expect(overTheirs).toMatchObject({ ok: false, error: { code: 'stale' } })
    expect(fromNothing).toMatchObject({ ok: false, error: { code: 'stale' } })
    expect((await readFoodNotice()).body).toBe('Theirs again.')
  })

  test('emptying the notice keeps the row, so the next save is checked against it', async () => {
    await saveFoodNotice({ body: 'Menu.', phone: '1', expectedUpdatedAt: null, actorId })
    const opened = (await readFoodNotice()).updatedAt

    const result = await saveFoodNotice({ body: '', phone: '', expectedUpdatedAt: opened, actorId })

    expect(result).toMatchObject({ ok: true, changed: true })
    expect(await readFoodNotice()).toMatchObject({ body: '', phone: '' })
    expect((await foodEvents()).at(-1)?.after).toEqual({ body: '', phone: '' })
  })

  test('refuses a number that is not one, and text longer than the table holds', async () => {
    const letters = await saveFoodNotice({
      body: 'Menu.',
      phone: 'call us',
      expectedUpdatedAt: null,
      actorId,
    })
    const long = await saveFoodNotice({
      body: 'a'.repeat(601),
      phone: '',
      expectedUpdatedAt: null,
      actorId,
    })

    expect(letters).toMatchObject({ ok: false, error: { code: 'phone_invalid' } })
    expect(long).toMatchObject({ ok: false, error: { code: 'too_long' } })
  })
})
