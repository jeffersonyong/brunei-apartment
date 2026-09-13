import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import type { GateBooking } from '@/lib/db/gate'
import { formatStayDate, formatStayRange } from '@/lib/domain/dates'
import { gateVerdictSentence, type GateVerdict } from '@/lib/domain/gate'
import { formatVehicles } from '@/lib/domain/vehicle'

import { GateActionButton, type GateMove } from './gate-action-button'

/**
 * One car at the barrier.
 *
 * Read top to bottom the way a guard reads it: whose booking and which door,
 * the plate to match against the car in front of them, what to do, and — only
 * when the card has a move its reader may make — the one full-width button at
 * the foot of the card (design.md §Field: the row's primary action, full
 * width, at the bottom). A card that sends a guest to the office has no button
 * at all, so there is nothing to press and then be refused by.
 *
 * Which move a card offers is the verdict's; whether it is offered is the
 * reader's permission (N54). The guard admits a paid pass and sees a stay as
 * Expected, with the office named as where it is checked in; the desk, on the
 * same screen, gets the Check in button as well.
 *
 * The badge is the answer at a glance and the sentence is the reason. No
 * figure appears anywhere: the guard does not take money (prd.md §12).
 */

/** The two gate moves the reader holds. */
export interface GateMoves {
  /** `booking.check_in`: a stay's card offers Check in. */
  mayCheckIn: boolean
  /** `day_pass.admit`: a pass's card offers Admit. */
  mayAdmit: boolean
}

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>

/**
 * The verdict in the status language — the one place this mapping lives, as
 * `BookingStatusBadge` keeps the booking's. `active` for a guest in residence
 * and a pass in use is design.md's checked-in pair.
 */
function verdictBadge(verdict: GateVerdict): { label: string; tone: BadgeTone } {
  switch (verdict.kind) {
    case 'check_in':
      return { label: 'Expected', tone: 'positive' }
    case 'admit':
      return { label: 'Paid', tone: 'positive' }
    case 'admitted':
      return { label: 'Admitted', tone: 'active' }
    case 'office':
      return { label: 'Send to office', tone: 'warning' }
    case 'in_residence':
      return { label: 'Checked in', tone: 'active' }
    case 'closed':
      return { label: 'Closed', tone: 'neutral' }
  }
}

/** The card's one move, when it has one and its reader may make it. */
function moveOf(verdict: GateVerdict, moves: GateMoves): GateMove | null {
  if (verdict.kind === 'check_in' && moves.mayCheckIn) {
    return 'check_in'
  }

  if (verdict.kind === 'admit' && moves.mayAdmit) {
    return 'admit'
  }

  return null
}

function placeOf(booking: GateBooking): string {
  if (booking.unitRef) {
    return booking.unitRef
  }

  if (booking.headcount === null) {
    return 'Day pass'
  }

  return `Day pass · ${booking.headcount} ${booking.headcount === 1 ? 'person' : 'people'}`
}

function datesOf(booking: GateBooking): string {
  if (!booking.arrival) {
    return '—'
  }

  return booking.departure
    ? formatStayRange(booking.arrival, booking.departure)
    : formatStayDate(booking.arrival)
}

export function GateCard({ booking, moves }: { booking: GateBooking; moves: GateMoves }) {
  const badge = verdictBadge(booking.verdict)
  const move = moveOf(booking.verdict, moves)
  const place = placeOf(booking)
  const plates = formatVehicles(booking.vehicles)

  return (
    <article className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="text-body-md-strong break-words text-foreground">{booking.guestName}</p>
          <p className="mt-xxs text-body-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{booking.reference}</span> · {place}
          </p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {/* A gray inset inside the card: the two facts a guard checks against
          the car, labelled in the micro voice (design.md §Cards). */}
      <dl className="mt-md grid grid-cols-2 gap-md rounded-md bg-muted p-md">
        <div className="min-w-0">
          <dt className="micro-label text-muted-foreground">Vehicle</dt>
          <dd className="mt-xxs font-mono text-body-md break-words text-foreground">
            {plates ?? (
              <span className="font-sans text-muted-foreground">
                {booking.noVehicle ? 'No car' : 'Not recorded'}
              </span>
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="micro-label text-muted-foreground">
            {booking.departure ? 'Staying' : 'Date'}
          </dt>
          <dd className="mt-xxs text-body-sm text-foreground tabular-nums">{datesOf(booking)}</dd>
        </div>
      </dl>

      <p className="mt-md text-body-sm text-foreground">
        {gateVerdictSentence(booking.verdict, booking.arrival, { mayCheckIn: moves.mayCheckIn })}
      </p>

      {move ? (
        <GateActionButton
          move={move}
          bookingId={booking.id}
          reference={booking.reference}
          guestName={booking.guestName}
          place={place}
          className="mt-md"
        />
      ) : null}
    </article>
  )
}
