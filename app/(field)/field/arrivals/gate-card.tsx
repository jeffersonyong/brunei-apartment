import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import type { GateBooking } from '@/lib/db/gate'
import { formatStayDate, formatStayRange } from '@/lib/domain/dates'
import { gateVerdictSentence, type GateVerdict } from '@/lib/domain/gate'
import { formatVehicles } from '@/lib/domain/vehicle'

import { CheckInButton } from './check-in-button'

/**
 * One car at the barrier.
 *
 * Read top to bottom the way a guard reads it: whose booking and which door,
 * the plate to match against the car in front of them, what to do, and — only
 * when the answer is to let them in — the one full-width button at the foot of
 * the card (design.md §Field: the row's primary action, full width, at the
 * bottom). A card that sends a guest to the office has no button at all, so
 * there is nothing to press and then be refused by.
 *
 * The badge is the answer at a glance and the sentence is the reason. No
 * figure appears anywhere: the guard does not take money (prd.md §12).
 */

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>

/**
 * The verdict in the status language — the one place this mapping lives, as
 * `BookingStatusBadge` keeps the booking's. `active` for a guest in residence
 * is design.md's checked-in pair.
 */
function verdictBadge(verdict: GateVerdict): { label: string; tone: BadgeTone } {
  switch (verdict.kind) {
    case 'check_in':
      return { label: 'Expected', tone: 'positive' }
    case 'office':
      return { label: 'Send to office', tone: 'warning' }
    case 'day_pass':
      return verdict.paid
        ? { label: 'Paid', tone: 'positive' }
        : { label: 'Send to office', tone: 'warning' }
    case 'in_residence':
      return { label: 'Checked in', tone: 'active' }
    case 'closed':
      return { label: 'Closed', tone: 'neutral' }
  }
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

export function GateCard({ booking }: { booking: GateBooking }) {
  const badge = verdictBadge(booking.verdict)
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
        {gateVerdictSentence(booking.verdict, booking.arrival)}
      </p>

      {booking.verdict.kind === 'check_in' ? (
        <CheckInButton
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
