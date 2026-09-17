'use client'

import {
  bookableExtras,
  extraFieldName,
  remainingOf,
  type PropertyExtra,
} from '@/lib/domain/extras'
import { formatCents } from '@/lib/domain/money'

import { NumberField } from './form-fields'

/**
 * The extras counters on the operations booking forms (capability F13).
 *
 * The portal's twin of the public one in
 * app/(public)/_components/booking/extras-fields.tsx — the same list, the same
 * prices, the same remainder, drawn with the portal's denser fields. Two
 * components rather than one because the two surfaces use different field
 * primitives by design (design.md: the operations register is the dense
 * subset), and one component taking a field component as a prop would be a
 * seam in the wrong place.
 *
 * What must not differ is the *list*, and that comes from
 * `bookableExtras(config.extras)` on both sides.
 *
 * ── An extra a booking already holds ──────────────────────────────────────
 *
 * `alsoShow` is the amend screen's case. A stay may hold something that has
 * since come off the form — retired, or simply switched off — and an amend
 * form that hid it would silently drop it from the booking on the next save.
 * It is shown, at the fee it was sold at, with the counter still usable so a
 * clerk can take it off deliberately.
 */

export type ExtraQuantities = Readonly<Record<string, number>>

export function ExtrasFields({
  extras,
  inUse,
  quantities,
  onChange,
  fieldErrors,
  alsoShow = [],
}: {
  extras: readonly PropertyExtra[]
  inUse: ExtraQuantities
  quantities: ExtraQuantities
  onChange: (extraId: string, quantity: number) => void
  fieldErrors?: Readonly<Record<string, string>>
  /** Ids the booking already holds, shown even when no longer on sale. */
  alsoShow?: readonly string[]
}) {
  const offered = bookableExtras(extras)
  const offeredIds = new Set(offered.map((extra) => extra.id))

  const held = extras
    .filter((extra) => alsoShow.includes(extra.id) && !offeredIds.has(extra.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <>
      {[...offered, ...held].map((extra) => {
        const remaining = remainingOf(extra, inUse[extra.id] ?? 0)
        const offSale = !offeredIds.has(extra.id)

        return (
          <NumberField
            key={extra.id}
            id={extraFieldName(extra.id)}
            label={extra.name}
            value={quantities[extra.id] ?? 0}
            min={0}
            // The shelf, not the remainder — a remainder read a moment ago
            // should not stop a clerk typing a number the database would take.
            max={extra.stock ?? undefined}
            hint={hintFor(extra, remaining, offSale)}
            onChange={(value) => onChange(extra.id, value)}
            error={fieldErrors?.[extraFieldName(extra.id)]}
          />
        )
      })}
    </>
  )
}

function hintFor(extra: PropertyExtra, remaining: number | null, offSale: boolean): string {
  const parts = [`BND ${formatCents(extra.fee)}`]

  if (offSale) {
    parts.push('no longer offered')
  }

  if (remaining !== null) {
    parts.push(remaining === 0 ? 'none free' : `${remaining} free`)
  }

  return parts.join(' · ')
}
