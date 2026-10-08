import type { Metadata } from 'next'

import { RefreshLine } from '@/components/field/refresh-line'
import { hasPermission } from '@/lib/auth/permissions'
import { getActor } from '@/lib/auth/require-permission'
import { listDeparturesBoard, type ArrivalAhead } from '@/lib/db/housekeeping'
import { arrivalDayLabel, arrivalWindowOf } from '@/lib/domain/arrivals-ahead'
import { formatClockTime, formatStayDate, todayInBrunei, type StayDate } from '@/lib/domain/dates'
import { TURNOVER_STEP_PERMISSION, type TurnoverStep } from '@/lib/domain/turnover'

import { ArrivalCard } from '../arrival-card'
import { TurnoverCard } from '../turnover-card'

export const metadata: Metadata = {
  title: 'Departures',
}

/** Read live and anchored to today, so it cannot be prerendered. */
export const dynamic = 'force-dynamic'

/**
 * Housekeeping's screen (capabilities C1, C2, C3): every unit with a turnover
 * under way today, and the next thing to do with each.
 *
 * Three sections, because the cleaner's three questions differ: a room a guest
 * is still in, a room to look at, and a room being cleaned. Within each, a unit
 * somebody arrives in today comes first (lib/domain/turnover.ts).
 *
 * The list is the units board's own facts (lib/db/housekeeping.ts), so a unit
 * leaves this screen exactly when the board stops calling it occupied by a
 * departing guest, awaiting inspection, or cleaning. Built for a weak signal
 * the way the gate is: one server-rendered page, and every write says plainly
 * when it could not reach the server. No offline cache — the list carries
 * guests' names on a phone that is left in rooms.
 *
 * Gated on `inspection.record`, the permission of the one step only
 * housekeeping takes (lib/auth/field-jobs.ts). Each card checks its own step.
 *
 * Under the work, the guests on their way (capability C4, Jason's team,
 * 8 October 2026): stays arriving from today to three days ahead, grouped by
 * day, so a unit can be got ready before its guest rather than after the gate
 * rings. A heads-up with no buttons — lib/domain/arrivals-ahead.ts.
 */

const SECTIONS: readonly { step: TurnoverStep; id: string; title: string }[] = [
  { step: 'guest_leaving', id: 'departures-leaving', title: 'Leaving today' },
  { step: 'inspect', id: 'departures-inspect', title: 'To inspect' },
  { step: 'mark_ready', id: 'departures-cleaning', title: 'Being cleaned' },
]

export default async function DeparturesPage() {
  const actor = await getActor()

  if (!actor || !hasPermission(actor.permissions, 'inspection.record')) {
    return (
      <>
        <h1 className="text-display-sm text-foreground">Departures</h1>
        <p className="mt-sm text-body-md text-muted-foreground">
          This screen is for inspecting units after guests leave, which needs the &ldquo;Record
          inspections&rdquo; permission. Ask an administrator if that is part of your job.
        </p>
      </>
    )
  }

  const today = todayInBrunei()
  const { turnovers, arrivals } = await listDeparturesBoard(today)
  const mayTake = (step: TurnoverStep) =>
    hasPermission(actor.permissions, TURNOVER_STEP_PERMISSION[step])

  return (
    <>
      <h1 className="text-display-sm text-foreground">Departures</h1>
      <p className="mt-xxs text-body-sm text-muted-foreground">{formatStayDate(today)}</p>

      <div className="mt-lg">
        <RefreshLine loadedAt={formatClockTime(new Date())} />
      </div>

      {turnovers.length === 0 ? (
        <p className="mt-lg text-body-md text-foreground">
          {arrivals.length === 0
            ? `Nothing to turn over, and nobody arriving by ${formatStayDate(arrivalWindowOf(today).to)}.`
            : 'Nothing to turn over right now. A unit appears here when its guest is due out.'}
        </p>
      ) : null}

      {SECTIONS.map((section) => {
        const rows = turnovers.filter((turnover) => turnover.step === section.step)

        if (rows.length === 0) {
          return null
        }

        return (
          <section key={section.step} aria-labelledby={section.id} className="mt-2xl">
            {/* A heading above the cards it names, on the ground — `display-xs`,
                as the gate's sections are. */}
            <h2 id={section.id} className="text-display-xs text-foreground">
              {section.title}{' '}
              <span className="text-muted-foreground tabular-nums">{rows.length}</span>
            </h2>

            <ul className="mt-md grid gap-md">
              {rows.map((turnover) => (
                <li key={turnover.bookingId}>
                  <TurnoverCard
                    turnover={turnover}
                    today={today}
                    mayTakeStep={mayTake(turnover.step)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {arrivals.length > 0 ? <ArrivingSection arrivals={arrivals} today={today} /> : null}
    </>
  )
}

/**
 * The guests on their way, under one heading and grouped by the day they
 * arrive — the cleaner's question is "what is coming tomorrow", and a date on
 * every card would make them read each one to find out.
 */
function ArrivingSection({
  arrivals,
  today,
}: {
  arrivals: readonly ArrivalAhead[]
  today: StayDate
}) {
  const days = [...new Set(arrivals.map((arrival) => arrival.arrival))]

  return (
    <section aria-labelledby="departures-arriving" className="mt-2xl">
      <h2 id="departures-arriving" className="text-display-xs text-foreground">
        Arriving <span className="text-muted-foreground tabular-nums">{arrivals.length}</span>
      </h2>

      {days.map((day) => (
        <div key={day} className="mt-lg">
          <h3 className="micro-label text-muted-foreground">{arrivalDayLabel(day, today)}</h3>
          <ul className="mt-sm grid gap-md">
            {arrivals
              .filter((arrival) => arrival.arrival === day)
              .map((arrival) => (
                <li key={arrival.reference}>
                  <ArrivalCard arrival={arrival} today={today} />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
