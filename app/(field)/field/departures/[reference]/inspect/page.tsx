import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { listTurnovers } from '@/lib/db/housekeeping'
import { getInspectionForBooking } from '@/lib/db/inspections'
import { todayInBrunei } from '@/lib/domain/dates'

import { TurnoverNotes } from '../../turnover-notes'

import { InspectionForm } from './inspection-form'

export const metadata: Metadata = {
  title: 'Inspection',
}

/** Read live and anchored to today, so it cannot be prerendered. */
export const dynamic = 'force-dynamic'

/**
 * Recording how a unit was found, with its photographs (capability C2).
 *
 * A page of its own rather than a dialog over the list: it is the longest thing
 * a cleaner does on the phone, the keyboard and the camera both take over the
 * screen while doing it, and a dialog that the camera app backgrounded is a
 * dialog a phone may have thrown away.
 *
 * Opened by reference, like every other stay screen, and decided again from
 * the turnover list: a stay the list no longer asks to inspect gets a sentence
 * saying why, not a form the database would refuse. A stay already inspected
 * opens in photographs-only mode, because prd.md §11 lets photographs be added
 * to an inspection at any time.
 */

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function InspectPage({ params }: PageProps) {
  const { reference: encoded } = await params
  const reference = decodeURIComponent(encoded)
  const actor = await getActor()

  if (!actor || !hasPermission(actor.permissions, 'inspection.record')) {
    return (
      <>
        <BackToDepartures />
        <h1 className="text-display-sm text-foreground">Inspection</h1>
        <p className="mt-sm text-body-md text-muted-foreground">
          Recording an inspection needs the &ldquo;Record inspections&rdquo; permission. Ask an
          administrator if that is part of your job.
        </p>
      </>
    )
  }

  const turnovers = await listTurnovers(todayInBrunei())
  const turnover = turnovers.find((candidate) => candidate.reference === reference) ?? null

  if (turnover === null || turnover.step === 'guest_leaving') {
    return (
      <>
        <BackToDepartures />
        <h1 className="text-display-sm text-foreground">Inspection</h1>
        <p className="mt-sm text-body-md text-foreground">
          {turnover === null
            ? 'This stay is not waiting for an inspection. It may already be marked ready.'
            : `${turnover.guestName} has not been checked out yet. Mark them as left from the list first.`}
        </p>
      </>
    )
  }

  const existing =
    turnover.step === 'mark_ready' ? await getInspectionForBooking(turnover.bookingId) : null

  return (
    <>
      <BackToDepartures />

      <h1 className="text-display-sm text-foreground">
        {existing ? `Photos of ${turnover.unitRef}` : `Inspect ${turnover.unitRef}`}
      </h1>
      <p className="mt-xxs text-body-sm break-words text-muted-foreground">
        {turnover.guestName} ·{' '}
        <span className="font-mono whitespace-nowrap tabular-nums">{turnover.reference}</span>
      </p>

      <TurnoverNotes
        className="mt-md"
        unitNote={turnover.unitNote}
        housekeepingNotes={turnover.housekeepingNotes}
      />

      <InspectionForm
        bookingId={turnover.bookingId}
        reference={turnover.reference}
        unitRef={turnover.unitRef}
        existing={
          existing ? { id: existing.id, outcome: existing.outcome, notes: existing.notes } : null
        }
      />
    </>
  )
}

/** Above the title: a way back that is not the browser's, like the portal's detail screens. */
function BackToDepartures() {
  return (
    <div className="mb-sm -ml-xl">
      <Button asChild variant="ghost" size="touch">
        <Link href="/field/departures">
          <ArrowLeft aria-hidden />
          Departures
        </Link>
      </Button>
    </div>
  )
}
