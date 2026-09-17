'use client'

import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

import { SectionCard } from '@/components/portal/section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast-store'
import { formatCents } from '@/lib/domain/money'
import type { PropertyExtra } from '@/lib/domain/extras'

import { moveExtraAction, restoreExtraAction } from './actions'
import { ExtraEditorDialog } from './extra-editor-dialog'
import { RemoveExtraDialog } from './remove-extra-dialog'

/**
 * The optional items a booking can add (capability F13).
 *
 * ── Why this is a tab and not a section of the rates form ─────────────────
 *
 * Every other figure on Property settings is a field in one atomic save, under
 * one concurrency token. These are rows: added, reordered and removed one at a
 * time, each with its own audit event, and one of them — the count — is
 * checked against live bookings before it is allowed. A whole-form save has no
 * business refusing because of what somebody booked last week.
 *
 * So it follows the FAQs board instead: a list, quick moves inline, a dialog
 * for anything with more than one field.
 *
 * ── The two lists ─────────────────────────────────────────────────────────
 *
 * Removed extras are shown, under their own heading, because removal is not a
 * delete: a booking can still be holding one, and somebody who removed the
 * wrong thing needs it back. An extra that is merely off sale stays in the
 * first list wearing a badge — it is still something the property has.
 */
export function ExtrasTab({ extras }: { extras: readonly PropertyExtra[] }) {
  const [open, setOpen] = useState<
    { kind: 'new' } | { kind: 'edit' | 'remove'; extra: PropertyExtra } | null
  >(null)
  const close = () => setOpen(null)

  const live = extras
    .filter((extra) => extra.retiredAt === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const removed = extras.filter((extra) => extra.retiredAt !== null)

  return (
    <>
      <SectionCard
        id="extras"
        title="Extras"
        hint="What a guest can add to a stay. Each is charged once for the whole stay, however many nights it is."
        actions={
          <Button variant="secondary" onClick={() => setOpen({ kind: 'new' })}>
            Add extra
          </Button>
        }
      >
        {live.length > 0 ? (
          <ul className="divide-y divide-divider">
            {live.map((extra, index) => (
              <ExtraRow
                key={extra.id}
                extra={extra}
                isFirst={index === 0}
                isLast={index === live.length - 1}
                onEdit={() => setOpen({ kind: 'edit', extra })}
                onRemove={() => setOpen({ kind: 'remove', extra })}
              />
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            Nothing to add to a stay yet. The booking forms will show no extras section at all.
          </p>
        )}
      </SectionCard>

      {removed.length > 0 ? (
        <SectionCard
          id="extras-removed"
          title="Removed"
          hint="Off the booking forms. Bookings that already have one keep it."
          className="mt-xl"
        >
          <ul className="divide-y divide-divider">
            {removed.map((extra) => (
              <RemovedRow key={extra.id} extra={extra} />
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {open?.kind === 'new' ? <ExtraEditorDialog onClose={close} /> : null}
      {open?.kind === 'edit' ? <ExtraEditorDialog extra={open.extra} onClose={close} /> : null}
      {open?.kind === 'remove' ? <RemoveExtraDialog extra={open.extra} onClose={close} /> : null}
    </>
  )
}

/** The count, or the honest absence of one (open-questions.md N8). */
function stockLine(extra: PropertyExtra): string {
  return extra.stock === null
    ? 'Not counted — bookings are not limited'
    : `${extra.stock} available`
}

function ExtraRow({
  extra,
  isFirst,
  isLast,
  onEdit,
  onRemove,
}: {
  extra: PropertyExtra
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function move(direction: 'up' | 'down'): void {
    startTransition(async () => {
      const data = new FormData()

      data.set('extraId', extra.id)
      data.set('direction', direction)

      const outcome = await moveExtraAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        toast({ tone: 'negative', title: outcome.message ?? 'That change could not be saved.' })
      }
    })
  }

  return (
    <li className="grid gap-sm py-md first:pt-0 last:pb-0 md:grid-cols-[1fr_auto] md:items-center md:gap-xl">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-sm text-body-md-strong text-foreground">
          {extra.name}
          {extra.bookable ? null : <Badge tone="neutral">Not on the booking form</Badge>}
        </p>
        {extra.description ? (
          <p className="mt-xxs text-body-sm text-copy">{extra.description}</p>
        ) : null}
        <p className="mt-xxs text-caption text-muted-foreground">
          <span className="tabular-nums">BND {formatCents(extra.fee)}</span> per stay ·{' '}
          {stockLine(extra)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-xs">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Move ${extra.name} up`}
          disabled={isPending || isFirst}
          onClick={() => move('up')}
        >
          <ArrowUp aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Move ${extra.name} down`}
          disabled={isPending || isLast}
          onClick={() => move('down')}
        >
          <ArrowDown aria-hidden />
        </Button>
        <Button variant="tertiary" onClick={onEdit} disabled={isPending}>
          Edit
        </Button>
        <Button variant="destructive-tertiary" onClick={onRemove} disabled={isPending}>
          Remove
        </Button>
      </div>
    </li>
  )
}

function RemovedRow({ extra }: { extra: PropertyExtra }) {
  const [isPending, startTransition] = useTransition()

  function restore(): void {
    startTransition(async () => {
      const data = new FormData()

      data.set('extraId', extra.id)

      const outcome = await restoreExtraAction({ status: 'idle' }, data)

      if (outcome.status !== 'done') {
        toast({ tone: 'negative', title: outcome.message ?? 'That extra could not be put back.' })
        return
      }

      // It comes back off the booking form deliberately — the price and the
      // count may both be stale, and putting it straight onto the public form
      // would sell at whatever it cost the day it was removed.
      toast({
        tone: 'positive',
        title: `${extra.name} is back, not on the booking form yet`,
      })
    })
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-md py-md first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-body-md-strong text-foreground">{extra.name}</p>
        <p className="mt-xxs text-caption text-muted-foreground">
          <span className="tabular-nums">BND {formatCents(extra.fee)}</span> per stay when it was
          removed
        </p>
      </div>

      <Button variant="tertiary" onClick={restore} disabled={isPending}>
        {isPending ? 'Putting back…' : 'Put back'}
      </Button>
    </li>
  )
}
