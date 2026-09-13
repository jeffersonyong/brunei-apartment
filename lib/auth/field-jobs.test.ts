import { describe, expect, test } from 'vitest'

import type { Permission } from '@/lib/auth/permissions'

import { fieldJobsFor, landingPathFor } from './field-jobs'

const set = (...permissions: Permission[]): ReadonlySet<Permission> => new Set(permissions)

/** The seeded roles (supabase/seed.sql), as the session reads them. */
const SECURITY = set('booking.view', 'booking.check_in')
const HOUSEKEEPING = set('booking.view', 'booking.check_out', 'inspection.record', 'unit.manage')
const FRONT_OFFICE = set(
  'booking.view',
  'booking.create',
  'booking.amend',
  'booking.check_in',
  'booking.check_out',
  'payment.verify',
)

describe('fieldJobsFor', () => {
  test('a guard works the gate', () => {
    expect(fieldJobsFor(SECURITY).map((job) => job.id)).toEqual(['arrivals'])
  })

  test('viewing bookings alone opens no field screen', () => {
    expect(fieldJobsFor(set('booking.view'))).toEqual([])
  })

  test('housekeeping works the departures', () => {
    expect(fieldJobsFor(HOUSEKEEPING).map((job) => job.id)).toEqual(['departures'])
  })

  test('the desk can check guests out but is handed no cleaning list', () => {
    // Departures answers to inspection.record, which the desk does not hold.
    expect(fieldJobsFor(FRONT_OFFICE).map((job) => job.id)).toEqual(['arrivals'])
  })

  test('somebody holding both jobs gets both, gate first', () => {
    const both = set('booking.view', 'booking.check_in', 'booking.check_out', 'inspection.record')

    expect(fieldJobsFor(both).map((job) => job.id)).toEqual(['arrivals', 'departures'])
  })
})

describe('landingPathFor', () => {
  test('a guard signs in straight to the field screens', () => {
    expect(landingPathFor(SECURITY)).toBe('/field')
  })

  test('the desk lands on the portal even though it can check guests in', () => {
    expect(landingPathFor(FRONT_OFFICE)).toBe('/portal')
  })

  test('housekeeping signs in straight to the field screens', () => {
    expect(landingPathFor(HOUSEKEEPING)).toBe('/field')
  })

  test('a field permission alone is not enough without a screen to work', () => {
    expect(landingPathFor(set('booking.view', 'unit.manage'))).toBe('/portal')
  })

  test('one portal permission beside the gate keeps a person on the portal', () => {
    expect(landingPathFor(set('booking.view', 'booking.check_in', 'report.view'))).toBe('/portal')
  })

  test('somebody holding nothing lands on the portal, which says so', () => {
    expect(landingPathFor(set())).toBe('/portal')
  })
})
