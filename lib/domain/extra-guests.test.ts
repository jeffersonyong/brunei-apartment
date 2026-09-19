import { describe, expect, test } from 'vitest'

import {
  addToParty,
  countsOf,
  describeParty,
  extraGuestsAwaitingOffice,
  extraGuestsNote,
} from './extra-guests'
import { bnd } from './money'

const SOLD = [
  { bandId: 'adult', label: 'Adult', count: 2 },
  { bandId: 'child', label: 'Child', count: 1 },
] as const

describe('countsOf', () => {
  test('reads a pass as it was sold into counts by band', () => {
    expect(countsOf(SOLD)).toEqual({ adult: 2, child: 1 })
  })
})

describe('addToParty', () => {
  test('adds the visitors counted to the bands already sold', () => {
    expect(addToParty({ adult: 2, child: 1 }, { adult: 1, infant: 1 })).toEqual({
      adult: 3,
      child: 1,
      infant: 1,
    })
  })

  test('leaves the party it was given alone', () => {
    const sold = { adult: 2 }

    addToParty(sold, { adult: 1 })

    expect(sold).toEqual({ adult: 2 })
  })
})

describe('describeParty', () => {
  test('names each band with its count, in the order given, skipping empty ones', () => {
    expect(
      describeParty([
        { label: 'Adult', count: 2 },
        { label: 'Under 1', count: 0 },
        { label: 'Child', count: 1 },
      ]),
    ).toBe('Adult × 2, Child × 1')
  })
})

describe('extraGuestsNote', () => {
  test('a stay: how many more arrived than the booking is for', () => {
    expect(extraGuestsNote({ extra: 2, bookedFor: 4, remark: '' })).toBe(
      'Reported at the gate: 2 more people arrived than the booking is for (booked for 4).',
    )
  })

  test('one person, and the guard’s own words after', () => {
    expect(extraGuestsNote({ extra: 1, bookedFor: 1, remark: '  Came in a second car  ' })).toBe(
      'Reported at the gate: 1 more person arrived than the booking is for (booked for 1). “Came in a second car”',
    )
  })

  test('a pass the guard added the visitors to, and took the difference for', () => {
    expect(
      extraGuestsNote({
        extra: 2,
        bookedFor: 3,
        remark: '',
        added: { party: 'Adult × 1, Child × 1', nowFor: 5, taken: bnd(15) },
      }),
    ).toBe(
      'Added at the gate: Adult × 1, Child × 1 (the pass is now for 5). BND 15.00 taken in cash.',
    )
  })

  test('a visitor who is free is added with nothing to take', () => {
    expect(
      extraGuestsNote({
        extra: 1,
        bookedFor: 2,
        remark: '',
        added: { party: 'Under 1 × 1', nowFor: 3, taken: 0 },
      }),
    ).toBe('Added at the gate: Under 1 × 1 (the pass is now for 3). Nothing more to pay.')
  })
})

describe('extraGuestsAwaitingOffice', () => {
  const reported = (extra: number, addedCents?: number) => ({
    action: 'booking.extra_guests_reported',
    after: { extra, ...(addedCents === undefined ? {} : { added_cents: addedCents }) },
  })
  const changed = { action: 'booking.party_changed', after: {} }

  test('nothing reported is nothing waiting', () => {
    expect(extraGuestsAwaitingOffice([])).toBe(0)
  })

  test('adds up what the guards reported', () => {
    expect(extraGuestsAwaitingOffice([reported(2), reported(1)])).toBe(3)
  })

  test('the office changing the party answers what was reported before it', () => {
    expect(extraGuestsAwaitingOffice([reported(2), changed])).toBe(0)
    expect(extraGuestsAwaitingOffice([reported(2), changed, reported(1)])).toBe(1)
  })

  test('visitors the guard added to a pass himself are not waiting on anybody', () => {
    // He adds them, which changes the party, and reports it after.
    expect(extraGuestsAwaitingOffice([changed, reported(2, 1500)])).toBe(0)
  })
})
