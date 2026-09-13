import { describe, expect, test } from 'vitest'

import type { Permission } from '@/lib/auth/permissions'

import {
  compareTurnovers,
  nextGuestArrivesToday,
  TURNOVER_STEP_PERMISSION,
  TURNOVER_STEPS,
  turnoverRefusalSentence,
  turnoverStepOf,
  type TurnoverFacts,
  type TurnoverRefusal,
} from './turnover'
import type { LastStayFacts } from './unit-status'

/**
 * What the cleaner is told to do next.
 *
 * Mandatory coverage: a wrong answer here sends a cleaner into a room a guest
 * is still sleeping in, or leaves a unit nobody inspected off the list, so the
 * deposit it holds can never be released.
 */

const TODAY = '2026-09-25'
const TRACKED = '2026-09-01'

const stay = (overrides: Partial<LastStayFacts> = {}): LastStayFacts => ({
  status: 'completed',
  end: TODAY,
  inspected: false,
  ready: false,
  ...overrides,
})

const facts = (lastStay: LastStayFacts | null): TurnoverFacts => ({
  lastStay,
  turnoverTrackedSince: TRACKED,
})

describe('turnoverStepOf', () => {
  test('a guest still in on the day they leave is waiting to be seen off', () => {
    expect(turnoverStepOf(facts(stay({ status: 'checked_in', end: TODAY })), TODAY)).toBe(
      'guest_leaving',
    )
  })

  test('a guest who should have left yesterday is still on the list', () => {
    expect(turnoverStepOf(facts(stay({ status: 'checked_in', end: '2026-09-24' })), TODAY)).toBe(
      'guest_leaving',
    )
  })

  test('a guest whose stay runs past today is not — the cleaner cannot check them out early', () => {
    expect(
      turnoverStepOf(facts(stay({ status: 'checked_in', end: '2026-09-26' })), TODAY),
    ).toBeNull()
  })

  test('a unit the guest has left and nobody has looked at asks to be inspected', () => {
    expect(turnoverStepOf(facts(stay()), TODAY)).toBe('inspect')
  })

  test('an inspected unit asks to be marked ready', () => {
    expect(turnoverStepOf(facts(stay({ inspected: true })), TODAY)).toBe('mark_ready')
  })

  test('a unit marked ready waits on nobody', () => {
    expect(turnoverStepOf(facts(stay({ inspected: true, ready: true })), TODAY)).toBeNull()
  })

  test('an early departure still asks to be inspected, though its dates run on', () => {
    // Check-out never shortens a stay, so the end date is still ahead.
    expect(turnoverStepOf(facts(stay({ end: '2026-09-28' })), TODAY)).toBe('inspect')
  })

  test('a stay that ended before turnovers were kept is not a turnover', () => {
    expect(turnoverStepOf(facts(stay({ end: '2026-08-31' })), TODAY)).toBeNull()
  })

  test('a stay that ended on the day tracking began is one', () => {
    expect(turnoverStepOf(facts(stay({ end: TRACKED })), TODAY)).toBe('inspect')
  })

  test('a unit nobody has stayed in waits on nobody', () => {
    expect(turnoverStepOf(facts(null), TODAY)).toBeNull()
  })
})

describe('TURNOVER_STEP_PERMISSION', () => {
  test('each step answers to the permission of its act', () => {
    expect(TURNOVER_STEP_PERMISSION).toEqual({
      guest_leaving: 'booking.check_out',
      inspect: 'inspection.record',
      mark_ready: 'unit.manage',
    })
  })

  test('the seeded Housekeeping role can take every step', () => {
    // supabase/seed.sql's housekeeping grants.
    const housekeeping = new Set<Permission>([
      'booking.view',
      'booking.check_out',
      'inspection.record',
      'unit.manage',
    ])

    for (const step of TURNOVER_STEPS) {
      expect(housekeeping.has(TURNOVER_STEP_PERMISSION[step])).toBe(true)
    }
  })
})

describe('nextGuestArrivesToday', () => {
  const booking = (start: string, status: 'confirmed' | 'checked_in' | 'held' = 'confirmed') => ({
    start,
    status,
    bookingReference: 'PV-4821',
  })

  test('a booking starting today in a unit being turned over is the next guest', () => {
    expect(nextGuestArrivesToday(booking(TODAY), TODAY)).toBe(true)
  })

  test('a held booking starting today counts — that guest may still come', () => {
    expect(nextGuestArrivesToday(booking(TODAY, 'held'), TODAY)).toBe(true)
  })

  test('a guest already checked in is not arriving', () => {
    expect(nextGuestArrivesToday(booking(TODAY, 'checked_in'), TODAY)).toBe(false)
  })

  test('a stay that began yesterday is nobody arriving today', () => {
    expect(nextGuestArrivesToday(booking('2026-09-24'), TODAY)).toBe(false)
  })

  test('a lease starting today has no guest to hurry for', () => {
    expect(
      nextGuestArrivesToday({ start: TODAY, status: 'leased', bookingReference: null }, TODAY),
    ).toBe(false)
  })

  test('nothing covering the day is nobody arriving', () => {
    expect(nextGuestArrivesToday(null, TODAY)).toBe(false)
  })
})

describe('compareTurnovers', () => {
  test('a unit somebody arrives in today comes first, then by door', () => {
    const rows = [
      { unitRef: '3B-10', nextGuestArrivesToday: false },
      { unitRef: '3B-2', nextGuestArrivesToday: false },
      { unitRef: 'SD-01', nextGuestArrivesToday: true },
    ]

    expect([...rows].sort(compareTurnovers).map((row) => row.unitRef)).toEqual([
      'SD-01',
      '3B-2',
      '3B-10',
    ])
  })
})

describe('turnoverRefusalSentence', () => {
  test('every refusal says something different, and never blames the cleaner', () => {
    const codes: TurnoverRefusal[] = ['not_found', 'not_due_out', 'already_left']
    const sentences = codes.map(turnoverRefusalSentence)

    expect(new Set(sentences).size).toBe(codes.length)

    for (const sentence of sentences) {
      expect(sentence.length).toBeGreaterThan(0)
    }
  })

  test('a refusal that wrote nothing says so', () => {
    expect(turnoverRefusalSentence('not_found')).toContain('nothing was recorded')
    expect(turnoverRefusalSentence('not_due_out')).toContain('nothing was recorded')
  })
})
