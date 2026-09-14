import Link from 'next/link'
import { Camera, ClipboardCheck } from 'lucide-react'

import { MarkReadyButton } from '@/components/mark-ready-button'
import { UnitStatusBadge } from '@/components/portal/unit-status-badge'
import { Button } from '@/components/ui/button'
import type { Turnover } from '@/lib/db/housekeeping'
import { formatStayDate, type StayDate } from '@/lib/domain/dates'
import { INSPECTION_OUTCOME_LABELS } from '@/lib/domain/inspection'

import { GuestLeftButton } from './guest-left-button'
import { TurnoverNotes } from './turnover-notes'

/**
 * One unit on the cleaner's list.
 *
 * Read top to bottom the way a cleaner reads it: which door, whose stay, where
 * the turnover has got to, whether somebody arrives today, what the office has
 * said about it — and at the foot, the one full-width thing to do next
 * (design.md §Field). The status badge is the units board's own, so the phone
 * and the office use one word for one state.
 *
 * A step the person may not take shows a sentence saying who does, not a
 * button that would be refused (lib/domain/turnover.ts).
 */

/** The inspection page for a stay, typed as the route it is. */
type InspectHref = `/field/departures/${string}/inspect`

interface TurnoverCardProps {
  turnover: Turnover
  today: StayDate
  /** Whether this person holds the permission for the card's step. */
  mayTakeStep: boolean
}

export function TurnoverCard({ turnover, today, mayTakeStep }: TurnoverCardProps) {
  const inspectHref: InspectHref = `/field/departures/${encodeURIComponent(turnover.reference)}/inspect`

  return (
    <article className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="font-mono text-body-md-strong text-foreground tabular-nums">
            {turnover.unitRef}
          </p>
          <p className="mt-xxs text-body-sm break-words text-muted-foreground">
            {turnover.guestName} ·{' '}
            {/* A reference is read as one token — "PV-" on one line and
                "7505" on the next is two things to match against a door. */}
            <span className="font-mono whitespace-nowrap tabular-nums">{turnover.reference}</span>
          </p>
        </div>
        <UnitStatusBadge status={turnover.unitStatus} />
      </div>

      <p className="mt-sm text-body-sm text-foreground">{whereItHasGot(turnover, today)}</p>

      {turnover.nextGuestArrivesToday ? (
        <p className="mt-xxs text-body-sm-strong text-foreground">Next guest arrives today</p>
      ) : null}

      <TurnoverNotes
        className="mt-md"
        unitNote={turnover.unitNote}
        housekeepingNotes={turnover.housekeepingNotes}
      />

      {mayTakeStep ? (
        <StepAction turnover={turnover} inspectHref={inspectHref} />
      ) : (
        <p className="mt-md text-body-sm text-muted-foreground">{whoTakesTheStep(turnover)}</p>
      )}
    </article>
  )
}

function StepAction({ turnover, inspectHref }: { turnover: Turnover; inspectHref: InspectHref }) {
  switch (turnover.step) {
    case 'guest_leaving':
      return (
        <GuestLeftButton
          className="mt-md"
          bookingId={turnover.bookingId}
          reference={turnover.reference}
          guestName={turnover.guestName}
          unitRef={turnover.unitRef}
        />
      )
    case 'inspect':
      return (
        <Button asChild size="touch" className="mt-md w-full">
          <Link href={inspectHref}>
            <ClipboardCheck aria-hidden />
            Inspect {turnover.unitRef}
          </Link>
        </Button>
      )
    case 'mark_ready':
      return (
        <>
          <MarkReadyButton
            size="touch"
            className="mt-md"
            bookingId={turnover.bookingId}
            unitRef={turnover.unitRef}
            reference={turnover.reference}
          />
          {/* Photographs can still be added once the inspection is written
              (prd.md §11) — a secondary way in, not the card's action. */}
          <Button asChild variant="tertiary" size="touch" className="mt-sm w-full">
            <Link href={inspectHref}>
              <Camera aria-hidden />
              Add photos
            </Link>
          </Button>
        </>
      )
  }
}

/** The one line under the header: what has happened so far. */
function whereItHasGot(turnover: Turnover, today: StayDate): string {
  switch (turnover.step) {
    case 'guest_leaving':
      return turnover.departure < today
        ? `Was due out ${formatStayDate(turnover.departure)} and is still checked in.`
        : 'Due out today and still checked in.'
    case 'inspect':
      return 'Checked out. Not inspected yet.'
    case 'mark_ready':
      return turnover.inspectionOutcome
        ? `Inspected: ${INSPECTION_OUTCOME_LABELS[turnover.inspectionOutcome].toLowerCase()}. Mark it ready once it is clean.`
        : 'Inspected. Mark it ready once it is clean.'
  }
}

function whoTakesTheStep(turnover: Turnover): string {
  switch (turnover.step) {
    case 'guest_leaving':
      return 'The gate or the office checks this guest out.'
    case 'inspect':
      return 'Somebody who records inspections looks at this unit next.'
    case 'mark_ready':
      return 'Somebody who manages units marks it ready.'
  }
}
