import { describe, expect, test } from 'vitest'

import type { Permission } from '@/lib/auth/permissions'

import { fieldJobsFor, landingPathFor, mayWork } from './field-jobs'

const set = (...permissions: Permission[]): ReadonlySet<Permission> => new Set(permissions)

/** The seeded roles (supabase/seed.sql), as the session reads them. */
const SECURITY = set(
  'booking.view',
  'booking.check_in',
  'booking.check_out',
  'day_pass.admit',
  'payment.record_cash',
)
const HOUSEKEEPING = set('booking.view', 'booking.check_out', 'inspection.record', 'unit.manage')
const FRONT_OFFICE = set(
  'booking.view',
  'booking.create',
  'booking.amend',
  'booking.check_in',
  'booking.check_out',
  'day_pass.admit',
  'payment.verify',
  'payment.record_cash',
)

describe('fieldJobsFor', () => {
  test('a guard works the gate', () => {
    expect(fieldJobsFor(SECURITY).map((job) => job.id)).toEqual(['arrivals'])
  })

  test('the gate is called the Gate — it checks guests out as well as in (N54)', () => {
    expect(fieldJobsFor(SECURITY).map((job) => job.label)).toEqual(['Gate'])
  })

  test('either of the gate’s two arrival moves opens it — checking a stay in, or admitting a day pass', () => {
    expect(fieldJobsFor(set('booking.view', 'booking.check_in')).map((job) => job.id)).toEqual([
      'arrivals',
    ])
    expect(fieldJobsFor(set('booking.view', 'day_pass.admit')).map((job) => job.id)).toEqual([
      'arrivals',
    ])
  })

  test('checking guests out alone opens no gate, so Housekeeping is not handed a second screen', () => {
    expect(fieldJobsFor(set('booking.view', 'booking.check_out'))).toEqual([])
  })

  test('recording cash alone opens no field screen', () => {
    expect(fieldJobsFor(set('booking.view', 'payment.record_cash'))).toEqual([])
  })

  test('viewing bookings alone opens no field screen', () => {
    expect(fieldJobsFor(set('booking.view'))).toEqual([])
  })

  test('housekeeping works the departures, and only the departures', () => {
    expect(fieldJobsFor(HOUSEKEEPING).map((job) => job.id)).toEqual(['departures'])
  })

  test('the office can check guests out but is handed no cleaning list', () => {
    // Departures answers to inspection.record, which the office does not hold.
    expect(fieldJobsFor(FRONT_OFFICE).map((job) => job.id)).toEqual(['arrivals'])
  })

  test('somebody holding both jobs gets both, gate first', () => {
    const both = set('booking.view', 'day_pass.admit', 'booking.check_out', 'inspection.record')

    expect(fieldJobsFor(both).map((job) => job.id)).toEqual(['arrivals', 'departures'])
  })
})

describe('mayWork', () => {
  test('answers for one screen by its id', () => {
    expect(mayWork(SECURITY, 'arrivals')).toBe(true)
    expect(mayWork(SECURITY, 'departures')).toBe(false)
    expect(mayWork(HOUSEKEEPING, 'departures')).toBe(true)
  })
})

describe('landingPathFor', () => {
  test('a guard signs in straight to the gate — taking cash there does not make the portal his job', () => {
    // The trap N54 set: `payment.record_cash` used to be a portal permission
    // here, and granting it sent the guard to /portal on sign-in.
    expect(landingPathFor(SECURITY)).toBe('/field/arrivals')
  })

  test('housekeeping signs in straight to the departures', () => {
    expect(landingPathFor(HOUSEKEEPING)).toBe('/field/departures')
  })

  test('somebody whose whole job is both field screens lands on the chooser', () => {
    const both = set(
      'booking.view',
      'day_pass.admit',
      'booking.check_out',
      'inspection.record',
      'unit.manage',
    )

    expect(landingPathFor(both)).toBe('/field')
  })

  test('the office lands on the portal even though it works the gate', () => {
    expect(landingPathFor(FRONT_OFFICE)).toBe('/portal')
  })

  test('a field permission alone is not enough without a screen to work', () => {
    expect(landingPathFor(set('booking.view', 'unit.manage'))).toBe('/portal')
    expect(landingPathFor(set('booking.view', 'payment.record_cash'))).toBe('/portal')
  })

  test('one portal permission beside the gate keeps a person on the portal', () => {
    expect(landingPathFor(set('booking.view', 'day_pass.admit', 'report.view'))).toBe('/portal')
    expect(landingPathFor(set('booking.view', 'day_pass.admit', 'payment.verify'))).toBe('/portal')
  })

  test('somebody holding nothing lands on the portal, which says so', () => {
    expect(landingPathFor(set())).toBe('/portal')
  })
})
