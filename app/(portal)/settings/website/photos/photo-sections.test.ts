import { describe, expect, test } from 'vitest'

import type { SiteImage } from '@/lib/db/site-images'

import { photoSections } from './photo-sections'

/**
 * The photographs screen against the front page it manages (capability F7).
 */

const STAFF = new Map([['user-1', 'Jason']])
/** What Property settings holds, which is where the stays cards come from. */
const UNIT_TYPES = [
  { slug: 'three-bedroom', name: '3-bedroom' },
  { slug: 'four-bedroom', name: '4-bedroom' },
]
/** The facilities ticked into the day pass — the same source, since 17 September 2026. */
const FACILITIES = [
  { slug: 'swimming-pool', name: 'Swimming pool' },
  { slug: 'water-park', name: 'Water park' },
]
const nameFor = (userId: string) => STAFF.get(userId) ?? 'a former colleague'

function image(placement: SiteImage['placement']): SiteImage {
  return {
    id: `image-${JSON.stringify(placement)}`,
    placement,
    altText: 'A photograph',
    focus: 'top',
    mimeType: 'image/jpeg',
    byteSize: 1024,
    uploadedBy: 'user-1',
    uploadedAt: '2026-09-13T02:00:00Z',
    url: 'https://storage.test/photo.jpg',
  }
}

describe('photoSections', () => {
  test('mirrors the front page: its four sections, in its order, with every card it renders', () => {
    const sections = photoSections([], nameFor, UNIT_TYPES, FACILITIES)

    expect(sections.map((section) => section.title)).toEqual([
      'Front page',
      'Day pass',
      'Short stays',
      'Follow along',
    ])
    expect(sections.flatMap((section) => section.slots)).toHaveLength(
      1 + FACILITIES.length + UNIT_TYPES.length + 4,
    )
  })

  test('crops each preview to the shape the site shows it at', () => {
    const [front, dayPass, , follow] = photoSections([], nameFor, UNIT_TYPES, FACILITIES)

    expect(front!.slots[0]!.aspect).toBe('photo')
    expect(dayPass!.slots.every((slot) => slot.aspect === 'photo')).toBe(true)
    expect(follow!.slots.every((slot) => slot.aspect === 'square')).toBe(true)
  })

  test('puts a current photograph on its card, naming who put it up', () => {
    const sections = photoSections(
      [image({ kind: 'facility', slug: 'water-park' })],
      nameFor,
      UNIT_TYPES,
      FACILITIES,
    )
    const waterPark = sections[1]!.slots.find((slot) => slot.key === 'facility:water-park')

    expect(waterPark?.current).toMatchObject({ focus: 'top', uploadedBy: 'Jason' })
    expect(sections[0]!.slots[0]!.current).toBeNull()
  })

  test('numbers the "Follow along" tiles in order', () => {
    const follow = photoSections([], nameFor, UNIT_TYPES, FACILITIES)[3]!

    expect(follow.slots.map((slot) => [slot.key, slot.name])).toEqual([
      ['feed-1', 'Tile 1'],
      ['feed-2', 'Tile 2'],
      ['feed-3', 'Tile 3'],
      ['feed-4', 'Tile 4'],
    ])
  })

  /**
   * The day-pass section shows a card per *included* facility, so its photo
   * places have to move with the ticks rather than with a list in the code.
   */
  test('gives a place to every facility the day pass admits, and only those', () => {
    const dayPass = photoSections([], nameFor, UNIT_TYPES, [
      { slug: 'swimming-pool', name: 'Swimming pool' },
      { slug: 'gym', name: 'Gym' },
    ])[1]!

    expect(dayPass.slots.map((slot) => slot.key)).toEqual([
      'facility:swimming-pool',
      'facility:gym',
    ])
  })
})
