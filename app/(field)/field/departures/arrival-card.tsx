import { UnitStatusBadge } from '@/components/portal/unit-status-badge'
import type { ArrivalAhead } from '@/lib/db/housekeeping'
import { readinessSentence } from '@/lib/domain/arrivals-ahead'
import type { StayDate } from '@/lib/domain/dates'

/**
 * One guest on their way, on the cleaner's phone (capability C4).
 *
 * A heads-up and nothing more, so it has no button: the turnover cards above
 * carry the work, and a card here that looked like one of them would compete
 * with it. Read top to bottom the way a cleaner plans: which door, how long and
 * how many, what to set up, and whether the unit will be ready for them.
 *
 * The badge is the units board's word for the unit **today** — which, for a
 * guest arriving later, is often somebody else's stay — so it is labelled
 * "Now" on any day but today, and the sentence under it says what that means
 * for this guest.
 */

interface ArrivalCardProps {
  arrival: ArrivalAhead
  today: StayDate
}

export function ArrivalCard({ arrival, today }: ArrivalCardProps) {
  const arrivesToday = arrival.arrival === today
  const ready = arrival.readiness.kind === 'ready'

  return (
    <article className="rounded-lg border border-border bg-card p-card">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <p className="font-mono text-body-md-strong text-foreground tabular-nums">
            {arrival.unitRef}
          </p>
          <p className="mt-xxs text-body-sm text-muted-foreground">
            {/* One token, as on the turnover cards: "PV-" and "7505" on two
                lines read as two things. */}
            <span className="font-mono whitespace-nowrap tabular-nums">{arrival.reference}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-xs">
          {arrivesToday ? null : <span className="micro-label text-muted-foreground">Now</span>}
          <UnitStatusBadge status={arrival.unitStatus} />
        </div>
      </div>

      <p className="mt-sm text-body-sm text-foreground tabular-nums">
        {plural(arrival.nights, 'night')} · {plural(arrival.guests, 'guest')}
      </p>

      {arrival.needs.extras.length > 0 || arrival.needs.earlyCheckInHours > 0 ? (
        <p className="mt-xxs text-body-sm-strong text-foreground tabular-nums">
          {needsLine(arrival)}
        </p>
      ) : null}

      <p
        className={
          ready ? 'mt-sm text-body-sm text-muted-foreground' : 'mt-sm text-body-sm text-foreground'
        }
      >
        {readinessSentence(arrival.readiness, arrival.arrival, today)}
      </p>

      {arrival.confirmed ? null : (
        <p className="mt-xxs text-body-sm text-muted-foreground">
          Not confirmed yet — the office is still checking the payment.
        </p>
      )}
    </article>
  )
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/** "Sofa bed × 1 · Early check-in, 2 hours" — what to set up beyond the unit. */
function needsLine(arrival: ArrivalAhead): string {
  const parts = arrival.needs.extras.map((extra) => `${extra.name} × ${extra.quantity}`)
  const hours = arrival.needs.earlyCheckInHours

  if (hours > 0) {
    parts.push(`Early check-in, ${plural(hours, 'hour')}`)
  }

  return parts.join(' · ')
}
