import { describe, expect, test } from 'vitest'

import type { BookingStatus } from './booking-state'
import { addDays, formatStayDate } from './dates'
import {
  gateRefusalSentence,
  gateVerdictOf,
  gateVerdictSentence,
  matchesGateSearch,
  type GateFacts,
  type GateVerdict,
} from './gate'
import { bnd } from './money'
import { plateKey } from './vehicle'

const TODAY = '2026-09-13'

/** A paid, deposit-secured stay arriving today — the ordinary car at the barrier. */
function facts(overrides: Partial<GateFacts> = {}): GateFacts {
  return {
    status: 'confirmed',
    stream: 'short_stay',
    arrival: TODAY,
    today: TODAY,
    deposit: { quoted: bnd(100), held: bnd(100), collected: true, promised: false },
    total: bnd(400),
    paid: bnd(400),
    ...overrides,
  }
}

describe('gateVerdictOf', () => {
  test('a secured, paid stay arriving today is checked in', () => {
    expect(gateVerdictOf(facts())).toEqual({ kind: 'check_in', stayOwed: false })
  })

  test('money owed on the stay is said and does not stop the car', () => {
    expect(gateVerdictOf(facts({ paid: 0 }))).toEqual({ kind: 'check_in', stayOwed: true })
  })

  test('a guest arriving a day late still has a booking', () => {
    expect(gateVerdictOf(facts({ arrival: addDays(TODAY, -1) })).kind).toBe('check_in')
  })

  test('a guest arriving before their booking starts goes to the office', () => {
    expect(gateVerdictOf(facts({ arrival: addDays(TODAY, 2) }))).toEqual({
      kind: 'office',
      reason: 'early',
    })
  })

  test.each<BookingStatus>(['draft', 'held', 'awaiting_payment_verification'])(
    'a booking the office has not confirmed (%s) goes to the office',
    (status) => {
      expect(gateVerdictOf(facts({ status }))).toEqual({ kind: 'office', reason: 'not_confirmed' })
    },
  )

  test('a deposit that arrived short goes to the office', () => {
    const deposit = { quoted: bnd(100), held: bnd(50), collected: true, promised: false }

    expect(gateVerdictOf(facts({ deposit }))).toEqual({ kind: 'office', reason: 'deposit_short' })
  })

  test('a deposit promised and never verified goes to the office', () => {
    const deposit = { quoted: bnd(100), held: bnd(100), collected: false, promised: true }

    expect(gateVerdictOf(facts({ deposit }))).toEqual({
      kind: 'office',
      reason: 'deposit_promised',
    })
  })

  test('a deposit nobody has taken goes to the office', () => {
    const deposit = { quoted: bnd(100), held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ deposit }))).toEqual({ kind: 'office', reason: 'deposit_not_in' })
  })

  test('a booking quoting no deposit — waived — is checked in', () => {
    const deposit = { quoted: 0, held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ deposit })).kind).toBe('check_in')
  })

  test('an early arrival is sent to the office before its deposit is looked at', () => {
    const deposit = { quoted: bnd(100), held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ arrival: addDays(TODAY, 1), deposit }))).toEqual({
      kind: 'office',
      reason: 'early',
    })
  })

  test('a guest already checked in is in residence', () => {
    expect(gateVerdictOf(facts({ status: 'checked_in' }))).toEqual({ kind: 'in_residence' })
  })

  test.each<BookingStatus>(['completed', 'expired', 'cancelled', 'no_show'])(
    'a %s booking is closed',
    (status) => {
      expect(gateVerdictOf(facts({ status }))).toEqual({ kind: 'closed' })
    },
  )

  describe('a day pass is admitted at the gate — on its own day, and paid in full', () => {
    /** A paid pass for today — the ordinary day visitor. */
    const pass = (overrides: Partial<GateFacts> = {}): GateFacts =>
      facts({
        stream: 'day_pass',
        deposit: { quoted: 0, held: 0, collected: false, promised: false },
        total: bnd(20),
        paid: bnd(20),
        ...overrides,
      })

    test('a paid pass for today is admitted', () => {
      expect(gateVerdictOf(pass())).toEqual({ kind: 'admit' })
    })

    test.each<BookingStatus>(['draft', 'held', 'awaiting_payment_verification'])(
      'a pass the office has not confirmed (%s) goes to the office',
      (status) => {
        expect(gateVerdictOf(pass({ status }))).toEqual({ kind: 'office', reason: 'pass_unpaid' })
      },
    )

    test('a confirmed pass with money still owed goes to the office, because admitting closes it', () => {
      expect(gateVerdictOf(pass({ paid: bnd(10) }))).toEqual({
        kind: 'office',
        reason: 'pass_unpaid',
      })
    })

    test.each([1, -1])('a pass dated %i day(s) from today goes to the office', (offset) => {
      expect(gateVerdictOf(pass({ arrival: addDays(TODAY, offset) }))).toEqual({
        kind: 'office',
        reason: 'pass_other_day',
      })
    })

    test('a pass admitted today reads as admitted, so a car coming back is recognised', () => {
      expect(gateVerdictOf(pass({ status: 'completed' }))).toEqual({ kind: 'admitted' })
    })

    test('a pass the desk checked in before passes were admitted reads as admitted too', () => {
      expect(gateVerdictOf(pass({ status: 'checked_in' }))).toEqual({ kind: 'admitted' })
    })

    test('a pass used on an earlier day is closed', () => {
      expect(
        gateVerdictOf(pass({ status: 'completed', arrival: addDays(TODAY, -1) })),
      ).toEqual({ kind: 'closed' })
    })

    test.each<BookingStatus>(['expired', 'cancelled', 'no_show'])('a %s pass is closed', (status) => {
      expect(gateVerdictOf(pass({ status }))).toEqual({ kind: 'closed' })
    })
  })
})

describe('gateVerdictSentence', () => {
  const every: GateVerdict[] = [
    { kind: 'check_in', stayOwed: false },
    { kind: 'check_in', stayOwed: true },
    { kind: 'office', reason: 'not_confirmed' },
    { kind: 'office', reason: 'deposit_not_in' },
    { kind: 'office', reason: 'deposit_promised' },
    { kind: 'office', reason: 'deposit_short' },
    { kind: 'office', reason: 'early' },
    { kind: 'office', reason: 'pass_unpaid' },
    { kind: 'office', reason: 'pass_other_day' },
    { kind: 'admit' },
    { kind: 'admitted' },
    { kind: 'in_residence' },
    { kind: 'closed' },
  ]

  test('every verdict has a sentence, and none quotes a figure', () => {
    for (const verdict of every) {
      for (const mayCheckIn of [true, false]) {
        const sentence = gateVerdictSentence(verdict, TODAY, { mayCheckIn })

        expect(sentence.length).toBeGreaterThan(0)
        expect(sentence).not.toMatch(/BND|\d+\.\d{2}/)
      }
    }
  })

  test('an owed stay says where it is paid', () => {
    expect(
      gateVerdictSentence({ kind: 'check_in', stayOwed: true }, TODAY, { mayCheckIn: true }),
    ).toMatch(/office/)
  })

  test('a guard who does not check guests in is told the office does, whatever is owed', () => {
    // N54: the keys are at the counter, so the desk checks the guest in and
    // settles the stay there. The guard's only question is whether to stop them.
    for (const stayOwed of [false, true]) {
      expect(gateVerdictSentence({ kind: 'check_in', stayOwed }, TODAY, { mayCheckIn: false })).toBe(
        'All in order. They check in at the office.',
      )
    }
  })

  test('an early arrival names the day the booking starts', () => {
    const arrival = addDays(TODAY, 2)

    expect(
      gateVerdictSentence({ kind: 'office', reason: 'early' }, arrival, { mayCheckIn: true }),
    ).toContain(formatStayDate(arrival))
  })

  test('a pass for another day names the day it is for', () => {
    const arrival = addDays(TODAY, -1)

    expect(
      gateVerdictSentence({ kind: 'office', reason: 'pass_other_day' }, arrival, {
        mayCheckIn: false,
      }),
    ).toContain(formatStayDate(arrival))
  })

  test('every office verdict says to send them to the office', () => {
    for (const verdict of every.filter((candidate) => candidate.kind === 'office')) {
      expect(gateVerdictSentence(verdict, TODAY, { mayCheckIn: false })).toMatch(
        /Send them to the office\.$/,
      )
    }
  })
})

describe('gateRefusalSentence', () => {
  test('an unsecured deposit sends the guard to the office', () => {
    expect(gateRefusalSentence('deposit_not_secured')).toMatch(/office/)
  })

  test('a booking somebody else checked in first is said to be done', () => {
    expect(gateRefusalSentence('status_changed', { alreadyIn: true })).toMatch(/Already checked in/)
  })

  test('a pass somebody else admitted first is said to be done', () => {
    expect(gateRefusalSentence('status_changed', { alreadyAdmitted: true })).toMatch(
      /Already admitted/,
    )
  })

  test.each(['not_today', 'owed'])('%s sends the guard to the office', (code) => {
    expect(gateRefusalSentence(code)).toMatch(/Send them to the office\.$/)
  })

  test.each([
    'status_changed',
    'illegal_transition',
    'terminal_state',
    'not_found',
    'not_a_day_pass',
  ])(
    '%s tells the guard to refresh',
    (code) => {
      expect(gateRefusalSentence(code)).toMatch(/Refresh the list/)
    },
  )
})

describe('plateKey', () => {
  test('keeps letters and digits, upper-cased', () => {
    expect(plateKey('baa 1234')).toBe('BAA1234')
    expect(plateKey('BAA-1234')).toBe('BAA1234')
    expect(plateKey('  bAa\t12 34 ')).toBe('BAA1234')
  })
})

describe('matchesGateSearch', () => {
  const row = { reference: 'PV-4821', guestName: 'Siti Aminah', vehicles: ['BAA 1234', 'KB 88'] }

  test('an empty box matches everything', () => {
    expect(matchesGateSearch('', row)).toBe(true)
    expect(matchesGateSearch('   ', row)).toBe(true)
  })

  test('a plate matches however the guard spaced it', () => {
    expect(matchesGateSearch('baa1234', row)).toBe(true)
    expect(matchesGateSearch('BAA 1234', row)).toBe(true)
    expect(matchesGateSearch('a12', row)).toBe(true)
    expect(matchesGateSearch('kb88', row)).toBe(true)
  })

  test('part of the name matches, whatever the case', () => {
    expect(matchesGateSearch('aminah', row)).toBe(true)
    expect(matchesGateSearch('SITI A', row)).toBe(true)
  })

  test('the reference matches with or without its dash', () => {
    expect(matchesGateSearch('4821', row)).toBe(true)
    expect(matchesGateSearch('pv4821', row)).toBe(true)
  })

  test('something that is none of those does not match', () => {
    expect(matchesGateSearch('BAB 5678', row)).toBe(false)
    expect(matchesGateSearch('Rahman', row)).toBe(false)
  })

  test('punctuation alone matches nothing rather than every plate', () => {
    expect(matchesGateSearch('--', row)).toBe(false)
  })
})
