import { NextResponse } from 'next/server'

import { matchesSearch, readSearch } from '@/components/portal/list-params'
import {
  MAX_HITS_PER_GROUP,
  MIN_RECORD_SEARCH_LENGTH,
  bookingHit,
  depositHit,
  matchScreens,
  paymentHit,
  unitHit,
  type SearchGroup,
  type SearchHit,
} from '@/components/portal/portal-search-results'
import type { Permission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { listBookings } from '@/lib/db/bookings'
import { searchDeposits } from '@/lib/db/deposits'
import { listPaymentPage } from '@/lib/db/payments'
import { listUnitStates } from '@/lib/db/units'

/**
 * The header search's results (capability F12): screens, bookings, payments
 * waiting to be checked, deposits and units matching a term.
 *
 * A route handler for the reason the bell's feed is one: the box asks as the
 * reader types, and a server action would queue each keystroke's read behind
 * the last. It is a portal path (lib/auth/surfaces.ts), so proxy.ts has
 * already refused a caller with no session. Each group is read only for
 * somebody holding the permission its screen answers to, and the term goes
 * through `readSearch`, the list screens' own sanitiser, before any query.
 *
 * The record searches are the list screens' own: the same fields, the same
 * case-insensitive "contains". A result opens the record, and the list screen
 * holds anything past the first few.
 */

export const dynamic = 'force-dynamic'

interface GroupSpec {
  id: SearchGroup['id']
  label: string
  permission: Permission
  read: (term: string) => Promise<readonly SearchHit[]>
}

const RECORD_GROUPS: readonly GroupSpec[] = [
  {
    id: 'bookings',
    label: 'Bookings',
    permission: 'booking.view',
    read: async (term) => {
      const { bookings } = await listBookings(
        { search: term },
        { page: 1, pageSize: MAX_HITS_PER_GROUP },
      )

      return bookings.map(bookingHit)
    },
  },
  {
    id: 'payments',
    label: 'Payments to verify',
    permission: 'payment.verify',
    read: async (term) => {
      const { payments } = await listPaymentPage(
        { search: term, statuses: ['pending_verification'] },
        { page: 1, pageSize: MAX_HITS_PER_GROUP },
      )

      return payments.map(paymentHit)
    },
  },
  {
    id: 'deposits',
    label: 'Deposits',
    permission: 'booking.view',
    read: async (term) => (await searchDeposits(term, MAX_HITS_PER_GROUP)).map(depositHit),
  },
  {
    id: 'units',
    label: 'Units',
    permission: 'unit.manage',
    // The whole building is a few dozen rows, and the board derives each
    // unit's state in code, so the match is made on what the board shows.
    read: async (term) =>
      (await listUnitStates())
        .filter((unit) => matchesSearch(term, [unit.ref, unit.unitTypeName]))
        .slice(0, MAX_HITS_PER_GROUP)
        .map(unitHit),
  },
]

export async function GET(request: Request): Promise<NextResponse> {
  const actor = await getActor()

  if (!actor) {
    return NextResponse.json({ error: 'Signed out' }, { status: 401 })
  }

  const term = readSearch(new URL(request.url).searchParams.get('q') ?? undefined)

  if (term === null) {
    return NextResponse.json({ term: '', groups: [] })
  }

  const screens: SearchGroup = {
    id: 'screens',
    label: 'Screens',
    hits: matchScreens(term, actor.permissions),
  }
  const readable =
    term.length >= MIN_RECORD_SEARCH_LENGTH
      ? RECORD_GROUPS.filter((group) => actor.permissions.has(group.permission))
      : []

  try {
    const records = await Promise.all(
      readable.map(async (group): Promise<SearchGroup> => ({
        id: group.id,
        label: group.label,
        hits: await group.read(term),
      })),
    )
    const groups = [screens, ...records].filter((group) => group.hits.length > 0)

    return NextResponse.json({ term, groups }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('The portal search could not be run', error)

    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}
