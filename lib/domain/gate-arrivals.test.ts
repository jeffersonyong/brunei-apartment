import { describe, expect, test } from 'vitest'

import { MAX_EXTRA_GUESTS } from './extra-guests'
import type { GateVerdict } from './gate'
import {
  alreadyCountedSentence,
  arrivalsControlOf,
  arrivalsCountRange,
  arrivalsRefusalSentence,
  arrivalsSumLine,
  arrivalsTargetOf,
  countedSentence,
  defaultArrivalsCount,
  extrasNamedMatch,
  extrasToReport,
  firstCountExtrasRouteOf,
  gateArrivalsLine,
  gateArrivalsOf,
  overBookingNotice,
} from './gate-arrivals'

const CHECK_IN: GateVerdict = { kind: 'check_in', stay: 'paid' }
const ADMIT: GateVerdict = { kind: 'admit' }
const ADMITTED: GateVerdict = { kind: 'admitted' }
const IN_RESIDENCE: GateVerdict = { kind: 'in_residence' }
const LEAVING: GateVerdict = { kind: 'leaving', stay: 'paid', overdue: false }
const CLOSED: GateVerdict = { kind: 'closed' }

describe('gateArrivalsOf — who is in, against the booking', () => {
  test('some still to come', () => {
    expect(gateArrivalsOf(20, 15)).toEqual({ booked: 20, arrived: 15, toCome: 5, over: 0 })
  })

  test('everyone booked, and nobody more', () => {
    expect(gateArrivalsOf(20, 20)).toEqual({ booked: 20, arrived: 20, toCome: 0, over: 0 })
  })

  test('more than the booking is for', () => {
    expect(gateArrivalsOf(20, 23)).toEqual({ booked: 20, arrived: 23, toCome: 0, over: 3 })
  })

  test('nobody through yet — an office check-in the guard corrected to none', () => {
    expect(gateArrivalsOf(4, 0)).toEqual({ booked: 4, arrived: 0, toCome: 4, over: 0 })
  })
})

describe('gateArrivalsLine — what the card says under the party', () => {
  test('names who is still to come', () => {
    expect(gateArrivalsLine(gateArrivalsOf(20, 15))).toBe('15 of 20 arrived · 5 to come')
  })

  test('says so plainly when everyone booked is in', () => {
    expect(gateArrivalsLine(gateArrivalsOf(20, 20))).toBe('20 of 20 arrived')
  })

  test('names how many more than booked came through', () => {
    expect(gateArrivalsLine(gateArrivalsOf(20, 23))).toBe('23 arrived · 3 more than booked')
  })

  test('reads for one person as well as many', () => {
    expect(gateArrivalsLine(gateArrivalsOf(1, 0))).toBe('0 of 1 arrived · 1 to come')
  })
})

describe('arrivalsControlOf — which counter the card offers', () => {
  test('the first count is Check in or Admit itself', () => {
    expect(arrivalsControlOf(CHECK_IN, null)).toBe('first')
    expect(arrivalsControlOf(ADMIT, null)).toBe('first')
  })

  test('Record arrivals while anyone booked is still to come', () => {
    expect(arrivalsControlOf(IN_RESIDENCE, gateArrivalsOf(4, 2))).toBe('more')
    expect(arrivalsControlOf(ADMITTED, gateArrivalsOf(20, 15))).toBe('more')
    expect(arrivalsControlOf(LEAVING, gateArrivalsOf(4, 3))).toBe('more')
  })

  test('once everyone booked is in, only the Extra counter', () => {
    expect(arrivalsControlOf(ADMITTED, gateArrivalsOf(20, 20))).toBe('all_in')
    expect(arrivalsControlOf(IN_RESIDENCE, gateArrivalsOf(4, 6))).toBe('all_in')
  })

  test('nothing to count against a booking that was never counted', () => {
    // A checked-in stay with no count can only come from the generic
    // transition, which the app never uses to check anybody in.
    expect(arrivalsControlOf(IN_RESIDENCE, null)).toBeNull()
  })

  test('nothing on a closed booking, even one with a count — reached by QR or search', () => {
    expect(arrivalsControlOf(CLOSED, gateArrivalsOf(20, 20))).toBeNull()
  })

  test('nothing on a card the office has to deal with first', () => {
    expect(arrivalsControlOf({ kind: 'office', reason: 'deposit_not_in' }, null)).toBeNull()
    expect(arrivalsControlOf({ kind: 'office', reason: 'pass_unpaid' }, null)).toBeNull()
  })
})

describe('defaultArrivalsCount — what the counter opens on', () => {
  test('the whole party on the first count', () => {
    expect(defaultArrivalsCount('first', 20, null)).toBe(20)
  })

  test('everyone still to come on Record arrivals', () => {
    expect(defaultArrivalsCount('more', 20, gateArrivalsOf(20, 15))).toBe(5)
  })

  test('one on Extra, once everyone booked is in', () => {
    expect(defaultArrivalsCount('all_in', 20, gateArrivalsOf(20, 20))).toBe(1)
  })
})

describe('arrivalsCountRange — what the counter accepts', () => {
  test('the first count: at least one at the car, and at most fifty beyond the booking', () => {
    expect(arrivalsCountRange('first', 20, null)).toEqual({ min: 1, max: 20 + MAX_EXTRA_GUESTS })
  })

  test('more: at least one, and at most fifty beyond whoever is still to come', () => {
    expect(arrivalsCountRange('more', 20, gateArrivalsOf(20, 15))).toEqual({
      min: 1,
      max: 5 + MAX_EXTRA_GUESTS,
    })
  })

  test('a correction may go down to none, and up to fifty beyond the larger of booked and counted', () => {
    expect(arrivalsCountRange('correct', 20, gateArrivalsOf(20, 23))).toEqual({
      min: 0,
      max: 23 + MAX_EXTRA_GUESTS,
    })
    expect(arrivalsCountRange('correct', 20, gateArrivalsOf(20, 5))).toEqual({
      min: 0,
      max: 20 + MAX_EXTRA_GUESTS,
    })
  })
})

describe('arrivalsTargetOf — the new total a count asks for', () => {
  test('more adds to the count the guard saw', () => {
    expect(arrivalsTargetOf({ kind: 'more', count: 5 }, 15)).toBe(20)
  })

  test('a correction says the total outright', () => {
    expect(arrivalsTargetOf({ kind: 'correct', count: 18 }, 20)).toBe(18)
  })
})

describe('extrasToReport — how many beyond the booking the office has not been told of', () => {
  test('everyone beyond the booking, when nothing was said before', () => {
    expect(extrasToReport(23, 20, 0)).toBe(3)
  })

  test('nothing while the count is within the booking', () => {
    expect(extrasToReport(18, 20, 0)).toBe(0)
  })

  test('only the new ones, when some were already reported', () => {
    expect(extrasToReport(25, 20, 3)).toBe(2)
  })

  test('the same three are not reported twice after a correction down and a recount', () => {
    // 23 counted and reported, corrected to 20, then 3 more: still 3 beyond
    // the booking, and the office already knows about them.
    expect(extrasToReport(23, 20, 3)).toBe(0)
  })

  test('never below nothing', () => {
    expect(extrasToReport(20, 20, 4)).toBe(0)
  })
})

describe('firstCountExtrasRouteOf — who settles more than booked at the first count', () => {
  const settleable = {
    stream: 'day_pass',
    verdict: ADMIT,
    takesCash: true,
    moneySettled: true,
    hasRates: true,
  } as const

  test('a paid pass on its day, for a guard who takes cash, is settled at the gate', () => {
    expect(firstCountExtrasRouteOf(settleable)).toBe('settle')
  })

  test('a stay is always the office’s', () => {
    expect(
      firstCountExtrasRouteOf({ ...settleable, stream: 'short_stay', verdict: CHECK_IN }),
    ).toBe('tell_office')
  })

  test('a guard who does not take cash tells the office', () => {
    expect(firstCountExtrasRouteOf({ ...settleable, takesCash: false })).toBe('tell_office')
  })

  test('a pass with a transfer waiting to be checked is the office’s', () => {
    expect(firstCountExtrasRouteOf({ ...settleable, moneySettled: false })).toBe('tell_office')
  })

  test('a phone sent no rates cannot price them', () => {
    expect(firstCountExtrasRouteOf({ ...settleable, hasRates: false })).toBe('tell_office')
  })

  test('only a pass being admitted now', () => {
    expect(firstCountExtrasRouteOf({ ...settleable, verdict: ADMITTED })).toBe('tell_office')
  })
})

describe('extrasNamedMatch — the extras named by band are the ones counted', () => {
  test('matches when the bands add up to the extras', () => {
    expect(extrasNamedMatch({ adult: 2, child: 1 }, 3)).toBe(true)
  })

  test('refuses too few or too many', () => {
    expect(extrasNamedMatch({ adult: 2 }, 3)).toBe(false)
    expect(extrasNamedMatch({ adult: 4 }, 3)).toBe(false)
  })

  test('refuses a band counted below nothing', () => {
    expect(extrasNamedMatch({ adult: 4, child: -1 }, 3)).toBe(false)
  })
})

describe('arrivalsRefusalSentence', () => {
  test('a count that moved names what it is now', () => {
    expect(arrivalsRefusalSentence('changed', gateArrivalsOf(20, 18))).toBe(
      'The count changed a moment ago — now 18 of 20 arrived · 2 to come. Refresh the list and look again.',
    )
  })

  test('a count that moved with nothing to name still says what to do', () => {
    expect(arrivalsRefusalSentence('changed')).toBe(
      'The count changed a moment ago. Refresh the list and look again.',
    )
  })

  test('every other refusal tells the guard what to do next', () => {
    expect(arrivalsRefusalSentence('not_in')).toBe(
      'Nobody has been let in on this booking yet. Refresh the list and look again.',
    )
    expect(arrivalsRefusalSentence('not_today')).toBe(
      'This day pass is for another day. Call the office.',
    )
    expect(arrivalsRefusalSentence('closed')).toBe('This booking is closed. Call the office.')
    expect(arrivalsRefusalSentence('unchanged')).toBe(
      'That is the count already. Nothing to change.',
    )
    expect(arrivalsRefusalSentence('not_found')).toBe(
      'That booking no longer exists. Refresh the list.',
    )
    expect(arrivalsRefusalSentence('out_of_range')).toBe(
      'That number is more than the gate can record in one go. Count them again.',
    )
  })
})

describe('alreadyCountedSentence — somebody else let them in first', () => {
  test('names the count they recorded, so the guard’s own number is not lost', () => {
    expect(alreadyCountedSentence('check_in', gateArrivalsOf(4, 4))).toBe(
      'Already checked in — 4 of 4 arrived. If that is wrong, correct it with Record arrivals.',
    )
    expect(alreadyCountedSentence('admit', gateArrivalsOf(20, 15))).toBe(
      'Already admitted — 15 of 20 arrived · 5 to come. If that is wrong, correct it with Record arrivals.',
    )
  })

  test('says the old sentence when there is no count to name', () => {
    expect(alreadyCountedSentence('check_in', null)).toBe('Already checked in. Nothing more to do.')
    expect(alreadyCountedSentence('admit', null)).toBe('Already admitted. Nothing more to do.')
  })
})

describe('countedSentence — what the toast says once a count is in', () => {
  test('the count alone when nobody more than booked came', () => {
    expect(countedSentence(gateArrivalsOf(20, 15), null)).toBe('15 of 20 arrived · 5 to come')
    expect(countedSentence(gateArrivalsOf(20, 20), { extra: 0, told: false })).toBe(
      '20 of 20 arrived',
    )
  })

  test('says the office is told about the ones beyond the booking', () => {
    expect(countedSentence(gateArrivalsOf(4, 6), { extra: 2, told: true })).toBe(
      '6 arrived · 2 more than booked — the office is told',
    )
  })

  test('says so when the office could not be told, so the guard calls them', () => {
    expect(countedSentence(gateArrivalsOf(4, 6), { extra: 2, told: false })).toBe(
      '6 arrived · 2 more than booked — the office could not be told, so call them',
    )
  })
})

describe('arrivalsSumLine — the sum done for the guard as he types', () => {
  test('adds the car in front of him to who is in already', () => {
    expect(arrivalsSumLine('more', 1, 3)).toBe('1 in already + 3 now = 4 in all')
  })

  test('a correction says what the count goes from and to', () => {
    expect(arrivalsSumLine('correct', 3, 1)).toBe('The count goes from 3 to 1.')
  })

  test('a correction to the same number says so', () => {
    expect(arrivalsSumLine('correct', 3, 3)).toBe('That is the count already.')
  })
})

describe('overBookingNotice — the whole overage, and what the office hears of it', () => {
  test('nothing while the count is within the booking', () => {
    expect(overBookingNotice(gateArrivalsOf(4, 3), 0)).toBeNull()
    expect(overBookingNotice(gateArrivalsOf(4, 4), 2)).toBeNull()
  })

  test('the office is told about everyone beyond the booking it has not heard of', () => {
    expect(overBookingNotice(gateArrivalsOf(2, 4), 0)).toBe(
      'That is 2 more than booked (for 2). The office is told, and sorts out any extra charge.',
    )
  })

  test('always the full overage, even when the office already knows about some', () => {
    // The case the guard met on 29 September: told about one extra earlier,
    // so a count of four against two used to read "1 more than booked".
    expect(overBookingNotice(gateArrivalsOf(2, 4), 1)).toBe(
      'That is 2 more than booked (for 2). The office already knows about 1, and is told about 1 more.',
    )
  })

  test('says the office already knows when there is nobody new to tell', () => {
    expect(overBookingNotice(gateArrivalsOf(2, 3), 1)).toBe(
      'That is 1 more than booked (for 2). The office already knows.',
    )
    expect(overBookingNotice(gateArrivalsOf(2, 3), 4)).toBe(
      'That is 1 more than booked (for 2). The office already knows.',
    )
  })
})
