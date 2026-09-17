'use client'

import {
  bookableExtras,
  extraFieldName,
  remainingOf,
  type PropertyExtra,
} from '@/lib/domain/extras'
import { formatCents } from '@/lib/domain/money'

import { CountField } from './booking-fields'

/**
 * The extras counters, on all three booking forms (capability F13).
 *
 * One component rather than three copies, because the set is configured and
 * the three screens must offer the same list at the same prices — a public
 * booking and a walk-in for the same night that disagree about what a karaoke
 * set costs is exactly the spreadsheet problem this replaces.
 *
 * ── The remainder ─────────────────────────────────────────────────────────
 *
 * `inUse` is what `extras_in_use` reported for the nights the form is showing,
 * and it may be stale by the time the form is submitted — somebody else can
 * book in between. It is a courtesy, not the guarantee: the guarantee is the
 * database trigger, which refuses the insert. So the hint says what is free
 * and the submit says what happened, and the two never claim to be the same
 * thing.
 *
 * An extra nobody has counted (`stock` null, open-questions.md N8) shows no
 * remainder at all. "Unlimited" would be a lie about a physical object; saying
 * nothing is the honest version of "nobody has counted these".
 */

/** How many of each extra the form has selected, keyed by extra id. */
export type ExtraQuantities = Readonly<Record<string, number>>

export function ExtrasFields({
  extras,
  inUse,
  quantities,
  onChange,
  fieldErrors,
  /** No range picked yet, so no remainder can be computed. */
  datesChosen = true,
}: {
  extras: readonly PropertyExtra[]
  inUse: ExtraQuantities
  quantities: ExtraQuantities
  onChange: (extraId: string, quantity: number) => void
  fieldErrors?: Readonly<Record<string, string>>
  datesChosen?: boolean
}) {
  const offered = bookableExtras(extras)

  if (offered.length === 0) {
    return null
  }

  return (
    <>
      {offered.map((extra) => {
        const remaining = remainingOf(extra, inUse[extra.id] ?? 0)
        const price = `BND ${formatCents(extra.fee)} each`

        return (
          <CountField
            key={extra.id}
            id={extraFieldName(extra.id)}
            name={extraFieldName(extra.id)}
            label={extra.name}
            hint={hintFor(price, extra.description, remaining, datesChosen)}
            value={quantities[extra.id] ?? 0}
            // The shelf is the ceiling when there is one. Not the remainder:
            // a stale remainder that has since freed up would stop somebody
            // typing a number the database would have accepted.
            max={extra.stock ?? 20}
            onChange={(value) => onChange(extra.id, value)}
            error={fieldErrors?.[extraFieldName(extra.id)]}
          />
        )
      })}
    </>
  )
}

function hintFor(
  price: string,
  description: string | null,
  remaining: number | null,
  datesChosen: boolean,
): string {
  const parts = [price]

  if (description) {
    parts.push(description.replace(/\.$/, ''))
  }

  if (remaining !== null && datesChosen) {
    parts.push(
      remaining === 0 ? 'None free for those nights' : `${remaining} free for those nights`,
    )
  }

  return `${parts.join('. ')}.`
}
