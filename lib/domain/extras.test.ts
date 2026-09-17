import { describe, expect, test } from 'vitest'

import {
  bookableExtras,
  checkExtraDraft,
  extraBySlug,
  extraFieldName,
  extraSelectionsFrom,
  remainingOf,
  slugFromName,
  type ExtraDraft,
  type PropertyExtra,
} from './extras'
import { bnd } from './money'

/**
 * The extras a stay can add (capability F13).
 *
 * Everything here is the pure half of the feature. The half that matters most
 * — two bookings cannot take the same sofa bed on the same night — is not
 * testable from here by design: it is a question about every other booking in
 * the building, enforced by `booking_line_extra_within_stock` in
 * 20261003000100 and covered by the integration suite.
 */

function extra(overrides: Partial<PropertyExtra> = {}): PropertyExtra {
  return {
    id: 'e1',
    slug: 'sofa-bed',
    name: 'Sofa bed',
    description: 'Includes one pillow and one blanket.',
    fee: bnd(28),
    stock: null,
    bookable: true,
    sortOrder: 1,
    retiredAt: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function draft(overrides: Partial<ExtraDraft> = {}): ExtraDraft {
  return {
    name: 'Karaoke set',
    description: 'Includes two microphones.',
    fee: '45',
    stock: '2',
    bookable: true,
    ...overrides,
  }
}

describe('slugFromName', () => {
  test('makes an address a link can carry', () => {
    expect(slugFromName('Sofa bed')).toBe('sofa-bed')
    expect(slugFromName('Karaoke set (with 2 mics!)')).toBe('karaoke-set-with-2-mics')
  })

  test('strips accents rather than dropping the letter', () => {
    expect(slugFromName('Café table')).toBe('cafe-table')
  })

  test('is empty for a name with nothing sluggable in it, so the writer can refuse', () => {
    expect(slugFromName('!!!')).toBe('')
  })

  test('never ends in a hyphen, even when the cut lands on one', () => {
    expect(slugFromName(`${'a'.repeat(79)} bed`)).not.toMatch(/-$/)
  })
})

describe('checkExtraDraft', () => {
  test('accepts a plain draft and turns the fee into cents', () => {
    const result = checkExtraDraft(draft())

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value).toEqual({
      slug: 'karaoke-set',
      name: 'Karaoke set',
      description: 'Includes two microphones.',
      feeCents: bnd(45),
      stock: 2,
      bookable: true,
    })
  })

  test('reads BND the way a person types it', () => {
    const cents = (fee: string) => {
      const result = checkExtraDraft(draft({ fee }))

      return result.ok ? result.value.feeCents : null
    }

    expect(cents('28')).toBe(2800)
    expect(cents('28.5')).toBe(2850)
    expect(cents('28.50')).toBe(2850)
    expect(cents(' 28.50 ')).toBe(2850)
    expect(cents('BND 28.50')).toBe(2850)
  })

  test('refuses an amount with a comma rather than repairing it', () => {
    // The same position checkPricingDraft takes: repairing a number somebody
    // typed is guessing at money.
    const result = checkExtraDraft(draft({ fee: '1,200' }))

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.problems.map((problem) => problem.field)).toContain('fee')
  })

  test('refuses a third decimal place, which is money that does not exist here', () => {
    expect(checkExtraDraft(draft({ fee: '28.505' })).ok).toBe(false)
  })

  /**
   * The distinction the whole stock rule rests on. Blank means nobody has
   * counted them (open-questions.md N8) and nothing is constrained; zero means
   * there are none and every request is refused. A form that folded one into
   * the other would quietly stop the property selling sofa beds.
   */
  test('reads a blank count as unknown, not as none', () => {
    const result = checkExtraDraft(draft({ stock: '   ' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.stock).toBeNull()
  })

  test('reads zero as none, not as unknown', () => {
    const result = checkExtraDraft(draft({ stock: '0' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.stock).toBe(0)
  })

  test('refuses a fractional count', () => {
    expect(checkExtraDraft(draft({ stock: '2.5' })).ok).toBe(false)
  })

  test('refuses a nameless extra', () => {
    const result = checkExtraDraft(draft({ name: '  ' }))

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.problems.map((problem) => problem.field)).toEqual(['name'])
  })

  test('refuses a name that leaves no address behind it', () => {
    const result = checkExtraDraft(draft({ name: '!!!' }))

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.problems[0]?.message).toContain('letter or number')
  })

  test('an empty description is nothing, not an empty string', () => {
    const result = checkExtraDraft(draft({ description: '   ' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.description).toBeNull()
  })

  test('collapses the whitespace a paste brings with it', () => {
    const result = checkExtraDraft(draft({ name: '  Karaoke   set  ' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.name).toBe('Karaoke set')
  })

  test('reports every bad field at once, not just the first', () => {
    const result = checkExtraDraft(draft({ name: '', fee: 'free', stock: 'lots' }))

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.problems.map((problem) => problem.field).sort()).toEqual(['fee', 'name', 'stock'])
  })
})

describe('remainingOf', () => {
  test('is what is left after what is already held', () => {
    expect(remainingOf(extra({ stock: 3 }), 1)).toBe(2)
  })

  test('is nothing left rather than a negative, when stock was lowered under what is out', () => {
    expect(remainingOf(extra({ stock: 2 }), 5)).toBe(0)
  })

  test('is null for an uncounted extra, so a form shows no remainder at all', () => {
    // "Unlimited" would be a lie about a physical object.
    expect(remainingOf(extra({ stock: null }), 4)).toBeNull()
  })
})

describe('bookableExtras', () => {
  test('offers what is on sale, in list order', () => {
    const list = [extra({ id: 'b', sortOrder: 2 }), extra({ id: 'a', sortOrder: 1 })]

    expect(bookableExtras(list).map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  test('leaves out what is off sale', () => {
    expect(bookableExtras([extra({ bookable: false })])).toEqual([])
  })

  test('leaves out what was removed, even if it was left on sale', () => {
    const removed = extra({ bookable: true, retiredAt: '2026-09-17T00:00:00.000Z' })

    expect(bookableExtras([removed])).toEqual([])
  })

  test('does not reorder the list it was given', () => {
    const list = [extra({ id: 'b', sortOrder: 2 }), extra({ id: 'a', sortOrder: 1 })]

    bookableExtras(list)

    expect(list.map((entry) => entry.id)).toEqual(['b', 'a'])
  })
})

describe('extraBySlug', () => {
  /**
   * What keeps the FAQ figure `{sofa bed charge}` answering after staff rename
   * the row — the reason the slug exists at all.
   */
  test('finds an extra by its address, not by its name', () => {
    const renamed = extra({ name: 'Sofa bed (double)' })

    expect(extraBySlug([renamed], 'sofa-bed')?.fee).toBe(bnd(28))
  })

  test('still finds a removed one, because the question still has an answer', () => {
    const removed = extra({ retiredAt: '2026-09-17T00:00:00.000Z' })

    expect(extraBySlug([removed], 'sofa-bed')).toBeDefined()
  })
})

describe('extraSelectionsFrom', () => {
  const list = [extra({ id: 'e1' }), extra({ id: 'e2', slug: 'karaoke', name: 'Karaoke' })]
  const form = (fields: Record<string, string>) => (field: string) => fields[field] ?? null

  test('reads the counters a form posted', () => {
    const selections = extraSelectionsFrom(
      form({ [extraFieldName('e1')]: '2', [extraFieldName('e2')]: '1' }),
      list,
    )

    expect(selections).toEqual([
      { extraId: 'e1', quantity: 2 },
      { extraId: 'e2', quantity: 1 },
    ])
  })

  test('leaves out a zero, so nothing bought produces no line', () => {
    expect(extraSelectionsFrom(form({ [extraFieldName('e1')]: '0' }), list)).toEqual([])
  })

  test('ignores a field naming an extra that is not on the list', () => {
    // The list is the vocabulary. A posted field for something else is not a
    // price this system has ever agreed to.
    expect(extraSelectionsFrom(form({ 'extra:made-up': '3' }), list)).toEqual([])
  })

  test('drops a mangled value rather than guessing at it', () => {
    const mangled = form({
      [extraFieldName('e1')]: '-2',
      [extraFieldName('e2')]: 'two',
    })

    expect(extraSelectionsFrom(mangled, list)).toEqual([])
  })

  test('is empty for a form that posted no counters at all', () => {
    expect(extraSelectionsFrom(form({}), list)).toEqual([])
  })
})
