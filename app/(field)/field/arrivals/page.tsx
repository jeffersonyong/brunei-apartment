import type { Metadata } from 'next'

import { mayWork } from '@/lib/auth/field-jobs'
import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { listGateBookings, searchGateBookings, type GateBooking } from '@/lib/db/gate'
import { formatClockTime, formatStayDate, todayInBrunei } from '@/lib/domain/dates'

import { ArrivalsList } from './arrivals-list'

export const metadata: Metadata = {
  title: 'Arrivals',
}

/** Read live and anchored to today, so it cannot be prerendered. */
export const dynamic = 'force-dynamic'

/**
 * The gate (capabilities D1, D2, D4): who to expect today, and what to do with
 * each car.
 *
 * ── Built for one bar of signal ───────────────────────────────────────────
 *
 * One server-rendered page carrying the whole day's list, filtered on the
 * phone as the guard types (register C3, answered by design 13 September
 * 2026). A plate typed at the barrier needs no request. What does need one is
 * a search beyond today — the car whose booking starts tomorrow — which is a
 * plain GET of this page with `?q=`, and admitting a pass or checking a guest
 * in, which says so plainly when it could not reach the server.
 *
 * No service worker and no HTTP cache: the list carries guests' names and
 * plates, and a shared guardhouse phone is exactly where yesterday's list
 * should not survive.
 *
 * Gated on either of the gate's two moves — admitting a day pass, or checking
 * a stay in (lib/auth/field-jobs.ts, N54) — and each card offers only the move
 * its reader holds. The guard admits passes; the desk checks stays in.
 */

interface PageProps {
  searchParams: Promise<{ q?: string | string[] }>
}

export default async function ArrivalsPage({ searchParams }: PageProps) {
  const actor = await getActor()

  if (!actor || !mayWork(actor.permissions, 'arrivals')) {
    return (
      <>
        <h1 className="text-display-sm text-foreground">Arrivals</h1>
        <p className="mt-sm text-body-md text-muted-foreground">
          This screen is for the gate, which needs the &ldquo;Admit day passes&rdquo; or &ldquo;Check
          guests in&rdquo; permission. Ask an administrator if that is part of your job.
        </p>
      </>
    )
  }

  const { q } = await searchParams
  const query = typeof q === 'string' ? q.trim() : ''
  const today = todayInBrunei()

  const [list, found] = await Promise.all([
    listGateBookings(today),
    query.length > 0 ? searchGateBookings(query, today) : Promise.resolve(null),
  ])

  return (
    <>
      <h1 className="text-display-sm text-foreground">Arrivals</h1>
      <p className="mt-xxs text-body-sm text-muted-foreground">{formatStayDate(today)}</p>

      <ArrivalsList
        list={list}
        query={query}
        found={found as readonly GateBooking[] | null}
        loadedAt={formatClockTime(new Date())}
        moves={{
          mayCheckIn: hasPermission(actor.permissions, 'booking.check_in'),
          mayAdmit: hasPermission(actor.permissions, 'day_pass.admit'),
        }}
      />
    </>
  )
}
