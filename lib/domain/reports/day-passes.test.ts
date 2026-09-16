import { describe, expect, test } from 'vitest'

import type { DayHeadroom } from '../day-pass-capacity'

import { dayPassVolume, formatDayPassCapacity } from './day-passes'

/**
 * Day-pass volume against capacity (capability E5): guests sold per day, and
 * how full that made the pass.
 */

function day(date: string, taken: number, capacity: number | null = 40): DayHeadroom {
  return { date, taken, capacity }
}

describe('dayPassVolume', () => {
  test('lists only the days something was sold, in date order', () => {
    const volume = dayPassVolume([
      day('2026-09-03', 0),
      day('2026-09-01', 10),
      day('2026-09-02', 30),
    ])

    expect(volume.days.map((row) => row.date)).toEqual(['2026-09-01', '2026-09-02'])
    expect(volume.days.map((row) => row.share)).toEqual([0.25, 0.75])
  })

  test('totals the period against every day of it, not only the busy ones', () => {
    const volume = dayPassVolume([
      day('2026-09-01', 10),
      day('2026-09-02', 30),
      day('2026-09-03', 0),
    ])

    expect(volume).toMatchObject({
      guests: 40,
      daysWithPasses: 2,
      daysInPeriod: 3,
      capacity: 40,
      share: 40 / 120,
    })
  })

  test('has no share when no capacity is set, rather than a share of nothing', () => {
    const volume = dayPassVolume([day('2026-09-01', 10, null)])

    expect(volume.capacity).toBeNull()
    expect(volume.share).toBeNull()
    expect(volume.days[0]?.share).toBeNull()
  })

  test('treats a capacity of zero as closed, not as infinitely full', () => {
    const volume = dayPassVolume([day('2026-09-01', 2, 0)])

    expect(volume.days[0]?.share).toBeNull()
    expect(volume.share).toBeNull()
  })

  test('is empty for a period with nothing sold', () => {
    expect(dayPassVolume([day('2026-09-01', 0)])).toMatchObject({
      days: [],
      guests: 0,
      share: 0,
    })
    expect(dayPassVolume([])).toMatchObject({ days: [], daysInPeriod: 0, share: null })
  })
})

describe('formatDayPassCapacity', () => {
  test('says when no limit is set, and when the pass is closed', () => {
    expect(formatDayPassCapacity(null)).toBe('No limit set')
    expect(formatDayPassCapacity(0)).toBe('Closed')
    expect(formatDayPassCapacity(40)).toBe('40')
  })
})
