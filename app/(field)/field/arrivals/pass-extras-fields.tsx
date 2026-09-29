'use client'

import { useState } from 'react'

import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GateBooking } from '@/lib/db/gate'
import type { PropertyConfig } from '@/lib/domain/config'
import { addToParty, countsOf, MAX_EXTRA_GUESTS } from '@/lib/domain/extra-guests'
import { extrasNamedMatch } from '@/lib/domain/gate-arrivals'
import { formatCents, type Cents } from '@/lib/domain/money'
import { repriceDayPassParty } from '@/lib/domain/pricing/party-change'

/**
 * The extra visitors on a pass, named by age band and priced as the pass was
 * sold — what the guard takes before admitting them (capability D8; the Admit
 * dialog, gate-count-dialog.tsx).
 *
 * The price on the phone is a courtesy. The server prices the same bands
 * again and records nothing unless its figure is the one the dialog showed
 * (`admitWithExtrasAtGateAction`), so a pass that moved since the list was
 * read is refused rather than charged at the old price.
 */

export interface PassExtras {
  added: Readonly<Record<string, number>>
  setBand: (bandId: string, value: number) => void
  /** The named bands add up to the extras counted. */
  matches: boolean
  /** What to take, once the bands match and the pass reprices. Null otherwise. */
  take: Cents | null
  /** What the pass becomes, when it reprices. */
  newTotal: Cents | null
  /** Why the pass will not reprice, when it will not. */
  problem: string | null
}

export function usePassExtras(
  booking: GateBooking,
  config: PropertyConfig,
  figures: { total: Cents; paid: Cents },
  extras: number,
): PassExtras {
  const [added, setAdded] = useState<Record<string, number>>({})
  const sold = booking.party.kind === 'pass' ? countsOf(booking.party.bands) : {}
  const matches = extras > 0 && extrasNamedMatch(added, extras)
  const repriced = matches ? repriceDayPassParty(addToParty(sold, added), config) : null

  return {
    added,
    setBand: (bandId, value) => setAdded((current) => ({ ...current, [bandId]: value })),
    matches,
    take: repriced?.ok ? repriced.total - figures.paid : null,
    newTotal: repriced?.ok ? repriced.total : null,
    problem: repriced && !repriced.ok ? repriced.message : null,
  }
}

export function PassExtrasFields({
  config,
  extras,
  state,
}: {
  config: PropertyConfig
  /** How many more than the pass is for were counted. */
  extras: number
  state: PassExtras
}) {
  const named = Object.values(state.added).reduce((sum, value) => sum + value, 0)

  return (
    <div className="grid gap-md">
      <fieldset className="grid gap-md">
        <legend className="micro-label text-muted-foreground">Who are the {extras} extra?</legend>
        <div className="flex flex-wrap gap-lg">
          {config.dayPassAgeBands.map((band) => (
            <div key={band.id} className="grid gap-sm">
              <Label htmlFor={`add-${band.id}`}>{band.label}</Label>
              <Input
                id={`add-${band.id}`}
                name={`band-${band.id}`}
                type="number"
                inputMode="numeric"
                inputSize="touch"
                min={0}
                max={MAX_EXTRA_GUESTS}
                className="w-[96px] tabular-nums"
                value={state.added[band.id] ?? 0}
                onChange={(event) =>
                  state.setBand(band.id, Math.max(0, Math.trunc(Number(event.target.value) || 0)))
                }
              />
            </div>
          ))}
        </div>
      </fieldset>

      {!state.matches && named > 0 ? (
        <p className="text-body-sm text-muted-foreground tabular-nums">
          {named} named of {extras}. The bands must add up to the extras counted.
        </p>
      ) : null}

      {state.problem ? <FieldError message={state.problem} /> : null}

      {state.take !== null && state.newTotal !== null ? (
        <p className="text-body-md-strong text-foreground tabular-nums">
          {state.take > 0 ? `Take BND ${formatCents(state.take)}` : 'Nothing more to pay'}
          <span className="text-body-sm font-normal text-muted-foreground">
            {' '}
            · the pass becomes BND {formatCents(state.newTotal)}
          </span>
        </p>
      ) : null}
    </div>
  )
}
