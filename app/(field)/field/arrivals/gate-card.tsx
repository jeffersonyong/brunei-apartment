import type { ComponentProps } from 'react'

import { Badge } from '@/components/ui/badge'
import type { GateBooking } from '@/lib/db/gate'
import { formatStayDate, formatStayRange } from '@/lib/domain/dates'
import {
  GATE_CASH_LABELS,
  gateVerdictSentence,
  type GateContext,
  type GateVerdict,
} from '@/lib/domain/gate'
import { formatCents } from '@/lib/domain/money'
import { describeParty } from '@/lib/domain/extra-guests'
import { formatVehicles } from '@/lib/domain/vehicle'
import { cn } from '@/lib/utils'

import { GateActionButton, type GateMove } from './gate-action-button'
import { GateCashButton } from './gate-cash-button'
import { GateExtraGuestsButton } from './gate-extra-guests-button'

/**
 * One booking at the barrier.
 *
 * Read top to bottom the way a guard reads it: whose booking and which door,
 * the plate to match against the car in front of them, what is owed, what to
 * do, and — only when the card has something its reader may do — full-width
 * buttons at the foot of the card (design.md §Field: the row's primary action,
 * full width, at the bottom). A card that needs the office has no button at
 * all, so there is nothing to press and then be refused by.
 *
 * Which move a card offers is the verdict's; whether it is offered is the
 * reader's permission. The guard is the front desk (N54): he takes what a
 * guest still owes, checks a stay in, checks a leaving guest out when the keys
 * come back, and admits a paid pass. The money comes first on the card because
 * it comes first at the barrier — the deposit before check-in, the stay before
 * check-out.
 *
 * **A figure appears only for a reader who takes cash.** `booking.cash` is null
 * for anyone else (lib/db/gate.ts), so a phone signed in without the permission
 * carries no prices at all.
 *
 * **A card whose money is not settled is red** (Jason's team, 19 September
 * 2026) — a deposit not in, the stay or pass still owed, or a transfer nobody
 * has checked — so the guard is careful with it before anything else is read.
 * The tint is the negative status pair, the one meaning design.md gives it,
 * and a line in the micro voice says it in words, because colour alone tells a
 * colour-blind guard nothing. The inset turns white on it: an object is the
 * tone a step away from what it sits on.
 *
 * **The party is on the card** so the guard can count the car against it, with
 * a small Extra button beside it for the car that holds more people than the
 * booking is for (gate-extra-guests-button.tsx).
 */

/** The gate moves the reader holds. */
export interface GateMoves {
  /** `booking.check_in`: a stay's card offers Check in. */
  mayCheckIn: boolean
  /** `booking.check_out`: a leaving guest's card offers Check out. */
  mayCheckOut: boolean
  /** `day_pass.admit`: a pass's card offers Admit. */
  mayAdmit: boolean
  /** `payment.record_cash`: a card with money owed offers to take it. */
  mayTakeCash: boolean
}

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>

/**
 * The verdict in the status language — the one place this mapping lives, as
 * `BookingStatusBadge` keeps the booking's. `active` for a guest in residence
 * and a pass in use is design.md's checked-in pair.
 */
function verdictBadge(
  verdict: GateVerdict,
  takesCash: boolean,
): { label: string; tone: BadgeTone } {
  switch (verdict.kind) {
    case 'check_in':
      return { label: 'Expected', tone: 'positive' }
    case 'leaving':
      return verdict.overdue
        ? { label: 'Overdue', tone: 'warning' }
        : { label: 'Due out', tone: 'active' }
    case 'admit':
      return { label: 'Paid', tone: 'positive' }
    case 'admitted':
      return { label: 'Admitted', tone: 'active' }
    case 'office':
      // Money the guard can take himself is not a call to the office.
      return takesCash
        ? { label: 'To pay', tone: 'warning' }
        : { label: 'Call office', tone: 'warning' }
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

  if (verdict.kind === 'leaving' && moves.mayCheckOut) {
    return 'check_out'
  }

  if (verdict.kind === 'admit' && moves.mayAdmit) {
    return 'admit'
  }

  return null
}

/**
 * What the dialog says before the guard confirms. Checking out a guest who
 * still owes for the stay is the one move that closes a door on money: a
 * checked-out booking takes no payment, at the gate or at the office.
 */
function noteOf(verdict: GateVerdict, takesCash: boolean): string | undefined {
  if (verdict.kind !== 'leaving' || verdict.stay !== 'owed') {
    return undefined
  }

  return takesCash
    ? 'The stay is not paid. Take the payment first — once they are checked out, it cannot be recorded against this booking.'
    : 'The stay is not paid. Once they are checked out, no payment can be recorded against this booking.'
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

/** Everybody the booking is for, and how that is made up. */
function partyOf(booking: GateBooking, exemptAgeMax: number): { people: number; detail: string } {
  if (booking.party.kind === 'pass') {
    return {
      people: booking.headcount ?? 0,
      detail: describeParty(booking.party.bands),
    }
  }

  const { counted, exempt } = booking.party

  return {
    people: counted + exempt,
    detail: exempt > 0 ? `${exempt} aged ${exemptAgeMax} or under` : '',
  }
}

function datesOf(booking: GateBooking): string {
  if (!booking.arrival) {
    return '—'
  }

  return booking.departure
    ? formatStayRange(booking.arrival, booking.departure)
    : formatStayDate(booking.arrival)
}

export function GateCard({
  booking,
  moves,
  context,
}: {
  booking: GateBooking
  moves: GateMoves
  context: GateContext
}) {
  const cash = moves.mayTakeCash ? booking.cash : null
  const badge = verdictBadge(booking.verdict, cash !== null)
  const move = moveOf(booking.verdict, moves)
  const place = placeOf(booking)
  const plates = formatVehicles(booking.vehicles)
  const party = partyOf(booking, context.exemptAgeMax)
  const isRed = booking.moneyUnsettled
  // Whoever lets this kind of booking in is whoever counts the people in it.
  const mayReport =
    booking.verdict.kind !== 'closed' &&
    (booking.stream === 'day_pass' ? moves.mayAdmit : moves.mayCheckIn)

  return (
    <article
      className={cn(
        'rounded-lg border p-card',
        isRed ? 'border-destructive bg-badge-negative' : 'border-border bg-card',
      )}
    >
      {isRed ? <p className="mb-sm micro-label text-negative-text">Payment not settled</p> : null}

      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="text-body-md-strong break-words text-foreground">{booking.guestName}</p>
          <p className="mt-xxs text-body-sm text-muted-foreground">
            {/* The unit, or just "Day pass": how many it is for is the Guests
                line below, where the guard counts against it. */}
            <span className="font-mono tabular-nums">{booking.reference}</span> ·{' '}
            {booking.unitRef ?? 'Day pass'}
          </p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {/* A gray inset inside the card: the facts a guard checks against the
          car, and what he is about to take, labelled in the micro voice
          (design.md §Cards). */}
      <dl
        className={cn(
          'mt-md grid grid-cols-2 gap-md rounded-md p-md',
          isRed ? 'bg-card' : 'bg-muted',
        )}
      >
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
        <div className="col-span-2 flex min-w-0 items-center justify-between gap-md">
          <div className="min-w-0">
            <dt className="micro-label text-muted-foreground">Guests</dt>
            <dd className="mt-xxs text-body-md text-foreground tabular-nums">
              {party.people}
              {party.detail ? (
                <span className="text-body-sm text-muted-foreground"> · {party.detail}</span>
              ) : null}
            </dd>
          </div>
          {mayReport ? (
            <GateExtraGuestsButton
              booking={booking}
              place={place}
              bookedFor={party.people}
              passPricing={moves.mayTakeCash ? context.passPricing : null}
            />
          ) : null}
        </div>
        {cash ? (
          <div className="col-span-2 min-w-0">
            <dt className="micro-label text-muted-foreground">To take</dt>
            <dd className="mt-xxs text-body-md-strong text-foreground tabular-nums">
              BND {formatCents(cash.amount)}{' '}
              <span className="text-body-sm font-normal text-muted-foreground">
                · {GATE_CASH_LABELS[cash.kind]}
              </span>
            </dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-md text-body-sm text-foreground">
        {gateVerdictSentence(booking.verdict, booking, {
          mayCheckIn: moves.mayCheckIn,
          mayCheckOut: moves.mayCheckOut,
          takesCash: cash !== null,
        })}
      </p>

      {booking.extraReported > 0 ? (
        <p className="mt-xxs text-body-sm text-muted-foreground">
          {booking.extraReported} more {booking.extraReported === 1 ? 'person' : 'people'} than
          booked — the office has been told.
        </p>
      ) : null}

      {/* Information, never a gate (N53): the guard hands over the keys with no
          units board beside him, so he is told. */}
      {booking.unitNotReady && booking.unitRef ? (
        <p className="mt-xxs text-body-sm text-muted-foreground">
          {booking.unitRef} is not marked ready yet.
        </p>
      ) : null}

      {cash ? (
        <GateCashButton
          bookingId={booking.id}
          reference={booking.reference}
          guestName={booking.guestName}
          place={place}
          due={cash}
          isPrimary={move === null}
          className="mt-md"
        />
      ) : null}

      {move ? (
        <GateActionButton
          move={move}
          bookingId={booking.id}
          reference={booking.reference}
          guestName={booking.guestName}
          place={place}
          note={noteOf(booking.verdict, cash !== null)}
          className={cash ? 'mt-sm' : 'mt-md'}
        />
      ) : null}
    </article>
  )
}
