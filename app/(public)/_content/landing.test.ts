import { describe, expect, test } from 'vitest'

import { parsePlacementKey } from '@/lib/domain/site-image'

import { facilities, unitTypeCopy } from './landing'

/**
 * The landing page's cards against the photographs that can hang off them
 * (capability F7).
 *
 * A photograph is found by the slug of the row it belongs to, so a card whose
 * slug is malformed or shared with another card would silently never show one.
 * That each slug also exists in the database is lib/db/site-images.test.ts's
 * job, because only a database can say.
 *
 * Unit-type cards are built from Property settings now, not from this module
 * (17 September 2026), so what is checked here is that each line of copy is
 * filed under a key a real unit type could carry — a typo'd key silently costs
 * a card its description.
 */
describe('the landing cards', () => {
  test.each(facilities)('the $name card can carry a photograph', ({ slug }) => {
    expect(parsePlacementKey(`facility:${slug}`)).toEqual({ kind: 'facility', slug })
  })

  test('no two facility cards share a slug, so no two share a photograph', () => {
    expect(new Set(facilities.map((facility) => facility.slug)).size).toBe(facilities.length)
  })

  test.each(Object.keys(unitTypeCopy))('the %s copy is filed under a usable slug', (slug) => {
    expect(parsePlacementKey(`unit-type:${slug}`)).toEqual({ kind: 'unit_type', slug })
  })

  test('every unit type has both a line and a photograph label', () => {
    for (const copy of Object.values(unitTypeCopy)) {
      expect(copy.description.length).toBeGreaterThan(0)
      expect(copy.imageLabel.length).toBeGreaterThan(0)
    }
  })
})
