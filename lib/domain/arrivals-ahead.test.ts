import { describe, expect, test } from 'vitest'

import {
  arrivalDayLabel,
  arrivalReadinessOf,
  arrivalWindowOf,
  ARRIVALS_AHEAD_DAYS,
  ARRIVING_STATUSES,
  compareArrivalsAhead,
  housekeepingNeedsOf,
  readinessSentence,
  type UnitFactsForArrival,
} from './arrivals-ahead'
import { line } from './lines'
import { bnd } from './money'
import type { LastStayFacts } from './unit-status'

/**
 * What a cleaner is told about the guests on their way (capability C4).
 *
 * The readiness is the part worth care: a cleaner who reads "ready" plans their
 * day around not going into that unit, so it must never say so of a unit
 * somebody is still in, or one another guest is booked into first.
 */

const TODAY = '2026-10-08'
const TOMORROW = '2026-10-09'
const IN_TWO = '2026-10-10'
const TRACKED = '2026-09-01'

const lastStay = (overrides: Partial<LastStayFacts> = {}): LastStayFacts => ({
  status: 'completed',
  end: TODAY,
  inspected: true,
  ready: true,
  ...overrides,
})

const unit = (overrides: Partial<UnitFactsForArrival> = {}): UnitFactsForArrival => ({
  outOfService: false,
  lastStay: null,
  turnoverTrackedSince: TRACKED,
  covering: null,
  nextStart: null,
  ...overrides,
})

const arriving = (date: string) => ({ reference: 'PV-1001', date })

describe('the window', () => {
  test('runs from today to three days ahead, both ends included', () => {
    expect(ARRIVALS_AHEAD_DAYS).toBe(3)
    expect(arrivalWindowOf(TODAY)).toEqual({ from: TODAY, to: '2026-10-11' })
  })

  test('takes confirmed bookings and those whose transfer is being checked, never a hold', () => {
    expect([...ARRIVING_STATUSES]).toEqual(['confirmed', 'awaiting_payment_verification'])
  })
})

describe('arrivalReadinessOf — arriving today', () => {
  test('a unit whose last guest left and was marked ready is ready', () => {
    expect(arrivalReadinessOf(arriving(TODAY), unit({ lastStay: lastStay() }), TODAY)).toEqual({
      kind: 'ready',
    })
  })

  test('a unit no guest has stayed in yet is ready', () => {
    expect(arrivalReadinessOf(arriving(TODAY), unit(), TODAY)).toEqual({ kind: 'ready' })
  })

  test('a unit the last guest has not checked out of says who is in it, and until when', () => {
    const facts = unit({ lastStay: lastStay({ status: 'checked_in', inspected: false, ready: false }) })

    expect(arrivalReadinessOf(arriving(TODAY), facts, TODAY)).toEqual({
      kind: 'guest_in',
      until: TODAY,
    })
  })

  test('a unit left but not yet marked ready is being turned over', () => {
    const facts = unit({ lastStay: lastStay({ inspected: true, ready: false }) })

    expect(arrivalReadinessOf(arriving(TODAY), facts, TODAY)).toEqual({ kind: 'turnover' })
  })

  test('its own booking covering today is not another guest', () => {
    const facts = unit({
      covering: { bookingReference: 'PV-1001', status: 'confirmed', end: IN_TWO },
    })

    expect(arrivalReadinessOf(arriving(TODAY), facts, TODAY)).toEqual({ kind: 'ready' })
  })

  test('a unit out of service says so before anything else', () => {
    const facts = unit({
      outOfService: true,
      lastStay: lastStay({ status: 'checked_in', ready: false }),
    })

    expect(arrivalReadinessOf(arriving(TODAY), facts, TODAY)).toEqual({ kind: 'out_of_service' })
  })
})

describe('arrivalReadinessOf — arriving later', () => {
  test('a unit ready today with nobody booked in first is ready', () => {
    const facts = unit({ lastStay: lastStay(), nextStart: IN_TWO })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({ kind: 'ready' })
  })

  test('a guest still in the unit leaves first, and the card says when', () => {
    const facts = unit({
      lastStay: lastStay({ status: 'checked_in', end: TOMORROW, inspected: false, ready: false }),
    })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({
      kind: 'guest_in',
      until: TOMORROW,
    })
  })

  test('another booking covering today has the unit first', () => {
    const facts = unit({
      covering: { bookingReference: 'PV-2002', status: 'confirmed', end: TOMORROW },
    })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({
      kind: 'booked_before',
      until: TOMORROW,
    })
  })

  test('a stay that starts between today and the arrival is named', () => {
    const facts = unit({ lastStay: lastStay(), nextStart: TOMORROW })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({
      kind: 'stay_before',
      from: TOMORROW,
    })
  })

  test('the arrival itself being the next stay is not a stay before it', () => {
    const facts = unit({ nextStart: TOMORROW })

    expect(arrivalReadinessOf(arriving(TOMORROW), facts, TODAY)).toEqual({ kind: 'ready' })
  })

  test('an early departure whose unit is finished does not hold up a later guest', () => {
    // A completed occupancy keeps covering its unused nights (architecture.md
    // §5.2), but nobody is in the unit and its turnover is done.
    const facts = unit({
      lastStay: lastStay({ end: TOMORROW }),
      covering: { bookingReference: 'PV-2002', status: 'completed', end: TOMORROW },
    })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({ kind: 'ready' })
  })

  test('an unfinished turnover is reported for a later arrival too', () => {
    const facts = unit({ lastStay: lastStay({ inspected: false, ready: false }) })

    expect(arrivalReadinessOf(arriving(IN_TWO), facts, TODAY)).toEqual({ kind: 'turnover' })
  })
})

describe('readinessSentence', () => {
  test('ready today, and ready later — the later one says how far the promise goes', () => {
    expect(readinessSentence({ kind: 'ready' }, TODAY, TODAY)).toBe('Ready for them.')
    expect(readinessSentence({ kind: 'ready' }, IN_TWO, TODAY)).toBe(
      'Ready now, and nobody is booked in before them.',
    )
  })

  test('a guest in the unit, named by the day they leave', () => {
    expect(readinessSentence({ kind: 'guest_in', until: TODAY }, TODAY, TODAY)).toBe(
      'Another guest is in it until today.',
    )
    expect(readinessSentence({ kind: 'guest_in', until: TOMORROW }, IN_TWO, TODAY)).toBe(
      'Another guest is in it until tomorrow.',
    )
  })

  test('a guest past their last day is still in it, and the card does not pretend otherwise', () => {
    expect(readinessSentence({ kind: 'guest_in', until: '2026-10-06' }, TODAY, TODAY)).toBe(
      'Another guest is still in it — they were due out Tue 6 Oct.',
    )
  })

  test('the other cases', () => {
    expect(readinessSentence({ kind: 'turnover' }, TODAY, TODAY)).toBe(
      'Being turned over — not marked ready yet.',
    )
    expect(readinessSentence({ kind: 'booked_before', until: TOMORROW }, IN_TWO, TODAY)).toBe(
      'Another booking has it until tomorrow.',
    )
    expect(readinessSentence({ kind: 'booked_before', until: null }, IN_TWO, TODAY)).toBe(
      'Another booking has it first.',
    )
    expect(readinessSentence({ kind: 'stay_before', from: TOMORROW }, IN_TWO, TODAY)).toBe(
      'Another stay starts tomorrow, before this one.',
    )
    expect(readinessSentence({ kind: 'out_of_service' }, TODAY, TODAY)).toBe(
      'Out of service — ask the office.',
    )
  })
})

describe('arrivalDayLabel', () => {
  test('today, tomorrow, then the date', () => {
    expect(arrivalDayLabel(TODAY, TODAY)).toBe('Today')
    expect(arrivalDayLabel(TOMORROW, TODAY)).toBe('Tomorrow')
    expect(arrivalDayLabel(IN_TWO, TODAY)).toBe('Sat 10 Oct')
  })
})

describe('housekeepingNeedsOf', () => {
  test('lists the extras by name and the early check-in hours, and never a price', () => {
    const needs = housekeepingNeedsOf([
      line('accommodation', '3 nights', 3, bnd(200)),
      { ...line('extra', 'Sofa bed', 1, bnd(28)), extraId: 'sofa' },
      { ...line('extra', 'Baby cot', 1, bnd(10)), extraId: 'cot' },
      line('early_check_in', 'Early check-in — 2 hours', 2, bnd(15)),
      line('late_check_out', 'Late check-out — 1 hour', 1, bnd(15)),
    ])

    expect(needs).toEqual({
      extras: [
        { name: 'Sofa bed', quantity: 1 },
        { name: 'Baby cot', quantity: 1 },
      ],
      earlyCheckInHours: 2,
    })
    expect(JSON.stringify(needs)).not.toMatch(/2800|1000|1500|unitPrice|amount/)
  })

  test('adds up two lines for the same extra rather than listing it twice', () => {
    const needs = housekeepingNeedsOf([
      { ...line('extra', 'Sofa bed', 1, bnd(28)), extraId: 'sofa' },
      { ...line('extra', 'Sofa bed', 2, bnd(28)), extraId: 'sofa' },
    ])

    expect(needs.extras).toEqual([{ name: 'Sofa bed', quantity: 3 }])
  })

  test('a booking with nothing extra needs nothing', () => {
    expect(housekeepingNeedsOf([line('accommodation', '1 night', 1, bnd(200))])).toEqual({
      extras: [],
      earlyCheckInHours: 0,
    })
  })
})

describe('compareArrivalsAhead', () => {
  test('soonest first, then by door with numbers read as numbers', () => {
    const arrivals = [
      { arrival: IN_TWO, unitRef: '3B-01' },
      { arrival: TODAY, unitRef: '3B-10' },
      { arrival: TODAY, unitRef: '3B-2' },
    ]

    expect([...arrivals].sort(compareArrivalsAhead).map((entry) => entry.unitRef)).toEqual([
      '3B-2',
      '3B-10',
      '3B-01',
    ])
  })
})
