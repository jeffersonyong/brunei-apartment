import { describe, expect, test } from 'vitest'

import type { BookingStatus } from './booking-state'
import { addDays, formatStayDate } from './dates'
import {
  gateRefusalSentence,
  gateVerdictOf,
  gateVerdictSentence,
  matchesGateSearch,
  type GateDates,
  type GateFacts,
  type GateSentenceOptions,
  type GateVerdict,
} from './gate'
import { bnd } from './money'
import { plateKey } from './vehicle'

const TODAY = '2026-09-13'
const YESTERDAY = addDays(TODAY, -1)
const TOMORROW = addDays(TODAY, 1)
const DATES: GateDates = { arrival: TODAY, departure: addDays(TODAY, 3) }

/** A paid, deposit-secured stay arriving today — the ordinary car at the barrier. */
function facts(overrides: Partial<GateFacts> = {}): GateFacts {
  return {
    status: 'confirmed',
    stream: 'short_stay',
    arrival: TODAY,
    departure: addDays(TODAY, 3),
    today: TODAY,
    deposit: { quoted: bnd(100), held: bnd(100), collected: true, promised: false },
    total: bnd(400),
    paid: bnd(400),
    transferPending: false,
    ...overrides,
  }
}

/** The guard, who is the front desk (N54): he checks guests in and out. */
const GUARD: GateSentenceOptions = { mayCheckIn: true, mayCheckOut: true }

/** Every combination of what a reader at the gate may do. */
const READERS: readonly GateSentenceOptions[] = [true, false].flatMap((mayCheckIn) =>
  [true, false].map((mayCheckOut) => ({ mayCheckIn, mayCheckOut })),
)

describe('gateVerdictOf — a stay arriving', () => {
  test('a secured, paid stay arriving today is checked in', () => {
    expect(gateVerdictOf(facts())).toEqual({ kind: 'check_in', stay: 'paid' })
  })

  test('money owed on the stay is said and does not stop the car', () => {
    expect(gateVerdictOf(facts({ paid: 0 }))).toEqual({ kind: 'check_in', stay: 'owed' })
  })

  test('a transfer for the stay still waiting to be checked is said, and does not stop the car', () => {
    expect(gateVerdictOf(facts({ paid: 0, transferPending: true }))).toEqual({
      kind: 'check_in',
      stay: 'awaiting_transfer',
    })
  })

  test('a guest arriving a day late still has a booking', () => {
    expect(gateVerdictOf(facts({ arrival: YESTERDAY })).kind).toBe('check_in')
  })

  test('a guest arriving before their booking starts goes to the office', () => {
    expect(gateVerdictOf(facts({ arrival: addDays(TODAY, 2) }))).toEqual({
      kind: 'office',
      reason: 'early',
    })
  })

  test('an early arrival is sent to the office before its deposit is looked at', () => {
    const deposit = { quoted: bnd(100), held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ arrival: TOMORROW, deposit }))).toEqual({
      kind: 'office',
      reason: 'early',
    })
  })

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

  test.each<BookingStatus>(['held', 'awaiting_payment_verification'])(
    'an unconfirmed (%s) booking says which way its deposit is missing, rather than only that it is unconfirmed',
    (status) => {
      const promised = { quoted: bnd(100), held: bnd(100), collected: false, promised: true }
      const nothing = { quoted: bnd(100), held: 0, collected: false, promised: false }

      expect(gateVerdictOf(facts({ status, deposit: promised }))).toEqual({
        kind: 'office',
        reason: 'deposit_promised',
      })
      expect(gateVerdictOf(facts({ status, deposit: nothing }))).toEqual({
        kind: 'office',
        reason: 'deposit_not_in',
      })
    },
  )

  test('an unconfirmed booking waiting on a transfer is the office’s until somebody checks it', () => {
    expect(
      gateVerdictOf(
        facts({ status: 'awaiting_payment_verification', paid: 0, transferPending: true }),
      ),
    ).toEqual({ kind: 'office', reason: 'transfer_pending' })
  })

  test('an unconfirmed booking with nothing paid for the stay says so', () => {
    const waived = { quoted: 0, held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ status: 'held', deposit: waived, paid: 0 }))).toEqual({
      kind: 'office',
      reason: 'stay_unpaid',
    })
  })

  test.each<BookingStatus>(['draft', 'held', 'awaiting_payment_verification'])(
    'an unconfirmed (%s) booking with nothing missing is still the office’s to confirm',
    (status) => {
      expect(gateVerdictOf(facts({ status }))).toEqual({ kind: 'office', reason: 'not_confirmed' })
    },
  )

  test('a booking quoting no deposit — waived — is checked in', () => {
    const deposit = { quoted: 0, held: 0, collected: false, promised: false }

    expect(gateVerdictOf(facts({ deposit })).kind).toBe('check_in')
  })

  test.each<BookingStatus>(['completed', 'expired', 'cancelled', 'no_show'])(
    'a %s booking is closed',
    (status) => {
      expect(gateVerdictOf(facts({ status }))).toEqual({ kind: 'closed' })
    },
  )
})

describe('gateVerdictOf — a guest checked in (N54: the keys come back to the gate)', () => {
  const staying = (overrides: Partial<GateFacts> = {}): GateFacts =>
    facts({ status: 'checked_in', arrival: addDays(TODAY, -2), ...overrides })

  test('a guest whose last day is today is leaving', () => {
    expect(gateVerdictOf(staying({ departure: TODAY }))).toEqual({
      kind: 'leaving',
      stay: 'paid',
      overdue: false,
    })
  })

  test('a guest who should have left yesterday is leaving, and overdue', () => {
    expect(gateVerdictOf(staying({ departure: YESTERDAY }))).toEqual({
      kind: 'leaving',
      stay: 'paid',
      overdue: true,
    })
  })

  test('a guest whose stay runs past today is in residence — the gate never checks anybody out early', () => {
    expect(gateVerdictOf(staying({ departure: TOMORROW }))).toEqual({ kind: 'in_residence' })
  })

  test('a guest leaving with the stay still owed is said to owe it', () => {
    expect(gateVerdictOf(staying({ departure: TODAY, paid: 0 }))).toEqual({
      kind: 'leaving',
      stay: 'owed',
      overdue: false,
    })
  })

  test('a guest leaving while a transfer for the stay waits to be checked is said to be waiting', () => {
    expect(gateVerdictOf(staying({ departure: TODAY, paid: 0, transferPending: true }))).toEqual({
      kind: 'leaving',
      stay: 'awaiting_transfer',
      overdue: false,
    })
  })
})

describe('gateVerdictOf — a day pass, admitted on its own day and paid in full', () => {
  /** A paid pass for today — the ordinary day visitor. */
  const pass = (overrides: Partial<GateFacts> = {}): GateFacts =>
    facts({
      stream: 'day_pass',
      departure: null,
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

  test('a pass waiting on a transfer is the office’s until somebody checks it', () => {
    expect(gateVerdictOf(pass({ status: 'held', paid: 0, transferPending: true }))).toEqual({
      kind: 'office',
      reason: 'transfer_pending',
    })
  })

  test.each([1, -1])('a pass dated %i day(s) from today goes to the office', (offset) => {
    expect(gateVerdictOf(pass({ arrival: addDays(TODAY, offset) }))).toEqual({
      kind: 'office',
      reason: 'pass_other_day',
    })
  })

  test('a pass for another day is sent there for its day before anything is said about payment', () => {
    expect(gateVerdictOf(pass({ status: 'held', paid: 0, arrival: TOMORROW }))).toEqual({
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
    expect(gateVerdictOf(pass({ status: 'completed', arrival: YESTERDAY }))).toEqual({
      kind: 'closed',
    })
  })

  test.each<BookingStatus>(['expired', 'cancelled', 'no_show'])('a %s pass is closed', (status) => {
    expect(gateVerdictOf(pass({ status }))).toEqual({ kind: 'closed' })
  })
})

describe('gateVerdictSentence', () => {
  const every: GateVerdict[] = [
    { kind: 'check_in', stay: 'paid' },
    { kind: 'check_in', stay: 'owed' },
    { kind: 'check_in', stay: 'awaiting_transfer' },
    { kind: 'leaving', stay: 'paid', overdue: false },
    { kind: 'leaving', stay: 'owed', overdue: true },
    { kind: 'leaving', stay: 'awaiting_transfer', overdue: false },
    { kind: 'office', reason: 'not_confirmed' },
    { kind: 'office', reason: 'deposit_not_in' },
    { kind: 'office', reason: 'deposit_promised' },
    { kind: 'office', reason: 'deposit_short' },
    { kind: 'office', reason: 'early' },
    { kind: 'office', reason: 'stay_unpaid' },
    { kind: 'office', reason: 'transfer_pending' },
    { kind: 'office', reason: 'pass_unpaid' },
    { kind: 'office', reason: 'pass_other_day' },
    { kind: 'admit' },
    { kind: 'admitted' },
    { kind: 'in_residence' },
    { kind: 'closed' },
  ]

  test('every verdict has a sentence for every reader, and none quotes a figure', () => {
    for (const verdict of every) {
      for (const reader of READERS) {
        const sentence = gateVerdictSentence(verdict, DATES, reader)

        expect(sentence.length).toBeGreaterThan(0)
        expect(sentence).not.toMatch(/BND|\d+\.\d{2}/)
      }
    }
  })

  test('every office verdict tells the guard to call the office — he is the front desk, so there is no counter to send them to', () => {
    for (const verdict of every.filter((candidate) => candidate.kind === 'office')) {
      for (const reader of READERS) {
        expect(gateVerdictSentence(verdict, DATES, reader)).toMatch(/Call the office\.$/)
      }
    }
  })

  test('a reader who may not check guests in is told to call the office for it', () => {
    expect(
      gateVerdictSentence({ kind: 'check_in', stay: 'paid' }, DATES, {
        mayCheckIn: false,
        mayCheckOut: false,
      }),
    ).toBe('All in order. Call the office to check them in.')
  })

  test('a guest due out today is checked out when the keys come back', () => {
    expect(
      gateVerdictSentence({ kind: 'leaving', stay: 'paid', overdue: false }, DATES, GUARD),
    ).toBe('Due out today. Check them out when they hand back the keys.')
  })

  test('an overdue guest names the day they were due out', () => {
    const dates = { arrival: addDays(TODAY, -3), departure: YESTERDAY }

    expect(
      gateVerdictSentence({ kind: 'leaving', stay: 'paid', overdue: true }, dates, GUARD),
    ).toContain(formatStayDate(YESTERDAY))
  })

  test('a reader who may not check guests out calls the office when the keys come back', () => {
    expect(
      gateVerdictSentence({ kind: 'leaving', stay: 'paid', overdue: false }, DATES, {
        mayCheckIn: true,
        mayCheckOut: false,
      }),
    ).toMatch(/Call the office when they hand back the keys\.$/)
  })

  test('a guest leaving with the stay owed is held for the office, because a checked-out booking takes no payment', () => {
    expect(
      gateVerdictSentence({ kind: 'leaving', stay: 'owed', overdue: false }, DATES, GUARD),
    ).toContain('Call the office before they leave.')
  })

  test('an early arrival names the day the booking starts', () => {
    const arrival = addDays(TODAY, 2)

    expect(
      gateVerdictSentence(
        { kind: 'office', reason: 'early' },
        { arrival, departure: addDays(arrival, 2) },
        GUARD,
      ),
    ).toContain(formatStayDate(arrival))
  })

  test('a pass for another day names the day it is for', () => {
    expect(
      gateVerdictSentence(
        { kind: 'office', reason: 'pass_other_day' },
        { arrival: YESTERDAY, departure: null },
        GUARD,
      ),
    ).toContain(formatStayDate(YESTERDAY))
  })
})

describe('gateRefusalSentence', () => {
  test('an unsecured deposit tells the guard to call the office', () => {
    expect(gateRefusalSentence('deposit_not_secured')).toMatch(/Call the office/)
  })

  test('a booking somebody else checked in first is said to be done', () => {
    expect(gateRefusalSentence('status_changed', { alreadyIn: true })).toMatch(/Already checked in/)
  })

  test('a guest somebody else checked out first is said to be done', () => {
    expect(gateRefusalSentence('status_changed', { alreadyOut: true })).toMatch(
      /Already checked out/,
    )
  })

  test('a pass somebody else admitted first is said to be done', () => {
    expect(gateRefusalSentence('status_changed', { alreadyAdmitted: true })).toMatch(
      /Already admitted/,
    )
  })

  test.each(['not_today', 'owed', 'not_due_out'])(
    '%s tells the guard to call the office',
    (code) => {
      expect(gateRefusalSentence(code)).toMatch(/Call the office\.$/)
    },
  )

  test.each([
    'status_changed',
    'illegal_transition',
    'terminal_state',
    'not_found',
    'not_a_day_pass',
  ])('%s tells the guard to refresh', (code) => {
    expect(gateRefusalSentence(code)).toMatch(/Refresh the list/)
  })
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
