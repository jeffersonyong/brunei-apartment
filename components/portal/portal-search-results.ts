import type { Permission } from '@/lib/auth/permissions'
import type { DateRange } from '@/lib/domain/availability'
import { BOOKING_STATUS_LABELS, type BookingStatus } from '@/lib/domain/booking-state'
import { formatStayDates } from '@/lib/domain/dates'
import { DEPOSIT_STAGE_LABELS, type DepositStage } from '@/lib/domain/deposit'
import { formatCents, type Cents } from '@/lib/domain/money'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/lib/domain/payment'
import { UNIT_STATUS_LABELS, type UnitStatus } from '@/lib/domain/unit-status'

import { navGroups } from './portal-routes'

/**
 * The portal search (capability F12): what a term finds, for whom, and how
 * each result reads.
 *
 * Pure, so the route that runs the queries (app/(portal)/search/route.ts)
 * only fetches, and everything a reader sees is decided and tested here.
 *
 * It finds the things a member of staff identifies by name or number: a
 * screen by its name, a booking, a payment waiting to be checked, a deposit
 * and a unit. Each group appears only for somebody who could open what it
 * links to.
 */

/** One row of results. `reference` is set in mono where the record has one. */
export interface SearchHit {
  id: string
  reference?: string
  title: string
  detail: string
  href: string
}

export type SearchGroupId = 'screens' | 'bookings' | 'payments' | 'deposits' | 'units'

export interface SearchGroup {
  id: SearchGroupId
  label: string
  hits: readonly SearchHit[]
}

/**
 * Records are searched from two characters: one letter matches most of the
 * building, and a list of everything is not an answer. Screens match from
 * one, because there are few of them.
 */
export const MIN_RECORD_SEARCH_LENGTH = 2

/** How many of each kind of record a search lists. The list screens hold the rest. */
export const MAX_HITS_PER_GROUP = 5

type ScreenHref = (typeof navGroups)[number]['items'][number]['href']

/**
 * Who may open each screen in the nav: one permission, any of several, or
 * anyone signed in. Mirrors each page's own render gate — the gate that
 * matters stays on the page; this only keeps a search from offering a screen
 * that would answer "you don't have access". The test holds it to the nav.
 */
export const SCREEN_PERMISSIONS: Readonly<Record<ScreenHref, readonly Permission[] | null>> = {
  '/dashboard': null,
  '/bookings': ['booking.view'],
  '/bookings/calendar': ['booking.view'],
  '/bookings/new': ['booking.create'],
  '/payments': ['payment.verify'],
  '/payments/cash': ['payment.record_cash'],
  '/units': ['unit.manage'],
  '/deposits': ['booking.view'],
  '/reports': ['report.view'],
  '/reports/cash-up': ['report.view'],
  '/settings/property': ['config.manage'],
  '/settings/units': ['config.manage'],
  '/settings/website': ['site_image.manage', 'faq.manage', 'privacy_policy.manage'],
  '/settings/roles': ['config.manage'],
  '/settings/audit': ['config.manage'],
  '/account': null,
}

export function canOpenScreen(href: ScreenHref, permissions: ReadonlySet<Permission>): boolean {
  const needs = SCREEN_PERMISSIONS[href]

  return needs === null || needs.some((permission) => permissions.has(permission))
}

/** The screens whose name or group contains the term, in nav order. */
export function matchScreens(term: string, permissions: ReadonlySet<Permission>): SearchHit[] {
  const needle = term.trim().toLowerCase()

  if (needle.length === 0) {
    return []
  }

  return navGroups.flatMap((group) =>
    group.items
      .filter(
        (item) =>
          (item.label.toLowerCase().includes(needle) ||
            group.label.toLowerCase().includes(needle)) &&
          canOpenScreen(item.href, permissions),
      )
      .map((item) => ({
        id: `screen-${item.href}`,
        title: item.label,
        detail: group.label,
        href: item.href,
      })),
  )
}

export function bookingHit(booking: {
  reference: string
  guestName: string
  status: BookingStatus
  stay: { unitRef: string; range: DateRange } | null
}): SearchHit {
  const where = booking.stay
    ? `${booking.stay.unitRef} · ${formatStayDates(booking.stay.range.start, booking.stay.range.end)}`
    : 'Day pass'

  return {
    id: `booking-${booking.reference}`,
    reference: booking.reference,
    title: booking.guestName,
    detail: `${BOOKING_STATUS_LABELS[booking.status]} · ${where}`,
    href: `/bookings/${booking.reference}`,
  }
}

/** A payment waiting to be checked. It opens the queue, filtered to it. */
export function paymentHit(payment: {
  id: string
  bookingReference: string
  guestName: string
  method: PaymentMethod
  due: Cents
}): SearchHit {
  return {
    id: `payment-${payment.id}`,
    reference: payment.bookingReference,
    title: payment.guestName,
    detail: `${PAYMENT_METHOD_LABELS[payment.method]} to verify · BND ${formatCents(payment.due)}`,
    href: `/payments?q=${encodeURIComponent(payment.bookingReference)}`,
  }
}

export function depositHit(deposit: {
  id: string
  bookingReference: string
  guestName: string
  stage: DepositStage
  amount: Cents
  stay: { unitRef: string } | null
}): SearchHit {
  const parts = [DEPOSIT_STAGE_LABELS[deposit.stage], `BND ${formatCents(deposit.amount)}`]

  return {
    id: `deposit-${deposit.id}`,
    reference: deposit.bookingReference,
    title: deposit.guestName,
    detail: (deposit.stay ? [...parts, deposit.stay.unitRef] : parts).join(' · '),
    href: `/deposits/${deposit.bookingReference}`,
  }
}

export function unitHit(unit: {
  ref: string
  unitTypeName: string
  status: UnitStatus
}): SearchHit {
  return {
    id: `unit-${unit.ref}`,
    reference: unit.ref,
    title: unit.unitTypeName,
    detail: UNIT_STATUS_LABELS[unit.status],
    href: `/units/${encodeURIComponent(unit.ref)}`,
  }
}
